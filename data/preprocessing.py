
import requests
import json
import os
from datetime import datetime, timezone

def fetch_raw_events(future_days=30):
    print(f"Fetching Duke events for next {future_days} days...")
    url = f"https://calendar.duke.edu/events/index.json?future_days={future_days}"
    try:
        resp = requests.get(url)
        resp.raise_for_status()
        data = resp.json()
        return data.get('events', [])
    except Exception as e:
        print(f"Error fetching: {e}")
        return []

def clean_event_data(raw_events):
    stats = {
        "total_raw": len(raw_events),
        "removed_duplicates": 0,
        "removed_invalid_dates": 0,
        "filled_missing_desc": 0,
        "normalized_text": 0
    }
    
    cleaned_events = []
    seen_ids = set()
    seen_signatures = set() # Title + StartTime

    print(f"Starting preprocessing on {len(raw_events)} raw events...")

    for item in raw_events:
        # 1. Unpack (Duke API structure is { event: {...} })
        ev = item.get('event', {})
        
        # 2. Date Validation
        start_ts = None
        if 'start' in ev and 'utcdate' in ev['start']:
            ds = ev['start']['utcdate']
            try:
                # Format: YYYYMMDDTHHMMSSZ
                dt = datetime.strptime(ds, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
                start_ts = dt.timestamp()
            except ValueError:
                pass
        
        if start_ts is None:
            stats["removed_invalid_dates"] += 1
            continue

        # 3. Deduplication
        eid = ev.get('id', '')
        title = ev.get('summary', '').strip()
        
        # Signature for content-based dedup
        signature = f"{title}_{start_ts}"
        
        if eid in seen_ids or signature in seen_signatures:
            stats["removed_duplicates"] += 1
            continue
            
        seen_ids.add(eid)
        seen_signatures.add(signature)

        # 4. Text Cleaning / Normalization
        description = ev.get('description', '')
        if not description or description.isspace():
            description = "No description provided."
            stats["filled_missing_desc"] += 1
        
        # Normalize whitespace in title/desc
        original_title = ev.get('summary', '')
        clean_title = " ".join(original_title.split())
        clean_desc = " ".join(description.split())
        
        if clean_title != original_title or clean_desc != ev.get('description', ''):
            stats["normalized_text"] += 1

        # Construct Clean Object
        cleaned_obj = {
            "id": eid,
            "title": clean_title,
            "description": clean_desc,
            "start_timestamp": start_ts,
            "tags": [] 
            # (Simplified tag logic for this script)
        }
        
        cleaned_events.append(cleaned_obj)

    stats["final_count"] = len(cleaned_events)
    return cleaned_events, stats

def run_pipeline():
    raw_events = fetch_raw_events()
    cleaned_events, stats = clean_event_data(raw_events)
    
    print("\n" + "="*50)
    print("PREPROCESSING PIPELINE REPORT")
    print("="*50)
    print(f"Input Events:          {stats['total_raw']}")
    print(f"Removed (Duplicates):  {stats['removed_duplicates']}")
    print(f"Removed (Bad Dates):   {stats['removed_invalid_dates']}")
    print("-" * 30)
    print(f"Modified (No Desc):    {stats['filled_missing_desc']}")
    print(f"Modified (Whitespace): {stats['normalized_text']}")
    print("-" * 30)
    print(f"Final Valid Events:    {stats['final_count']}")
    print("="*50)

if __name__ == "__main__":
    run_pipeline()
