// src/components/acs/ACSExport.tsx
import { Button } from '@/components/ui/button';
import { FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { ACSEvent } from '@/core/backend/acs';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface ACSExportProps {
  data: ACSEvent[];
  source: string;
}

export function ACSExport({ data, source }: ACSExportProps) {
  const exportData = (format: 'csv' | 'json' | 'excel') => {
    const filename = `acs-${source}-${new Date().toISOString().slice(0, 10)}`;
    const headers = ['ID', 'Source', 'Type', 'Payload', 'Created At'];
    const rows = data.map(r => [r.id, r.source, r.type, JSON.stringify(r.payload), r.created_at]);

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `${filename}.json`);
    } else if (format === 'csv') {
      const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
      downloadBlob(new Blob([csv], { type: 'text/csv' }), `${filename}.csv`);
    } else {
      const tsv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
      downloadBlob(new Blob([tsv], { type: 'application/vnd.ms-excel' }), `${filename}.xls`);
    }
    toast.success(`Exported ${data.length} records as ${format.toUpperCase()}`);
  };

  return (
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
  );
}
