import React, { useEffect, useState } from 'react';
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
import { ComsSDK } from '@/core/coms/sdk';

interface ComposeMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TemplateOption = { id: string; name: string; category: string; subject: string | null; body: string };

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
  const [templates, setTemplates] = useState<TemplateOption[]>([]);

  useEffect(() => {
    if (!open) return;
    supabase
      .from('coms_templates')
      .select('id,name,category,subject,body')
      .order('updated_at', { ascending: false })
      .limit(50)
      .then(({ data }) => setTemplates((data ?? []) as TemplateOption[]));
  }, [open]);

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
      setSubject(template.subject || template.name);
      setContent(template.body);
    }
  };

  const handleSend = async () => {
    const recipients = recipientType === 'individual'
      ? selectedRecipients
      : [];

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

    setSending(true);
    try {
      if (channel === 'email') {
        await ComsSDK.sendEmail({
          to: recipients.map(email => ({ email })),
          subject,
          htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;line-height:1.6">${content.replace(/\n/g, '<br/>')}</div>`,
          sourceApp: 'ComsSystem',
          messageType: 'support',
          tags: ['coms-compose'],
        });
        toast.success('Email sent and logged in ComsSystem');
      } else {
        await Promise.all(recipients.map((r) => ComsSDK.sendReply({
          targetUserId: /^[0-9a-f-]{36}$/i.test(r) ? r : undefined,
          recipientEmail: r.includes('@') ? r : undefined,
          subject,
          message: content,
          sourceApp: 'ComsSystem',
        })));
        toast.success('Message sent and logged in ComsSystem');
      }
    } catch (err: any) {
      console.error('Send message error:', err);
      toast.error(err.message || 'Failed to send message');
      setSending(false);
      return;
    } finally {
      setSending(false);
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
