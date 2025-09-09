"""
Unified Growth Data Service - OPTIMIZED
Handles ALL CRUD operations for growth data in ONE function
Routes:
- POST /growth-data (create)
- GET /growth-data (list all with optional ?babyId=xxx filter)
- GET /growth-data/{dataId} (get specific)
- PUT /growth-data/{dataId} (update)
- DELETE /growth-data/{dataId} (delete)
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
        result = babies_table.get_item(Key={'babyId': baby_id})
        baby = result.get('Item')
        if not baby or baby.get('userId') != user_id or not baby.get('isActive', True):
            return None
        return baby
    except Exception as e:
        logger.error(f"Error checking baby access: {e}")
        return None


def create_growth_data(event, user_id):
    """Handle POST /growth-data"""
    data = parse_body(event)
    valid, msg = validate_growth_data(data)
    if not valid:
        return response(400, {"error": msg})

    # Check if baby exists and belongs to user
    baby = get_baby_if_accessible(data['babyId'], user_id)
    if not baby:
        return response(404, {"error": "Baby not found or not accessible"})

    try:
        data = normalize_numeric_fields(data)
    except Exception as e:
        return response(400, {"error": f"Invalid numeric data: {str(e)}"})

    data_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    growth_item = {
        'dataId': data_id,
        'babyId': data['babyId'],
        'userId': user_id,
        'measurementDate': data['measurementDate'],
        'measurements': data['measurements'],
        'createdAt': now,
        'updatedAt': now
    }
    
    # Add optional fields
    for field in ['notes', 'measurementSource']:
        if data.get(field):
            growth_item[field] = data[field]

    try:
        growth_table.put_item(Item=growth_item)
        return response(201, {"message": "Growth data created", "data": growth_item})
    except Exception as e:
        logger.error(f"Error creating growth data: {e}")
        return response(500, {"error": "Failed to create growth data"})


def get_growth_data_list(event, user_id):
    """Handle GET /growth-data with optional ?babyId filter"""
    try:
        query_params = event.get('queryStringParameters') or {}
        limit = min(int(query_params.get('limit', 50)), 100)
        # DEBUG: Log complete event structure
        logger.info(f"Complete event: {json.dumps(event, default=str)}")
        baby_id = query_params.get('babyId')
        
        # DEBUG: Logging detallado
        logger.info(f"=== DEBUGGING GROWTH DATA QUERY ===")
        logger.info(f"Query params received: {query_params}")
        logger.info(f"Extracted baby_id: '{baby_id}' (type: {type(baby_id)})")
        logger.info(f"User ID: {user_id}")
        
        if baby_id:
            logger.info(f"✓ Entering baby_id filter branch")
            
            # Filter by specific baby
            if not is_valid_uuid(baby_id):
                logger.error(f"✗ UUID validation failed for: '{baby_id}'")
                return response(400, {"error": "Invalid baby ID format"})
            
            logger.info(f"✓ UUID validation passed")
            
            # Check if baby exists and belongs to user
            baby = get_baby_if_accessible(baby_id, user_id)
            if not baby:
                logger.error(f"✗ Baby access check failed for babyId='{baby_id}', userId='{user_id}'")
                return response(404, {"error": "Baby not found or not accessible"})
            
            logger.info(f"✓ Baby access validated. Baby: {baby}")
            logger.info(f"➤ Executing GSI query for babyId: '{baby_id}'")
            
            # Use GSI for better performance
            result = growth_table.query(
                IndexName='BabyGrowthDataIndex',
                KeyConditionExpression='babyId = :babyId',
                ExpressionAttributeValues={':babyId': baby_id},
                Limit=limit,
                ScanIndexForward=False
            )
            growth_data = result.get('Items', [])
            logger.info(f"✓ GSI query completed. Found {len(growth_data)} items")
            
            # Log each item for debugging
            for i, item in enumerate(growth_data):
                logger.info(f"  Item {i+1}: babyId='{item.get('babyId')}', dataId='{item.get('dataId')}'")
                
        else:
            logger.info(f"✗ No baby_id provided, fetching all user data")
            # Get all user's growth data
            result = growth_table.query(
                IndexName='UserGrowthDataIndex',
                KeyConditionExpression='userId = :uid',
                ExpressionAttributeValues={':uid': user_id},
                Limit=limit,
                ScanIndexForward=False
            )
            growth_data = result.get('Items', [])
            logger.info(f"User query returned {len(growth_data)} items")
        
        # Sort by measurement date for consistent ordering
        growth_data.sort(key=lambda x: x.get('measurementDate', ''), reverse=True)
        
        logger.info(f"=== FINAL RESULT: {len(growth_data)} items ===")
        return response(200, {"data": growth_data, "count": len(growth_data)})
    except Exception as e:
        logger.error(f"Error listing growth data: {e}")
        return response(500, {"error": "Failed to list growth data"})


def get_growth_data_by_id(data_id, user_id):
    """Handle GET /growth-data/{dataId}"""
    if not data_id or not is_valid_uuid(data_id):
        return response(400, {"error": "Invalid data ID"})

    try:
        result = growth_table.get_item(Key={'dataId': data_id})
        growth_data = result.get('Item')
        
        if not growth_data or growth_data.get('userId') != user_id:
            return response(404, {"error": "Growth data not found"})
        
        return response(200, {"data": growth_data})
    except Exception as e:
        logger.error(f"Error getting growth data: {e}")
        return response(500, {"error": "Failed to get growth data"})


def update_growth_data(event, data_id, user_id):
    """Handle PUT /growth-data/{dataId}"""
    if not data_id or not is_valid_uuid(data_id):
        return response(400, {"error": "Invalid data ID"})

    data = parse_body(event)
    valid, msg = validate_growth_data(data, require_all=False)
    if not valid:
        return response(400, {"error": msg})

    try:
        # Check if growth data exists and belongs to user
        result = growth_table.get_item(Key={'dataId': data_id})
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

        pct = compute_percentiles(
            {"gender": baby['gender'], "dateOfBirth": baby['dateOfBirth']},
            measurement_date,
            {k: float(v) if v is not None else None for k, v in update_measurements.items()},
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
        return response(200, {
            "babyId": attrs.get('babyId'),
            "dataId": attrs.get('dataId'),
            "measurements": attrs.get('measurements'),
            "percentiles": attrs.get('percentiles'),
            "updatedAt": attrs.get('updatedAt')
        })
    except Exception as e:
        logger.error(f"Error updating growth data: {e}")
        return response(500, {"error": "Failed to update growth data"})


def delete_growth_data(data_id, user_id):
    """Handle DELETE /growth-data/{dataId}"""
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


def lambda_handler(event, context):
    """Main Lambda handler - routes requests based on HTTP method and path"""
    method = event['httpMethod']
    path = event['path']
    user_id = get_user_id_from_context(event)

    logger.info(f"Growth Data service: {method} {path} by user {user_id}")

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