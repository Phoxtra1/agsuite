import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertCircle, Eye, EyeOff, BarChart3, Shield, Zap, Network, Database, Activity } from 'lucide-react';
import amvLogo from '@/assets/amv_logo.png';

// Animated dashboard visualization component with gold theme
function AnimatedVisuals() {
  const [activeIndex, setActiveIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Elegant grid pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(251, 191, 36, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(251, 191, 36, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }} />
      </div>

      {/* Floating golden orbs with smooth animation */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${12 + (i % 3) * 8}px`,
              height: `${12 + (i % 3) * 8}px`,
              background: `radial-gradient(circle, rgba(251, 191, 36, ${0.4 + (i % 3) * 0.1}) 0%, rgba(251, 191, 36, 0) 70%)`,
              left: `${8 + (i % 4) * 22}%`,
              top: `${12 + Math.floor(i / 4) * 45}%`,
              animation: `float ${6 + (i % 3) * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
      </div>

      {/* Elegant connecting curves */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(251, 191, 36)" stopOpacity="0" />
            <stop offset="50%" stopColor="rgb(251, 191, 36)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(251, 191, 36)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[...Array(4)].map((_, i) => (
          <path
            key={i}
            d={`M ${-50 + i * 80} ${100 + i * 150} Q ${200 + i * 100} ${200 + i * 50} ${400 + i * 50} ${50 + i * 100}`}
            stroke="url(#goldGradient)"
            strokeWidth="1.5"
            fill="none"
            style={{
              animation: `drawLine ${8 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 1.5}s`,
            }}
          />
        ))}
      </svg>

      {/* Central rotating rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[350px] h-[350px]">
          {/* Outer ring */}
          <div 
            className="absolute inset-0 rounded-full border-2 border-amber-400/20"
            style={{ animation: 'spin 30s linear infinite' }}
          />
          {/* Middle ring */}
          <div 
            className="absolute inset-10 rounded-full border border-amber-400/15"
            style={{ animation: 'spin 25s linear infinite reverse' }}
          />
          {/* Inner ring */}
          <div 
            className="absolute inset-20 rounded-full border border-amber-400/10"
            style={{ animation: 'spin 20s linear infinite' }}
          />
          
          {/* Glowing center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0) 70%)',
                animation: 'pulse 3s ease-in-out infinite'
              }}
            >
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle, rgba(251, 191, 36, 0.25) 0%, rgba(251, 191, 36, 0.05) 70%)',
                }}
              >
                <Zap className="h-7 w-7 text-amber-400" />
              </div>
            </div>
          </div>

          {/* Orbiting dashboard cards */}
          <div 
            className={`absolute -top-4 left-1/2 -translate-x-1/2 transition-all duration-1000 ease-out ${activeIndex === 0 ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}`}
          >
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-amber-200/50 dark:border-amber-400/20 rounded-xl p-4 w-44 shadow-lg shadow-amber-500/10">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Analytics</span>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-amber-400/40 rounded-full w-full" />
                <div className="h-2 bg-amber-400/25 rounded-full w-3/4" />
                <div className="h-2 bg-amber-400/50 rounded-full w-5/6" />
              </div>
            </div>
          </div>

          <div 
            className={`absolute -bottom-4 left-1/2 -translate-x-1/2 transition-all duration-1000 ease-out ${activeIndex === 2 ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}`}
          >
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-amber-200/50 dark:border-amber-400/20 rounded-xl p-4 w-44 shadow-lg shadow-amber-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Monitoring</span>
              </div>
              <div className="flex items-end gap-1 h-8">
                {[40, 65, 45, 80, 55, 70, 60].map((h, i) => (
                  <div key={i} className="flex-1 bg-emerald-400/50 rounded-t transition-all duration-500" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>

          <div 
            className={`absolute -left-16 top-1/2 -translate-y-1/2 transition-all duration-1000 ease-out ${activeIndex === 3 ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}`}
          >
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-amber-200/50 dark:border-amber-400/20 rounded-xl p-4 w-40 shadow-lg shadow-amber-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Network className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Network</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className={`h-3 w-3 rounded-full transition-all duration-300 ${i % 3 === 0 ? 'bg-amber-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                ))}
              </div>
            </div>
          </div>

          <div 
            className={`absolute -right-16 top-1/2 -translate-y-1/2 transition-all duration-1000 ease-out ${activeIndex === 1 ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}`}
          >
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-amber-200/50 dark:border-amber-400/20 rounded-xl p-4 w-40 shadow-lg shadow-amber-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Database className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Data Flow</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  <div className="h-2 w-2 bg-amber-400 rounded-sm" />
                  <div className="h-2 flex-1 bg-amber-400/30 rounded-sm" />
                </div>
                <div className="flex gap-1">
                  <div className="h-2 w-2 bg-emerald-400 rounded-sm" />
                  <div className="h-2 flex-1 bg-emerald-400/30 rounded-sm" />
                </div>
                <div className="flex gap-1">
                  <div className="h-2 w-2 bg-amber-400 rounded-sm" />
                  <div className="h-2 flex-1 bg-amber-400/30 rounded-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Corner stats with gold accent */}
      <div className="absolute bottom-12 left-12 opacity-80">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <span className="text-2xl font-bold text-amber-500">99.9%</span>
          <br />Uptime SLA
        </div>
      </div>
      <div className="absolute bottom-12 right-[55%] opacity-80">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <span className="text-2xl font-bold text-amber-500">256-bit</span>
          <br />Encryption
        </div>
      </div>

      {/* Custom keyframes style tag */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-15px) translateX(5px); }
          50% { transform: translateY(-5px) translateX(-5px); }
          75% { transform: translateY(-20px) translateX(3px); }
        }
        @keyframes drawLine {
          0%, 100% { stroke-dashoffset: 1000; opacity: 0.3; }
          50% { stroke-dashoffset: 0; opacity: 0.6; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
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

// Feature item component
function FeatureItem({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-400/10 flex items-center justify-center flex-shrink-0 border border-amber-200 dark:border-amber-400/20">
        {icon}
      </div>
      <span className="text-slate-700 dark:text-slate-200 font-medium">{title}</span>
    </div>
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
      {/* Left side - Animated visuals */}
      {/* Left side - Gold gradient background with animations */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-gradient-to-br from-amber-50 via-amber-100/80 to-orange-100/60 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <AnimatedVisuals />
        
        {/* Headline overlay */}
        <div className="absolute inset-0 flex flex-col justify-center px-12 xl:px-20 z-10">
          <div className="max-w-lg relative">
            {/* Subtle backdrop for text contrast */}
            <div className="absolute -inset-6 bg-white/40 dark:bg-slate-900/60 rounded-2xl backdrop-blur-sm -z-10" />
            
            <img 
              src={amvLogo} 
              alt="Amineva" 
              className="h-10 w-auto mb-8"
            />
            <h1 className="text-4xl xl:text-5xl font-bold text-slate-800 dark:text-white leading-tight mb-6">
              The Business<br />Intelligence OS
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-10">
              A unified operating system for modern organizations. Run, analyze, and control your operations, data, workflows, teams, and digital assets from one powerful platform.
            </p>
            
            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4">
              <FeatureItem 
                icon={<Zap className="h-4 w-4 text-accent" />} 
                title="Operations Management" 
              />
              <FeatureItem 
                icon={<BarChart3 className="h-4 w-4 text-accent" />} 
                title="Intelligence & Analytics" 
              />
              <FeatureItem 
                icon={<Shield className="h-4 w-4 text-accent" />} 
                title="Secure Workspaces" 
              />
              <FeatureItem 
                icon={<Activity className="h-4 w-4 text-accent" />} 
                title="Business Monitoring" 
              />
              <FeatureItem 
                icon={<Database className="h-4 w-4 text-accent" />} 
                title="Digital Asset Control" 
              />
              <FeatureItem 
                icon={<Network className="h-4 w-4 text-accent" />} 
                title="Enterprise Integration" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img 
              src={amvLogo} 
              alt="Amineva" 
              className="h-10 w-auto"
            />
          </div>

          {/* Mobile headline */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">The Business Intelligence OS</h1>
            <p className="text-sm text-muted-foreground">
              Run, analyze, and control your organization from one platform.
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
                  onClick={() => handleSocialLogin('google')}
                />
                <SocialButton
                  icon={
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M11.4 24H0V12.6L11.4 0H24v11.4L12.6 24H11.4zM1.8 22.2h8.8L22.2 10.6V1.8h-8.8L1.8 13.4v8.8z"/>
                    </svg>
                  }
                  label="Microsoft"
                  onClick={() => handleSocialLogin('microsoft')}
                />
                <SocialButton
                  icon={
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  }
                  label="Facebook"
                  onClick={() => handleSocialLogin('facebook')}
                />
                <SocialButton
                  icon={
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  }
                  label="GitHub"
                  onClick={() => handleSocialLogin('github')}
                />
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By continuing, you agree to Amineva's Terms of Service and Privacy Policy.
          </p>

          <p className="text-center text-xs text-muted-foreground mt-4">
            © {new Date().getFullYear()} Amineva Global. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
