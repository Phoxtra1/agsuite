import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface InviteAuthFormProps {
  productKey: string;
  productName: string;
  prefillEmail?: string;
  onAuthSuccess: () => void;
  onBack: () => void;
}

export function InviteAuthForm({ 
  productKey, 
  productName, 
  prefillEmail, 
  onAuthSuccess, 
  onBack 
}: InviteAuthFormProps) {
  const { login, register, isLoading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState(prefillEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Lock email field if prefilled from invite
  const emailLocked = !!prefillEmail;

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // HARD RESET PREVIOUS USER STATE (CRITICAL)
  hardResetAuthState();

  setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    // Validate email matches invite (security)
    if (prefillEmail && email.toLowerCase() !== prefillEmail.toLowerCase()) {
      setError('Email must match the invited email address');
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (isRegister && password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      onAuthSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      // Make common errors more user-friendly
      if (message.includes('Invalid credentials') || message.includes('Invalid email')) {
        setError('Invalid email or password. Please try again.');
      } else if (message.includes('already exists') || message.includes('already registered')) {
        setError('An account with this email already exists. Please sign in instead.');
        setIsRegister(false);
      } else {
        setError(message);
      }
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Cancel invite
      </button>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6 pb-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-foreground mb-1">
              {isRegister ? 'Create your account' : 'Sign in to continue'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Join {productName}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex mb-6">
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
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                disabled={isLoading || emailLocked}
                className={`h-11 bg-background/50 ${emailLocked ? 'bg-muted cursor-not-allowed' : ''}`}
                autoComplete="email"
              />
              {emailLocked && (
                <p className="text-xs text-muted-foreground">
                  This invite is for {prefillEmail}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isRegister ? 'Create a password (8+ chars)' : 'Enter your password'}
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

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
