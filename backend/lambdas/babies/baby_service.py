"""
Unified Baby Service Handler - SIMPLIFIED
Handles ALL CRUD operations for babies in ONE function
POST /babies, GET /babies, GET /babies/{id}, PUT /babies/{id}, DELETE /babies/{id}
"""

import json
import logging
from datetime import datetime, timezone
import os
import uuid
import boto3
from decimal import Decimal
from boto3.dynamodb.types import TypeDeserializer

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['BABIES_TABLE'])


def get_user_id_from_context(event):
    try:
        claims = event.get('requestContext', {}).get(
            'authorizer', {}).get('claims', {})
        return claims.get('sub') or "test-user-123"
    except Exception:
        return "test-user-123"


def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
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
    """
    Ensures consistency between 'premature' and 'gestationalWeek' fields.
    - If not premature, gestationalWeek is set to 40.
    - If gestationalWeek >= 38, premature is set to False and gestationalWeek to 40.
    - If premature, gestationalWeek must be between 20 and 37.
    """
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
    """
    Convert numeric string fields to Decimal (for birthHeight and headCircumference)
    and int (for birthWeight, gestationalWeek) where appropriate.
    DynamoDB requires Decimal for floating point numbers.
    """
    # Convert to Decimal for decimal fields (DynamoDB requirement)
    for key in ['birthHeight', 'headCircumference']:
        if key in data and data[key] not in (None, ""):
            try:
                data[key] = Decimal(str(data[key]))
            except (ValueError, TypeError):
                pass
    # Convert to int for integer fields
    for key in ['birthWeight', 'gestationalWeek']:
        if key in data and data[key] not in (None, ""):
            try:
                data[key] = int(data[key])
            except (ValueError, TypeError):
                pass
    return data


def get_baby_if_accessible(baby_id, user_id):
    """Get baby if it exists and is accessible to the user."""
    result = table.get_item(Key={'babyId': baby_id})
    baby = result.get('Item')
    if not baby or baby.get('userId') != user_id or not baby.get('isActive', True):
        return None
    return baby


def build_update_expression(update_fields):
    """Build DynamoDB update expression handling reserved keywords."""
    attribute_names = {}
    update_expr_parts = []
    
    for k in update_fields:
        if k == "name":  # Reserved keyword
            attribute_names["#name"] = "name"
            update_expr_parts.append("#name = :name")
        else:
            update_expr_parts.append(f"{k} = :{k}")
    
    update_expr = "SET " + ", ".join(update_expr_parts)
    expr_values = {f":{k}": v for k, v in update_fields.items()}
    
    return update_expr, expr_values, attribute_names if attribute_names else None


def process_baby_data(data):
    """Process and normalize baby data for create/update operations."""
    try:
        data = normalize_baby_data(data)
    except ValueError as ve:
        raise ValueError(str(ve))
    
    data = normalize_numeric_fields(data)
    return data


def lambda_handler(event, context):
    # Check if this is a DynamoDB Stream event
    if 'Records' in event and event.get('Records'):
        return handle_stream_event(event, context)
    
    # Handle API Gateway events
    method = event['httpMethod']
    path = event['path']
    user_id = get_user_id_from_context(event)

    logger.info(f"Baby service called: {method} {path} by user {user_id}")

    if method == 'OPTIONS':
        return response(200, {"message": "CORS preflight"})

    # POST /babies
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
            'headCircumference': data.get('headCircumference'),  # Added
            'isActive': True,
            'createdAt': now,
            'modifiedAt': now
        }
        # In POST /babies (right before table.put_item)
        logger.info(f"[POST] Data before save: {data} (types: { {k: type(v).__name__ for k,v in data.items()} })")
        logger.info(f"[POST] Baby item to save: {baby_item} (types: { {k: type(v).__name__ for k,v in baby_item.items()} })")
        try:
            table.put_item(Item=baby_item)
            return response(201, {"message": "Baby profile created", "baby": baby_item})
        except Exception as e:
            logger.error(f"Error creating baby: {e}")
            return response(500, {"error": "Failed to create baby"})

    # GET /babies
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

    # GET /babies/{babyId}
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

    # PUT /babies/{babyId}
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

            update_fields = {k: v for k, v in data.items() if k in [
                'name', 'dateOfBirth', 'gender', 'premature', 'gestationalWeek', 'birthWeight', 'birthHeight', 'headCircumference']}
            if not update_fields:
                return response(400, {"error": "No valid fields to update"})
            
            update_fields['modifiedAt'] = datetime.now(timezone.utc).isoformat()
            update_expr, expr_values, attribute_names = build_update_expression(update_fields)

            # In PUT /babies/{babyId} (right before table.update_item)
            logger.info(f"[PUT] Data before update: {data} (types: { {k: type(v).__name__ for k,v in data.items()} })")
            logger.info(f"[PUT] Update fields: {update_fields} (types: { {k: type(v).__name__ for k,v in update_fields.items()} })")

            table.update_item(
                Key={'babyId': baby_id},
                UpdateExpression=update_expr,
                ExpressionAttributeValues=expr_values,
                ExpressionAttributeNames=attribute_names
            )
            return response(200, {"message": "Baby updated", "babyId": baby_id})
        except Exception as e:
            logger.error(f"Error updating baby: {e}")
            return response(500, {"error": "Failed to update baby"})

    # DELETE /babies/{babyId}
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


# Stream processing functions (from baby_stream_processor.py)
from boto3.dynamodb.types import TypeDeserializer
_deser = TypeDeserializer()

def _unmarshal(image):
    """Convert DynamoDB Stream typed image to plain dict."""
    if not image:
        return {}
    return {k: _deser.deserialize(v) for k, v in image.items()}

def _extract_birth_measurements(baby):
    """Extract birth measurements from baby item."""
    m = dict(baby.get("birthMeasurements") or {})
    candidates = {
        "weight": baby.get("birthWeight"),
        "height": baby.get("birthHeight"),
        "headCircumference": baby.get("headCircumference"),
    }
    for k, v in candidates.items():
        if v is not None and k not in m:
            m[k] = v
    return m

def _normalize_measurements(measurements):
    """Normalize numeric fields to Decimal."""
    out = {}
    for k, v in measurements.items():
        if v is None:
            out[k] = None
            continue
        try:
            out[k] = Decimal(str(float(v)))
        except (ValueError, TypeError):
            logger.warning(f"Ignoring non-numeric {k}={v}")
    return out

def _has_any_value(measurements):
    """True if there is at least one non-None numeric value > 0."""
    for v in measurements.values():
        try:
            if v is None:
                continue
            if float(v) > 0:
                return True
        except (ValueError, TypeError):
            continue
    return False

def handle_stream_event(event, context):
    """Handle DynamoDB Stream events for birth measurement sync."""
    growth_table = dynamodb.Table(os.environ['GROWTH_DATA_TABLE'])
    processed = 0
    
    for rec in event.get("Records", []):
        etype = rec.get("eventName")
        if etype not in ("INSERT", "MODIFY"):
            continue

        new_baby = _unmarshal(rec.get("dynamodb", {}).get("NewImage"))
        if not new_baby:
            continue

        dob = new_baby.get("dateOfBirth")
        if not dob:
            continue

        raw = _extract_birth_measurements(new_baby)
        normalized = _normalize_measurements(raw)

        if _has_any_value(normalized):
            _upsert_birth_growth_item(new_baby, normalized, growth_table)
            processed += 1
        elif new_baby.get("birthDataId"):
            _delete_birth_growth_item(new_baby, growth_table)
            processed += 1

    return {"statusCode": 200, "body": f"processed={processed}"}

def _upsert_birth_growth_item(baby, normalized, growth_table):
    """Create or update GrowthData birth item."""
    baby_id = baby.get("babyId")
    user_id = baby.get("userId")
    dob = baby.get("dateOfBirth")
    if not all([baby_id, user_id, dob]):
        return

    birth_id = baby.get("birthDataId") or str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    item = {
        "dataId": birth_id,
        "babyId": baby_id,
        "userId": user_id,
        "measurementDate": dob,
        "measurements": normalized,
        "measurementSource": "birth",
        "updatedAt": now,
        "createdAt": now
    }

    growth_table.put_item(Item=item)
    
    # Update baby with birth data ID
    table.update_item(
        Key={"babyId": baby_id},
        UpdateExpression="SET birthDataId = if_not_exists(birthDataId, :id)",
        ExpressionAttributeValues={":id": birth_id}
    )

def _delete_birth_growth_item(baby, growth_table):
    """Delete GrowthData birth item and remove pointer."""
    baby_id = baby.get("babyId")
    birth_id = baby.get("birthDataId")
    if not baby_id or not birth_id:
        return
    
    try:
        growth_table.delete_item(Key={"dataId": birth_id})
        table.update_item(
            Key={"babyId": baby_id},
            UpdateExpression="REMOVE birthDataId"
        )
    except Exception as e:
        logger.error(f"Error cleaning up birth data: {e}")
