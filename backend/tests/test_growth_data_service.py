import os
os.environ['GROWTH_DATA_TABLE'] = 'dummy-growth-data-table-for-test'
os.environ['BABIES_TABLE'] = 'dummy-babies-table-for-test'

import json
import unittest
from decimal import Decimal
from unittest.mock import patch
from lambdas.growth_data import growth_data_service


class TableSpy:
    def __init__(self):
        self.last_item = None
        self.items = {}
        self.babies = {}

    def put_item(self, Item):
        self.last_item = Item
        if 'dataId' in Item:
            self.items[Item['dataId']] = Item
        elif 'babyId' in Item:
            self.babies[Item['babyId']] = Item
        return {}

    def get_item(self, Key):
        if 'dataId' in Key:
            item = self.items.get(Key['dataId'])
        elif 'babyId' in Key:
            item = self.babies.get(Key['babyId'])
        else:
            item = None
        return {'Item': item} if item else {}

    def scan(self, **kwargs):
        filter_expr = kwargs.get('FilterExpression', '')
        expr_values = kwargs.get('ExpressionAttributeValues', {})
        if 'babyId = :babyId' in filter_expr:
            baby_id = expr_values.get(':babyId')
            items = [item for item in self.items.values() if item.get('babyId') == baby_id]
        elif 'userId = :uid' in filter_expr:
            user_id = expr_values.get(':uid')
            items = [item for item in self.items.values() if item.get('userId') == user_id]
        else:
            items = list(self.items.values())
        return {'Items': items}

    def query(self, IndexName=None, KeyConditionExpression=None, ExpressionAttributeValues=None, Limit=None, ScanIndexForward=True):
        items = list(self.items.values())
        if IndexName == 'BabyGrowthDataIndex' and ExpressionAttributeValues and ':babyId' in ExpressionAttributeValues:
            bid = ExpressionAttributeValues[':babyId']
            items = [it for it in items if it.get('babyId') == bid]
        elif IndexName == 'UserGrowthDataIndex' and ExpressionAttributeValues and ':uid' in ExpressionAttributeValues:
            uid = ExpressionAttributeValues[':uid']
            items = [it for it in items if it.get('userId') == uid]
        items.sort(key=lambda x: x.get('measurementDate', ''), reverse=not ScanIndexForward)
        if Limit:
            items = items[:Limit]
        return {'Items': items}

    def update_item(self, Key, **kwargs):
        item = self.items.get(Key.get('dataId'))
        if not item:
            return {}
        expr = kwargs.get('ExpressionAttributeValues', {})
        for k, v in expr.items():
            if k.startswith(':'):
                field = k[1:]
                item[field] = v
        return {'Attributes': item}

    def delete_item(self, Key):
        if 'dataId' in Key:
            self.items.pop(Key['dataId'], None)


class TestGrowthDataService(unittest.TestCase):
    def setUp(self):
        self.spy = TableSpy()
        growth_data_service.growth_table = self.spy
        growth_data_service.babies_table = self.spy

        self.test_baby = {
            'babyId': '550e8400-e29b-41d4-a716-446655440000',
            'userId': 'test-user-123',
            'name': 'Test Baby',
            'isActive': True,
            'gender': 'female',
            'dateOfBirth': '2024-01-01',
        }
        self.spy.babies[self.test_baby['babyId']] = self.test_baby

        self.patcher = patch(
            'lambdas.growth_data.growth_data_service.compute_percentiles',
            side_effect=lambda baby, mdate, measures: {
                k: v for k, v in {
                    'weight': 47.19 if measures.get('weight') is not None else None,
                    'height': 28.69 if measures.get('height') is not None else None,
                    'headCircumference': 72.3 if measures.get('headCircumference') is not None else None,
                }.items() if v is not None
            }
        )
        self.patcher.start()
        self.addCleanup(self.patcher.stop)

    def test_post_growth_data_with_measurements(self):
        event = {
            "httpMethod": "POST",
            "path": "/growth-data",
            "body": '{"babyId": "550e8400-e29b-41d4-a716-446655440000", "measurementDate": "2024-01-01", "measurements": {"weight": "5.2", "height": "65.5", "headCircumference": "42.1"}, "notes": "Regular checkup"}',
            "requestContext": {}
        }
        resp = growth_data_service.lambda_handler(event, None)
        self.assertEqual(resp["statusCode"], 201)
        item = self.spy.last_item
        self.assertIn('percentiles', item)
        self.assertIsInstance(item['percentiles']['weight'], Decimal)
        self.assertIsInstance(item["measurements"]["weight"], Decimal)
        self.assertIsInstance(item["measurements"]["height"], Decimal)
        self.assertIsInstance(item["measurements"]["headCircumference"], Decimal)
        self.assertEqual(item["measurements"]["weight"], Decimal('5.2'))
        self.assertEqual(item["measurements"]["height"], Decimal('65.5'))
        self.assertEqual(item["measurements"]["headCircumference"], Decimal('42.1'))
        self.assertEqual(item["babyId"], "550e8400-e29b-41d4-a716-446655440000")
        self.assertEqual(item["userId"], "test-user-123")
        self.assertEqual(item["measurementDate"], "2024-01-01")
        self.assertEqual(item["notes"], "Regular checkup")
        self.assertIn("dataId", item)
        self.assertIn("createdAt", item)
        self.assertIn("updatedAt", item)

    def test_post_growth_data_missing_required_fields(self):
        event = {
            "httpMethod": "POST",
            "path": "/growth-data",
            "body": '{"measurementDate": "2024-01-01"}',
            "requestContext": {}
        }
        response = growth_data_service.lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 400)
        self.assertIn("Missing required field", response["body"])

    def test_post_growth_data_invalid_baby_id(self):
        event = {
            "httpMethod": "POST",
            "path": "/growth-data",
            "body": '{"babyId": "invalid-id", "measurementDate": "2024-01-01", "measurements": {"weight": "5.2"}}',
            "requestContext": {}
        }
        response = growth_data_service.lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 404)
        self.assertIn("Baby not found", response["body"])

    def test_post_growth_data_baby_not_found(self):
        event = {
            "httpMethod": "POST",
            "path": "/growth-data",
            "body": '{"babyId": "b50e8400-e29b-41d4-a716-446655440000", "measurementDate": "2024-01-01", "measurements": {"weight": "5.2"}}',
            "requestContext": {}
        }
        response = growth_data_service.lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 404)
        self.assertIn("Baby not found", response["body"])

    def test_post_growth_data_invalid_measurements(self):
        event = {
            "httpMethod": "POST",
            "path": "/growth-data",
            "body": '{"babyId": "550e8400-e29b-41d4-a716-446655440000", "measurementDate": "2024-01-01", "measurements": {"weight": "invalid"}}',
            "requestContext": {}
        }
        response = growth_data_service.lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 400)
        self.assertIn("Invalid numeric data", response["body"])

    def test_get_baby_growth_data(self):
        growth_data = {
            'dataId': '650e8400-e29b-41d4-a716-446655440001',
            'babyId': '550e8400-e29b-41d4-a716-446655440000',
            'userId': 'test-user-123',
            'measurementDate': '2024-01-01',
            'measurements': {'weight': Decimal('5.2'), 'height': Decimal('65.5')},
            'createdAt': '2024-01-01T10:00:00Z',
            'updatedAt': '2024-01-01T10:00:00Z'
        }
        self.spy.items['650e8400-e29b-41d4-a716-446655440001'] = growth_data
        event = {
            "httpMethod": "GET",
            "path": "/growth-data",
            "queryStringParameters": {"babyId": "550e8400-e29b-41d4-a716-446655440000"},
            "requestContext": {}
        }
        response = growth_data_service.lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        response_data = json.loads(response["body"])
        self.assertIn("data", response_data)
        self.assertEqual(response_data["count"], 1)

    def test_get_single_growth_data(self):
        growth_data = {
            'dataId': '650e8400-e29b-41d4-a716-446655440001',
            'babyId': '550e8400-e29b-41d4-a716-446655440000',
            'userId': 'test-user-123',
            'measurementDate': '2024-01-01',
            'measurements': {'weight': Decimal('5.2')},
            'createdAt': '2024-01-01T10:00:00Z',
            'updatedAt': '2024-01-01T10:00:00Z'
        }
        self.spy.items['650e8400-e29b-41d4-a716-446655440001'] = growth_data
        event = {
            "httpMethod": "GET",
            "path": "/growth-data/650e8400-e29b-41d4-a716-446655440001",
            "pathParameters": {"dataId": "650e8400-e29b-41d4-a716-446655440001"},
            "requestContext": {}
        }
        response = growth_data_service.lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        response_data = json.loads(response["body"])
        self.assertIn("data", response_data)
        self.assertEqual(response_data["data"]["dataId"], "650e8400-e29b-41d4-a716-446655440001")

    def test_get_single_growth_data_not_found(self):
        event = {
            "httpMethod": "GET",
            "path": "/growth-data/750e8400-e29b-41d4-a716-446655440000",
            "pathParameters": {"dataId": "750e8400-e29b-41d4-a716-446655440000"},
            "requestContext": {}
        }
        response = growth_data_service.lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 404)
        self.assertIn("Growth data not found", response["body"])

    def test_put_growth_data_update_measurements(self):
        growth_data = {
            'dataId': '650e8400-e29b-41d4-a716-446655440001',
            'babyId': '550e8400-e29b-41d4-a716-446655440000',
            'userId': 'test-user-123',
            'measurementDate': '2024-01-01',
            'measurements': {'weight': Decimal('5.2')},
            'createdAt': '2024-01-01T10:00:00Z',
            'updatedAt': '2024-01-01T10:00:00Z'
        }
        self.spy.items['650e8400-e29b-41d4-a716-446655440001'] = growth_data
        event = {
            "httpMethod": "PUT",
            "path": "/growth-data/650e8400-e29b-41d4-a716-446655440001",
            "pathParameters": {"dataId": "650e8400-e29b-41d4-a716-446655440001"},
            "body": '{"measurements": {"weight": "5.5", "height": "66.0"}}',
            "requestContext": {}
        }
        response = growth_data_service.lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        response_data = json.loads(response["body"])
        self.assertEqual(response_data["dataId"], "650e8400-e29b-41d4-a716-446655440001")
        self.assertIn("measurements", response_data)
        self.assertIn("percentiles", response_data)
        self.assertIn("weight", response_data["percentiles"])
        self.assertIn("height", response_data["percentiles"])

    def test_delete_growth_data(self):
        growth_data = {
            'dataId': '650e8400-e29b-41d4-a716-446655440001',
            'babyId': '550e8400-e29b-41d4-a716-446655440000',
            'userId': 'test-user-123',
            'measurementDate': '2024-01-01',
            'measurements': {'weight': Decimal('5.2')},
            'createdAt': '2024-01-01T10:00:00Z',
            'updatedAt': '2024-01-01T10:00:00Z'
        }
        self.spy.items['650e8400-e29b-41d4-a716-446655440001'] = growth_data
        event = {
            "httpMethod": "DELETE",
            "path": "/growth-data/650e8400-e29b-41d4-a716-446655440001",
            "pathParameters": {"dataId": "650e8400-e29b-41d4-a716-446655440001"},
            "requestContext": {}
        }
        response = growth_data_service.lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        self.assertNotIn('650e8400-e29b-41d4-a716-446655440001', self.spy.items)

    def test_delete_growth_data_not_found(self):
        event = {
            "httpMethod": "DELETE",
            "path": "/growth-data/750e8400-e29b-41d4-a716-446655440000",
            "pathParameters": {"dataId": "750e8400-e29b-41d4-a716-446655440000"},
            "requestContext": {}
        }
        response = growth_data_service.lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 404)
        self.assertIn("Growth data not found", response["body"])

    def test_list_growth_data_for_user(self):
        growth_data1 = {
            'dataId': '650e8400-e29b-41d4-a716-446655440001',
            'babyId': '550e8400-e29b-41d4-a716-446655440000',
            'userId': 'test-user-123',
            'measurementDate': '2024-01-01',
            'measurements': {'weight': Decimal('5.2')},
            'createdAt': '2024-01-01T10:00:00Z',
            'updatedAt': '2024-01-01T10:00:00Z'
        }
        growth_data2 = {
            'dataId': '650e8400-e29b-41d4-a716-446655440002',
            'babyId': '550e8400-e29b-41d4-a716-446655440000',
            'userId': 'test-user-123',
            'measurementDate': '2024-01-15',
            'measurements': {'weight': Decimal('5.5')},
            'createdAt': '2024-01-15T10:00:00Z',
            'updatedAt': '2024-01-15T10:00:00Z'
        }
        self.spy.items['650e8400-e29b-41d4-a716-446655440001'] = growth_data1
        self.spy.items['650e8400-e29b-41d4-a716-446655440002'] = growth_data2
        event = {
            "httpMethod": "GET",
            "path": "/growth-data",
            "requestContext": {}
        }
        response = growth_data_service.lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        response_data = json.loads(response["body"])
        self.assertIn("data", response_data)
        self.assertEqual(response_data["count"], 2)

    def test_options_request(self):
        event = {
            "httpMethod": "OPTIONS",
            "path": "/growth-data",
            "requestContext": {}
        }
        response = growth_data_service.lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        self.assertIn("CORS preflight", response["body"])

    def test_invalid_method(self):
        event = {
            "httpMethod": "PATCH",
            "path": "/growth-data",
            "requestContext": {}
        }
        response = growth_data_service.lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 405)
        self.assertIn("not allowed", response["body"])


if __name__ == "__main__":
    unittest.main()