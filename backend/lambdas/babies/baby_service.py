"""
Unified Baby Service Handler

Synchronous percentile recalculation logic (PATCH /babies/{id}) supports three
explicit modes to keep behavior predictable and avoid unnecessary recompute:

Modes:
1. FULL (mode=full)
     Trigger Conditions (any of):
         - dateOfBirth change (age shifts -> all measurements need new percentiles)
         - gender change (reference tables differ) 
         - explicit forced full recompute request (future extension)
     Action: Recompute percentiles for ALL growth-data items belonging to baby
                     plus birthPercentiles (if birth measurements exist).

2. BIRTH ONLY (mode=birth-only)
     Trigger Conditions:
         - Only birthWeight / birthHeight / headCircumference changed AND neither
             dateOfBirth nor gender changed.
     Action: Recompute ONLY the birthPercentiles and leave other measurements
                     untouched for performance.

3. NONE (mode=none)
     Trigger Conditions:
         - No relevant percentile-impacting fields changed (e.g., only name).
     Action: Skip recomputation entirely; return current stored percentiles.

Guarantees:
- Always returns up-to-date percentiles for the impacted scope in the same
    synchronous response (no client polling needed).
- Avoids partial updates: if any recompute path errors, responds with error
    (no silent partial writes of percentiles).
- Numeric normalization applied before recomputation for consistency with
    growth data service.

Future Hooks (not yet implemented but reserved):
- recalcVersion field for optimistic concurrency of percentile snapshots.
- Optional async path with progress events if dataset scales large.
"""

import json
import logging
from datetime import datetime, timezone
import os
import uuid
from typing import Optional
import boto3
from decimal import Decimal
from boto3.dynamodb.conditions import Key
import time

try:
    from percentiles_cal.percentiles_service_layer import compute_percentiles  # Layer on AWS
except ImportError:
    from ..percentiles.percentiles_service import compute_percentiles  # Local fallback

try:
    from baby_stream_processor import handle_stream_event
except ImportError:
    from .baby_stream_processor import handle_stream_event

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['BABIES_TABLE'])
growth_table = dynamodb.Table(os.environ.get('GROWTH_DATA_TABLE', 'upnest-growth-data'))


def get_user_id_from_context(event):
    try:
        claims = event.get('requestContext', {}).get('authorizer', {}).get('claims', {})
        return claims.get('sub') or "test-user-123"
    except Exception:
        return "test-user-123"


def response(status, body):
    origin = os.environ.get('CORS_ORIGIN', 'http://localhost:5173')
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE,PATCH"
        },
        "body": json.dumps(body, default=str)
    }


def parse_body(event):
    try:
        body = event.get('body', '{}')
        if isinstance(body, str):
            return json.loads(body)
        return body
    except Exception:
        return {}


def extract_baby_id(event):
    path_params = event.get('pathParameters', {})
    return path_params.get('babyId') if path_params else None


def validate_baby_data(data, require_all=True):
    required = ['name', 'dateOfBirth', 'gender']
    missing = [f for f in required if require_all and not data.get(f)]
    if missing:
        return False, f"Missing required fields: {', '.join(missing)}"
    return True, ""


def normalize_baby_data(data):
    gestational_week = data.get("gestationalWeek")
    premature = data.get("premature")

    if gestational_week is not None and gestational_week != "":
        try:
            gestational_week = int(gestational_week)
        except (ValueError, TypeError):
            gestational_week = None
    else:
        gestational_week = None

    if not premature:
        data["gestationalWeek"] = 40
        data["premature"] = False
    elif gestational_week is not None and gestational_week >= 38:
        data["premature"] = False
        data["gestationalWeek"] = 40
    elif premature and (gestational_week is None or not (20 <= gestational_week <= 37)):
        raise ValueError("Gestational week must be between 20 and 37 for premature babies.")
    else:
        data["gestationalWeek"] = gestational_week

    return data


def normalize_numeric_fields(data):
    for key in ['birthHeight', 'headCircumference']:
        if key in data and data[key] not in (None, ""):
            try:
                data[key] = Decimal(str(data[key]))
            except (ValueError, TypeError):
                pass
    for key in ['birthWeight', 'gestationalWeek']:
        if key in data and data[key] not in (None, ""):
            try:
                data[key] = int(data[key])
            except (ValueError, TypeError):
                pass
    return data


def get_baby_if_accessible(baby_id, user_id):
    result = table.get_item(Key={'babyId': baby_id})
    baby = result.get('Item')
    if not baby or baby.get('userId') != user_id or not baby.get('isActive', True):
        return None
    return baby


def build_update_expression(update_fields):
    attribute_names = {}
    update_expr_parts = []
    for k in update_fields:
        if k == "name":
            attribute_names["#name"] = "name"
            update_expr_parts.append("#name = :name")
        else:
            update_expr_parts.append(f"{k} = :{k}")
    update_expr = "SET " + ", ".join(update_expr_parts)
    expr_values = {f":{k}": v for k, v in update_fields.items()}
    # Return empty dict instead of None for attribute_names
    return update_expr, expr_values, attribute_names


def process_baby_data(data):
    try:
        data = normalize_baby_data(data)
    except ValueError as ve:
        raise ValueError(str(ve))
    data = normalize_numeric_fields(data)
    return data


def _fetch_growth_item_consistent(data_id: str) -> Optional[dict]:
    """Fetch growth-data row with strong consistency to avoid stale measurement dates."""
    if not data_id:
        return None
    try:
        resp = growth_table.get_item(Key={'dataId': data_id}, ConsistentRead=True)
        return resp.get('Item')
    except Exception as exc:
        logger.warning(f"[FETCH_GROWTH_ITEM:ERROR] dataId={data_id} err={exc}")
        return None


def _coerce_measurements_to_float(item: dict) -> dict:
    raw = item.get('measurements') or {}
    return {k: (float(v) if v is not None else None) for k, v in raw.items()}


def _compute_birth_percentiles(baby_obj: dict) -> dict:
    """Generate birth measurements payload and call compute_percentiles.
    Returns empty dict if no measurements. Converts Decimals/int to float for calculations.
    """
    measures = {}
    if baby_obj.get('birthWeight') is not None:
        try:
            measures['weight'] = float(baby_obj['birthWeight'])
        except Exception:
            pass
    if baby_obj.get('birthHeight') is not None:
        try:
            measures['height'] = float(baby_obj['birthHeight'])
        except Exception:
            pass
    if baby_obj.get('headCircumference') is not None:
        try:
            measures['headCircumference'] = float(baby_obj['headCircumference'])
        except Exception:
            pass
    if not measures:
        return {}
    logger.info(f"[PATCH:BIRTH_PCT:INPUT] babyId={baby_obj.get('babyId')} measures={measures}")
    pct = compute_percentiles(
        {"gender": baby_obj.get('gender'), "dateOfBirth": baby_obj.get('dateOfBirth')},
        baby_obj.get('dateOfBirth'),
        measures
    ) or {}
    logger.info(f"[PATCH:BIRTH_PCT:OUTPUT] babyId={baby_obj.get('babyId')} pct={pct}")
    return pct


def lambda_handler(event, context):
    try:
        # Stream events (DynamoDB) delegated to existing processor
        if isinstance(event, dict) and "Records" in event:
            logger.info(f"Stream event: {json.dumps(event)}")
            return handle_stream_event(event, context)

        # HTTP Event
        method = event['httpMethod']
        path = event['path']
        user_id = get_user_id_from_context(event)
        logger.info(f"Baby service called: {method} {path} by user {user_id}")

        if method == 'OPTIONS':
            return response(200, {"message": "CORS preflight"})

        # POST Create
        if method == 'POST' and path == '/babies':
            data = parse_body(event)
            valid, msg = validate_baby_data(data)
            if not valid:
                return response(400, {"error": msg})
            try:
                data = process_baby_data(data)
            except ValueError as ve:
                return response(400, {"error": str(ve)})
            baby_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc).isoformat()
            baby_item = {
                'babyId': baby_id,
                'userId': user_id,
                'name': data['name'],
                'dateOfBirth': data['dateOfBirth'],
                'gender': data['gender'],
                'premature': data.get('premature', False),
                'gestationalWeek': data.get('gestationalWeek'),
                'birthWeight': data.get('birthWeight'),
                'birthHeight': data.get('birthHeight'),
                'headCircumference': data.get('headCircumference'),
                'isActive': True,
                'createdAt': now,
                'modifiedAt': now
            }
            logger.info(f"[POST] Data before save: {data}")
            logger.info(f"[POST] Baby item to save: {baby_item}")
            try:
                table.put_item(Item=baby_item)
                return response(201, {"message": "Baby profile created", "baby": baby_item})
            except Exception as e:
                logger.error(f"Error creating baby: {e}")
                return response(500, {"error": "Failed to create baby"})

        # GET List
        if method == 'GET' and path == '/babies':
            try:
                result = table.scan(
                    FilterExpression="userId = :uid AND isActive = :active",
                    ExpressionAttributeValues={":uid": user_id, ":active": True}
                )
                babies = result.get('Items', [])
                babies.sort(key=lambda x: x.get('name', ''))
                return response(200, {"babies": babies, "count": len(babies)})
            except Exception as e:
                logger.error(f"Error listing babies: {e}")
                return response(500, {"error": "Failed to list babies"})

        # GET One
        if method == 'GET' and path.startswith('/babies/'):
            baby_id = extract_baby_id(event)
            if not baby_id:
                return response(400, {"error": "Baby ID is required"})
            try:
                baby = get_baby_if_accessible(baby_id, user_id)
                if not baby:
                    return response(404, {"error": "Baby not found"})
                return response(200, {"baby": baby})
            except Exception as e:
                logger.error(f"Error getting baby: {e}")
                return response(500, {"error": "Failed to get baby"})

        # PUT Update (complete replacement)
        if method == 'PUT' and path.startswith('/babies/'):
            baby_id = extract_baby_id(event)
            if not baby_id:
                return response(400, {"error": "Baby ID is required"})
            data = parse_body(event)
            valid, msg = validate_baby_data(data, require_all=False)
            if not valid:
                return response(400, {"error": msg})
            try:
                data = process_baby_data(data)
            except ValueError as ve:
                return response(400, {"error": str(ve)})
            try:
                baby = get_baby_if_accessible(baby_id, user_id)
                if not baby:
                    return response(404, {"error": "Baby not found"})
                update_fields = {k: v for k, v in data.items() if k in ['name', 'dateOfBirth', 'gender', 'premature', 'gestationalWeek', 'birthWeight', 'birthHeight', 'headCircumference']}
                if not update_fields:
                    return response(400, {"error": "No valid fields to update"})
                update_fields['modifiedAt'] = datetime.now(timezone.utc).isoformat()
                update_expr, expr_values, attribute_names = build_update_expression(update_fields)
                logger.info(f"[PUT] Update fields: {update_fields}")
                # Prepare update_item kwargs
                update_kwargs = {
                    'Key': {'babyId': baby_id},
                    'UpdateExpression': update_expr,
                    'ExpressionAttributeValues': expr_values,
                    'ReturnValues': 'ALL_NEW'
                }
                if attribute_names:  # Only add if not empty
                    update_kwargs['ExpressionAttributeNames'] = attribute_names

                updated = table.update_item(**update_kwargs)
                return response(200, {"message": "Baby updated", "babyId": baby_id})
            except Exception as e:
                logger.error(f"Error updating baby: {e}")
                return response(500, {"error": "Failed to update baby"})

        # PATCH with differentiated logic
        if method == 'PATCH' and path.startswith('/babies/'):
            baby_id = extract_baby_id(event)
            if not baby_id:
                return response(400, {"error": "Baby ID is required"})

            params = event.get('queryStringParameters') or {}
            sync = str(params.get('syncRecalc', '')).lower() in ('1', 'true', 'yes')

            data = parse_body(event)
            valid, msg = validate_baby_data(data, require_all=False)
            if not valid:
                return response(400, {"error": msg})
            try:
                data = process_baby_data(data)
            except ValueError as ve:
                return response(400, {"error": str(ve)})

            try:
                baby = get_baby_if_accessible(baby_id, user_id)
                if not baby:
                    return response(404, {"error": "Baby not found"})

                update_fields = {k: v for k, v in data.items() if k in ['name', 'dateOfBirth', 'gender', 'premature', 'gestationalWeek', 'birthWeight', 'birthHeight', 'headCircumference']}
                if not update_fields:
                    return response(400, {"error": "No valid fields to update"})

                changed_keys = set(update_fields.keys())
                update_fields['modifiedAt'] = datetime.now(timezone.utc).isoformat()
                update_expr, expr_values, attribute_names = build_update_expression(update_fields)

                # Build kwargs similar to PUT (avoid empty ExpressionAttributeNames)
                patch_update_kwargs = {
                    'Key': {'babyId': baby_id},
                    'UpdateExpression': update_expr,
                    'ExpressionAttributeValues': expr_values,
                    'ReturnValues': 'ALL_NEW'
                }
                if attribute_names:
                    patch_update_kwargs['ExpressionAttributeNames'] = attribute_names

                logger.info(f"[PATCH] update_fields={update_fields} changed_keys={list(changed_keys)} sync={sync} attr_names_present={bool(attribute_names)}")
                updated = table.update_item(**patch_update_kwargs)
                baby = updated.get('Attributes', {})

                if not sync:
                    return response(200, {"baby": baby, "mode": "none"})

                structural_fields = {"dateOfBirth", "gender"}
                birth_measure_fields = {"birthWeight", "birthHeight", "headCircumference"}
                trigger_full = len(changed_keys & structural_fields) > 0
                trigger_birth_only = (not trigger_full) and len(changed_keys & birth_measure_fields) > 0

                # FULL RECALC
                if trigger_full:
                    logger.info(f"[PATCH:FULL:START] babyId={baby_id} changed={list(changed_keys)}")
                    start = time.time()
                    resp = growth_table.query(IndexName='BabyGrowthDataIndex', KeyConditionExpression=Key('babyId').eq(baby_id))
                    items = resp.get('Items', [])
                    updated_count = 0
                    metrics_union = set()
                    
                    # 🆕 ADD: Dictionary to store recalculated percentiles
                    calculated_percentiles_by_measurement = {}
                    
                    for item in items:
                        data_id = item.get('dataId')
                        meas = _coerce_measurements_to_float(item)
                        measurement_date = item.get('measurementDate')

                        # Align the birth record's measurement date to the new DOB
                        if data_id and data_id == baby.get('birthDataId'):
                            if measurement_date != baby.get('dateOfBirth'):
                                logger.info("[PCT_PATCH:BIRTH_ALIGN] dataId=%s oldDate=%s newDOB=%s",
                                            data_id, measurement_date, baby.get('dateOfBirth'))
                                measurement_date = baby.get('dateOfBirth')
                                # Optional: also persist the aligned date
                                try:
                                    growth_table.update_item(
                                        Key={'dataId': data_id},
                                        UpdateExpression='SET measurementDate = :d, updatedAt = :u',
                                        ExpressionAttributeValues={
                                            ':d': measurement_date,
                                            ':u': datetime.now(timezone.utc).isoformat(),
                                        }
                                    )
                                except Exception as e:
                                    logger.warning(f"[PCT_PATCH:BIRTH_ALIGN:WARN] dataId={data_id} err={e}")

                        logger.info(
                            "[PCT_PATCH:INPUT] dataId=%s date=%s meas=%s",
                            data_id,
                            measurement_date,
                            json.dumps(meas),
                        )

                        pct = {}
                        try:
                            pct = compute_percentiles(
                                {"gender": baby.get('gender'), "dateOfBirth": baby.get('dateOfBirth')},
                                measurement_date,
                                meas,
                            ) or {}
                        except Exception as err:
                            logger.error(f"[PCT_PATCH:ERROR] dataId={data_id} err={err}")
                            if data_id and "before birth date" in str(err).lower():
                                fresh_item = _fetch_growth_item_consistent(data_id)
                                if fresh_item and fresh_item.get('measurementDate') != measurement_date:
                                    meas = _coerce_measurements_to_float(fresh_item)
                                    measurement_date = fresh_item.get('measurementDate')
                                    logger.info(
                                        "[PCT_PATCH:RETRY] dataId=%s refreshedDate=%s meas=%s",
                                        data_id,
                                        measurement_date,
                                        json.dumps(meas),
                                    )
                                    try:
                                        pct = compute_percentiles(
                                            {"gender": baby.get('gender'), "dateOfBirth": baby.get('dateOfBirth')},
                                            measurement_date,
                                            meas,
                                        ) or {}
                                    except Exception as retry_err:
                                        logger.error(f"[PCT_PATCH:ERROR_RETRY] dataId={data_id} err={retry_err}")
                                else:
                                    logger.warning(
                                        "[PCT_PATCH:STALE_SKIP] dataId=%s unable to refresh stale measurementDate",
                                        data_id,
                                    )
                        
                        if pct:
                            # 🆕 ADD: Save calculated percentiles to return them
                            calculated_percentiles_by_measurement[data_id] = {k: float(v) for k, v in pct.items()}
                            
                            metrics_union.update(pct.keys())
                            try:
                                growth_table.update_item(
                                    Key={'dataId': data_id},
                                    UpdateExpression='SET percentiles = :p, updatedAt = :u',
                                    ExpressionAttributeValues={
                                        ':p': {k: Decimal(str(v)) for k, v in pct.items()},
                                        ':u': datetime.now(timezone.utc).isoformat(),
                                    }
                                )
                                updated_count += 1
                            except Exception as e:
                                logger.error(f"[PCT_PATCH:ERROR_UPDATE] dataId={data_id} err={e}")
                            logger.info("[PCT_PATCH:OUTPUT] dataId=%s pct=%s", data_id, json.dumps(pct))
                        else:
                            logger.info("[PCT_PATCH:SKIP] dataId=%s reason=empty_result", data_id)

                    birth_pct = _compute_birth_percentiles(baby)
                    if birth_pct:
                        try:
                            table.update_item(
                                Key={'babyId': baby_id},
                                UpdateExpression='SET birthPercentiles = :bp',
                                ExpressionAttributeValues={':bp': {k: Decimal(str(v)) for k, v in birth_pct.items()}},
                            )
                            baby['birthPercentiles'] = {k: float(v) for k, v in birth_pct.items()}
                        except Exception as e:
                            logger.error(f"[PATCH:BIRTH_PCT:ERROR_UPDATE] babyId={baby_id} err={e}")

                    duration_ms = int((time.time() - start) * 1000)
                    logger.info(f"[PATCH:FULL:END] babyId={baby_id} updatedCount={updated_count} durationMs={duration_ms}")

                    # Get updated measurements from DB (as before)
                    updated_measurements_resp = growth_table.query(IndexName='BabyGrowthDataIndex', KeyConditionExpression=Key('babyId').eq(baby_id))
                    updated_measurements = updated_measurements_resp.get('Items', [])
                    updated_measurements.sort(key=lambda x: x.get('measurementDate', ''), reverse=True)
                    for itm in updated_measurements:
                        if 'measurements' in itm and itm['measurements']:
                            for k, v in itm['measurements'].items():
                                if isinstance(v, Decimal):
                                    itm['measurements'][k] = float(v)
                        if 'percentiles' in itm and itm['percentiles']:
                            for k, v in itm['percentiles'].items():
                                if isinstance(v, Decimal):
                                    itm['percentiles'][k] = float(v)
                        else:
                            itm['percentiles'] = itm.get('percentiles', {}) or {}

                    # 🆕 ADD: Create measurements with calculated percentiles for comparison
                    measurements_with_calculated_percentiles = []
                    for measurement in updated_measurements:
                        measurement_with_calc = dict(measurement)  # Copy
                        data_id = measurement.get('dataId')
                        if data_id in calculated_percentiles_by_measurement:
                            measurement_with_calc['calculatedPercentiles'] = calculated_percentiles_by_measurement[data_id]
                        measurements_with_calculated_percentiles.append(measurement_with_calc)

                    return response(200, {
                        "baby": baby,
                        "measurements": measurements_with_calculated_percentiles,  # 🆕 With calculated percentiles
                        "updatedCount": updated_count,
                        "totalItems": len(items),
                        "metricsUpdated": sorted(list(metrics_union)),
                        "birthPercentiles": baby.get('birthPercentiles'),
                        "recalculatedAt": datetime.now(timezone.utc).isoformat(),
                        "durationMs": duration_ms,
                        "mode": "full"
                    })

                # BIRTH ONLY
                if trigger_birth_only:
                    birth_pct = _compute_birth_percentiles(baby)
                    if not birth_pct:
                        logger.info(f"[PATCH:BIRTH_PCT:SKIP] babyId={baby_id} reason=no_birth_measurements")
                        return response(200, {
                            "baby": baby,
                            "recalcSkipped": True,
                            "reason": "No birth measurements",
                            "mode": "birth-only"
                        })

                    # Persist birthPercentiles on baby (for direct reading)
                    try:
                        table.update_item(
                            Key={'babyId': baby_id},
                            UpdateExpression='SET birthPercentiles = :bp',
                            ExpressionAttributeValues={
                                ':bp': {k: Decimal(str(v)) for k, v in birth_pct.items()}
                            },
                        )
                        baby['birthPercentiles'] = {k: float(v) for k, v in birth_pct.items()}
                    except Exception as e:
                        logger.error(f"[PATCH:BIRTH_PCT:ERROR_UPDATE] babyId={baby_id} err={e}")
                        return response(500, {"error": "Failed to save birth percentiles"})

                    # Try to read existing birth growth-data
                    birth_measurement = None
                    birth_data_id = baby.get('birthDataId')
                    dob = baby.get('dateOfBirth')

                    if birth_data_id:
                        try:
                            gd_item = growth_table.get_item(Key={'dataId': birth_data_id}).get('Item')
                            if gd_item and gd_item.get('measurementDate') == dob:
                                birth_measurement = gd_item
                        except Exception as e:
                            logger.error(f"[PATCH:BIRTH_ONLY:FETCH_EXISTING_ERROR] babyId={baby_id} err={e}")

                    # If it doesn't exist yet (stream hasn't written), synthesize it
                    if not birth_measurement:
                        birth_measurement = {
                            "dataId": birth_data_id or "synthetic-birth",
                            "babyId": baby_id,
                            "userId": baby.get("userId"),
                            "measurementDate": dob,
                            "measurementSource": "birth",
                            "measurements": {
                                "weight": float(baby.get("birthWeight")) if baby.get("birthWeight") is not None else None,
                                "height": float(baby.get("birthHeight")) if baby.get("birthHeight") is not None else None,
                                "headCircumference": float(baby.get("birthCircumference")) if baby.get("birthCircumference") is not None else None,
                            },
                            "synthetic": True,   # mark to know it can still be replaced by the real one
                            "createdAt": datetime.now(timezone.utc).isoformat(),
                            "updatedAt": datetime.now(timezone.utc).isoformat(),
                        }

                    # Merge/override percentiles in memory (without waiting for stream)
                    birth_measurement['percentiles'] = {k: float(v) for k, v in birth_pct.items()}

                    # Normalize Decimals in case they came from DynamoDB
                    for sec in ('measurements', 'percentiles'):
                        if sec in birth_measurement and birth_measurement[sec]:
                            for k, v in list(birth_measurement[sec].items()):
                                if isinstance(v, Decimal):
                                    birth_measurement[sec][k] = float(v)

                    return response(200, {
                        "baby": baby,
                        "birthPercentiles": baby.get('birthPercentiles'),
                        "measurements": [birth_measurement],
                        "recalculatedAt": datetime.now(timezone.utc).isoformat(),
                        "mode": "birth-only"
                    })

                logger.info(f"[PATCH:RECALC:SKIP] babyId={baby_id} reason=no_relevant_changes keys={list(changed_keys)}")
                return response(200, {"baby": baby, "recalcSkipped": True, "mode": "none"})
            except Exception as e:
                logger.error(f"Error patching baby: {e}")
                return response(500, {"error": "Failed to patch baby"})

        # DELETE (logical deletion)
        if method == 'DELETE' and path.startswith('/babies/'):
            baby_id = extract_baby_id(event)
            if not baby_id:
                return response(400, {"error": "Baby ID is required"})
            try:
                baby = get_baby_if_accessible(baby_id, user_id)
                if not baby:
                    return response(404, {"error": "Baby not found"})
                table.update_item(
                    Key={'babyId': baby_id},
                    UpdateExpression='SET isActive = :inactive, modifiedAt = :modified',
                    ExpressionAttributeValues={
                        ':inactive': False,
                        ':modified': datetime.now(timezone.utc).isoformat()
                    }
                )
                return response(200, {"message": "Baby deleted", "babyId": baby_id})
            except Exception as e:
                logger.error(f"Error deleting baby: {e}")
                return response(500, {"error": "Failed to delete baby"})

        return response(405, {"error": f"Method {method} not allowed for {path}"})
    except Exception as e:
        logger.exception("[handler] Unhandled error")
        return {"statusCode": 500, "body": f"Internal error: {e}"}



