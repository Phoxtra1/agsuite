import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Inbox, 
  Send, 
  Megaphone, 
  FileText, 
  Activity, 
  Clock,
  TrendingUp,
  Plus,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Mail,
  Bell,
  MessageSquare,
  Users,
  Bold,
  Italic,
  Underline,
  List,
  Link2,
  Image,
  X
} from 'lucide-react';
import { UnifiedInbox } from './inbox/UnifiedInbox';
import { CampaignsPanel } from './campaigns/CampaignsPanel';
import { TemplatesPanel } from './templates/TemplatesPanel';
import { toast } from 'sonner';

// ============ LOGS PANEL ============
interface LogEntry {
  id: string;
  timestamp: string;
  event: 'delivered' | 'bounced' | 'failed' | 'queued' | 'opened' | 'clicked';
  channel: 'email' | 'in-app' | 'sms' | 'whatsapp';
  recipient: string;
  subject: string;
  sourceApp: string;
  messageType: 'transactional' | 'marketing' | 'support' | 'system';
  details?: string;
}

// Start with empty logs - real data will come from Appwrite database
const mockLogs: LogEntry[] = [];

const eventConfig = {
  delivered: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  opened: { icon: Mail, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  clicked: { icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  bounced: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  failed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  queued: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
};

const channelIcons = { email: Mail, 'in-app': Bell, sms: MessageSquare, whatsapp: MessageSquare };

function ComsLogsPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  const filteredLogs = mockLogs.filter(log => {
    const matchesSearch = log.recipient.toLowerCase().includes(searchQuery.toLowerCase()) || log.subject.toLowerCase().includes(searchQuery.toLowerCase()) || log.sourceApp.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.event === statusFilter;
    const matchesChannel = channelFilter === 'all' || log.channel === channelFilter;
    return matchesSearch && matchesStatus && matchesChannel;
  });

  const formatTimestamp = (timestamp: string) => new Date(timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Communication Logs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by recipient, subject, or app..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
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
              <SelectItem value="in-app">In-App</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          {filteredLogs.map((log) => {
            const config = eventConfig[log.event];
            const EventIcon = config.icon;
            const ChannelIcon = channelIcons[log.channel];
            return (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className={`h-8 w-8 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <EventIcon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm capitalize">{log.event}</span>
                    <Badge variant="outline" className="text-xs"><ChannelIcon className="h-3 w-3 mr-1" />{log.channel}</Badge>
                    <Badge variant="secondary" className="text-xs">{log.sourceApp}</Badge>
                  </div>
                  <p className="text-sm text-foreground mt-1 truncate">{log.subject}</p>
                  <p className="text-xs text-muted-foreground">To: {log.recipient}</p>
                  {log.details && <p className="text-xs text-destructive mt-1">Error: {log.details}</p>}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTimestamp(log.timestamp)}</span>
              </div>
            );
          })}
          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No logs found matching your filters.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============ COMPOSE MODAL ============
const templates = [
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
}

function ComposeMessageModal({ open, onOpenChange }: ComposeModalProps) {
  const [channel, setChannel] = useState<string>('email');
  const [recipientType, setRecipientType] = useState<'individual' | 'group'>('individual');
  const [recipient, setRecipient] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);

  const handleAddRecipient = () => {
    if (recipient && !selectedRecipients.includes(recipient)) {
      setSelectedRecipients([...selectedRecipients, recipient]);
      setRecipient('');
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setSelectedRecipients(selectedRecipients.filter(r => r !== email));
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(`[Template] ${template.name}`);
      setContent(`This is the content from the "${template.name}" template.\n\nHello {{name}},\n\nYour message content here...\n\nBest regards,\nAmineva Team`);
    }
  };

  const handleSend = () => {
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
    toast.success('Message queued for delivery');
    onOpenChange(false);
    setRecipient('');
    setSelectedRecipients([]);
    setSelectedGroup('');
    setSelectedTemplate('');
    setSubject('');
    setContent('');
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
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Compose Message
          </DialogTitle>
          <DialogDescription>Send messages via email, in-app notifications, or other channels</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Channel Selection */}
          <div className="space-y-2">
            <Label>Channel</Label>
            <div className="flex gap-2">
              <Button type="button" variant={channel === 'email' ? 'default' : 'outline'} size="sm" onClick={() => setChannel('email')} className="gap-2">
                <Mail className="h-4 w-4" />Email
              </Button>
              <Button type="button" variant={channel === 'in-app' ? 'default' : 'outline'} size="sm" onClick={() => setChannel('in-app')} className="gap-2">
                <Bell className="h-4 w-4" />In-App
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-2" disabled>
                <MessageSquare className="h-4 w-4" />SMS (Soon)
              </Button>
            </div>
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label>Recipients</Label>
            <Tabs value={recipientType} onValueChange={(v) => setRecipientType(v as 'individual' | 'group')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="individual" className="gap-2"><Mail className="h-4 w-4" />Individual</TabsTrigger>
                <TabsTrigger value="group" className="gap-2"><Users className="h-4 w-4" />Group</TabsTrigger>
              </TabsList>
              <TabsContent value="individual" className="space-y-2 mt-2">
                <div className="flex gap-2">
                  <Input placeholder="Enter email address..." value={recipient} onChange={(e) => setRecipient(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRecipient())} />
                  <Button type="button" variant="outline" onClick={handleAddRecipient}>Add</Button>
                </div>
                {selectedRecipients.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
                    {selectedRecipients.map((email) => (
                      <Badge key={email} variant="secondary" className="gap-1">
                        {email}
                        <button type="button" onClick={() => handleRemoveRecipient(email)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="group" className="mt-2">
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger><SelectValue placeholder="Select recipient group..." /></SelectTrigger>
                  <SelectContent>
                    {recipientGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center justify-between gap-4">
                          <span>{group.name}</span>
                          <Badge variant="outline" className="ml-2">{group.count.toLocaleString()}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
            </Tabs>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><FileText className="h-4 w-4" />Template (Optional)</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger><SelectValue placeholder="Choose a template..." /></SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <span>{template.name}</span>
                      <Badge variant="outline" className="text-xs capitalize">{template.category}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" placeholder="Enter subject line..." value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          {/* Rich Text Editor */}
          <div className="space-y-2">
            <Label>Message Content</Label>
            <div className="border rounded-md">
              <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
                <Button type="button" variant="ghost" size="sm" onClick={() => applyFormatting('bold')} className="h-8 w-8 p-0"><Bold className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => applyFormatting('italic')} className="h-8 w-8 p-0"><Italic className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => applyFormatting('underline')} className="h-8 w-8 p-0"><Underline className="h-4 w-4" /></Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button type="button" variant="ghost" size="sm" onClick={() => applyFormatting('list')} className="h-8 w-8 p-0"><List className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => applyFormatting('link')} className="h-8 w-8 p-0"><Link2 className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" disabled><Image className="h-4 w-4" /></Button>
              </div>
              <Textarea placeholder="Write your message here... Use {{name}}, {{product}}, etc. for variables." value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[200px] border-0 rounded-none focus-visible:ring-0 resize-none" />
            </div>
            <p className="text-xs text-muted-foreground">Supports variable placeholders: {"{{name}}"}, {"{{email}}"}, {"{{product}}"}, {"{{invoice}}"}, etc.</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" variant="outline">Save Draft</Button>
          <Button type="button" onClick={handleSend} className="gap-2"><Send className="h-4 w-4" />Send Message</Button>
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Settings className="h-5 w-5" />
            ComsSystem Settings
          </DialogTitle>
          <DialogDescription>
            Configure global communication settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-foreground">Default Sender Email</Label>
            <Input placeholder="noreply@amineva.com" defaultValue="noreply@amineva.com" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Default Sender Name</Label>
            <Input placeholder="Amineva Team" defaultValue="Amineva Team" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Reply-To Email</Label>
            <Input placeholder="support@amineva.com" defaultValue="support@amineva.com" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Email Footer</Label>
            <Textarea 
              placeholder="Email footer text..."
              defaultValue="© 2025 Amineva Global. All rights reserved.\nAccra, Ghana"
              className="min-h-[80px]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Brand Logo URL</Label>
            <Input placeholder="https://amineva.com/logo.png" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            toast.success('Settings saved');
            onOpenChange(false);
          }}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ IN-APP NOTIFICATIONS PANEL ============
interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  sourceApp: string;
  createdAt: string;
  isRead: boolean;
}

// Start with empty notifications - real data will come from Appwrite database
const mockNotifications: InAppNotification[] = [];

const notificationTypeStyles = {
  info: { icon: Bell, bg: 'bg-blue-500/10', color: 'text-blue-500' },
  success: { icon: CheckCircle, bg: 'bg-emerald-500/10', color: 'text-emerald-500' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-500/10', color: 'text-amber-500' },
  error: { icon: XCircle, bg: 'bg-destructive/10', color: 'text-destructive' },
};

function InAppNotificationsPanel() {
  const [notifications, setNotifications] = React.useState(mockNotifications);
  
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read');
  };

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success('Notification dismissed');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
          notifications.map((notification) => {
            const typeStyle = notificationTypeStyles[notification.type];
            const Icon = typeStyle.icon;
            return (
              <div 
                key={notification.id} 
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${!notification.isRead ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}
                onClick={() => handleMarkAsRead(notification.id)}
              >
                <div className={`h-9 w-9 rounded-full ${typeStyle.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-4 w-4 ${typeStyle.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium text-sm text-foreground ${!notification.isRead ? 'font-semibold' : ''}`}>
                      {notification.title}
                    </span>
                    <Badge variant="outline" className="text-xs text-foreground border-border">{notification.sourceApp}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
                  <span className="text-xs text-muted-foreground">{notification.createdAt}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); handleDismiss(notification.id); }}
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

// ============ MAIN COMS SYSTEM ============
// Real-time metrics - start at zero since no real messages exist yet
const comsStats = {
  totalMessages: 0,
  unreadMessages: 0,
  pendingReplies: 0,
  activeCampaigns: 0,
  sentToday: 0,
  deliveryRate: 0,
};

export function ComsSystem() {
  const [composeOpen, setComposeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
              <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                <Clock className="h-5 w-5 text-accent-foreground" />
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

      {/* Main Tabs */}
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
            {comsStats.activeCampaigns > 0 && <Badge className="ml-1 h-5 px-1.5 text-xs bg-primary">{comsStats.activeCampaigns}</Badge>}
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
        <TabsContent value="notifications"><InAppNotificationsPanel /></TabsContent>
        <TabsContent value="campaigns"><CampaignsPanel /></TabsContent>
        <TabsContent value="templates"><TemplatesPanel /></TabsContent>
        <TabsContent value="logs"><ComsLogsPanel /></TabsContent>
      </Tabs>

      <ComposeMessageModal open={composeOpen} onOpenChange={setComposeOpen} />
      <ComsSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
