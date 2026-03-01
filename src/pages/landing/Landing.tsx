// src/pages/landing/Landing.tsx
// PURPOSE: Layout wrapper for public landing pages

import React from "react";
import { Outlet } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}
