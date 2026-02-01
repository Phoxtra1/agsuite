import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Search, 
  Star, 
  Archive, 
  Trash2, 
  Reply, 
  MoreHorizontal,
  Mail,
  Bell,
  AlertCircle,
  CheckCircle,
  MailOpen,
  Forward
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: string;
  email: string;
  subject: string;
  preview: string;
  body: string;
  sourceApp: string;
  type: 'system' | 'support' | 'notification' | 'campaign';
  priority: 'high' | 'medium' | 'low';
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  timestamp: string;
}

const initialMessages: Message[] = [
  {
    id: '1',
    sender: 'John Mensah',
    email: 'john@example.com',
    subject: 'Stock Alert - Low inventory for Product SKU-2341',
    preview: 'The inventory for Product SKU-2341 has fallen below the minimum threshold...',
    body: 'The inventory for Product SKU-2341 has fallen below the minimum threshold of 10 units. Current stock level is 5 units.\n\nPlease reorder immediately to avoid stockouts.\n\nProduct: Premium Widget\nSKU: SKU-2341\nCurrent Stock: 5\nReorder Level: 10\nSupplier: Widget Co.',
    sourceApp: 'AGStock',
    type: 'system',
    priority: 'high',
    isRead: false,
    isStarred: true,
    isArchived: false,
    timestamp: '2 min ago',
  },
  {
    id: '2',
    sender: 'Ama Owusu',
    email: 'ama@business.gh',
    subject: 'Question about invoice #INV-2024-0892',
    preview: 'Hello, I received the invoice but the amount seems different from what we discussed...',
    body: 'Hello,\n\nI received the invoice #INV-2024-0892 but the amount seems different from what we discussed during our meeting.\n\nThe invoice shows GHS 5,400 but we agreed on GHS 5,000 with the 8% discount.\n\nCould you please review and send a corrected invoice?\n\nThank you,\nAma Owusu',
    sourceApp: 'AGIS',
    type: 'support',
    priority: 'medium',
    isRead: false,
    isStarred: false,
    isArchived: false,
    timestamp: '15 min ago',
  },
  {
    id: '3',
    sender: 'System',
    email: 'noreply@amineva.com',
    subject: 'Daily Sales Summary - January 31, 2025',
    preview: 'Your daily sales summary is ready. Total sales: GHS 12,450.00...',
    body: 'Daily Sales Summary for January 31, 2025\n\n━━━━━━━━━━━━━━━━━━━━\nTotal Sales: GHS 12,450.00\nTransactions: 47\nAverage Order: GHS 264.89\n━━━━━━━━━━━━━━━━━━━━\n\nTop Products:\n1. Premium Widget - 23 units\n2. Standard Widget - 15 units\n3. Basic Widget - 9 units\n\nView full report in your dashboard.',
    sourceApp: 'AGStock',
    type: 'notification',
    priority: 'low',
    isRead: true,
    isStarred: false,
    isArchived: false,
    timestamp: '1 hour ago',
  },
  {
    id: '4',
    sender: 'Kofi Asante',
    email: 'kofi@supplier.com',
    subject: 'Re: Bulk order confirmation',
    preview: 'Thank you for your order. We can confirm delivery for next week Tuesday...',
    body: 'Thank you for your order.\n\nWe can confirm delivery for next week Tuesday, February 4th, 2025.\n\nOrder Details:\n- 500x Premium Widgets\n- 300x Standard Widgets\n- 200x Basic Widgets\n\nTotal: GHS 45,000.00\n\nDelivery Address: 123 Business Street, Accra\n\nBest regards,\nKofi Asante\nWidget Co. Sales',
    sourceApp: 'AGHub',
    type: 'support',
    priority: 'medium',
    isRead: true,
    isStarred: true,
    isArchived: false,
    timestamp: '3 hours ago',
  },
  {
    id: '5',
    sender: 'Marketing Team',
    email: 'marketing@amineva.com',
    subject: 'Campaign "February Promo" launched successfully',
    preview: 'Your email campaign has been sent to 2,340 recipients. Track results...',
    body: 'Your email campaign has been successfully launched!\n\nCampaign: February Promo\nRecipients: 2,340\nSent: 2,340\nDelivered: 2,298 (98.2%)\n\nTrack your campaign performance in the Campaigns tab.\n\nThe first open and click metrics will be available within the next few hours.',
    sourceApp: 'ComsSystem',
    type: 'campaign',
    priority: 'low',
    isRead: true,
    isStarred: false,
    isArchived: false,
    timestamp: 'Yesterday',
  },
];

const appColors: Record<string, string> = {
  AGStock: 'bg-emerald-500',
  AGIS: 'bg-blue-500',
  AGHub: 'bg-purple-500',
  AminevaOps: 'bg-orange-500',
  ComsSystem: 'bg-primary',
};

const typeIcons: Record<string, React.ReactNode> = {
  system: <AlertCircle className="h-3 w-3" />,
  support: <Mail className="h-3 w-3" />,
  notification: <Bell className="h-3 w-3" />,
  campaign: <CheckCircle className="h-3 w-3" />,
};

export function UnifiedInbox() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [filterApp, setFilterApp] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMessages = messages
    .filter(msg => !msg.isArchived)
    .filter(msg => {
      if (filterApp !== 'all' && msg.sourceApp !== filterApp) return false;
      if (filterType !== 'all' && msg.type !== filterType) return false;
      if (searchQuery && !msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !msg.sender.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

  const selectedMessage = messages.find(m => m.id === selectedMessageId);

  const handleSelectMessage = (messageId: string) => {
    setSelectedMessageId(messageId);
    // Mark as read
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, isRead: true } : m
    ));
  };

  const handleToggleStar = (messageId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, isStarred: !m.isStarred } : m
    ));
  };

  const handleArchive = (messageId: string) => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, isArchived: true } : m
    ));
    if (selectedMessageId === messageId) {
      setSelectedMessageId(null);
    }
    toast.success('Message archived');
  };

  const handleDelete = (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    if (selectedMessageId === messageId) {
      setSelectedMessageId(null);
    }
    toast.success('Message deleted');
  };

  const handleMarkAsUnread = (messageId: string) => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, isRead: false } : m
    ));
    toast.success('Marked as unread');
  };

  const handleReply = () => {
    toast.success('Reply composer opened');
  };

  const handleForward = () => {
    toast.success('Forward composer opened');
  };

  const unreadCount = messages.filter(m => !m.isRead && !m.isArchived).length;

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
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search messages..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterApp} onValueChange={setFilterApp}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue placeholder="All Apps" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Apps</SelectItem>
                  <SelectItem value="AGStock">AGStock</SelectItem>
                  <SelectItem value="AGIS">AGIS</SelectItem>
                  <SelectItem value="AGHub">AGHub</SelectItem>
                  <SelectItem value="AminevaOps">AminevaOps</SelectItem>
                  <SelectItem value="ComsSystem">ComsSystem</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="campaign">Campaign</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[480px]">
              <div className="divide-y">
                {filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg.id)}
                    className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedMessageId === msg.id ? 'bg-muted' : ''
                    } ${!msg.isRead ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {msg.sender.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm truncate text-foreground ${!msg.isRead ? 'font-semibold' : ''}`}>
                            {msg.sender}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {msg.timestamp}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${!msg.isRead ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                          {msg.subject}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs h-5 text-white ${appColors[msg.sourceApp] || 'bg-gray-500'}`}
                          >
                            {msg.sourceApp}
                          </Badge>
                          <Badge variant="outline" className="text-xs h-5 gap-1 text-foreground border-border">
                            {typeIcons[msg.type]}
                            {msg.type}
                          </Badge>
                          {msg.isStarred && (
                            <Star 
                              className="h-3 w-3 text-amber-500 fill-amber-500 cursor-pointer" 
                              onClick={(e) => handleToggleStar(msg.id, e)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredMessages.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No messages found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Message Detail */}
      <div className="lg:col-span-2">
        <Card className="h-[600px] flex flex-col">
          {selectedMessage ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-foreground">{selectedMessage.subject}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>From: {selectedMessage.sender} &lt;{selectedMessage.email}&gt;</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleToggleStar(selectedMessage.id)}
                      className="text-foreground"
                    >
                      <Star className={`h-4 w-4 ${selectedMessage.isStarred ? 'text-amber-500 fill-amber-500' : ''}`} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleMarkAsUnread(selectedMessage.id)}
                      className="text-foreground"
                    >
                      <MailOpen className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleArchive(selectedMessage.id)}
                      className="text-foreground"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(selectedMessage.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`text-white ${appColors[selectedMessage.sourceApp]}`}>
                    {selectedMessage.sourceApp}
                  </Badge>
                  <Badge variant="outline" className="gap-1 text-foreground border-border">
                    {typeIcons[selectedMessage.type]}
                    {selectedMessage.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{selectedMessage.timestamp}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-6 overflow-auto">
                <div className="whitespace-pre-wrap text-foreground">
                  {selectedMessage.body}
                </div>
              </CardContent>
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Button className="gap-2" onClick={handleReply}>
                    <Reply className="h-4 w-4" />
                    Reply
                  </Button>
                  <Button variant="outline" className="gap-2 text-foreground border-border" onClick={handleForward}>
                    <Forward className="h-4 w-4" />
                    Forward
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a message to view</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
