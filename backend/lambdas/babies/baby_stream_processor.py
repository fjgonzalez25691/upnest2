# backend/lambdas/babies/baby_stream_processor.py
"""
Baby Stream Projector (MVP, no layers)

Listens to DynamoDB Stream events from the Babies table and ensures there is a
single "birth" measurement in GrowthData linked via Babies.birthDataId.

Behavior:
- If a baby has dateOfBirth and at least one birth measurement (weight/height/HC),
  upsert GrowthData item at dataId = birthDataId (or create a new UUID if missing),
  with measurementDate = dateOfBirth and measurements normalized to Decimal.
- If birth measurements become empty (no values) and a birthDataId exists,
  delete the GrowthData birth item and remove Babies.birthDataId.
- On DOB or birth measurements change, update GrowthData and REMOVE 'percentiles'
  so the GrowthData stream recomputes with the new age/values.

Env:
  BABIES_TABLE, GROWTH_DATA_TABLE

Notes:
- Measurements units expected: weight in grams; height/headCircumference in cm.
- Percentiles are computed downstream by the GrowthData stream processor, which
  recalculates on INSERT, when measurements change, or when 'percentiles' is missing.
"""

import os
import uuid
import logging
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from boto3.dynamodb.types import TypeDeserializer

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb")
ddb_client = boto3.client("dynamodb")
_deser = TypeDeserializer()

BABIES_TABLE = os.environ.get("BABIES_TABLE", "upnest-babies")
GROWTH_DATA_TABLE = os.environ.get("GROWTH_DATA_TABLE", "upnest-growth-data")

babies_table = dynamodb.Table(BABIES_TABLE)
growth_table = dynamodb.Table(GROWTH_DATA_TABLE)

# ---------- Dynamo helpers ----------

def _unmarshal(image: dict | None) -> dict:
    """Convert DynamoDB Stream typed image to plain dict."""
    if not image:
        return {}
    return {k: _deser.deserialize(v) for k, v in image.items()}

# ---------- Domain helpers ----------

NUMERIC_KEYS = ("weight", "height", "headCircumference")

def _extract_birth_measurements(baby: dict) -> dict:
    """
    Extract birth measurements from the baby item.
    Supports either a nested map 'birthMeasurements' or flattened fields.
    """
    m = dict(baby.get("birthMeasurements") or {})
    # Fallback flattened names (optional, adjust if your schema differs)
    candidates = {
        "weight": baby.get("birthWeight"),
        "height": baby.get("birthHeight"),
        "headCircumference": baby.get("birthHeadCircumference"),
    }
    for k, v in candidates.items():
        if v is not None and k not in m:
            m[k] = v
    return m

def _normalize_numeric_fields(measurements: dict) -> dict:
    """
    Normalize numeric fields to Decimal (like growth_data_service).
    Keeps only provided keys; if a key is provided with None, store None.
    Non-numeric values are ignored.
    """
    out: dict[str, Decimal | None] = {}
    for k, v in measurements.items():
        if v is None:
            out[k] = None
            continue
        try:
            out[k] = Decimal(str(float(v)))
        except (ValueError, TypeError):
            logger.warning(f"[normalize] Ignoring non-numeric {k}={v!r}")
    return out

def _has_any_value(measurements: dict) -> bool:
    """True if there is at least one key with a non-None numeric value > 0."""
    for v in measurements.values():
        try:
            if v is None:
                continue
            if float(v) > 0:
                return True
        except (ValueError, TypeError):
            continue
    return False

def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()

# ---------- Core upsert/delete ----------

def _upsert_birth_growth_item(baby: dict, normalized: dict) -> None:
    """
    Create or update the GrowthData item for birth, and ensure Babies.birthDataId is set.
    After upsert, remove 'percentiles' to force recomputation on the GrowthData stream.
    """
    baby_id = baby.get("babyId")
    user_id = baby.get("userId")
    dob = baby.get("dateOfBirth")
    if not all([baby_id, user_id, dob]):
        logger.info("[skip] Missing babyId/userId/dateOfBirth")
        return

    birth_id = baby.get("birthDataId") or str(uuid.uuid4())
    now = _iso_now()

    # Full put keeps it simple (idempotent if birth_id stable)
    item = {
        "dataId": birth_id,
        "babyId": baby_id,
        "userId": user_id,
        "measurementDate": dob,          # <- always align to DOB
        "measurements": normalized,      # <- normalized Decimals/None
        "measurementSource": "birth",
        "updatedAt": now,
    }

    # Preserve createdAt if already exists
    try:
        current = growth_table.get_item(Key={"dataId": birth_id}).get("Item")
        if current and "createdAt" in current:
            item["createdAt"] = current["createdAt"]
        else:
            item["createdAt"] = now
    except Exception:
        item["createdAt"] = now

    growth_table.put_item(Item=item)

    # Link pointer back to Babies (only set if not exists)
    try:
        babies_table.update_item(
            Key={"babyId": baby_id},
            UpdateExpression="SET birthDataId = if_not_exists(birthDataId, :id)",
            ExpressionAttributeValues={":id": birth_id},
        )
    except Exception:
        logger.exception("[babies] Failed to set birthDataId")

    # Force percentile recompute (if it existed already)
    try:
        growth_table.update_item(
            Key={"dataId": birth_id},
            UpdateExpression="REMOVE percentiles"
        )
    except Exception:
        logger.exception("[growth] Failed to REMOVE percentiles (force recompute)")

def _delete_birth_growth_item_and_pointer(baby: dict) -> None:
    """Delete the GrowthData birth item (if any) and remove Babies.birthDataId."""
    baby_id = baby.get("babyId")
    birth_id = baby.get("birthDataId")
    if not baby_id or not birth_id:
        return
    try:
        growth_table.delete_item(Key={"dataId": birth_id})
    except Exception:
        logger.exception(f"[growth] Failed to delete birth item {birth_id}")
    try:
        babies_table.update_item(
            Key={"babyId": baby_id},
            UpdateExpression="REMOVE birthDataId",
        )
    except Exception:
        logger.exception(f"[babies] Failed to REMOVE birthDataId for baby {baby_id}")

# ---------- Lambda entry ----------

def lambda_handler(event, _ctx):
    """
    Handle INSERT/MODIFY from Babies stream:
      - If at least one birth measurement exists and DOB exists: upsert GrowthData (birth).
      - If no birth measurements remain but pointer exists: delete GrowthData birth item + pointer.
    """
    processed = 0
    for rec in event.get("Records", []):
        etype = rec.get("eventName")
        if etype not in ("INSERT", "MODIFY"):
            continue

        new_baby = _unmarshal(rec.get("dynamodb", {}).get("NewImage"))
        if not new_baby:
            continue

        dob = new_baby.get("dateOfBirth")
        if not dob:
            # Cannot define birth measurement without DOB
            continue

        raw = _extract_birth_measurements(new_baby)
        normalized = _normalize_numeric_fields(raw)

        if _has_any_value(normalized):
            _upsert_birth_growth_item(new_baby, normalized)
            processed += 1
        else:
            # No birth values; if pointer exists, clean up
            if new_baby.get("birthDataId"):
                _delete_birth_growth_item_and_pointer(new_baby)
                processed += 1

    return {"statusCode": 200, "body": f"processed={processed}"}
