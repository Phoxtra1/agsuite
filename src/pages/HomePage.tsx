import React from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left hero (your animation / branding section) */}
        <section className="relative overflow-hidden suite-gradient">
          <div className="p-8 lg:p-12">
            {/* ✅ keep your existing hero content here */}
            {/* IMPORTANT: do NOT use ml-64 / SuiteNav here */}
          </div>
        </section>

        {/* Right gateway */}
        <section className="flex items-center justify-center p-6 lg:p-10 bg-background">
          <div className="w-full max-w-xl">
            <LoginForm />
          </div>
        </section>
      </div>
    </div>
  );
}
