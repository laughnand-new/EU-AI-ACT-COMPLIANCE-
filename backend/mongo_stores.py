from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import json
import logging

logger = logging.getLogger(__name__)

class MarketIntelligenceStore:
    """MongoDB-backed cache for market intelligence data with TTL"""
    
    def __init__(self, mongo_url: str, db_name: str):
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        self.collection = db["market_intelligence_cache"]
        self.initialized = False
    
    async def initialize(self):
        """Create TTL index for automatic expiration"""
        if not self.initialized:
            await self.collection.create_index("expires_at", expireAfterSeconds=0)
            self.initialized = True
            logger.info("✅ MarketIntelligenceStore initialized with TTL index")
    
    async def set(self, key: str, value: Any, ttl_seconds: int = 86400):
        """Store value with TTL (default 24 hours)"""
        await self.collection.update_one(
            {"_id": key},
            {
                "$set": {
                    "value": value if isinstance(value, dict) else json.loads(value),
                    "expires_at": datetime.utcnow() + timedelta(seconds=ttl_seconds),
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
    
    async def get(self, key: str) -> Optional[Any]:
        """Retrieve value if not expired"""
        doc = await self.collection.find_one({"_id": key})
        return doc["value"] if doc else None
    
    async def delete(self, key: str):
        """Delete a cached entry"""
        await self.collection.delete_one({"_id": key})
    
    async def zadd(self, key: str, mapping: Dict[str, float]):
        """Store sorted set equivalent (for trend rankings)"""
        # Store as array of {id, score} sorted by score
        items = [{"id": k, "score": v} for k, v in mapping.items()]
        items.sort(key=lambda x: x["score"], reverse=True)
        
        await self.set(key, {"type": "sorted_set", "items": items})
    
    async def zrevrange(self, key: str, start: int, stop: int) -> list:
        """Get top items from sorted set"""
        data = await self.get(key)
        if not data or data.get("type") != "sorted_set":
            return []
        
        items = data.get("items", [])
        return [item["id"] for item in items[start:stop+1]]
    
    async def zcard(self, key: str) -> int:
        """Get count of items in sorted set"""
        data = await self.get(key)
        if not data or data.get("type") != "sorted_set":
            return 0
        
        return len(data.get("items", []))


class WebSocketSessionStore:
    """MongoDB-backed WebSocket session management"""
    
    def __init__(self, mongo_url: str, db_name: str):
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        self.sessions = db["websocket_sessions"]
        self.initialized = False
    
    async def initialize(self):
        """Create TTL index for stale session cleanup (1 hour)"""
        if not self.initialized:
            await self.sessions.create_index("last_seen", expireAfterSeconds=3600)
            self.initialized = True
            logger.info("✅ WebSocketSessionStore initialized with TTL index")
    
    async def register(self, session_id: str, user_id: str, metadata: Optional[Dict] = None):
        """Register a new WebSocket session"""
        await self.sessions.update_one(
            {"_id": session_id},
            {
                "$set": {
                    "user_id": user_id,
                    "last_seen": datetime.utcnow(),
                    "metadata": metadata or {},
                    "created_at": datetime.utcnow()
                }
            },
            upsert=True
        )
    
    async def update_heartbeat(self, session_id: str):
        """Update session heartbeat"""
        await self.sessions.update_one(
            {"_id": session_id},
            {"$set": {"last_seen": datetime.utcnow()}}
        )
    
    async def remove(self, session_id: str):
        """Remove session"""
        await self.sessions.delete_one({"_id": session_id})
    
    async def get_active_sessions(self) -> list:
        """Get all active sessions"""
        cursor = self.sessions.find({})
        return await cursor.to_list(length=1000)
    
    async def get_user_sessions(self, user_id: str) -> list:
        """Get all sessions for a user"""
        cursor = self.sessions.find({"user_id": user_id})
        return await cursor.to_list(length=100)
