import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import AssetGenerator from '@/pages/AssetGenerator';
import AssetLibrary from '@/pages/AssetLibrary';
import AssetDetail from '@/pages/AssetDetail';
import MarketIntelligence from '@/pages/MarketIntelligence';
import Analytics from '@/pages/Analytics';
import { Cpu, BarChart3, Lightbulb, FolderOpen, TrendingUp } from 'lucide-react';
import '@/App.css';

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: BarChart3, label: 'Dashboard' },
    { path: '/generate', icon: Cpu, label: 'Generate' },
    { path: '/library', icon: FolderOpen, label: 'Library' },
    { path: '/market', icon: Lightbulb, label: 'Market Intel' },
    { path: '/analytics', icon: TrendingUp, label: 'Analytics' }
  ];
  
  return (
    <nav className="bg-slate-900 border-r border-slate-700 h-screen w-64 fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">ApexForge</h1>
            <p className="text-slate-400 text-xs">Elite AI Generator</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 py-6 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              className={`flex items-center space-x-3 px-4 py-3 mb-2 rounded-lg transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-slate-700">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">System Status</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-white text-xs font-mono">Operational</p>
        </div>
      </div>
    </nav>
  );
};

const AppContent = () => {
  return (
    <div className="flex">
      <Navigation />
      <div className="ml-64 flex-1 min-h-screen bg-slate-950">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/generate" element={<AssetGenerator />} />
          <Route path="/library" element={<AssetLibrary />} />
          <Route path="/asset/:id" element={<AssetDetail />} />
          <Route path="/market" element={<MarketIntelligence />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </div>
  );
}

export default App;