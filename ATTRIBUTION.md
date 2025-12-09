# Attribution

## External Libraries
- **Sentence-Transformers**: Used for generating semantic embeddings (`all-MiniLM-L6-v2` model). [Documentation](https://www.sbert.net/)
- **FAISS (Facebook AI Similarity Search)**: Used for efficient similarity search. [GitHub](https://github.com/facebookresearch/faiss)
- **Flask**: Python microframework for the ranking service API. [Website](https://flask.palletsprojects.com/)
- **Express.js**: Node.js web framework for the backend. [Website](https://expressjs.com/)
- **React Native & Expo**: Framework for the mobile application. [Website](https://expo.dev/)
- **@react-native-community/slider**: Slider component for the UI. [GitHub](https://github.com/callstack/react-native-slider)

## Datasets
- **Duke Calendar API**: Event data is fetched dynamically from the Duke University public calendar feed (`https://calendar.duke.edu/events/index.json`).
- **Majors Data**: `data/majors.json` contains descriptions of Duke University majors for the RAG system.

## AI-Generated Code
- Portions of this codebase were developed with assistance from Claude (Anthropic AI assistant), particularly:
    - Testing infrastructure
    - Code structure and error handling pattern