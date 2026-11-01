import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { importFile, IMPORT_ACCEPT, type ImportKind } from "@/lib/workspace/importers";

const HINT: Record<ImportKind, string> = {
  docs: "Text, Markdown, HTML or JSON",
  sheets: "Excel, CSV, TSV, ODS or JSON",
  slides: "Text/Markdown (each heading becomes a slide) or JSON",
  forms: "CSV/text (one question per line; \"Question, A|B|C\" for choices) or JSON",
};

export default function ImportButton({ kind }: { kind: ImportKind }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const id = await importFile(kind, file);
      toast({ title: "Imported", description: file.name });
      navigate(`/workspace/${kind}/${id}`);
    } catch (err: any) {
      toast({ title: "Import failed", description: err?.message ?? "Unsupported file", variant: "destructive" });
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <>
      <input ref={ref} type="file" accept={IMPORT_ACCEPT[kind]} className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <button
        type="button"
        title={HINT[kind]}
        disabled={busy}
        onClick={() => ref.current?.click()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-foreground font-medium hover:bg-muted disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import
      </button>
    </>
  );
}
