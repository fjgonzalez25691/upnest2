"""
Percentiles Layer (no pandas)
- Loads WHO tables (JSON) packaged inside the layer
- Provides both a params API and an API Gateway-style handler
"""

import json
import os
import math
import logging
from datetime import datetime
from importlib import resources
from pathlib import Path

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# ---- In-memory caches ----
_DATA_CACHE: dict[str, list[dict]] = {}          # key: "type_sex" -> list[dict]
_INDEX_BY_DAY_CACHE: dict[str, dict[int, dict]] = {}  # key: "type_sex" -> {day: row}

_DIR_MAP = {
    "headCircumference": "head-circumference",
    "height": "height",
    "weight": "weight",
}

def _sex_prefix(sex: str) -> str:
    return "boys" if sex == "male" else "girls"

def _filename(measurement_type: str, sex: str) -> str:
    if measurement_type == "headCircumference":
        base = f"hcfa-{_sex_prefix(sex)}-zscore-expanded-tables.json"
    elif measurement_type == "height":
        base = f"lhfa-{_sex_prefix(sex)}-zscore-expanded-tables.json"
    elif measurement_type == "weight":
        base = f"wfa-{_sex_prefix(sex)}-zscore-expanded-tables.json"
    else:
        raise ValueError(f"Unsupported measurement type: {measurement_type}")
    return base

def _cache_key(measurement_type: str, sex: str) -> str:
    return f"{measurement_type}_{sex}"


def _open_table_file(measurement_type: str, sex: str):
    """
    Find and open the appropriate growth table file.
    Tries loading from the layer package first (for production),
    then falls back to common local development paths.
    """
    dir_name = _DIR_MAP.get(measurement_type)
    fname = _filename(measurement_type, sex)

    # 1. Try loading from package resources (for deployed Lambda layer)
    try:
        base  = resources.files("percentiles_cal") 
        return (base / "data" / dir_name / fname).open("r", encoding="utf-8")
    except (ModuleNotFoundError, FileNotFoundError):
        logger.debug(f"Could not find {fname} in package resources. Trying local paths.")

    # 2. Fallback to local file system paths for development
    # Path from current working directory
    local_path_from_cwd = Path.cwd() / "scripts" / "percentiles" / "data" / dir_name / fname
    if local_path_from_cwd.exists():
        logger.debug(f"Found local file at: {local_path_from_cwd}")
        return local_path_from_cwd.open("r", encoding="utf-8")

    # Path relative to this file's location
    # Assumes project structure: backend/layers/percentiles_cal/python/percentiles_cal/
    # We go up 5 levels to the project root.
    local_path_from_file = Path(__file__).resolve().parents[5] / "scripts" / "percentiles" / "data" / dir_name / fname
    if local_path_from_file.exists():
        logger.debug(f"Found local file at: {local_path_from_file}")
        return local_path_from_file.open("r", encoding="utf-8")

    raise FileNotFoundError(f"Growth table not found: {dir_name}/{fname}. Looked in package and local paths.")


def _load_records(measurement_type: str, sex: str) -> list[dict]:
    key = _cache_key(measurement_type, sex)
    if key in _DATA_CACHE:
        return _DATA_CACHE[key]

    try:
        with _open_table_file(measurement_type, sex) as f:
            rows = json.load(f)
    except FileNotFoundError as e:
        logger.error(str(e))
        raise

    if not isinstance(rows, list):
        raise ValueError("JSON table must be a list of records")
    # Normalize 'Day' if needed
    for r in rows:
        if "Day" in r and not isinstance(r["Day"], int):
            try:
                r["Day"] = int(round(float(r["Day"])))
            except Exception:
                pass
    _DATA_CACHE[key] = rows
    logger.info(f"Loaded growth table for {measurement_type}/{sex} ({len(rows)} rows)")
    return rows


def _index_by_day(measurement_type: str, sex: str) -> dict[int, dict]:
    key = _cache_key(measurement_type, sex)
    if key in _INDEX_BY_DAY_CACHE:
        return _INDEX_BY_DAY_CACHE[key]
    rows = _load_records(measurement_type, sex)
    idx: dict[int, dict] = {}
    for r in rows:
        d = r.get("Day")
        if isinstance(d, int):
            idx[d] = r
        else:
            try:
                idx[int(round(float(d)))] = r
            except Exception:
                continue
    _INDEX_BY_DAY_CACHE[key] = idx
    return idx

# ---- LMS helpers ----

def get_lms(measurement_type: str, sex: str, age_in_days: int) -> tuple[float, float, float]:
    """Return (L, M, S) for the exact or nearest day."""
    index = _index_by_day(measurement_type, sex)
    if not index:
        raise LookupError("No growth data available")

    if age_in_days in index:
        row = index[age_in_days]
    else:
        nearest = min(index.keys(), key=lambda d: abs(d - age_in_days))
        row = index[nearest]

    try:
        L = float(row["L"]); M = float(row["M"]); S = float(row["S"])
    except Exception as e:
        raise KeyError(f"L/M/S missing or invalid for day={row.get('Day')}") from e
    return L, M, S

def lms_zscore(value: float, L: float, M: float, S: float) -> float:
    if value <= 0 or M <= 0 or S <= 0:
        return float("nan")
    if abs(L) < 1e-12:
        return math.log(value / M) / S
    return ((value / M) ** L - 1.0) / (L * S)

def _phi(x: float) -> float:
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))

def zscore_to_percentile(z: float) -> float:
    if math.isnan(z):
        return float("nan")
    return _phi(z) * 100.0

def _calc_age_in_days(birth_date: str, measurement_date: str) -> int:
    birth = datetime.strptime(birth_date, '%Y-%m-%d')
    meas = datetime.strptime(measurement_date, '%Y-%m-%d')
    if meas < birth:
        raise ValueError("Measurement date cannot be before birth date")
    return (meas - birth).days

# ---- Public API (params) ----

def compute_percentile(measurement_type: str, sex: str, value: float,
                       birth_date: str, measurement_date: str) -> dict:
    """Pure function version (no API Gateway event)."""
    if measurement_type not in ('weight', 'height', 'headCircumference'):
        raise ValueError("measurementType must be 'weight'|'height'|'headCircumference'")
    if sex not in ('male', 'female'):
        raise ValueError("sex must be 'male'|'female'")

    try:
        value_f = float(value)
    except (TypeError, ValueError):
        raise ValueError("Invalid measurement value")
    if value_f <= 0:
        raise ValueError("Measurement value must be positive")

    if measurement_type == 'weight':
        value_f = value_f / 1000.0  # grams -> kg

    age_days = _calc_age_in_days(birth_date, measurement_date)
    L, M, S = get_lms(measurement_type, sex, age_days)
    z = lms_zscore(value_f, L, M, S)
    p = zscore_to_percentile(z)

    return {
        'measurementType': measurement_type,
        'value': float(value),
        'percentile': round(p, 2),
        'zscore': round(z, 4),
        'ageInDays': age_days,
        'sex': sex,
        'LMS': {'L': round(L, 6), 'M': round(M, 6), 'S': round(S, 6)},
        'dates': {'birthDate': birth_date, 'measurementDate': measurement_date}
    }

# ---- API Gateway compatible handler (optional) ----

def _resp(status: int, payload: dict) -> dict:
    return {
        "statusCode": status,
        "body": json.dumps(payload),
        "headers": {"Content-Type": "application/json"}
    }

def calculate_percentile(event, _ctx=None):
    """Drop-in replacement handler if you want to call through API Gateway."""
    logger.info("Calculating growth percentile (Layer)")
    try:
        body = event.get("body")
        if isinstance(body, str):
            body = json.loads(body)
        if not isinstance(body, dict) or not body:
            return _resp(400, {"error": "Request body is required"})
    except json.JSONDecodeError:
        return _resp(400, {"error": "Invalid JSON in request body"})

    try:
        result = compute_percentile(
            measurement_type=body.get('measurementType'),
            sex=body.get('sex'),
            value=body.get('value'),
            birth_date=body.get('birthDate'),
            measurement_date=body.get('measurementDate'),
        )
        return _resp(200, result)
    except ValueError as e:
        return _resp(400, {"error": str(e)})
    except FileNotFoundError:
        return _resp(500, {"error": "Growth data not available"})
    except Exception:
        logger.exception("Unexpected error in percentile calculation")
        return _resp(500, {"error": "Failed to calculate percentile"})


def compute_percentiles(baby: dict, measurement_date: str, measurements: dict) -> dict:
    """
    Adapter compatible with baby_service/growth_data services.
    - baby: requires 'gender' ('male'|'female') and 'dateOfBirth' ('YYYY-MM-DD')
    - measurement_date: 'YYYY-MM-DD'
    - measurements: keys from {'weight','height','headCircumference'}; weight in grams; others in cm.
    Returns: {measurementType: percentile(float)}
    """
    if not baby or not baby.get('gender') or not baby.get('dateOfBirth'):
        raise ValueError("baby must include 'gender' and 'dateOfBirth'")

    result: dict[str, float] = {}
    for mtype, value in (measurements or {}).items():
        if value is None or mtype not in _DIR_MAP:
            continue
        try:
            # Call the singular percentile calculator
            r = compute_percentile(
                measurement_type=mtype,
                sex=baby['gender'],
                value=float(value),  # compute_percentile handles unit conversion (g -> kg)
                birth_date=baby['dateOfBirth'],
                measurement_date=measurement_date,
            )
            p = r.get('percentile')
            if p is not None:
                result[mtype] = float(p)
        except Exception as e:
            logger.warning(f"Could not calculate percentile for {mtype}: {e}")
            
    return result
