import React, { useMemo, useState, useEffect, useCallback } from "react";
import { SUPPORTED_COUNTRIES, getCurrencyFromCountry } from "@/lib/countries";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";

interface CountrySelectionStepProps {
  onContinue: (countryCode: string, currencyCode: string) => void;
  onBack: () => void;
}

export function CountrySelectionStep({ onContinue, onBack }: CountrySelectionStepProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  // Memoize lookup so it doesn't recompute on every render
  const selectedCurrency = useMemo(() => {
    if (!selectedCountry) return null;
    return getCurrencyFromCountry(selectedCountry);
  }, [selectedCountry]);

  // Future-proof: if supported list changes, don’t keep an invalid selection
  useEffect(() => {
    if (!selectedCountry) return;
    const exists = SUPPORTED_COUNTRIES.some((c) => c.code === selectedCountry);
    if (!exists) setSelectedCountry("");
  }, [selectedCountry]);

  const canContinue = Boolean(selectedCountry && selectedCurrency?.currency);

  const handleContinue = useCallback(() => {
    if (!canContinue || !selectedCurrency) return;
    onContinue(selectedCountry, selectedCurrency.currency);
  }, [canContinue, onContinue, selectedCountry, selectedCurrency]);

  // Allow Enter key to continue (helpful when Select is closed)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && canContinue) {
      e.preventDefault();
      handleContinue();
    }
  };

  return (
    <div className="space-y-6" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Change product
      </button>

      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
          <MapPin className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Where is your business located?
        </h2>
        <p className="text-muted-foreground text-sm">
          This helps us set up your currency and regional settings
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="country">Select your Country</Label>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger id="country" className="h-12" aria-label="Select your country">
              <SelectValue placeholder="Choose a country" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCurrency && (
          <div className="p-4 rounded-lg bg-muted/50 border animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Currency</span>
              <span className="font-medium text-foreground">
                {selectedCurrency.currency} ({selectedCurrency.symbol})
              </span>
            </div>
          </div>
        )}
      </div>

      <Button
        type="button"
        onClick={handleContinue}
        disabled={!canContinue}
        className="w-full h-12 btn-premium bg-accent text-accent-foreground hover:bg-accent/90"
      >
        Continue
        <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
    </div>
  );
}
