import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Send, Users, FileText, Bold, Italic, Underline, List, Link2, Image, X, Mail, Bell, MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ComposeMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const templates = [
  { id: '1', name: 'Welcome Email', category: 'onboarding' },
  { id: '2', name: 'Password Reset', category: 'transactional' },
  { id: '3', name: 'Invoice Notification', category: 'transactional' },
  { id: '4', name: 'Low Stock Alert', category: 'system' },
  { id: '5', name: 'Newsletter Header', category: 'marketing' },
  { id: '6', name: 'Support Response', category: 'support' },
];

const recipientGroups = [
  { id: 'all', name: 'All Users', count: 1247 },
  { id: 'agstock', name: 'AGStock Users', count: 342 },
  { id: 'agis', name: 'AGIS Users', count: 189 },
  { id: 'subscribers', name: 'Newsletter Subscribers', count: 856 },
  { id: 'premium', name: 'Premium Members', count: 124 },
];

export function ComposeMessageModal({ open, onOpenChange }: ComposeMessageModalProps) {
  const [channel, setChannel] = useState<string>('email');
  const [recipientType, setRecipientType] = useState<'individual' | 'group'>('individual');
  const [recipient, setRecipient] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

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

  const handleSend = async () => {
    const recipients = recipientType === 'individual'
      ? selectedRecipients
      : recipientGroups.find(g => g.id === selectedGroup) ? [selectedGroup + '@amineva.com'] : [];

    if (recipients.length === 0) {
      toast.error('Please add at least one recipient');
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

    if (channel === 'email') {
      setSending(true);
      try {
        const { data, error } = await supabase.functions.invoke('send-email', {
          body: {
            to: recipients.map(email => ({ email })),
            subject,
            htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
              <div style="background:#f59e0b;padding:16px;border-radius:8px 8px 0 0;">
                <h2 style="margin:0;color:#fff;">Amineva Global</h2>
              </div>
              <div style="padding:24px;background:#ffffff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
                ${content.replace(/\n/g, '<br/>')}
              </div>
              <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">
                © ${new Date().getFullYear()} Amineva Global. All rights reserved.
              </p>
            </div>`,
            tags: ['coms-compose'],
          },
        });

        if (error) throw error;
        toast.success('Email sent successfully via Brevo');

        // Log to coms_logs
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          for (const r of recipients) {
            await supabase.from('coms_logs' as any).insert({
              user_id: user.id,
              event: 'delivered',
              channel: 'email',
              recipient: r,
              subject,
              source_app: 'ComsSystem',
              message_type: 'transactional',
            });
          }
        }
      } catch (err: any) {
        console.error('Send email error:', err);
        toast.error(err.message || 'Failed to send email');
      } finally {
        setSending(false);
      }
    } else {
      toast.success('In-app notification queued');
    }

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
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
          <DialogDescription>
            Send messages via email, in-app notifications, or other channels
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Channel Selection */}
          <div className="space-y-2">
            <Label>Channel</Label>
            <div className="flex gap-2">
              <Button type="button" variant={channel === 'email' ? 'default' : 'outline'} size="sm" onClick={() => setChannel('email')} className="gap-2">
                <Mail className="h-4 w-4" /> Email
              </Button>
              <Button type="button" variant={channel === 'in-app' ? 'default' : 'outline'} size="sm" onClick={() => setChannel('in-app')} className="gap-2">
                <Bell className="h-4 w-4" /> In-App
              </Button>
              <Button type="button" variant={channel === 'sms' ? 'default' : 'outline'} size="sm" onClick={() => setChannel('sms')} className="gap-2" disabled>
                <MessageSquare className="h-4 w-4" /> SMS (Soon)
              </Button>
            </div>
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label>Recipients</Label>
            <Tabs value={recipientType} onValueChange={(v) => setRecipientType(v as 'individual' | 'group')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="individual" className="gap-2"><Mail className="h-4 w-4" /> Individual</TabsTrigger>
                <TabsTrigger value="group" className="gap-2"><Users className="h-4 w-4" /> Group</TabsTrigger>
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
            <Label className="flex items-center gap-2"><FileText className="h-4 w-4" /> Template (Optional)</Label>
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
                {[
                  { format: 'bold', Icon: Bold },
                  { format: 'italic', Icon: Italic },
                  { format: 'underline', Icon: Underline },
                ].map(({ format, Icon }) => (
                  <Button key={format} type="button" variant="ghost" size="sm" onClick={() => applyFormatting(format)} className="h-8 w-8 p-0">
                    <Icon className="h-4 w-4" />
                  </Button>
                ))}
                <div className="w-px h-4 bg-border mx-1" />
                <Button type="button" variant="ghost" size="sm" onClick={() => applyFormatting('list')} className="h-8 w-8 p-0"><List className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => applyFormatting('link')} className="h-8 w-8 p-0"><Link2 className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" disabled><Image className="h-4 w-4" /></Button>
              </div>
              <Textarea
                placeholder="Write your message here... Use {{name}}, {{product}}, etc. for variables."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] border-0 rounded-none focus-visible:ring-0 resize-none"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Supports variable placeholders: {"{{name}}"}, {"{{email}}"}, {"{{product}}"}, {"{{invoice}}"}, etc.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" variant="outline">Save Draft</Button>
          <Button type="button" onClick={handleSend} disabled={sending} className="gap-2">
            <Send className="h-4 w-4" />
            {sending ? 'Sending…' : 'Send Message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
