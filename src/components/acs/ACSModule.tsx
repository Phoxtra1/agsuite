// src/components/acs/ACSModule.tsx
// PURPOSE: Amineva Central Server — real-time unified data view across all products

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Search, RefreshCw, Radio, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { acs } from '@/core/backend';
import type { ACSEvent, ACSSyncLog } from '@/core/backend/acs';
import { ACSEventTable } from './ACSEventTable';
import { ACSSyncPanel } from './ACSSyncPanel';
import { ACSExport } from './ACSExport';

const SOURCES = ['agstock', 'agis', 'amniva', 'phoxtra', 'agro-climate'] as const;
const SOURCE_LABELS: Record<string, string> = {
  agstock: 'AGStock',
  agis: 'AGIS',
  amniva: 'Amniva',
  phoxtra: 'Phoxtra',
  'agro-climate': 'AgroClimate',
};
const PAGE_SIZE = 10;

export function ACSModule() {
  const [activeSource, setActiveSource] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [events, setEvents] = useState<ACSEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [syncLogs, setSyncLogs] = useState<ACSSyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [liveCount, setLiveCount] = useState(0);

  // Fetch events from backend
  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, count } = await acs.fetchEvents({
        source: activeSource !== 'all' ? activeSource : undefined,
        search: search || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setEvents(data);
      setTotalCount(count);
    } catch (err: any) {
      console.error('ACS fetch error:', err);
      toast.error('Failed to load ACS events');
    } finally {
      setLoading(false);
    }
  }, [activeSource, search, page]);

  // Fetch sync logs
  const loadSyncLogs = useCallback(async () => {
    try {
      const logs = await acs.fetchSyncLogs(activeSource !== 'all' ? activeSource : undefined);
      setSyncLogs(logs);
    } catch (err) {
      console.error('Sync logs error:', err);
    }
  }, [activeSource]);

  // Load data on filter changes
  useEffect(() => {
    loadEvents();
    loadSyncLogs();
  }, [loadEvents, loadSyncLogs]);

  // Real-time subscription
  useEffect(() => {
    setRealtimeConnected(true);
    const unsubscribe = acs.subscribeEvents((newEvent) => {
      // Only add if matches current filter
      if (activeSource !== 'all' && newEvent.source !== activeSource) return;
      
      setLiveCount(c => c + 1);
      setEvents(prev => [newEvent, ...prev].slice(0, PAGE_SIZE));
      setTotalCount(c => c + 1);
      
      toast.info(`New event: ${newEvent.source} → ${newEvent.type}`, {
        duration: 3000,
      });
    });

    return () => {
      setRealtimeConnected(false);
      unsubscribe();
    };
  }, [activeSource]);

  // Trigger sync
  const handleSync = async () => {
    const source = activeSource !== 'all' ? activeSource : 'agstock';
    setSyncing(true);
    try {
      await acs.triggerSync(source);
      toast.success(`Sync triggered for ${SOURCE_LABELS[source] ?? source}`);
      // Reload after delay to get updated sync log
      setTimeout(() => {
        loadSyncLogs();
        loadEvents();
        setSyncing(false);
      }, 2500);
    } catch (err: any) {
      toast.error('Sync failed: ' + (err.message ?? 'Unknown error'));
      setSyncing(false);
    }
  };

  // Reset page on filter change
  const handleSourceChange = (source: string) => {
    setActiveSource(source);
    setPage(0);
    setLiveCount(0);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" /> Amineva Central Server
          </h2>
          <p className="text-muted-foreground">
            Real-time data synchronization and monitoring across all Amineva products
          </p>
        </div>
        <div className="flex items-center gap-2">
          {realtimeConnected ? (
            <Badge variant="outline" className="gap-1 text-xs border-green-500 text-green-600">
              <Wifi className="h-3 w-3" /> Live
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-xs border-destructive text-destructive">
              <WifiOff className="h-3 w-3" /> Offline
            </Badge>
          )}
          {liveCount > 0 && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Radio className="h-3 w-3 animate-pulse" /> {liveCount} new
            </Badge>
          )}
        </div>
      </div>

      {/* Sync status cards */}
      <ACSSyncPanel logs={syncLogs} isSyncing={syncing} />

      {/* Source tabs */}
      <Tabs value={activeSource} onValueChange={handleSourceChange} className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="all" className="gap-2">
            <Database className="h-4 w-4" /> All Sources
          </TabsTrigger>
          {SOURCES.map(src => (
            <TabsTrigger key={src} value={src} className="gap-2">
              <Database className="h-4 w-4" />
              <span>{SOURCE_LABELS[src]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Toolbar — shared across all tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              className="pl-9"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
            />
          </div>

          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing…' : 'Sync Now'}
          </Button>

          <ACSExport data={events} source={activeSource} />
        </div>

        {/* Event count */}
        <Card>
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Events</span>
            <span className="text-lg font-bold text-foreground">{totalCount}</span>
          </CardContent>
        </Card>

        {/* Event table (same for all tabs, data filtered by source) */}
        <ACSEventTable
          events={events}
          totalCount={totalCount}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          loading={loading}
        />
      </Tabs>
    </div>
  );
}
