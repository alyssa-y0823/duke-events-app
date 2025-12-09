
import sys
import os
import requests
from datetime import datetime, timezone

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from models.embeddings import Embedder
from scorer import score_events

def fetch_events_local():
    url = f"https://calendar.duke.edu/events/index.json?future_days=30"
    try:
        resp = requests.get(url)
        if resp.status_code != 200: return []
        data = resp.json()
        raw_events = data.get('events', [])
        parsed = []
        for index, item in enumerate(raw_events):
            ev = item.get('event', {})
            start_ts = None
            if 'start' in ev and 'utcdate' in ev['start']:
                ds = ev['start']['utcdate']
                try:
                    dt = datetime.strptime(ds, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
                    start_ts = dt.timestamp()
                except: pass
            
            tags = []
            if 'categories' in ev and 'category' in ev['categories']:
                cats = ev['categories']['category']
                if isinstance(cats, list): tags = [c.get('value', '') for c in cats]
                elif isinstance(cats, dict): tags = [cats.get('value', '')]

            parsed.append({
                'id': ev.get('id', f"evt-{index}"),
                'title': ev.get('summary', 'No Title'),
                'description': ev.get('description', ''),
                'tags': tags,
                'start_timestamp': start_ts,
            })
        return [e for e in parsed if e['start_timestamp']]
    except Exception as e:
        print(e)
        return []

def run_ablation():
    embedder = Embedder()
    events = fetch_events_local()
    if not events:
        print("No events found.")
        return

    print(f"Embedding {len(events)} events...")
    event_texts = [f"{e['title']} {e['description']} {' '.join(e['tags'])}" for e in events]
    event_embs = embedder.embed_texts(event_texts)

    # use consistent profile for all tests
    profile = {
        "name": "Arts Student",
        "major": "Visual Arts",
        "interests": ["music", "gallery", "performance", "theater", "dance"]
    }
    
    # use best prompt strategy found (Role-Playing)
    query_text = f"Target Persona: {profile['major']} Student. Key Interests: {', '.join(profile['interests'])}. Context: Academic and social events."
    query_emb = embedder.embed_text(query_text)

    # scenarios
    scenarios = {
        "Baseline (Balanced)": {'sim': 0.7, 'label': 0.1, 'recency': 0.2},
        "Ablation: No Semantic": {'sim': 0.0, 'label': 0.5, 'recency': 0.5},
        "Ablation: No Recency": {'sim': 0.9, 'label': 0.1, 'recency': 0.0},
        "Ablation: No Label": {'sim': 0.8, 'label': 0.0, 'recency': 0.2} 
    }

    print("\n" + "="*80)
    print(f"ablation study: {profile['name']}")
    print(f"query: {query_text}")
    print("="*80)

    for name, weights in scenarios.items():
        print(f"\n--- {name} ---")
        print(f"Weights: {weights}")
        
        ranked = score_events(query_emb, event_embs, events, profile, weights)
        top_3 = ranked[:3]
        
        for i, item in enumerate(top_3, 1):
            orig = next((e for e in events if e['id'] == item['id']), None)
            title = orig['title'] if orig else "Unknown"
            print(f"  {i}. [Score: {item['score']:.2f}] {title[:60]}")
            print(f"     (Sim: {item['details']['sim']:.2f}, Lbl: {item['details']['label']:.2f}, Rec: {item['details']['recency']:.2f})")

    print("\n" + "="*80)

if __name__ == "__main__":
    run_ablation()
