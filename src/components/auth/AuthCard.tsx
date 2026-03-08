import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductData } from "@/types/product";
import { useAuth } from "@/contexts/AuthContext";

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
        await register(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }

      navigate(`/suite`, { replace: true });
    } catch (e: any) {
      setErrMsg(e?.message || "Authentication failed.");
    }
  };

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