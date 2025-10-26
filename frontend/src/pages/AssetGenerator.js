import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AssetGenerator = () => {
  const navigate = useNavigate();
  const [assetTypes, setAssetTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [generatedAsset, setGeneratedAsset] = useState(null);
  
  const [formData, setFormData] = useState({
    asset_type: '',
    prompt: '',
    target_audience: '',
    industry: ''
  });
  
  useEffect(() => {
    loadAssetTypes();
  }, []);
  
  const loadAssetTypes = async () => {
    try {
      const response = await axios.get(`${API}/asset-types`);
      setAssetTypes(response.data);
    } catch (error) {
      console.error('Failed to load asset types:', error);
    }
  };
  
  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGenerated(false);
    
    try {
      const response = await axios.post(`${API}/assets/generate`, formData);
      setGeneratedAsset(response.data);
      setGenerated(true);
      
      // Reset form
      setTimeout(() => {
        setGenerated(false);
      }, 3000);
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Failed to generate asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const selectedType = assetTypes.find(t => t.id === formData.asset_type);
  
  return (
    <div className="p-8" data-testid="asset-generator-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">AI Asset Generator</h1>
        <p className="text-slate-400">Generate revenue-optimized assets using the private AI engine</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Type Selection */}
        <div className="lg:col-span-1">
          <Card className="bg-slate-900 border-slate-800 sticky top-8">
            <CardHeader>
              <CardTitle className="text-white">Asset Types</CardTitle>
              <CardDescription>Select what you want to generate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {assetTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFormData({...formData, asset_type: type.id})}
                  data-testid={`asset-type-${type.id}`}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    formData.asset_type === type.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <h3 className="font-semibold mb-1">{type.name}</h3>
                  <p className="text-sm opacity-80">{type.description}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
        
        {/* Generation Form */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
                Generate Asset
              </CardTitle>
              <CardDescription>
                {selectedType ? selectedType.name : 'Select an asset type to begin'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-6">
                <div>
                  <Label htmlFor="prompt" className="text-white">Generation Prompt *</Label>
                  <Textarea
                    id="prompt"
                    data-testid="prompt-input"
                    placeholder="Describe what you want to generate... (e.g., 'Create a landing page for an AI-powered email assistant targeting small business owners')"
                    value={formData.prompt}
                    onChange={(e) => setFormData({...formData, prompt: e.target.value})}
                    className="mt-2 bg-slate-800 border-slate-700 text-white min-h-[120px]"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry" className="text-white">Industry</Label>
                    <Input
                      id="industry"
                      data-testid="industry-input"
                      placeholder="e.g., SaaS, E-commerce, Healthcare"
                      value={formData.industry}
                      onChange={(e) => setFormData({...formData, industry: e.target.value})}
                      className="mt-2 bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="target_audience" className="text-white">Target Audience</Label>
                    <Input
                      id="target_audience"
                      data-testid="audience-input"
                      placeholder="e.g., Small business owners, Developers"
                      value={formData.target_audience}
                      onChange={(e) => setFormData({...formData, target_audience: e.target.value})}
                      className="mt-2 bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <div className="text-sm text-slate-400">
                    {formData.asset_type && selectedType ? (
                      <span>Generating: <strong className="text-white">{selectedType.name}</strong></span>
                    ) : (
                      <span>Select an asset type above</span>
                    )}
                  </div>
                  
                  <Button 
                    type="submit"
                    data-testid="generate-button"
                    disabled={!formData.asset_type || !formData.prompt || loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : generated ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Generated!
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Asset
                      </>
                    )}
                  </Button>
                </div>
              </form>
              
              {/* Generated Asset Preview */}
              {generatedAsset && (
                <div className="mt-8 p-6 bg-slate-800 rounded-lg border border-slate-700" data-testid="generated-asset-preview">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold text-lg">Generated Asset</h3>
                    <Button
                      onClick={() => navigate(`/asset/${generatedAsset.id}`)}
                      data-testid="view-asset-button"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      View Full Asset
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-slate-400 text-sm">Title</p>
                    <p className="text-white font-medium">{generatedAsset.title}</p>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <p className="text-slate-400 text-sm">Description</p>
                    <p className="text-white">{generatedAsset.description}</p>
                  </div>
                  
                  <div className="mt-4 p-4 bg-slate-900 rounded border border-slate-700 max-h-60 overflow-y-auto">
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">
                      {generatedAsset.content.substring(0, 500)}...
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AssetGenerator;