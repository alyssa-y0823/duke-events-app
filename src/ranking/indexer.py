import faiss
import numpy as np

class EventIndexer:
    def __init__(self, dimension=384):
        # get index through inner product (cosine similarity bc vectors are normalized)
        self.index = faiss.IndexFlatIP(dimension)
        self.event_ids = [] # map faiss index to event ids

    def build_index(self, embeddings, event_ids):
        self.event_ids = event_ids
        vectors = np.array(embeddings).astype('float32')
        self.index.reset()
        self.index.add(vectors)

    def search(self, query_emb, k=20):
        query_vector = np.array([query_emb]).astype('float32')
        distances, indices = self.index.search(query_vector, k)
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx != -1 and idx < len(self.event_ids):
                results.append((self.event_ids[idx], float(dist)))
                
        return results
