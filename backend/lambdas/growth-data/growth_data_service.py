"""
Unified Growth Data Service - All CRUD operations in a single Lambda handler.
This service handles all growth data related operations:
- POST /growth-data - Create growth data record
- GET /growth-data - List all growth data records
- GET /growth-data/{dataId} - Get single growth data record
- PUT /growth-data/{dataId} - Update growth data record
- DELETE /growth-data/{dataId} - Delete growth data record
- GET /babies/{babyId}/growth - Get growth data records for a baby
"""

import json
import logging
from datetime import datetime

# Direct imports from the layer
from upnest_shared.validation_utils import GrowthDataValidator, generate_id, is_valid_uuid
from upnest_shared.dynamodb_client import get_dynamodb_client
from upnest_shared.jwt_utils import get_jwt_validator, extract_token_from_event
from upnest_shared.response_utils import (
    success_response, bad_request_response, unauthorized_response,
    not_found_response, internal_error_response, handle_lambda_error
)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


@handle_lambda_error
def lambda_handler(event, context):
    """
    Unified handler for all growth data operations.
    Routes requests based on HTTP method and path.
    """

    logger.info(
        f"Growth Data Service - Event: {json.dumps(event, default=str)}")

    # Extract HTTP method and path
    http_method = event.get('httpMethod', '').upper()
    path = event.get('path', '')
    path_parameters = event.get('pathParameters') or {}

    logger.info(f"HTTP Method: {http_method}, Path: {path}")
    logger.info(f"Path Parameters: {path_parameters}")

    # Handle OPTIONS requests for CORS preflight
    if http_method == 'OPTIONS':
        return success_response(message="CORS preflight")

    # Route to appropriate handler based on method and path
    try:
        if http_method == 'POST' and '/growth-data' in path:
            return create_growth_data(event)
        elif http_method == 'GET' and '/babies/' in path and '/growth' in path:
            return get_baby_growth_data(event)
        elif http_method == 'GET' and path_parameters.get('dataId'):
            return get_single_growth_data(event)
        elif http_method == 'GET' and '/growth-data' in path:
            return list_growth_data(event)
        elif http_method == 'PUT' and path_parameters.get('dataId'):
            return update_growth_data(event)
        elif http_method == 'DELETE' and path_parameters.get('dataId'):
            return delete_growth_data(event)
        else:
            logger.warning(f"No handler found for {http_method} {path}")
            return bad_request_response("Invalid endpoint or method")

    except Exception as e:
        logger.error(f"Error in growth data service: {str(e)}", exc_info=True)
        return internal_error_response("Internal server error in growth data service")


def create_growth_data(event):
    """Create a new growth data record."""
    logger.info("Creating new growth data record")

    # Get clients
    dynamodb_client = get_dynamodb_client()
    jwt_validator = get_jwt_validator()

    # Extract and validate JWT token
    token = extract_token_from_event(event)
    if not token:
        return unauthorized_response("Missing Authorization token")

    try:
        decoded_token = jwt_validator.validate_token(token)
        user_id = decoded_token.get('sub')
        if not user_id:
            return unauthorized_response("Invalid token: missing user ID")
    except Exception as e:
        logger.warning(f"Token validation failed: {str(e)}")
        return unauthorized_response("Invalid or expired token")

    # Parse request body
    try:
        body = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError as e:
        return bad_request_response("Invalid JSON in request body")

    # Validate required fields
    validator = GrowthDataValidator()
    validation_result = validator.validate_create_data(body)
    if not validation_result['valid']:
        return bad_request_response(f"Validation error: {validation_result['error']}")

    # Check if baby exists and belongs to user
    baby_id = body['babyId']
    try:
        baby_response = dynamodb_client.get_item(
            TableName='upnest-babies',
            Key={'babyId': {'S': baby_id}}
        )

        if 'Item' not in baby_response:
            return not_found_response("Baby not found")

        baby_user_id = baby_response['Item'].get('userId', {}).get('S')
        if baby_user_id != user_id:
            return unauthorized_response("Baby does not belong to this user")

    except Exception as e:
        logger.error(f"Error checking baby ownership: {str(e)}")
        return internal_error_response("Error validating baby ownership")

    # Create growth data record
    data_id = generate_id()
    current_time = datetime.utcnow().isoformat()

    # Prepare DynamoDB item
    item = {
        'dataId': {'S': data_id},
        'babyId': {'S': baby_id},
        'userId': {'S': user_id},
        'measurementDate': {'S': body['measurementDate']},
        'measurements': {'M': {}},
        'createdAt': {'S': current_time},
        'updatedAt': {'S': current_time}
    }

    # Add measurements
    measurements = body.get('measurements', {})
    for key, value in measurements.items():
        if value is not None:
            item['measurements']['M'][key] = {'N': str(value)}

    # Add optional fields
    if body.get('notes'):
        item['notes'] = {'S': body['notes']}
    if body.get('measurementSource'):
        item['measurementSource'] = {'S': body['measurementSource']}

    try:
        dynamodb_client.put_item(
            TableName='upnest-growth-data',
            Item=item
        )

        # Prepare response data
        response_data = {
            'dataId': data_id,
            'babyId': baby_id,
            'userId': user_id,
            'measurementDate': body['measurementDate'],
            'measurements': measurements,
            'createdAt': current_time,
            'updatedAt': current_time
        }

        if body.get('notes'):
            response_data['notes'] = body['notes']
        if body.get('measurementSource'):
            response_data['measurementSource'] = body['measurementSource']

        logger.info(f"Growth data record created successfully: {data_id}")
        return success_response(response_data, "Growth data record created successfully")

    except Exception as e:
        logger.error(f"Error creating growth data record: {str(e)}")
        return internal_error_response("Error creating growth data record")


def get_baby_growth_data(event):
    """Get growth data records for a specific baby."""
    logger.info("Getting growth data for baby")

    # Get clients
    dynamodb_client = get_dynamodb_client()
    jwt_validator = get_jwt_validator()

    # Extract and validate JWT token
    token = extract_token_from_event(event)
    if not token:
        return unauthorized_response("Missing Authorization token")

    try:
        decoded_token = jwt_validator.validate_token(token)
        user_id = decoded_token.get('sub')
        if not user_id:
            return unauthorized_response("Invalid token: missing user ID")
    except Exception as e:
        logger.warning(f"Token validation failed: {str(e)}")
        return unauthorized_response("Invalid or expired token")

    # Get baby ID from path parameters
    path_parameters = event.get('pathParameters', {})
    baby_id = path_parameters.get('babyId')

    if not baby_id or not is_valid_uuid(baby_id):
        return bad_request_response("Invalid baby ID")

    # Check if baby exists and belongs to user
    try:
        baby_response = dynamodb_client.get_item(
            TableName='upnest-babies',
            Key={'babyId': {'S': baby_id}}
        )

        if 'Item' not in baby_response:
            return not_found_response("Baby not found")

        baby_user_id = baby_response['Item'].get('userId', {}).get('S')
        if baby_user_id != user_id:
            return unauthorized_response("Baby does not belong to this user")

    except Exception as e:
        logger.error(f"Error checking baby ownership: {str(e)}")
        return internal_error_response("Error validating baby ownership")

    # Parse query parameters
    query_params = event.get('queryStringParameters') or {}
    limit = min(int(query_params.get('limit', 50)), 100)
    start_date = query_params.get('startDate')
    end_date = query_params.get('endDate')
    measurement_type = query_params.get('measurementType')

    try:
        # Query growth data records for this baby
        response = dynamodb_client.query(
            TableName='upnest-growth-data',
            IndexName='babyId-measurementDate-index',
            KeyConditionExpression='babyId = :babyId',
            ExpressionAttributeValues={
                ':babyId': {'S': baby_id}
            },
            Limit=limit,
            ScanIndexForward=False  # Most recent first
        )

        records = []
        for item in response.get('Items', []):
            record = {
                'dataId': item.get('dataId', {}).get('S'),
                'babyId': item.get('babyId', {}).get('S'),
                'measurementDate': item.get('measurementDate', {}).get('S'),
                'measurements': {},
                'createdAt': item.get('createdAt', {}).get('S'),
                'updatedAt': item.get('updatedAt', {}).get('S')
            }

            # Parse measurements
            measurements = item.get('measurements', {}).get('M', {})
            for key, value in measurements.items():
                record['measurements'][key] = float(value.get('N', 0))

            # Add optional fields
            if 'notes' in item:
                record['notes'] = item['notes'].get('S')
            if 'measurementSource' in item:
                record['measurementSource'] = item['measurementSource'].get(
                    'S')

            # Apply filters
            if start_date and record['measurementDate'] < start_date:
                continue
            if end_date and record['measurementDate'] > end_date:
                continue
            if measurement_type and measurement_type not in record['measurements']:
                continue

            records.append(record)

        logger.info(
            f"Retrieved {len(records)} growth data records for baby {baby_id}")
        return success_response({
            'records': records,
            'count': len(records),
            'babyId': baby_id
        })

    except Exception as e:
        logger.error(f"Error retrieving growth data: {str(e)}")
        return internal_error_response("Error retrieving growth data records")


def get_single_growth_data(event):
    """Get a single growth data record by ID."""
    logger.info("Getting single growth data record")

    # Get clients
    dynamodb_client = get_dynamodb_client()
    jwt_validator = get_jwt_validator()

    # Extract and validate JWT token
    token = extract_token_from_event(event)
    if not token:
        return unauthorized_response("Missing Authorization token")

    try:
        decoded_token = jwt_validator.validate_token(token)
        user_id = decoded_token.get('sub')
        if not user_id:
            return unauthorized_response("Invalid token: missing user ID")
    except Exception as e:
        logger.warning(f"Token validation failed: {str(e)}")
        return unauthorized_response("Invalid or expired token")

    # Get data ID from path parameters
    path_parameters = event.get('pathParameters', {})
    data_id = path_parameters.get('dataId')

    if not data_id or not is_valid_uuid(data_id):
        return bad_request_response("Invalid data ID")

    try:
        response = dynamodb_client.get_item(
            TableName='upnest-growth-data',
            Key={'dataId': {'S': data_id}}
        )

        if 'Item' not in response:
            return not_found_response("Growth data record not found")

        item = response['Item']

        # Check ownership
        item_user_id = item.get('userId', {}).get('S')
        if item_user_id != user_id:
            return unauthorized_response("Growth data record does not belong to this user")

        # Parse record
        record = {
            'dataId': item.get('dataId', {}).get('S'),
            'babyId': item.get('babyId', {}).get('S'),
            'measurementDate': item.get('measurementDate', {}).get('S'),
            'measurements': {},
            'createdAt': item.get('createdAt', {}).get('S'),
            'updatedAt': item.get('updatedAt', {}).get('S')
        }

        # Parse measurements
        measurements = item.get('measurements', {}).get('M', {})
        for key, value in measurements.items():
            record['measurements'][key] = float(value.get('N', 0))

        # Add optional fields
        if 'notes' in item:
            record['notes'] = item['notes'].get('S')
        if 'measurementSource' in item:
            record['measurementSource'] = item['measurementSource'].get('S')

        logger.info(f"Retrieved growth data record: {data_id}")
        return success_response(record)

    except Exception as e:
        logger.error(f"Error retrieving growth data record: {str(e)}")
        return internal_error_response("Error retrieving growth data record")


def list_growth_data(event):
    """List all growth data records for the authenticated user."""
    logger.info("Listing growth data records")

    # Get clients
    dynamodb_client = get_dynamodb_client()
    jwt_validator = get_jwt_validator()

    # Extract and validate JWT token
    token = extract_token_from_event(event)
    if not token:
        return unauthorized_response("Missing Authorization token")

    try:
        decoded_token = jwt_validator.validate_token(token)
        user_id = decoded_token.get('sub')
        if not user_id:
            return unauthorized_response("Invalid token: missing user ID")
    except Exception as e:
        logger.warning(f"Token validation failed: {str(e)}")
        return unauthorized_response("Invalid or expired token")

    # Parse query parameters
    query_params = event.get('queryStringParameters') or {}
    limit = min(int(query_params.get('limit', 50)), 100)

    try:
        # Query growth data records for this user
        response = dynamodb_client.query(
            TableName='upnest-growth-data',
            IndexName='userId-createdAt-index',
            KeyConditionExpression='userId = :userId',
            ExpressionAttributeValues={
                ':userId': {'S': user_id}
            },
            Limit=limit,
            ScanIndexForward=False  # Most recent first
        )

        records = []
        for item in response.get('Items', []):
            record = {
                'dataId': item.get('dataId', {}).get('S'),
                'babyId': item.get('babyId', {}).get('S'),
                'measurementDate': item.get('measurementDate', {}).get('S'),
                'measurements': {},
                'createdAt': item.get('createdAt', {}).get('S'),
                'updatedAt': item.get('updatedAt', {}).get('S')
            }

            # Parse measurements
            measurements = item.get('measurements', {}).get('M', {})
            for key, value in measurements.items():
                record['measurements'][key] = float(value.get('N', 0))

            # Add optional fields
            if 'notes' in item:
                record['notes'] = item['notes'].get('S')
            if 'measurementSource' in item:
                record['measurementSource'] = item['measurementSource'].get(
                    'S')

            records.append(record)

        logger.info(
            f"Retrieved {len(records)} growth data records for user {user_id}")
        return success_response({
            'records': records,
            'count': len(records)
        })

    except Exception as e:
        logger.error(f"Error listing growth data records: {str(e)}")
        return internal_error_response("Error retrieving growth data records")


def update_growth_data(event):
    """Update an existing growth data record."""
    logger.info("Updating growth data record")

    # Get clients
    dynamodb_client = get_dynamodb_client()
    jwt_validator = get_jwt_validator()

    # Extract and validate JWT token
    token = extract_token_from_event(event)
    if not token:
        return unauthorized_response("Missing Authorization token")

    try:
        decoded_token = jwt_validator.validate_token(token)
        user_id = decoded_token.get('sub')
        if not user_id:
            return unauthorized_response("Invalid token: missing user ID")
    except Exception as e:
        logger.warning(f"Token validation failed: {str(e)}")
        return unauthorized_response("Invalid or expired token")

    # Get data ID from path parameters
    path_parameters = event.get('pathParameters', {})
    data_id = path_parameters.get('dataId')

    if not data_id or not is_valid_uuid(data_id):
        return bad_request_response("Invalid data ID")

    # Parse request body
    try:
        body = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError as e:
        return bad_request_response("Invalid JSON in request body")

    # Validate update data
    validator = GrowthDataValidator()
    validation_result = validator.validate_update_data(body)
    if not validation_result['valid']:
        return bad_request_response(f"Validation error: {validation_result['error']}")

    try:
        # Get existing record
        response = dynamodb_client.get_item(
            TableName='upnest-growth-data',
            Key={'dataId': {'S': data_id}}
        )

        if 'Item' not in response:
            return not_found_response("Growth data record not found")

        item = response['Item']

        # Check ownership
        item_user_id = item.get('userId', {}).get('S')
        if item_user_id != user_id:
            return unauthorized_response("Growth data record does not belong to this user")

        # Prepare update expression
        update_expression = "SET updatedAt = :updatedAt"
        expression_values = {
            ':updatedAt': {'S': datetime.utcnow().isoformat()}
        }

        # Update measurements if provided
        if 'measurements' in body:
            measurements = body['measurements']
            measurements_map = {}
            for key, value in measurements.items():
                if value is not None:
                    measurements_map[key] = {'N': str(value)}

            if measurements_map:
                update_expression += ", measurements = :measurements"
                expression_values[':measurements'] = {'M': measurements_map}

        # Update other fields if provided
        if 'measurementDate' in body:
            update_expression += ", measurementDate = :measurementDate"
            expression_values[':measurementDate'] = {
                'S': body['measurementDate']}

        if 'notes' in body:
            if body['notes']:
                update_expression += ", notes = :notes"
                expression_values[':notes'] = {'S': body['notes']}
            else:
                update_expression += " REMOVE notes"

        if 'measurementSource' in body:
            if body['measurementSource']:
                update_expression += ", measurementSource = :measurementSource"
                expression_values[':measurementSource'] = {
                    'S': body['measurementSource']}
            else:
                update_expression += " REMOVE measurementSource"

        # Perform update
        dynamodb_client.update_item(
            TableName='upnest-growth-data',
            Key={'dataId': {'S': data_id}},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ReturnValues='ALL_NEW'
        )

        logger.info(f"Growth data record updated successfully: {data_id}")
        return success_response({"dataId": data_id}, "Growth data record updated successfully")

    except Exception as e:
        logger.error(f"Error updating growth data record: {str(e)}")
        return internal_error_response("Error updating growth data record")


def delete_growth_data(event):
    """Delete a growth data record."""
    logger.info("Deleting growth data record")

    # Get clients
    dynamodb_client = get_dynamodb_client()
    jwt_validator = get_jwt_validator()

    # Extract and validate JWT token
    token = extract_token_from_event(event)
    if not token:
        return unauthorized_response("Missing Authorization token")

    try:
        decoded_token = jwt_validator.validate_token(token)
        user_id = decoded_token.get('sub')
        if not user_id:
            return unauthorized_response("Invalid token: missing user ID")
    except Exception as e:
        logger.warning(f"Token validation failed: {str(e)}")
        return unauthorized_response("Invalid or expired token")

    # Get data ID from path parameters
    path_parameters = event.get('pathParameters', {})
    data_id = path_parameters.get('dataId')

    if not data_id or not is_valid_uuid(data_id):
        return bad_request_response("Invalid data ID")

    try:
        # Get existing record to check ownership
        response = dynamodb_client.get_item(
            TableName='upnest-growth-data',
            Key={'dataId': {'S': data_id}}
        )

        if 'Item' not in response:
            return not_found_response("Growth data record not found")

        item = response['Item']

        # Check ownership
        item_user_id = item.get('userId', {}).get('S')
        if item_user_id != user_id:
            return unauthorized_response("Growth data record does not belong to this user")

        # Delete the record
        dynamodb_client.delete_item(
            TableName='upnest-growth-data',
            Key={'dataId': {'S': data_id}}
        )

        logger.info(f"Growth data record deleted successfully: {data_id}")
        return success_response({"dataId": data_id}, "Growth data record deleted successfully")

    except Exception as e:
        logger.error(f"Error deleting growth data record: {str(e)}")
        return internal_error_response("Error deleting growth data record")
