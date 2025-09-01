from fastapi import WebSocket
from typing import List, Dict, Any, Set
import logging

logger = logging.getLogger(__name__)

class WebSocketService:
    def __init__(self):
        # Store connections by subscription type
        self.connections: Dict[str, List[WebSocket]] = {
            "all": [],          # Get all data
            "distance": [],     # Only distance updates
            "temperature": [],  # Only temperature updates
            "alerts": [],       # Only alerts
        }
        self.latest_data: Dict[str, Any] = {}

    async def connect(self, websocket: WebSocket, subscription_type: str = "all"):
        """Connect with specific subscription type"""
        await websocket.accept()
        
        if subscription_type not in self.connections:
            subscription_type = "all"
            
        self.connections[subscription_type].append(websocket)
        logger.info(f"WebSocket connected to '{subscription_type}'. Total: {self.get_total_connections()}")
        
        # Send latest relevant data to new client
        if self.latest_data and subscription_type == "all":
            await websocket.send_json(self.latest_data)

    def disconnect(self, websocket: WebSocket):
        """Remove websocket from all subscription lists"""
        for subscription_type, connections in self.connections.items():
            if websocket in connections:
                connections.remove(websocket)
                logger.info(f"WebSocket disconnected from '{subscription_type}'")

    async def broadcast_distance_data(self, data: Dict[str, Any]):
        #logger.info(f"Broadcasting distance data: {data}")
        """Broadcast distance-specific data"""
        await self._broadcast_to_subscriptions(data, ["all", "distance"])

    

    async def _broadcast_to_subscriptions(self, data: Dict[str, Any], subscription_types: List[str]):
        """Send data to specific subscription types"""
        for sub_type in subscription_types:
            if sub_type in self.connections:
                await self._send_to_connections(self.connections[sub_type], data)

    async def _send_to_connections(self, connections: List[WebSocket], data: Dict[str, Any]):
        """Send data to a list of connections"""
        if not connections:
            return
            
        disconnected = []
        for connection in connections:
            try:
                await connection.send_json(data)
            except Exception as e:
                logger.error(f"Error sending to WebSocket: {e}")
                disconnected.append(connection)
        
        # Remove disconnected connections
        for conn in disconnected:
            self.disconnect(conn)

    def get_total_connections(self) -> int:
        return sum(len(conns) for conns in self.connections.values())

    def has_active_connections(self) -> bool:
        """Check if there are any active WebSocket connections"""
        return self.get_total_connections() > 0

    def get_connection_stats(self) -> Dict[str, int]:
        return {sub_type: len(conns) for sub_type, conns in self.connections.items()}

websocket_service = WebSocketService()