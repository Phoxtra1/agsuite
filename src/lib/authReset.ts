export function hardResetAuthState() {
  // Kill MFA leftovers
  localStorage.removeItem("twofa_challenge_id");

  // Kill gateway memory
  localStorage.removeItem("amineva_gateway_state");

  // Kill app routing memory
  localStorage.removeItem("activeApp");
  localStorage.removeItem("activeShop");
  localStorage.removeItem("lastRoute");

  // Kill everything session-scoped
  sessionStorage.clear();
}
