# Duke Events & Ranking System

A relevance-based event recommendation system for Duke University students, replacing chronological sorting with personalized ranking.

## What it Does
This project transforms the native Duke Events application into a personalized discovery platform. Instead of a simple date-based list, it uses a hybrid ranking algorithm that combines **semantic similarity** (matching event descriptions to user interests), **keyword matching** (using RAG-augmented major descriptions), and **recency** options. Users can control the balance between finding "relevant" events vs. "recent" events via a slider in the mobile app.

## Quick Start
1.  **Install Dependencies**:
    -   Ranking Service: `pip install -r src/requirements.txt`
    -   Backend: `cd src/backend && npm install`
    -   Mobile: `cd src/mobile/duke-events && npm install`

2.  **Run Services**:
    -   Start standard services:
        ```bash
        # Terminal 1: Python Ranking Service
        python src/ranking/app.py
        
        # Terminal 2: Node Backend
        npm start --prefix src/backend
        
        # Terminal 3: Mobile App
        npm start --prefix src/mobile/duke-events
        ```

3.  **Use the App**:
    -   Open the app in Expo Go.
    -   Select your Major and Interests (e.g., "Computer Science", "Electrical & Computer Engineering").
    -   On the Home Screen, slide the "Prioritize" slider to "Relevance" to see the ranking algorithm in action.

## Video Links
-   **Demo Video**: [See videos/demo.mp4](videos/demo.mp4) (Placeholder)
-   **Technical Walkthrough**: [See videos/walkthrough.mp4](videos/walkthrough.mp4) (Placeholder)

## Evaluation
We evaluated the ranking system using unit tests and qualitative manual verification.
-   **Quantitative**: Unit tests in `src/ranking/tests` confirm the scoring arithmetic. For a user profile interested in "tech", events with "robotics" tags consistently score higher (>0.5) than unrelated events (<0.2).
-   **Qualitative**: RAG integration significantly improves relevance for broad major names. For example, a "Biology" major now matches events mentioning "ecology" or "genome" even if the word "biology" isn't explicitly present, thanks to the augmented context from `majors.json`.
-   **Performance**: The FAISS/embedding lookup is efficient (<100ms) for the current event volume.

## Individual Contributions
-   **Alyssa (User)**: Project architecture, API design, RAG data integration, and frontend implementation.
-   **Antigravity (AI)**: Assisted with Python ranking logic (embeddings, scoring), React Native UI components, and unit testing.
