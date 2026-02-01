import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { Sun, Moon, LogOut, User, Settings, LayoutDashboard, Package, HelpCircle, Workflow, Shield, Terminal } from 'lucide-react';
import amvLogo from '@/assets/amv_global_logo.png';

type TabView = 'overview' | 'products' | 'why' | 'how' | 'console' | 'profile' | 'settings';

interface SuiteNavProps {
  currentTab: TabView;
  onTabChange: (tab: TabView) => void;
  isAdmin: boolean;
}

export function SuiteNav({ currentTab, onTabChange, isAdmin }: SuiteNavProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProfile = () => {
    onTabChange('profile');
  };

  const handleSettings = () => {
    onTabChange('settings');
  };

  const tabs = [
    { id: 'overview' as TabView, label: 'Overview', icon: LayoutDashboard },
    { id: 'products' as TabView, label: 'Products', icon: Package },
    { id: 'why' as TabView, label: 'Why Amineva?', icon: HelpCircle },
    { id: 'how' as TabView, label: 'How It Works', icon: Workflow },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-4 flex items-center justify-center border-b border-sidebar-border">
        <img src={amvLogo} alt="Amineva Global" className="h-12 w-12 rounded-full" />
      </div>
      
      {/* Navigation tabs */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            onClick={() => onTabChange(tab.id)}
            className={`w-full justify-start gap-3 h-11 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
              currentTab === tab.id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="text-sm">{tab.label}</span>
          </Button>
        ))}
        
        {/* Amineva Console - only for admins (role=manager or isAdmin=true) */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <span className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider px-3">
                Administration
              </span>
            </div>
            <Button
              variant="ghost"
              onClick={() => onTabChange('console')}
              className={`w-full justify-start gap-3 h-11 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                currentTab === 'console' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
              }`}
            >
              <Terminal className="h-4 w-4" />
              <span className="text-sm">Amineva Console</span>
            </Button>
          </>
        )}
      </nav>
      
      {/* Bottom section - Theme toggle and user menu */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <Button
          variant="ghost"
          onClick={toggleTheme}
          className="w-full justify-start gap-3 h-10 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-4 w-4" />
              <span className="text-sm">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4" />
              <span className="text-sm">Dark Mode</span>
            </>
          )}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-sidebar-foreground hover:bg-sidebar-accent">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-medium truncate max-w-[140px]">{user?.name}</span>
                <span className="text-xs text-sidebar-foreground/60 truncate max-w-[140px]">
                  {user?.role ? ROLE_LABELS[user.role] : 'User'}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfile}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSettings}>
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
    </aside>
  );
}
