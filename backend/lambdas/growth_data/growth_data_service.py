"""
Unified Growth Data Service - SIMPLIFIED
Handles ALL CRUD operations for growth data in ONE function
POST /growth-data, GET /growth-data, GET /growth-data/{id}, PUT /growth-data/{id}, DELETE /growth-data/{id}
GET /babies/{babyId}/growth - Get growth data for a specific baby
"""

import json
import logging
from datetime import datetime, timezone
import os
import uuid
import boto3
from decimal import Decimal

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
growth_table = dynamodb.Table(os.environ.get('GROWTH_DATA_TABLE', 'upnest-growth-data'))
babies_table = dynamodb.Table(os.environ.get('BABIES_TABLE', 'upnest-babies'))


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


def extract_path_parameter(event, param_name):
    path_params = event.get('pathParameters', {})
    return path_params.get(param_name) if path_params else None


def is_valid_uuid(uuid_string):
    try:
        uuid.UUID(str(uuid_string))
        return True
    except ValueError:
        return False


def validate_growth_data(data, require_all=True):
    """Validate growth data fields"""
    required = ['babyId', 'measurementDate', 'measurements']
    missing = [f for f in required if require_all and not data.get(f)]
    if missing:
        return False, f"Missing required fields: {', '.join(missing)}"
    
    # Validate babyId format
    if data.get('babyId') and not is_valid_uuid(data.get('babyId')):
        return False, "Invalid babyId format"
    
    # Validate measurements is not empty
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
    """Convert numeric fields to appropriate types for DynamoDB"""
    measurements = data.get('measurements', {})
    normalized_measurements = {}
    
    for key, value in measurements.items():
        if value is not None:
            try:
                normalized_measurements[key] = Decimal(str(value))
            except (ValueError, TypeError):
                pass
    
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


def lambda_handler(event, context):
    method = event['httpMethod']
    path = event['path']
    user_id = get_user_id_from_context(event)

    logger.info(f"Growth Data service called: {method} {path} by user {user_id}")

    if method == 'OPTIONS':
        return response(200, {"message": "CORS preflight"})

    # POST /growth-data
    if method == 'POST' and path == '/growth-data':
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
        if data.get('notes'):
            growth_item['notes'] = data['notes']
        if data.get('measurementSource'):
            growth_item['measurementSource'] = data['measurementSource']

        try:
            growth_table.put_item(Item=growth_item)
            return response(201, {"message": "Growth data created", "data": growth_item})
        except Exception as e:
            logger.error(f"Error creating growth data: {e}")
            return response(500, {"error": "Failed to create growth data"})

    # GET /babies/{babyId}/growth
    if method == 'GET' and '/babies/' in path and '/growth' in path:
        baby_id = extract_path_parameter(event, 'babyId')
        if not baby_id or not is_valid_uuid(baby_id):
            return response(400, {"error": "Invalid baby ID"})

        # Check if baby exists and belongs to user
        baby = get_baby_if_accessible(baby_id, user_id)
        if not baby:
            return response(404, {"error": "Baby not found or not accessible"})

        try:
            # Get query parameters for filtering
            query_params = event.get('queryStringParameters') or {}
            limit = min(int(query_params.get('limit', 50)), 100)
            
            # Query growth data for this baby
            result = growth_table.scan(
                FilterExpression="babyId = :babyId",
                ExpressionAttributeValues={":babyId": baby_id}
            )
            
            growth_data = result.get('Items', [])
            # Sort by measurement date (most recent first)
            growth_data.sort(key=lambda x: x.get('measurementDate', ''), reverse=True)
            
            # Apply limit
            growth_data = growth_data[:limit]
            
            return response(200, {"data": growth_data, "count": len(growth_data)})
        except Exception as e:
            logger.error(f"Error getting baby growth data: {e}")
            return response(500, {"error": "Failed to get growth data"})

    # GET /growth-data/{dataId}
    if method == 'GET' and path.startswith('/growth-data/'):
        data_id = extract_path_parameter(event, 'dataId')
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

    # GET /growth-data (list all for user)
    if method == 'GET' and path == '/growth-data':
        try:
            query_params = event.get('queryStringParameters') or {}
            limit = min(int(query_params.get('limit', 50)), 100)
            
            result = growth_table.scan(
                FilterExpression="userId = :uid",
                ExpressionAttributeValues={":uid": user_id}
            )
            
            growth_data = result.get('Items', [])
            # Sort by creation date (most recent first)
            growth_data.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
            
            # Apply limit
            growth_data = growth_data[:limit]
            
            return response(200, {"data": growth_data, "count": len(growth_data)})
        except Exception as e:
            logger.error(f"Error listing growth data: {e}")
            return response(500, {"error": "Failed to list growth data"})

    # PUT /growth-data/{dataId}
    if method == 'PUT' and path.startswith('/growth-data/'):
        data_id = extract_path_parameter(event, 'dataId')
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
            
            # Prepare update fields
            update_fields = {}
            for key in ['measurementDate', 'measurements', 'notes', 'measurementSource', 'babyId']:
                if key in data:
                    update_fields[key] = data[key]
            
            if not update_fields:
                return response(400, {"error": "No valid fields to update"})
            
            update_fields['updatedAt'] = datetime.now(timezone.utc).isoformat()
            
            # Build update expression
            update_expr_parts = []
            expr_values = {}
            
            for k, v in update_fields.items():
                update_expr_parts.append(f"{k} = :{k}")
                expr_values[f":{k}"] = v
            
            update_expr = "SET " + ", ".join(update_expr_parts)
            
            growth_table.update_item(
                Key={'dataId': data_id},
                UpdateExpression=update_expr,
                ExpressionAttributeValues=expr_values
            )
            
            return response(200, {"message": "Growth data updated", "dataId": data_id})
        except Exception as e:
            logger.error(f"Error updating growth data: {e}")
            return response(500, {"error": "Failed to update growth data"})

    # DELETE /growth-data/{dataId}
    if method == 'DELETE' and path.startswith('/growth-data/'):
        data_id = extract_path_parameter(event, 'dataId')
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

    return response(405, {"error": f"Method {method} not allowed for {path}"})
