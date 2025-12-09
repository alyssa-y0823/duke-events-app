
import time
import sys
import os
import requests
from datetime import datetime, timezone
import numpy as np

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

def run_benchmark():
    print("Initialize Embedder...")
    start_load = time.time()
    embedder = Embedder()
    load_time = time.time() - start_load
    print(f"Model Load Time: {load_time:.4f}s")

    events = fetch_events_local()
    if not events:
        print("No events found to benchmark.")
        return
        
    print(f"\nBenchmarking with {len(events)} events.")

    # 1. embedding throughput (batch)
    event_texts = [f"{e['title']} {e['description']} {' '.join(e['tags'])}" for e in events]
    
    print("\n[Metric 1] Embedding Generation")
    start_embed = time.time()
    _ = embedder.embed_texts(event_texts)
    total_embed_time = time.time() - start_embed
    
    avg_latency_per_event = (total_embed_time / len(events)) * 1000 # ms
    throughput = len(events) / total_embed_time # events/sec
    
    print(f"Total Time: {total_embed_time:.4f}s")
    print(f"Average Latency per Event: {avg_latency_per_event:.2f} ms")
    print(f"Throughput: {throughput:.2f} events/sec")

    # 2. inference time (ranking 1 user against N events)
    event_embs = embedder.embed_texts(event_texts)
    
    profile = {
        "major": "Computer Science",
        "interests": ["coding", "hackathon"],
        "year": "Junior"
    }
    
    print("\n[Metric 2] Inference / Ranking Time")
    query_text = "Computer Science coding hackathon"
    
    start_q = time.time()
    query_emb = embedder.embed_text(query_text)
    query_time_ms = (time.time() - start_q) * 1000
    
    start_score = time.time()
    _ = score_events(query_emb, event_embs, events, profile)
    score_time_ms = (time.time() - start_score) * 1000
    
    total_inference = query_time_ms + score_time_ms
    
    print(f"Query Embedding Latency: {query_time_ms:.2f} ms")
    print(f"Scoring Latency (N={len(events)}): {score_time_ms:.2f} ms")
    print(f"Total End-to-End Inference: {total_inference:.2f} ms")

    # 3. efficiency report
    print("\n" + "="*50)
    print("PERFORMANCE REPORT SUMMARY")
    print("="*50)
    print(f"Events Processed: {len(events)}")
    print(f"Throughput (Embedding): {throughput:.2f} events/sec")
    print(f"Latencies:")
    print(f"  - Per Event Embed: {avg_latency_per_event:.2f} ms")
    print(f"  - Query Embed:     {query_time_ms:.2f} ms")
    print(f"  - Scoring (Rank):  {score_time_ms:.2f} ms")
    print("="*50)

if __name__ == "__main__":
    run_benchmark()
