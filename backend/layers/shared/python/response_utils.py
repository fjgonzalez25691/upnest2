"""
HTTP response utilities for Lambda functions.
Provides standardized response formatting for API Gateway.
"""

import json
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

def create_response(
    status_code: int,
    data: Optional[Any] = None,
    message: Optional[str] = None,
    error: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, str]] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create standardized API Gateway response.
    
    Args:
        status_code: HTTP status code
        data: Response data payload
        message: Success message
        error: Error information
        headers: Additional HTTP headers
        
    Returns:
        API Gateway response format
    """
    # Default headers with CORS - Support multiple origins
    allowed_origins = [
        'https://d1j2f1d7ly5iyk.cloudfront.net',  # Production CloudFront
        'http://localhost:5173',  # Local Vite dev server
        'http://localhost:3000',  # Alternative local port
        'https://localhost:5173'  # HTTPS local
    ]
    
    # For now, allow all origins for development - TODO: Make this more secure
    default_headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',  # Allow all origins for now
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Credentials': 'false'  # Can't use credentials with wildcard origin
    }
    
    if headers:
        default_headers.update(headers)
    
    # Response body
    body = {
        'success': status_code < 400,
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }
    
    if data is not None:
        body['data'] = data
    
    if message:
        body['message'] = message
    
    if error:
        body['error'] = error
    
    if metadata:
        body['metadata'] = metadata
    
    return {
        'statusCode': status_code,
        'headers': default_headers,
        'body': json.dumps(body, default=str)
    }

def success_response(
    data: Optional[Any] = None,
    message: str = "Operation completed successfully",
    status_code: int = 200,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Create success response (200-299)."""
    response_data = {
        'status_code': status_code,
        'data': data,
        'message': message
    }
    
    if metadata:
        response_data['metadata'] = metadata
    
    return create_response(**response_data)


def created_response(
    data: Optional[Any] = None,
    message: str = "Resource created successfully"
) -> Dict[str, Any]:
    """Create resource created response (201)."""
    return create_response(
        status_code=201,
        data=data,
        message=message
    )

def no_content_response(
    message: str = "Operation completed successfully"
) -> Dict[str, Any]:
    """Create no content response (204)."""
    return create_response(
        status_code=204,
        message=message
    )

def bad_request_response(
    message: str = "Bad request",
    details: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Create bad request error response (400)."""
    error = {
        'code': 'BAD_REQUEST',
        'message': message
    }
    if details:
        error['details'] = details
    
    return create_response(
        status_code=400,
        error=error
    )

def unauthorized_response(
    message: str = "Unauthorized access"
) -> Dict[str, Any]:
    """Create unauthorized error response (401)."""
    return create_response(
        status_code=401,
        error={
            'code': 'UNAUTHORIZED',
            'message': message
        }
    )

def forbidden_response(
    message: str = "Access forbidden"
) -> Dict[str, Any]:
    """Create forbidden error response (403)."""
    return create_response(
        status_code=403,
        error={
            'code': 'FORBIDDEN',
            'message': message
        }
    )

def not_found_response(
    message: str = "Resource not found"
) -> Dict[str, Any]:
    """Create not found error response (404)."""
    return create_response(
        status_code=404,
        error={
            'code': 'NOT_FOUND',
            'message': message
        }
    )

def validation_error_response(
    errors: Optional[List[str]] = None,
    message: str = "Validation failed"
) -> Dict[str, Any]:
    """Create validation error response (400)."""
    error = {
        'code': 'VALIDATION_ERROR',
        'message': message
    }
    if errors:
        error['errors'] = errors
    
    return create_response(
        status_code=400,
        error=error
    )

def internal_error_response(
    message: str = "Internal server error",
    error_id: Optional[str] = None
) -> Dict[str, Any]:
    """Create internal server error response (500)."""
    error = {
        'code': 'INTERNAL_ERROR',
        'message': message
    }
    if error_id:
        error['error_id'] = error_id
    
    return create_response(
        status_code=500,
        error=error
    )

def handle_dynamodb_error(error: ClientError) -> Dict[str, Any]:
    """
    Handle DynamoDB specific errors.
    
    Args:
        error: DynamoDB ClientError
        
    Returns:
        Appropriate error response
    """
    error_code = error.response['Error']['Code']
    error_message = error.response['Error']['Message']
    
    if error_code == 'ResourceNotFoundException':
        return not_found_response("Resource not found")
    elif error_code == 'ConditionalCheckFailedException':
        return bad_request_response("Conditional check failed")
    elif error_code == 'ValidationException':
        return validation_error_response(f"DynamoDB validation error: {error_message}")
    elif error_code == 'ProvisionedThroughputExceededException':
        return create_response(
            status_code=429,
            error={
                'code': 'THROTTLED',
                'message': 'Request rate too high, please retry later'
            }
        )
    elif error_code == 'ItemCollectionSizeLimitExceededException':
        return bad_request_response("Item collection size limit exceeded")
    else:
        logger.error(f"Unhandled DynamoDB error: {error_code} - {error_message}")
        return internal_error_response("Database operation failed")

def handle_lambda_error(func):
    """
    Enhanced decorator to handle Lambda function errors gracefully.
    
    Usage:
        @handle_lambda_error
        def lambda_handler(event, context):
            # Your Lambda code here
            pass
    """
    def wrapper(event, context):
        try:
            return func(event, context)
        except ClientError as e:
            logger.error(f"AWS service error: {e}")
            return handle_dynamodb_error(e)
        
        # Handle custom UpNest exceptions
        except Exception as e:
            # Check if it's a custom UpNest exception
            try:
                from exceptions import ERROR_RESPONSES
            except ImportError:
                # If we can't import ERROR_RESPONSES, handle as generic error
                logger.error(f"Unhandled error: {e}")
                return internal_error_response("An error occurred while processing the request")
            
            for exception_type, response_builder in ERROR_RESPONSES.items():
                if isinstance(e, exception_type):
                    logger.error(f"{exception_type.__name__}: {e}")
                    response_data = response_builder(e)
                    return create_response(**response_data)
            
            # Handle standard Python exceptions
            if isinstance(e, ValueError):
                logger.error(f"Validation error: {e}")
                return validation_error_response(str(e))
            elif isinstance(e, PermissionError):
                logger.error(f"Permission error: {e}")
                return forbidden_response(str(e))
            elif isinstance(e, KeyError):
                logger.error(f"Missing required field: {e}")
                return bad_request_response(f"Missing required field: {str(e)}")
            else:
                logger.error(f"Unexpected error: {e}")
                return internal_error_response(
                    "An unexpected error occurred",
                    error_id=context.aws_request_id if context else None
                )
    
    return wrapper
