import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { LogEntry } from './ComsSystem';

interface ComsLogsPanelProps {
  logs: LogEntry[];
}

const eventConfig: Record<LogEntry['event'], { icon: React.ElementType; color: string; label: string }> = {
  delivered: { icon: CheckCircle, color: 'text-success', label: 'Delivered' },
  bounced: { icon: XCircle, color: 'text-destructive', label: 'Bounced' },
  failed: { icon: XCircle, color: 'text-destructive', label: 'Failed' },
  queued: { icon: Clock, color: 'text-accent', label: 'Queued' },
  opened: { icon: Activity, color: 'text-primary', label: 'Opened' },
  clicked: { icon: Activity, color: 'text-primary', label: 'Clicked' },
};

export function ComsLogsPanel({ logs }: ComsLogsPanelProps) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No logs yet</h3>
          <p className="text-muted-foreground mt-1">Activity logs will appear here once messages are sent.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" /> Activity Logs
          <Badge variant="secondary" className="ml-auto">{logs.length} entries</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {logs.map((log) => {
            const config = eventConfig[log.event];
            const Icon = config.icon;
            return (
              <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition">
                <Icon className={`h-4 w-4 flex-shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{log.subject}</span>
                    <Badge variant="outline" className="text-xs">{config.label}</Badge>
                    <Badge variant="secondary" className="text-xs">{log.channel}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    To: {log.recipient} · {log.sourceApp} · {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
