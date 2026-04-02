// src/components/acs/tabs/ACSAlertsTab.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle, Shield, RefreshCw, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { acs } from '@/core/backend';

interface Alert {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  confidence: number | null;
  intelligence: Record<string, any>;
  source_platforms: string[];
  valid_until: string | null;
  created_at: string;
}

interface Props {
  currentBackend: string;
}

export function ACSAlertsTab({ currentBackend }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('acs_intelligence_outputs')
        .select('*')
        .eq('category', 'predictive_alert')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      setAlerts((data ?? []) as Alert[]);
    } catch (err) {
      console.error('Alerts load error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentBackend]);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  // Subscribe for new alerts
  useEffect(() => {
    const unsub = acs.subscribeIntelligence((output) => {
      if (output.category === 'predictive_alert') {
        setAlerts((prev) => [output as any, ...prev]);
        toast.warning(`⚠️ New Alert: ${output.title}`, { duration: 8000 });
      }
    });
    return unsub;
  }, [currentBackend]);

  const runAnomalyDetection = async () => {
    setDetecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('acs-intelligence', {
        body: { action: 'detect_anomalies', timeframe_hours: 24 },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        const count = data?.anomalies?.length ?? 0;
        toast.success(`Scan complete: ${count} anomalies found (risk: ${data?.risk_score ?? 0}/100)`);
        loadAlerts();
      }
    } catch (err: any) {
      toast.error('Detection failed: ' + (err.message ?? 'Unknown'));
    } finally {
      setDetecting(false);
    }
  };

  const activeAlerts = alerts.filter((a) => !a.valid_until || new Date(a.valid_until) > new Date());
  const expiredAlerts = alerts.filter((a) => a.valid_until && new Date(a.valid_until) <= new Date());

  const severityIcon = (intel: Record<string, any>) => {
    const score = intel?.risk_score ?? (intel?.anomalies?.some((a: any) => a.severity === 'critical') ? 90 : 50);
    if (score >= 75) return <AlertTriangle className="h-5 w-5 text-destructive" />;
    if (score >= 50) return <Shield className="h-5 w-5 text-yellow-500" />;
    return <Bell className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{activeAlerts.length}</p>
              <p className="text-sm text-muted-foreground">Active Alerts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold text-foreground">{alerts.length}</p>
              <p className="text-sm text-muted-foreground">Total Alerts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Button onClick={runAnomalyDetection} disabled={detecting} className="w-full gap-2">
              <Zap className={`h-4 w-4 ${detecting ? 'animate-pulse' : ''}`} />
              {detecting ? 'Scanning…' : 'Run Anomaly Scan'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Active Alerts</h3>
        <Button variant="ghost" size="sm" onClick={loadAlerts} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {activeAlerts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Shield className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-foreground font-medium">All Clear</p>
            <p className="text-muted-foreground text-sm">No active alerts. Run an anomaly scan to check your data.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeAlerts.map((alert) => {
            const intel = alert.intelligence;
            const anomalies = intel?.anomalies as any[] ?? [];
            return (
              <Card key={alert.id} className="border-l-4 border-l-destructive">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    {severityIcon(intel)}
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{alert.title}</h4>
                      {alert.summary && <p className="text-sm text-muted-foreground mt-1">{alert.summary}</p>}

                      {anomalies.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {anomalies.slice(0, 5).map((a: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <Badge variant={a.severity === 'critical' ? 'destructive' : a.severity === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                                {a.severity}
                              </Badge>
                              <span className="text-foreground">{a.description}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3">
                        {alert.source_platforms?.map((p) => (
                          <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                        ))}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(alert.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {expiredAlerts.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-muted-foreground">Resolved Alerts ({expiredAlerts.length})</h3>
          <div className="space-y-2 opacity-60">
            {expiredAlerts.slice(0, 5).map((alert) => (
              <Card key={alert.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{alert.title}</span>
                  <span className="text-xs text-muted-foreground">{new Date(alert.created_at).toLocaleDateString()}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
