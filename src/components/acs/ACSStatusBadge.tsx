// src/components/acs/ACSStatusBadge.tsx
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

const STATUS_CONFIG: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  completed: { variant: 'default', icon: CheckCircle },
  synced: { variant: 'default', icon: CheckCircle },
  syncing: { variant: 'secondary', icon: RefreshCw },
  pending: { variant: 'secondary', icon: Clock },
  failed: { variant: 'destructive', icon: AlertTriangle },
  error: { variant: 'destructive', icon: AlertTriangle },
};

export function ACSStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className="gap-1 text-xs capitalize">
      <Icon className={`h-3 w-3 ${status === 'syncing' ? 'animate-spin' : ''}`} /> {status}
    </Badge>
  );
}
