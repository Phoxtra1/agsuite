import type { ReactNode } from "react";

/**
 * Temporary public-access switch for Info Discovery.
 * Authentication is intentionally bypassed while backend issues are resolved.
 * Restore the previous PortalAuthGate checks when authentication is ready to return.
 */
export function PortalAuthGate({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export default PortalAuthGate;
