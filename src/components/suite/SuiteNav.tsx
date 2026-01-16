import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ROLE_LABELS } from '@/types/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sun, Moon, LogOut, User, Settings, Home, LayoutDashboard, Package, HelpCircle, Workflow, Shield } from 'lucide-react';
import amvLogo from '@/assets/amv_global_logo.png';

type TabView = 'overview' | 'products' | 'why' | 'how' | 'admin';

interface SuiteNavProps {
  currentTab: TabView;
  onTabChange: (tab: TabView) => void;
  isSuperAdmin: boolean;
}

export function SuiteNav({ currentTab, onTabChange, isSuperAdmin }: SuiteNavProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const initials = user?.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const handleHomeClick = () => {
    // Navigate to public homepage (sign in/register)
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const tabs = [
    { id: 'overview' as TabView, label: 'Overview', icon: LayoutDashboard },
    { id: 'products' as TabView, label: 'Products', icon: Package },
    { id: 'why' as TabView, label: 'Why Amineva Global?', icon: HelpCircle },
    { id: 'how' as TabView, label: 'How It Works', icon: Workflow },
  ];

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <img src={amvLogo} alt="Amineva Global" className="h-10 w-10 rounded-full" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground">AMINEVA GLOBAL</h1>
              <p className="text-xs text-muted-foreground">Connect. Verify. Grow</p>
            </div>
          </div>
          
          {/* Navigation Tabs - Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleHomeClick}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
            
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={currentTab === tab.id ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onTabChange(tab.id)}
                className="gap-2"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Button>
            ))}
            
            {isSuperAdmin && (
              <Button
                variant={currentTab === 'admin' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onTabChange('admin')}
                className="gap-2"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            )}
          </nav>
          
          {/* Right side actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {user?.role ? ROLE_LABELS[user.role] : 'User'}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <nav className="lg:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHomeClick}
            className="gap-2 flex-shrink-0"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
          
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={currentTab === tab.id ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange(tab.id)}
              className="gap-2 flex-shrink-0"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </Button>
          ))}
          
          {isSuperAdmin && (
            <Button
              variant={currentTab === 'admin' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('admin')}
              className="gap-2 flex-shrink-0"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
