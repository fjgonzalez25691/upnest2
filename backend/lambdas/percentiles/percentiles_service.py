"""
Unified Percentiles Service - Calculate growth percentiles using WHO/CDC growth charts.
POST /percentiles/calculate - Calculate percentile for measurement
"""

import json
import os
import math
import logging
import pandas as pd
from datetime import datetime
from scipy.stats import norm

# Import from layer
from jwt_utils import get_jwt_validator, extract_token_from_event
from response_utils import (
    success_response, bad_request_response, unauthorized_response,
    internal_error_response, handle_lambda_error
)
from validation_utils import is_valid_uuid

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Global variables for lazy loading
_jwt_validator = None
_data_cache = {}


def get_jwt_validator_cached():
    """Get JWT validator instance with lazy loading."""
    global _jwt_validator
    if _jwt_validator is None:
        _jwt_validator = get_jwt_validator()
    return _jwt_validator


def get_data_dir():
    """Get the data directory path."""
    return os.path.join(os.path.dirname(__file__), 'data')


def get_table_info(measurement_type, sex):
    """
    Get table filename and directory for a measurement type and sex.

    Args:
        measurement_type: 'weight', 'height', or 'headCircumference'
        sex: 'male' or 'female'

    Returns:
        tuple: (directory, filename)
    """
    sex_prefix = 'boys' if sex == 'male' else 'girls'

    table_configs = {
        'weight': {
            'dir': 'weight',
            'filename': f'wfa-{sex_prefix}-zscore-expanded-tables.xlsx'
        },
        'height': {
            'dir': 'height',
            'filename': f'lhfa-{sex_prefix}-zscore-expanded-tables.xlsx'
        },
        'headCircumference': {
            'dir': 'head-circumference',
            'filename': f'hcfa-{sex_prefix}-zscore-expanded-tables.xlsx'
        }
    }

    if measurement_type not in table_configs:
        raise ValueError(f"Unsupported measurement type: {measurement_type}")

    config = table_configs[measurement_type]
    return config['dir'], config['filename']


def load_table(measurement_type, sex):
    """
    Load and cache growth table data.

    Args:
        measurement_type: 'weight', 'height', or 'headCircumference'
        sex: 'male' or 'female'

    Returns:
        pandas.DataFrame: Growth table data
    """
    cache_key = f"{measurement_type}_{sex}"

    if cache_key not in _data_cache:
        try:
            data_dir = get_data_dir()
            table_dir, filename = get_table_info(measurement_type, sex)
            file_path = os.path.join(data_dir, table_dir, filename)

            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Growth table not found: {file_path}")

            _data_cache[cache_key] = pd.read_excel(file_path)
            logger.info(f"Loaded growth table: {filename}")

        except Exception as e:
            logger.error(f"Failed to load growth table {cache_key}: {str(e)}")
            raise

    return _data_cache[cache_key]


def calculate_zscore(value, L, M, S):
    """
    Calculate z-score using LMS method.

    Args:
        value: Measurement value
        L: Lambda (skewness correction)
        M: Median
        S: Coefficient of variation

    Returns:
        float: Z-score
    """
    try:
        if L == 0:
            return math.log(value / M) / S
        else:
            return ((value / M) ** L - 1) / (L * S)
    except (ValueError, ZeroDivisionError) as e:
        logger.error(f"Z-score calculation error: {str(e)}")
        raise ValueError(
            f"Invalid LMS values or measurement: L={L}, M={M}, S={S}, value={value}")


def zscore_to_percentile(z):
    """
    Convert z-score to percentile.

    Args:
        z: Z-score

    Returns:
        float: Percentile (0-100)
    """
    return norm.cdf(z) * 100


def calculate_age_in_days(birth_date, measurement_date):
    """
    Calculate age in days between two dates.

    Args:
        birth_date: Birth date (YYYY-MM-DD)
        measurement_date: Measurement date (YYYY-MM-DD)

    Returns:
        int: Age in days
    """
    try:
        birth = datetime.strptime(birth_date, '%Y-%m-%d')
        measurement = datetime.strptime(measurement_date, '%Y-%m-%d')

        if measurement < birth:
            raise ValueError("Measurement date cannot be before birth date")

        return (measurement - birth).days
    except ValueError as e:
        logger.error(f"Date parsing error: {str(e)}")
        raise ValueError(f"Invalid date format. Use YYYY-MM-DD: {str(e)}")


def find_lms_values(df, age_days):
    """
    Find LMS values for a given age in days.

    Args:
        df: Growth table DataFrame
        age_days: Age in days

    Returns:
        tuple: (L, M, S) values
    """
    # Try to find exact match first
    row = df.loc[df['Day'] == age_days]

    if row.empty:
        # Find the closest age if exact day is not present
        if age_days < df['Day'].min():
            # Use the youngest age available
            row = df.loc[df['Day'] == df['Day'].min()]
            logger.warning(
                f"Age {age_days} days is younger than available data. Using minimum age.")
        elif age_days > df['Day'].max():
            # Use the oldest age available
            row = df.loc[df['Day'] == df['Day'].max()]
            logger.warning(
                f"Age {age_days} days is older than available data. Using maximum age.")
        else:
            # Interpolate between closest values
            idx = (df['Day'] - age_days).abs().idxmin()
            row = df.loc[[idx]]

    L = float(row['L'].iloc[0])
    M = float(row['M'].iloc[0])
    S = float(row['S'].iloc[0])

    return L, M, S


def calculate_percentile(event):
    """
    Calculate growth percentile for a measurement.

    POST /percentiles/calculate

    Expects in body:
    - measurementType: 'weight', 'height', or 'headCircumference'
    - value: measurement value (weight in grams, height/head circumference in cm)
    - birthDate: birth date (YYYY-MM-DD)
    - measurementDate: measurement date (YYYY-MM-DD)
    - sex: 'male' or 'female'

    Returns:
    - percentile: calculated percentile (0-100)
    - zscore: calculated z-score
    - LMS: L, M, S values used
    """
    logger.info("Calculating growth percentile")

    # Get JWT validator using lazy loading
    jwt_validator = get_jwt_validator_cached()

    # Extract and validate JWT token
    token = extract_token_from_event(event)
    if not token:
        logger.warning("Missing Authorization token")
        return unauthorized_response("Missing Authorization token")

    # Validate JWT and extract user info
    try:
        jwt_payload = jwt_validator.validate_token(token)
        if not jwt_payload:
            logger.warning("Invalid JWT token")
            return unauthorized_response("Invalid or expired token")

        user_id = jwt_payload.get('sub')
        if not user_id:
            logger.error("Missing 'sub' claim in JWT token")
            return unauthorized_response("Invalid token: missing user ID")
    except Exception as e:
        logger.warning(f"Token validation failed: {str(e)}")
        return unauthorized_response("Invalid or expired token")

    # Parse request body
    try:
        if isinstance(event.get("body"), str):
            body = json.loads(event["body"])
        else:
            body = event.get("body", {})

        if not body:
            logger.warning("Empty request body")
            return bad_request_response("Request body is required")

    except json.JSONDecodeError as e:
        logger.warning(f"Invalid JSON in request body: {str(e)}")
        return bad_request_response("Invalid JSON in request body")

    # Validate required fields
    try:
        measurement_type = body.get('measurementType')
        value = body.get('value')
        birth_date = body.get('birthDate')
        measurement_date = body.get('measurementDate')
        sex = body.get('sex')

        if not all([measurement_type, value, birth_date, measurement_date, sex]):
            missing_fields = []
            for field, val in [
                ('measurementType', measurement_type),
                ('value', value),
                ('birthDate', birth_date),
                ('measurementDate', measurement_date),
                ('sex', sex)
            ]:
                if not val:
                    missing_fields.append(field)
            return bad_request_response(f"Missing required fields: {', '.join(missing_fields)}")

        # Validate field values
        if measurement_type not in ['weight', 'height', 'headCircumference']:
            return bad_request_response("measurementType must be 'weight', 'height', or 'headCircumference'")

        if sex not in ['male', 'female']:
            return bad_request_response("sex must be 'male' or 'female'")

        # Convert and validate measurement value
        try:
            measurement_value = float(value)
            if measurement_value <= 0:
                return bad_request_response("Measurement value must be positive")
        except (ValueError, TypeError):
            return bad_request_response("Invalid measurement value")

        # Convert weight from grams to kg for calculation
        if measurement_type == 'weight':
            measurement_value = measurement_value / 1000  # Convert grams to kg

        # Calculate age in days
        age_days = calculate_age_in_days(birth_date, measurement_date)

        # Load appropriate growth table
        df = load_table(measurement_type, sex)

        # Find LMS values for the age
        L, M, S = find_lms_values(df, age_days)

        # Calculate z-score and percentile
        zscore = calculate_zscore(measurement_value, L, M, S)
        percentile = zscore_to_percentile(zscore)

        logger.info(
            f"Calculated {measurement_type} percentile for user {user_id}: {percentile:.2f}%")

        return success_response({
            'measurementType': measurement_type,
            # Return original value (e.g., grams for weight)
            'value': float(value),
            'percentile': round(percentile, 2),
            'zscore': round(zscore, 4),
            'ageInDays': age_days,
            'sex': sex,
            'LMS': {
                'L': round(L, 6),
                'M': round(M, 6),
                'S': round(S, 6)
            },
            'dates': {
                'birthDate': birth_date,
                'measurementDate': measurement_date
            }
        })

    except FileNotFoundError as e:
        logger.error(f"Growth table not found: {str(e)}")
        return internal_error_response("Growth data not available")
    except ValueError as e:
        logger.warning(f"Validation error: {str(e)}")
        return bad_request_response(str(e))
    except Exception as e:
        logger.error(f"Unexpected error in percentile calculation: {str(e)}")
        return internal_error_response("Failed to calculate percentile")


@handle_lambda_error
def lambda_handler(event, context):
    """
    Unified handler for percentiles operations.
    Routes requests based on HTTP method and path.
    """

    logger.info(
        f"Percentiles Service - Event: {json.dumps(event, default=str)}")

    # Extract HTTP method and path
    http_method = event.get('httpMethod', '').upper()
    path = event.get('path', '')

    logger.info(f"HTTP Method: {http_method}, Path: {path}")

    # Handle OPTIONS requests for CORS preflight
    if http_method == 'OPTIONS':
        return success_response(message="CORS preflight")

    # Route to appropriate handler based on method and path
    try:
        if http_method == 'POST' and '/percentiles/calculate' in path:
            return calculate_percentile(event)
        else:
            logger.warning(f"No handler found for {http_method} {path}")
            return bad_request_response("Invalid endpoint or method")

    except Exception as e:
        logger.error(f"Error in percentiles service: {str(e)}", exc_info=True)
        return internal_error_response("Internal server error in percentiles service")
