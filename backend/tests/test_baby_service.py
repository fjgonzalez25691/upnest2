import os, sys
os.environ['BABIES_TABLE'] = 'dummy-table-for-test'

import unittest
import json
from decimal import Decimal

# Ensure the 'lambdas' package is importable when running tests from backend/
CURRENT_DIR = os.path.dirname(__file__)
BACKEND_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from lambdas.babies import baby_service

class TableSpy:
    """Simulates a DynamoDB Babies table."""
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
            return {'Attributes': None}
        expr_vals = kwargs.get('ExpressionAttributeValues', {})
        update_expr = kwargs.get('UpdateExpression', '')
        # Support form 'SET field = :val, birthPercentiles = :bp'
        if update_expr.startswith('SET'):
            assignments = update_expr[3:].split(',')
            for raw in assignments:
                seg = raw.strip()
                if ' = ' in seg:
                    field, placeholder = seg.split(' = ')
                    field = field.replace('#name', 'name').strip()
                    placeholder = placeholder.strip()
                    if placeholder in expr_vals:
                        item[field] = expr_vals[placeholder]
        # Also accept previous pattern (we strictly used ExpressionAttributeValues before)
        for k, v in expr_vals.items():
            if k.startswith(':') and k[1:] not in item:
                # Do not overwrite if it was already applied via SET
                item[k[1:]] = v
        return {'Attributes': item} if kwargs.get('ReturnValues') == 'ALL_NEW' else {}


class GrowthTableSpy:
    """Simulates a Growth Data table for full recalculation."""
    def __init__(self, items):
        self.items = items  # list of dicts with dataId, measurementDate, measurements
        self.update_calls = 0

    def query(self, **kwargs):
        return {'Items': self.items}

    def update_item(self, Key, **kwargs):
        data_id = Key['dataId']
        expr_vals = kwargs.get('ExpressionAttributeValues', {})
        for it in self.items:
            if it['dataId'] == data_id:
                it['percentiles'] = expr_vals.get(':p', {})
                it['updatedAt'] = expr_vals.get(':u')
                self.update_calls += 1
                break


class TestBabyService(unittest.TestCase):
    def setUp(self):
        self.spy = TableSpy()
        baby_service.table = self.spy
    # By default growth_table isn't used in existing tests; assigned dynamically in PATCH tests

    def _stub_percentiles(self, return_value_map=None):
        """Monkeypatch compute_percentiles para evitar dependencias de layer."""
        if return_value_map is None:
            def fake(baby, measurement_date, measurements):
                # Devuelve percentile = 42 para cada métrica válida
                return {k: 42.0 for k, v in (measurements or {}).items() if v is not None}
        else:
            def fake(baby, measurement_date, measurements):
                out = {}
                for k, v in (measurements or {}).items():
                    if k in return_value_map:
                        out[k] = return_value_map[k]
                return out
        baby_service.compute_percentiles = fake

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

    # ---- NUEVOS TESTS PATCH ----
    def _create_baby_base(self):
        ev = {
            "httpMethod": "POST",
            "path": "/babies",
            "body": '{"name": "B", "dateOfBirth": "2020-01-01", "gender": "male", "birthWeight": 3200, "birthHeight": 50.0, "headCircumference": 34.0}',
            "requestContext": {}
        }
        resp = baby_service.lambda_handler(ev, None)
        return self.spy.last_item['babyId']

    def test_patch_full_recalc_on_gender_change(self):
        baby_id = self._create_baby_base()
        # Añadimos growth data simulado
        growth_items = [
            {"dataId": "d1", "babyId": baby_id, "measurementDate": "2020-02-01", "measurements": {"weight": 3500, "height": 52}},
            {"dataId": "d2", "babyId": baby_id, "measurementDate": "2020-03-01", "measurements": {"weight": 4000}}
        ]
        growth_spy = GrowthTableSpy(growth_items)
        baby_service.growth_table = growth_spy
        self._stub_percentiles()
        ev_patch = {
            "httpMethod": "PATCH",
            "path": f"/babies/{baby_id}",
            "pathParameters": {"babyId": baby_id},
            "queryStringParameters": {"syncRecalc": "1"},
            "body": '{"gender": "female"}',
            "requestContext": {}
        }
        resp = baby_service.lambda_handler(ev_patch, None)
        self.assertEqual(resp['statusCode'], 200)
        body = json.loads(resp['body'])
        self.assertEqual(body.get('mode'), 'full')
        self.assertIn('measurements', body)
        self.assertEqual(body.get('updatedCount'), 2)
        self.assertIn('birthPercentiles', body)
        self.assertGreaterEqual(growth_spy.update_calls, 2)

    def test_patch_birth_only_on_birth_weight_change(self):
        baby_id = self._create_baby_base()
        self._stub_percentiles()
        ev_patch = {
            "httpMethod": "PATCH",
            "path": f"/babies/{baby_id}",
            "pathParameters": {"babyId": baby_id},
            "queryStringParameters": {"syncRecalc": "1"},
            "body": '{"birthWeight": 3300}',
            "requestContext": {}
        }
        resp = baby_service.lambda_handler(ev_patch, None)
        body = json.loads(resp['body'])
        self.assertEqual(body.get('mode'), 'birth-only')
        self.assertIn('birthPercentiles', body)
        self.assertNotIn('measurements', body)  # No full recalc

    def test_patch_none_on_name_change_only(self):
        baby_id = self._create_baby_base()
        self._stub_percentiles()
        ev_patch = {
            "httpMethod": "PATCH",
            "path": f"/babies/{baby_id}",
            "pathParameters": {"babyId": baby_id},
            "queryStringParameters": {"syncRecalc": "1"},
            "body": '{"name": "Otro"}',
            "requestContext": {}
        }
        resp = baby_service.lambda_handler(ev_patch, None)
        body = json.loads(resp['body'])
        self.assertEqual(body.get('mode'), 'none')
        self.assertTrue(body.get('recalcSkipped'))


if __name__ == "__main__":
    unittest.main()
