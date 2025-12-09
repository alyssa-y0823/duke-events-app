
import requests
import json
import sys
import os
from datetime import datetime, timezone

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from models.embeddings import Embedder
from scorer import score_events

def fetch_duke_events(future_days=30):
    print(f"Fetching Duke events for next {future_days} days...")
    url = f"https://calendar.duke.edu/events/index.json?future_days={future_days}"
    try:
        resp = requests.get(url)
        resp.raise_for_status()
        data = resp.json()
        raw_events = data.get('events', [])
        
        parsed_events = []
        for index, item in enumerate(raw_events):
            ev = item.get('event', {})
            
            # basic parsing
            start_ts = None
            if 'start' in ev and 'utcdate' in ev['start']:
                ds = ev['start']['utcdate']
                # format: YYYYMMDDTHHMMSSZ
                try:
                    dt = datetime.strptime(ds, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
                    start_ts = dt.timestamp()
                except ValueError:
                    pass
            
            # categories/Tags
            tags = []
            if 'categories' in ev and 'category' in ev['categories']:
                cats = ev['categories']['category']
                if isinstance(cats, list):
                    tags = [c.get('value', '') for c in cats]
                elif isinstance(cats, dict):
                     tags = [cats.get('value', '')]

            parsed_events.append({
                'id': ev.get('id', f"evt-{index}"),
                'title': ev.get('summary', 'No Title'),
                'description': ev.get('description', ''),
                'tags': tags,
                'start_timestamp': start_ts,
                'link': ev.get('link', '')
            })
            
        valid_events = [e for e in parsed_events if e['start_timestamp'] is not None]
        print(f"Fetched {len(valid_events)} valid events.")
        return valid_events
    except Exception as e:
        print(f"Error fetching events: {e}")
        return []

def run_comparison():
    # setup
    embedder = Embedder()
    events = fetch_duke_events()
    
    if not events:
        print("No events found. Exiting.")
        return

    # pre-compute event embeddings
    print("Generating event embeddings...")
    event_texts = [
        f"{e['title']} {e['description']} {' '.join(e['tags'])}" 
        for e in events
    ]
    event_embs = embedder.embed_texts(event_texts)

    # profiles
    profiles = [
        {
            "name": "CS Student",
            "major": "Computer Science",
            "interests": ["coding", "hackathon", "technology", "software", "engineering"]
        },
        {
            "name": "Arts Student",
            "major": "Visual Arts",
            "interests": ["music", "gallery", "performance", "theater", "dance", "culture"]
        },
        {
            "name": "Sports Fan",
            "major": "Undeclared",
            "interests": ["basketball", "football", "athletics", "game", "sports"]
        }
    ]

    # baseline (chronological)
    baseline_sorted = sorted(events, key=lambda x: x['start_timestamp'])
    baseline_top_5 = baseline_sorted[:5]

    print("\n" + "="*60)
    print("BASELINE MODEL (Chronological / Default)")
    print("Everyone sees the same list:")
    for i, e in enumerate(baseline_top_5, 1):
        dt_str = datetime.fromtimestamp(e['start_timestamp']).strftime('%Y-%m-%d %H:%M')
        print(f"{i}. [{dt_str}] {e['title'][:60]}")
    print("="*60 + "\n")

    # heuristic model (keyword match)
    print("HEURISTIC MODEL (Keyword Match)")
    for profile in profiles:
        print(f"PROFILE: {profile['name']} (Interests: {', '.join(profile['interests'])})")
        
        # simple scoring: count matches of interests in title/desc/tags
        scored_events = []
        user_terms = [t.lower() for t in profile['interests']]
        if profile.get('major'):
            user_terms.append(profile['major'].lower())

        for ev in events:
            # prepare searchable text
            text = (ev['title'] + " " + ev['description'] + " " + " ".join(ev['tags'])).lower()
            
            score = 0
            matches = 0
            for term in user_terms:
                if term in text:
                    matches += 1
            
            # potential matches
            if user_terms:
                score = matches / len(user_terms)
            
            scored_events.append({
                'id': ev['id'],
                'score': score,
                'title': ev['title']
            })
        
        scored_events.sort(key=lambda x: x['score'], reverse=True)
        top_5 = scored_events[:5]

        print("Top 5 Recommendations:")
        for i, item in enumerate(top_5, 1):
             print(f"{i}. [Score: {item['score']:.2f}] {item['title'][:60]}")
        print("-" * 40)
    print("="*60 + "\n")

    # ml model (semantic + recency + label)
    print("ML MODEL (Semantic + Recency + Label)")
    weights = {'sim': 0.7, 'label': 0.1, 'recency': 0.2}

    for profile in profiles:
        print(f"PROFILE: {profile['name']} (Interests: {', '.join(profile['interests'])})")
        
        query_text = f"{profile['major']} {' '.join(profile['interests'])}"
        query_emb = embedder.embed_text(query_text)
        
        ranked = score_events(query_emb, event_embs, events, profile, weights)
        top_5 = ranked[:5]
        
        print("Top 5 Recommendations:")
        for i, item in enumerate(top_5, 1):
            # find original event data for display
            orig = next((e for e in events if e['id'] == item['id']), None)
            if orig:
                print(f"{i}. [Score: {item['score']:.2f}] {orig['title'][:60]}")
                print(f"  (Sim: {item['details']['sim']}, Lbl: {item['details']['label']}, Rec: {item['details']['recency']})")
        print("-" * 40)

if __name__ == "__main__":
    run_comparison()
