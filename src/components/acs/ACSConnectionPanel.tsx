// src/components/acs/ACSConnectionPanel.tsx
// PURPOSE: Shows the ACS ingest endpoint details, health status, and integration snippets

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, RefreshCw, Copy, Plug, Terminal } from 'lucide-react';
import { toast } from 'sonner';

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;
const INGEST_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/acs-ingest`;

interface HealthResult {
  status: 'online' | 'offline' | 'checking';
  total_events?: number;
  timestamp?: string;
  error?: string;
}

export function ACSConnectionPanel() {
  const [health, setHealth] = useState<HealthResult>({ status: 'checking' });
  const [checking, setChecking] = useState(false);

  const checkHealth = async () => {
    setChecking(true);
    setHealth({ status: 'checking' });
    try {
      const res = await fetch(INGEST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-acs-api-key': 'health-check-ping',
        },
        body: JSON.stringify({ action: 'health' }),
      });
      // 401 means the endpoint IS up (just wrong key from frontend — expected)
      if (res.status === 401 || res.ok) {
        const data = res.ok ? await res.json() : null;
        setHealth({
          status: 'online',
          total_events: data?.total_events,
          timestamp: data?.timestamp ?? new Date().toISOString(),
        });
      } else {
        setHealth({ status: 'offline', error: `HTTP ${res.status}` });
      }
    } catch (err: any) {
      setHealth({ status: 'offline', error: err.message });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const curlSnippet = `curl -X POST "${INGEST_URL}" \\
  -H "Content-Type: application/json" \\
  -H "x-acs-api-key: YOUR_ACS_API_KEY" \\
  -d '{"action":"event","source":"agstock","type":"sale.created","payload":{"amount":150}}'`;

  const fetchSnippet = `// Single event
await fetch("${INGEST_URL}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-acs-api-key": process.env.ACS_INGEST_API_KEY,
  },
  body: JSON.stringify({
    action: "event",
    source: "agstock",   // agstock | agis | amniva | phoxtra | agro-climate
    type: "sale.created",
    payload: { amount: 150, product_id: "abc123" },
  }),
});

// Batch ingest (up to 500)
await fetch("${INGEST_URL}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-acs-api-key": process.env.ACS_INGEST_API_KEY,
  },
  body: JSON.stringify({
    action: "batch",
    events: [
      { source: "agstock", type: "stock.updated", payload: { sku: "X1" } },
      { source: "agstock", type: "sale.created",  payload: { amount: 200 } },
    ],
  }),
});`;

  const syncSnippet = `// 1. Start a sync session
const { sync_id } = await fetch("${INGEST_URL}", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-acs-api-key": ACS_KEY },
  body: JSON.stringify({ action: "sync", source: "agstock" }),
}).then(r => r.json());

// 2. Send your events via "batch" action (see Fetch tab)

// 3. Complete the sync session
await fetch("${INGEST_URL}", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-acs-api-key": ACS_KEY },
  body: JSON.stringify({ action: "sync_complete", sync_id, records_synced: 42 }),
});`;

  const statusColor =
    health.status === 'online'
      ? 'text-green-600 dark:text-green-400'
      : health.status === 'offline'
      ? 'text-destructive'
      : 'text-muted-foreground';

  const StatusIcon =
    health.status === 'online'
      ? CheckCircle2
      : health.status === 'offline'
      ? XCircle
      : RefreshCw;

  return (
    <div className="space-y-4">
      {/* Endpoint card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plug className="h-4 w-4 text-primary" /> Ingest Endpoint
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL row */}
          <div className="flex items-center gap-2 p-3 rounded-md bg-muted font-mono text-xs break-all">
            <span className="flex-1 text-foreground">{INGEST_URL}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => copy(INGEST_URL, 'Endpoint URL')}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Health */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 text-sm font-medium ${statusColor}`}>
              <StatusIcon className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
              {health.status === 'checking'
                ? 'Checking…'
                : health.status === 'online'
                ? 'Endpoint Online'
                : `Endpoint Offline${health.error ? ` — ${health.error}` : ''}`}
              {health.status === 'online' && health.total_events !== undefined && (
                <Badge variant="secondary" className="text-xs ml-1">
                  {health.total_events.toLocaleString()} events
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={checkHealth} disabled={checking}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${checking ? 'animate-spin' : ''}`} />
              Recheck
            </Button>
          </div>

          {/* Auth note */}
          <div className="text-xs text-muted-foreground border border-border rounded-md p-3 space-y-1">
            <p className="font-medium text-foreground">Authentication</p>
            <p>Add the header <code className="bg-muted px-1 rounded">x-acs-api-key: &lt;ACS_INGEST_API_KEY&gt;</code> to every request.</p>
            <p>The key is stored securely as a backend secret — never expose it in client-side code.</p>
          </div>
        </CardContent>
      </Card>

      {/* Code snippets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" /> Integration Snippets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="curl">
            <TabsList className="mb-3">
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="fetch">Fetch / Node</TabsTrigger>
              <TabsTrigger value="sync">Sync Session</TabsTrigger>
            </TabsList>

            {[
              { key: 'curl', code: curlSnippet },
              { key: 'fetch', code: fetchSnippet },
              { key: 'sync', code: syncSnippet },
            ].map(({ key, code }) => (
              <TabsContent key={key} value={key}>
                <div className="relative">
                  <pre className="text-xs bg-muted text-foreground rounded-md p-4 overflow-x-auto whitespace-pre">
                    {code}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => copy(code, 'Snippet')}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Supported actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Supported Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            {[
              { action: 'event', desc: 'Ingest a single event' },
              { action: 'batch', desc: 'Bulk-ingest up to 500 events' },
              { action: 'sync', desc: 'Start a named sync session, returns sync_id' },
              { action: 'sync_complete', desc: 'Close a sync session with result/error' },
              { action: 'health', desc: 'Returns service status + total event count' },
            ].map(({ action, desc }) => (
              <div key={action} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                <code className="bg-muted text-foreground px-2 py-0.5 rounded text-xs shrink-0">
                  {action}
                </code>
                <span className="text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
