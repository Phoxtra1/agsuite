import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Mail, ArrowUpRight, ArrowDownLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import type { ComsThread, ComsMessage } from '@/lib/coms/types';
import { SUITE_KEYS } from '@/lib/coms/types';
import { createMessage } from '@/lib/coms/comsApi';

interface ThreadDetailProps {
  thread: ComsThread | null;
  onThreadUpdated?: () => void;
}

const directionIcons: Record<string, React.ReactNode> = {
  inbound: <ArrowDownLeft className="h-3 w-3 text-blue-500" />,
  outbound: <ArrowUpRight className="h-3 w-3 text-emerald-500" />,
  internal: <ArrowRight className="h-3 w-3 text-muted-foreground" />,
};

export function ThreadDetail({ thread, onThreadUpdated }: ThreadDetailProps) {
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  if (!thread) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select a thread to view</p>
        </div>
      </Card>
    );
  }

  const suiteLabel = SUITE_KEYS.find((s) => s.value === thread.suiteKey)?.label || thread.suiteKey;

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const { error } = await createMessage({
        suiteKey: thread.suiteKey,
        channel: thread.messages[0]?.channel || 'email',
        to: thread.participants.find((p) => p !== 'support@amineva.com') || thread.participants[0],
        subject: `Re: ${thread.title}`,
        body: replyText,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Reply sent');
        setReplyText('');
        onThreadUpdated?.();
      }
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Header */}
      <CardHeader className="border-b pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base text-foreground truncate">{thread.title}</CardTitle>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant="secondary" className="text-xs">{suiteLabel}</Badge>
              <Badge variant="outline" className="text-xs text-foreground border-border capitalize">
                {thread.status.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className="text-xs text-foreground border-border capitalize">
                {thread.priority}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {thread.participants.length} participant{thread.participants.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Messages timeline */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {thread.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Reply composer */}
      <div className="border-t p-3 space-y-2">
        <Textarea
          placeholder="Type your reply…"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          className="min-h-[60px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleReply();
            }
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">⌘+Enter to send</span>
          <Button size="sm" onClick={handleReply} disabled={!replyText.trim() || sending} className="gap-2">
            <Send className="h-3.5 w-3.5" />
            {sending ? 'Sending…' : 'Reply'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function MessageBubble({ message }: { message: ComsMessage }) {
  const isOutbound = message.direction === 'outbound';
  const time = new Date(message.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg p-3 ${
          isOutbound
            ? 'bg-primary/10 border border-primary/20'
            : 'bg-muted border border-border'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          {directionIcons[message.direction]}
          <span className="text-xs font-medium text-foreground">{message.from}</span>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
        <p className="text-sm text-foreground whitespace-pre-wrap">{message.body}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <Badge variant="outline" className="text-xs h-4 px-1 text-muted-foreground border-border">
            {message.channel}
          </Badge>
          <Badge variant="outline" className="text-xs h-4 px-1 text-muted-foreground border-border">
            {message.status}
          </Badge>
        </div>
      </div>
    </div>
  );
}
