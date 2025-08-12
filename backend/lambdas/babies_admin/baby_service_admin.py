# backend/lambdas/babies/baby_service_admin.py

import json
import logging
from datetime import datetime, timezone
import os
import boto3

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['BABIES_TABLE'])

def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(body, default=str)
    }

def extract_baby_id(event):
    path_params = event.get('pathParameters', {})
    return path_params.get('babyId') if path_params else None

def get_user_id_from_context(event):
    try:
        claims = event.get('requestContext', {}).get(
            'authorizer', {}).get('claims', {})
        return claims.get('sub') or "test-user-123"
    except Exception:
        return "test-user-123"

def lambda_handler(event, context):
    method = event['httpMethod']
    path = event['path']
    user_id = get_user_id_from_context(event)

    logger.info(f"[ADMIN] Baby service called: {method} {path} by user {user_id}")

    # ⚠️ IMPORTANTE: Proteger este endpoint solo para administradores antes de producción

    # GET /babies/all - lista todos los bebés (activos e inactivos) del usuario
    if method == 'GET' and path == '/babies/all':
        try:
            result = table.scan(
                FilterExpression="userId = :uid",
                ExpressionAttributeValues={":uid": user_id}
            )
            babies = result.get('Items', [])
            babies.sort(key=lambda x: x.get('name', ''))
            return response(200, {"babies": babies, "count": len(babies)})
        except Exception as e:
            logger.error(f"Error listing all babies: {e}")
            return response(500, {"error": "Failed to list all babies"})

    # DELETE /babies/hard/{babyId} - hard delete
    if method == 'DELETE' and path.startswith('/babies/hard/'):
        baby_id = extract_baby_id(event)
        if not baby_id:
            return response(400, {"error": "Baby ID is required"})
        try:
            result = table.get_item(Key={'babyId': baby_id})
            baby = result.get('Item')
            if not baby or baby.get('userId') != user_id:
                return response(404, {"error": "Baby not found"})
            table.delete_item(Key={'babyId': baby_id})
            return response(200, {"message": "Baby permanently deleted", "babyId": baby_id})
        except Exception as e:
            logger.error(f"Error hard deleting baby: {e}")
            return response(500, {"error": "Failed to hard delete baby"})

    return response(405, {"error": f"Method {method} not allowed for {path}"})