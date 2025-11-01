import redis.asyncio as redis
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging
from data_sources.hackernews import HackerNewsSource
from data_sources.github import GitHubTrendingSource
from data_sources.producthunt import ProductHuntSource
import asyncio

logger = logging.getLogger(__name__)

class MarketIntelligenceEngine:
    """Core market intelligence engine with real-time analysis"""
    
    def __init__(self, redis_url: str = 'redis://localhost:6379'):
        self.redis_url = redis_url
        self.redis_client = None
        
        # Initialize data sources
        self.sources = [
            HackerNewsSource(),
            GitHubTrendingSource(),
            ProductHuntSource()  # Will skip if no API key
        ]
        
        self.running = False
    
    async def connect(self):
        """Connect to Redis"""
        try:
            self.redis_client = await redis.from_url(self.redis_url, decode_responses=True)
            await self.redis_client.ping()
            logger.info("✅ Connected to Redis")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {str(e)}")
            raise
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis_client:
            await self.redis_client.close()
    
    async def fetch_all_trends(self) -> List[Dict[str, Any]]:
        """Fetch trends from all sources"""
        all_trends = []
        
        tasks = [source.fetch_and_normalize() for source in self.sources]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, list):
                all_trends.extend(result)
            else:
                logger.error(f"Error in source: {result}")
        
        logger.info(f"📊 Fetched {len(all_trends)} trends from {len(self.sources)} sources")
        return all_trends
    
    def calculate_trend_score(self, trend: Dict[str, Any]) -> float:
        """Calculate opportunity score for a trend (0-100)"""
        score = 0.0
        
        # Base score from engagement
        raw_score = trend.get('score', 0)
        engagement = trend.get('engagement', 0)
        
        # Normalize scores by source
        source = trend.get('source', '')
        if source == 'HackerNews':
            score += min(raw_score / 10, 50)  # Max 50 points from score
            score += min(engagement / 5, 30)   # Max 30 points from comments
        elif source == 'GitHub':
            score += min(raw_score / 100, 50)  # Max 50 points from stars
            score += min(engagement / 50, 30)  # Max 30 points from forks/watchers
        elif source == 'ProductHunt':
            score += min(raw_score / 5, 50)    # Max 50 points from votes
            score += min(engagement * 2, 30)   # Max 30 points from comments
        
        # Recency bonus (up to 20 points)
        try:
            timestamp = datetime.fromisoformat(trend.get('timestamp', '').replace('Z', '+00:00'))
            age_hours = (datetime.now(timestamp.tzinfo or None) - timestamp).total_seconds() / 3600
            if age_hours < 24:
                score += 20 * (1 - age_hours / 24)
        except:
            pass
        
        return min(score, 100.0)
    
    def calculate_velocity(self, trend: Dict[str, Any], historical_data: List[Dict]) -> float:
        """Calculate growth velocity (multiplier)"""
        # Simple velocity calculation
        # In production, this would compare with historical data
        current_score = trend.get('score', 0)
        
        if current_score > 500:
            return 15.0  # Very high velocity
        elif current_score > 200:
            return 12.0  # High velocity
        elif current_score > 100:
            return 8.0   # Medium velocity
        else:
            return 5.0   # Low velocity
    
    def estimate_revenue_potential(self, trend_score: float, velocity: float) -> int:
        """Estimate revenue potential in dollars"""
        # Base calculation: higher score + velocity = higher potential
        base_potential = (trend_score / 100) * 50000  # Max $50k for perfect score
        velocity_multiplier = velocity / 10
        
        return int(base_potential * velocity_multiplier)
    
    def calculate_urgency(self, trend_score: float, velocity: float) -> int:
        """Calculate urgency level (1-10)"""
        urgency = (trend_score / 100) * 5 + (velocity / 15) * 5
        return min(int(urgency), 10)
    
    def categorize_trend(self, trend: Dict[str, Any]) -> str:
        """Categorize trend into opportunity type"""
        title = (trend.get('title') or '').lower()
        description = (trend.get('description') or '').lower()
        text = f"{title} {description}"
        
        # Simple keyword-based categorization
        if any(word in text for word in ['ai', 'ml', 'gpt', 'llm', 'neural']):
            return 'AI Tools'
        elif any(word in text for word in ['no-code', 'low-code', 'builder', 'drag']):
            return 'No-Code Platforms'
        elif any(word in text for word in ['saas', 'platform', 'software']):
            return 'SaaS Products'
        elif any(word in text for word in ['api', 'sdk', 'library', 'framework']):
            return 'Developer Tools'
        elif any(word in text for word in ['analytics', 'dashboard', 'metrics']):
            return 'Analytics Tools'
        elif any(word in text for word in ['content', 'blog', 'seo', 'marketing']):
            return 'Content & Marketing'
        else:
            return 'Other'
    
    async def analyze_trend(self, trend: Dict[str, Any]) -> Dict[str, Any]:
        """Perform comprehensive analysis on a trend"""
        trend_score = self.calculate_trend_score(trend)
        velocity = self.calculate_velocity(trend, [])
        
        analyzed = {
            'id': f"{trend.get('source', '')}_{hash(trend.get('url', ''))}_{int(datetime.now().timestamp())}",
            'original': trend,
            'analysis': {
                'trend_score': round(trend_score, 2),
                'velocity': round(velocity, 2),
                'revenue_potential': self.estimate_revenue_potential(trend_score, velocity),
                'urgency': self.calculate_urgency(trend_score, velocity),
                'category': self.categorize_trend(trend),
                'analyzed_at': datetime.utcnow().isoformat()
            },
            'alert_level': 'high' if trend_score > 70 else 'medium' if trend_score > 40 else 'low'
        }
        
        return analyzed
    
    async def analyze_all_trends(self, trends: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze all trends and return sorted by score"""
        analyzed_trends = []
        
        for trend in trends:
            analyzed = await self.analyze_trend(trend)
            analyzed_trends.append(analyzed)
        
        # Sort by trend score (descending)
        analyzed_trends.sort(key=lambda x: x['analysis']['trend_score'], reverse=True)
        
        return analyzed_trends
    
    async def publish_trend(self, trend: Dict[str, Any]):
        """Publish trend to Redis pub/sub"""
        try:
            await self.redis_client.publish(
                'market:trends',
                json.dumps(trend)
            )
        except Exception as e:
            logger.error(f"Error publishing trend: {str(e)}")
    
    async def store_trend(self, trend: Dict[str, Any]):
        """Store trend in Redis with expiration"""
        try:
            key = f"trend:{trend['id']}"
            await self.redis_client.setex(
                key,
                timedelta(hours=24),
                json.dumps(trend)
            )
            
            # Add to sorted set by score
            await self.redis_client.zadd(
                'trends:ranked',
                {trend['id']: trend['analysis']['trend_score']}
            )
        except Exception as e:
            logger.error(f"Error storing trend: {str(e)}")
    
    async def get_top_trends(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get top trends from Redis"""
        try:
            # Get top trend IDs from sorted set
            trend_ids = await self.redis_client.zrevrange('trends:ranked', 0, limit - 1)
            
            # Fetch full trend data
            trends = []
            for trend_id in trend_ids:
                key = f"trend:{trend_id}"
                data = await self.redis_client.get(key)
                if data:
                    trends.append(json.loads(data))
            
            return trends
        except Exception as e:
            logger.error(f"Error getting top trends: {str(e)}")
            return []
    
    async def get_dashboard_stats(self) -> Dict[str, Any]:
        """Get dashboard statistics"""
        try:
            # Get count of trends
            total_trends = await self.redis_client.zcard('trends:ranked')
            
            # Get top 5 trends
            top_trends = await self.get_top_trends(5)
            
            # Calculate averages
            if top_trends:
                avg_score = sum(t['analysis']['trend_score'] for t in top_trends) / len(top_trends)
                avg_velocity = sum(t['analysis']['velocity'] for t in top_trends) / len(top_trends)
                total_potential = sum(t['analysis']['revenue_potential'] for t in top_trends)
            else:
                avg_score = 0
                avg_velocity = 0
                total_potential = 0
            
            # Count by category
            categories = {}
            for trend in top_trends:
                cat = trend['analysis']['category']
                categories[cat] = categories.get(cat, 0) + 1
            
            return {
                'total_trends': total_trends,
                'avg_opportunity_score': round(avg_score, 2),
                'avg_velocity': round(avg_velocity, 2),
                'total_revenue_potential': total_potential,
                'high_priority_count': len([t for t in top_trends if t['alert_level'] == 'high']),
                'categories': categories,
                'last_update': datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting dashboard stats: {str(e)}")
            return {}
    
    async def run_analysis_cycle(self):
        """Run one analysis cycle"""
        logger.info("🔄 Starting analysis cycle...")
        
        # Fetch trends from all sources
        trends = await self.fetch_all_trends()
        
        if not trends:
            logger.warning("No trends fetched")
            return
        
        # Analyze trends
        analyzed = await self.analyze_all_trends(trends)
        
        # Store and publish top trends
        for trend in analyzed[:50]:  # Store top 50
            await self.store_trend(trend)
            await self.publish_trend(trend)
        
        logger.info(f"✅ Analysis cycle complete: {len(analyzed)} trends analyzed")
    
    async def start_continuous_monitoring(self, interval_minutes: int = 15):
        """Start continuous market monitoring"""
        self.running = True
        logger.info(f"🚀 Starting continuous monitoring (interval: {interval_minutes} minutes)")
        
        while self.running:
            try:
                await self.run_analysis_cycle()
                await asyncio.sleep(interval_minutes * 60)
            except Exception as e:
                logger.error(f"Error in monitoring cycle: {str(e)}")
                await asyncio.sleep(60)  # Wait 1 minute on error
    
    def stop_monitoring(self):
        """Stop continuous monitoring"""
        self.running = False
        logger.info("🛑 Stopping market monitoring")