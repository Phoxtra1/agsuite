import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldOff } from "lucide-react";

export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <ShieldOff className="w-8 h-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Access denied</h1>
          <p className="text-sm text-muted-foreground">
            Your account is authenticated, but it has not been granted access to this
            application. Contact your administrator to request access.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/">Return home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
