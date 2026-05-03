import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  TicketCheck, Reply, Clock, AlertTriangle, CheckCircle2,
  CircleDot, Send, Filter, History, Paperclip, X, TimerReset,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SupportComs } from '@/core/coms/hooks';
import { ComsSDK, ComsRoutingError, type TicketAttachmentInput } from '@/core/coms/sdk';
import { firstResponseSLA, resolutionSLA, formatRemaining, slaStateColor } from '@/core/coms/sla';
import { TicketAuditDrawer } from './TicketAuditDrawer';

interface Ticket {
  id: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  source_app: string | null;
  user_id: string;
  sender_user_id?: string | null;
  sender_email?: string | null;
  sender_name?: string | null;
  last_replied_at?: string | null;
  first_response_at?: string | null;
  resolved_at?: string | null;
  sla_first_response_minutes?: number | null;
  sla_resolution_minutes?: number | null;
  created_at: string;
  updated_at: string;
}

const priorityConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  low: { color: 'bg-muted text-muted-foreground', icon: <CircleDot className="h-3 w-3" /> },
  normal: { color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400', icon: <CircleDot className="h-3 w-3" /> },
  high: { color: 'bg-orange-500/15 text-orange-600 dark:text-orange-400', icon: <AlertTriangle className="h-3 w-3" /> },
  urgent: { color: 'bg-destructive/15 text-destructive', icon: <AlertTriangle className="h-3 w-3" /> },
};

const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  open: { color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400', label: 'Open', icon: <Clock className="h-3 w-3" /> },
  replied: { color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', label: 'Replied', icon: <Reply className="h-3 w-3" /> },
  resolved: { color: 'bg-muted text-muted-foreground', label: 'Resolved', icon: <CheckCircle2 className="h-3 w-3" /> },
  closed: { color: 'bg-muted text-muted-foreground', label: 'Closed', icon: <CheckCircle2 className="h-3 w-3" /> },
};

export function SupportTicketsPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(200);

      if (!error && data) setTickets(data as Ticket[]);
      setLoading(false);
    };
    load();

    // Realtime — any reply, status change, or new ticket reflects instantly.
    const unsub = ComsSDK.subscribeToTickets((payload) => {
      if (payload.eventType === 'INSERT') {
        setTickets(prev => [payload.new as Ticket, ...prev.filter(t => t.id !== payload.new.id)]);
      } else if (payload.eventType === 'UPDATE') {
        setTickets(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...(payload.new as Ticket) } : t));
        setSelectedTicket(prev => prev && prev.id === payload.new.id ? { ...prev, ...(payload.new as Ticket) } : prev);
      } else if (payload.eventType === 'DELETE') {
        setTickets(prev => prev.filter(t => t.id !== payload.old?.id));
      }
    });

    return unsub;
  }, []);

  const filtered = tickets.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const openCount = tickets.filter(t => t.status === 'open').length;
  const highPriorityCount = tickets.filter(t => (t.priority === 'high' || t.priority === 'urgent') && t.status === 'open').length;

  const getSender = (ticket: Ticket): { email: string; name: string; userId?: string } => {
    if (ticket.sender_email) {
      return { email: ticket.sender_email, name: ticket.sender_name || ticket.sender_email, userId: ticket.sender_user_id || undefined };
    }
    return extractSenderFromMessage(ticket.message);
  };

  // Backward-compatible extraction for older tickets created before sender fields existed.
  const extractSenderFromMessage = (message: string): { email: string; name: string } => {
    const match = message.match(/^From:\s*(.+?)\s*<(.+?)>/);
    if (match) return { name: match[1].trim(), email: match[2].trim() };
    const emailMatch = message.match(/^From:\s*(\S+@\S+)/);
    if (emailMatch) return { name: emailMatch[1], email: emailMatch[1] };
    return { name: 'Unknown', email: '' };
  };

  // Last activity = most recent of last_replied_at, updated_at, created_at.
  const lastActivity = (t: Ticket) => {
    const candidates = [t.last_replied_at, t.updated_at, t.created_at].filter(Boolean) as string[];
    return candidates.sort().pop() || t.created_at;
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await ComsSDK.updateTicketStatus(ticketId, newStatus as 'open' | 'replied' | 'resolved' | 'closed');
      // Optimistic UI; realtime will reconcile.
      const nowIso = new Date().toISOString();
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus, updated_at: nowIso } : t));
      toast.success(`Ticket marked as ${newStatus}`);
    } catch (e) {
      const msg = e instanceof ComsRoutingError ? `${e.code}: ${e.message}` : 'Failed to update ticket status';
      toast.error(msg);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    const sender = getSender(selectedTicket);
    if (!sender.email && !sender.userId) {
      toast.error('No recipient mapping for this ticket — cannot route reply');
      return;
    }

    setReplySending(true);
    try {
      await SupportComs.replyToTicket({
        ticketId: selectedTicket.id,
        replyBody: replyText.trim(),
        recipientEmail: sender.email,
        recipientName: sender.name,
        targetUserId: sender.userId,
        sourceApp: selectedTicket.source_app || 'ComsSystem',
      });
      // Realtime will update the ticket; close dialog optimistically.
      setReplyOpen(false);
      setReplyText('');
      toast.success('Reply sent successfully');
    } catch (e) {
      const msg = e instanceof ComsRoutingError
        ? `Reply failed [${e.code}]: ${e.message}`
        : (e instanceof Error ? e.message : 'Failed to send reply');
      toast.error(msg);
    } finally {
      setReplySending(false);
    }
  };

  // Strip "From: ..." prefix from message for display
  const cleanMessage = (message: string): string => {
    return message.replace(/^From:\s*.+?\n\n/, '');
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <TicketCheck className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">{tickets.length} Total</span>
        </div>
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" /> {openCount} Open
        </Badge>
        {highPriorityCount > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" /> {highPriorityCount} High Priority
          </Badge>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tickets table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-foreground">Support Tickets</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading tickets...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <TicketCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No tickets found</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((ticket) => {
                  const sender = getSender(ticket);
                  const sc = statusConfig[ticket.status] || statusConfig.open;
                  const pc = priorityConfig[ticket.priority] || priorityConfig.normal;

                  return (
                    <div
                      key={ticket.id}
                      className="p-4 hover:bg-muted/50 transition cursor-pointer"
                      onClick={() => setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-foreground truncate">{ticket.subject}</span>
                            <Badge className={`text-[10px] h-5 gap-1 ${sc.color}`}>
                              {sc.icon} {sc.label}
                            </Badge>
                            <Badge className={`text-[10px] h-5 gap-1 ${pc.color}`}>
                              {pc.icon} {ticket.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>From: {sender.name}</span>
                            {ticket.source_app && (
                              <>
                                <span>·</span>
                                <Badge variant="outline" className="text-[9px] h-4 px-1">{ticket.source_app}</Badge>
                              </>
                            )}
                            <span>·</span>
                            <span title={`Created ${new Date(ticket.created_at).toLocaleString()}`}>
                              Last activity: {new Date(lastActivity(ticket)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTicket(ticket);
                              setReplyOpen(true);
                              setReplyText('');
                            }}
                          >
                            <Reply className="h-3 w-3 mr-1" /> Reply
                          </Button>
                          {ticket.status === 'open' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(ticket.id, 'resolved');
                              }}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Resolve
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Expanded ticket detail */}
                      {selectedTicket?.id === ticket.id && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground whitespace-pre-wrap">
                            {cleanMessage(ticket.message)}
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <Select
                              value={ticket.status}
                              onValueChange={(val) => handleStatusChange(ticket.id, val)}
                            >
                              <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="replied">Replied</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => { setReplyOpen(true); setReplyText(''); }}
                            >
                              <Reply className="h-3 w-3 mr-1" /> Reply
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Reply to: {selectedTicket?.subject}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground">
                To: {extractSenderFromMessage(selectedTicket.message).name} ({extractSenderFromMessage(selectedTicket.message).email})
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground max-h-32 overflow-y-auto">
                {cleanMessage(selectedTicket.message)}
              </div>
              <Textarea
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={5}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setReplyOpen(false)}>Cancel</Button>
                <Button
                  size="sm"
                  disabled={!replyText.trim() || replySending}
                  onClick={handleReply}
                >
                  <Send className="h-4 w-4 mr-1" /> {replySending ? 'Sending...' : 'Send Reply'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
