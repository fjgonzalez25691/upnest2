"""
Unified Growth Data Service (single Lambda entry point)

Provides all CRUD operations plus an internal asynchronous recompute path for
percentiles. Designed to minimize cold starts and code duplication.

HTTP Routes (API Gateway shape):
- POST   /growth-data                 -> create
- GET    /growth-data                 -> list (optional ?babyId=... filter)
- GET    /growth-data/{dataId}        -> retrieve single item
- PUT    /growth-data/{dataId}        -> update
- DELETE /growth-data/{dataId}        -> delete

Internal Invocation (no httpMethod present):
- Payload shape: {"dataId": "<uuid>"}
    Used by other Lambdas (e.g. stream processors) to force percentile
    recomputation for one record without going through API Gateway. The absence
    of requestContext/httpMethod is the discriminator.

Percentile Recompute Triggers:
1. Explicit internal invocation with dataId payload.
2. CRUD operations that create or update measurements and set/clear the
     'percentiles' attribute.
3. Downstream processes removing 'percentiles' to mark stale results.

Design Notes:
- Strictly avoids modifying business data during internal recompute; only the
    'percentiles' field (and updatedAt timestamp) is touched.
- Logging is intentionally verbose (INFO + some WARNING banners) while feature
    stabilizes; can be reduced later once telemetry confirms reliability.
"""

import json
import logging
from datetime import datetime, timezone
import os
import uuid
import boto3
from decimal import Decimal

try:
    # Import for aws lambda layer
    from percentiles_cal.percentiles_service_layer import compute_percentiles
except (ImportError, ModuleNotFoundError):
    from ..percentiles.percentiles_service import compute_percentiles  # Fallback if running locally

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
growth_table = dynamodb.Table(os.environ.get('GROWTH_DATA_TABLE', 'upnest-growth-data'))
babies_table = dynamodb.Table(os.environ.get('BABIES_TABLE', 'upnest-babies'))


def get_user_id_from_context(event):
    """Extract user ID from Cognito claims or fallback to test user"""
    try:
        claims = event.get('requestContext', {}).get('authorizer', {}).get('claims', {})
        return claims.get('sub') or "test-user-123"
    except Exception:
        return "test-user-123"


def response(status, body):
    """Standard API response with CORS headers"""
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization"
        },
        "body": json.dumps(body, default=str)
    }


def parse_body(event):
    """Parse request body from event"""
    try:
        body = event.get('body', '{}')
        if isinstance(body, str):
            return json.loads(body)
        return body
    except Exception as e:
        logger.error(f"Error parsing body: {e}")
        return {}


def extract_data_id_from_path(path):
    """Extract dataId from path using proxy+ pattern"""
    # Path format: /growth-data/{dataId}
    parts = path.strip('/').split('/')
    if len(parts) >= 2 and parts[0] == 'growth-data':
        return parts[1] if len(parts) == 2 else None
    return None


def is_valid_uuid(uuid_string):
    """Validate UUID format"""
    try:
        uuid.UUID(str(uuid_string))
        return True
    except (ValueError, TypeError):
        return False


def validate_growth_data(data, require_all=True):
    """Validate growth data payload"""
    if require_all:
        required = ['babyId', 'measurementDate', 'measurements']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return False, f"Missing required fields: {', '.join(missing)}"
    
    # Validate babyId format if provided
    if data.get('babyId') and not is_valid_uuid(data.get('babyId')):
        return False, "Invalid babyId format"
    
    # Validate measurements if provided
    measurements = data.get('measurements', {})
    if require_all and not measurements:
        return False, "Measurements cannot be empty"
    
    # Validate measurement values are numeric
    for key, value in measurements.items():
        if value is not None:
            try:
                float(value)
            except (ValueError, TypeError):
                return False, f"Invalid measurement value for {key}: must be numeric"
    
    return True, ""


def normalize_numeric_fields(data):
    """Convert numeric fields to Decimal for DynamoDB"""
    measurements = data.get('measurements', {})
    normalized_measurements = {}
    
    for key, value in measurements.items():
        if value is not None:
            try:
                normalized_measurements[key] = Decimal(str(value))
            except (ValueError, TypeError):
                logger.warning(f"Could not normalize {key}: {value}")
                continue
        else:
            normalized_measurements[key] = None
    
    data['measurements'] = normalized_measurements
    return data


def get_baby_if_accessible(baby_id, user_id):
    """Check if baby exists and is accessible to the user"""
    try:
        # Usar lectura consistente para DOB/gender tras PATCH
        result = babies_table.get_item(Key={'babyId': baby_id}, ConsistentRead=True)
        baby = result.get('Item')
        if not baby or baby.get('userId') != user_id or not baby.get('isActive', True):
            return None
        return baby
    except Exception as e:
        logger.error(f"Error checking baby access: {e}")
        return None


def create_growth_data(event, user_id):
    logger.warning(f"====Function create_growth_data====")
    try:
        data = json.loads(event['body'])
    except (json.JSONDecodeError, TypeError):
        return response(400, {"error": "Invalid JSON"})

    # Validation
    required_fields = ['babyId', 'measurementDate', 'measurements']
    for field in required_fields:
        if field not in data:
            return response(400, {"error": f"Missing required field: {field}"})

    baby_id = data['babyId']
    measurement_date = data['measurementDate']
    measurements = data['measurements']

    # Validate measurements
    valid_measurements = ['weight', 'height', 'headCircumference']
    if not isinstance(measurements, dict) or not measurements:
        return response(400, {"error": "Measurements must be a non-empty dictionary"})

    for key in measurements:
        if key not in valid_measurements:
            return response(400, {"error": f"Invalid measurement: {key}"})

    # Verify baby exists and belongs to user
    try:
        baby_response = babies_table.get_item(Key={'babyId': baby_id})
        if 'Item' not in baby_response:
            return response(404, {"error": "Baby not found"})
        
        baby = baby_response['Item']
        if baby['userId'] != user_id:
            return response(403, {"error": "Access denied"})
    except Exception as e:
        logger.error(f"Error fetching baby: {e}")
        return response(500, {"error": "Failed to verify baby"})

    # Normalize data
    try:
        data = normalize_numeric_fields(data)
    except Exception as e:
        return response(400, {"error": f"Invalid numeric data: {str(e)}"})

    data_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Calculate percentiles synchronously
    try:
        safe_measures_for_pct = {k: (float(v) if v is not None else None) for k, v in measurements.items()}
        logger.info(
            "[PCT_CREATE:INPUT] babyId=%s dob=%s gender=%s measureDate=%s measures=%s",
            baby_id,
            baby.get('dateOfBirth'),
            baby.get('gender'),
            measurement_date,
            json.dumps(safe_measures_for_pct, default=str),
        )
        percentiles = compute_percentiles(
            {"gender": baby['gender'], "dateOfBirth": baby['dateOfBirth']},
            measurement_date,
            {k: float(v) if v is not None else None for k, v in measurements.items()},
        )
        
        logger.info(
            "[PCT_CREATE:OUTPUT] babyId=%s measureDate=%s percentiles=%s",
            baby_id,
            measurement_date,
            json.dumps(percentiles, default=str),
        )

        # Convert to Decimal for DynamoDB
        percentiles_decimal = {k: Decimal(str(v)) for k, v in percentiles.items()}
    except Exception as e:
        logger.error(f"Error calculating percentiles: {e}")
        return response(500, {"error": "Failed to calculate percentiles"})
    
    growth_item = {
        'dataId': data_id,
        'babyId': data['babyId'],
        'userId': user_id,
        'measurementDate': data['measurementDate'],
        'measurements': data['measurements'],
        'percentiles': percentiles_decimal,  # Add percentiles
        'createdAt': now,
        'updatedAt': now
    }
    
    # Add optional fields
    for field in ['notes', 'measurementSource']:
        if data.get(field):
            growth_item[field] = data[field]

    try:
        growth_table.put_item(Item=growth_item)
        
        # Return response in same format as PUT
        return response(201, {
            "babyId": growth_item.get('babyId'),
            "dataId": growth_item.get('dataId'),
            "measurementDate": growth_item.get('measurementDate'),
            "measurements": growth_item.get('measurements'),
            "percentiles": percentiles,  # Float format for frontend
            "notes": growth_item.get('notes'),
            "measurementSource": growth_item.get('measurementSource'),
            "createdAt": growth_item.get('createdAt'),
            "updatedAt": growth_item.get('updatedAt')
        })
    except Exception as e:
        logger.error(f"Error creating growth data: {e}")
        return response(500, {"error": "Failed to create growth data"})


def get_growth_data_list(event, user_id):

    """Handle GET /growth-data with optional ?babyId filter.

    NOTE: Verbose logging (DEBUG-ish at INFO level) is intentional for early
    stabilization. Once query patterns are confirmed stable we can downgrade
    most of these log lines to DEBUG or remove them.
    """
    logger.warning("==== get_growth_data_list START ====")
    try:
        query_params = event.get('queryStringParameters') or {}
        limit = min(int(query_params.get('limit', 50)), 100)
        # DEBUG: full raw event (may be large). Consider pruning once stable.
        logger.info(f"[debug] full event: {json.dumps(event, default=str)}")
        baby_id = query_params.get('babyId')
        
        # DEBUG: breakdown of query parameters / context
        logger.info("[debug] === growth data query context ===")
        logger.info(f"[debug] query params: {query_params}")
        logger.info(f"[debug] baby_id: '{baby_id}' (type: {type(baby_id)})")
        logger.info(f"[debug] user_id: {user_id}")
        
        if baby_id:
            logger.info("[debug] entering babyId filter branch")
            
            # Filter by specific baby
            if not is_valid_uuid(baby_id):
                logger.error(f"[debug] invalid UUID format: '{baby_id}'")
                return response(400, {"error": "Invalid baby ID format"})
            
            logger.info("[debug] uuid validation passed")
            
            # Check if baby exists and belongs to user
            baby = get_baby_if_accessible(baby_id, user_id)
            if not baby:
                logger.error(f"[debug] baby access denied babyId='{baby_id}' userId='{user_id}'")
                return response(404, {"error": "Baby not found or not accessible"})
            
            logger.info(f"[debug] baby access ok -> executing GSI query for babyId='{baby_id}'")
            
            # Use GSI for better performance
            result = growth_table.query(
                IndexName='BabyGrowthDataIndex',
                KeyConditionExpression='babyId = :babyId',
                ExpressionAttributeValues={':babyId': baby_id},
                Limit=limit,
                ScanIndexForward=False
            )
            growth_data = result.get('Items', [])
            logger.info(f"[debug] gsi query completed items={len(growth_data)}")
            
            # Log each item for debugging
            for i, item in enumerate(growth_data):
                logger.info(f"[debug] item {i+1}: babyId='{item.get('babyId')}' dataId='{item.get('dataId')}'")
                
        else:
            logger.info("[debug] no babyId param -> querying all user data")
            # Get all user's growth data
            result = growth_table.query(
                IndexName='UserGrowthDataIndex',
                KeyConditionExpression='userId = :uid',
                ExpressionAttributeValues={':uid': user_id},
                Limit=limit,
                ScanIndexForward=False
            )
            growth_data = result.get('Items', [])
            logger.info(f"[debug] user-wide query items={len(growth_data)}")
        
        # Sort by measurement date for consistent ordering
        growth_data.sort(key=lambda x: x.get('measurementDate', ''), reverse=True)
        logger.info(f"[debug] final result count={len(growth_data)}")
        return response(200, {"data": growth_data, "count": len(growth_data)})
    except Exception as e:
        logger.error(f"Error listing growth data: {e}")
        return response(500, {"error": "Failed to list growth data"})


def get_growth_data_by_id(data_id, user_id):
    """Handle GET /growth-data/{dataId}"""
    logger.warning(f"====Function get_growth_data_by_id({data_id})====")
    if not data_id or not is_valid_uuid(data_id):
        return response(400, {"error": "Invalid data ID"})

    try:
        result = growth_table.get_item(Key={'dataId': data_id}, ConsistentRead=True)
        growth_data = result.get('Item')
        
        if not growth_data or growth_data.get('userId') != user_id:
            return response(404, {"error": "Growth data not found"})
        
        return response(200, {"data": growth_data})
    except Exception as e:
        logger.error(f"Error getting growth data: {e}")
        return response(500, {"error": "Failed to get growth data"})


def update_growth_data(event, data_id, user_id):
    """Handle PUT /growth-data/{dataId}"""
    logger.info(f"====Function update_growth_data({data_id})====")
    if not data_id or not is_valid_uuid(data_id):
        return response(400, {"error": "Invalid data ID"})

    data = parse_body(event)
    valid, msg = validate_growth_data(data, require_all=False)
    if not valid:
        return response(400, {"error": msg})

    try:
        # Check if growth data exists and belongs to user
        result = growth_table.get_item(Key={'dataId': data_id}, ConsistentRead=True)
        existing_data = result.get('Item')
        
        if not existing_data or existing_data.get('userId') != user_id:
            return response(404, {"error": "Growth data not found"})

        # If babyId is being updated, check if new baby exists and belongs to user
        if 'babyId' in data and data['babyId'] != existing_data.get('babyId'):
            baby = get_baby_if_accessible(data['babyId'], user_id)
            if not baby:
                return response(404, {"error": "Baby not found or not accessible"})

        data = normalize_numeric_fields(data)

        # Determine final values used for percentile calculation
        combined = existing_data.get('measurements', {}).copy()
        if 'measurements' in data:
            combined.update(data['measurements'])
            update_measurements = combined
        else:
            update_measurements = combined

        measurement_date = data.get('measurementDate', existing_data.get('measurementDate'))
        baby_id = data.get('babyId', existing_data.get('babyId'))

        # Fetch baby to compute percentiles
        baby = get_baby_if_accessible(baby_id, user_id)
        if not baby:
            return response(404, {"error": "Baby not found or not accessible"})

        safe_measures_for_pct = {k: (float(v) if v is not None else None) for k, v in update_measurements.items()}
        logger.info(
            "[PCT_UPDATE:INPUT] dataId=%s babyId=%s dob=%s gender=%s measureDate=%s measures=%s",
            data_id,
            baby_id,
            baby.get('dateOfBirth'),
            baby.get('gender'),
            measurement_date,
            json.dumps(safe_measures_for_pct, default=str),
        )

        pct = compute_percentiles(
            {"gender": baby['gender'], "dateOfBirth": baby['dateOfBirth']},
            measurement_date,
            safe_measures_for_pct,
        )

        logger.info(
            "[PCT_UPDATE:OUTPUT] dataId=%s babyId=%s measureDate=%s percentiles=%s",
            data_id,
            baby_id,
            measurement_date,
            json.dumps(pct, default=str),
        )

        update_fields = {'measurements': update_measurements, 'percentiles': {k: Decimal(str(v)) for k, v in pct.items()}, 'updatedAt': datetime.now(timezone.utc).isoformat()}
        for key in ['measurementDate', 'notes', 'measurementSource', 'babyId']:
            if key in data:
                update_fields[key] = data[key]

        update_expr_parts = [f"{k} = :{k}" for k in update_fields]
        expr_values = {f":{k}": v for k, v in update_fields.items()}
        update_expr = "SET " + ", ".join(update_expr_parts)

        updated = growth_table.update_item(
            Key={'dataId': data_id},
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values,
            ReturnValues='ALL_NEW'
        )

        attrs = updated.get('Attributes', {})
        pct_attr = attrs.get('percentiles') or {}
        percentiles = {k: (float(v) if v is not None else None) for k, v in pct_attr.items()}
        return response(200, {
            "babyId": attrs.get('babyId'),
            "dataId": attrs.get('dataId'),
            "measurementDate": attrs.get('measurementDate'),
            "measurements": attrs.get('measurements'),
            "percentiles": percentiles,  # unified as floats
            "updatedAt": attrs.get('updatedAt')
        })
    except Exception as e:
        logger.error(f"Error updating growth data: {e}")
        return response(500, {"error": "Failed to update growth data"})


def delete_growth_data(data_id, user_id):
    """Handle DELETE /growth-data/{dataId}"""
    logger.warning(f"====Function delete_growth_data({data_id})====")
    if not data_id or not is_valid_uuid(data_id):
        return response(400, {"error": "Invalid data ID"})

    try:
        # Check if growth data exists and belongs to user
        result = growth_table.get_item(Key={'dataId': data_id})
        existing_data = result.get('Item')
        
        if not existing_data or existing_data.get('userId') != user_id:
            return response(404, {"error": "Growth data not found"})

        growth_table.delete_item(Key={'dataId': data_id})
        return response(200, {"message": "Growth data deleted", "dataId": data_id})
    except Exception as e:
        logger.error(f"Error deleting growth data: {e}")
        return response(500, {"error": "Failed to delete growth data"})
    
def recompute_percentiles_for_growth_data_id(data_id: str) -> dict:
    """Recompute percentiles for a specific growth data entry.
       used for asynchronous internal invocation from baby_service on baby updates after DOB/gender change.

    Args:
        data_id (str): The ID of the growth data entry.

    Returns:
        dict: The updated percentiles for the growth data entry.
    """
    
    if not data_id:
        logger.error("Missing dataId in asynchronous recompute payload")
        raise ValueError("Missing dataId")
    
    if not is_valid_uuid(data_id):
        logger.warning(f"Non-UUID dataId received for recompute: {data_id}. Proceeding anyway.")
    
    # Fetch the existing growth data
    resp = growth_table.get_item(Key={'dataId': data_id}, ConsistentRead=True)
    item = resp.get('Item')

    if not item:
        logger.error(f"Growth data not found for ID: {data_id}")
        raise ValueError("Growth data not found")
    
    # Get the baby details
    baby_id = item.get('babyId')
    user_id = item.get('userId')
    baby = get_baby_if_accessible(baby_id, user_id)
    if not baby:
        logger.error(f"Baby not found or not accessible for babyId: {baby_id}, userId: {user_id}")
        raise ValueError("Baby not found or not accessible")

    measurements = item.get('measurements', {}) or {}
    safe_measures_for_pct = {
        k: (float(v) if v is not None else None) 
        for k, v in measurements.items()
    }

    logger.info(
        "[INTERNAL_RECALC:INPUT] dataId=%s babyId=%s dob=%s gender=%s measureDate=%s measures=%s",
        data_id,
        baby_id,
        baby.get('dateOfBirth'),
        baby.get('gender'),
        item.get('measurementDate'),
        json.dumps(safe_measures_for_pct, default=str),
    )

    # Si es la medición de nacimiento, usar DOB actual como measurementDate
    if (item.get('dataId') and baby.get('birthDataId') == item['dataId']) or item.get('measurementSource') == 'birth':
        if item.get('measurementDate') != baby.get('dateOfBirth'):
            logger.info("[INTERNAL_RECALC:BIRTH_ALIGN] dataId=%s oldDate=%s newDOB=%s",
                        item['dataId'], item.get('measurementDate'), baby.get('dateOfBirth'))
            item['measurementDate'] = baby.get('dateOfBirth')

    # Compute new percentiles
    pct = compute_percentiles(
        {"gender": baby['gender'], "dateOfBirth": baby['dateOfBirth']},
        item.get('measurementDate'),
        safe_measures_for_pct,
    )

    
    logger.info(
        "[INTERNAL_RECALC:OUTPUT] dataId=%s babyId=%s percentiles=%s",
        data_id,
        baby_id,
        json.dumps(pct, default=str),
    )
    
    # Update the growth data with new percentiles
    growth_table.update_item(
        Key={'dataId': data_id},
        UpdateExpression="SET percentiles = :p, updatedAt = :u",
        ExpressionAttributeValues={
            ":p": {k: Decimal(str(v)) for k, v in pct.items()},
            ":u": datetime.now(timezone.utc).isoformat()
        }
    )

    return  {
        "dataId": data_id,
        "babyId": baby_id,
        "percentiles": pct,
        "recalculated": True
    }


def lambda_handler(event, context):
    """Main Lambda handler:
    - HTTP mode (API Gateway proxy): Use httpMethod/path to route
    - Internal async invocation: payload {"dataId": "xxx"} to recompute percentiles for that growth data entry
    """
    # ------- Internal async invocation route -------
    if isinstance(event, dict) and 'dataId' in event and 'httpMethod' not in event:
        data_id = event['dataId']
        logger.warning(f"[INTERNAL_RECALC:START] dataId={data_id}")
        try:
            result = recompute_percentiles_for_growth_data_id(data_id)
            logger.info(f"[INTERNAL_RECALC:DONE] {json.dumps(result)}")
            return {
                "statusCode": 200,
                "body": json.dumps(result, default=str)
            }
        except ValueError as ve:       
            logger.error(f"[INTERNAL_RECALC:FAIL] {ve}")
            return {
                "statusCode": 404,
                "body": json.dumps({"error": str(ve)})
            }
        except Exception as e:
            logger.exception(f"[INTERNAL_RECALC:ERROR] dataId={data_id} err={e}")
            return {
                "statusCode": 500,
                "body": json.dumps({"error": "Internal recalculation failed"})
            }

    # ----- Existing HTTP route -----

    method = event['httpMethod']
    path = event['path']
    user_id = get_user_id_from_context(event)

    logger.warning(f"Growth Data service: {method} {path} by user {user_id}")

    # Handle CORS preflight
    if method == 'OPTIONS':
        return response(200, {"message": "CORS preflight"})

    # Extract dataId from path for specific operations
    data_id = extract_data_id_from_path(path)
    
    try:
        # Route based on method and path pattern
        if method == 'POST' and path == '/growth-data':
            return create_growth_data(event, user_id)
        
        elif method == 'GET' and path == '/growth-data':
            return get_growth_data_list(event, user_id)
        
        elif method == 'GET' and data_id:
            return get_growth_data_by_id(data_id, user_id)
        
        elif method == 'PUT' and data_id:
            return update_growth_data(event, data_id, user_id)
        
        elif method == 'DELETE' and data_id:
            return delete_growth_data(data_id, user_id)
        
        else:
            return response(405, {"error": f"Method {method} not allowed for {path}"})
            
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return response(500, {"error": "Internal server error"})
