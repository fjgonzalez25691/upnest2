"""
Percentiles Service
Computes growth percentiles from WHO tables using LMS and z-scores.

HTTP (API Gateway) usage:
  Expect JSON body with:
    - measurementType: 'weight' | 'height' | 'headCircumference'
    - value: number  (weight in grams; height/headCircumference in cm)
    - dateOfBirth: 'YYYY-MM-DD'
    - measurementDate: 'YYYY-MM-DD'
    - sex: 'male' | 'female'

Internal usage (from stream_processor):
  - We call calculate_percentile(mock_event) exactly like HTTP; it returns {"statusCode": 200, "body": "..."}.
"""

import json
import os
import math
import logging
from datetime import datetime
from decimal import Decimal
import pandas as pd

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Simple in-memory cache for loaded XLSX data
_DATA_CACHE: dict[str, pd.DataFrame] = {}

# ---------- HTTP helpers ----------
def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def _json(status, payload):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(payload, default=decimal_default)
    }

def _ok(data) -> dict: return _json(200, data)
def _bad(msg: str) -> dict: return _json(400, {"error": msg})
def _err(msg: str) -> dict: return _json(500, {"error": msg})

# ---------- Math helpers ----------
def _norm_cdf(z: float) -> float:
    # Standard normal CDF using error function
    return (1.0 + math.erf(z / math.sqrt(2.0))) / 2.0

def _zscore(value: float, L: float, M: float, S: float) -> float:
    # LMS z-score formula (WHO)
    if S == 0:
        raise ValueError("Invalid S=0 in LMS parameters")
    if L == 0:
        return math.log(value / M) / S
    return ((value / M) ** L - 1) / (L * S)

def _z_to_percentile(z: float) -> float:
    return _norm_cdf(z) * 100.0

# ---------- Data access ----------
def _data_dir() -> str:
    # Excel files under ./data/<type>/<file>.xlsx
    return os.path.join(os.path.dirname(__file__), "data")

def _table_info(measurement_type: str, sex: str) -> tuple[str, str]:
    # Map measurement type + sex to a file path
    sex_prefix = "boys" if sex == "male" else "girls"
    files = {
        "weight": ("weight", f"wfa-{sex_prefix}-zscore-expanded-tables.xlsx"),
        "height": ("height", f"lhfa-{sex_prefix}-zscore-expanded-tables.xlsx"),
        "headCircumference": ("head-circumference", f"hcfa-{sex_prefix}-zscore-expanded-tables.xlsx"),
    }
    if measurement_type not in files:
        raise ValueError(f"Unsupported measurementType: {measurement_type}")
    return files[measurement_type]

def _load_table(measurement_type: str, sex: str) -> pd.DataFrame:
    # Lazy-load & cache the Excel growth table
    key = f"{measurement_type}_{sex}"
    if key not in _DATA_CACHE:
        root = _data_dir()
        subdir, fname = _table_info(measurement_type, sex)
        path = os.path.join(root, subdir, fname)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Growth table not found: {path}")
        _DATA_CACHE[key] = pd.read_excel(path)
    return _DATA_CACHE[key]

def _find_lms_row(df: pd.DataFrame, age_days: int) -> tuple[float, float, float]:
    # Select exact day if possible; otherwise nearest available day
    row = df.loc[df["Day"] == age_days]
    if row.empty:
        idx = (df["Day"] - age_days).abs().idxmin()
        row = df.loc[[idx]]
    L = float(row["L"].iloc[0]); M = float(row["M"].iloc[0]); S = float(row["S"].iloc[0])
    return L, M, S

def _age_in_days(birth_date: str, measurement_date: str) -> int:
    # Validates dates and returns (measurement - birth) in days
    birth = datetime.strptime(birth_date, "%Y-%m-%d")
    meas = datetime.strptime(measurement_date, "%Y-%m-%d")
    if meas < birth:
        raise ValueError("measurementDate cannot be before dateOfBirth")
    return (meas - birth).days

# ---------- Core endpoint ----------
def calculate_percentile(event, _context=None):
    """
    Body JSON:
      measurementType: 'weight'|'height'|'headCircumference'
      value: number (weight in grams; height/headCircumference in cm)
      dateOfBirth: 'YYYY-MM-DD'
      measurementDate: 'YYYY-MM-DD'
      sex: 'male'|'female'
    """
    try:
        body = event["body"] if isinstance(event.get("body"), dict) else json.loads(event.get("body", "{}"))
    except json.JSONDecodeError:
        return _bad("Invalid JSON in body")

    mtype = body.get("measurementType")
    value = body.get("value")
    birth = body.get("dateOfBirth")
    date = body.get("measurementDate")
    sex = body.get("sex")

    # Basic validation
    if not all([mtype, value, birth, date, sex]):
        return _bad("Missing required fields: measurementType, value, dateOfBirth, measurementDate, sex")
    if mtype not in ("weight", "height", "headCircumference"):
        return _bad("measurementType must be 'weight'|'height'|'headCircumference'")
    if sex not in ("male", "female"):
        return _bad("sex must be 'male'|'female'")

    try:
        val = float(value)
        if val <= 0:
            return _bad("value must be > 0")
    except (TypeError, ValueError):
        return _bad("value must be a number")

    # Convert weight grams -> kg; other measures are already in cm
    if mtype == "weight":
        val = val / 1000.0

    try:
        age_days = _age_in_days(birth, date)
        df = _load_table(mtype, sex)
        L, M, S = _find_lms_row(df, age_days)
        z = _zscore(val, L, M, S)
        p = _z_to_percentile(z)
        result = {
            "measurementType": mtype,
            "value": Decimal(str(value)),
            "percentile": round(p, 2),
            "zscore": round(z, 4),
            "ageInDays": age_days,
            "sex": sex,
            "LMS": {"L": round(L, 6), "M": round(M, 6), "S": round(S, 6)},
            "dates": {"dateOfBirth": birth, "measurementDate": date},
        }
        return _ok(result)
    except FileNotFoundError as e:
        logger.exception("Growth data not available")
        return _err(str(e))
    except Exception as e:
        logger.exception("Unexpected error in percentile calculation")
        return _err(f"Failed to calculate percentile: {e}")

# Alias for API Gateway
def lambda_handler(event, context):
    return calculate_percentile(event, context)


def compute_percentiles(baby: dict, measurement_date: str, measurements: dict) -> dict:
    """Pure helper used by other Lambdas to compute percentiles.

    Parameters
    ----------
    baby: dict
        Must contain ``gender`` ('male'|'female') and ``dateOfBirth``.
    measurement_date: str
        ISO date string for the measurement.
    measurements: dict
        Raw measurements in the same units expected by the API
        (weight in grams; height and head circumference in cm).

    Returns
    -------
    dict
        Mapping of measurement type to percentile value. Keys are limited to
        ``weight``, ``height`` and ``headCircumference``.
    """

    percentiles: dict[str, float] = {}
    for mtype, value in (measurements or {}).items():
        if value is None or value <= 0:
            continue
        event = {
            "body": json.dumps(
                {
                    "measurementType": mtype,
                    "value": value,
                    "dateOfBirth": baby.get("dateOfBirth"),
                    "measurementDate": measurement_date,
                    "sex": baby.get("gender"),
                }
            )
        }
        res = calculate_percentile(event, None)
        if isinstance(res, dict) and res.get("statusCode") == 200:
            body = json.loads(res["body"])
            p = body.get("percentile")
            if p is not None:
                percentiles[mtype] = float(p)
    return percentiles

