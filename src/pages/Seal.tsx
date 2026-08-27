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
  Shield,
  Sparkles,
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

  // Minimal position presets
  const POSITION_PRESETS = ["System Manager", "Operations Lead", "Executive Lead"];

  // Handle Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = verifyAdminCredentials(loginId, loginPin);
    setLoading(false);

    if (result.success && result.credential) {
      setSuccessMsg("Authenticated. Redirecting...");
      setTimeout(() => {
        navigate("/suite", { replace: true });
      }, 400);
    } else {
      setError(result.error || "Authentication failed. Invalid credentials.");
    }
  };

  // Handle Creation submission
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPos = position.trim();
    const cleanPin = createPin.trim();

    if (!cleanPos) {
      setError("Select or specify a Position.");
      return;
    }
    if (!cleanPin || cleanPin.length < 4) {
      setError("PIN must be at least 4 digits.");
      return;
    }
    if (cleanPin !== confirmPin.trim()) {
      setError("PINs do not match.");
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

  // Switch to login tab and pre-fill created ID
  const handleSwitchToLoginWithCred = () => {
    if (createdCred) {
      setLoginId(createdCred.id);
      setLoginPin("");
    }
    setShowModal(false);
    setMode("login");
  };

  // Email OTP Handlers
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await requestSealOTP(email.trim());
    setLoading(false);
    if (result.success) {
      setOtpStep("otp");
    } else {
      setError(result.error || "Invalid request");
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
      setError("Enter the 6-digit code");
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
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-slate-900/90 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl z-10 relative"
      >
        {/* Stealth Enclave Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <span className="text-base font-bold text-white tracking-widest uppercase">AMINEVA SEAL</span>
        </div>

        {/* Minimalist Tab Navigation */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950/90 p-1 rounded-xl border border-white/5 mb-6">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(null); setSuccessMsg(null); }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
              mode === "login"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Auth</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode("create"); setError(null); setSuccessMsg(null); }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
              mode === "create"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Register</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode("otp"); setError(null); setSuccessMsg(null); }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
              mode === "otp"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>OTP</span>
          </button>
        </div>

        {/* Feedback Notifications */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-2.5 rounded-lg text-xs mb-4 text-center font-medium"
            >
              {error}
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-2.5 rounded-lg text-xs mb-4 text-center font-medium flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4 text-emerald-400" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form 1: Authentication */}
        {mode === "login" && (
          <form onSubmit={handleLoginSubmit} autoComplete="off" data-form-type="other" className="space-y-3.5">
            <input type="text" name="decoy_user_prevent_autofill" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
            <input type="password" name="decoy_pass_prevent_autofill" style={{ display: "none" }} tabIndex={-1} autoComplete="new-password" />

            <div className="relative">
              <Input
                name="amv_sec_no_autofill_id"
                type="text"
                placeholder="ID / Recovery ID"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                className="h-11 bg-slate-950/80 border-white/10 text-white placeholder-slate-500 focus-visible:ring-emerald-500/40 uppercase font-mono text-sm pl-9"
              />
              <Shield className="h-4 w-4 text-emerald-400 absolute left-3 top-3.5 pointer-events-none" />
            </div>

            <div className="relative">
              <Input
                name="amv_sec_no_autofill_pin"
                type={showLoginPin ? "text" : "password"}
                placeholder="Security PIN"
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value)}
                required
                maxLength={12}
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                className="h-11 bg-slate-950/80 border-white/10 text-white placeholder-slate-500 focus-visible:ring-emerald-500/40 font-mono tracking-widest text-sm pl-9 pr-10"
              />
              <Lock className="h-4 w-4 text-emerald-400 absolute left-3 top-3.5 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowLoginPin(!showLoginPin)}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition"
              >
                {showLoginPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading || !loginId.trim() || !loginPin.trim()}
              className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-lg shadow-emerald-500/20 mt-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-950 mx-auto" />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Authenticate</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </form>
        )}

        {/* Form 2: Credential Registration */}
        {mode === "create" && (
          <form onSubmit={handleCreateSubmit} autoComplete="off" data-form-type="other" className="space-y-3.5">
            <input type="text" name="decoy_user_prevent_autofill" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
            <input type="password" name="decoy_pass_prevent_autofill" style={{ display: "none" }} tabIndex={-1} autoComplete="new-password" />

            <div>
              <Input
                name="amv_sec_no_autofill_position"
                type="text"
                placeholder="Position / Title"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                className="h-11 bg-slate-950/80 border-white/10 text-white placeholder-slate-500 focus-visible:ring-emerald-500/40 text-sm"
              />
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

            <div className="relative">
              <Input
                name="amv_sec_no_autofill_newpin"
                type={showCreatePin ? "text" : "password"}
                placeholder="Create Security PIN"
                value={createPin}
                onChange={(e) => setCreatePin(e.target.value)}
                required
                maxLength={12}
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                className="h-11 bg-slate-950/80 border-white/10 text-white placeholder-slate-500 focus-visible:ring-emerald-500/40 font-mono tracking-widest text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCreatePin(!showCreatePin)}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 transition"
              >
                {showCreatePin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Input
              name="amv_sec_no_autofill_confirmpin"
              type="password"
              placeholder="Confirm Security PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              required
              maxLength={12}
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              className="h-11 bg-slate-950/80 border-white/10 text-white placeholder-slate-500 focus-visible:ring-emerald-500/40 font-mono tracking-widest text-sm"
            />

            <Button
              type="submit"
              disabled={!position.trim() || !createPin.trim() || !confirmPin.trim()}
              className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-lg shadow-emerald-500/20 mt-1"
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Generate ID</span>
              </div>
            </Button>
          </form>
        )}

        {/* Form 3: OTP */}
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
                  className="space-y-3.5"
                >
                  <Input
                    type="email"
                    placeholder="Authorized Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="h-11 bg-slate-950/80 border-white/10 text-white placeholder-slate-500 focus-visible:ring-emerald-500/40 text-sm"
                  />

                  <Button
                    type="submit"
                    className="w-full h-11 bg-white hover:bg-slate-200 text-slate-950 font-medium transition-all"
                    disabled={loading || !email.trim()}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-950 mx-auto" /> : "Request Code"}
                  </Button>
                </motion.form>
              ) : (
                <motion.div
                  key="otp-step"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
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
                        className="w-10 h-11 text-center text-lg font-mono font-bold rounded-lg border border-white/10 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
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
                    Change Email
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-5 relative"
            >
              {/* Modal Top */}
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Credentials Issued</h2>
                  <p className="text-xs text-slate-400">{createdCred.position}</p>
                </div>
              </div>

              {/* Main Admin ID Box (SM-XXX-XXXX) */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Main Admin ID</span>
                    <span className="text-[10px] text-emerald-400 font-mono">SM-XXX-XXXX</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 border border-white/10 rounded-xl p-2.5">
                    <span className="font-mono text-base font-bold text-white tracking-wider select-all">
                      {createdCred.id}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleCopy(createdCred.id, "id")}
                      className="h-7 px-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs gap-1"
                    >
                      {copiedId ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedId ? "Copied" : "Copy"}</span>
                    </Button>
                  </div>
                </div>

                {/* Recovery ID Box (RC-XXX-XXX) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recovery ID</span>
                    <span className="text-[10px] text-amber-400 font-mono">RC-XXX-XXX</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 border border-white/10 rounded-xl p-2.5">
                    <span className="font-mono text-sm font-semibold text-slate-300 tracking-wider select-all">
                      {createdCred.recoveryId}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleCopy(createdCred.recoveryId, "recovery")}
                      className="h-7 px-2.5 bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 text-xs gap-1"
                    >
                      {copiedRecoveryId ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedRecoveryId ? "Copied" : "Copy"}</span>
                    </Button>
                  </div>
                </div>

                {/* PIN Protected Indicator */}
                <div className="bg-slate-950/60 border border-white/5 rounded-lg p-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Security Status:</span>
                  <span className="font-mono text-[11px] font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                    <Lock className="h-3 w-3 text-emerald-400" />
                    <span>PIN Protected</span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <Button
                  onClick={handleDirectLoginFromModal}
                  className="w-full h-10 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>Direct Access to Console</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const text = `Position: ${createdCred.position}\nMain Admin ID: ${createdCred.id}\nRecovery ID: ${createdCred.recoveryId}`;
                      handleCopy(text, "all");
                    }}
                    className="h-9 border-white/10 hover:bg-white/5 text-slate-300 text-xs gap-1"
                  >
                    {copiedAll ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedAll ? "Copied" : "Copy All"}</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleSwitchToLoginWithCred}
                    className="h-9 border-white/10 hover:bg-white/5 text-slate-300 text-xs"
                  >
                    Return to Auth
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
