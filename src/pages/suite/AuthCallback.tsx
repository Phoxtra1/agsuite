import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { account } from "@/lib/appwrite"; // use your existing Appwrite client import

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const userId = params.get("userId");
      const secret = params.get("secret");

      if (!userId || !secret) {
        navigate("/suite", { replace: true });
        return;
      }

      try {
        // ✅ This creates a session using the token you generated server-side
        await account.createSession(userId, secret);

        // go to suite dashboard (change route if yours differs)
        navigate("/suite", { replace: true });
      } catch {
        // token expired or already used
        navigate("/suite?auth=failed", { replace: true });
      }
    })();
  }, [params, navigate]);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1 className="text-xl font-semibold">Signing you in…</h1>
      <p className="text-muted-foreground">Please wait.</p>
    </div>
  );
}
