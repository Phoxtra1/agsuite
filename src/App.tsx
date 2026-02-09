import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage"; // create this
import Suite from "./pages/Suite";
import NotFound from "./pages/NotFound";

const InviteBridge = lazy(() => import("./pages/InviteBridge"));
const Verify2FA = lazy(() => import("./pages/auth/Verify2FA"));

export default function AppRoutes() {
  return (
    <Routes>
      {/* ✅ Public homepage ONLY */}
      <Route path="/" element={<HomePage />} />

      {/* Invite / Auth */}
      <Route path="/invite/:product" element={<Suspense><InviteBridge /></Suspense>} />
      <Route path="/auth/verify-2fa" element={<Suspense><Verify2FA /></Suspense>} />

      {/* ✅ Dashboard ONLY */}
      <Route path="/suite/*" element={<Suite />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
