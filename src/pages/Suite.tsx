import React from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SuiteNav } from '@/components/suite/SuiteNav';
import { OverviewPage } from '@/components/suite/pages/OverviewPage';
import { ProductsPage } from '@/components/suite/pages/ProductsPage';
import { WhyAminevaPage } from '@/components/suite/pages/WhyAminevaPage';
import { HowItWorksPage } from '@/components/suite/pages/HowItWorksPage';
import { ProfilePage } from '@/components/suite/pages/ProfilePage';
import { SettingsPage } from '@/components/suite/pages/SettingsPage';
import { AminevaConsole } from '@/components/admin/AminevaConsole';
import { ComsSystem } from '@/components/coms/ComsSystem';

type TabView = 'overview' | 'products' | 'why' | 'how' | 'console' | 'coms' | 'profile' | 'settings';

export default function SuitePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Admin check: role === 'super_admin' or role === 'manager'
  // In preview mode (lovable.app, localhost), grant admin access for testing
  const isPreviewMode = typeof window !== 'undefined' && (
    window.location.hostname.includes('lovable.app') ||
    window.location.hostname.includes('lovableproject.com') ||
    window.location.hostname.includes('localhost') ||
    window.location.hostname.includes('127.0.0.1')
  );
  const isAdmin = isPreviewMode || user?.role === 'super_admin' || user?.role === 'manager';
  
  // Determine current tab from URL
  const getCurrentTab = (): TabView => {
    const path = location.pathname.replace('/suite', '');
    if (path === '/products') return 'products';
    if (path === '/why') return 'why';
    if (path === '/how') return 'how';
    if (path === '/console') return 'console';
    if (path === '/coms') return 'coms';
    if (path === '/profile') return 'profile';
    if (path === '/settings') return 'settings';
    return 'overview';
  };
  
  const currentTab = getCurrentTab();
  
  const handleTabChange = (tab: TabView) => {
    const paths: Record<TabView, string> = {
      overview: '/suite',
      products: '/suite/products',
      why: '/suite/why',
      how: '/suite/how',
      console: '/suite/console',
      coms: '/suite/coms',
      profile: '/suite/profile',
      settings: '/suite/settings',
    };
    navigate(paths[tab]);
  };
  
  // Get first name for welcome message
  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <div className="min-h-screen bg-background">
      <SuiteNav 
        currentTab={currentTab}
        onTabChange={handleTabChange}
        isAdmin={isAdmin}
      />
      
      {/* Main content area - offset by sidebar width */}
      <main className="ml-64 p-8">
        {/* Welcome Banner */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Akwaaba, {firstName}
          </h1>
          <p className="text-muted-foreground">
            Welcome to Amineva Global. Access your products, insights, and operational tools.
          </p>
        </div>
        
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/why" element={<WhyAminevaPage />} />
          <Route path="/how" element={<HowItWorksPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* Amineva Console - admin only */}
          <Route 
            path="/console" 
            element={
              isAdmin ? <AminevaConsole /> : <Navigate to="/suite" replace />
            } 
          />
          {/* ComsSystem - admin only */}
          <Route 
            path="/coms" 
            element={
              isAdmin ? <ComsSystem /> : <Navigate to="/suite" replace />
            } 
          />
          {/* Legacy admin route redirect */}
          <Route path="/admin" element={<Navigate to="/suite/console" replace />} />
        </Routes>
      </main>
    </div>
  );
}
