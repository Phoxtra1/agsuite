import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Mail,
  Bell,
  MessageSquare,
} from 'lucide-react';
import type { ComsLogEntry } from '@/lib/coms/types';
import { listLogs } from '@/lib/coms/comsApi';

const eventConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
  delivered: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  opened: { icon: Mail, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  clicked: { icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  bounced: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  failed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  queued: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
};

const channelIcons: Record<string, typeof Mail> = {
  email: Mail,
  ticket: MessageSquare,
  notification: Bell,
};

export function LogsPanel() {
  const [logs, setLogs] = useState<ComsLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await listLogs({
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        channel: channelFilter !== 'all' ? (channelFilter as 'email' | 'ticket' | 'notification') : undefined,
      });
      if (data) setLogs(data);
      setLoading(false);
    }
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [searchQuery, statusFilter, channelFilter]);

  const formatTimestamp = (ts: string) =>
    new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Activity className="h-5 w-5" />
          Communication Logs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by recipient, subject, or app…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="opened">Opened</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
            </SelectContent>
          </Select>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Channel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="ticket">Ticket</SelectItem>
              <SelectItem value="notification">Notification</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No logs found matching your filters.</p>
            </div>
          ) : (
            logs.map((log) => {
              const config = eventConfig[log.event] || eventConfig.queued;
              const EventIcon = config.icon;
              const ChannelIcon = channelIcons[log.channel] || Mail;
              return (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className={`h-8 w-8 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <EventIcon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm capitalize text-foreground">{log.event}</span>
                      <Badge variant="outline" className="text-xs text-foreground border-border">
                        <ChannelIcon className="h-3 w-3 mr-1" />{log.channel}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">{log.suiteKey}</Badge>
                    </div>
                    <p className="text-sm text-foreground mt-1 truncate">{log.subject}</p>
                    <p className="text-xs text-muted-foreground">To: {log.recipient}</p>
                    {log.details && <p className="text-xs text-destructive mt-1">Error: {log.details}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTimestamp(log.timestamp)}</span>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
