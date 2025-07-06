"""
Unified Baby Service Handler - HACKATHON REFACTOR
Handles ALL CRUD operations for babies in ONE function
POST /babies, GET /babies, GET /babies/{id}, PUT /babies/{id}, DELETE /babies/{id}
"""

import json
import logging
from datetime import datetime
import os
import uuid

# Import directly from the layer
from dynamodb_client import get_dynamodb_client
from jwt_utils import get_jwt_validator, extract_token_from_event
from response_utils import (
    success_response, created_response, bad_request_response,
    unauthorized_response, not_found_response, forbidden_response,
    internal_error_response, method_not_allowed_response, handle_lambda_error
)
from validation_utils import BabyValidator, generate_id, ValidationError

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class BabyService:
    """Unified service for all baby CRUD operations"""

    def __init__(self, event, context):
        """Setup común para TODAS las operaciones - SIN DUPLICACIÓN"""
        self.event = event
        self.context = context
        self.request_id = getattr(context, 'aws_request_id', 'test-request')

        # Authenticate ONCE for all operations
        self.user_id = self._authenticate()

        # Setup DynamoDB ONCE
        self.dynamodb = get_dynamodb_client()
        self.table = self.dynamodb.Table(os.environ['BABIES_TABLE'])

        logger.info(
            f"BabyService initialized for user: {self.user_id}, request: {self.request_id}")

    def _authenticate(self):
        """JWT Authentication - CENTRALIZED, NO DUPLICATION"""
        token = extract_token_from_event(self.event)
        if not token:
            raise ValueError("Authorization token is required")

        try:
            jwt_validator = get_jwt_validator()
            user_id = jwt_validator.extract_user_id(token)
            logger.info(f"Authenticated user: {user_id}")
            return user_id
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            raise ValueError(f"Invalid token: {e}")

    def _get_baby_by_id(self, baby_id):
        """Get baby by ID with ownership validation - COMMON LOGIC"""
        try:
            response = self.table.get_item(Key={'babyId': baby_id})

            if 'Item' not in response:
                return None

            baby = response['Item']

            # Verify ownership
            if baby.get('userId') != self.user_id:
                raise PermissionError(
                    "Access denied: baby belongs to another user")

            # Check if baby is active
            if not baby.get('isActive', True):
                return None

            return baby
        except Exception as e:
            logger.error(f"Error getting baby {baby_id}: {e}")
            raise

    def _extract_baby_id(self):
        """Extract baby ID from path parameters"""
        path_params = self.event.get('pathParameters', {})
        if not path_params:
            return None
        return path_params.get('babyId')

    def _parse_request_body(self):
        """Parse JSON request body"""
        try:
            body = self.event.get('body', '{}')
            if isinstance(body, str):
                return json.loads(body)
            return body
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in request body: {e}")

    # === CRUD OPERATIONS ===

    def create_baby(self):
        """POST /babies - Create new baby"""
        logger.info(f"Creating baby for user: {self.user_id}")

        try:
            # Parse and validate request
            baby_data = self._parse_request_body()
            validator = BabyValidator()
            validated_data = validator.validate_create(baby_data)

            # Create baby record
            baby_id = str(uuid.uuid4())
            now = datetime.utcnow().isoformat()

            baby_item = {
                'babyId': baby_id,
                'userId': self.user_id,
                'name': validated_data['name'],
                'dateOfBirth': validated_data['dateOfBirth'],
                'gender': validated_data['gender'],
                'premature': validated_data.get('premature', False),
                'gestationalWeek': validated_data.get('gestationalWeek'),
                'birthWeight': validated_data.get('birthWeight'),
                'birthHeight': validated_data.get('birthHeight'),
                'isActive': True,
                'createdAt': now,
                'modifiedAt': now
            }

            # Save to DynamoDB
            self.table.put_item(Item=baby_item)

            logger.info(f"Baby created successfully: {baby_id}")
            return created_response(baby_item, "Baby profile created successfully")

        except ValidationError as e:
            return bad_request_response(str(e))
        except Exception as e:
            logger.error(f"Error creating baby: {e}")
            return internal_error_response("Failed to create baby profile")

    def list_babies(self):
        """GET /babies - List all babies for user"""
        logger.info(f"Listing babies for user: {self.user_id}")

        try:
            # Query parameters
            query_params = self.event.get('queryStringParameters') or {}
            limit = min(int(query_params.get('limit', 50)), 100)
            order_by = query_params.get('orderBy', 'name')

            # Query user's babies using GSI
            response = self.table.query(
                IndexName='UserBabiesIndex',
                KeyConditionExpression='userId = :userId',
                FilterExpression='isActive = :active',
                ExpressionAttributeValues={
                    ':userId': self.user_id,
                    ':active': True
                },
                Limit=limit
            )

            babies = response.get('Items', [])

            # Sort results
            if order_by == 'dateOfBirth':
                babies.sort(key=lambda x: x.get('dateOfBirth', ''))
            else:
                babies.sort(key=lambda x: x.get('name', ''))

            metadata = {
                'count': len(babies),
                'limit': limit,
                'orderBy': order_by
            }

            logger.info(f"Found {len(babies)} babies for user {self.user_id}")
            return success_response(babies, metadata)

        except Exception as e:
            logger.error(f"Error listing babies: {e}")
            return internal_error_response("Failed to retrieve babies")

    def get_baby(self):
        """GET /babies/{babyId} - Get specific baby"""
        baby_id = self._extract_baby_id()
        if not baby_id:
            return bad_request_response("Baby ID is required")

        logger.info(f"Getting baby: {baby_id} for user: {self.user_id}")

        try:
            baby = self._get_baby_by_id(baby_id)
            if not baby:
                return not_found_response("Baby not found")

            return success_response(baby)

        except PermissionError:
            return forbidden_response("Access denied")
        except Exception as e:
            logger.error(f"Error getting baby {baby_id}: {e}")
            return internal_error_response("Failed to retrieve baby")

    def update_baby(self):
        """PUT /babies/{babyId} - Update baby"""
        baby_id = self._extract_baby_id()
        if not baby_id:
            return bad_request_response("Baby ID is required")

        logger.info(f"Updating baby: {baby_id} for user: {self.user_id}")

        try:
            # Check baby exists and user owns it
            existing_baby = self._get_baby_by_id(baby_id)
            if not existing_baby:
                return not_found_response("Baby not found")

            # Parse and validate update data
            update_data = self._parse_request_body()
            validator = BabyValidator()
            validated_data = validator.validate_update(update_data)

            # Update fields
            update_expression = "SET modifiedAt = :modified"
            expression_values = {':modified': datetime.utcnow().isoformat()}

            for field, value in validated_data.items():
                update_expression += f", {field} = :{field}"
                expression_values[f":{field}"] = value

            # Update in DynamoDB
            response = self.table.update_item(
                Key={'babyId': baby_id},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_values,
                ReturnValues='ALL_NEW'
            )

            updated_baby = response['Attributes']
            logger.info(f"Baby updated successfully: {baby_id}")
            return success_response(updated_baby, "Baby profile updated successfully")

        except PermissionError:
            return forbidden_response("Access denied")
        except ValidationError as e:
            return bad_request_response(str(e))
        except Exception as e:
            logger.error(f"Error updating baby {baby_id}: {e}")
            return internal_error_response("Failed to update baby")

    def delete_baby(self):
        """DELETE /babies/{babyId} - Soft delete baby"""
        baby_id = self._extract_baby_id()
        if not baby_id:
            return bad_request_response("Baby ID is required")

        logger.info(f"Deleting baby: {baby_id} for user: {self.user_id}")

        try:
            # Check baby exists and user owns it
            existing_baby = self._get_baby_by_id(baby_id)
            if not existing_baby:
                return not_found_response("Baby not found")

            # Soft delete (set isActive = False)
            self.table.update_item(
                Key={'babyId': baby_id},
                UpdateExpression='SET isActive = :inactive, modifiedAt = :modified',
                ExpressionAttributeValues={
                    ':inactive': False,
                    ':modified': datetime.utcnow().isoformat()
                }
            )

            logger.info(f"Baby deleted successfully: {baby_id}")
            return success_response(
                {"babyId": baby_id, "deleted": True},
                "Baby profile deleted successfully"
            )

        except PermissionError:
            return forbidden_response("Access denied")
        except Exception as e:
            logger.error(f"Error deleting baby {baby_id}: {e}")
            return internal_error_response("Failed to delete baby")


@handle_lambda_error
def lambda_handler(event, context):
    """
    UNIFIED HANDLER - Routes ALL baby operations
    Replaces 5 separate Lambda functions with 1
    """
    try:
        method = event['httpMethod']
        path = event['path']

        logger.info(f"Baby service called: {method} {path}")

        # Handle OPTIONS requests for CORS preflight
        if method == 'OPTIONS':
            return success_response(message="CORS preflight")

        # Initialize service ONCE
        service = BabyService(event, context)

        # Route to appropriate operation
        if method == 'POST' and path == '/babies':
            return service.create_baby()
        elif method == 'GET' and path == '/babies':
            return service.list_babies()
        elif method == 'GET' and path.startswith('/babies/'):
            return service.get_baby()
        elif method == 'PUT' and path.startswith('/babies/'):
            return service.update_baby()
        elif method == 'DELETE' and path.startswith('/babies/'):
            return service.delete_baby()
        else:
            return method_not_allowed_response(f"Method {method} not allowed for {path}")

    except ValueError as e:
        # Authentication or validation errors
        return unauthorized_response(str(e))
    except Exception as e:
        logger.error(f"Unexpected error in baby service: {e}")
        return internal_error_response("Internal server error")
