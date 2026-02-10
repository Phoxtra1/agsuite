import { ProductData } from "@/types/product";

interface AuthCardProps {
  product: ProductData;
  authTab: "signin" | "register";
  setAuthTab: (t: "signin" | "register") => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onChangeSelection: () => void;
  onSignIn: () => void;
  onRegister: () => void;
}

export default function AuthCard({
  product,
  authTab,
  setAuthTab,
  email,
  setEmail,
  password,
  setPassword,
  onChangeSelection,
  onSignIn,
  onRegister,
}: AuthCardProps) {
  return (
    <>
      <button
        type="button"
        onClick={onChangeSelection}
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4 cursor-pointer"
      >
        ← Change selection
      </button>

      <div className="border border-border rounded-2xl bg-card text-card-foreground shadow-sm p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground">Sign in to continue</h2>
          <p className="text-sm text-muted-foreground mt-1">Access {product.name}</p>
        </div>

        <div className="mt-6 flex justify-between text-sm font-medium">
          <button
            type="button"
            onClick={() => setAuthTab("signin")}
            className={`pb-3 w-1/2 text-center border-b-2 cursor-pointer ${
              authTab === "signin"
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthTab("register")}
            className={`pb-3 w-1/2 text-center border-b-2 cursor-pointer ${
              authTab === "register"
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Register
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Email Address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-lg border border-input bg-background text-foreground px-4 py-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="name@organization.com"
              type="email"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-input bg-background text-foreground px-4 py-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              placeholder="Enter your password"
              type="password"
            />
          </div>

          {authTab === "signin" ? (
            <button
              type="button"
              onClick={onSignIn}
              className="w-full rounded-lg bg-accent text-accent-foreground font-semibold py-3 hover:opacity-90 transition cursor-pointer"
            >
              Sign In
            </button>
          ) : (
            <button
              type="button"
              onClick={onRegister}
              className="w-full rounded-lg bg-accent text-accent-foreground font-semibold py-3 hover:opacity-90 transition cursor-pointer"
            >
              Register
            </button>
          )}

          <div className="text-center text-xs text-muted-foreground">or continue with</div>

          <div className="grid grid-cols-2 gap-3">
            <button className="rounded-lg border border-input bg-background py-2 text-sm text-foreground hover:bg-muted transition cursor-pointer">
              Google
            </button>
            <button className="rounded-lg border border-input bg-background py-2 text-sm text-foreground hover:bg-muted transition cursor-pointer">
              Microsoft
            </button>
            <button className="rounded-lg border border-input bg-background py-2 text-sm text-foreground hover:bg-muted transition cursor-pointer">
              Facebook
            </button>
            <button className="rounded-lg border border-input bg-background py-2 text-sm text-foreground hover:bg-muted transition cursor-pointer">
              GitHub
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
