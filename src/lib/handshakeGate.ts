import { supabase } from "@/integrations/supabase/client";

/**
 * Ecosystem Gateway Protection SDK
 * 
 * Enforces that this application:
 * 1. Can ONLY be rendered inside a secure iframe framed by the Amineva Suite (Frame Lock).
 * 2. Requires a cryptographically secure, single-use SSO handshake token from the Suite on initial load.
 * 
 * Usage:
 * Call `enforceSuiteHandshake("aminevaops")` at the root of the child application (e.g., App.tsx or main.tsx).
 */

const HANDSHAKE_SESSION_KEY = "__amv_gate_cleared";
const CENTRAL_SUITE_URL = "https://suite.amineva.com";

const isPreview = (): boolean => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return ["lovable.app", "lovableproject.com", "localhost", "127.0.0.1"].some(h => host.includes(h));
};

export async function enforceSuiteHandshake(appName: string): Promise<boolean> {
  // 0. Development/Preview bypass: Ignore gates when testing inside local/development preview modes
  if (isPreview()) {
    return true;
  }

  // 1. Frame Lock check: Enforce loading strictly within an iframe container
  if (window.self === window.top) {
    console.error("Access Blocked: Direct browser window loading is not permitted for security.");
    window.location.replace(`${CENTRAL_SUITE_URL}/access-denied?reason=frame_lock`);
    return false;
  }

  // 2. Session check: If already validated and cleared during this tab session, allow entry
  if (sessionStorage.getItem(HANDSHAKE_SESSION_KEY) === "true") {
    return true;
  }

  // 3. Handshake validation: Extract ?handshake=TOKEN from URL parameters
  const params = new URLSearchParams(window.location.search);
  const token = params.get("handshake");

  if (!token) {
    console.error("Access Blocked: Missing secure SSO handshake token.");
    window.location.replace(`${CENTRAL_SUITE_URL}/access-denied?reason=missing_handshake`);
    return false;
  }

  try {
    // 4. Verify and consume the handshake token via shared Supabase backend RPC
    const { data: isValid, error } = await (supabase.rpc as any)("verify_handshake_token", {
      token_to_verify: token,
      target_app_name: appName.toLowerCase().trim()
    });

    if (error || !isValid) {
      console.error("Access Blocked: Handshake token is invalid, expired, or already consumed.");
      window.location.replace(`${CENTRAL_SUITE_URL}/access-denied?reason=invalid_handshake`);
      return false;
    }

    // 5. Successful validation: Clear token from query parameter and store session clearance
    sessionStorage.setItem(HANDSHAKE_SESSION_KEY, "true");
    
    // Strip the handshake parameter from URL so the user never sees it or copies it
    params.delete("handshake");
    const newQuery = params.toString();
    const newUrl = `${window.location.pathname}${newQuery ? "?" + newQuery : ""}${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);

    return true;
  } catch (err) {
    console.error("System error validating handshake:", err);
    window.location.replace(`${CENTRAL_SUITE_URL}/access-denied?reason=handshake_error`);
    return false;
  }
}
