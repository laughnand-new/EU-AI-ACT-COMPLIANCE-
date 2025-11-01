import aiohttp
from typing import List, Dict, Any
from datetime import datetime
from .base import DataSource
import logging

logger = logging.getLogger(__name__)

class GitHubTrendingSource(DataSource):
    """GitHub Trending - no API key required for trending page"""
    
    def __init__(self):
        super().__init__('GitHub')
        self.base_url = 'https://api.github.com'
    
    async def fetch_trends(self) -> List[Dict[str, Any]]:
        """Fetch trending repositories from GitHub"""
        try:
            async with aiohttp.ClientSession() as session:
                # Search for trending repos (starred in last 7 days)
                params = {
                    'q': 'stars:>100 created:>2024-01-01',
                    'sort': 'stars',
                    'order': 'desc',
                    'per_page': 30
                }
                
                async with session.get(
                    f'{self.base_url}/search/repositories',
                    params=params,
                    headers={'Accept': 'application/vnd.github.v3+json'}
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        trends = []
                        
                        for repo in data.get('items', []):
                            trends.append({
                                'title': repo.get('full_name', ''),
                                'description': repo.get('description', ''),
                                'url': repo.get('html_url', ''),
                                'score': repo.get('stargazers_count', 0),
                                'engagement': repo.get('forks_count', 0) + repo.get('watchers_count', 0),
                                'timestamp': repo.get('created_at', datetime.utcnow().isoformat()),
                                'tags': ['github', 'open-source'] + (repo.get('topics', [])[:3]),
                                'language': repo.get('language', 'Unknown'),
                                'stars': repo.get('stargazers_count', 0),
                                'forks': repo.get('forks_count', 0)
                            })
                        
                        return trends
                    else:
                        logger.warning(f"GitHub API returned status {response.status}")
                        return []
        except Exception as e:
            logger.error(f"Error fetching GitHub trends: {str(e)}")
            return []