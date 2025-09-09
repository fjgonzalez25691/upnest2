import os
os.environ['GROWTH_DATA_TABLE'] = 'dummy-growth-data-table-for-test'
os.environ['BABIES_TABLE'] = 'dummy-babies-table-for-test'

import unittest
from decimal import Decimal
from lambdas.growth_data import growth_data_service


class TableSpy:
    def __init__(self):
        self.last_item = None
        self.items = {}
        self.babies = {}  # Separate storage for babies

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
        
        if item:
            return {'Item': item}
        return {}

    def scan(self, **kwargs):
        # Simple scan implementation for testing
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

    def update_item(self, Key, **kwargs):
        if 'dataId' in Key:
            item = self.items.get(Key['dataId'])
        else:
            return
        
        if not item:
            return
        
        expr = kwargs.get('ExpressionAttributeValues', {})
        for k, v in expr.items():
            if k.startswith(':'):
                field = k[1:]
                item[field] = v

    def delete_item(self, Key):
        if 'dataId' in Key:
            self.items.pop(Key['dataId'], None)


class TestGrowthDataService(unittest.TestCase):
    def setUp(self):
        self.spy = TableSpy()
        growth_data_service.growth_table = self.spy
        growth_data_service.babies_table = self.spy
        
        # Create a test baby first
        self.test_baby = {
            'babyId': '550e8400-e29b-41d4-a716-446655440000',
            'userId': 'test-user-123',
            'name': 'Test Baby',
            'isActive': True
        }
        self.spy.babies['550e8400-e29b-41d4-a716-446655440000'] = self.test_baby

    def test_post_growth_data_with_measurements(self):
        """Test creating growth data with numeric measurements"""
        event = {
            "httpMethod": "POST",
            "path": "/growth-data",
            "body": '{"babyId": "550e8400-e29b-41d4-a716-446655440000", "measurementDate": "2024-01-01", "measurements": {"weight": "5.2", "height": "65.5", "headCircumference": "42.1"}, "notes": "Regular checkup"}',
            "requestContext": {}
        }
        
        response = growth_data_service.lambda_handler(event, None)
        
        self.assertEqual(response["statusCode"], 201)
        item = self.spy.last_item
        
        # Check that measurements are stored as Decimal
        self.assertIsInstance(item["measurements"]["weight"], Decimal)
        self.assertIsInstance(item["measurements"]["height"], Decimal)
        self.assertIsInstance(item["measurements"]["headCircumference"], Decimal)
        
        self.assertEqual(item["measurements"]["weight"], Decimal('5.2'))
        self.assertEqual(item["measurements"]["height"], Decimal('65.5'))
        self.assertEqual(item["measurements"]["headCircumference"], Decimal('42.1'))
        
        # Check other fields
        self.assertEqual(item["babyId"], "550e8400-e29b-41d4-a716-446655440000")
        self.assertEqual(item["userId"], "test-user-123")
        self.assertEqual(item["measurementDate"], "2024-01-01")
        self.assertEqual(item["notes"], "Regular checkup")
        self.assertIn("dataId", item)
        self.assertIn("createdAt", item)
        self.assertIn("updatedAt", item)

    def test_post_growth_data_missing_required_fields(self):
        """Test validation of required fields"""
        event = {
            "httpMethod": "POST",
            "path": "/growth-data",
            "body": '{"measurementDate": "2024-01-01"}',  # Missing babyId and measurements
            "requestContext": {}
        }
        
        response = growth_data_service.lambda_handler(event, None)
        
        self.assertEqual(response["statusCode"], 400)
        self.assertIn("Missing required fields", response["body"])

    def test_post_growth_data_invalid_baby_id(self):
        """Test with invalid baby ID format"""
        event = {
            "httpMethod": "POST",
            "path": "/growth-data",
            "body": '{"babyId": "invalid-id", "measurementDate": "2024-01-01", "measurements": {"weight": "5.2"}}',
            "requestContext": {}
        }
        
        response = growth_data_service.lambda_handler(event, None)
        
        self.assertEqual(response["statusCode"], 400)
        self.assertIn("Invalid babyId format", response["body"])

    def test_post_growth_data_baby_not_found(self):
        """Test with non-existent baby"""
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
        """Test with invalid measurement values"""
        event = {
            "httpMethod": "POST",
            "path": "/growth-data",
            "body": '{"babyId": "550e8400-e29b-41d4-a716-446655440000", "measurementDate": "2024-01-01", "measurements": {"weight": "invalid"}}',
            "requestContext": {}
        }
        
        response = growth_data_service.lambda_handler(event, None)
        
        self.assertEqual(response["statusCode"], 400)
        self.assertIn("must be numeric", response["body"])

    def test_get_baby_growth_data(self):
        """Test getting growth data for a specific baby"""
        # First create some growth data
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
            "path": "/babies/550e8400-e29b-41d4-a716-446655440000/growth",
            "pathParameters": {"babyId": "550e8400-e29b-41d4-a716-446655440000"},
            "requestContext": {}
        }
        
        response = growth_data_service.lambda_handler(event, None)
        
        self.assertEqual(response["statusCode"], 200)
        response_data = eval(response["body"])  # Simple parsing for test
        self.assertIn("data", response_data)
        self.assertEqual(response_data["count"], 1)

    def test_get_single_growth_data(self):
        """Test getting a single growth data record"""
        # Create test data
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
        response_data = eval(response["body"])
        self.assertIn("data", response_data)
        self.assertEqual(response_data["data"]["dataId"], "650e8400-e29b-41d4-a716-446655440001")

    def test_get_single_growth_data_not_found(self):
        """Test getting non-existent growth data"""
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
        """Test updating growth data measurements"""
        # Create initial data
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
        # Check that the item was updated (in a real implementation, you'd check the updated values)
        response_data = eval(response["body"])
        self.assertIn("Growth data updated", response_data["message"])

    def test_delete_growth_data(self):
        """Test deleting growth data"""
        # Create test data
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
        # Verify the item was deleted
        self.assertNotIn('650e8400-e29b-41d4-a716-446655440001', self.spy.items)

    def test_delete_growth_data_not_found(self):
        """Test deleting non-existent growth data"""
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
        """Test listing all growth data for a user"""
        # Create test data
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
        response_data = eval(response["body"])
        self.assertIn("data", response_data)
        self.assertEqual(response_data["count"], 2)

    def test_options_request(self):
        """Test CORS preflight request"""
        event = {
            "httpMethod": "OPTIONS",
            "path": "/growth-data",
            "requestContext": {}
        }
        
        response = growth_data_service.lambda_handler(event, None)
        
        self.assertEqual(response["statusCode"], 200)
        self.assertIn("CORS preflight", response["body"])

    def test_invalid_method(self):
        """Test unsupported HTTP method"""
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
