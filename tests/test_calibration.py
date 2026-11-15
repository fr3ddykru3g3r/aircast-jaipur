"""Regression tests for the observed interval rank bug and invalid calibration."""
import unittest
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from train import calibration_radius

class CalibrationTests(unittest.TestCase):
    def test_exact_order_statistic(self):
        # ceil(185 * .8) = 148, so the 148th residual must be selected.
        self.assertEqual(calibration_radius(list(range(1,185))),148)

    def test_unsorted_inputs(self):
        self.assertEqual(calibration_radius([5,2,1,4,3]),5)

    def test_invalid_inputs(self):
        for residuals in [[],[1,2],[0,float('nan'),1,2],[-1,0,1,2],[[1,2],[3,4]]]:
            with self.subTest(residuals=residuals), self.assertRaises(ValueError):
                calibration_radius(residuals)

    def test_invalid_coverage(self):
        for coverage in [0,1,1.1]:
            with self.subTest(coverage=coverage), self.assertRaises(ValueError):
                calibration_radius([1,2,3,4],coverage)

if __name__=='__main__':
    unittest.main()
