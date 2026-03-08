// src/components/acs/ACSSyncPanel.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ACSStatusBadge } from './ACSStatusBadge';
import type { ACSSyncLog } from '@/core/backend/acs';

interface ACSSyncPanelProps {
  logs: ACSSyncLog[];
  isSyncing: boolean;
}

export function ACSSyncPanel({ logs, isSyncing }: ACSSyncPanelProps) {
  const lastSync = logs[0];

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Card className="flex-1 min-w-[140px]">
        <CardContent className="py-3 px-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Last Sync</span>
          <span className="text-sm font-medium text-foreground">
            {lastSync ? new Date(lastSync.started_at).toLocaleTimeString() : 'Never'}
          </span>
        </CardContent>
      </Card>
      <Card className="flex-1 min-w-[140px]">
        <CardContent className="py-3 px-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          {lastSync ? (
            <ACSStatusBadge status={isSyncing ? 'syncing' : lastSync.status} />
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </CardContent>
      </Card>
      {lastSync?.records_synced != null && (
        <Card className="flex-1 min-w-[140px]">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Records Synced</span>
            <span className="text-lg font-bold text-foreground">{lastSync.records_synced}</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
