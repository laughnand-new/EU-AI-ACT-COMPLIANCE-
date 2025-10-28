import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import AssetGenerator from '@/pages/AssetGenerator';
import AssetLibrary from '@/pages/AssetLibrary';
import AssetDetail from '@/pages/AssetDetail';
import MarketIntelligence from '@/pages/MarketIntelligence';
import Analytics from '@/pages/Analytics';
import { Cpu, BarChart3, Lightbulb, FolderOpen, TrendingUp, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import '@/App.css';

const Navigation = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
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
      
      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-700">
        <div className="bg-slate-800 rounded-lg p-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Logged in as</span>
            {user?.role === 'founder' && (
              <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">Founder</span>
            )}
          </div>
          <p className="text-white text-sm font-medium truncate">{user?.email}</p>
          {user?.full_name && (
            <p className="text-slate-400 text-xs mt-1">{user.full_name}</p>
          )}
        </div>
        
        <Button
          onClick={logout}
          data-testid="logout-button"
          className="w-full bg-red-600 hover:bg-red-700 text-white"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
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
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;