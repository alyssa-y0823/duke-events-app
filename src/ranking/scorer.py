from datetime import datetime
import numpy as np

def calculate_recency_score(event_time_str):
    try:
        if isinstance(event_time_str, str):
            event_date = datetime.fromisoformat(event_time_str.replace('Z', '+00:00'))
        elif isinstance(event_time_str, (int, float)):
            # Assume UTC timestamp
            from datetime import timezone
            event_date = datetime.fromtimestamp(event_time_str, tz=timezone.utc)
        else:
            return 0.0
            
        now = datetime.now(event_date.tzinfo)
        delta = event_date - now
        days = delta.days

        if days < 0:        # event already passed
            return 0.0 
        
        # linear decay over 30 days
        score = max(0.0, 1.0 - (days / 30.0))
        return score
    except Exception as e:
        print(f"Error calculating recency: {e}")
        return 0.0

def score_events(query_emb, event_embs, event_metadata, user_profile, weights=None):
    """
    Score events based on:
    1. Semantic similarity (query_emb vs event_embs)
    2. Label matching (user_profile vs event tags)
    3. Recency
    
    weights: dict with keys 'sim', 'label', 'recency'
    """
    if weights is None:
        weights = {'sim': 0.7, 'label': 0.1, 'recency': 0.2}

    scored_events = []
    
    # Pre-calculate query embedding normalization if not done, but we assume it is.
    
    for i, event in enumerate(event_metadata):
        # 1. semantic similarity
        
        sim_score = np.dot(query_emb, event_embs[i])
        sim_score = float(max(0.0, min(1.0, sim_score))) # clip to 0-1

        # 2. label match
        user_interests = [x.lower() for x in user_profile.get('interests', [])]
        event_tags = [x.lower() for x in event.get('tags', [])]
        
        matches = 0
        if user_interests:
            matches = sum(1 for tag in event_tags if any(intr in tag for intr in user_interests))
            label_score = float(min(1.0, matches / len(user_interests)))
        else:
            label_score = 0.0

        # 3. recency
        recency_score = float(calculate_recency_score(event.get('start_timestamp')))

        # final score
        final_score = float(
            weights['sim'] * sim_score + 
            weights['label'] * label_score + 
            weights['recency'] * recency_score
        )
        
        scored_events.append({
            'id': event['id'],
            'score': round(final_score, 2),
            'details': {
                'sim': round(sim_score, 2),
                'label': round(label_score, 2), 
                'recency': round(recency_score, 2)
            }
        })

    scored_events.sort(key=lambda x: x['score'], reverse=True)
    return scored_events
