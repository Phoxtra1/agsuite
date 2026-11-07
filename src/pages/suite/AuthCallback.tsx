import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | null = null;
    let unsubscribe: (() => void) | null = null;

    const returnTo = params.get("returnTo") || "/info-discovery";

    const finish = () => {
      if (cancelled) return;
      if (returnTo.startsWith("http")) {
        window.location.assign(returnTo);
        return;
      }
      navigate(returnTo, { replace: true });
    };

    (async () => {
      if (!isSupabaseConfigured) {
        navigate("/get-started?auth=configuration", { replace: true });
        return;
      }
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          navigate("/?auth=failed", { replace: true });
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        finish();
        return;
      }

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) finish();
      });
      unsubscribe = () => listener.subscription.unsubscribe();

      timeoutId = window.setTimeout(() => {
        unsubscribe?.();
        if (!cancelled) navigate("/?auth=failed", { replace: true });
      }, 5000);
    })();

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      unsubscribe?.();
    };
  }, [params, navigate]);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1 className="text-xl font-semibold">Signing you in…</h1>
      <p className="text-muted-foreground">Please wait.</p>
    </div>
  );
}

