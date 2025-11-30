# skribbl
Real-Time Multiplayer Drawing Game (Skribbl Clone)

A high-performance, low-latency multiplayer drawing game built to demonstrate real-time distributed systems concepts and complex state management.

🚀 Key Engineering Features

1. Real-Time Event Architecture (FastAPI + WebSockets)

Unlike standard HTTP Request/Response models, this application maintains persistent bi-directional connections.

Broadcasting Engine: Custom ConnectionManager class handling multicast messaging to specific "Rooms" (sharding).

Concurrency: Leveraging Python's asyncio to handle game loops, timers, and user inputs non-blockingly on a single thread.

2. algorithmic Complexity (Flood Fill)

Implemented a Breadth-First Search (BFS) Flood Fill algorithm for the "Bucket Tool."

Challenge: Recursive DFS causes stack overflow on large canvases.

Solution: Iterative BFS using a queue to process pixel data manipulation on the HTML5 Canvas ImageData buffer efficiently.

3. Distributed State Management

Race Condition Handling: Implemented robust state synchronization to handle edge cases like "Zombie Drawers" (users who disconnect mid-turn).

Turn Fairness: Custom queue logic (turn_queue) ensuring round-robin distribution of drawing privileges, persistent across disconnects.

Optimistic Updates: Frontend renders strokes immediately for zero-latency feel, while asynchronously syncing with the server.

4. Mobile-First Canvas Engine

High DPI Scaling: Mathematical correction for devicePixelRatio to ensure crisp rendering on Retina/OLED screens.

Touch Event Mapping: Custom coordinate translation logic to map DOM Client coordinates to internal Canvas Bitmap coordinates, accounting for CSS scaling and offsets.

🛠 Tech Stack

Backend:

Language: Python 3.10+

Framework: FastAPI (ASGI)

Protocol: WebSockets

Utils: Uvicorn, AsyncIO

Frontend:

Framework: React.js (Vite)

Styling: Tailwind CSS (Modern "Bento" UI)

Graphics: HTML5 Canvas API

Routing: React Router v6

⚡️ Quick Start

Prerequisites

Python 3.10+

Node.js 18+

1. Start Backend

cd backend
python3 -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install fastapi "uvicorn[standard]" websockets
uvicorn main:app --host 0.0.0.0 --port 8000 --reload


2. Start Frontend

cd frontend
npm install
npm run dev -- --host


Open http://localhost:5173 (or your Network IP for mobile testing).

🔮 Future Roadmap

[ ] Redis Integration: Move in-memory dict state to Redis for horizontal scaling across multiple server instances.

[ ] Dockerization: Containerize backend/frontend for easy deployment on AWS ECS/DigitalOcean.