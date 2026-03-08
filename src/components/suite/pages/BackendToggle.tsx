import React, { useState, useEffect } from "react";
import BackendManager, { type BackendType } from "@/core/backend/BackendManager";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Cloud, Server } from "lucide-react";
import { toast } from "sonner";

export const BackendToggle: React.FC = () => {
  const [backend, setBackend] = useState<BackendType>(BackendManager.getBackend());

  // Stay in sync with external changes
  useEffect(() => {
    const unsub = BackendManager.onChange((b) => setBackend(b));
    return unsub;
  }, []);

  const handleToggle = () => {
    const newBackend: BackendType = backend === "lovable" ? "appwrite" : "lovable";
    BackendManager.setBackend(newBackend);
    toast.success(`Backend switched to ${newBackend === "lovable" ? "Lovable Cloud" : "Appwrite"}`, {
      description: "All modules will reload with the new provider.",
    });
  };

  const isLovable = backend === "lovable";

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        {isLovable ? (
          <Cloud className="h-5 w-5 text-primary" />
        ) : (
          <Server className="h-5 w-5 text-accent" />
        )}
        <div>
          <p className="text-sm font-medium text-foreground">Backend Provider</p>
          <p className="text-xs text-muted-foreground">
            {isLovable
              ? "Connected to Lovable Cloud (Supabase)"
              : "Connected to Appwrite"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className={`text-xs ${
            isLovable
              ? "border-primary/50 text-primary"
              : "border-accent/50 text-accent"
          }`}
        >
          {isLovable ? "Cloud" : "Appwrite"}
        </Badge>
        <Switch checked={isLovable} onCheckedChange={handleToggle} />
      </div>
    </div>
  );
};
