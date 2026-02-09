import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Inbox,
  Send,
  Megaphone,
  FileText,
  Activity,
  Plus,
  Settings,
  Bell,
  Mail,
  MessageSquare,
  Users,
  Bold,
  Italic,
  Underline,
  List,
  Link2,
  Image,
  X,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';

import { KPIStatsRow } from './KPIStatsRow';
import { ThreadListPanel } from './ThreadListPanel';
import { InAppPanel } from './InAppPanel';
import { LogsPanel } from './LogsPanel';
import { CampaignsPanel } from './campaigns/CampaignsPanel';
import { TemplatesPanel } from './templates/TemplatesPanel';

import { getKpiStats, healthCheck, createMessage, sendEmail } from '@/lib/coms/comsApi';
import { COMS_CONFIG } from '@/lib/coms/config';
import { SUITE_KEYS } from '@/lib/coms/types';
import type { ComsKpiStats, ComsHealthResponse } from '@/lib/coms/types';
import { getVisibleSuiteKeys } from '@/lib/coms/roleGuard';
import { useAuth } from '@/contexts/AuthContext';

// ============ COMPOSE MODAL ============

const composeTemplates = [
  { id: '1', name: 'Welcome Email', category: 'onboarding' },
  { id: '2', name: 'Password Reset', category: 'transactional' },
  { id: '3', name: 'Invoice Notification', category: 'transactional' },
  { id: '4', name: 'Low Stock Alert', category: 'system' },
  { id: '5', name: 'Newsletter Header', category: 'marketing' },
];

const recipientGroups = [
  { id: 'all', name: 'All Users', count: 1247 },
  { id: 'agstock', name: 'AGStock Users', count: 342 },
  { id: 'agis', name: 'AGIS Users', count: 189 },
  { id: 'subscribers', name: 'Newsletter Subscribers', count: 856 },
];

interface ComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visibleSuiteKeys: typeof SUITE_KEYS;
  onMessageSent?: () => void;
}

function ComposeMessageModal({ open, onOpenChange, visibleSuiteKeys, onMessageSent }: ComposeModalProps) {
  const [suiteKey, setSuiteKey] = useState<string>(visibleSuiteKeys[0]?.value || 'agstock');
  const [channel, setChannel] = useState<string>('email');
  const [recipientType, setRecipientType] = useState<'individual' | 'group'>('individual');
  const [recipient, setRecipient] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<string>('medium');
  const [isInternal, setIsInternal] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const handleAddRecipient = () => {
    if (recipient && !selectedRecipients.includes(recipient)) {
      setSelectedRecipients([...selectedRecipients, recipient]);
      setRecipient('');
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setSelectedRecipients(selectedRecipients.filter((r) => r !== email));
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = composeTemplates.find((t) => t.id === templateId);
    if (template) {
      setSubject(`[Template] ${template.name}`);
      setContent(`This is the content from the "${template.name}" template.\n\nHello {{name}},\n\nYour message content here...\n\nBest regards,\nAmineva Team`);
    }
  };

  const handleSend = async () => {
    const to = recipientType === 'individual' ? selectedRecipients[0] : selectedGroup;
    if (recipientType === 'individual' && selectedRecipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }
    if (recipientType === 'group' && !selectedGroup) {
      toast.error('Please select a recipient group');
      return;
    }
    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!content.trim()) {
      toast.error('Please enter message content');
      return;
    }

    setSending(true);
    try {
      if (channel === 'email') {
        const { error } = await sendEmail({ to: to!, subject, body: content, suiteKey });
        if (error) {
          toast.error(error.message);
          return;
        }
      } else {
        const { error } = await createMessage({
          suiteKey,
          channel,
          to: to!,
          subject,
          body: content,
          priority: channel === 'ticket' ? priority : undefined,
          isInternal,
        });
        if (error) {
          toast.error(error.message);
          return;
        }
      }
      toast.success('Message queued for delivery');
      onOpenChange(false);
      onMessageSent?.();
      // Reset
      setRecipient('');
      setSelectedRecipients([]);
      setSelectedGroup('');
      setSelectedTemplate('');
      setSubject('');
      setContent('');
      setIsInternal(false);
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const applyFormatting = (format: string) => {
    const formatMap: Record<string, string> = {
      bold: '**selected text**',
      italic: '_selected text_',
      underline: '<u>selected text</u>',
      list: '\n- Item 1\n- Item 2\n- Item 3',
      link: '[link text](https://)',
    };
    setContent(content + (formatMap[format] || ''));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Send className="h-5 w-5" />
            Compose Message
          </DialogTitle>
          <DialogDescription>Send messages via email, in-app notifications, or tickets</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* App / Suite selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-foreground">App / Suite</Label>
              <Select value={suiteKey} onValueChange={setSuiteKey}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {visibleSuiteKeys.map((sk) => (
                    <SelectItem key={sk.value} value={sk.value}>{sk.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {channel === 'ticket' && (
              <div className="space-y-2">
                <Label className="text-foreground">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Channel Selection */}
          <div className="space-y-2">
            <Label className="text-foreground">Type</Label>
            <div className="flex gap-2">
              <Button type="button" variant={channel === 'email' ? 'default' : 'outline'} size="sm" onClick={() => setChannel('email')} className="gap-2">
                <Mail className="h-4 w-4" />Email
              </Button>
              <Button type="button" variant={channel === 'ticket' ? 'default' : 'outline'} size="sm" onClick={() => setChannel('ticket')} className="gap-2">
                <MessageSquare className="h-4 w-4" />Ticket
              </Button>
              <Button type="button" variant={channel === 'notification' ? 'default' : 'outline'} size="sm" onClick={() => setChannel('notification')} className="gap-2">
                <Bell className="h-4 w-4" />Notification
              </Button>
            </div>
          </div>

          {/* Internal note toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="internal-note"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="rounded border-border"
            />
            <Label htmlFor="internal-note" className="text-sm text-foreground cursor-pointer">Internal note (not sent to recipient)</Label>
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label className="text-foreground">To</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter email address…"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRecipient())}
              />
              <Button type="button" variant="outline" onClick={handleAddRecipient}>Add</Button>
            </div>
            {selectedRecipients.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
                {selectedRecipients.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    {email}
                    <button type="button" onClick={() => handleRemoveRecipient(email)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="compose-subject" className="text-foreground">Subject</Label>
            <Input id="compose-subject" placeholder="Enter subject line…" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          {/* Rich Text Editor */}
          <div className="space-y-2">
            <Label className="text-foreground">Message</Label>
            <div className="border rounded-md">
              <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
                <Button type="button" variant="ghost" size="sm" onClick={() => applyFormatting('bold')} className="h-8 w-8 p-0"><Bold className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => applyFormatting('italic')} className="h-8 w-8 p-0"><Italic className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => applyFormatting('underline')} className="h-8 w-8 p-0"><Underline className="h-4 w-4" /></Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button type="button" variant="ghost" size="sm" onClick={() => applyFormatting('list')} className="h-8 w-8 p-0"><List className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => applyFormatting('link')} className="h-8 w-8 p-0"><Link2 className="h-4 w-4" /></Button>
              </div>
              <Textarea
                placeholder="Write your message here…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[160px] border-0 rounded-none focus-visible:ring-0 resize-none"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleSend} disabled={sending} className="gap-2">
            <Send className="h-4 w-4" />
            {sending ? 'Sending…' : 'Send Message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ SETTINGS MODAL ============

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ComsSettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [healthStatus, setHealthStatus] = useState<ComsHealthResponse | null>(null);
  const [checking, setChecking] = useState(false);

  const runHealthCheck = async () => {
    setChecking(true);
    const { data, error } = await healthCheck();
    if (data) {
      setHealthStatus(data);
      toast.success('Health check passed');
    } else {
      setHealthStatus({ ok: false });
      toast.error(error?.message || 'Health check failed');
    }
    setChecking(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Settings className="h-5 w-5" />
            ComsSystem Settings
          </DialogTitle>
          <DialogDescription>Configuration and diagnostics</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* API Info */}
          <div className="space-y-2">
            <Label className="text-foreground">API Base URL</Label>
            <Input value={COMS_CONFIG.apiBase} readOnly className="bg-muted text-muted-foreground" />
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-foreground">Mock Mode</Label>
            <Badge variant={COMS_CONFIG.mockMode ? 'secondary' : 'default'}>
              {COMS_CONFIG.mockMode ? 'Enabled (using local mock data)' : 'Disabled (live API)'}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Timeout</Label>
            <p className="text-sm text-muted-foreground">{COMS_CONFIG.timeoutMs}ms</p>
          </div>

          {/* Health Check */}
          <div className="border-t pt-4 space-y-2">
            <Label className="text-foreground">API Health Check</Label>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={runHealthCheck} disabled={checking} className="gap-2 text-foreground border-border">
                {checking ? 'Checking…' : 'Test Connection'}
              </Button>
              {healthStatus && (
                <div className="flex items-center gap-1.5">
                  {healthStatus.ok ? (
                    <Wifi className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-destructive" />
                  )}
                  <span className={`text-sm ${healthStatus.ok ? 'text-emerald-500' : 'text-destructive'}`}>
                    {healthStatus.ok ? 'Connected' : 'Offline'}
                  </span>
                  {healthStatus.version && (
                    <Badge variant="outline" className="text-xs text-foreground border-border ml-1">{healthStatus.version}</Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Default sender settings */}
          <div className="border-t pt-4 space-y-3">
            <div className="space-y-2">
              <Label className="text-foreground">Default Sender Email</Label>
              <Input placeholder="noreply@amineva.com" defaultValue="noreply@amineva.com" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Default Sender Name</Label>
              <Input placeholder="Amineva Team" defaultValue="Amineva Team" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={() => { toast.success('Settings saved'); onOpenChange(false); }}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ MAIN COMS SYSTEM ============

export function ComsSystem() {
  const [composeOpen, setComposeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [kpi, setKpi] = useState<ComsKpiStats>({ unread: 0, pendingReplies: 0, sentToday: 0, deliveryRate: 0 });
  const [kpiLoading, setKpiLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const { user } = useAuth();
  const visibleSuiteKeys = getVisibleSuiteKeys(user as unknown as Record<string, unknown> | null);

  // Load KPIs
  useEffect(() => {
    setKpiLoading(true);
    // getKpiStats is synchronous from mock store
    const stats = getKpiStats();
    setKpi(stats);
    setKpiLoading(false);
  }, [refreshKey]);

  const handleMessageSent = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            ComsSystem
          </h2>
          <p className="text-muted-foreground">Centralized communications hub for all Amineva products</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-foreground border-border" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm" onClick={() => setComposeOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <KPIStatsRow stats={kpi} loading={kpiLoading} />

      {/* Main Tabs */}
      <Tabs defaultValue="inbox" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4" />
            <span className="hidden sm:inline">Inbox</span>
            {kpi.unread > 0 && <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{kpi.unread}</Badge>}
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
        <TabsContent value="inbox">
          <ThreadListPanel
            key={refreshKey}
            onComposeClick={() => setComposeOpen(true)}
            visibleSuiteKeys={visibleSuiteKeys}
          />
        </TabsContent>
        <TabsContent value="notifications"><InAppPanel /></TabsContent>
        <TabsContent value="campaigns"><CampaignsPanel /></TabsContent>
        <TabsContent value="templates"><TemplatesPanel /></TabsContent>
        <TabsContent value="logs"><LogsPanel /></TabsContent>
      </Tabs>

      <ComposeMessageModal
        open={composeOpen}
        onOpenChange={setComposeOpen}
        visibleSuiteKeys={visibleSuiteKeys}
        onMessageSent={handleMessageSent}
      />
      <ComsSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
