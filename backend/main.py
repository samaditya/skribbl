from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, List, Optional
import json
import asyncio
import random

app = FastAPI()

# --- CONFIGURATION ---
ROUND_DURATION = 60
SELECTION_DURATION = 15 # Time to pick a word

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
        self.turn_queue: List[WebSocket] = [] 
        self.draw_history: List[dict] = [] 

class ConnectionManager:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}
        self.word_list = [
            "apple", "banana", "cherry", "date", "elderberry", "fig", "grape", 
            "house", "sun", "robot", "computer", "python", "guitar", "ocean", 
            "mountain", "river", "jungle", "space", "rocket", "pizza", "burger",
            "cat", "dog", "elephant", "giraffe", "lion", "tiger", "bear",
            "pencil", "book", "laptop", "phone", "watch", "glasses", "shoe",
            "train", "plane", "car", "bicycle", "cloud", "rain", "snow",
            "ghost", "skeleton", "vampire", "witch", "pumpkin", "candy",
            "christmas", "santa", "elf", "reindeer", "snowflake", "snowman"
        ]

    async def connect(self, websocket: WebSocket, room_id: str, name: str):
        await websocket.accept()
        
        if room_id not in self.rooms:
            self.rooms[room_id] = Room(room_id)
            print(f"Created Room: {room_id}")

        room = self.rooms[room_id]
        room.active_connections.append(websocket)
        room.names[websocket] = name
        
        if websocket not in room.scores:
            room.scores[websocket] = 0

        # Determine State
        current_role = "guesser"
        if room.drawer == websocket: 
            current_role = "drawer"
        
        display_word = room.word_hint
        if current_role == "drawer":
            display_word = room.word

        # Sync Game State
        await websocket.send_text(json.dumps({
            "type": "game_state",
            "role": current_role,
            "word": display_word,
            "scores": self.get_leaderboard(room)
        }))
        
        # Sync Canvas
        if room.draw_history:
             await websocket.send_text(json.dumps({
                "type": "redraw",
                "history": room.draw_history
            }))

        # Check if we need to start
        if len(room.active_connections) >= 2 and not room.game_task and not room.drawer:
            await self.start_round_selection(room_id)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.rooms:
            room = self.rooms[room_id]
            
            if websocket in room.active_connections: room.active_connections.remove(websocket)
            if websocket in room.names: del room.names[websocket]
            if websocket in room.scores: del room.scores[websocket]
            if websocket in room.turn_queue: room.turn_queue.remove(websocket)
            
            # If drawer left, reset
            if room.drawer == websocket:
                print(f"Drawer left room {room_id}. Resetting.")
                room.drawer = None
                if room.game_task: room.game_task.cancel()
                
                if len(room.active_connections) >= 2:
                    asyncio.create_task(self.start_round_selection(room_id))
            
            if not room.active_connections:
                if room.game_task: room.game_task.cancel()
                del self.rooms[room_id]
                print(f"Room {room_id} deleted.")

    def get_leaderboard(self, room: Room):
        leaderboard = []
        for sock, score in room.scores.items():
            if sock in room.names:
                leaderboard.append({"name": room.names[sock], "score": score})
        return sorted(leaderboard, key=lambda x: x['score'], reverse=True)

    async def broadcast(self, message: dict, room_id: str):
        if room_id in self.rooms:
            room = self.rooms[room_id]
            json_msg = json.dumps(message)
            for connection in room.active_connections[:]:
                try: await connection.send_text(json_msg)
                except: self.disconnect(connection, room_id)

    # --- PHASE 1: SELECT DRAWER & WORDS ---
    async def start_round_selection(self, room_id: str):
        room = self.rooms.get(room_id)
        if not room or len(room.active_connections) < 2: return
        if room.game_task: room.game_task.cancel()

        room.draw_history = [] # Reset canvas

        # Pick Drawer
        if not room.turn_queue:
            room.turn_queue = [p for p in room.active_connections]
            random.shuffle(room.turn_queue)

        room.drawer = None
        while room.turn_queue:
            candidate = room.turn_queue.pop(0)
            if candidate in room.active_connections:
                room.drawer = candidate
                break
        
        if not room.drawer:
            if room.active_connections: await self.start_round_selection(room_id)
            return

        # Pick 3 Random Words
        word_choices = random.sample(self.word_list, 3)
        
        drawer_name = room.names[room.drawer]
        print(f"Selection Phase in {room_id}. Drawer: {drawer_name}")

        # Send Choices to Drawer
        try:
            await room.drawer.send_text(json.dumps({
                "type": "choose_word",
                "words": word_choices,
                "drawer_name": drawer_name
            }))
        except:
            self.disconnect(room.drawer, room_id)
            await self.start_round_selection(room_id)
            return

        # Tell Guessers to Wait
        for sock in room.active_connections:
            if sock != room.drawer:
                await sock.send_text(json.dumps({
                    "type": "choosing",
                    "message": f"{drawer_name} is choosing a word...",
                    "drawer_name": drawer_name
                }))

        # Start Selection Timeout (Auto-pick if they are slow)
        room.game_task = asyncio.create_task(self.selection_timeout(room_id, word_choices[0]))

    async def selection_timeout(self, room_id: str, default_word: str):
        try:
            await asyncio.sleep(SELECTION_DURATION)
            # If we get here, they didn't pick. Auto-pick.
            await self.start_actual_game(room_id, default_word)
        except asyncio.CancelledError:
            pass

    # --- PHASE 2: START GAME LOOP ---
    async def start_actual_game(self, room_id: str, selected_word: str):
        room = self.rooms.get(room_id)
        if not room: return
        if room.game_task: room.game_task.cancel() # Cancel selection timeout

        room.word = selected_word
        room.word_hint = "_ " * len(room.word)
        room.guessed_count = 0
        drawer_name = room.names[room.drawer]

        # Broadcast Start
        await self.broadcast({
            "type": "new_round",
            "role": "guesser", # Default for everyone
            "word": room.word_hint,
            "drawer_name": drawer_name,
            "round_time": ROUND_DURATION
        }, room_id)

        # Override for Drawer (Show real word)
        await room.drawer.send_text(json.dumps({
            "type": "new_round",
            "role": "drawer",
            "word": room.word,
            "drawer_name": drawer_name,
            "round_time": ROUND_DURATION
        }))

        room.game_task = asyncio.create_task(self.game_timer(room_id))

    async def game_timer(self, room_id: str):
        room = self.rooms.get(room_id)
        if not room: return
        try:
            for seconds_left in range(ROUND_DURATION, -1, -1):
                await self.broadcast({"type": "timer", "time": seconds_left}, room_id)
                if seconds_left in [30, 15]: await self.reveal_hint(room)
                if seconds_left == 0:
                    await self.broadcast({"type": "chat", "message": f"⏰ Time's up! Word: {room.word.upper()}", "isSystem": True}, room_id)
                    await asyncio.sleep(3)
                    await self.start_round_selection(room_id)
                    return
                await asyncio.sleep(1)
        except asyncio.CancelledError: pass 

    async def reveal_hint(self, room: Room):
        real = list(room.word)
        current = room.word_hint.split(" ")
        hidden = [i for i, x in enumerate(current) if x == "_"]
        if hidden:
            idx = random.choice(hidden)
            current[idx] = real[idx]
            room.word_hint = " ".join(current)
            await self.broadcast({"type": "hint_update", "word": room.word_hint}, room.room_id)

    async def handle_message(self, websocket: WebSocket, data: str, room_id: str):
        room = self.rooms.get(room_id)
        if not room: return
        
        try:
            msg_data = json.loads(data)
            
            # --- WORD SELECTION ---
            if msg_data.get("type") == "word_select":
                if websocket == room.drawer:
                    word = msg_data.get("word")
                    if word: await self.start_actual_game(room_id, word)

            # --- DRAWING ---
            elif msg_data.get("type") in ["draw", "fill"]:
                if websocket == room.drawer: 
                    room.draw_history.append(msg_data)
                    await self.broadcast(msg_data, room_id)

            elif msg_data.get("type") == "clear":
                 if websocket == room.drawer:
                    room.draw_history = []
                    await self.broadcast(msg_data, room_id)
            
            elif msg_data.get("type") == "undo":
                if websocket == room.drawer and room.draw_history:
                    room.draw_history.pop()
                    await self.broadcast({"type": "redraw", "history": room.draw_history}, room_id)
            
            # --- CHAT ---
            elif msg_data.get("type") == "chat":
                if websocket == room.drawer: return 
                guess = msg_data["message"].strip().lower()
                name = room.names[websocket]

                if guess == room.word:
                    room.scores[websocket] += 100
                    room.guessed_count += 1
                    await self.broadcast({"type": "correct_guess", "message": f"🎉 {name} guessed the word!", "scores": self.get_leaderboard(room)}, room_id)
                    if room.guessed_count >= len(room.active_connections) - 1:
                        await self.broadcast({"type": "chat", "message": "Everyone guessed it!", "isSystem": True}, room_id)
                        if room.game_task: room.game_task.cancel()
                        await asyncio.sleep(2)
                        await self.start_round_selection(room_id)
                else:
                    await self.broadcast({"type": "chat", "message": f"{name}: {msg_data['message']}"}, room_id)

        except Exception as e: print(f"Error: {e}")

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