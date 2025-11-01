from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
from auth import (
    User, UserRegister, UserLogin, UserResponse, TokenResponse,
    hash_password, verify_password, create_access_token, get_current_user
)
import asyncio
from market_intelligence import MarketIntelligenceEngine
from websocket_manager import ws_manager


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Mount WebSocket at /ws
app.mount("/ws", ws_manager.get_asgi_app())

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Global market intelligence engine
market_engine = None


# ================== DATA MODELS ==================

class AssetType(BaseModel):
    """Asset types available for generation"""
    id: str
    name: str
    description: str
    icon: str

class GenerateAssetRequest(BaseModel):
    """Request model for asset generation"""
    asset_type: str
    prompt: str
    target_audience: Optional[str] = None
    industry: Optional[str] = None

class Asset(BaseModel):
    """Generated asset model"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    asset_type: str
    title: str
    content: str
    description: str
    prompt: str
    target_audience: Optional[str] = None
    industry: Optional[str] = None
    status: str = "active"  # active, archived, deployed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    views: int = 0
    conversions: int = 0
    revenue: float = 0.0

class MarketInsight(BaseModel):
    """Market analysis insight"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str
    insight_type: str  # trend, opportunity, competitive_gap
    title: str
    description: str
    confidence_score: float
    potential_revenue: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PerformanceMetric(BaseModel):
    """Performance tracking metric"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    asset_id: str
    metric_type: str  # views, clicks, conversions, revenue
    value: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DashboardStats(BaseModel):
    """Dashboard statistics"""
    total_assets: int
    active_assets: int
    total_revenue: float
    total_conversions: int
    total_views: int
    avg_conversion_rate: float
    top_performing_asset: Optional[Dict[str, Any]] = None

class AnalyzeMarketRequest(BaseModel):
    """Request for market analysis"""
    industry: str
    focus_area: Optional[str] = None


# ================== AI GENERATOR SERVICE ==================

class AIGeneratorService:
    """Private AI Generator - The 'Black Box' Engine"""
    
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not self.api_key:
            raise ValueError("EMERGENT_LLM_KEY not found in environment")
    
    async def generate_asset(self, asset_type: str, prompt: str, 
                            target_audience: Optional[str] = None,
                            industry: Optional[str] = None) -> Dict[str, str]:
        """
        Core AI Generation Engine (Private Trade Secret)
        This is the 'black box' that remains private
        """
        
        # Build context-aware system message
        system_message = f"""You are the ApexForge Elite Quantum AI Generator, a sophisticated AI asset creation system.
        
Your role is to generate high-quality, revenue-optimized {asset_type} that are:
- Professionally crafted
- Conversion-focused
- Market-tested patterns
- Ready for immediate deployment

Generate content that maximizes engagement and conversion potential."""

        # Build detailed user prompt
        detailed_prompt = f"""Generate a complete {asset_type} based on this request:

Core Request: {prompt}

"""
        if target_audience:
            detailed_prompt += f"Target Audience: {target_audience}\n"
        if industry:
            detailed_prompt += f"Industry: {industry}\n"
        
        detailed_prompt += f"""
Requirements for {asset_type}:
"""
        
        if asset_type == "landing_page":
            detailed_prompt += """
- Compelling headline and subheadline
- Clear value proposition
- Features/benefits section
- Strong call-to-action
- Social proof elements
- Professional copywriting

Format as HTML/CSS ready content with clear sections."""
        
        elif asset_type == "ai_tool_concept":
            detailed_prompt += """
- Tool name and description
- Core functionality overview
- Target user personas
- Key features (5-7 features)
- Monetization strategy
- Technical requirements
- Go-to-market approach"""
        
        elif asset_type == "saas_product":
            detailed_prompt += """
- Product name and tagline
- Problem statement
- Solution overview
- Feature set (MVP and future)
- Pricing strategy
- Target market
- Competitive advantages"""
        
        elif asset_type == "content_strategy":
            detailed_prompt += """
- Content themes and pillars
- Distribution channels
- Content calendar framework
- SEO optimization strategy
- Engagement tactics
- Performance metrics"""
        
        # Generate using AI
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"asset_gen_{uuid.uuid4()}",
                system_message=system_message
            ).with_model("openai", "gpt-4o-mini")
            
            user_message = UserMessage(text=detailed_prompt)
            response = await chat.send_message(user_message)
            
            # Extract title from content
            content_lines = response.strip().split('\n')
            title = content_lines[0].replace('#', '').strip() if content_lines else f"Generated {asset_type}"
            
            return {
                "title": title[:200],  # Limit title length
                "content": response,
                "description": f"AI-generated {asset_type} optimized for {industry or 'general'} market"
            }
            
        except Exception as e:
            logging.error(f"AI generation error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Asset generation failed: {str(e)}")
    
    async def analyze_market(self, industry: str, focus_area: Optional[str] = None) -> Dict[str, Any]:
        """
        Market Intelligence Analysis (Part of Private Engine)
        """
        
        system_message = """You are the ApexForge Market Intelligence Analyzer, providing deep competitive insights and opportunity identification."""
        
        prompt = f"""Analyze the {industry} market and provide strategic insights.
        
Focus Area: {focus_area or 'General market analysis'}

Provide analysis in the following structure:

1. KEY TRENDS (3-5 trends)
   - Trend name
   - Impact level (High/Medium/Low)
   - Confidence score (0-100%)
   - Brief description

2. OPPORTUNITIES (3-5 opportunities)
   - Opportunity title
   - Market gap description
   - Estimated potential revenue
   - Confidence score

3. COMPETITIVE GAPS (2-4 gaps)
   - Gap description
   - Why it exists
   - How to exploit it
   - Confidence score

Keep each item concise but actionable. Focus on revenue-generating insights."""

        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"market_analysis_{uuid.uuid4()}",
                system_message=system_message
            ).with_model("openai", "gpt-4o-mini")
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            return {
                "analysis": response,
                "industry": industry,
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logging.error(f"Market analysis error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Market analysis failed: {str(e)}")


# Initialize AI Service
ai_service = AIGeneratorService()


# ================== API ROUTES ==================

@api_router.get("/")
async def root():
    return {
        "message": "ApexForge Elite Quantum AI Generator API",
        "status": "operational",
        "version": "1.0.0"
    }


# ================== AUTHENTICATION ROUTES ==================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    """Register a new user"""
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        role="user"
    )
    
    # Save to database
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id, "email": user.email})
    
    # Return token and user info
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        created_at=user.created_at,
        is_active=user.is_active
    )
    
    return TokenResponse(access_token=access_token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login with email and password"""
    
    # Find user
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check if active
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is inactive")
    
    # Create access token
    access_token = create_access_token(data={"sub": user["id"], "email": user["email"]})
    
    # Parse created_at
    created_at = user.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    
    # Return token and user info
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user.get("full_name"),
        role=user.get("role", "user"),
        created_at=created_at,
        is_active=user.get("is_active", True)
    )
    
    return TokenResponse(access_token=access_token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(lambda creds: get_current_user(creds, db))):
    """Get current user info"""
    
    # Parse created_at
    created_at = current_user.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user.get("full_name"),
        role=current_user.get("role", "user"),
        created_at=created_at,
        is_active=current_user.get("is_active", True)
    )

# Asset Type Management
@api_router.get("/asset-types", response_model=List[AssetType])
async def get_asset_types():
    """Get available asset types for generation"""
    asset_types = [
        {
            "id": "landing_page",
            "name": "Landing Page",
            "description": "High-converting landing pages with professional copy",
            "icon": "FileText"
        },
        {
            "id": "ai_tool_concept",
            "name": "AI Tool Concept",
            "description": "Complete AI tool specifications and strategies",
            "icon": "Cpu"
        },
        {
            "id": "saas_product",
            "name": "SaaS Product",
            "description": "Full SaaS product concepts with go-to-market plans",
            "icon": "Rocket"
        },
        {
            "id": "content_strategy",
            "name": "Content Strategy",
            "description": "Comprehensive content marketing strategies",
            "icon": "BookOpen"
        }
    ]
    return asset_types


# ================== MARKET INTELLIGENCE ROUTES ==================

@api_router.get("/intelligence/trends")
async def get_market_trends(
    limit: int = 20,
    category: Optional[str] = None,
    current_user: dict = Depends(lambda creds: get_current_user(creds, db))
):
    """Get real-time market trends"""
    global market_engine
    
    if not market_engine:
        raise HTTPException(status_code=503, detail="Market Intelligence Engine not available")
    
    try:
        trends = await market_engine.get_top_trends(limit)
        
        # Filter by category if specified
        if category:
            trends = [t for t in trends if t['analysis']['category'] == category]
        
        return {
            "trends": trends,
            "total": len(trends),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting trends: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/intelligence/stats")
async def get_intelligence_stats(
    current_user: dict = Depends(lambda creds: get_current_user(creds, db))
):
    """Get market intelligence dashboard statistics"""
    global market_engine
    
    if not market_engine:
        raise HTTPException(status_code=503, detail="Market Intelligence Engine not available")
    
    try:
        stats = await market_engine.get_dashboard_stats()
        return stats
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/intelligence/analyze")
async def trigger_analysis(
    current_user: dict = Depends(lambda creds: get_current_user(creds, db))
):
    """Manually trigger market analysis cycle"""
    global market_engine
    
    if not market_engine:
        raise HTTPException(status_code=503, detail="Market Intelligence Engine not available")
    
    try:
        # Run analysis in background
        asyncio.create_task(market_engine.run_analysis_cycle())
        return {
            "message": "Analysis cycle triggered",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error triggering analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/intelligence/generate-from-trend")
async def generate_from_trend(
    trend_id: str,
    current_user: dict = Depends(lambda creds: get_current_user(creds, db))
):
    """Generate a product from a market trend"""
    global market_engine
    
    if not market_engine:
        raise HTTPException(status_code=503, detail="Market Intelligence Engine not available")
    
    try:
        # Get trend from Redis
        import redis.asyncio as redis
        redis_client = await redis.from_url('redis://localhost:6379', decode_responses=True)
        trend_data = await redis_client.get(f"trend:{trend_id}")
        await redis_client.close()
        
        if not trend_data:
            raise HTTPException(status_code=404, detail="Trend not found")
        
        trend = json.loads(trend_data)
        
        # Build generation prompt from trend
        original = trend['original']
        analysis = trend['analysis']
        
        prompt = f"""Generate a product based on this market opportunity:

Trend: {original['title']}
Description: {original['description']}
Category: {analysis['category']}
Opportunity Score: {analysis['trend_score']}/100
Revenue Potential: ${analysis['revenue_potential']:,}
Urgency: {analysis['urgency']}/10

Create a compelling product that:
1. Addresses the market need identified in this trend
2. Targets the identified audience
3. Leverages the momentum of this trend
4. Focuses on quick time-to-market for maximum opportunity capture
"""
        
        # Generate using AI service
        generated = await ai_service.generate_asset(
            asset_type="saas_product",
            prompt=prompt,
            target_audience=analysis['category'],
            industry="Market-Driven Opportunity"
        )
        
        # Create asset object
        asset = Asset(
            asset_type="saas_product",
            title=generated["title"],
            content=generated["content"],
            description=generated["description"],
            prompt=prompt,
            target_audience=analysis['category'],
            industry="Market-Driven"
        )
        
        # Save to database with trend reference
        doc = asset.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['trend_id'] = trend_id
        doc['trend_score'] = analysis['trend_score']
        await db.assets.insert_one(doc)
        
        return {
            "asset": asset,
            "trend": trend,
            "message": "Product generated from market trend"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating from trend: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Asset Generation
@api_router.post("/assets/generate", response_model=Asset)
async def generate_asset(request: GenerateAssetRequest):
    """
    Generate a new revenue asset using the private AI engine
    PUBLIC ENDPOINT - But the engine itself remains private
    """
    
    # Generate using private AI engine
    generated = await ai_service.generate_asset(
        asset_type=request.asset_type,
        prompt=request.prompt,
        target_audience=request.target_audience,
        industry=request.industry
    )
    
    # Create asset object
    asset = Asset(
        asset_type=request.asset_type,
        title=generated["title"],
        content=generated["content"],
        description=generated["description"],
        prompt=request.prompt,
        target_audience=request.target_audience,
        industry=request.industry
    )
    
    # Save to database
    doc = asset.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.assets.insert_one(doc)
    
    return asset

# Asset Management
@api_router.get("/assets", response_model=List[Asset])
async def get_assets(status: Optional[str] = None, limit: int = 50):
    """Get all generated assets"""
    query = {}
    if status:
        query["status"] = status
    
    assets = await db.assets.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    for asset in assets:
        if isinstance(asset.get('created_at'), str):
            asset['created_at'] = datetime.fromisoformat(asset['created_at'])
    
    return assets

@api_router.get("/assets/{asset_id}", response_model=Asset)
async def get_asset(asset_id: str):
    """Get specific asset by ID"""
    asset = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    if isinstance(asset.get('created_at'), str):
        asset['created_at'] = datetime.fromisoformat(asset['created_at'])
    
    return asset

@api_router.patch("/assets/{asset_id}/status")
async def update_asset_status(asset_id: str, status: str):
    """Update asset status (active, archived, deployed)"""
    result = await db.assets.update_one(
        {"id": asset_id},
        {"$set": {"status": status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    return {"success": True, "asset_id": asset_id, "status": status}

@api_router.delete("/assets/{asset_id}")
async def delete_asset(asset_id: str):
    """Delete an asset"""
    result = await db.assets.delete_one({"id": asset_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    return {"success": True, "asset_id": asset_id}

# Performance Tracking
@api_router.post("/assets/{asset_id}/metrics")
async def track_metric(asset_id: str, metric_type: str, value: float):
    """Track performance metric for an asset"""
    
    # Update asset metrics
    update_field = f"${metric_type}" if metric_type in ["views", "conversions"] else "$inc"
    await db.assets.update_one(
        {"id": asset_id},
        {update_field: {metric_type: value if metric_type == "revenue" else 1}}
    )
    
    # Save detailed metric
    metric = PerformanceMetric(
        asset_id=asset_id,
        metric_type=metric_type,
        value=value
    )
    
    doc = metric.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.metrics.insert_one(doc)
    
    return {"success": True, "metric": metric}

@api_router.get("/assets/{asset_id}/metrics")
async def get_asset_metrics(asset_id: str, metric_type: Optional[str] = None):
    """Get metrics for a specific asset"""
    query = {"asset_id": asset_id}
    if metric_type:
        query["metric_type"] = metric_type
    
    metrics = await db.metrics.find(query, {"_id": 0}).sort("timestamp", -1).limit(100).to_list(100)
    
    for metric in metrics:
        if isinstance(metric.get('timestamp'), str):
            metric['timestamp'] = datetime.fromisoformat(metric['timestamp'])
    
    return metrics

# Market Intelligence
@api_router.post("/market/analyze")
async def analyze_market(request: AnalyzeMarketRequest):
    """
    Analyze market for opportunities and insights
    PUBLIC ENDPOINT - Analysis available, but methodology is private
    """
    
    analysis = await ai_service.analyze_market(
        industry=request.industry,
        focus_area=request.focus_area
    )
    
    # Parse and store insights (simplified version)
    # In production, would parse the AI response into structured insights
    insight = MarketInsight(
        category=request.industry,
        insight_type="trend",
        title=f"{request.industry} Market Analysis",
        description=analysis["analysis"][:500],  # Store summary
        confidence_score=0.85
    )
    
    doc = insight.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.insights.insert_one(doc)
    
    return analysis

@api_router.get("/market/insights", response_model=List[MarketInsight])
async def get_market_insights(category: Optional[str] = None, limit: int = 20):
    """Get stored market insights"""
    query = {}
    if category:
        query["category"] = category
    
    insights = await db.insights.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    for insight in insights:
        if isinstance(insight.get('created_at'), str):
            insight['created_at'] = datetime.fromisoformat(insight['created_at'])
    
    return insights

# Dashboard Statistics
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """Get comprehensive dashboard statistics"""
    
    # Get all assets
    all_assets = await db.assets.find({}, {"_id": 0}).to_list(1000)
    
    total_assets = len(all_assets)
    active_assets = len([a for a in all_assets if a.get("status") == "active"])
    total_revenue = sum(a.get("revenue", 0) for a in all_assets)
    total_conversions = sum(a.get("conversions", 0) for a in all_assets)
    total_views = sum(a.get("views", 0) for a in all_assets)
    
    avg_conversion_rate = (total_conversions / total_views * 100) if total_views > 0 else 0
    
    # Get top performing asset
    top_asset = None
    if all_assets:
        top_asset_doc = max(all_assets, key=lambda x: x.get("revenue", 0))
        top_asset = {
            "id": top_asset_doc.get("id"),
            "title": top_asset_doc.get("title"),
            "revenue": top_asset_doc.get("revenue", 0),
            "conversions": top_asset_doc.get("conversions", 0)
        }
    
    return DashboardStats(
        total_assets=total_assets,
        active_assets=active_assets,
        total_revenue=total_revenue,
        total_conversions=total_conversions,
        total_views=total_views,
        avg_conversion_rate=round(avg_conversion_rate, 2),
        top_performing_asset=top_asset
    )


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Initialize founder account and start market intelligence on startup"""
    global market_engine
    
    founder_email = "laughnand@gmail.com"
    
    # Check if founder exists
    existing_founder = await db.users.find_one({"email": founder_email}, {"_id": 0})
    
    if not existing_founder:
        # Create founder account with default password
        founder = User(
            email=founder_email,
            hashed_password=hash_password("founder123"),  # Default password - should be changed
            full_name="Founder",
            role="founder"
        )
        
        doc = founder.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.users.insert_one(doc)
        
        logger.info(f"✅ Founder account created: {founder_email}")
        logger.info("⚠️  Default password: founder123 (Please change after first login)")
    else:
        logger.info(f"✅ Founder account already exists: {founder_email}")
    
    # Initialize market intelligence engine
    try:
        market_engine = MarketIntelligenceEngine()
        await market_engine.connect()
        
        # Start WebSocket background tasks
        await ws_manager.start_background_tasks()
        
        # Start market monitoring in background
        asyncio.create_task(market_engine.start_continuous_monitoring(interval_minutes=15))
        
        logger.info("🚀 Market Intelligence Engine started")
    except Exception as e:
        logger.error(f"Failed to start Market Intelligence: {str(e)}")

@app.on_event("shutdown")
async def shutdown_db_client():
    global market_engine
    
    # Stop market intelligence
    if market_engine:
        market_engine.stop_monitoring()
        await market_engine.disconnect()
    
    # Stop WebSocket
    await ws_manager.stop_background_tasks()
    
    # Close MongoDB
    client.close()
