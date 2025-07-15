"""
Input validation utilities for Lambda functions.
Provides standardized validation for request data.
"""

import re
from datetime import datetime, date
from typing import Dict, Any, List, Optional, Union
from uuid import uuid4
import logging

logger = logging.getLogger(__name__)

class ValidationError(Exception):
    """Custom exception for validation errors."""
    
    def __init__(self, message: str, details: Optional[List[str]] = None):
        self.message = message
        self.details = details or []
        super().__init__(self.message)

class Validator:
    """Input validation utilities."""
    
    @staticmethod
    def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> List[str]:
        """
        Validate that all required fields are present.
        
        Args:
            data: Input data dictionary
            required_fields: List of required field names
            
        Returns:
            List of missing fields (empty if all present)
        """
        missing_fields = []
        for field in required_fields:
            if field not in data or data[field] is None or data[field] == '':
                missing_fields.append(field)
        return missing_fields
    
    @staticmethod
    def validate_uuid(value: str, field_name: str = "ID") -> str:
        """
        Validate UUID format.
        
        Args:
            value: UUID string to validate
            field_name: Field name for error messages
            
        Returns:
            Validated UUID string
            
        Raises:
            ValidationError: If UUID is invalid
        """
        if not value:
            raise ValidationError(f"{field_name} is required")
        
        # Simple UUID pattern validation
        uuid_pattern = r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
        if not re.match(uuid_pattern, str(value)):
            raise ValidationError(f"{field_name} must be a valid UUID")
        
        return str(value)
    
    @staticmethod
    def validate_date(value: Union[str, date], field_name: str = "date") -> str:
        """
        Validate date format (YYYY-MM-DD).
        
        Args:
            value: Date string or date object
            field_name: Field name for error messages
            
        Returns:
            Validated date string in YYYY-MM-DD format
            
        Raises:
            ValidationError: If date is invalid
        """
        if not value:
            raise ValidationError(f"{field_name} is required")
        
        if isinstance(value, date):
            return value.strftime('%Y-%m-%d')
        
        try:
            parsed_date = datetime.strptime(str(value), '%Y-%m-%d').date()
            return parsed_date.strftime('%Y-%m-%d')
        except ValueError:
            raise ValidationError(f"{field_name} must be in YYYY-MM-DD format")
    
    @staticmethod
    def validate_gender(value: str) -> str:
        """
        Validate gender field.
        
        Args:
            value: Gender string
            
        Returns:
            Validated gender string
            
        Raises:
            ValidationError: If gender is invalid
        """
        if not value:
            raise ValidationError("Gender is required")
        
        valid_genders = ['male', 'female', 'other']
        gender_lower = str(value).lower()
        
        if gender_lower not in valid_genders:
            raise ValidationError(f"Gender must be one of: {', '.join(valid_genders)}")
        
        return gender_lower
    
    @staticmethod
    def validate_positive_number(value: Union[int, float, str], field_name: str = "number") -> float:
        """
        Validate positive number.
        
        Args:
            value: Number to validate
            field_name: Field name for error messages
            
        Returns:
            Validated number as float
            
        Raises:
            ValidationError: If number is invalid
        """
        try:
            num = float(value)
            if num <= 0:
                raise ValidationError(f"{field_name} must be a positive number")
            return num
        except (ValueError, TypeError):
            raise ValidationError(f"{field_name} must be a valid number")
    
    @staticmethod
    def validate_email(value: str) -> str:
        """
        Validate email format.
        
        Args:
            value: Email string
            
        Returns:
            Validated email string
            
        Raises:
            ValidationError: If email is invalid
        """
        if not value:
            raise ValidationError("Email is required")
        
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, str(value)):
            raise ValidationError("Invalid email format")
        
        return str(value).lower()
    
    @staticmethod
    def validate_string_length(value: str, field_name: str, min_length: int = 1, max_length: int = 255) -> str:
        """
        Validate string length.
        
        Args:
            value: String to validate
            field_name: Field name for error messages
            min_length: Minimum length
            max_length: Maximum length
            
        Returns:
            Validated string
            
        Raises:
            ValidationError: If string length is invalid
        """
        if not value:
            if min_length > 0:
                raise ValidationError(f"{field_name} is required")
            return ""
        
        value_str = str(value).strip()
        length = len(value_str)
        
        if length < min_length:
            raise ValidationError(f"{field_name} must be at least {min_length} characters long")
        
        if length > max_length:
            raise ValidationError(f"{field_name} must be no more than {max_length} characters long")
        
        return value_str

class BabyValidator:
    """Specific validators for baby-related data."""
    
    @staticmethod
    def validate_baby_data(data: Dict[str, Any], is_update: bool = False) -> Dict[str, Any]:
        """
        Validate baby creation/update data.
        
        Args:
            data: Baby data dictionary
            is_update: If True, validation is for update (no required fields)
            
        Returns:
            Validated baby data
            
        Raises:
            ValidationError: If validation fails
        """
        validator = Validator()
        errors = []
        
        # Required fields only for creation, not updates
        if not is_update:
            required_fields = ['name', 'dateOfBirth', 'gender']
            missing_fields = validator.validate_required_fields(data, required_fields)
            if missing_fields:
                errors.append(f"Missing required fields: {', '.join(missing_fields)}")
        
        validated_data = {}
        
        # Validate name (only if present)
        if 'name' in data:
            try:
                validated_data['name'] = validator.validate_string_length(
                    data.get('name', ''), 'Name', min_length=1, max_length=100
                )
            except ValidationError as e:
                errors.append(str(e))
        
        # Validate date of birth (only if present)
        if 'dateOfBirth' in data:
            try:
                validated_data['dateOfBirth'] = validator.validate_date(
                    data.get('dateOfBirth'), 'Date of birth'
                )
                
                # Check if date is not in the future
                birth_date = datetime.strptime(validated_data['dateOfBirth'], '%Y-%m-%d').date()
                if birth_date > date.today():
                    errors.append("Date of birth cannot be in the future")
            except ValidationError as e:
                errors.append(str(e))
        
        # Validate gender (only if present)
        if 'gender' in data:
            try:
                validated_data['gender'] = validator.validate_gender(data.get('gender'))
            except ValidationError as e:
                errors.append(str(e))
        
        # Optional fields
        if 'premature' in data:
            validated_data['premature'] = bool(data['premature'])
        
        if 'gestationalWeek' in data:
            try:
                validated_data['gestationalWeek'] = validator.validate_positive_number(
                    data['gestationalWeek'], 'Gestational week'
                )
                if validated_data['gestationalWeek'] > 42:
                    errors.append("Gestational week cannot be more than 42")
            except ValidationError as e:
                errors.append(str(e))
        
        # Birth measurements (optional)
        for field in ['birthWeight', 'birthHeight']:
            if field in data:
                try:
                    validated_data[field] = validator.validate_positive_number(
                        data[field], field.replace('birth', 'Birth ')
                    )
                except ValidationError as e:
                    errors.append(str(e))
        
        if errors:
            raise ValidationError("Validation failed", errors)
        
        return validated_data

class GrowthDataValidator:
    """Specific validators for growth data."""
    
    @staticmethod
    def validate_measurements(measurements: Dict[str, Any]) -> Dict[str, float]:
        """
        Validate growth measurements.
        
        Args:
            measurements: Dictionary with measurement values
            
        Returns:
            Validated measurements dictionary
            
        Raises:
            ValidationError: If validation fails
        """
        validator = Validator()
        errors = []
        validated_measurements = {}
        
        # Valid measurement types and their reasonable ranges
        measurement_ranges = {
            'weight': (100, 50000),  # 100g to 50kg in grams
            'height': (20, 200),     # 20cm to 200cm
            'headCircumference': (20, 70)  # 20cm to 70cm
        }
        
        for measurement_type, value in measurements.items():
            if measurement_type not in measurement_ranges:
                errors.append(f"Unknown measurement type: {measurement_type}")
                continue
            
            try:
                validated_value = validator.validate_positive_number(value, measurement_type)
                min_val, max_val = measurement_ranges[measurement_type]
                
                if validated_value < min_val or validated_value > max_val:
                    errors.append(
                        f"{measurement_type} must be between {min_val} and {max_val}"
                    )
                else:
                    validated_measurements[measurement_type] = validated_value
                    
            except ValidationError as e:
                errors.append(str(e))
        
        if errors:
            raise ValidationError("Measurement validation failed", errors)
        
        return validated_measurements

def generate_id() -> str:
    """Generate a new UUID for database records."""
    return str(uuid4())


def is_valid_uuid(value: str) -> bool:
    """
    Check if a string is a valid UUID format.
    
    Args:
        value: String to validate
        
    Returns:
        bool: True if valid UUID, False otherwise
    """
    if not value or not isinstance(value, str):
        return False
    
    # Simple UUID pattern validation
    uuid_pattern = r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    return bool(re.match(uuid_pattern, value))
