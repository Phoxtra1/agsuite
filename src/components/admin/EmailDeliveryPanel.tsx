import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, Mail, CheckCircle, AlertTriangle, XCircle, Send } from "lucide-react";

interface DeliveryLog {
  id: string;
  recipient: string;
  subject: string | null;
  channel: string;
  event: string;
  delivery_status: string;
  brevo_message_id: string | null;
  source_app: string | null;
  created_at: string;
}

interface DeliveryStats {
  sent: number;
  delivered: number;
  opened: number;
  bounced: number;
  failed: number;
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  sent: { icon: <Send className="h-3 w-3" />, label: "Sent", variant: "secondary" },
  delivered: { icon: <CheckCircle className="h-3 w-3" />, label: "Delivered", variant: "default" },
  opened: { icon: <Mail className="h-3 w-3" />, label: "Opened", variant: "default" },
  bounced: { icon: <AlertTriangle className="h-3 w-3" />, label: "Bounced", variant: "destructive" },
  failed: { icon: <XCircle className="h-3 w-3" />, label: "Failed", variant: "destructive" },
};

export function EmailDeliveryPanel() {
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [stats, setStats] = useState<DeliveryStats>({ sent: 0, delivered: 0, opened: 0, bounced: 0, failed: 0 });
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("coms_logs")
      .select("id, recipient, subject, channel, event, delivery_status, brevo_message_id, source_app, created_at")
      .eq("channel", "email")
      .order("created_at", { ascending: false })
      .limit(100);

    const rows = (data || []) as DeliveryLog[];
    setLogs(rows);

    const s: DeliveryStats = { sent: 0, delivered: 0, opened: 0, bounced: 0, failed: 0 };
    for (const r of rows) {
      const status = r.delivery_status || "sent";
      if (status in s) s[status as keyof DeliveryStats]++;
    }
    setStats(s);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Email Delivery Diagnostics</h3>
          <p className="text-sm text-muted-foreground">Track email delivery status across all systems</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(Object.entries(stats) as [keyof DeliveryStats, number][]).map(([key, val]) => {
          const cfg = STATUS_CONFIG[key];
          return (
            <Card key={key}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="text-muted-foreground">{cfg?.icon}</div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{val}</p>
                  <p className="text-xs text-muted-foreground">{cfg?.label || key}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Logs table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recent emails ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">No email logs found</p>
          ) : (
            <div className="overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Message ID</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const cfg = STATUS_CONFIG[log.delivery_status] || STATUS_CONFIG.sent;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">{log.recipient}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">{log.subject || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant} className="gap-1 text-xs">
                            {cfg.icon} {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{log.source_app || "—"}</TableCell>
                        <TableCell className="font-mono text-xs max-w-[120px] truncate">{log.brevo_message_id || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.created_at)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
