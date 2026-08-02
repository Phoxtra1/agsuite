import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, Globe, FileText, ArrowLeft, Loader2, Sparkles, FolderLock } from "lucide-react";
import { Button } from "@/components/ui/button";
import amvLogo from "@/assets/amv_global_logo.png";

export default function SharedFileViewer() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate lookup of temporary signed URL or token parsing
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Branding public header */}
      <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={amvLogo} alt="" className="h-9 w-9 rounded-full" />
          <div>
            <div className="text-sm font-semibold text-foreground">Amineva Drive</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Public Access Gate</div>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2 rounded-xl text-xs">
          <ArrowLeft className="h-4 w-4" /> Exit Access
        </Button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            <p className="text-xs text-muted-foreground">Authorizing public secure token link…</p>
          </div>
        ) : (
          <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 text-center space-y-6 shadow-xl animate-fade-in">
            <div className="mx-auto h-16 w-16 bg-sky-500/10 text-sky-500 rounded-3xl flex items-center justify-center">
              <FolderLock className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-foreground">Secure Shared Workspace Item</h1>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                You have been granted secure temporary access to this specific workspace artifact.
              </p>
            </div>

            {/* Simulated file display */}
            <div className="p-4 bg-muted/40 rounded-2xl flex items-center justify-between border border-border/40">
              <div className="flex items-center gap-3 text-left">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-xs font-bold text-foreground">Shared Workspace Resource</p>
                  <p className="text-[10px] text-muted-foreground">Secure Token verified</p>
                </div>
              </div>
              <Button size="sm" className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs gap-1.5" onClick={() => {
                window.open("https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=600&auto=format&fit=crop", "_blank");
              }}>
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Powered securely by Dipa Intelligence
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-border text-center text-[10px] text-muted-foreground bg-card/40">
        © {new Date().getFullYear()} Amineva Workspace. Security auditing active on all transactions.
      </footer>
    </div>
  );
}
