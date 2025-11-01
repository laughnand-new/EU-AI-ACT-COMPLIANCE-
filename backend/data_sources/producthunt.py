import aiohttp
from typing import List, Dict, Any, Optional
from datetime import datetime
from .base import DataSource
import logging
import os

logger = logging.getLogger(__name__)

class ProductHuntSource(DataSource):
    """Product Hunt data source - requires API key"""
    
    def __init__(self, api_key: Optional[str] = None):
        super().__init__('ProductHunt')
        self.api_key = api_key or os.environ.get('PRODUCT_HUNT_API_KEY')
        self.base_url = 'https://api.producthunt.com/v2/api/graphql'
    
    async def fetch_trends(self) -> List[Dict[str, Any]]:
        """Fetch trending products from Product Hunt"""
        if not self.api_key:
            logger.warning("Product Hunt API key not provided, skipping...")
            return []
        
        try:
            # GraphQL query for top posts
            query = """
            query {
              posts(first: 30, order: VOTES) {
                edges {
                  node {
                    id
                    name
                    tagline
                    description
                    url
                    votesCount
                    commentsCount
                    createdAt
                    topics {
                      edges {
                        node {
                          name
                        }
                      }
                    }
                  }
                }
              }
            }
            """
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.base_url,
                    json={'query': query},
                    headers={
                        'Authorization': f'Bearer {self.api_key}',
                        'Content-Type': 'application/json'
                    }
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        trends = []
                        
                        for edge in data.get('data', {}).get('posts', {}).get('edges', []):
                            post = edge.get('node', {})
                            topics = [t['node']['name'] for t in post.get('topics', {}).get('edges', [])]
                            
                            trends.append({
                                'title': post.get('name', ''),
                                'description': post.get('tagline', ''),
                                'url': post.get('url', ''),
                                'score': post.get('votesCount', 0),
                                'engagement': post.get('commentsCount', 0),
                                'timestamp': post.get('createdAt', datetime.utcnow().isoformat()),
                                'tags': topics[:5],
                                'product_hunt_id': post.get('id', '')
                            })
                        
                        return trends
                    else:
                        logger.warning(f"Product Hunt API returned status {response.status}")
                        return []
        except Exception as e:
            logger.error(f"Error fetching Product Hunt: {str(e)}")
            return []