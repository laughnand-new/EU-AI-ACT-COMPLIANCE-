import aiohttp
from typing import List, Dict, Any
from datetime import datetime
from .base import DataSource
import logging

logger = logging.getLogger(__name__)

class HackerNewsSource(DataSource):
    """Hacker News data source - no API key required"""
    
    def __init__(self):
        super().__init__('HackerNews')
        self.base_url = 'https://hacker-news.firebaseio.com/v0'
    
    async def fetch_trends(self) -> List[Dict[str, Any]]:
        """Fetch top stories from Hacker News"""
        try:
            async with aiohttp.ClientSession() as session:
                # Get top story IDs
                async with session.get(f'{self.base_url}/topstories.json') as response:
                    story_ids = await response.json()
                
                # Fetch first 30 stories
                trends = []
                for story_id in story_ids[:30]:
                    try:
                        async with session.get(f'{self.base_url}/item/{story_id}.json') as response:
                            story = await response.json()
                            if story and story.get('type') == 'story':
                                trends.append({
                                    'title': story.get('title', ''),
                                    'description': story.get('text', '')[:200] if story.get('text') else '',
                                    'url': story.get('url', f"https://news.ycombinator.com/item?id={story_id}"),
                                    'score': story.get('score', 0),
                                    'engagement': story.get('descendants', 0),  # comments
                                    'timestamp': datetime.fromtimestamp(story.get('time', 0)).isoformat(),
                                    'tags': ['tech', 'startup'],
                                    'author': story.get('by', '')
                                })
                    except Exception as e:
                        logger.error(f"Error fetching HN story {story_id}: {str(e)}")
                        continue
                
                return trends
        except Exception as e:
            logger.error(f"Error fetching Hacker News: {str(e)}")
            return []