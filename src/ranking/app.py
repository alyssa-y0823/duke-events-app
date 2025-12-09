import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(root_dir)

from flask import Flask, request, jsonify
from models.embeddings import Embedder
from scorer import score_events
import numpy as np
import json

app = Flask(__name__)

embedder = Embedder()

# load RAG data
MAJORS_DATA = {}
try:
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    data_path = os.path.join(base_dir, 'data', 'majors.json')
    
    with open(data_path, 'r') as f:
        raw_majors = json.load(f)
        
    # flatten structure
    for category in raw_majors.values():
        prog_list = category.get('programs', [])
        for item in prog_list:
            name = item.get('major', '').lower()
            desc = item.get('description', '')
            MAJORS_DATA[name] = desc
            
except Exception as e:
    print(f"Warning: Could not load majors.json: {e}")

# in memory cache for event embeddings
event_embedding_cache = {}

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model": "loaded", "rag_majors": len(MAJORS_DATA)})

@app.route('/rank', methods=['POST'])
def rank_events():
    """
    Payload:
    {
        "user_profile": {
            "major": "Computer Science",
            "year": "Junior",
            "interests": ["tech", "ai"]
        },
        "events": [
            { "id": "1", "description": "...", "tags": [...], "start_timestamp": ... },
            ...
        ],
        "weights": { "sim": 0.7, "recency": 0.2, "label": 0.1 } (optional)
    }
    """
    data = request.json
    user_profile = data.get('user_profile', {})
    events = data.get('events', [])
    weights = data.get('weights')
    
    if not events:
        return jsonify([])

    # query embedding
    interests_str = " ".join(user_profile.get('interests', []))
    major_name = user_profile.get('major', '').strip()
    year = user_profile.get('year', '')
    
    major_context = ""
    if major_name.lower() in MAJORS_DATA:
        major_context = MAJORS_DATA[major_name.lower()]
    
    query_text = f"{major_name} {major_context} {year} {interests_str}".strip()
        
    if not query_text:
        query_text = "general"

    query_emb = embedder.embed_text(query_text)

    # event embeddings
    batch_texts = []
    batch_ids = []
    
    event_embs_list = []
    
    indices_to_compute = []
    
    for i, event in enumerate(events):
        eid = str(event.get('id'))
        if eid in event_embedding_cache:
            event_embs_list.append(event_embedding_cache[eid])
        else:
            text = f"{event.get('title', '')} {event.get('description', '')} {' '.join(event.get('tags', []))}"
            batch_texts.append(text)
            batch_ids.append(eid)
            event_embs_list.append(None) 
            indices_to_compute.append(i)

    if batch_texts:
        new_embs = embedder.embed_texts(batch_texts)
        for idx, fresh_emb, eid in zip(indices_to_compute, new_embs, batch_ids):
            event_embedding_cache[eid] = fresh_emb
            event_embs_list[idx] = fresh_emb

    ranked_results = score_events(query_emb, event_embs_list, events, user_profile, weights)
    return jsonify(ranked_results)

if __name__ == '__main__':
    app.run(port=5001, debug=True)
