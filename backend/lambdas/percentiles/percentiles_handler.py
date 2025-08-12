# Minimal router for both HTTP (direct percentile calc) and DynamoDB Streams.
# - If the event has 'Records', we delegate to the stream processor.
# - Otherwise, we delegate to the HTTP percentile service.

import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Entry point. Routes to:
      - stream_processor.lambda_handler for DynamoDB Stream events
      - percentiles_service.lambda_handler for HTTP requests (API Gateway)
    """
    try:
        if isinstance(event, dict) and "Records" in event:
            logger.info(f"[handler] DynamoDB stream with {len(event['Records'])} records")
            from stream_processor import lambda_handler as stream_lambda
            return stream_lambda(event, context)
        else:
            logger.info("[handler] HTTP request for percentile service")
            from percentiles_service import lambda_handler as http_lambda
            return http_lambda(event, context)
    except Exception as e:
        logger.exception("[handler] Unhandled error")
        # Always return a well-formed HTTP response for API Gateway
        return {"statusCode": 500, "body": f"Internal error: {e}"}
