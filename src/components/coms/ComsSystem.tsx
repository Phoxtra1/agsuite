import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { handleComms } from "@/core/coms";
import {
  Inbox, Send, Megaphone, FileText, Activity, Clock, TrendingUp, Plus, Settings,
  CheckCircle, XCircle, AlertTriangle, Mail, Bell, MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { UnifiedInbox } from './inbox/UnifiedInbox';
import { CampaignsPanel } from './campaigns/CampaignsPanel';
import { TemplatesPanel } from './templates/TemplatesPanel';
import { InAppNotificationsPanel } from './notifications/InAppNotificationsPanel';
import { ComsLogsPanel } from './ComsLogsPanel';
import { ComposeMessageModal } from './compose/ComposeMessageModal';
import { ComsSettingsModal } from './settings/ComsSettingsModal';

// ======== TYPES ========
export interface LogEntry {
  id: string;
  timestamp: string;
  event: 'delivered' | 'bounced' | 'failed' | 'queued' | 'opened' | 'clicked';
  channel: 'email' | 'in-app' | 'sms';
  recipient: string;
  subject: string;
  sourceApp: string;
  messageType: 'transactional' | 'marketing' | 'support' | 'system';
  details?: string;
}

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  sourceApp: string;
  createdAt: string;
  isRead: boolean;
}

// ======== MAIN COMS SYSTEM ========
export function ComsSystem() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const comsStats = {
    totalMessages: logs.length,
    unreadMessages: notifications.filter(n => !n.isRead).length,
    pendingReplies: logs.filter(l => l.event === 'queued').length,
    activeCampaigns: 0,
    sentToday: logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length,
    deliveryRate: logs.length ? Math.round((logs.filter(l => l.event === 'delivered').length / logs.length) * 100) : 0,
  };

  // ======== SEND MESSAGE HANDLER ========
  const handleSendMessage = (message: {
    channel: 'email' | 'in-app';
    recipients: string[];
    subject: string;
    content: string;
  }) => {
    if (!message.recipients.length) return toast.error('No recipients');
    const now = new Date().toISOString();

    // Run through Odeneho AI pipeline
    const result = handleComms({
      channel: "email",
      from: message.recipients[0],
      subject: message.subject,
      message: message.content,
    });

    if (result.decision.action === "auto-reply") {
      toast.info(`AI auto-reply: ${result.response.reply.slice(0, 80)}…`);
    }

    // Add to logs
    const newLogs: LogEntry[] = message.recipients.map((r, idx) => ({
      id: `log-${Date.now()}-${idx}`,
      timestamp: now,
      event: 'queued' as const,
      channel: message.channel,
      recipient: r,
      subject: message.subject,
      sourceApp: 'ComsSystem',
      messageType: 'transactional' as const,
    }));
    setLogs(prev => [...newLogs, ...prev]);

    // Add to notifications if in-app
    if (message.channel === 'in-app') {
      const newNotifs: InAppNotification[] = message.recipients.map((r, idx) => ({
        id: `notif-${Date.now()}-${idx}`,
        title: message.subject,
        message: message.content,
        type: 'info' as const,
        sourceApp: 'ComsSystem',
        createdAt: now,
        isRead: false,
      }));
      setNotifications(prev => [...newNotifs, ...prev]);
    }

    toast.success('Message queued for delivery');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" /> ComsSystem
          </h2>
          <p className="text-muted-foreground">Centralized communications hub for all Amineva products</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" /> Settings
          </Button>
          <Button size="sm" onClick={() => setComposeOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Message
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold text-foreground">{comsStats.unreadMessages}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Inbox className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Replies</p>
                <p className="text-2xl font-bold text-foreground">{comsStats.pendingReplies}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sent Today</p>
                <p className="text-2xl font-bold text-foreground">{comsStats.sentToday}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                <Send className="h-5 w-5 text-secondary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delivery Rate</p>
                <p className="text-2xl font-bold text-foreground">{comsStats.deliveryRate}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inbox" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4" />
            <span className="hidden sm:inline">Inbox</span>
            {comsStats.unreadMessages > 0 && <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{comsStats.unreadMessages}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">In-App</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-2">
            <Megaphone className="h-4 w-4" />
            <span className="hidden sm:inline">Campaigns</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Logs</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="inbox"><UnifiedInbox /></TabsContent>
        <TabsContent value="notifications">
          <InAppNotificationsPanel notifications={notifications} setNotifications={setNotifications} />
        </TabsContent>
        <TabsContent value="campaigns"><CampaignsPanel /></TabsContent>
        <TabsContent value="templates"><TemplatesPanel /></TabsContent>
        <TabsContent value="logs">
          <ComsLogsPanel logs={logs} />
        </TabsContent>
      </Tabs>

      <ComposeMessageModal open={composeOpen} onOpenChange={setComposeOpen} />
      <ComsSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
