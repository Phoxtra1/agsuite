import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MailWarning, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [verified, setVerified] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("email_verified")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => setVerified(data?.email_verified ?? false));
  }, [user]);

  if (!user || verified === null || verified || dismissed) return null;

  const handleResend = async () => {
    setResending(true);
    try {
      const { error } = await supabase.functions.invoke("send-verification-email", {
        body: { origin: window.location.origin },
      });
      if (error) throw error;
      toast.success("Verification email sent — check your inbox.");
    } catch {
      toast.error("Failed to send verification email. Try again later.");
    } finally {
      setResending(false);
    }
  };

  return (
    <Alert className="mb-6 border-amber-500/40 bg-amber-500/10 text-foreground flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <MailWarning className="h-5 w-5 text-amber-500 shrink-0" />
        <AlertDescription className="text-sm">
          Your email is not verified.{" "}
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-amber-600 dark:text-amber-400 underline"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Resend verification email
          </Button>
        </AlertDescription>
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setDismissed(true)}>
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}
