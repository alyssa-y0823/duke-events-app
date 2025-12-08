# Setup Instructions

## Prerequisites
- **Python 3.8+**: Required for the ranking service.
- **Node.js 14+**: Required for the backend and mobile app (Expo).
- **npm** or **yarn**: Package manager.

## 1. Ranking Service (Python)
The ranking service provides the core relevance logic (embeddings, scoring).

1.  Navigate to the ranking source directory:
    ```bash
    cd src/ranking
    ```
2.  Install dependencies:
    ```bash
    pip install -r ../../requirements.txt
    ```
3.  Start the service:
    ```bash
    python app.py
    ```
    - Runs on: `http://localhost:5001`
    - Verify: `curl http://localhost:5001/health`

## 2. Backend (Node.js)
The backend proxies requests and handles the calendar API.

1.  Navigate to the backend directory:
    ```bash
    cd src/backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    npm start
    ```
    - Runs on: `http://localhost:3000`

## 3. Mobile App (React Native/Expo)
The frontend user interface.

1.  Navigate to the mobile app directory:
    ```bash
    cd src/mobile/duke-events
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start Expo:
    ```bash
    npm start
    ```
    - Scan the QR code with the Expo Go app (iOS/Android) or press `i` for iOS simulator / `a` for Android emulator.

## Data Files
- **`data/majors.json`**: Contains major descriptions used for RAG. Ensure this file exists in the root `data/` directory.

## Troubleshooting
- **Service Connection**: Ensure the ranking service (port 5000) is running before ranking events in the app.
- **Major List Empty**: Check that the backend can read `data/majors.json`.
