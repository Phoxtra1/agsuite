// src/components/acs/ACSEventTable.tsx
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ACSStatusBadge } from './ACSStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import type { ACSEvent } from '@/core/backend/acs';

interface ACSEventTableProps {
  events: ACSEvent[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  loading: boolean;
}

export function ACSEventTable({ events, totalCount, page, pageSize, onPageChange, loading }: ACSEventTableProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Payload</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No events recorded yet. Events from connected products will appear here in real-time.
                </TableCell>
              </TableRow>
            ) : (
              events.map(event => (
                <TableRow key={event.id}>
                  <TableCell>
                    <ACSStatusBadge status={event.source} />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{event.type}</TableCell>
                  <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground font-mono">
                    {JSON.stringify(event.payload)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalCount > 0 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-foreground">Page {page + 1} / {totalPages || 1}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
