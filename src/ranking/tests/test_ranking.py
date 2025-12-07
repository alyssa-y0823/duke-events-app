import unittest
import json
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

class TestRankingUntegration(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_rank_endpoint(self):
        payload = {
            "user_profile": {
                "major": "CS",
                "year": "Junior",
                "interests": ["tech"]
            },
            "events": [
                {
                    "id": "1",
                    "title": "Robotics Workshop",
                    "description": "Learn about robots and tech.",
                    "tags": ["technology", "engineering"],
                    "start_timestamp": "2024-12-01T12:00:00Z"
                },
                {
                    "id": "2",
                    "title": "History Seminar",
                    "description": "Learn about ancient history.",
                    "tags": ["history", "arts"],
                    "start_timestamp": "2024-12-01T12:00:00Z"
                }
            ],
            "weights": {"sim": 0.8, "label": 0.2, "recency": 0.0}
        }
        
        response = self.app.post('/rank', 
                                 data=json.dumps(payload),
                                 content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        data = response.json
        
        # Expect Event 1 to be first because "tech" matches "Robotics" and "technology"
        self.assertEqual(data[0]['id'], '1')
        self.assertTrue(data[0]['score'] > data[1]['score'])
        print(f"Scores: Event 1 ({data[0]['score']}), Event 2 ({data[1]['score']})")

if __name__ == '__main__':
    unittest.main()
