import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, Mail, Bell, MessageSquare, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LogRow {
  id: string;
  event: string;
  channel: string;
  source_app: string | null;
  delivery_status: string;
  created_at: string;
}

const CHANNEL_COLORS: Record<string, string> = {
  email: 'hsl(var(--primary))',
  'in-app': 'hsl(var(--accent-foreground))',
  sms: 'hsl(142, 76%, 36%)',
};

const STATUS_COLORS: Record<string, string> = {
  sent: 'hsl(142, 76%, 36%)',
  delivered: 'hsl(var(--primary))',
  failed: 'hsl(0, 84%, 60%)',
  bounced: 'hsl(25, 95%, 53%)',
  received: 'hsl(217, 91%, 60%)',
  queued: 'hsl(45, 93%, 47%)',
};

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(142, 76%, 36%)', 'hsl(25, 95%, 53%)', 'hsl(217, 91%, 60%)', 'hsl(280, 67%, 55%)', 'hsl(45, 93%, 47%)'];

export function ComsAnalyticsDashboard() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('30d');

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('coms_logs')
        .select('id, event, channel, source_app, delivery_status, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (!error && data) setLogs(data as LogRow[]);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    if (timeRange === '24h') cutoff.setHours(now.getHours() - 24);
    else if (timeRange === '7d') cutoff.setDate(now.getDate() - 7);
    else if (timeRange === '30d') cutoff.setDate(now.getDate() - 30);
    else cutoff.setFullYear(2000);

    return logs.filter(l => new Date(l.created_at) >= cutoff);
  }, [logs, timeRange]);

  // Summary stats
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const delivered = filteredLogs.filter(l => l.delivery_status === 'delivered' || l.delivery_status === 'sent').length;
    const failed = filteredLogs.filter(l => l.delivery_status === 'failed' || l.event === 'failed' || l.event === 'bounced').length;
    const received = filteredLogs.filter(l => l.delivery_status === 'received').length;
    const rate = total > 0 ? Math.round((delivered / total) * 100) : 0;
    return { total, delivered, failed, received, rate };
  }, [filteredLogs]);

  // Volume over time (daily buckets)
  const volumeOverTime = useMemo(() => {
    const buckets: Record<string, Record<string, number>> = {};
    filteredLogs.forEach(l => {
      const day = new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const app = l.source_app || 'Other';
      if (!buckets[day]) buckets[day] = {};
      buckets[day][app] = (buckets[day][app] || 0) + 1;
    });
    const apps = [...new Set(filteredLogs.map(l => l.source_app || 'Other'))];
    return { data: Object.entries(buckets).reverse().map(([date, apps]) => ({ date, ...apps })), apps };
  }, [filteredLogs]);

  // Channel breakdown
  const channelBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach(l => {
      counts[l.channel] = (counts[l.channel] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredLogs]);

  // Status breakdown
  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach(l => {
      const status = l.delivery_status || l.event;
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredLogs]);

  // Per-product volume
  const productVolume = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach(l => {
      const app = l.source_app || 'Other';
      counts[app] = (counts[app] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredLogs]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Time range filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Communication Analytics</span>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Events</p>
            <p className="text-xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <p className="text-xs text-muted-foreground">Delivered</p>
            </div>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.delivered}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-destructive" />
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
            <p className="text-xl font-bold text-destructive">{stats.failed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3 text-blue-500" />
              <p className="text-xs text-muted-foreground">Received</p>
            </div>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.received}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-primary" />
              <p className="text-xs text-muted-foreground">Delivery Rate</p>
            </div>
            <p className="text-xl font-bold text-foreground">{stats.rate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Volume over time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-foreground">Volume Over Time (by Product)</CardTitle>
          </CardHeader>
          <CardContent>
            {volumeOverTime.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={volumeOverTime.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      color: 'hsl(var(--foreground))',
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {volumeOverTime.apps.map((app, i) => (
                    <Bar key={app} dataKey={app} stackId="a" fill={PIE_COLORS[i % PIE_COLORS.length]} radius={i === volumeOverTime.apps.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">No data for this period</div>
            )}
          </CardContent>
        </Card>

        {/* Channel breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-foreground">Channel Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {channelBreakdown.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={channelBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {channelBreakdown.map((entry, i) => (
                        <Cell key={entry.name} fill={CHANNEL_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        color: 'hsl(var(--foreground))',
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {channelBreakdown.map((ch, i) => (
                    <div key={ch.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: CHANNEL_COLORS[ch.name] || PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-xs text-foreground capitalize">{ch.name}</span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1">{ch.value}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Delivery status breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-foreground">Delivery Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      color: 'hsl(var(--foreground))',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {statusBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || 'hsl(var(--muted-foreground))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>

        {/* Per-product volume */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-foreground">Per-Product Communication Volume</CardTitle>
          </CardHeader>
          <CardContent>
            {productVolume.length > 0 ? (
              <div className="space-y-3">
                {productVolume.map((p, i) => {
                  const maxVal = productVolume[0]?.value || 1;
                  const pct = Math.round((p.value / maxVal) * 100);
                  return (
                    <div key={p.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.value}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
