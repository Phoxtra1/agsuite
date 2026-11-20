import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, LockKeyhole, Mail, UserRound } from "lucide-react";

export default function GetStartedPage() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"register" | "signin">(params.get("mode") === "signin" ? "signin" : "register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!email.trim() || !password) return setError("Enter your email address and password.");
    if (mode === "register") {
      if (!name.trim()) return setError("Enter your name.");
      if (password.length < 8) return setError("Use a password with at least 8 characters.");
      if (password !== confirmPassword) return setError("The passwords do not match.");
    }
    setMessage("Your form is ready. Account registration and sign-in will be activated when the authentication backend is available. No information has been submitted or stored.");
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-7 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
        <section className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
          <div className="mb-7 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><LockKeyhole className="h-6 w-6" /></div>
            <h1 className="mt-4 text-2xl font-semibold">{mode === "register" ? "Create your Amineva account" : "Sign in to Amineva"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Register or sign in to continue to Solutions and your Workspace.</p>
          </div>
          <div className="mb-6 grid grid-cols-2 rounded-lg bg-muted p-1">
            <button type="button" onClick={() => { setMode("register"); setError(""); setMessage(""); }} className={`rounded-md px-3 py-2 text-sm font-medium ${mode === "register" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>Register</button>
            <button type="button" onClick={() => { setMode("signin"); setError(""); setMessage(""); }} className={`rounded-md px-3 py-2 text-sm font-medium ${mode === "signin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>Sign In</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && <div><label className="mb-1.5 block text-sm font-medium">Full name</label><div className="relative"><UserRound className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><input required autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none focus:border-primary" placeholder="Your full name" /></div></div>}
            <div><label className="mb-1.5 block text-sm font-medium">Email address</label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none focus:border-primary" placeholder="name@example.com" /></div></div>
            <div><label className="mb-1.5 block text-sm font-medium">Password</label><input required type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" placeholder="At least 8 characters" /></div>
            {mode === "register" && <div><label className="mb-1.5 block text-sm font-medium">Confirm password</label><input required type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" placeholder="Enter your password again" /></div>}
            {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            {message && <p role="status" className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-sm text-muted-foreground">{message}</p>}
            <button type="submit" className="h-11 w-full rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">{mode === "register" ? "Create account" : "Sign in"}</button>
          </form>
          <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">Authentication is temporarily in preparation. This form is frontend-only and does not send or save your details.</p>
        </section>
      </div>
    </main>
  );
}
