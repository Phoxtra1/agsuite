import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import type { InAppNotification } from '../ComsSystem';

interface Props {
  notifications: InAppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<InAppNotification[]>>;
}

const typeConfig = {
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  success: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  error: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
};

export function InAppNotificationsPanel({ notifications, setNotifications }: Props) {
  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" /> In-App Notifications
        </CardTitle>
        {notifications.some(n => !n.isRead) && (
          <Button variant="outline" size="sm" onClick={markAllRead}>Mark all read</Button>
        )}
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No notifications yet.</p>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => {
              const cfg = typeConfig[n.type];
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${!n.isRead ? 'bg-muted/50 border-border' : 'border-transparent'}`}
                  onClick={() => markRead(n.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={`h-8 w-8 rounded-full ${cfg.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">{n.title}</span>
                      {!n.isRead && <Badge variant="default" className="text-[10px] h-4">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{n.sourceApp}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
