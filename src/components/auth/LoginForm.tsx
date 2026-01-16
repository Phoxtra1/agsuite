import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertCircle, Eye, EyeOff, BarChart3, Shield, Zap, Network, Database, Activity } from 'lucide-react';
import amvLogo from '@/assets/amv_global_logo.png';

// Typing animation text
const TYPING_TEXT = "BRIDGING THE GAP BETWEEN INFORMATION AND EXECUTION, DELIVERING VERIFIED FIELD INSIGHTS THAT EMPOWER PROJECT OWNERS, INVESTORS, INSTITUTIONS, AND DECISION MAKERS.";

// Typing animation component
function TypingAnimation() {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (currentIndex < TYPING_TEXT.length) {
          setDisplayText(TYPING_TEXT.slice(0, currentIndex + 1));
          setCurrentIndex(currentIndex + 1);
        } else {
          // Pause at the end before restarting
          setTimeout(() => {
            setIsDeleting(true);
          }, 3000);
        }
      } else {
        if (currentIndex > 0) {
          setDisplayText(TYPING_TEXT.slice(0, currentIndex - 1));
          setCurrentIndex(currentIndex - 1);
        } else {
          setIsDeleting(false);
        }
      }
    }, isDeleting ? 20 : 50);

    return () => clearTimeout(timer);
  }, [currentIndex, isDeleting]);

  return (
    <div className="min-h-[120px]">
      <p className="text-sm md:text-base text-primary-foreground/80 leading-relaxed font-medium tracking-wide">
        {displayText}
        <span className="animate-pulse">|</span>
      </p>
    </div>
  );
}

// Animated dashboard visualization component
function AnimatedVisuals() {
  const [activeIndex, setActiveIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Floating data nodes */}
      <div className="absolute inset-0">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-accent/40 rounded-full animate-pulse"
            style={{
              left: `${10 + (i % 4) * 25}%`,
              top: `${15 + Math.floor(i / 4) * 30}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${2 + (i % 3)}s`
            }}
          />
        ))}
      </div>

      {/* Connecting lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[...Array(6)].map((_, i) => (
          <line
            key={i}
            x1={`${20 + i * 15}%`}
            y1="20%"
            x2={`${30 + i * 12}%`}
            y2="80%"
            stroke="url(#lineGradient)"
            strokeWidth="1"
            className="animate-pulse"
            style={{ animationDelay: `${i * 0.5}s` }}
          />
        ))}
      </svg>

      {/* Central visualization panels */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[400px] h-[400px]">
          {/* Rotating ring */}
          <div 
            className="absolute inset-0 border border-accent/20 rounded-full"
            style={{ animation: 'spin 20s linear infinite' }}
          />
          <div 
            className="absolute inset-8 border border-accent/15 rounded-full"
            style={{ animation: 'spin 15s linear infinite reverse' }}
          />
          
          {/* Dashboard cards */}
          <div className={`absolute top-8 left-1/2 -translate-x-1/2 transition-all duration-700 ${activeIndex === 0 ? 'opacity-100 scale-100' : 'opacity-30 scale-90'}`}>
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-4 w-48">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium text-muted-foreground">Analytics</span>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-accent/30 rounded-full w-full" />
                <div className="h-2 bg-accent/20 rounded-full w-3/4" />
                <div className="h-2 bg-accent/40 rounded-full w-5/6" />
              </div>
            </div>
          </div>

          <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-700 ${activeIndex === 2 ? 'opacity-100 scale-100' : 'opacity-30 scale-90'}`}>
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-4 w-48">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-success" />
                <span className="text-xs font-medium text-muted-foreground">Monitoring</span>
              </div>
              <div className="flex items-end gap-1 h-8">
                {[40, 65, 45, 80, 55, 70, 60].map((h, i) => (
                  <div key={i} className="flex-1 bg-success/40 rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>

          <div className={`absolute left-0 top-1/2 -translate-y-1/2 transition-all duration-700 ${activeIndex === 3 ? 'opacity-100 scale-100' : 'opacity-30 scale-90'}`}>
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-4 w-44">
              <div className="flex items-center gap-2 mb-3">
                <Network className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium text-muted-foreground">Network</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className={`h-3 w-3 rounded-full ${i % 3 === 0 ? 'bg-accent/60' : 'bg-muted/40'}`} />
                ))}
              </div>
            </div>
          </div>

          <div className={`absolute right-0 top-1/2 -translate-y-1/2 transition-all duration-700 ${activeIndex === 1 ? 'opacity-100 scale-100' : 'opacity-30 scale-90'}`}>
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-4 w-44">
              <div className="flex items-center gap-2 mb-3">
                <Database className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium text-muted-foreground">Data Flow</span>
              </div>
              <div className="space-y-1">
                <div className="flex gap-1">
                  <div className="h-2 w-2 bg-accent/60 rounded-sm" />
                  <div className="h-2 flex-1 bg-accent/20 rounded-sm" />
                </div>
                <div className="flex gap-1">
                  <div className="h-2 w-2 bg-success/60 rounded-sm" />
                  <div className="h-2 flex-1 bg-success/20 rounded-sm" />
                </div>
                <div className="flex gap-1">
                  <div className="h-2 w-2 bg-accent/60 rounded-sm" />
                  <div className="h-2 flex-1 bg-accent/20 rounded-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Center logo glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center animate-pulse">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Zap className="h-6 w-6 text-accent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating stats */}
      <div className="absolute bottom-12 left-12 space-y-4 opacity-60">
        <div className="text-xs text-muted-foreground">
          <span className="text-2xl font-bold text-foreground">99.9%</span>
          <br />Uptime SLA
        </div>
      </div>
      <div className="absolute bottom-12 right-[55%] space-y-4 opacity-60">
        <div className="text-xs text-muted-foreground">
          <span className="text-2xl font-bold text-foreground">256-bit</span>
          <br />Encryption
        </div>
      </div>
    </div>
  );
}

// Social login button component
function SocialButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="flex-1 h-11 gap-2 bg-background/50 hover:bg-muted/50 border-border/50"
      onClick={onClick}
    >
      {icon}
      <span className="sr-only md:not-sr-only md:text-xs">{label}</span>
    </Button>
  );
}

export function LoginForm() {
  const { login, isLoading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  const handleSocialLogin = (provider: string) => {
    // Social login will be implemented with Supabase
    console.log(`${provider} login clicked`);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - Animated visuals with typing text */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative suite-gradient overflow-hidden">
        <AnimatedVisuals />
        
        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-center px-12 xl:px-20 z-10">
          <div className="max-w-lg">
            {/* Typing animation text */}
            <TypingAnimation />
            
            {/* Logo below typing text */}
            <div className="mt-8">
              <img 
                src={amvLogo} 
                alt="Amineva Global" 
                className="h-20 w-20 rounded-full opacity-90"
              />
              <h2 className="text-2xl font-bold text-primary-foreground mt-4">AMINEVA GLOBAL</h2>
              <p className="text-primary-foreground/60 text-sm">Connect. Verify. Grow</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo & typing text */}
          <div className="lg:hidden text-center mb-8">
            <img 
              src={amvLogo} 
              alt="Amineva Global" 
              className="h-16 w-16 rounded-full mx-auto mb-4"
            />
            <h1 className="text-xl font-bold mb-2">AMINEVA GLOBAL</h1>
            <p className="text-xs text-muted-foreground px-4">
              {TYPING_TEXT}
            </p>
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-8 pb-8">
              {/* Tab switcher */}
              <div className="flex mb-8">
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                    !isRegister 
                      ? 'border-accent text-foreground' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                    isRegister 
                      ? 'border-accent text-foreground' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="animate-scale-in">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-11 bg-background/50"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-11 pr-10 bg-background/50"
                      autoComplete={isRegister ? 'new-password' : 'current-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isRegister && (
                  <div className="space-y-2 animate-fade-in">
                    <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-11 bg-background/50"
                      autoComplete="new-password"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 btn-premium bg-accent text-accent-foreground hover:bg-accent/90 font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isRegister ? 'Creating Account...' : 'Signing In...'}
                    </>
                  ) : (
                    isRegister ? 'Create Account' : 'Sign In'
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                  or continue with
                </span>
              </div>

              {/* Social login buttons */}
              <div className="grid grid-cols-4 gap-3">
                <SocialButton
                  icon={
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  }
                  label="Google"
                  onClick={() => handleSocialLogin('Google')}
                />
                <SocialButton
                  icon={
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M3 5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-13zM5.5 5a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5h-13z"/>
                      <path fill="currentColor" d="M11 8h2v2h2v2h-2v2h2v2h-2v-2H9v-2h2v-2H9V8h2z"/>
                    </svg>
                  }
                  label="Microsoft"
                  onClick={() => handleSocialLogin('Microsoft')}
                />
                <SocialButton
                  icon={
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  }
                  label="Facebook"
                  onClick={() => handleSocialLogin('Facebook')}
                />
                <SocialButton
                  icon={
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  }
                  label="GitHub"
                  onClick={() => handleSocialLogin('GitHub')}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
