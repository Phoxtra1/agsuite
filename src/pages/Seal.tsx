import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldCheck, Mail, ArrowLeft, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requestSealOTP, verifySealOTP, isSealAuthenticated } from "@/lib/sealAuth";
import amvLogo from "@/assets/amv_logo.png";

type Step = "email" | "otp";

export default function Seal() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setError(null);
    setLoading(true);
    const result = await requestSealOTP(email.trim());
    setLoading(false);
    if (result.success) {
      setCooldown(45);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } else {
      setError(result.error || "Failed to resend");
    }
  };

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
      setCooldown(45);
    } else {
      setError(result.error || "Access unauthorized or email invalid.");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-4 transition-all duration-500">
      <div className="mb-8 flex flex-col items-center gap-2">
        <img src={amvLogo} alt="Amineva" className="h-10 opacity-90 filter drop-shadow-[0_2px_10px_rgba(255,255,255,0.05)]" />
        <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">
          Amineva Central Portal
        </span>
      </div>

      <Card className="w-full max-w-md border-white/5 bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
        <CardContent className="pt-8 pb-6 px-6 md:px-8">
          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.form
                key="email-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleEmailSubmit}
                className="space-y-6"
              >
                <div className="space-y-2 text-center pb-2">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/80 border border-white/5 shadow-inner">
                    <ShieldCheck className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-white">Administrator Seal</h1>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto">
                    Access restricted to authorized ecosystem managers.
                  </p>
                </div>

                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Enter admin email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    name="seal-id"
                    className="h-11 bg-slate-950/40 border-white/5 text-white placeholder-slate-500 focus-visible:ring-white/20 focus-visible:border-white/10"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive-foreground animate-in fade-in duration-300">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-destructive" />
                    <span className="leading-normal">{error}</span>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-lg transition-all" 
                  disabled={loading || !email.trim()}
                >
                  {loading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Authorizing Gateway...
                    </span>
                  ) : (
                    "Authorize OTP"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-10 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  onClick={() => navigate("/", { replace: true })}
                >
                  <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                  Return to Home
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
                <div className="space-y-2 text-center pb-2">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/80 border border-white/5 shadow-inner">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-white">Enter OTP Code</h1>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto">
                    A secure 6-digit confirmation code was sent to your administrator address.
                  </p>
                </div>

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
                      className="w-11 h-13 text-center text-xl font-mono font-bold rounded-lg border border-white/5 bg-slate-950/40 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
                    />
                  ))}
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive-foreground animate-in fade-in duration-300">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-destructive" />
                    <span className="leading-normal">{error}</span>
                  </div>
                )}

                {loading && (
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-1">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    <span>Verifying session parameters...</span>
                  </div>
                )}

                <div className="flex flex-col items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0 || loading}
                    className="text-xs text-slate-400 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setError(null); setCooldown(0); }}
                    className="text-xs text-slate-500 hover:text-slate-300 transition"
                  >
                    Use a different email address
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
