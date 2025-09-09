import os
os.environ['BABIES_TABLE'] = 'dummy-table-for-test'

import unittest
from decimal import Decimal
from lambdas.babies import baby_service

class TableSpy:
    def __init__(self):
        self.last_item = None
        self.items = {}

    def put_item(self, Item):
        self.last_item = Item
        self.items[Item['babyId']] = Item
        return {}

    def get_item(self, Key):
        return {'Item': self.items.get(Key['babyId'])}

    def update_item(self, Key, **kwargs):
        item = self.items.get(Key['babyId'])
        if not item:
            return
        expr = kwargs.get('ExpressionAttributeValues', {})
        for k, v in expr.items():
            if k.startswith(':'):
                field = k[1:]
                item[field] = v


class TestBabyService(unittest.TestCase):
    def setUp(self):
        self.spy = TableSpy()
        baby_service.table = self.spy

    def test_post_numeric_fields(self):
        event = {
            "httpMethod": "POST",
            "path": "/babies",
            "body": '{"name": "Test", "dateOfBirth": "2020-01-01", "gender": "M", "birthWeight": "3200", "birthHeight": "50.5", "headCircumference": "34.2", "gestationalWeek": "39"}',
            "requestContext": {}
        }
        baby_service.lambda_handler(event, None)
        item = self.spy.last_item
        self.assertIsInstance(item["birthWeight"], int)
        self.assertIsInstance(item["birthHeight"], Decimal)
        self.assertIsInstance(item["headCircumference"], Decimal)
        self.assertIsInstance(item["gestationalWeek"], int)
        self.assertEqual(item["birthHeight"], Decimal('50.5'))
        self.assertEqual(item["headCircumference"], Decimal('34.2'))

    def test_put_numeric_fields(self):
        # First, create a baby
        event_post = {
            "httpMethod": "POST",
            "path": "/babies",
            "body": '{"name": "Test", "dateOfBirth": "2020-01-01", "gender": "M", "birthWeight": "3200", "birthHeight": "50.0", "headCircumference": "33.0", "gestationalWeek": "39"}',
            "requestContext": {}
        }
        baby_service.lambda_handler(event_post, None)
        baby_id = self.spy.last_item["babyId"]
        # Now, update with decimal values
        event_put = {
            "httpMethod": "PUT",
            "path": f"/babies/{baby_id}",
            "pathParameters": {"babyId": baby_id},
            "body": '{"birthWeight": "3500", "birthHeight": "52.7", "headCircumference": "35.8", "gestationalWeek": "40"}',
            "requestContext": {}
        }
        baby_service.lambda_handler(event_put, None)
        item = self.spy.items[baby_id]
        self.assertIsInstance(item["birthWeight"], int)
        self.assertIsInstance(item["birthHeight"], Decimal)
        self.assertIsInstance(item["headCircumference"], Decimal)
        self.assertIsInstance(item["gestationalWeek"], int)
        self.assertEqual(item["birthHeight"], Decimal('52.7'))
        self.assertEqual(item["headCircumference"], Decimal('35.8'))

    def test_gestational_week_forces_40_if_not_premature(self):
        event = {
            "httpMethod": "POST",
            "path": "/babies",
            "body": '{"name": "Test", "dateOfBirth": "2020-01-01", "gender": "M", "premature": false, "gestationalWeek": "30"}',
            "requestContext": {}
        }
        baby_service.lambda_handler(event, None)
        item = self.spy.last_item
        self.assertEqual(item["gestationalWeek"], 40)
        self.assertFalse(item["premature"])

    def test_gestational_week_38_or_more_forces_not_premature(self):
        event = {
            "httpMethod": "POST",
            "path": "/babies",
            "body": '{"name": "Test", "dateOfBirth": "2020-01-01", "gender": "M", "premature": true, "gestationalWeek": "39"}',
            "requestContext": {}
        }
        baby_service.lambda_handler(event, None)
        item = self.spy.last_item
        self.assertEqual(item["gestationalWeek"], 40)
        self.assertFalse(item["premature"])

    def test_gestational_week_invalid_for_premature_raises(self):
        event = {
            "httpMethod": "POST",
            "path": "/babies",
            "body": '{"name": "Test", "dateOfBirth": "2020-01-01", "gender": "M", "premature": true, "gestationalWeek": "19"}',
            "requestContext": {}
        }
        resp = baby_service.lambda_handler(event, None)
        self.assertEqual(resp["statusCode"], 400)
        self.assertIn("Gestational week must be between 20 and 37", resp["body"])

    def test_gestational_week_valid_for_premature(self):
        event = {
            "httpMethod": "POST",
            "path": "/babies",
            "body": '{"name": "Test", "dateOfBirth": "2020-01-01", "gender": "M", "premature": true, "gestationalWeek": "32"}',
            "requestContext": {}
        }
        baby_service.lambda_handler(event, None)
        item = self.spy.last_item
        self.assertEqual(item["gestationalWeek"], 32)
        self.assertTrue(item["premature"])


if __name__ == "__main__":
    unittest.main()
