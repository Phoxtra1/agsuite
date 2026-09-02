// src/components/acs/tabs/ACSIntelligenceTab.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Sparkles, RefreshCw, TrendingUp, AlertTriangle, Lightbulb, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { acs } from '@/core/backend';
import type { ACSIntelligenceOutput } from '@/core/backend/acs';
import { supabase } from '@/integrations/supabase/client';
import { notifyIntelligenceOutput } from '@/core/acs/notifications';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'financial', label: 'Financial Intelligence' },
  { value: 'market_commodity', label: 'Market & Commodity' },
  { value: 'agro_climate', label: 'Agro-Climate' },
  { value: 'predictive_alert', label: 'Predictive Alerts' },
  { value: 'anomaly', label: 'Anomaly Detection' },
  { value: 'operational', label: 'Operational' },
  { value: 'pattern', label: 'Pattern Recognition' },
];

const PLATFORMS = [
  { value: 'all', label: 'All Platforms' },
  { value: 'agroclimate', label: 'AgroClimate' },
  { value: 'agstock', label: 'Nyansa' },
  { value: 'agis', label: 'DataLens' },
  { value: 'aminevaops', label: 'Sikasɛm' },
  { value: 'Dipa', label: 'Dipa' },
];

interface Props {
  currentBackend: string;
}

export function ACSIntelligenceTab({ currentBackend }: Props) {
  const [category, setCategory] = useState('all');
  const [platform, setPlatform] = useState('all');
  const [outputs, setOutputs] = useState<ACSIntelligenceOutput[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, count } = await acs.fetchIntelligence({
        category: category !== 'all' ? category : undefined,
        limit: 20,
      });
      setOutputs(data);
      setTotalCount(count);
    } catch (err) {
      console.error('Intelligence load error:', err);
    } finally {
      setLoading(false);
    }
  }, [category, currentBackend]);

  useEffect(() => { load(); }, [load]);

  // Subscribe to new intelligence
  useEffect(() => {
    const unsub = acs.subscribeIntelligence((output) => {
      setOutputs((prev) => [output, ...prev].slice(0, 20));
      setTotalCount((c) => c + 1);
      toast.success(`New intelligence: ${output.title}`, { duration: 5000 });
      // Push real-time notification to users via ComsSDK
      notifyIntelligenceOutput(output);
    });
    return unsub;
  }, [currentBackend]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('acs-intelligence', {
        body: {
          action: 'analyze',
          platform: platform !== 'all' ? platform : undefined,
          category: category !== 'all' ? category : 'operational',
          limit: 50,
        },
      });
      if (error) throw error;
      if (data?.error) {
        if (data.error.includes('No raw data')) {
          toast.error('No raw data available. Ingest data first via the ACS API.');
        } else {
          toast.error(data.error);
        }
      } else {
        toast.success('AI analysis complete!');
        load();
      }
    } catch (err: any) {
      toast.error('Analysis failed: ' + (err.message ?? 'Unknown'));
    } finally {
      setAnalyzing(false);
    }
  };

  const generateReport = async () => {
    setGeneratingReport(true);
    setReport(null);
    try {
      const { data, error } = await supabase.functions.invoke('acs-intelligence', {
        body: {
          action: 'report',
          category: category !== 'all' ? category : undefined,
          platform: platform !== 'all' ? platform : undefined,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        setReport(data.report);
        toast.success('Report generated!');
      }
    } catch (err: any) {
      toast.error('Report generation failed');
    } finally {
      setGeneratingReport(false);
    }
  };

  const confidenceColor = (c: number | null) => {
    if (!c) return 'text-muted-foreground';
    if (c >= 0.8) return 'text-green-500';
    if (c >= 0.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{totalCount}</p>
              <p className="text-sm text-muted-foreground">Intelligence Outputs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">AI-Powered</p>
              <p className="text-sm text-muted-foreground">Lovable AI Processing Engine</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLATFORMS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={runAnalysis} disabled={analyzing} className="gap-2">
          <Brain className={`h-4 w-4 ${analyzing ? 'animate-pulse' : ''}`} />
          {analyzing ? 'Analyzing…' : 'Run AI Analysis'}
        </Button>
        <Button variant="outline" onClick={generateReport} disabled={generatingReport} className="gap-2">
          <FileText className={`h-4 w-4 ${generatingReport ? 'animate-pulse' : ''}`} />
          {generatingReport ? 'Generating…' : 'Generate Report'}
        </Button>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* AI Report */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> AI Intelligence Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground">
              {report}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Intelligence Outputs */}
      <div className="space-y-3">
        {outputs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No intelligence outputs yet. Run an AI analysis to generate insights from your data.</p>
            </CardContent>
          </Card>
        ) : (
          outputs.map((output) => {
            const intel = output.intelligence as Record<string, any>;
            return (
              <Card key={output.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{output.title}</h3>
                      {output.summary && <p className="text-sm text-muted-foreground mt-1">{output.summary}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{output.category}</Badge>
                      {output.confidence != null && (
                        <span className={`text-sm font-medium ${confidenceColor(output.confidence)}`}>
                          {Math.round(output.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Patterns */}
                  {intel?.patterns?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Patterns
                      </p>
                      <div className="space-y-1">
                        {intel.patterns.slice(0, 3).map((p: any, i: number) => (
                          <p key={i} className="text-sm text-foreground">• {p.description}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Anomalies */}
                  {intel?.anomalies?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Anomalies
                      </p>
                      <div className="space-y-1">
                        {intel.anomalies.slice(0, 3).map((a: any, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <Badge variant={a.severity === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                              {a.severity}
                            </Badge>
                            <span className="text-sm text-foreground">{a.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {intel?.recommendations?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" /> Recommendations
                      </p>
                      <div className="space-y-1">
                        {intel.recommendations.slice(0, 3).map((r: any, i: number) => (
                          <p key={i} className="text-sm text-foreground">• {r.action}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
                    {output.source_platforms?.map((p) => (
                      <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                    ))}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(output.created_at).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
