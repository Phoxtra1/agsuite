import React, { useState, useEffect } from 'react';
import { BarChart3, Zap, Network, Database, Activity } from 'lucide-react';
import { GatewayFlow } from '@/components/gateway/GatewayFlow';
import amvLogo from '@/assets/amv_global_logo.png';

// Animated text phrases
const ANIMATED_PHRASES = [
  'BRIDGING THE GAP BETWEEN INFORMATION AND EXECUTION',
  'DELIVERING VERIFIED FIELD INSIGHTS',
  'EMPOWERING PROJECT OWNERS AND INVESTORS',
  'ENABLING INSTITUTIONS AND DECISION MAKERS',
];

// Smooth animated text component
function AnimatedText() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ANIMATED_PHRASES.length);
        setIsVisible(true);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[48px] flex items-start">
      <p
        className={`text-xs md:text-sm text-accent font-semibold tracking-wider uppercase transition-all duration-500 ease-in-out text-left max-w-[280px] leading-relaxed ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        {ANIMATED_PHRASES[currentIndex]}
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
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
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
              animationDuration: `${2 + (i % 3)}s`,
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
          <div className="absolute inset-0 border border-accent/20 rounded-full" style={{ animation: 'spin 20s linear infinite' }} />
          <div className="absolute inset-8 border border-accent/15 rounded-full" style={{ animation: 'spin 15s linear infinite reverse' }} />

          {/* Dashboard cards */}
          <div
            className={`absolute top-8 left-1/2 -translate-x-1/2 transition-all duration-700 ${
              activeIndex === 0 ? 'opacity-100 scale-100' : 'opacity-30 scale-90'
            }`}
          >
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

          <div
            className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-700 ${
              activeIndex === 2 ? 'opacity-100 scale-100' : 'opacity-30 scale-90'
            }`}
          >
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

          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 transition-all duration-700 ${
              activeIndex === 3 ? 'opacity-100 scale-100' : 'opacity-30 scale-90'
            }`}
          >
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

          <div
            className={`absolute right-0 top-1/2 -translate-y-1/2 transition-all duration-700 ${
              activeIndex === 1 ? 'opacity-100 scale-100' : 'opacity-30 scale-90'
            }`}
          >
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

export function LoginForm() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex flex-1">
        {/* Left side - Animated visuals with logo at top-left - Always dark for brand consistency */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative bg-[hsl(222_47%_11%)] dark:bg-[hsl(222_47%_14%)] overflow-hidden">
          {/* Logo and animated text aligned at top-left */}
          <div className="absolute top-6 left-6 z-20 flex items-start gap-4">
            <img 
              src={amvLogo} 
              alt="Amineva Global" 
              className="h-14 w-14 rounded-full flex-shrink-0"
            />
            <div className="pt-1">
              <AnimatedText />
            </div>
          </div>
          
          <AnimatedVisuals />
        </div>

        {/* Right side - Gateway flow (respects theme) */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto bg-background">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <img 
                src={amvLogo} 
                alt="Amineva Global" 
                className="h-16 w-16 rounded-full mx-auto mb-4"
              />
            </div>

            <GatewayFlow />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border bg-background">
        © {currentYear} Suite Powered By Amineva Global. All Rights Reserved.
      </footer>
    </div>
  );
}
