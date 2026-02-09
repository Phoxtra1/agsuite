import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Mail, Plus, X } from 'lucide-react';
import type { ComsThread, ComsListFilters, SuiteKeyValue } from '@/lib/coms/types';
import { SUITE_KEYS } from '@/lib/coms/types';
import { listThreads } from '@/lib/coms/comsApi';
import { ThreadRow } from './ThreadRow';
import { ThreadDetail } from './ThreadDetail';

interface ThreadListPanelProps {
  onComposeClick: () => void;
  visibleSuiteKeys: typeof SUITE_KEYS;
}

export function ThreadListPanel({ onComposeClick, visibleSuiteKeys }: ThreadListPanelProps) {
  const [threads, setThreads] = useState<ComsThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterApp, setFilterApp] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    const filters: ComsListFilters = {};
    if (filterApp !== 'all') filters.suiteKey = filterApp;
    if (filterChannel !== 'all') filters.channel = filterChannel as ComsListFilters['channel'];
    if (searchQuery.trim()) filters.search = searchQuery.trim();

    const { data, error } = await listThreads(filters);
    if (data) setThreads(data);
    if (error) console.error('Failed to load threads:', error.message);
    setLoading(false);
  }, [filterApp, filterChannel, searchQuery]);

  // Debounce search, instant for dropdown filters
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchThreads, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchThreads]);

  const selectedThread = threads.find((t) => t.threadId === selectedId) || null;
  const hasActiveFilters = filterApp !== 'all' || filterChannel !== 'all' || searchQuery !== '';

  const clearFilters = () => {
    setFilterApp('all');
    setFilterChannel('all');
    setSearchQuery('');
  };

  // Mark messages as read when selecting
  const handleSelect = (threadId: string) => {
    setSelectedId(threadId);
    const thread = threads.find((t) => t.threadId === threadId);
    if (thread) {
      thread.messages.forEach((m) => {
        if (m.status === 'unread') m.status = 'read';
      });
      setThreads([...threads]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left: Thread list */}
      <div className="lg:col-span-1">
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-foreground mb-2">
              Inbox
              {threads.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">{threads.length}</Badge>
              )}
            </CardTitle>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search threads…"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={filterApp} onValueChange={setFilterApp}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue placeholder="All Apps" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Apps</SelectItem>
                  {visibleSuiteKeys.map((sk) => (
                    <SelectItem key={sk.value} value={sk.value}>
                      {sk.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterChannel} onValueChange={setFilterChannel}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="ticket">Ticket</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearFilters}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden">
            {loading ? (
              <div className="p-3 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div>
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground mb-1">No messages found</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    {hasActiveFilters
                      ? 'Try adjusting your filters or search query'
                      : 'Send your first message to get started'}
                  </p>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={onComposeClick}>
                    <Plus className="h-3.5 w-3.5" />
                    New Message
                  </Button>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                {threads.map((thread) => (
                  <ThreadRow
                    key={thread.threadId}
                    thread={thread}
                    isSelected={selectedId === thread.threadId}
                    onClick={() => handleSelect(thread.threadId)}
                  />
                ))}
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right: Thread detail */}
      <div className="lg:col-span-2">
        <ThreadDetail thread={selectedThread} onThreadUpdated={fetchThreads} />
      </div>
    </div>
  );
}
