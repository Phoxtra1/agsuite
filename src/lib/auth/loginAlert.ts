/**
 * Login device alert — fires after successful sign-in to detect new devices.
 * Non-blocking: failures are silently logged, never interrupting the user.
 */

import { supabase } from "@/integrations/supabase/client";

/** Generate a simple device fingerprint from browser properties */
function getDeviceFingerprint(): string {
  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ];
  
  let hash = 0;
  const str = parts.join("|");
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `fp_${Math.abs(hash).toString(36)}`;
}

/** Call after successful login to check for new device and send alert if needed */
export async function checkLoginDevice(): Promise<void> {
  try {
    const fingerprint = getDeviceFingerprint();

    await supabase.functions.invoke("login-alert", {
      body: {
        fingerprint,
        userAgent: navigator.userAgent,
      },
    });
  } catch (err) {
    // Non-blocking — don't disrupt the login flow
    console.warn("[loginAlert] Device check failed (non-blocking):", err);
  }
}
