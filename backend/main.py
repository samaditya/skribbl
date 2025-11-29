# backend/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import json
import asyncio
import random

app = FastAPI()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        # The dictionary of words
        self.word_list = ["apple", "tree", "house", "sun", "car", "robot", "cat", "dog", "computer"]
        self.secret_word = "apple" # Default starting word

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

    async def start_new_round(self):
        # 1. Pick a random word
        self.secret_word = random.choice(self.word_list)
        print(f"New word selected: {self.secret_word}") # For server logs
        
        # 2. Tell clients to CLEAR the board and announce new round
        await self.broadcast(json.dumps({
            "type": "new_round",
            "message": "New Round Started! Start guessing!"
        }))

    async def handle_message(self, websocket: WebSocket, data: str):
        try:
            message_data = json.loads(data)
            
            # --- CHAT & WIN LOGIC ---
            if message_data.get("type") == "chat":
                guess = message_data["message"].lower().strip()
                
                # Check for WIN
                if guess == self.secret_word:
                    # 1. Announce Winner
                    await self.broadcast(json.dumps({
                        "type": "chat",
                        "message": f"🎉 Correct! The word was {self.secret_word.upper()}! 🎉",
                        "isSystem": True
                    }))
                    
                    # 2. Wait 3 seconds (Game Pause)
                    await asyncio.sleep(3)
                    
                    # 3. Start New Round
                    await self.start_new_round()
                    return # Exit so we don't broadcast the answer as a chat message

            # --- STANDARD BROADCAST (Drawings & Normal Chat) ---
            await self.broadcast(data)

        except Exception as e:
            print(f"Error handling message: {e}")

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.handle_message(websocket, data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)