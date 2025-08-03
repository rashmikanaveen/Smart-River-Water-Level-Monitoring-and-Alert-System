from fastapi import WebSocket
from typing import List, Dict, Any
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.latest_readings: Dict[str, Any] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        # Send latest readings when a client connects
        if self.latest_readings:
            await websocket.send_json(self.latest_readings)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        # Store the latest reading
        if "topic" in message and message["topic"] == "Distance":
            self.latest_readings = message
        
        # Send to all connected clients
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Handle disconnected clients
                pass

# Create a single instance to be imported by other modules
manager = ConnectionManager()