import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TopNav } from '@/components/layout/TopNav';
import { ProductGrid } from '@/components/suite/ProductGrid';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { LoginForm } from '@/components/auth/LoginForm';
import { Home, Grid3X3, Shield, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

type View = 'home' | 'products' | 'admin';

export function SuiteHome() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<View>('home');
  const [showLoginPage, setShowLoginPage] = useState(false);
  const isSuperAdmin = user?.role === 'super_admin';

  const handleAdminClick = () => {
    setCurrentView('admin');
  };

  const handleHomeClick = () => {
    setShowLoginPage(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav onAdminClick={isSuperAdmin ? handleAdminClick : undefined} />
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 h-[calc(100vh-4rem)] border-r border-border bg-card flex-col p-4 sticky top-16">
          <nav className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleHomeClick}
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
            <Button
              variant={currentView === 'products' || currentView === 'home' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setCurrentView('home')}
            >
              <Grid3X3 className="mr-2 h-4 w-4" />
              Products
            </Button>
            {isSuperAdmin && (
              <Button
                variant={currentView === 'admin' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setCurrentView('admin')}
              >
                <Shield className="mr-2 h-4 w-4" />
                Admin
              </Button>
            )}
          </nav>
          
          <div className="mt-auto pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              © {new Date().getFullYear()} Amineva Global
            </p>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {currentView === 'admin' && isSuperAdmin ? (
            <AdminPanel />
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  Welcome back, {user?.name?.split(' ')[0]}
                </h2>
                <p className="text-muted-foreground">
                  Access your Amineva products and services
                </p>
              </div>
              <ProductGrid />
            </>
          )}
        </main>
      </div>

      {/* Login/Register Page Modal */}
      <Dialog open={showLoginPage} onOpenChange={setShowLoginPage}>
        <DialogContent className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 border-0">
          <div className="relative w-full h-full overflow-auto">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50"
              onClick={() => setShowLoginPage(false)}
            >
              <LogIn className="h-4 w-4" />
            </Button>
            <LoginForm />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
