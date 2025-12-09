
import requests
import sys
import os
import numpy as np
from datetime import datetime, timezone

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from models.embeddings import Embedder
from scorer import score_events

def fetch_events_local():
    print(f"Fetching Duke events...")
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

def run_evaluation():
    embedder = Embedder()
    events = fetch_events_local()
    if not events:
        print("No events.")
        return

    print(f"Embedding {len(events)} events...")
    event_texts = [f"{e['title']} {e['description']} {' '.join(e['tags'])}" for e in events]
    event_embs = embedder.embed_texts(event_texts)

    profile = {
        "major": "Computer Science",
        "interests": ["coding", "hackathon", "technology", "artificial intelligence"],
        "year": "Junior"
    }
    
    # prompt strategies
    prompts = {
        "Strategy 1 (Tags)": "Computer Science coding hackathon technology artificial intelligence",
        "Strategy 2 (Natural)": "I am a Junior Computer Science student interested in coding, hackathons, technology, and artificial intelligence.",
        "Strategy 3 (Role-Play)": "Target Persona: Computer Science Student. Key Interests: coding, hackathon, technology, artificial intelligence. Context: Academic and social events."
    }

    # weights (focus on similarity to see prompt effect)
    weights = {'sim': 0.8, 'label': 0.1, 'recency': 0.1}

    print("\n" + "="*80)
    print(f"PROMPT EVALUATION: {profile['major']}")
    print("Comparing different query construction strategies for the same user profile.")
    print("="*80)

    results_table = []

    for name, text in prompts.items():
        print(f"\n--- {name} ---")
        print(f"Query Text: \"{text}\"")
        
        query_emb = embedder.embed_text(text)
        ranked = score_events(query_emb, event_embs, events, profile, weights)
        
        top_3 = ranked[:3]
        row = [name]
        for item in top_3:
            orig = next((e for e in events if e['id'] == item['id']), None)
            title = orig['title'] if orig else "Unknown"
            score = item['score']
            print(f"  {score:.2f} | {title[:60]}")
            row.append(f"{title[:40]}... ({score:.2f})")
        results_table.append(row)

    # print comparison table
    print("\n" + "="*80)
    print(f"{'Strategy':<25} | {'Rank 1':<45} | {'Rank 2':<45} | {'Rank 3':<45}")
    print("-" * 160)
    for row in results_table:
        print(f"{row[0]:<25} | {row[1]:<45} | {row[2]:<45} | {row[3]:<45}")
    print("="*80)

if __name__ == "__main__":
    run_evaluation()
