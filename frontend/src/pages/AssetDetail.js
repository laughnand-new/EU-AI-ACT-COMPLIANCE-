import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, DollarSign, Target, Copy, Check, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AssetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    loadAsset();
  }, [id]);
  
  const loadAsset = async () => {
    try {
      const response = await axios.get(`${API}/assets/${id}`);
      setAsset(response.data);
    } catch (error) {
      console.error('Failed to load asset:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopy = () => {
    if (asset) {
      navigator.clipboard.writeText(asset.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await axios.delete(`${API}/assets/${id}`);
        navigate('/library');
      } catch (error) {
        console.error('Failed to delete asset:', error);
        alert('Failed to delete asset');
      }
    }
  };
  
  const handleStatusChange = async (newStatus) => {
    try {
      await axios.patch(`${API}/assets/${id}/status?status=${newStatus}`);
      setAsset({...asset, status: newStatus});
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!asset) {
    return (
      <div className="p-8">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-12 text-center">
            <p className="text-slate-400 text-lg">Asset not found</p>
            <Button onClick={() => navigate('/library')} className="mt-4">
              Back to Library
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-500/20 text-green-500';
      case 'deployed': return 'bg-blue-500/20 text-blue-500';
      case 'archived': return 'bg-slate-500/20 text-slate-500';
      default: return 'bg-slate-500/20 text-slate-500';
    }
  };
  
  return (
    <div className="p-8" data-testid="asset-detail-page">
      {/* Header */}
      <div className="mb-6">
        <Button 
          onClick={() => navigate('/library')}
          variant="ghost"
          className="text-slate-400 hover:text-white mb-4"
          data-testid="back-button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Button>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-2">{asset.title}</h1>
            <p className="text-slate-400">{asset.description}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(asset.status)} data-testid="asset-status-badge">
              {asset.status}
            </Badge>
            <Button
              onClick={handleDelete}
              variant="destructive"
              data-testid="delete-asset-button"
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Views</p>
                <p className="text-white text-3xl font-bold">{asset.views}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Conversions</p>
                <p className="text-white text-3xl font-bold">{asset.conversions}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Revenue</p>
                <p className="text-white text-3xl font-bold">${asset.revenue}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Status Management */}
      <Card className="bg-slate-900 border-slate-800 mb-6">
        <CardHeader>
          <CardTitle className="text-white">Status Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {['active', 'deployed', 'archived'].map((status) => (
              <Button
                key={status}
                onClick={() => handleStatusChange(status)}
                data-testid={`status-${status}-button`}
                variant={asset.status === status ? 'default' : 'outline'}
                className={asset.status === status ? 'bg-blue-600' : ''}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Asset Content */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Asset Content</CardTitle>
            <Button 
              onClick={handleCopy}
              data-testid="copy-content-button"
              className="bg-slate-700 hover:bg-slate-600 text-white"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Content
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-950 rounded-lg p-6 border border-slate-800">
            <pre className="text-slate-300 text-sm whitespace-pre-wrap font-mono" data-testid="asset-content">
              {asset.content}
            </pre>
          </div>
        </CardContent>
      </Card>
      
      {/* Metadata */}
      <Card className="bg-slate-900 border-slate-800 mt-6">
        <CardHeader>
          <CardTitle className="text-white">Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 mb-1">Asset Type</p>
              <p className="text-white font-medium">{asset.asset_type.replace('_', ' ').toUpperCase()}</p>
            </div>
            {asset.industry && (
              <div>
                <p className="text-slate-400 mb-1">Industry</p>
                <p className="text-white font-medium">{asset.industry}</p>
              </div>
            )}
            {asset.target_audience && (
              <div>
                <p className="text-slate-400 mb-1">Target Audience</p>
                <p className="text-white font-medium">{asset.target_audience}</p>
              </div>
            )}
            <div>
              <p className="text-slate-400 mb-1">Created</p>
              <p className="text-white font-medium">
                {new Date(asset.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssetDetail;