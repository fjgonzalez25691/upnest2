"""
DynamoDB Streams processor for growth measurements.

Behavior:
  - Processes only INSERT/MODIFY.
  - Recomputes percentiles when 'measurements' changed (or on INSERT) or when 'percentiles' is missing.
  - Updates the item with 'percentiles' and 'updatedAt' ONLY if percentiles actually differ,
    to avoid infinite stream loops.

Env vars:
  GROWTH_DATA_TABLE = DynamoDB table name for measurements (PK: dataId)
  BABIES_TABLE      = DynamoDB table name for babies (PK: babyId), must include 'gender' and 'dateOfBirth'
"""

import json
import os
import logging
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

import boto3
from boto3.dynamodb.types import TypeDeserializer

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb")
_deser = TypeDeserializer()

GROWTH_DATA_TABLE = os.environ.get("GROWTH_DATA_TABLE", "upnest-growth-data")
BABIES_TABLE = os.environ.get("BABIES_TABLE", "upnest-babies")

growth_table = dynamodb.Table(GROWTH_DATA_TABLE)
babies_table = dynamodb.Table(BABIES_TABLE)

# ---------- DynamoDB helpers ----------
def _unmarshal(image: dict | None) -> dict:
    """Convert DynamoDB Stream image (typed) into a plain Python dict."""
    if not image:
        return {}
    return {k: _deser.deserialize(v) for k, v in image.items()}

def _round2(x: Decimal | float | None) -> Decimal | None:
    """Quantize to 2 decimal places for stable comparisons."""
    if x is None:
        return None
    return Decimal(str(x)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def _measurements_from(item: dict) -> dict:
    """Extract measurements as floats (weight in grams; height/headCircumference in cm)."""
    m = item.get("measurements") or {}
    def g(key):
        v = m.get(key)
        return float(v) if v is not None else None
    return {
        "weight": g("weight"),
        "height": g("height"),
        "headCircumference": g("headCircumference"),
    }

def _measurements_changed(old_item: dict, new_item: dict) -> bool:
    """Return True if any measurement changed meaningfully."""
    old_m = _measurements_from(old_item)
    new_m = _measurements_from(new_item)
    keys = ("weight", "height", "headCircumference")
    for k in keys:
        if _round2(old_m.get(k)) != _round2(new_m.get(k)):
            return True
    return False

def _percentiles_equal(a: dict | None, b: dict | None) -> bool:
    """Compare percentiles (rounded to 2 decimals) to decide if an update is needed."""
    if not a or not b:
        return False
    keys = ("weight", "height", "headCircumference")
    for k in keys:
        av = a.get(k); bv = b.get(k)
        if av is None or bv is None:
            return False
        if _round2(av) != _round2(bv):
            return False
    return True

# ---------- Domain helpers ----------
def _get_baby(baby_id: str) -> dict | None:
    """Fetch baby record; must contain 'gender' and 'dateOfBirth'."""
    try:
        resp = babies_table.get_item(Key={"babyId": baby_id})
        itm = resp.get("Item")
        if not itm:
            return None
        gender = itm.get("gender")
        # Normalize to 'male'/'female' if needed
        if isinstance(gender, str):
            g = gender.strip().lower()
            if g.startswith("masc"):
                gender = "male"
            elif g.startswith("fem"):
                gender = "female"
        return {"gender": gender, "dateOfBirth": itm.get("dateOfBirth")}
    except Exception:
        logger.exception(f"Failed to read baby {baby_id}")
        return None

def _calc_percentiles(baby: dict, measurement_date: str, measurements: dict) -> dict:
    """
    Call the percentiles service per measurement type and collect results.
    - weight: provided in grams; service converts to kg.
    - height/headCircumference: cm.
    """
    from percentiles_service import calculate_percentile  # local import to reduce cold start

    percentiles: dict[str, float] = {}
    for mtype, value in measurements.items():
        if value is None or value <= 0:
            continue
        mock_event = {
            "body": json.dumps({
                "measurementType": mtype,
                "value": value,
                "dateOfBirth": baby["dateOfBirth"],
                "measurementDate": measurement_date,
                "sex": baby["gender"],
            })
        }
        res = calculate_percentile(mock_event, None)
        if isinstance(res, dict) and res.get("statusCode") == 200:
            body = json.loads(res["body"])
            p = body.get("percentile")
            if p is not None:
                percentiles[mtype] = float(p)
        else:
            logger.warning(f"Percentile calc failed for {mtype}: {res}")
    return percentiles

def _update_item_if_needed(data_id: str, new_percentiles: dict):
    """
    Read current item; update only if percentiles differ.
    This prevents infinite MODIFY loops (because 'updatedAt' won't change unless we really update).
    """
    try:
        current = growth_table.get_item(Key={"dataId": data_id}).get("Item", {})
        existing = current.get("percentiles")

        if _percentiles_equal(existing, new_percentiles):
            logger.info(f"[update] No change in percentiles for {data_id}; skipping write.")
            return

        payload = {k: Decimal(str(v)) for k, v in new_percentiles.items() if v is not None}
        updated_at = datetime.now(timezone.utc).isoformat()

        growth_table.update_item(
            Key={"dataId": data_id},
            UpdateExpression="SET percentiles = :p, updatedAt = :u",
            ExpressionAttributeValues={":p": payload, ":u": updated_at},
            ReturnValues="NONE",
        )
        logger.info(f"[update] Percentiles updated for {data_id}")
    except Exception:
        logger.exception(f"[update] Failed to update item {data_id}")

# ---------- Lambda entry ----------
def lambda_handler(event, context):
    """
    Process DynamoDB Stream records.
    - INSERT: always compute percentiles (if baby & measurements present)
    - MODIFY: compute only if 'measurements' changed OR 'percentiles' is missing
    """
    processed = 0
    errors = 0

    for rec in event.get("Records", []):
        try:
            etype = rec.get("eventName")
            if etype not in ("INSERT", "MODIFY"):
                continue

            new_item = _unmarshal(rec.get("dynamodb", {}).get("NewImage"))
            old_item = _unmarshal(rec.get("dynamodb", {}).get("OldImage"))

            data_id = new_item.get("dataId")
            baby_id = new_item.get("babyId")
            measurement_date = new_item.get("measurementDate")
            if not all([data_id, baby_id, measurement_date]):
                continue

            has_percentiles = "percentiles" in new_item
            needs_calc = (etype == "INSERT") or _measurements_changed(old_item, new_item) or (not has_percentiles)
            if not needs_calc:
                continue

            baby = _get_baby(baby_id)
            if not baby or baby.get("gender") not in ("male", "female") or not baby.get("dateOfBirth"):
                logger.warning(f"Baby missing/invalid for {baby_id}")
                continue

            measurements = _measurements_from(new_item)
            percentiles = _calc_percentiles(baby, measurement_date, measurements)
            if percentiles:
                _update_item_if_needed(data_id, percentiles)
                processed += 1
        except Exception:
            logger.exception("[stream] Record processing error")
            errors += 1

    return {"statusCode": 200, "body": f"processed={processed}, errors={errors}"}
