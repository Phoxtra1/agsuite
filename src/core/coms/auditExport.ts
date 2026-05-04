// src/core/coms/auditExport.ts
// Export a ticket's full audit trail (status changes, replies, actors,
// timestamps + attachment metadata) as CSV or PDF.

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ComsSDK } from "./sdk";

export interface AuditExportTicket {
  id: string;
  subject?: string | null;
  source_app?: string | null;
  priority?: string | null;
  status?: string | null;
  created_at?: string | null;
}

interface AuditRow {
  id: string;
  ticket_id: string;
  actor_kind: string;
  actor_label: string | null;
  action: string;
  from_status: string | null;
  to_status: string | null;
  details: string | null;
  metadata: any;
  created_at: string;
}

interface AttachmentRow {
  id: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
}

async function loadAll(ticketId: string) {
  const [audit, attachments] = await Promise.all([
    ComsSDK.getTicketAudit(ticketId) as Promise<AuditRow[]>,
    ComsSDK.getTicketAttachments(ticketId) as Promise<AttachmentRow[]>,
  ]);
  return { audit, attachments };
}

function safeFilename(s: string) {
  return (s || "ticket").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function exportAuditCSV(ticket: AuditExportTicket) {
  const { audit, attachments } = await loadAll(ticket.id);

  const lines: string[] = [];
  lines.push(`# Ticket Audit Export`);
  lines.push(`# ticket_id,${csvEscape(ticket.id)}`);
  lines.push(`# subject,${csvEscape(ticket.subject || "")}`);
  lines.push(`# source_app,${csvEscape(ticket.source_app || "")}`);
  lines.push(`# priority,${csvEscape(ticket.priority || "")}`);
  lines.push(`# status,${csvEscape(ticket.status || "")}`);
  lines.push(`# created_at,${csvEscape(ticket.created_at || "")}`);
  lines.push(`# exported_at,${csvEscape(new Date().toISOString())}`);
  lines.push("");
  lines.push("section,timestamp,action,actor_kind,actor,from_status,to_status,details,metadata");
  for (const r of audit) {
    lines.push([
      "audit",
      r.created_at,
      r.action,
      r.actor_kind,
      r.actor_label || "",
      r.from_status || "",
      r.to_status || "",
      r.details || "",
      r.metadata ? JSON.stringify(r.metadata) : "",
    ].map(csvEscape).join(","));
  }
  lines.push("");
  lines.push("section,uploaded_at,file_name,mime_type,size_bytes,uploaded_by");
  for (const a of attachments) {
    lines.push([
      "attachment",
      a.created_at,
      a.file_name,
      a.mime_type || "",
      a.size_bytes ?? "",
      a.uploaded_by || "",
    ].map(csvEscape).join(","));
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `audit-${safeFilename(ticket.subject || ticket.id)}.csv`);
}

export async function exportAuditPDF(ticket: AuditExportTicket) {
  const { audit, attachments } = await loadAll(ticket.id);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let y = margin;

  doc.setFontSize(16);
  doc.text("Ticket Audit Trail", margin, y);
  y += 22;

  doc.setFontSize(10);
  const meta: [string, string][] = [
    ["Ticket ID", ticket.id],
    ["Subject", ticket.subject || ""],
    ["Source app", ticket.source_app || ""],
    ["Priority", ticket.priority || ""],
    ["Status", ticket.status || ""],
    ["Created", ticket.created_at ? new Date(ticket.created_at).toLocaleString() : ""],
    ["Exported", new Date().toLocaleString()],
  ];
  for (const [k, v] of meta) {
    doc.setFont("helvetica", "bold");
    doc.text(`${k}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(v).slice(0, 110), margin + 80, y);
    y += 14;
  }
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["When", "Action", "Actor", "From → To", "Details"]],
    body: audit.map((r) => [
      new Date(r.created_at).toLocaleString(),
      r.action.replace(/_/g, " "),
      `${r.actor_label || "—"} (${r.actor_kind})`,
      r.action === "status_changed" ? `${r.from_status || "—"} → ${r.to_status || "—"}` : "",
      r.details || "",
    ]),
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: [30, 41, 59] },
    margin: { left: margin, right: margin },
  });

  const afterAudit = (doc as any).lastAutoTable?.finalY || y;
  let y2 = afterAudit + 24;
  doc.setFontSize(12);
  doc.text("Attachments", margin, y2);
  y2 += 10;

  autoTable(doc, {
    startY: y2,
    head: [["Uploaded", "File name", "Type", "Size (bytes)"]],
    body: attachments.length
      ? attachments.map((a) => [
          new Date(a.created_at).toLocaleString(),
          a.file_name,
          a.mime_type || "",
          a.size_bytes ?? "",
        ])
      : [["—", "No attachments", "", ""]],
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [30, 41, 59] },
    margin: { left: margin, right: margin },
  });

  doc.save(`audit-${safeFilename(ticket.subject || ticket.id)}.pdf`);
}
