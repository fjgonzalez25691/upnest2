import os, sys, json, pytest
from decimal import Decimal

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'lambdas'))
pytest.importorskip("pandas")

from moto import mock_dynamodb
import boto3

from growth_data.growth_data_service import lambda_handler as growth_handler
from babies.baby_service import lambda_handler as baby_handler


@mock_dynamodb
def test_update_growth_returns_percentiles():
    os.environ['GROWTH_DATA_TABLE'] = 'growth'
    os.environ['BABIES_TABLE'] = 'babies'
    ddb = boto3.resource('dynamodb', region_name='us-east-1')
    ddb.create_table(
        TableName='babies',
        KeySchema=[{'AttributeName': 'babyId', 'KeyType': 'HASH'}],
        AttributeDefinitions=[{'AttributeName': 'babyId', 'AttributeType': 'S'}],
        BillingMode='PAY_PER_REQUEST'
    )
    ddb.create_table(
        TableName='growth',
        KeySchema=[{'AttributeName': 'dataId', 'KeyType': 'HASH'}],
        AttributeDefinitions=[
            {'AttributeName': 'dataId', 'AttributeType': 'S'},
            {'AttributeName': 'babyId', 'AttributeType': 'S'},
            {'AttributeName': 'measurementDate', 'AttributeType': 'S'},
        ],
        GlobalSecondaryIndexes=[{
            'IndexName': 'BabyGrowthDataIndex',
            'KeySchema': [
                {'AttributeName': 'babyId', 'KeyType': 'HASH'},
                {'AttributeName': 'measurementDate', 'KeyType': 'RANGE'}
            ],
            'Projection': {'ProjectionType': 'ALL'}
        }],
        BillingMode='PAY_PER_REQUEST'
    )
    babies = ddb.Table('babies')
    growth = ddb.Table('growth')
    babies.put_item(Item={'babyId': 'b1', 'userId': 'u', 'gender': 'male', 'dateOfBirth': '2024-01-01'})
    growth.put_item(Item={
        'dataId': 'd1',
        'babyId': 'b1',
        'userId': 'u',
        'measurementDate': '2024-07-01',
        'measurements': {'weight': Decimal('7000'), 'height': Decimal('67'), 'headCircumference': Decimal('42')},
        'updatedAt': 'x',
        'createdAt': 'x'
    })
    event = {
        'httpMethod': 'PUT',
        'path': '/growth-data/d1',
        'body': json.dumps({'measurements': {'weight': 7200}})
    }
    res = growth_handler(event, None)
    body = json.loads(res['body'])
    assert 'percentiles' in body
    assert body['percentiles']['weight'] is not None


@mock_dynamodb
def test_patch_baby_triggers_recalc():
    os.environ['GROWTH_DATA_TABLE'] = 'growth'
    os.environ['BABIES_TABLE'] = 'babies'
    ddb = boto3.resource('dynamodb', region_name='us-east-1')
    ddb.create_table(
        TableName='babies',
        KeySchema=[{'AttributeName': 'babyId', 'KeyType': 'HASH'}],
        AttributeDefinitions=[{'AttributeName': 'babyId', 'AttributeType': 'S'}],
        BillingMode='PAY_PER_REQUEST'
    )
    ddb.create_table(
        TableName='growth',
        KeySchema=[{'AttributeName': 'dataId', 'KeyType': 'HASH'}],
        AttributeDefinitions=[
            {'AttributeName': 'dataId', 'AttributeType': 'S'},
            {'AttributeName': 'babyId', 'AttributeType': 'S'},
            {'AttributeName': 'measurementDate', 'AttributeType': 'S'},
        ],
        GlobalSecondaryIndexes=[{
            'IndexName': 'BabyGrowthDataIndex',
            'KeySchema': [
                {'AttributeName': 'babyId', 'KeyType': 'HASH'},
                {'AttributeName': 'measurementDate', 'KeyType': 'RANGE'}
            ],
            'Projection': {'ProjectionType': 'ALL'}
        }],
        BillingMode='PAY_PER_REQUEST'
    )
    babies = ddb.Table('babies')
    growth = ddb.Table('growth')
    babies.put_item(Item={'babyId': 'b1', 'userId': 'u', 'gender': 'male', 'dateOfBirth': '2024-01-01'})
    growth.put_item(Item={
        'dataId': 'd1',
        'babyId': 'b1',
        'userId': 'u',
        'measurementDate': '2024-07-01',
        'measurements': {'weight': Decimal('7000'), 'height': Decimal('67'), 'headCircumference': Decimal('42')},
        'updatedAt': 'x',
        'createdAt': 'x'
    })
    event = {
        'httpMethod': 'PATCH',
        'path': '/babies/b1',
        'queryStringParameters': {'syncRecalc': '1'},
        'body': json.dumps({'gender': 'female'})
    }
    res = baby_handler(event, None)
    body = json.loads(res['body'])
    assert body['updatedCount'] == 1
    item = growth.get_item(Key={'dataId': 'd1'})['Item']
    assert 'percentiles' in item
