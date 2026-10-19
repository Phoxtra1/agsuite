import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductData } from "@/types/product";
import { useAuth } from "@/contexts/AuthContext";
import { loadAppAccess } from "@/lib/auth/appAccess";
import { formatAuthError } from "@/lib/auth";
import { supabase } from "@/integrations/appwrite/client";
import { Mail } from "lucide-react";

interface AuthCardProps {
  product: ProductData;
  authTab: "signin" | "register";
  setAuthTab: (t: "signin" | "register") => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onChangeSelection: () => void;
}

export default function AuthCard({
  product,
  authTab,
  setAuthTab,
  email,
  setEmail,
  password,
  setPassword,
  onChangeSelection,
}: AuthCardProps) {
  const navigate = useNavigate();
  const { login, register, socialLogin, isLoading } = useAuth();

  const [confirmPassword, setConfirmPassword] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [verifySent, setVerifySent] = useState(false);

  const isRegister = authTab === "register";

  const isEmailValid = useMemo(() => {
    const v = email.trim();
    return v.length > 3 && v.includes("@") && v.includes(".");
  }, [email]);

  const isPasswordValid = useMemo(() => password.length >= 8, [password]);

  const confirmOk = useMemo(() => {
    if (!isRegister) return true;
    return confirmPassword === password && confirmPassword.length > 0;
  }, [isRegister, confirmPassword, password]);

  const canSubmit = isEmailValid && isPasswordValid && confirmOk && !isLoading;

  const submit = async () => {
    setErrMsg("");
    try {
      if (isRegister) {
        const result = await register(email.trim(), password, undefined, product.id);
        if (result && !result.session) {
          setVerifySent(true);
          return;
        }
      } else {
        await login(email.trim(), password);

        // Security Access Control Check
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const access = await loadAppAccess(session.user.id, product.id);
          if (!access.allowed) {
            await supabase.auth.signOut();
            setErrMsg(`This email address is registered under another application. Every app in Amineva Suite requires an isolated email address and user account.`);
            return;
          }
        }
      }

      navigate(`/client`, { replace: true });
    } catch (e: any) {
      setErrMsg(formatAuthError(e));
    }
  };

  if (verifySent) {
    return (
      <div className="p-8 border rounded-xl text-center animate-in fade-in slide-in-from-bottom-3 duration-500 max-w-md bg-card">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
          <Mail className="h-6 w-6 text-accent" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Verification Sent!</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          A confirmation link has been sent to <strong>{email}</strong>.
          Please check your inbox and verify your email to access <strong>{product.name}</strong>.
        </p>
        <button
          type="button"
          onClick={() => { setVerifySent(false); setAuthTab("signin"); }}
          className="w-full rounded-lg bg-accent text-accent-foreground font-semibold py-3 hover:opacity-90 transition cursor-pointer"
        >
          Return to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 border rounded-xl">
      <h2 className="text-xl font-semibold mb-4">
        {isRegister ? "Create account" : "Sign in"}
      </h2>

      {errMsg && <div className="text-red-500 mb-2">{errMsg}</div>}

      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input value={password} onChange={(e) => setPassword(e.target.value)} />

      {isRegister && (
        <input
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      )}

      <button disabled={!canSubmit} onClick={submit}>
        {isLoading ? "Please wait…" : isRegister ? "Register" : "Sign in"}
      </button>
    </div>
  );
}
