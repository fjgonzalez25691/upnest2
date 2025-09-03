import os, sys, pytest

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'lambdas'))
pytest.importorskip("pandas")

from percentiles.percentiles_service import compute_percentiles


def test_compute_percentiles_keys():
    baby = {"gender": "male", "dateOfBirth": "2024-01-01"}
    meas = {"weight": 7000, "height": 67, "headCircumference": 42}
    result = compute_percentiles(baby, "2024-07-01", meas)
    assert set(result.keys()) == {"weight", "height", "headCircumference"}
