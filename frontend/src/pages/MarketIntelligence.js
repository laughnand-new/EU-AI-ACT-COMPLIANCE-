import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, TrendingUp, Lightbulb, Target } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MarketIntelligence = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  
  const [formData, setFormData] = useState({
    industry: '',
    focus_area: ''
  });
  
  useEffect(() => {
    loadInsights();
  }, []);
  
  const loadInsights = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/market/insights?limit=20`);
      setInsights(response.data);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAnalyze = async (e) => {
    e.preventDefault();
    setAnalyzing(true);
    setAnalysis(null);
    
    try {
      const response = await axios.post(`${API}/market/analyze`, formData);
      setAnalysis(response.data);
      
      // Reload insights to include the new one
      await loadInsights();
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Failed to analyze market. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };
  
  return (
    <div className="p-8" data-testid="market-intelligence-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Market Intelligence</h1>
        <p className="text-slate-400">Analyze markets and identify revenue opportunities</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analysis Form */}
        <div className="lg:col-span-1">
          <Card className="bg-slate-900 border-slate-800 sticky top-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                Analyze Market
              </CardTitle>
              <CardDescription>Get AI-powered market insights</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div>
                  <Label htmlFor="industry" className="text-white">Industry *</Label>
                  <Input
                    id="industry"
                    data-testid="industry-input"
                    placeholder="e.g., SaaS, Healthcare, Fintech"
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    className="mt-2 bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="focus_area" className="text-white">Focus Area (Optional)</Label>
                  <Input
                    id="focus_area"
                    data-testid="focus-area-input"
                    placeholder="e.g., AI tools, B2B SaaS, Mobile apps"
                    value={formData.focus_area}
                    onChange={(e) => setFormData({...formData, focus_area: e.target.value})}
                    className="mt-2 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                
                <Button 
                  type="submit"
                  data-testid="analyze-button"
                  disabled={!formData.industry || analyzing}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Analyze Market
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* Analysis Results & Insights */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Analysis */}
          {analysis && (
            <Card className="bg-slate-900 border-slate-800" data-testid="analysis-result">
              <CardHeader>
                <CardTitle className="text-white">Market Analysis: {analysis.industry}</CardTitle>
                <CardDescription>
                  Generated {new Date(analysis.generated_at).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-950 rounded-lg p-6 border border-slate-800">
                  <pre className="text-slate-300 text-sm whitespace-pre-wrap">
                    {analysis.analysis}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Historical Insights */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Previous Insights</CardTitle>
              <CardDescription>Historical market analysis data</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : insights.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400">No insights yet. Run your first market analysis!</p>
                </div>
              ) : (
                <div className="space-y-4" data-testid="insights-list">
                  {insights.map((insight) => (
                    <div 
                      key={insight.id}
                      className="p-4 bg-slate-800 rounded-lg border border-slate-700"
                      data-testid={`insight-${insight.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold">{insight.title}</h3>
                          <p className="text-slate-400 text-sm mt-1">
                            {insight.category} • {insight.insight_type.replace('_', ' ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-400">
                            Confidence
                          </div>
                          <div className="text-lg font-bold text-green-500">
                            {Math.round(insight.confidence_score * 100)}%
                          </div>
                        </div>
                      </div>
                      <p className="text-slate-300 text-sm mt-3">
                        {insight.description}
                      </p>
                      {insight.potential_revenue && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <span className="text-slate-400 text-xs">Potential Revenue: </span>
                          <span className="text-green-500 font-semibold">
                            ${insight.potential_revenue.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketIntelligence;