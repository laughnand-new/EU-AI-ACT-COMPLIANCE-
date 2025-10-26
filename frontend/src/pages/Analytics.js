import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadAnalytics();
  }, []);
  
  const loadAnalytics = async () => {
    try {
      const [statsRes, assetsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/assets?limit=100`)
      ]);
      
      setStats(statsRes.data);
      setAssets(assetsRes.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
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
  
  // Calculate asset performance by type
  const assetsByType = assets.reduce((acc, asset) => {
    if (!acc[asset.asset_type]) {
      acc[asset.asset_type] = { count: 0, revenue: 0, views: 0, conversions: 0 };
    }
    acc[asset.asset_type].count++;
    acc[asset.asset_type].revenue += asset.revenue;
    acc[asset.asset_type].views += asset.views;
    acc[asset.asset_type].conversions += asset.conversions;
    return acc;
  }, {});
  
  // Get top performers
  const topAssets = [...assets]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  
  return (
    <div className="p-8" data-testid="analytics-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Performance Analytics</h1>
        <p className="text-slate-400">Detailed insights into asset performance and trends</p>
      </div>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Assets</p>
                <p className="text-white text-3xl font-bold">{stats?.total_assets || 0}</p>
              </div>
              <Activity className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Revenue</p>
                <p className="text-white text-3xl font-bold">${stats?.total_revenue?.toLocaleString() || 0}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Views</p>
                <p className="text-white text-3xl font-bold">{stats?.total_views?.toLocaleString() || 0}</p>
              </div>
              <BarChart3 className="w-10 h-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Avg Conversion</p>
                <p className="text-white text-3xl font-bold">{stats?.avg_conversion_rate || 0}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Performance by Asset Type */}
      <Card className="bg-slate-900 border-slate-800 mb-8" data-testid="asset-type-performance">
        <CardHeader>
          <CardTitle className="text-white">Performance by Asset Type</CardTitle>
          <CardDescription>Breakdown of metrics across different asset types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(assetsByType).map(([type, data]) => (
              <div key={type} className="p-4 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold capitalize">
                    {type.replace('_', ' ')}
                  </h3>
                  <span className="text-slate-400 text-sm">{data.count} assets</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 mb-1">Revenue</p>
                    <p className="text-green-500 font-semibold">${data.revenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Views</p>
                    <p className="text-blue-500 font-semibold">{data.views.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Conversions</p>
                    <p className="text-purple-500 font-semibold">{data.conversions}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Top Performers */}
      <Card className="bg-slate-900 border-slate-800" data-testid="top-performers">
        <CardHeader>
          <CardTitle className="text-white">Top 10 Performing Assets</CardTitle>
          <CardDescription>Ranked by revenue generation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topAssets.map((asset, index) => (
              <div 
                key={asset.id}
                className="flex items-center justify-between p-4 bg-slate-800 rounded-lg"
                data-testid={`top-asset-${index + 1}`}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{asset.title}</h4>
                    <p className="text-slate-400 text-sm capitalize">{asset.asset_type.replace('_', ' ')}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-slate-400 text-xs">Views</p>
                    <p className="text-white font-semibold">{asset.views}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs">Conversions</p>
                    <p className="text-white font-semibold">{asset.conversions}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs">Revenue</p>
                    <p className="text-green-500 font-bold">${asset.revenue}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;