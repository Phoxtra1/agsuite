import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, Star, Archive, Trash2, Reply, 
  Mail, Bell, AlertCircle, CheckCircle, MailOpen, Forward, Send
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ComsSDK } from '@/core/coms/sdk';

interface Message {
  id: string;
  sender: string;
  sender_name: string | null;
  subject: string;
  body: string;
  source_app: string | null;
  type: string;
  priority: string;
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  created_at: string;
  channel: string;
}

const appColors: Record<string, string> = {
  AGStock: 'bg-emerald-500',
  AGIS: 'bg-blue-500',
  AGHub: 'bg-purple-500',
  AminevaOps: 'bg-orange-500',
  ComsSystem: 'bg-primary',
  external: 'bg-muted',
};

const typeIcons: Record<string, React.ReactNode> = {
  system: <AlertCircle className="h-3 w-3" />,
  support: <Mail className="h-3 w-3" />,
  notification: <Bell className="h-3 w-3" />,
  general: <CheckCircle className="h-3 w-3" />,
};

export function UnifiedInbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [filterApp, setFilterApp] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyMode, setReplyMode] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);

  // Fetch messages from DB
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('inbound_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) setMessages(data as Message[]);
      setLoading(false);
    };
    fetchMessages();

    // Realtime subscription
    const unsub = ComsSDK.subscribeToInbox((payload) => {
      if (payload.eventType === 'INSERT') {
        setMessages(prev => [payload.new as Message, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new as Message : m));
      } else if (payload.eventType === 'DELETE') {
        setMessages(prev => prev.filter(m => m.id !== payload.old?.id));
      }
    });

    return unsub;
  }, []);

  const filteredMessages = messages.filter(m => {
    if (m.is_archived) return false;
    if (filterApp !== 'all' && m.source_app !== filterApp) return false;
    if (filterType !== 'all' && m.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return m.subject.toLowerCase().includes(q) || m.sender.toLowerCase().includes(q);
    }
    return true;
  });

  const selectedMessage = messages.find(m => m.id === selectedMessageId);

  const handleSelectMessage = async (messageId: string) => {
    setSelectedMessageId(messageId);
    const msg = messages.find(m => m.id === messageId);
    if (msg && !msg.is_read) {
      await supabase.from('inbound_messages').update({ is_read: true }).eq('id', messageId);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_read: true } : m));
    }
  };

  const handleToggleStar = async (messageId: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;
    await supabase.from('inbound_messages').update({ is_starred: !msg.is_starred }).eq('id', messageId);
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_starred: !m.is_starred } : m));
  };

  const handleArchive = async (messageId: string) => {
    await supabase.from('inbound_messages').update({ is_archived: true }).eq('id', messageId);
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_archived: true } : m));
    if (selectedMessageId === messageId) setSelectedMessageId(null);
    toast.success('Message archived');
  };

  const handleDelete = async (messageId: string) => {
    await supabase.from('inbound_messages').delete().eq('id', messageId);
    setMessages(prev => prev.filter(m => m.id !== messageId));
    if (selectedMessageId === messageId) setSelectedMessageId(null);
    toast.success('Message deleted');
  };

  const handleMarkAsUnread = async (messageId: string) => {
    await supabase.from('inbound_messages').update({ is_read: false }).eq('id', messageId);
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_read: false } : m));
    toast.success('Marked as unread');
  };

  const unreadCount = messages.filter(m => !m.is_read && !m.is_archived).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Message List */}
      <div className="lg:col-span-1">
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-sm text-foreground">
                Inbox {unreadCount > 0 && <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 h-8 text-xs"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterApp} onValueChange={setFilterApp}>
                <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Apps</SelectItem>
                  <SelectItem value="AGStock">AGStock</SelectItem>
                  <SelectItem value="AGIS">AGIS</SelectItem>
                  <SelectItem value="AgroClimate">AgroClimate</SelectItem>
                  <SelectItem value="AminevaOps">AminevaOps</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="p-6 text-center text-muted-foreground text-sm">Loading...</div>
              ) : filteredMessages.length === 0 ? (
                <div className="p-6 text-center">
                  <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No messages</p>
                </div>
              ) : (
                filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 border-b border-border cursor-pointer transition hover:bg-muted/50 ${
                      selectedMessageId === message.id ? 'bg-muted' : ''
                    } ${!message.is_read ? 'bg-primary/5' : ''}`}
                    onClick={() => handleSelectMessage(message.id)}
                  >
                    <div className="flex items-start gap-2">
                      <Avatar className="h-7 w-7 mt-0.5">
                        <AvatarFallback className={`text-xs text-white ${appColors[message.source_app || 'external'] || 'bg-muted'}`}>
                          {(message.sender_name || message.sender).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs truncate ${!message.is_read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                            {message.sender_name || message.sender}
                          </span>
                          <div className="flex items-center gap-1">
                            {message.is_starred && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(message.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className={`text-xs truncate ${!message.is_read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                          {message.subject}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-[9px] h-4 px-1">
                            {message.source_app || 'external'}
                          </Badge>
                          <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                            {typeIcons[message.type] || typeIcons.general} {message.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Message Detail */}
      <div className="lg:col-span-2">
        <Card className="h-[600px]">
          {selectedMessage ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-foreground">{selectedMessage.subject}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleToggleStar(selectedMessage.id)}>
                      <Star className={`h-4 w-4 ${selectedMessage.is_starred ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleMarkAsUnread(selectedMessage.id)}>
                      <MailOpen className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleArchive(selectedMessage.id)}>
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(selectedMessage.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>From: <strong>{selectedMessage.sender_name || selectedMessage.sender}</strong></span>
                  <span>·</span>
                  <Badge variant="outline" className="text-xs">{selectedMessage.source_app}</Badge>
                  <span>·</span>
                  <span>{new Date(selectedMessage.created_at).toLocaleString()}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="prose prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: selectedMessage.body }} />
                </ScrollArea>
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Button size="sm" onClick={() => { setReplyMode(!replyMode); setReplyText(''); }}>
                    <Reply className="h-4 w-4 mr-1" /> {replyMode ? 'Cancel Reply' : 'Reply'}
                  </Button>
                  <Button size="sm" variant="outline"><Forward className="h-4 w-4 mr-1" /> Forward</Button>
                </div>
                {replyMode && (
                  <div className="mt-4 space-y-3">
                    <Textarea
                      placeholder={`Reply to ${selectedMessage.sender_name || selectedMessage.sender}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={4}
                    />
                    <Button
                      size="sm"
                      disabled={!replyText.trim() || replySending}
                      onClick={async () => {
                        setReplySending(true);
                        try {
                          await ComsSDK.sendEmail({
                            to: [{ email: selectedMessage.sender, name: selectedMessage.sender_name || undefined }],
                            subject: `Re: ${selectedMessage.subject}`,
                            htmlContent: `<div style="font-family:sans-serif"><p>${replyText.replace(/\n/g, '<br>')}</p><hr style="margin:16px 0;border-color:#e2e8f0"><p style="color:#64748b;font-size:12px">In reply to: ${selectedMessage.subject}</p></div>`,
                            sourceApp: selectedMessage.source_app || 'ComsSystem',
                            messageType: 'support',
                            tags: ['inbox-reply'],
                          });
                          setReplyMode(false);
                          setReplyText('');
                          toast.success('Reply sent');
                        } catch {
                          toast.error('Failed to send reply');
                        } finally {
                          setReplySending(false);
                        }
                      }}
                    >
                      <Send className="h-4 w-4 mr-1" /> {replySending ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="h-full flex items-center justify-center">
              <div className="text-center">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Select a message to read</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
