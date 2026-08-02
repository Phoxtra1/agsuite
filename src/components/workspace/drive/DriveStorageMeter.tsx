import React from "react";
import { Progress } from "@/components/ui/progress";
import { HardDrive, AlertCircle } from "lucide-react";

interface DriveStorageMeterProps {
  used: number; // in bytes
  quota: number; // in bytes
}

export function DriveStorageMeter({ used, quota }: DriveStorageMeterProps) {
  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const usagePercent = Math.min((used / quota) * 100, 100);
  const showWarning = usagePercent >= 90;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium">
          <HardDrive className="h-3.5 w-3.5 text-sky-500" />
          <span>Storage</span>
        </div>
        <span className="font-semibold text-foreground">
          {usagePercent.toFixed(1)}% used
        </span>
      </div>

      <Progress
        value={usagePercent}
        className={`h-2 rounded-full ${showWarning ? "[&>div]:bg-amber-500" : "[&>div]:bg-sky-500"}`}
      />

      <div className="text-[11px] text-muted-foreground flex justify-between">
        <span>{formatBytes(used)}</span>
        <span>of {formatBytes(quota)}</span>
      </div>

      {showWarning && (
        <div className="mt-2.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-2 items-start text-amber-500 animate-pulse">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="text-[10px] leading-relaxed">
            <p className="font-bold">Storage nearly full!</p>
            <p>You have reached {usagePercent.toFixed(0)}% of your capacity. Consider deleting old files.</p>
          </div>
        </div>
      )}
    </div>
  );
}
