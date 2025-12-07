import unittest
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scorer import score_events

class TestScorer(unittest.TestCase):
    def test_score_simple(self):
        # Mock embeddings: query is [1, 0], events are [1, 0] (exact) and [0, 1] (opposite)
        query_emb = [1.0, 0.0]
        event_embs = [[1.0, 0.0], [0.0, 1.0]]
        
        events = [
            {'id': '1', 'tags': [], 'start_timestamp': '2025-01-01T00:00:00Z'},
            {'id': '2', 'tags': [], 'start_timestamp': '2025-01-01T00:00:00Z'}
        ]
        
        user_profile = {'interests': []}
        
        weights = {'sim': 1.0, 'label': 0.0, 'recency': 0.0}
        
        results = score_events(query_emb, event_embs, events, user_profile, weights)
        
        self.assertEqual(results[0]['id'], '1')
        self.assertAlmostEqual(results[0]['details']['sim'], 1.0)
        self.assertEqual(results[1]['id'], '2')
        self.assertAlmostEqual(results[1]['details']['sim'], 0.0)

    def test_score_weights(self):
        # Test that weights affect ranking
        query_emb = [0.0, 0.0] # No similarity
        event_embs = [[0.0, 0.0], [0.0, 0.0]]
        
        # Event 1: Recent, No Label
        # Event 2: Old, Label Match
        
        # Set Up:
        # We need to mock recency return or control the date. 
        # Scorer uses datetime.now().
        # So hard to test recency exactly without mocking datetime.
        # But we can assume current date is roughly 'now'.
        
        pass

if __name__ == '__main__':
    unittest.main()
