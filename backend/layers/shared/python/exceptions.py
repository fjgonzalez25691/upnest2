"""
Custom exception classes for UpNest application.
Provides specific error types for better error handling.
"""

class UpNestError(Exception):
    """Base exception for UpNest application."""
    pass

class ValidationError(UpNestError):
    """Raised when data validation fails."""
    
    def __init__(self, message: str, field: str = None, details: list = None):
        super().__init__(message)
        self.field = field
        self.details = details or []

class BabyNotFoundError(UpNestError):
    """Raised when a baby profile is not found."""
    
    def __init__(self, baby_id: str):
        super().__init__(f"Baby with ID {baby_id} not found")
        self.baby_id = baby_id

class UnauthorizedAccessError(UpNestError):
    """Raised when user tries to access resources they don't own."""
    
    def __init__(self, resource_type: str, resource_id: str):
        super().__init__(f"Unauthorized access to {resource_type}: {resource_id}")
        self.resource_type = resource_type
        self.resource_id = resource_id

class GrowthDataError(UpNestError):
    """Raised when growth data operations fail."""
    pass

class PercentileCalculationError(UpNestError):
    """Raised when percentile calculations fail."""
    
    def __init__(self, message: str, measurement_type: str = None):
        super().__init__(message)
        self.measurement_type = measurement_type

class DatabaseError(UpNestError):
    """Raised when database operations fail."""
    
    def __init__(self, message: str, operation: str = None):
        super().__init__(message)
        self.operation = operation

class JWTValidationError(UpNestError):
    """Raised when JWT token validation fails."""
    
    def __init__(self, message: str, token_error: str = None):
        super().__init__(message)
        self.token_error = token_error

# Error mapping for consistent responses
ERROR_RESPONSES = {
    ValidationError: lambda e: {
        'status_code': 400,
        'error': {
            'code': 'VALIDATION_ERROR',
            'message': str(e),
            'field': getattr(e, 'field', None),
            'details': getattr(e, 'details', [])
        }
    },
    BabyNotFoundError: lambda e: {
        'status_code': 404,
        'error': {
            'code': 'BABY_NOT_FOUND',
            'message': str(e),
            'baby_id': e.baby_id
        }
    },
    UnauthorizedAccessError: lambda e: {
        'status_code': 403,
        'error': {
            'code': 'UNAUTHORIZED_ACCESS',
            'message': str(e),
            'resource_type': e.resource_type,
            'resource_id': e.resource_id
        }
    },
    GrowthDataError: lambda e: {
        'status_code': 400,
        'error': {
            'code': 'GROWTH_DATA_ERROR',
            'message': str(e)
        }
    },
    PercentileCalculationError: lambda e: {
        'status_code': 500,
        'error': {
            'code': 'PERCENTILE_CALCULATION_ERROR',
            'message': str(e),
            'measurement_type': getattr(e, 'measurement_type', None)
        }
    },
    DatabaseError: lambda e: {
        'status_code': 500,
        'error': {
            'code': 'DATABASE_ERROR',
            'message': str(e),
            'operation': getattr(e, 'operation', None)
        }
    },
    JWTValidationError: lambda e: {
        'status_code': 401,
        'error': {
            'code': 'JWT_VALIDATION_ERROR',
            'message': str(e),
            'token_error': getattr(e, 'token_error', None)
        }
    }
}
