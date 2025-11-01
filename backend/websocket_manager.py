import socketio
import redis.asyncio as redis
import json
import logging
from typing import Dict, Any
import asyncio

logger = logging.getLogger(__name__)

class WebSocketManager:
    """Manages WebSocket connections and real-time updates"""
    
    def __init__(self, redis_url: str = 'redis://localhost:6379'):
        self.sio = socketio.AsyncServer(
            async_mode='asgi',
            cors_allowed_origins='*',
            logger=True,
            engineio_logger=True
        )
        self.redis_url = redis_url
        self.redis_client = None
        self.pubsub = None
        self.running = False
        
        # Register event handlers
        self.setup_handlers()
    
    def setup_handlers(self):
        """Setup WebSocket event handlers"""
        
        @self.sio.event
        async def connect(sid, environ):
            logger.info(f"✅ Client connected: {sid}")
            await self.sio.emit('connected', {'message': 'Connected to ApexForge Elite Intelligence'}, room=sid)
        
        @self.sio.event
        async def disconnect(sid):
            logger.info(f"❌ Client disconnected: {sid}")
        
        @self.sio.event
        async def subscribe_trends(sid, data):
            """Subscribe client to trend updates"""
            logger.info(f"📊 Client {sid} subscribed to trends")
            await self.sio.enter_room(sid, 'trends')
            await self.sio.emit('subscribed', {'channel': 'trends'}, room=sid)
        
        @self.sio.event
        async def request_stats(sid):
            """Client requests dashboard stats"""
            logger.info(f"📈 Client {sid} requested stats")
            # Stats will be sent by the background task
    
    async def connect_redis(self):
        """Connect to Redis for pub/sub"""
        try:
            self.redis_client = await redis.from_url(self.redis_url, decode_responses=True)
            self.pubsub = self.redis_client.pubsub()
            await self.pubsub.subscribe('market:trends', 'market:alerts', 'market:stats')
            logger.info("✅ Connected to Redis pub/sub")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {str(e)}")
            raise
    
    async def disconnect_redis(self):
        """Disconnect from Redis"""
        if self.pubsub:
            await self.pubsub.unsubscribe('market:trends', 'market:alerts', 'market:stats')
            await self.pubsub.close()
        if self.redis_client:
            await self.redis_client.close()
    
    async def listen_redis_events(self):
        """Listen to Redis pub/sub and broadcast to WebSocket clients"""
        self.running = True
        logger.info("👂 Listening for Redis events...")
        
        while self.running:
            try:
                message = await self.pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                
                if message and message['type'] == 'message':
                    channel = message['channel']
                    data = json.loads(message['data'])
                    
                    if channel == 'market:trends':
                        # Broadcast new trend to all connected clients
                        await self.sio.emit('trend:new', data, room='trends')
                        logger.info(f"📡 Broadcasted trend: {data.get('id', 'unknown')}")
                    
                    elif channel == 'market:alerts':
                        # Broadcast alert
                        await self.sio.emit('alert:new', data)
                        logger.info(f"🚨 Broadcasted alert")
                    
                    elif channel == 'market:stats':
                        # Broadcast stats update
                        await self.sio.emit('stats:update', data)
                        logger.info(f"📊 Broadcasted stats update")
                
                await asyncio.sleep(0.1)
            
            except Exception as e:
                logger.error(f"Error in Redis listener: {str(e)}")
                await asyncio.sleep(1)
    
    async def broadcast_stats_periodically(self, interval_seconds: int = 30):
        """Broadcast dashboard stats periodically"""
        from market_intelligence import MarketIntelligenceEngine
        
        engine = MarketIntelligenceEngine(self.redis_url)
        await engine.connect()
        
        while self.running:
            try:
                stats = await engine.get_dashboard_stats()
                await self.redis_client.publish('market:stats', json.dumps(stats))
                await asyncio.sleep(interval_seconds)
            except Exception as e:
                logger.error(f"Error broadcasting stats: {str(e)}")
                await asyncio.sleep(interval_seconds)
        
        await engine.disconnect()
    
    async def start_background_tasks(self):
        """Start background tasks"""
        logger.info("🚀 Starting background tasks...")
        await self.connect_redis()
        
        # Start Redis listener
        asyncio.create_task(self.listen_redis_events())
        
        # Start periodic stats broadcaster
        asyncio.create_task(self.broadcast_stats_periodically())
    
    async def stop_background_tasks(self):
        """Stop background tasks"""
        self.running = False
        await self.disconnect_redis()
        logger.info("🛑 Background tasks stopped")
    
    def get_asgi_app(self):
        """Get ASGI app for WebSocket"""
        return socketio.ASGIApp(self.sio)


# Global WebSocket manager instance
ws_manager = WebSocketManager()
