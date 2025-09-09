import os
os.environ['BABIES_TABLE'] = 'dummy-table-for-test'

import unittest
import json
from babies_admin import baby_service_admin

class TableSpy:
    def __init__(self):
        self.items = {}

    def put_item(self, Item):
        self.items[Item['babyId']] = Item
        return {}

    def get_item(self, Key):
        return {'Item': self.items.get(Key['babyId'])}

    def delete_item(self, Key):
        self.items.pop(Key['babyId'], None)
        return {}

    def scan(self, **kwargs):
        # Simula un scan por userId
        expr = kwargs.get('ExpressionAttributeValues', {})
        uid = expr.get(':uid')
        filtered = [item for item in self.items.values() if item['userId'] == uid]
        return {'Items': filtered}

class TestBabyServiceAdmin(unittest.TestCase):
    def setUp(self):
        self.spy = TableSpy()
        baby_service_admin.table = self.spy
        # Crea dos bebés, uno activo y uno inactivo
        self.active_baby = {
            'babyId': 'b1',
            'userId': 'admin-user',
            'name': 'Active',
            'isActive': True
        }
        self.inactive_baby = {
            'babyId': 'b2',
            'userId': 'admin-user',
            'name': 'Inactive',
            'isActive': False
        }
        self.spy.put_item(self.active_baby)
        self.spy.put_item(self.inactive_baby)

    def test_get_all_babies(self):
        event = {
            "httpMethod": "GET",
            "path": "/babies/all",
            "requestContext": {
                "authorizer": {
                    "claims": {"sub": "admin-user"}
                }
            }
        }
        resp = baby_service_admin.lambda_handler(event, None)
        data = json.loads(resp['body']) if isinstance(resp['body'], str) else resp['body']
        self.assertEqual(resp['statusCode'], 200)
        self.assertEqual(data['count'], 2)

    def test_hard_delete(self):
        event = {
            "httpMethod": "DELETE",
            "path": "/babies/hard/b1",
            "pathParameters": {"babyId": "b1"},
            "requestContext": {
                "authorizer": {
                    "claims": {"sub": "admin-user"}
                }
            }
        }
        resp = baby_service_admin.lambda_handler(event, None)
        self.assertEqual(resp['statusCode'], 200)
        self.assertNotIn('b1', self.spy.items)

if __name__ == "__main__":
    unittest.main()