import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from reporacer_demo import normalize_title


class NormalizeTitleTest(unittest.TestCase):
    def test_collapses_whitespace_and_title_cases(self) -> None:
        self.assertEqual(normalize_title("  repo   racer "), "Repo Racer")


if __name__ == "__main__":
    unittest.main()
