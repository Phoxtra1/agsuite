// src/components/acs/ACSModule.tsx
// PURPOSE: Amineva Central Server — unified data view across all products

import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Database, Search, Download, RefreshCw, ArrowUpDown, ChevronLeft, ChevronRight,
  AlertTriangle, CheckCircle, Clock, Filter, FileJson, FileSpreadsheet, FileText,
} from 'lucide-react';
import { toast } from 'sonner';

// ======== APP CONFIG ========
interface ACSApp {
  id: string;
  label: string;
  filterLabel: string; // "Shop" for AGStock, "Project" for AGIS, etc.
  columns: ACSColumn[];
}

interface ACSColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

const ACS_APPS: ACSApp[] = [
  {
    id: 'agstock',
    label: 'AGStock',
    filterLabel: 'Shop',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'shop', label: 'Shop', sortable: true },
      { key: 'product', label: 'Product', sortable: true },
      { key: 'quantity', label: 'Qty', sortable: true },
      { key: 'region', label: 'Region', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
      { key: 'synced_at', label: 'Synced', sortable: true },
    ],
  },
  {
    id: 'agis',
    label: 'AGIS',
    filterLabel: 'Project',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'project', label: 'Project', sortable: true },
      { key: 'client', label: 'Client', sortable: true },
      { key: 'region', label: 'Region', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
      { key: 'synced_at', label: 'Synced', sortable: true },
    ],
  },
  {
    id: 'amniva',
    label: 'Amniva',
    filterLabel: 'User',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'user', label: 'User', sortable: true },
      { key: 'action', label: 'Action', sortable: true },
      { key: 'region', label: 'Region', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
      { key: 'synced_at', label: 'Synced', sortable: true },
    ],
  },
  {
    id: 'phoxtra',
    label: 'Phoxtra',
    filterLabel: 'User',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'user', label: 'User', sortable: true },
      { key: 'verification', label: 'Verification', sortable: true },
      { key: 'region', label: 'Region', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
      { key: 'synced_at', label: 'Synced', sortable: true },
    ],
  },
  {
    id: 'agro-climate',
    label: 'AgroClimate',
    filterLabel: 'Station',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'station', label: 'Station', sortable: true },
      { key: 'metric', label: 'Metric', sortable: true },
      { key: 'value', label: 'Value', sortable: true },
      { key: 'region', label: 'Region', sortable: true },
      { key: 'synced_at', label: 'Synced', sortable: true },
    ],
  },
];

// ======== MOCK DATA GENERATOR ========
function generateMockData(appId: string, count: number = 25): Record<string, any>[] {
  const regions = ['Greater Accra', 'Ashanti', 'Northern', 'Western', 'Eastern', 'Volta'];
  const statuses = ['active', 'pending', 'synced', 'error'];
  return Array.from({ length: count }, (_, i) => {
    const base: Record<string, any> = {
      id: `${appId.toUpperCase()}-${String(i + 1).padStart(4, '0')}`,
      region: regions[i % regions.length],
      status: statuses[i % statuses.length],
      synced_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
    };
    if (appId === 'agstock') {
      base.shop = `Shop ${(i % 5) + 1}`;
      base.product = `Product ${i + 1}`;
      base.quantity = Math.floor(Math.random() * 500);
    } else if (appId === 'agis') {
      base.project = `Project Alpha ${(i % 4) + 1}`;
      base.client = `Client ${String.fromCharCode(65 + (i % 8))}`;
    } else if (appId === 'amniva') {
      base.user = `user${i + 1}@amineva.com`;
      base.action = ['login', 'purchase', 'update', 'verify'][i % 4];
    } else if (appId === 'phoxtra') {
      base.user = `user${i + 1}@phoxtra.com`;
      base.verification = ['identity', 'document', 'biometric', 'address'][i % 4];
    } else if (appId === 'agro-climate') {
      base.station = `Station ${(i % 6) + 1}`;
      base.metric = ['temperature', 'humidity', 'rainfall', 'wind_speed'][i % 4];
      base.value = `${(Math.random() * 40).toFixed(1)}`;
    }
    return base;
  });
}

// ======== STATUS BADGE ========
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
    active: { variant: 'default', icon: CheckCircle },
    synced: { variant: 'default', icon: CheckCircle },
    pending: { variant: 'secondary', icon: Clock },
    error: { variant: 'destructive', icon: AlertTriangle },
  };
  const cfg = config[status] ?? config.pending;
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className="gap-1 text-xs capitalize">
      <Icon className="h-3 w-3" /> {status}
    </Badge>
  );
}

// ======== DATA TABLE ========
const PAGE_SIZE = 10;

function ACSDataTab({ app }: { app: ACSApp }) {
  const [data] = useState(() => generateMockData(app.id));
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState(false);

  const regions = useMemo(() => [...new Set(data.map(d => d.region))], [data]);

  const filtered = useMemo(() => {
    let result = [...data];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(v => String(v).toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'all') result = result.filter(r => r.status === statusFilter);
    if (regionFilter !== 'all') result = result.filter(r => r.region === regionFilter);
    if (sortKey) {
      result.sort((a, b) => {
        const av = String(a[sortKey] ?? '');
        const bv = String(b[sortKey] ?? '');
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return result;
  }, [data, search, statusFilter, regionFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const handleSync = () => {
    setSyncing(true);
    setSyncError(false);
    setTimeout(() => {
      setSyncing(false);
      setLastSync(new Date());
      toast.success(`${app.label} data synchronized`);
    }, 2000);
  };

  const exportData = (format: 'csv' | 'json' | 'excel') => {
    const filename = `acs-${app.id}-${new Date().toISOString().slice(0, 10)}`;
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `${filename}.json`);
    } else if (format === 'csv') {
      const headers = app.columns.map(c => c.label).join(',');
      const rows = filtered.map(row => app.columns.map(c => `"${String(row[c.key] ?? '')}"`).join(','));
      const blob = new Blob([headers + '\n' + rows.join('\n')], { type: 'text/csv' });
      downloadBlob(blob, `${filename}.csv`);
    } else {
      // Excel = CSV for now (proper xlsx would need a library)
      const headers = app.columns.map(c => c.label).join('\t');
      const rows = filtered.map(row => app.columns.map(c => String(row[c.key] ?? '')).join('\t'));
      const blob = new Blob([headers + '\n' + rows.join('\n')], { type: 'application/vnd.ms-excel' });
      downloadBlob(blob, `${filename}.xls`);
    }
    toast.success(`Exported ${filtered.length} records as ${format.toUpperCase()}`);
  };

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4">
        <Card className="flex-1 min-w-[140px]">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Records</span>
            <span className="text-lg font-bold text-foreground">{filtered.length}</span>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[140px]">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Sync</span>
            <span className="text-sm font-medium text-foreground">
              {lastSync ? lastSync.toLocaleTimeString() : 'Never'}
            </span>
          </CardContent>
        </Card>
        {syncError && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" /> Sync Failed
          </Badge>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search all fields..."
            className="pl-9"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>

        <Select value={regionFilter} onValueChange={v => { setRegionFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="synced">Synced</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing…' : 'Sync Now'}
        </Button>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => exportData('csv')} title="Export CSV">
            <FileText className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => exportData('excel')} title="Export Excel">
            <FileSpreadsheet className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => exportData('json')} title="Export JSON">
            <FileJson className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Data Table */}
      {syncing ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {app.columns.map(col => (
                  <TableHead key={col.key}>
                    {col.sortable ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 -ml-3 font-medium"
                        onClick={() => toggleSort(col.key)}
                      >
                        {col.label}
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    ) : (
                      col.label
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={app.columns.length} className="text-center py-8 text-muted-foreground">
                    No records found.
                  </TableCell>
                </TableRow>
              ) : (
                paged.map(row => (
                  <TableRow key={row.id}>
                    {app.columns.map(col => (
                      <TableCell key={col.key}>
                        {col.key === 'status' ? (
                          <StatusBadge status={row[col.key]} />
                        ) : col.key === 'synced_at' ? (
                          <span className="text-xs text-muted-foreground">
                            {new Date(row[col.key]).toLocaleString()}
                          </span>
                        ) : (
                          String(row[col.key] ?? '')
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-foreground">Page {page + 1} / {totalPages || 1}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ======== MAIN MODULE ========
export function ACSModule() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" /> Amineva Central Server
        </h2>
        <p className="text-muted-foreground">
          Unified data synchronization and monitoring across all Amineva products
        </p>
      </div>

      <Tabs defaultValue="agstock" className="space-y-4">
        <TabsList className="flex flex-wrap">
          {ACS_APPS.map(app => (
            <TabsTrigger key={app.id} value={app.id} className="gap-2">
              <Database className="h-4 w-4" />
              <span>{app.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {ACS_APPS.map(app => (
          <TabsContent key={app.id} value={app.id}>
            <ACSDataTab app={app} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
