from fastapi import WebSocket
from typing import Dict, Set

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        # Track project-specific connections: {project_id: set(websockets)}
        self.project_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        # Remove from project connections too
        for project_id, connections in list(self.project_connections.items()):
            if websocket in connections:
                connections.remove(websocket)
                if not connections:
                    del self.project_connections[project_id]

    def connect_to_project(self, websocket: WebSocket, project_id: int):
        """Register a WebSocket connection for a specific project"""
        if project_id not in self.project_connections:
            self.project_connections[project_id] = set()
        self.project_connections[project_id].add(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        """Broadcast to all connections (deployment logs)"""
        stale: list[WebSocket] = []
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                stale.append(connection)
        for ws in stale:
            try:
                self.disconnect(ws)
            except Exception:
                pass

    async def broadcast_to_project(self, project_id: int, message: str):
        """Broadcast to all connections for a specific project"""
        if project_id in self.project_connections:
            stale: list[WebSocket] = []
            for connection in list(self.project_connections[project_id]):
                try:
                    # Check if WebSocket is still open by checking its state
                    # FastAPI WebSocket has a client_state attribute
                    if hasattr(connection, 'client_state') and connection.client_state.name == 'DISCONNECTED':
                        stale.append(connection)
                        continue
                    
                    # Try to send as JSON if it's a dict, otherwise as text
                    if isinstance(message, dict):
                        await connection.send_json(message)
                    else:
                        await connection.send_json({"message": message, "type": "info"})
                except (RuntimeError, ConnectionError) as e:
                    # WebSocket is closed or error occurred - mark as stale
                    stale.append(connection)
                except Exception:
                    # Any other exception - mark as stale
                    stale.append(connection)
            # Remove stale connections
            for ws in stale:
                try:
                    self.disconnect(ws)
                except Exception:
                    pass


manager = ConnectionManager()

