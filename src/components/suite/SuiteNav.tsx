import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { clearSealSession, getSealSession } from '@/lib/sealAuth';
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
import { Sun, Moon, LogOut, User, Settings, LayoutDashboard, Package, HelpCircle, Workflow, Terminal, Megaphone, Database, UserCircle, SlidersHorizontal } from 'lucide-react';
import amvLogo from '@/assets/amv_logo.png';

type TabView = 'overview' | 'console' | 'coms' | 'acs' | 'profile' | 'settings';

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
    .slice(0, 2) || 'M';

  // Get role label - default to "Manager" for admin users in preview
  const roleLabel = user?.role ? ROLE_LABELS[user.role] : (isAdmin ? 'Manager' : 'User');

  const sealSession = getSealSession();

  const handleLogout = () => {
    clearSealSession();
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
              currentTab === tab.id ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''
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
              <span className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider px-3">
                Administration
              </span>
            </div>
            <Button
              variant="ghost"
              onClick={() => onTabChange('console')}
              className={`w-full justify-start gap-3 h-11 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                currentTab === 'console' ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''
              }`}
            >
              <Terminal className="h-4 w-4" />
              <span className="text-sm">Amineva Console</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => onTabChange('coms')}
              className={`w-full justify-start gap-3 h-11 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                currentTab === 'coms' ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''
              }`}
            >
              <Megaphone className="h-4 w-4" />
              <span className="text-sm">ComsSystem</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => onTabChange('acs')}
              className={`w-full justify-start gap-3 h-11 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                currentTab === 'acs' ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''
              }`}
            >
              <Database className="h-4 w-4" />
              <span className="text-sm">ACS</span>
            </Button>
          </>
        )}
      </nav>
      
      {/* Bottom section - Theme toggle and user menu */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        {/* Theme Toggle */}
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
        
        {/* User Account Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 h-14 text-sidebar-foreground hover:bg-sidebar-accent">
              <Avatar className="h-9 w-9 border-2 border-sidebar-accent">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-medium truncate max-w-[140px]">{sealSession?.email || user?.name || 'Manager'}</span>
                <span className="text-xs text-sidebar-foreground/70 truncate max-w-[140px]">
                  Administrator
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.name || 'Manager'}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user?.email || 'admin@amineva.com'}
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
