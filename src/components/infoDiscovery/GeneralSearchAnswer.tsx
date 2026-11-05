import React, { useEffect, useState } from "react";
import { Loader2, BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Article = { title: string; text: string };

/** Searches a general open encyclopedia and returns detailed, multi-paragraph summaries. */
async function searchGeneral(query: string, signal: AbortSignal): Promise<Article[]> {
  const params = new URLSearchParams({
    action: "query", format: "json", origin: "*", generator: "search", gsrsearch: query,
    gsrlimit: "3", prop: "extracts", explaintext: "1", exsectionformat: "plain", exchars: "2400",
  });
  const res = await fetch("https://en.wikipedia.org/w/api.php?" + params.toString(), { signal });
  if (!res.ok) throw new Error("Search service returned an error (" + res.status + ").");
  const json = await res.json();
  const pages = Object.values(json?.query?.pages || {}) as any[];
  return pages
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map(p => ({ title: String(p.title), text: String(p.extract || "").trim() }))
    .filter(a => a.text.length > 0);
}

export function GeneralSearchAnswer({ query, onClose }: { query: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setArticles([]);
    searchGeneral(query, controller.signal)
      .then(list => { setArticles(list); if (!list.length) setError("No detailed information was found. Try different words."); })
      .catch(err => { if (err?.name !== "AbortError") setError(err?.message || "Search could not be completed."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [query]);

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Search results</p>
          <h2 className="mt-1 text-xl font-semibold md:text-2xl">“{query}”</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close results"><X className="h-4 w-4" /></Button>
      </div>
      {loading && <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Gathering information…</div>}
      {error && !loading && <p className="mt-6 text-sm text-muted-foreground">{error}</p>}
      <div className="mt-5 space-y-6">
        {articles.map((a, i) => (
          <article key={a.title} className={i ? "border-t border-border pt-6" : ""}>
            <h3 className="flex items-center gap-2 text-lg font-semibold"><BookOpen className="h-4 w-4 text-accent" />{a.title}</h3>
            <div className="mt-3 space-y-3 text-sm leading-7 text-foreground/85">
              {a.text.split(/\n+/).filter(Boolean).map((para, j) => <p key={j}>{para}</p>)}
            </div>
          </article>
        ))}
      </div>
      {articles.length > 0 && <p className="mt-6 text-[11px] text-muted-foreground">Source: Wikipedia (open encyclopedia). Verify important details with the responsible authority.</p>}
    </section>
  );
}
