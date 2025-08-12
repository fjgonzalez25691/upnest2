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
from decimal import Decimal

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Global variables for lazy loading
_data_cache = {}

# --- HTTP Responses ---


def success_response(data=None, message=None):
    return {
        "statusCode": 200,
        "body": json.dumps(data if data is not None else {"message": message}),
        "headers": {"Content-Type": "application/json"}
    }


def bad_request_response(message):
    return {
        "statusCode": 400,
        "body": json.dumps({"error": message}),
        "headers": {"Content-Type": "application/json"}
    }


def unauthorized_response(message):
    return {
        "statusCode": 401,
        "body": json.dumps({"error": message}),
        "headers": {"Content-Type": "application/json"}
    }


def internal_error_response(message):
    return {
        "statusCode": 500,
        "body": json.dumps({"error": message}),
        "headers": {"Content-Type": "application/json"}
    }

# --- Función CDF normal estándar ---


def norm_cdf(z):
    return (1.0 + math.erf(z / math.sqrt(2.0))) / 2.0


def get_data_dir():
    return os.path.join(os.path.dirname(__file__), 'data')


def get_table_info(measurement_type, sex):
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
    return norm_cdf(z) * 100


def calculate_age_in_days(birth_date, measurement_date):
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
    row = df.loc[df['Day'] == age_days]
    if row.empty:
        if age_days < df['Day'].min():
            row = df.loc[df['Day'] == df['Day'].min()]
            logger.warning(
                f"Age {age_days} days is younger than available data. Using minimum age.")
        elif age_days > df['Day'].max():
            row = df.loc[df['Day'] == df['Day'].max()]
            logger.warning(
                f"Age {age_days} days is older than available data. Using maximum age.")
        else:
            idx = (df['Day'] - age_days).abs().idxmin()
            row = df.loc[[idx]]
    L = float(row['L'].iloc[0])
    M = float(row['M'].iloc[0])
    S = float(row['S'].iloc[0])
    return L, M, S


def calculate_percentile(event):
    logger.info("Calculating growth percentile")
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
        if measurement_type not in ['weight', 'height', 'headCircumference']:
            return bad_request_response("measurementType must be 'weight', 'height', or 'headCircumference'")
        if sex not in ['male', 'female']:
            return bad_request_response("sex must be 'male' or 'female'")
        try:
            measurement_value = float(value)
            if measurement_value <= 0:
                return bad_request_response("Measurement value must be positive")
        except (ValueError, TypeError):
            return bad_request_response("Invalid measurement value")
        if measurement_type == 'weight':
            measurement_value = measurement_value / 1000  # Convert grams to kg
        age_days = calculate_age_in_days(birth_date, measurement_date)
        df = load_table(measurement_type, sex)
        L, M, S = find_lms_values(df, age_days)
        zscore = calculate_zscore(measurement_value, L, M, S)
        percentile = zscore_to_percentile(zscore)
        logger.info(
            f"Calculated {measurement_type} percentile: {percentile:.2f}%")
        return success_response({
            'measurementType': measurement_type,
            'value': Decimal(value),
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


