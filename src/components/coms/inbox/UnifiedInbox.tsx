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
  Filter, 
  Star, 
  Archive, 
  Trash2, 
  Reply, 
  MoreHorizontal,
  Mail,
  Bell,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

// Mock messages data
const mockMessages = [
  {
    id: '1',
    sender: 'John Mensah',
    email: 'john@example.com',
    subject: 'Stock Alert - Low inventory for Product SKU-2341',
    preview: 'The inventory for Product SKU-2341 has fallen below the minimum threshold...',
    sourceApp: 'AGStock',
    type: 'system',
    priority: 'high',
    isRead: false,
    isStarred: true,
    timestamp: '2 min ago',
  },
  {
    id: '2',
    sender: 'Ama Owusu',
    email: 'ama@business.gh',
    subject: 'Question about invoice #INV-2024-0892',
    preview: 'Hello, I received the invoice but the amount seems different from what we discussed...',
    sourceApp: 'AGIS',
    type: 'support',
    priority: 'medium',
    isRead: false,
    isStarred: false,
    timestamp: '15 min ago',
  },
  {
    id: '3',
    sender: 'System',
    email: 'noreply@amineva.com',
    subject: 'Daily Sales Summary - January 31, 2025',
    preview: 'Your daily sales summary is ready. Total sales: GHS 12,450.00...',
    sourceApp: 'AGStock',
    type: 'notification',
    priority: 'low',
    isRead: true,
    isStarred: false,
    timestamp: '1 hour ago',
  },
  {
    id: '4',
    sender: 'Kofi Asante',
    email: 'kofi@supplier.com',
    subject: 'Re: Bulk order confirmation',
    preview: 'Thank you for your order. We can confirm delivery for next week Tuesday...',
    sourceApp: 'AGHub',
    type: 'support',
    priority: 'medium',
    isRead: true,
    isStarred: true,
    timestamp: '3 hours ago',
  },
  {
    id: '5',
    sender: 'Marketing Team',
    email: 'marketing@amineva.com',
    subject: 'Campaign "February Promo" launched successfully',
    preview: 'Your email campaign has been sent to 2,340 recipients. Track results...',
    sourceApp: 'ComsSystem',
    type: 'campaign',
    priority: 'low',
    isRead: true,
    isStarred: false,
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
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [filterApp, setFilterApp] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMessages = mockMessages.filter(msg => {
    if (filterApp !== 'all' && msg.sourceApp !== filterApp) return false;
    if (filterType !== 'all' && msg.type !== filterType) return false;
    if (searchQuery && !msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !msg.sender.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const selected = mockMessages.find(m => m.id === selectedMessage);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Message List */}
      <div className="lg:col-span-1">
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="pb-2">
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
                    onClick={() => setSelectedMessage(msg.id)}
                    className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedMessage === msg.id ? 'bg-muted' : ''
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
                          <span className={`text-sm truncate ${!msg.isRead ? 'font-semibold' : ''}`}>
                            {msg.sender}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {msg.timestamp}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${!msg.isRead ? 'font-medium' : 'text-muted-foreground'}`}>
                          {msg.subject}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs h-5 text-white ${appColors[msg.sourceApp] || 'bg-gray-500'}`}
                          >
                            {msg.sourceApp}
                          </Badge>
                          <Badge variant="outline" className="text-xs h-5 gap-1">
                            {typeIcons[msg.type]}
                            {msg.type}
                          </Badge>
                          {msg.isStarred && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Message Detail */}
      <div className="lg:col-span-2">
        <Card className="h-[600px] flex flex-col">
          {selected ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{selected.subject}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>From: {selected.sender} &lt;{selected.email}&gt;</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon">
                      <Star className={`h-4 w-4 ${selected.isStarred ? 'text-amber-500 fill-amber-500' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`text-white ${appColors[selected.sourceApp]}`}>
                    {selected.sourceApp}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    {typeIcons[selected.type]}
                    {selected.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{selected.timestamp}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-6 overflow-auto">
                <p className="text-muted-foreground">
                  {selected.preview}
                </p>
                <p className="mt-4 text-muted-foreground">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis 
                  nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
              </CardContent>
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Button className="gap-2">
                    <Reply className="h-4 w-4" />
                    Reply
                  </Button>
                  <Button variant="outline">Forward</Button>
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
