import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import type { ComsThread } from '@/lib/coms/types';
import { listThreads } from '@/lib/coms/comsApi';

const typeStyles: Record<string, { icon: typeof Bell; bg: string; color: string }> = {
  info: { icon: Bell, bg: 'bg-blue-500/10', color: 'text-blue-500' },
  success: { icon: CheckCircle, bg: 'bg-emerald-500/10', color: 'text-emerald-500' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-500/10', color: 'text-amber-500' },
  error: { icon: XCircle, bg: 'bg-destructive/10', color: 'text-destructive' },
};

function getPriorityStyle(priority: string) {
  if (priority === 'high') return typeStyles.warning;
  if (priority === 'low') return typeStyles.info;
  return typeStyles.info;
}

export function InAppPanel() {
  const [notifications, setNotifications] = useState<ComsThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await listThreads({ channel: 'notification' });
      if (data) setNotifications(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleDismiss = (threadId: string) => {
    setNotifications((prev) => prev.filter((n) => n.threadId !== threadId));
    toast.success('Notification dismissed');
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        messages: n.messages.map((m) => ({ ...m, status: 'read' as const })),
      })),
    );
    toast.success('All notifications marked as read');
  };

  const unreadCount = notifications.filter((n) =>
    n.messages.some((m) => m.status === 'unread'),
  ).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">In-App Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg border">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Bell className="h-5 w-5" />
            In-App Notifications
            {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="text-foreground border-border">
            Mark All Read
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map((n) => {
            const lastMsg = n.messages[n.messages.length - 1];
            const hasUnread = n.messages.some((m) => m.status === 'unread');
            const style = getPriorityStyle(n.priority);
            const Icon = style.icon;

            return (
              <div
                key={n.threadId}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50 ${
                  hasUnread ? 'bg-primary/5 border-primary/20' : 'bg-card'
                }`}
              >
                <div className={`h-9 w-9 rounded-full ${style.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-4 w-4 ${style.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium text-sm text-foreground ${hasUnread ? 'font-semibold' : ''}`}>
                      {n.title}
                    </span>
                    <Badge variant="outline" className="text-xs text-foreground border-border">
                      {n.suiteKey}
                    </Badge>
                  </div>
                  {lastMsg && <p className="text-sm text-muted-foreground mt-0.5 truncate">{lastMsg.body.slice(0, 120)}</p>}
                  <span className="text-xs text-muted-foreground">
                    {new Date(n.lastMessageAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDismiss(n.threadId)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
