import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { ComsThread } from '@/lib/coms/types';
import { SUITE_KEYS } from '@/lib/coms/types';

interface ThreadRowProps {
  thread: ComsThread;
  isSelected: boolean;
  onClick: () => void;
}

const priorityColors: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/30',
  medium: 'bg-accent/10 text-accent-foreground border-accent/30',
  low: 'bg-muted text-muted-foreground border-border',
};

const statusColors: Record<string, string> = {
  open: 'bg-emerald-500/10 text-emerald-600',
  pending_reply: 'bg-amber-500/10 text-amber-600',
  resolved: 'bg-blue-500/10 text-blue-600',
  closed: 'bg-muted text-muted-foreground',
  archived: 'bg-muted text-muted-foreground',
};

export function ThreadRow({ thread, isSelected, onClick }: ThreadRowProps) {
  const hasUnread = thread.messages.some((m) => m.status === 'unread');
  const lastMsg = thread.messages[thread.messages.length - 1];
  const suiteLabel = SUITE_KEYS.find((s) => s.value === thread.suiteKey)?.label || thread.suiteKey;

  const timeAgo = formatTimeAgo(thread.lastMessageAt);

  return (
    <div
      onClick={onClick}
      className={`p-3 cursor-pointer transition-colors border-b last:border-b-0 ${
        isSelected ? 'bg-muted' : hasUnread ? 'bg-primary/5 hover:bg-muted/50' : 'hover:bg-muted/50'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className={`text-sm truncate flex-1 text-foreground ${hasUnread ? 'font-semibold' : ''}`}>
          {thread.title}
        </span>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</span>
      </div>

      {lastMsg && (
        <p className="text-xs text-muted-foreground truncate mb-1.5">
          {lastMsg.from.split('@')[0]}: {lastMsg.body.slice(0, 80)}…
        </p>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge variant="secondary" className="text-xs h-5 px-1.5">
          {suiteLabel}
        </Badge>
        <Badge variant="outline" className={`text-xs h-5 px-1.5 ${statusColors[thread.status] || ''}`}>
          {thread.status.replace('_', ' ')}
        </Badge>
        {thread.priority === 'high' && (
          <Badge variant="outline" className={`text-xs h-5 px-1.5 ${priorityColors.high}`}>
            high
          </Badge>
        )}
        {hasUnread && (
          <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
