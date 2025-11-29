from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, List, Optional
import json
import asyncio
import random

app = FastAPI()

# --- CONFIGURATION ---
ROUND_DURATION = 60

class Room:
    def __init__(self, room_id: str):
        self.room_id = room_id
        self.active_connections: List[WebSocket] = []
        self.drawer: Optional[WebSocket] = None
        self.word: str = ""
        self.word_hint: str = ""
        self.scores: Dict[WebSocket, int] = {}
        self.names: Dict[WebSocket, str] = {}
        self.game_task: Optional[asyncio.Task] = None
        self.guessed_count = 0
        
        # Fair Turn System
        self.turn_queue: List[WebSocket] = [] 

class ConnectionManager:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}
        # Extended word list
        self.word_list = [
            "apple", "banana", "cherry", "date", "elderberry", "fig", "grape", 
            "house", "sun", "robot", "computer", "python", "guitar", "ocean", 
            "mountain", "river", "jungle", "space", "rocket", "pizza", "burger",
            "cat", "dog", "elephant", "giraffe", "lion", "tiger", "bear",
            "pencil", "book", "laptop", "phone", "watch", "glasses", "shoe"
        ]

    async def connect(self, websocket: WebSocket, room_id: str, name: str):
        await websocket.accept()
        
        # Create room if it doesn't exist
        if room_id not in self.rooms:
            self.rooms[room_id] = Room(room_id)
            print(f"Created Room: {room_id}")

        room = self.rooms[room_id]
        room.active_connections.append(websocket)
        room.names[websocket] = name
        
        # Initialize score for new player
        if websocket not in room.scores:
            room.scores[websocket] = 0

        # Sync State: Tell the new player what is happening RIGHT NOW
        current_role = "guesser"
        if room.drawer == websocket: 
            current_role = "drawer"
        
        # If the drawer is hidden (mid-round join), show underscore hint. Otherwise show real word.
        display_word = room.word_hint
        if current_role == "drawer":
            display_word = room.word

        await websocket.send_text(json.dumps({
            "type": "game_state",
            "role": current_role,
            "word": display_word,
            "scores": self.get_leaderboard(room)
        }))

        # If we have at least 2 people and no game is running, start one!
        if len(room.active_connections) >= 2 and not room.game_task:
            await self.start_round(room_id)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.rooms:
            room = self.rooms[room_id]
            
            # Clean up all references to this socket
            if websocket in room.active_connections:
                room.active_connections.remove(websocket)
            if websocket in room.names:
                del room.names[websocket]
            if websocket in room.scores:
                del room.scores[websocket]
            if websocket in room.turn_queue:
                room.turn_queue.remove(websocket)
            
            # CRITICAL: If the current drawer left, reset the round immediately
            if room.drawer == websocket:
                print(f"Drawer left room {room_id}. Resetting round.")
                room.drawer = None
                if room.game_task: 
                    room.game_task.cancel()
                
                # If enough players remain, start a new round
                if len(room.active_connections) >= 2:
                    asyncio.create_task(self.start_round(room_id))
            
            # Garbage Collection: If room is empty, delete it
            if not room.active_connections:
                if room.game_task: 
                    room.game_task.cancel()
                del self.rooms[room_id]
                print(f"Room {room_id} deleted (empty).")

    def get_leaderboard(self, room: Room):
        leaderboard = []
        for sock, score in room.scores.items():
            if sock in room.names:
                leaderboard.append({"name": room.names[sock], "score": score})
        # Sort descending by score
        return sorted(leaderboard, key=lambda x: x['score'], reverse=True)

    async def broadcast(self, message: dict, room_id: str):
        if room_id in self.rooms:
            room = self.rooms[room_id]
            json_msg = json.dumps(message)
            # Loop over a COPY [:] to avoid errors if a user disconnects mid-loop
            for connection in room.active_connections[:]:
                try:
                    await connection.send_text(json_msg)
                except:
                    # If sending fails, assume they are dead and clean up
                    self.disconnect(connection, room_id)

    async def start_round(self, room_id: str):
        room = self.rooms.get(room_id)
        if not room or len(room.active_connections) < 2:
            print(f"Not enough players in {room_id} to start.")
            return

        if room.game_task: 
            room.game_task.cancel()

        # --- 1. DRAWER SELECTION (Fair Queue) ---
        # Refill queue if empty
        if not room.turn_queue:
            print(f"Refilling turn queue for {room_id}...")
            # Create a fresh list of everyone currently connected
            room.turn_queue = list(room.active_connections)
            random.shuffle(room.turn_queue)

        # Pick the next person who is VALID (still connected)
        room.drawer = None
        while room.turn_queue:
            candidate = room.turn_queue.pop(0)
            if candidate in room.active_connections:
                room.drawer = candidate
                break
        
        # If we failed to find a drawer (e.g., everyone in queue disconnected), retry or abort
        if not room.drawer:
            if room.active_connections: 
                await self.start_round(room_id)
            return
        # ----------------------------------------

        # --- 2. GAME SETUP ---
        room.word = random.choice(self.word_list)
        room.word_hint = "_ " * len(room.word)
        room.guessed_count = 0
        
        drawer_name = room.names[room.drawer]
        print(f"Starting round in {room_id}. Drawer: {drawer_name}, Word: {room.word}")

        # --- 3. NOTIFY PLAYERS ---
        # Send specific message to Drawer (showing the word)
        await room.drawer.send_text(json.dumps({
            "type": "new_round",
            "role": "drawer",
            "word": room.word,
            "drawer_name": drawer_name, # FIXED: Ensure drawer knows their own name
            "round_time": ROUND_DURATION
        }))

        # Send specific message to Guessers (showing underscores)
        for sock in room.active_connections:
            if sock != room.drawer:
                await sock.send_text(json.dumps({
                    "type": "new_round",
                    "role": "guesser",
                    "word": room.word_hint,
                    "drawer_name": drawer_name,
                    "round_time": ROUND_DURATION
                }))

        # --- 4. START TIMER ---
        room.game_task = asyncio.create_task(self.game_timer(room_id))

    async def game_timer(self, room_id: str):
        room = self.rooms.get(room_id)
        if not room: return
        try:
            for seconds_left in range(ROUND_DURATION, -1, -1):
                # Tick: Update time
                await self.broadcast({"type": "timer", "time": seconds_left}, room_id)
                
                # Hints: Reveal letters at 30s and 15s
                if seconds_left in [30, 15]: 
                    await self.reveal_hint(room)
                
                # End: Time ran out
                if seconds_left == 0:
                    await self.broadcast({
                        "type": "chat", 
                        "message": f"⏰ Time's up! The word was {room.word.upper()}", 
                        "isSystem": True
                    }, room_id)
                    await asyncio.sleep(3)
                    await self.start_round(room_id)
                    return
                
                await asyncio.sleep(1)
        except asyncio.CancelledError:
            pass # Task was cancelled (round ended early)

    async def reveal_hint(self, room: Room):
        real_word_list = list(room.word)
        current_hint_list = room.word_hint.split(" ")
        
        # Find all indices that are still hidden
        hidden_indices = [i for i, x in enumerate(current_hint_list) if x == "_"]
        
        if hidden_indices:
            idx = random.choice(hidden_indices)
            current_hint_list[idx] = real_word_list[idx]
            room.word_hint = " ".join(current_hint_list)
            
            await self.broadcast({
                "type": "hint_update", 
                "word": room.word_hint
            }, room.room_id)

    async def handle_message(self, websocket: WebSocket, data: str, room_id: str):
        room = self.rooms.get(room_id)
        if not room: return
        
        try:
            msg_data = json.loads(data)
            
            # --- DRAWING ---
            if msg_data.get("type") == "draw":
                # Only trust data from the actual drawer
                if websocket == room.drawer: 
                    await self.broadcast(msg_data, room_id)
            
            # --- CHATTING ---
            elif msg_data.get("type") == "chat":
                # Drawer cannot chat/guess
                if websocket == room.drawer: 
                    return 
                
                guess = msg_data["message"].strip().lower()
                name = room.names[websocket]

                if guess == room.word:
                    # CORRECT GUESS
                    # Logic: If already guessed, ignore? (For simplicity, we allow spamming score for now, 
                    # but typically you'd check if they already guessed this round)
                    
                    room.scores[websocket] += 100
                    room.guessed_count += 1
                    
                    await self.broadcast({
                        "type": "correct_guess",
                        "message": f"🎉 {name} guessed the word!",
                        "scores": self.get_leaderboard(room)
                    }, room_id)

                    # Early End: If everyone (except drawer) guessed
                    if room.guessed_count >= len(room.active_connections) - 1:
                        await self.broadcast({
                            "type": "chat", 
                            "message": "Everyone guessed it! Moving on...", 
                            "isSystem": True
                        }, room_id)
                        
                        if room.game_task: 
                            room.game_task.cancel()
                        
                        await asyncio.sleep(2)
                        await self.start_round(room_id)
                else:
                    # NORMAL CHAT
                    await self.broadcast({
                        "type": "chat", 
                        "message": f"{name}: {msg_data['message']}"
                    }, room_id)

        except Exception as e:
            print(f"Error handling message: {e}")

manager = ConnectionManager()

@app.websocket("/ws/{room_id}/{name}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, name: str):
    await manager.connect(websocket, room_id, name)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.handle_message(websocket, data, room_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)