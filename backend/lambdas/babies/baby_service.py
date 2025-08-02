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
    Convert numeric string fields to float (for birthHeight and headCircumference)
    and int (for birthWeight, gestationalWeek) where appropriate.
    """
    # Convert to float for decimal fields
    for key in ['birthHeight', 'headCircumference']:
        if key in data and data[key] not in (None, ""):
            try:
                data[key] = float(data[key])
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
