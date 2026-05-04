// src/components/coms/tickets/TicketAuditDrawer.tsx
// Renders the full audit trail for a single ticket — every status change,
// reply, attachment, and creation event with timestamp and actor.

import React, { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ComsSDK } from "@/core/coms/sdk";
import { exportAuditCSV, exportAuditPDF, type AuditExportTicket } from "@/core/coms/auditExport";
import { toast } from "sonner";
import {
  History, Reply, CircleDot, ArrowRight, Paperclip, FilePlus2, User, Bot, Server,
  FileDown, FileText,
} from "lucide-react";

interface AuditRow {
  id: string;
  ticket_id: string;
  actor_user_id: string | null;
  actor_kind: string;
  actor_label: string | null;
  action: string;
  from_status: string | null;
  to_status: string | null;
  details: string | null;
  metadata: any;
  created_at: string;
}

const actorIcon = (kind: string) =>
  kind === "app" ? <Bot className="h-3 w-3" /> :
  kind === "system" ? <Server className="h-3 w-3" /> :
  <User className="h-3 w-3" />;

const actionIcon = (action: string) =>
  action === "created" ? <FilePlus2 className="h-4 w-4 text-primary" /> :
  action === "replied" ? <Reply className="h-4 w-4 text-emerald-500" /> :
  action === "status_changed" ? <ArrowRight className="h-4 w-4 text-blue-500" /> :
  action === "attachment_added" ? <Paperclip className="h-4 w-4 text-muted-foreground" /> :
  <CircleDot className="h-4 w-4 text-muted-foreground" />;

export function TicketAuditDrawer({
  ticketId,
  ticketSubject,
  open,
  onOpenChange,
}: {
  ticketId: string | null;
  ticketSubject?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !ticketId) return;
    let alive = true;
    setLoading(true);
    ComsSDK.getTicketAudit(ticketId)
      .then((data) => { if (alive) setRows(data as AuditRow[]); })
      .finally(() => { if (alive) setLoading(false); });

    const unsub = ComsSDK.subscribeToTicketAudit(ticketId, (row: AuditRow) => {
      setRows((prev) => [row, ...prev.filter((r) => r.id !== row.id)]);
    });
    return () => { alive = false; unsub(); };
  }, [open, ticketId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md w-full">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <History className="h-4 w-4" /> Audit Trail
          </SheetTitle>
          {ticketSubject && (
            <p className="text-xs text-muted-foreground truncate">{ticketSubject}</p>
          )}
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-3">
          {loading ? (
            <div className="text-sm text-muted-foreground p-4">Loading audit trail...</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4">No audit entries yet.</div>
          ) : (
            <ol className="relative border-l border-border ml-3 space-y-4">
              {rows.map((r) => (
                <li key={r.id} className="ml-4">
                  <div className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full bg-background border-2 border-primary" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {actionIcon(r.action)}
                    <span className="font-medium text-foreground capitalize">{r.action.replace("_", " ")}</span>
                    <span>·</span>
                    <span>{new Date(r.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="gap-1 text-[10px] h-5">
                      {actorIcon(r.actor_kind)}
                      {r.actor_label || (r.actor_kind === "system" ? "System" : "Unknown")}
                    </Badge>
                    {r.action === "status_changed" && (
                      <Badge variant="outline" className="text-[10px] h-5">
                        {r.from_status || "—"} → {r.to_status || "—"}
                      </Badge>
                    )}
                    {r.metadata?.attachments > 0 && (
                      <Badge variant="outline" className="gap-1 text-[10px] h-5">
                        <Paperclip className="h-3 w-3" /> {r.metadata.attachments}
                      </Badge>
                    )}
                  </div>
                  {r.details && (
                    <p className="text-xs text-muted-foreground mt-1">{r.details}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
