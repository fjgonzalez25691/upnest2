# backend/lambdas/babies/baby_stream_processor.py
"""
Baby Stream Projector (MVP, no layers)

Listens to DynamoDB Stream events from the Babies table and ensures there is a
single canonical "birth" GrowthData record referenced by Babies.birthDataId.

Behavior:
- If a baby has dateOfBirth plus at least one birth measurement (weight / height /
    headCircumference), upsert a GrowthData item at dataId=birthDataId (or create a
    new UUID) with measurementDate=dateOfBirth and normalized measurements.
- If birth measurements become entirely empty (no numeric values) and a
    birthDataId exists, delete the corresponding GrowthData item and clear
    Babies.birthDataId.
- Any DOB or birth measurement change removes the 'percentiles' attribute so the
    downstream GrowthData stream processor recomputes with updated age/values.

Environment:
    BABIES_TABLE, GROWTH_DATA_TABLE, GROWTH_DATA_LAMBDA

Notes:
- Units expected: weight in grams; height & headCircumference in centimeters.
- Percentiles are NOT computed here; we deliberately remove them to mark stale
    state and let the GrowthData stream handler recalculate (single responsibility).

Idempotence:
- Upsert uses a stable birthDataId when present; replays of MODIFY events with the
    same logical state result in identical writes (no-op aside from updatedAt).
- Deleting when already absent or inserting identical normalized values is safe.

Recompute Strategy:
- We never compute percentiles inline here to keep latency and complexity low.
- Removing 'percentiles' acts as an invalidation token recognized by the
    growth_data_service internal recompute path.

Limitations / Future:
- Does not debounce rapid successive updates; multiple near-simultaneous writes
    could briefly thrash 'percentiles'. Acceptable for current scale.
- Additional validation (e.g., gestational age cross-check) could be added later.

Migration Note:
Synchronous HTTP recomputation via PATCH /babies/{id}?syncRecalc=1 is now the
preferred path for user-facing updates. This stream processor remains a
best-effort consistency layer and legacy fallback.
"""

import os
import uuid
import json
import logging
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from boto3.dynamodb.types import TypeDeserializer, TypeSerializer
from boto3.dynamodb.conditions import Key

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb")
ddb_client = boto3.client("dynamodb")
lambda_client = boto3.client("lambda")
_deser = TypeDeserializer()
_ser = TypeSerializer()

BABIES_TABLE = os.environ.get("BABIES_TABLE", "upnest-babies")
GROWTH_DATA_TABLE = os.environ.get("GROWTH_DATA_TABLE", "upnest-growth-data")
GROWTH_DATA_LAMBDA = os.environ.get("GROWTH_DATA_LAMBDA")
if not GROWTH_DATA_LAMBDA:
    logger.error("GROWTH_DATA_LAMBDA environment variable not set")

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
        "headCircumference": baby.get("headCircumference"),
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

def _serialize(item: dict) -> dict:
    """Helper to convert a Python dict into DynamoDB's attribute-value format."""
    return {k: _ser.serialize(v) for k, v in item.items()}

  
def _upsert_birth_growth_item(baby: dict, normalized: dict) -> None:
    """
    Create or update the GrowthData item for birth and link it from Babies.
    Both writes occur inside a single transaction so they either succeed or
    fail together.  The written GrowthData item does not include a
    ``percentiles`` attribute which forces the downstream stream processor to
    recompute percentiles using the updated baby details.
    """
    logger.warning(f"====Function baby._upsert_birth_growth_item({baby.get('babyId')})====")
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

    try:
        ddb_client.transact_write_items(
            TransactItems=[
                {
                    "Put": {
                        "TableName": GROWTH_DATA_TABLE,
                        "Item": _serialize(item),
                    }
                },
                {
                    "Update": {
                        "TableName": BABIES_TABLE,
                        "Key": _serialize({"babyId": baby_id}),
                        "UpdateExpression": "SET birthDataId = if_not_exists(birthDataId, :id)",
                        "ExpressionAttributeValues": {":id": _ser.serialize(birth_id)},
                    }
                },
            ]
        )
    except Exception:
        logger.exception("[txn] Failed to upsert birth growth item and link baby")

def _delete_birth_growth_item_and_pointer(baby: dict) -> None:
    """Delete the GrowthData birth item (if any) and remove Babies.birthDataId."""
    logger.warning(f"====Function baby._delete_birth_growth_item_and_pointer({baby.get('babyId')})====")
    baby_id = baby.get("babyId")
    birth_id = baby.get("birthDataId")
    if not baby_id or not birth_id:
        return
    try:
        ddb_client.transact_write_items(
            TransactItems=[
                {
                    "Delete": {
                        "TableName": GROWTH_DATA_TABLE,
                        "Key": _serialize({"dataId": birth_id}),
                    }
                },
                {
                    "Update": {
                        "TableName": BABIES_TABLE,
                        "Key": _serialize({"babyId": baby_id}),
                        "UpdateExpression": "REMOVE birthDataId",
                    }
                },
            ]
        )
    except Exception:
        logger.exception(f"[txn] Failed to delete birth item {birth_id} and pointer for baby {baby_id}")

def _remove_percentiles_for_baby(baby_id: str) -> None:
    """Remove stored percentiles and trigger recomputation for ``baby_id``.

    Every growth record linked to the baby has its ``percentiles`` attribute
    removed so the values cannot be read stale.  After each batch update, the
    ``growth_data`` lambda is invoked asynchronously for every touched item to
    rebuild the percentiles using the updated baby details.

    DynamoDB transactions accept at most 25 items, so the query results are
    chunked into groups of 25 to keep each transaction within the limit.
    """
    logger.warning(f"====Function baby._remove_percentiles_for_baby({baby_id})====")
    if not baby_id:
        return

    last_key = None
    while True:
        try:
            query_kwargs = {
                "IndexName": "BabyGrowthDataIndex",
                "KeyConditionExpression": Key("babyId").eq(baby_id)
            }
            if last_key:
                query_kwargs["ExclusiveStartKey"] = last_key

            resp = growth_table.query(**query_kwargs)
            items = resp.get("Items", [])

            # Chunk writes into groups of 25 to respect transaction limits
            for i in range(0, len(items), 25):
                chunk = items[i : i + 25]
                writes = []
                ids = []
                for item in chunk:
                    data_id = item.get("dataId")
                    if not data_id:
                        continue
                    ids.append(data_id)
                    writes.append(
                        {
                            "Update": {
                                "TableName": GROWTH_DATA_TABLE,
                                "Key": _serialize({"dataId": data_id}),
                                "UpdateExpression": "REMOVE percentiles",
                            }
                        }
                    )
                if not writes:
                    continue

                # Remove percentiles in a single transaction so either all of
                # them disappear or none do for this batch.
                ddb_client.transact_write_items(TransactItems=writes)

                # Invoke growth_data lambda for each updated record to rebuild
                # its percentiles based on the new baby information.
                if GROWTH_DATA_LAMBDA:
                    for data_id in ids:
                        try:
                            logger.info(
                                "[invoke] Triggering growth_data lambda",
                                extra={
                                    "growthLambda": GROWTH_DATA_LAMBDA,
                                    "dataId": data_id,
                                    "chunkSize": len(ids),
                                },
                            )
                            response = lambda_client.invoke(
                                FunctionName=GROWTH_DATA_LAMBDA,
                                InvocationType="Event",  # async fire-and-forget
                                Payload=json.dumps({"dataId": data_id}).encode("utf-8"),
                            )
                            status_code = response.get("StatusCode")
                            request_id = response.get("ResponseMetadata", {}).get("RequestId")
                            logger.info(
                                "[invoke] growth_data async dispatch OK",
                                extra={
                                    "statusCode": status_code,
                                    "requestId": request_id,
                                    "dataId": data_id,
                                },
                            )
                        except Exception:
                            logger.exception(
                                f"[invoke] Failed to invoke growth_data for {data_id}"
                            )

            last_key = resp.get("LastEvaluatedKey")
            if not last_key:
                break
        except Exception:
            logger.exception(
                f"[growth] Query failed when scanning items for baby {baby_id}"
            )
            break

# ---------- Lambda entry ----------

def handle_stream_event(event, _ctx):
    """
    Handle INSERT/MODIFY from Babies stream:
      - If at least one birth measurement exists and DOB exists: upsert GrowthData (birth).
      - If no birth measurements remain but pointer exists: delete GrowthData birth item + pointer.
    """
    logger.warning(f"====Function baby.handle_stream_event====")
    processed = 0
    for rec in event.get("Records", []):
        etype = rec.get("eventName")
        if etype not in ("INSERT", "MODIFY"):
            continue

        new_baby = _unmarshal(rec.get("dynamodb", {}).get("NewImage"))
        old_baby = _unmarshal(rec.get("dynamodb", {}).get("OldImage"))
        if not new_baby:
            continue

        baby_id = new_baby.get("babyId")
        gender_changed = old_baby.get("gender") != new_baby.get("gender")
        dob_changed = old_baby.get("dateOfBirth") != new_baby.get("dateOfBirth")
        if baby_id and (gender_changed or dob_changed):
            # Gender or birth date updates impact the age/gender-based lookup
            # tables, so remove existing percentiles and let the GrowthData
            # stream recompute them with the new baby details.
            _remove_percentiles_for_baby(baby_id)
            processed += 1

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
