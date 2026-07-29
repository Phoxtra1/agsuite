// src/components/acs/tabs/ACSMonitorTab.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Database, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { acs } from '@/core/backend';
import type { ACSEvent, ACSSyncLog } from '@/core/backend/acs';
import { ACSEventTable } from '../ACSEventTable';
import { ACSSyncPanel } from '../ACSSyncPanel';
import { ACSExport } from '../ACSExport';

const SOURCES = ['agstock', 'agis', 'amniva', 'agroclimate', 'aminevaops', 'dipa'] as const;
const SOURCE_LABELS: Record<string, string> = {
  agstock: 'AGStock',
  agis: 'AGIS',
  amniva: 'ABI',
  agroclimate: 'AgroClimate',
  aminevaops: 'AminevaOps',
  dipa: 'Dipa',
};
const PAGE_SIZE = 10;

interface Props {
  currentBackend: string;
}

export function ACSMonitorTab({ currentBackend }: Props) {
  const [activeSource, setActiveSource] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [events, setEvents] = useState<ACSEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [syncLogs, setSyncLogs] = useState<ACSSyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

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
  }, [activeSource, search, page, currentBackend]);

  const loadSyncLogs = useCallback(async () => {
    try {
      const logs = await acs.fetchSyncLogs(activeSource !== 'all' ? activeSource : undefined);
      setSyncLogs(logs);
    } catch (err) {
      console.error('Sync logs error:', err);
    }
  }, [activeSource, currentBackend]);

  useEffect(() => {
    loadEvents();
    loadSyncLogs();
  }, [loadEvents, loadSyncLogs]);

  const handleSync = async () => {
    const source = activeSource !== 'all' ? activeSource : 'agstock';
    setSyncing(true);
    try {
      await acs.triggerSync(source);
      toast.success(`Sync triggered for ${SOURCE_LABELS[source] ?? source}`);
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

  return (
    <div className="space-y-4">
      <ACSSyncPanel logs={syncLogs} isSyncing={syncing} />

      <Tabs value={activeSource} onValueChange={(v) => { setActiveSource(v); setPage(0); }} className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="all" className="gap-2">
            <Database className="h-4 w-4" /> All Sources
          </TabsTrigger>
          {SOURCES.map((src) => (
            <TabsTrigger key={src} value={src} className="gap-2">
              <Database className="h-4 w-4" />
              <span>{SOURCE_LABELS[src]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing…' : 'Sync Now'}
          </Button>
          <ACSExport data={events} source={activeSource} />
        </div>

        <Card>
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Events</span>
            <span className="text-lg font-bold text-foreground">{totalCount}</span>
          </CardContent>
        </Card>

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
