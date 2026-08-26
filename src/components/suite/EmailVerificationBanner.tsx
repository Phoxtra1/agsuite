import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/appwrite/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSession } from "@/components/auth/AppAuthGate";
import { Button } from "@/components/ui/button";
import { MailWarning, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const { access } = useAppSession();
  const [verified, setVerified] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!user || !access?.appId) return;

    // Initial fetch
    supabase
      .from("profiles")
      .select("email_verified")
      .eq("user_id", user.id)
      .eq("app_id", access.appId)
      .maybeSingle()
      .then(({ data }) => setVerified(data?.email_verified ?? false));

    // Realtime subscription — auto-hide when verified
    const channel = supabase
      .channel("profile-verify")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new?.app_id === access.appId && payload.new?.email_verified) setVerified(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, access?.appId]);

  if (!user || verified === null || verified || dismissed) return null;

  const handleResend = async () => {
    setResending(true);
    try {
      const redirectTarget = access?.appId 
        ? `/auth/verify-email?product=${access.appId}` 
        : '/auth/verify-email';
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(redirectTarget)}`,
        }
      });
      if (error) throw error;
      toast.success("Verification email sent — check your inbox.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send verification email. Try again later.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning/15">
          <MailWarning className="h-4 w-4 text-warning" />
        </div>
        <p className="text-sm text-foreground">
          Your email is not yet verified.{" "}
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-accent hover:text-accent/80 font-medium"
            onClick={handleResend}
            disabled={resending}
          >
            {resending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
            Resend verification email
          </Button>
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
