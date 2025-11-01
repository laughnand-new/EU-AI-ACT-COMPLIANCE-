from abc import ABC, abstractmethod
from typing import List, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class DataSource(ABC):
    """Base class for all data sources"""
    
    def __init__(self, name: str):
        self.name = name
        self.last_fetch = None
    
    @abstractmethod
    async def fetch_trends(self) -> List[Dict[str, Any]]:
        """Fetch latest trends from the source"""
        pass
    
    def normalize_trend(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize trend data to standard format"""
        return {
            'source': self.name,
            'title': raw_data.get('title', ''),
            'description': raw_data.get('description', ''),
            'url': raw_data.get('url', ''),
            'score': raw_data.get('score', 0),
            'engagement': raw_data.get('engagement', 0),
            'timestamp': raw_data.get('timestamp', datetime.utcnow().isoformat()),
            'tags': raw_data.get('tags', []),
            'raw_data': raw_data
        }
    
    async def fetch_and_normalize(self) -> List[Dict[str, Any]]:
        """Fetch and normalize trends"""
        try:
            trends = await self.fetch_trends()
            self.last_fetch = datetime.utcnow()
            return [self.normalize_trend(trend) for trend in trends]
        except Exception as e:
            logger.error(f"Error fetching from {self.name}: {str(e)}")
            return []