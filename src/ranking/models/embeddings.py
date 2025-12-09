from sentence_transformers import SentenceTransformer
import numpy as np

class Embedder:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)
        self.cache = {}

    def embed_text(self, text):
        if text in self.cache:
            return self.cache[text]
        
        embedding = self.model.encode([text])[0]
        # normalize for cosine similarity
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm
            
        self.cache[text] = embedding
        return embedding

    def embed_texts(self, texts):
        return [self.embed_text(text) for text in texts]
