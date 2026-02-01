import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ProductSelectionStep } from './ProductSelectionStep';
import { CountrySelectionStep } from './CountrySelectionStep';
import { AuthStep } from './AuthStep';
import { loadGatewayState, saveGatewayState, clearGatewayState, GatewayStep } from '@/suite/gateway/gatewayState';
import { loadProducts } from '@/data/products';
import { toast } from '@/components/ui/sonner';

export function GatewayFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  
  const [step, setStep] = useState<GatewayStep>('product_selection');
  const [selectedProductKey, setSelectedProductKey] = useState<string | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string | null>(null);

  // Load persisted state on mount
  useEffect(() => {
    const state = loadGatewayState();
    setSelectedProductKey(state.selectedProductKey);
    setSelectedCountryCode(state.selectedCountryCode);
    setSelectedCurrencyCode(state.selectedCurrencyCode);
    
    // Resume from correct step
    if (state.selectedProductKey) {
      if (state.selectedProductKey === 'agstock' && !state.selectedCountryCode) {
        setStep('country_selection');
      } else if (!isAuthenticated) {
        setStep('auth');
      } else {
        setStep('routing');
      }
    }
  }, [isAuthenticated]);

  // Handle product selection
  const handleSelectProduct = (productKey: string) => {
    setSelectedProductKey(productKey);
    saveGatewayState({ selectedProductKey: productKey });

    // AGStock requires country selection first
    if (productKey === 'agstock') {
      setStep('country_selection');
    } else {
      // Other products go straight to auth
      setStep('auth');
    }
  };

  // Handle "Explore Later" - go to auth without product selection
  const handleExploreLater = () => {
    setSelectedProductKey(null);
    saveGatewayState({ selectedProductKey: null });
    setStep('auth');
  };

  // Handle country selection (AGStock only)
  const handleCountrySelected = (countryCode: string, currencyCode: string) => {
    setSelectedCountryCode(countryCode);
    setSelectedCurrencyCode(currencyCode);
    saveGatewayState({ 
      selectedCountryCode: countryCode, 
      selectedCurrencyCode: currencyCode 
    });
    setStep('auth');
  };

  // Handle back to product selection
  const handleBackToProducts = () => {
    setStep('product_selection');
    setSelectedProductKey(null);
    setSelectedCountryCode(null);
    setSelectedCurrencyCode(null);
    clearGatewayState();
  };

  // Handle back from auth (to country or products)
  const handleBackFromAuth = () => {
    if (selectedProductKey === 'agstock') {
      setStep('country_selection');
    } else {
      handleBackToProducts();
    }
  };

  // Route user after auth
  const routeToProduct = useCallback(() => {
    const products = loadProducts();
    
    if (!selectedProductKey) {
      // Explore later - go to suite dashboard
      clearGatewayState();
      navigate('/suite', { replace: true });
      return;
    }

    const product = products.find(p => p.id === selectedProductKey);
    if (!product) {
      toast.error('Product not found');
      clearGatewayState();
      navigate('/suite', { replace: true });
      return;
    }

    // TODO: Create/update Suite profile with selectedProductKey, countryCode, currencyCode
    // This would be an Appwrite database call

    // Clear gateway state
    clearGatewayState();

    // Route to external product
    if (product.url) {
      window.location.href = product.url;
    } else {
      navigate('/suite', { replace: true });
    }
  }, [selectedProductKey, selectedCountryCode, selectedCurrencyCode, navigate]);

  // Handle successful auth
  const handleAuthSuccess = () => {
    setStep('routing');
    routeToProduct();
  };

  // Render current step
  switch (step) {
    case 'product_selection':
      return (
        <ProductSelectionStep
          onSelectProduct={handleSelectProduct}
          onExploreLater={handleExploreLater}
        />
      );
    
    case 'country_selection':
      return (
        <CountrySelectionStep
          onContinue={handleCountrySelected}
          onBack={handleBackToProducts}
        />
      );
    
    case 'auth':
      return (
        <AuthStep
          selectedProductKey={selectedProductKey}
          onBack={handleBackFromAuth}
          onAuthSuccess={handleAuthSuccess}
        />
      );
    
    case 'routing':
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-accent/20 animate-pulse" />
            <p className="text-muted-foreground">Redirecting...</p>
          </div>
        </div>
      );
    
    default:
      return null;
  }
}
