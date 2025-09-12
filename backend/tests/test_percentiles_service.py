import os, sys, unittest

LAMBDA_PATH = os.path.join(os.path.dirname(__file__), '..', 'lambdas')
if LAMBDA_PATH not in sys.path:
    sys.path.insert(0, LAMBDA_PATH)

try:
    from percentiles.percentiles_service import compute_percentiles
except Exception:
    compute_percentiles = None


class TestPercentilesService(unittest.TestCase):
    def test_compute_percentiles_keys(self):
        if compute_percentiles is None:
            self.skipTest("percentiles service not available")
        baby = {"gender": "male", "dateOfBirth": "2024-01-01"}
        meas = {"weight": 7000, "height": 67, "headCircumference": 42}
        result = compute_percentiles(baby, "2024-07-01", meas)
        self.assertEqual(set(result.keys()), {"weight", "height", "headCircumference"})


if __name__ == '__main__':
    unittest.main()
