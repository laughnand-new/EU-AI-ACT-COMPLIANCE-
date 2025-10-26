import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Eye, Target, ArrowUp, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentAssets, setRecentAssets] = useState([]);
  
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  const loadDashboardData = async () => {
    try {
      const [statsRes, assetsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/assets?limit=5`)
      ]);
      
      setStats(statsRes.data);
      setRecentAssets(assetsRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${stats?.total_revenue?.toLocaleString() || 0}`,
      change: '+12.5%',
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Active Assets',
      value: stats?.active_assets || 0,
      change: `${stats?.total_assets || 0} total`,
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Total Views',
      value: stats?.total_views?.toLocaleString() || 0,
      change: '+8.2%',
      icon: Eye,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Conversion Rate',
      value: `${stats?.avg_conversion_rate || 0}%`,
      change: '+2.4%',
      icon: Target,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    }
  ];
  
  return (
    <div className="p-8" data-testid="dashboard-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Command Center</h1>
        <p className="text-slate-400">Monitor your AI asset performance and market position</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-slate-900 border-slate-800 card-hover" data-testid={`stat-card-${stat.title.toLowerCase().replace(' ', '-')}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <span className="text-green-500 text-sm font-medium flex items-center">
                    <ArrowUp className="w-4 h-4 mr-1" />
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-slate-400 text-sm mb-1">{stat.title}</h3>
                <p className="text-white text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Asset */}
        {stats?.top_performing_asset && (
          <Card className="bg-slate-900 border-slate-800" data-testid="top-asset-card">
            <CardHeader>
              <CardTitle className="text-white">Top Performing Asset</CardTitle>
              <CardDescription>Highest revenue generator</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg p-6">
                <h3 className="text-white font-bold text-xl mb-2">
                  {stats.top_performing_asset.title}
                </h3>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-blue-100 text-sm">Revenue</p>
                    <p className="text-white text-2xl font-bold">
                      ${stats.top_performing_asset.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm">Conversions</p>
                    <p className="text-white text-2xl font-bold">
                      {stats.top_performing_asset.conversions}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Quick Actions */}
        <Card className="bg-slate-900 border-slate-800" data-testid="quick-actions-card">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription>Generate and analyze</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => navigate('/generate')}
              data-testid="generate-asset-button"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Generate New Asset
            </Button>
            <Button 
              onClick={() => navigate('/market')}
              data-testid="analyze-market-button"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Analyze Market
            </Button>
            <Button 
              onClick={() => navigate('/library')}
              data-testid="view-library-button"
              className="w-full bg-slate-700 hover:bg-slate-600 text-white"
            >
              View Asset Library
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Assets */}
      {recentAssets.length > 0 && (
        <Card className="bg-slate-900 border-slate-800 mt-6" data-testid="recent-assets-card">
          <CardHeader>
            <CardTitle className="text-white">Recent Assets</CardTitle>
            <CardDescription>Latest generated revenue assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAssets.map((asset) => (
                <div 
                  key={asset.id}
                  className="flex items-center justify-between p-4 bg-slate-800 rounded-lg hover:bg-slate-750 cursor-pointer transition-colors"
                  onClick={() => navigate(`/asset/${asset.id}`)}
                  data-testid={`recent-asset-${asset.id}`}
                >
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{asset.title}</h4>
                    <p className="text-slate-400 text-sm">{asset.description}</p>
                  </div>
                  <div className="flex items-center space-x-6 text-sm">
                    <div>
                      <span className="text-slate-400">Views: </span>
                      <span className="text-white font-medium">{asset.views}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Revenue: </span>
                      <span className="text-green-500 font-medium">${asset.revenue}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;