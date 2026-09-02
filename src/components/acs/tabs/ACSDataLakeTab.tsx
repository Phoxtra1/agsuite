// src/components/acs/tabs/ACSDataLakeTab.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, RefreshCw, HardDrive, Layers, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { acs } from '@/core/backend';
import type { ACSRawData, ACSProcessingLog, ACSTransformationAudit } from '@/core/backend/acs';

const PLATFORMS = ['all', 'agroclimate', 'agstock', 'agis', 'aminevaops', 'Dipa'] as const;
const PLATFORM_LABELS: Record<string, string> = {
  all: 'All Platforms',
  agroclimate: 'AgroClimate',
  agstock: 'Nyansa',
  agis: 'DataLens',
  aminevaops: 'Sikasɛm',
  Dipa: 'Dipa',
};

interface Props {
  currentBackend: string;
}

export function ACSDataLakeTab({ currentBackend }: Props) {
  const [platform, setPlatform] = useState('all');
  const [rawData, setRawData] = useState<ACSRawData[]>([]);
  const [rawCount, setRawCount] = useState(0);
  const [processLogs, setProcessLogs] = useState<ACSProcessingLog[]>([]);
  const [audits, setAudits] = useState<ACSTransformationAudit[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rawRes, logs, auditRes] = await Promise.all([
        acs.fetchRawData({ platform: platform !== 'all' ? platform : undefined, limit: 20 }),
        acs.fetchProcessingLogs({ limit: 10 }),
        acs.fetchTransformationAudit({ limit: 10 }),
      ]);
      setRawData(rawRes.data);
      setRawCount(rawRes.count);
      setProcessLogs(logs);
      setAudits(auditRes);
    } catch (err) {
      console.error('Data lake load error:', err);
      toast.error('Failed to load data lake');
    } finally {
      setLoading(false);
    }
  }, [platform, currentBackend]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <HardDrive className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{rawCount}</p>
              <p className="text-sm text-muted-foreground">Raw Records</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Layers className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{processLogs.length}</p>
              <p className="text-sm text-muted-foreground">Pipeline Runs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{audits.length}</p>
              <p className="text-sm text-muted-foreground">Audit Entries</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLATFORMS.map((p) => (
              <SelectItem key={p} value={p}>{PLATFORM_LABELS[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Raw Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5" /> Recent Raw Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rawData.length === 0 ? (
            <p className="text-muted-foreground text-sm">No raw data ingested yet. Use the ACS API to ingest data from your platforms.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Platform</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Type</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Batch</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Ingested</th>
                  </tr>
                </thead>
                <tbody>
                  {rawData.map((r) => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 px-3">
                        <Badge variant="outline">{PLATFORM_LABELS[r.platform] ?? r.platform}</Badge>
                      </td>
                      <td className="py-2 px-3 text-foreground">{r.dataset_type}</td>
                      <td className="py-2 px-3 text-muted-foreground text-xs font-mono">{r.batch_id?.slice(0, 16) ?? '—'}</td>
                      <td className="py-2 px-3 text-muted-foreground">{new Date(r.ingested_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="h-5 w-5" /> Processing Pipelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          {processLogs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No pipelines executed yet.</p>
          ) : (
            <div className="space-y-2">
              {processLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{log.pipeline}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.input_count} in → {log.output_count} out
                    </p>
                  </div>
                  <Badge variant={log.status === 'completed' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                    {log.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" /> Transformation Audit
          </CardTitle>
        </CardHeader>
        <CardContent>
          {audits.length === 0 ? (
            <p className="text-muted-foreground text-sm">No transformations recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {audits.map((a) => (
                <div key={a.id} className="p-3 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{a.transform_type}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                  </div>
                  {a.changes_summary && (
                    <p className="text-sm text-muted-foreground mt-1">{a.changes_summary}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
