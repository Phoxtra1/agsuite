import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requestSealOTP, verifySealOTP, isSealAuthenticated } from "@/lib/sealAuth";

type Step = "email" | "otp";

export default function Seal() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If already authenticated, redirect
  useEffect(() => {
    if (isSealAuthenticated()) navigate("/suite", { replace: true });
  }, [navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await requestSealOTP(email.trim());
    setLoading(false);
    if (result.success) {
      setStep("otp");
    } else {
      setError(result.error || "Email not valid");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setOtp(next);
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.current[focusIdx]?.focus();
  };

  const handleVerify = async () => {
    setError(null);
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Enter the full 6-digit code");
      return;
    }
    setLoading(true);
    const result = await verifySealOTP(email.trim(), code);
    setLoading(false);
    if (result.success) {
      navigate("/suite", { replace: true });
    } else {
      setError(result.error || "Verification failed");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    }
  };

  // Auto-submit when all digits filled
  useEffect(() => {
    if (step === "otp" && otp.every((d) => d !== "")) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, step]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <AnimatePresence mode="wait">
          {step === "email" ? (
            <motion.form
              key="email-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleEmailSubmit}
              className="space-y-4"
            >
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                name="seal-id"
                className="h-11 bg-slate-900 border-white/5 text-white placeholder-slate-500 focus-visible:ring-white/20 focus-visible:border-white/10"
              />

              {error && (
                <p className="text-xs text-destructive text-center font-medium mt-1">{error}</p>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 bg-white hover:bg-slate-200 text-slate-950 font-medium transition-all" 
                disabled={loading || !email.trim()}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-950 mx-auto" /> : "Continue"}
              </Button>
            </motion.form>
          ) : (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="flex justify-center gap-2 md:gap-3" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    autoFocus={i === 0}
                    className="w-11 h-13 text-center text-xl font-mono font-bold rounded-lg border border-white/5 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
                  />
                ))}
              </div>

              {error && (
                <p className="text-xs text-destructive text-center font-medium mt-1">{error}</p>
              )}

              {loading && (
                <div className="flex justify-center py-1">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                </div>
              )}

              <button
                type="button"
                onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setError(null); }}
                className="block mx-auto text-xs text-slate-500 hover:text-slate-300 transition"
              >
                Use a different email address
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
