import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  KeyRound,
  UserPlus,
  Mail,
  Copy,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ArrowRight,
  Sparkles,
  Shield,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  requestSealOTP,
  verifySealOTP,
  isSealAuthenticated,
  createAdminCredential,
  verifyAdminCredentials,
  setSealSession,
  AdminCredential,
} from "@/lib/sealAuth";

type AuthMode = "login" | "create" | "otp";
type OTPStep = "email" | "otp";

export default function Seal() {
  const navigate = useNavigate();

  // Active mode
  const [mode, setMode] = useState<AuthMode>("login");

  // Login form state
  const [loginId, setLoginId] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [showLoginPin, setShowLoginPin] = useState(false);

  // Creation form state
  const [position, setPosition] = useState("System Manager");
  const [createPin, setCreatePin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showCreatePin, setShowCreatePin] = useState(false);

  // OTP form state
  const [otpStep, setOtpStep] = useState<OTPStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Modal & feedback state
  const [showModal, setShowModal] = useState(false);
  const [createdCred, setCreatedCred] = useState<AdminCredential | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedRecoveryId, setCopiedRecoveryId] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // Status state
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect
  useEffect(() => {
    if (isSealAuthenticated()) {
      navigate("/suite", { replace: true });
    }
  }, [navigate]);

  // Position presets
  const POSITION_PRESETS = [
    "System Manager",
    "System Administrator",
    "Operations Lead",
    "Executive Director",
  ];

  // Handle Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = verifyAdminCredentials(loginId, loginPin);
    setLoading(false);

    if (result.success && result.credential) {
      setSuccessMsg(`Welcome, ${result.credential.position}! Redirecting to Amineva Console...`);
      setTimeout(() => {
        navigate("/suite", { replace: true });
      }, 500);
    } else {
      setError(result.error || "Authentication failed. Check your ID/Recovery ID and PIN.");
    }
  };

  // Handle Creation submission
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPos = position.trim();
    const cleanPin = createPin.trim();

    if (!cleanPos) {
      setError("Please enter or select a Position / Title.");
      return;
    }
    if (!cleanPin || cleanPin.length < 4) {
      setError("PIN must be at least 4 digits.");
      return;
    }
    if (cleanPin !== confirmPin.trim()) {
      setError("PINs do not match. Please verify your PIN.");
      return;
    }

    const cred = createAdminCredential(cleanPos, cleanPin);
    setCreatedCred(cred);
    setShowModal(true);
    setCreatePin("");
    setConfirmPin("");
  };

  // Copy handlers
  const handleCopy = (text: string, type: "id" | "recovery" | "all") => {
    navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else if (type === "recovery") {
      setCopiedRecoveryId(true);
      setTimeout(() => setCopiedRecoveryId(false), 2000);
    } else {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  // Direct authenticate from modal
  const handleDirectLoginFromModal = () => {
    if (!createdCred) return;
    const mockToken = `seal_id_tk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const emailAlias = `${createdCred.position.toLowerCase().replace(/[^a-z0-9]/g, ".")}@amineva.com`;
    setSealSession(mockToken, emailAlias, createdCred.position, createdCred.id);
    setShowModal(false);
    navigate("/suite", { replace: true });
  };

  // Switch to login tab and pre-fill created ID (keeping PIN empty for maximum security)
  const handleSwitchToLoginWithCred = () => {
    if (createdCred) {
      setLoginId(createdCred.id);
      setLoginPin("");
    }
    setShowModal(false);
    setMode("login");
  };

  // Email OTP Handlers (Retained for covert email option)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await requestSealOTP(email.trim());
    setLoading(false);
    if (result.success) {
      setOtpStep("otp");
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

  const handleVerifyOtp = async () => {
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

  useEffect(() => {
    if (mode === "otp" && otpStep === "otp" && otp.every((d) => d !== "")) {
      handleVerifyOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, otpStep, mode]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background ambient glowing shapes */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Outer Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/90 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl z-10 relative"
      >
        {/* Enclave Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">AMINEVA SEAL AUTH</h1>
          <p className="text-xs text-slate-400 mt-1">
            System Manager & Console Access Verification
          </p>
        </div>

        {/* Auth Option Mode Switcher */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-1.5 rounded-xl border border-white/5 mb-6">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(null); setSuccessMsg(null); }}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium rounded-lg transition-all ${
              mode === "login"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>ID Login</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode("create"); setError(null); setSuccessMsg(null); }}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium rounded-lg transition-all ${
              mode === "create"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Create ID</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode("otp"); setError(null); setSuccessMsg(null); }}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium rounded-lg transition-all ${
              mode === "otp"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Email OTP</span>
          </button>
        </div>

        {/* Global Feedback Notifications */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-lg text-xs mb-4 text-center font-medium"
            >
              {error}
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3 rounded-lg text-xs mb-4 text-center font-medium flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4 text-emerald-400" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode 1: Login via ID / Recovery ID & PIN */}
        {mode === "login" && (
          <form onSubmit={handleLoginSubmit} autoComplete="off" data-form-type="other" className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Admin ID or Recovery ID
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="e.g. AMV-SEC-001 or AMV-REC-999001"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  className="h-11 bg-slate-950/70 border-white/10 text-white placeholder-slate-500 focus-visible:ring-emerald-500/40 uppercase tracking-wide font-mono text-sm pr-9"
                />
                <Shield className="h-4 w-4 text-slate-500 absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Security PIN
              </label>
              <div className="relative">
                <Input
                  type={showLoginPin ? "text" : "password"}
                  placeholder="Enter 4-6 digit PIN"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  required
                  maxLength={12}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  className="h-11 bg-slate-950/70 border-white/10 text-white placeholder-slate-500 focus-visible:ring-emerald-500/40 font-mono tracking-widest text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPin(!showLoginPin)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition"
                >
                  {showLoginPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !loginId.trim() || !loginPin.trim()}
              className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-lg shadow-emerald-500/20 mt-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-950 mx-auto" />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Authenticate & Enter Console</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => { setMode("create"); setError(null); }}
                className="text-xs text-slate-400 hover:text-emerald-400 transition underline underline-offset-4"
              >
                Need to create a new Admin ID & PIN? Click here
              </button>
            </div>
          </form>
        )}

        {/* Mode 2: Create Admin ID & PIN */}
        {mode === "create" && (
          <form onSubmit={handleCreateSubmit} autoComplete="off" data-form-type="other" className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Position / Title
              </label>
              <Input
                type="text"
                placeholder="e.g. System Manager, Operations Lead"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
                autoComplete="off"
                data-lpignore="true"
                className="h-11 bg-slate-950/70 border-white/10 text-white placeholder-slate-500 focus-visible:ring-emerald-500/40 text-sm"
              />
              {/* Presets */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {POSITION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPosition(preset)}
                    className={`text-[10px] px-2 py-1 rounded-md border transition ${
                      position === preset
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "bg-slate-950/50 border-white/5 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Create Security PIN
              </label>
              <div className="relative">
                <Input
                  type={showCreatePin ? "text" : "password"}
                  placeholder="Create 4-6 digit numeric PIN"
                  value={createPin}
                  onChange={(e) => setCreatePin(e.target.value)}
                  required
                  maxLength={12}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  className="h-11 bg-slate-950/70 border-white/10 text-white placeholder-slate-500 focus-visible:ring-emerald-500/40 font-mono tracking-widest text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePin(!showCreatePin)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition"
                >
                  {showCreatePin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Confirm Security PIN
              </label>
              <Input
                type="password"
                placeholder="Re-enter PIN to verify"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                required
                maxLength={12}
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                className="h-11 bg-slate-950/70 border-white/10 text-white placeholder-slate-500 focus-visible:ring-emerald-500/40 font-mono tracking-widest text-sm"
              />
            </div>

            <Button
              type="submit"
              disabled={!position.trim() || !createPin.trim() || !confirmPin.trim()}
              className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-lg shadow-emerald-500/20 mt-2"
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Generate Admin ID & Recovery ID</span>
              </div>
            </Button>

            <p className="text-[11px] text-slate-500 text-center">
              Your generated Admin ID and Recovery ID will be displayed in a secure modal for copying.
            </p>
          </form>
        )}

        {/* Mode 3: Email OTP (Legacy Option) */}
        {mode === "otp" && (
          <div>
            <AnimatePresence mode="wait">
              {otpStep === "email" ? (
                <motion.form
                  key="email-step"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleEmailSubmit}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Authorized Admin Email
                    </label>
                    <Input
                      type="email"
                      placeholder="admin@amineva.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      className="h-11 bg-slate-950/70 border-white/10 text-white placeholder-slate-500 focus-visible:ring-emerald-500/40 text-sm"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-white hover:bg-slate-200 text-slate-950 font-medium transition-all"
                    disabled={loading || !email.trim()}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-950 mx-auto" /> : "Send Verification Code"}
                  </Button>
                </motion.form>
              ) : (
                <motion.div
                  key="otp-step"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <p className="text-xs text-slate-400 text-center">
                    Enter the 6-digit OTP code sent to <span className="text-white font-medium">{email}</span>
                  </p>

                  <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
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
                        className="w-11 h-12 text-center text-xl font-mono font-bold rounded-lg border border-white/10 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      />
                    ))}
                  </div>

                  {loading && (
                    <div className="flex justify-center py-1">
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => { setOtpStep("email"); setOtp(["", "", "", "", "", ""]); setError(null); }}
                    className="block mx-auto text-xs text-slate-500 hover:text-slate-300 transition"
                  >
                    Use a different email address
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Generated Admin Credentials Modal Dialog */}
      <AnimatePresence>
        {showModal && createdCred && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl shadow-emerald-500/10 space-y-6 relative overflow-hidden"
            >
              {/* Modal Top Banner */}
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Admin Credentials Issued</h2>
                  <p className="text-xs text-slate-400">
                    Position: <span className="text-emerald-300 font-semibold">{createdCred.position}</span>
                  </p>
                </div>
              </div>

              {/* Main Admin ID Box */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Main Admin ID
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Primary Login
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 border border-white/10 rounded-xl p-3">
                    <span className="font-mono text-lg font-bold text-white tracking-wider select-all">
                      {createdCred.id}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleCopy(createdCred.id, "id")}
                      className="h-8 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs gap-1.5"
                    >
                      {copiedId ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy ID</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Recovery ID Box */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Recovery ID
                    </span>
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Backup / Reset
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 border border-white/10 rounded-xl p-3">
                    <span className="font-mono text-base font-semibold text-slate-300 tracking-wider select-all">
                      {createdCred.recoveryId}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleCopy(createdCred.recoveryId, "recovery")}
                      className="h-8 px-3 bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 text-xs gap-1.5"
                    >
                      {copiedRecoveryId ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy ID</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* PIN Security Indicator (Confidential & Masked) */}
                <div className="bg-slate-950/60 border border-white/5 rounded-lg p-2.5 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Security PIN Status:</span>
                  <span className="font-mono font-bold text-emerald-400 tracking-widest flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Protected (Keep Confidential)</span>
                  </span>
                </div>

                {/* Security Warning Notice */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-200">
                    <Lock className="h-3.5 w-3.5 text-amber-400" />
                    <span>Important Security Instruction</span>
                  </div>
                  <p className="text-[11px] text-amber-300/90 leading-relaxed">
                    Please copy and securely store both your <strong>Main Admin ID</strong> and <strong>Recovery ID</strong>. Either ID combined with your PIN allows you to log into Amineva Console and Amineva Suite.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  onClick={handleDirectLoginFromModal}
                  className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>Direct Access to Console</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const text = `Position: ${createdCred.position}\nMain Admin ID: ${createdCred.id}\nRecovery ID: ${createdCred.recoveryId}\nSecurity Note: Keep your PIN confidential.`;
                      handleCopy(text, "all");
                    }}
                    className="h-10 border-white/10 hover:bg-white/5 text-slate-300 text-xs gap-1.5"
                  >
                    {copiedAll ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedAll ? "Copied Details" : "Copy Details"}</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleSwitchToLoginWithCred}
                    className="h-10 border-white/10 hover:bg-white/5 text-slate-300 text-xs"
                  >
                    Go to Login Screen
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

