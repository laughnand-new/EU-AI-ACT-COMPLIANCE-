import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Cpu, Rocket, BookOpen, Eye, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AssetLibrary = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  useEffect(() => {
    loadAssets();
  }, []);
  
  useEffect(() => {
    filterAssets();
  }, [searchTerm, filterStatus, assets]);
  
  const loadAssets = async () => {
    try {
      const response = await axios.get(`${API}/assets?limit=100`);
      setAssets(response.data);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filterAssets = () => {
    let filtered = [...assets];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(asset => 
        asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(asset => asset.status === filterStatus);
    }
    
    setFilteredAssets(filtered);
  };
  
  const getAssetIcon = (type) => {
    switch(type) {
      case 'landing_page': return FileText;
      case 'ai_tool_concept': return Cpu;
      case 'saas_product': return Rocket;
      case 'content_strategy': return BookOpen;
      default: return FileText;
    }
  };
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-500/20 text-green-500';
      case 'deployed': return 'bg-blue-500/20 text-blue-500';
      case 'archived': return 'bg-slate-500/20 text-slate-500';
      default: return 'bg-slate-500/20 text-slate-500';
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="p-8" data-testid="asset-library-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Asset Library</h1>
        <p className="text-slate-400">Manage and view all generated revenue assets</p>
      </div>
      
      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            data-testid="search-input"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-700 text-white"
          />
        </div>
        
        <div className="flex gap-2">
          {['all', 'active', 'deployed', 'archived'].map((status) => (
            <Button
              key={status}
              onClick={() => setFilterStatus(status)}
              data-testid={`filter-${status}`}
              variant={filterStatus === status ? 'default' : 'outline'}
              className={filterStatus === status ? 'bg-blue-600 text-white' : 'text-slate-300'}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Asset Grid */}
      {filteredAssets.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-12 text-center">
            <p className="text-slate-400 text-lg">No assets found</p>
            <Button 
              onClick={() => navigate('/generate')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Generate Your First Asset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="asset-grid">
          {filteredAssets.map((asset) => {
            const Icon = getAssetIcon(asset.asset_type);
            
            return (
              <Card 
                key={asset.id}
                data-testid={`asset-card-${asset.id}`}
                className="bg-slate-900 border-slate-800 card-hover cursor-pointer"
                onClick={() => navigate(`/asset/${asset.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-blue-500" />
                    </div>
                    <Badge className={getStatusColor(asset.status)}>
                      {asset.status}
                    </Badge>
                  </div>
                  
                  <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
                    {asset.title}
                  </h3>
                  
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                    {asset.description}
                  </p>
                  
                  <div className="border-t border-slate-800 pt-4 mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center text-slate-400 text-xs mb-1">
                        <Eye className="w-3 h-3 mr-1" />
                        Views
                      </div>
                      <p className="text-white font-semibold">{asset.views}</p>
                    </div>
                    <div>
                      <div className="flex items-center text-slate-400 text-xs mb-1">
                        <DollarSign className="w-3 h-3 mr-1" />
                        Revenue
                      </div>
                      <p className="text-green-500 font-semibold">${asset.revenue}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AssetLibrary;