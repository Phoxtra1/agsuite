import { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  FileSpreadsheet,
  Check,
  Plus,
  Trash2,
  Settings,
  TrendingUp,
  FileText,
  Clock,
  Brain,
  Layers,
  ArrowRight,
  Database
} from "lucide-react";
import { getSheetHeaders, analyzeSheetDataForCustomSolution, type ColumnType } from "@/lib/workspace/sheets/smartData";
import { type SheetPage } from "@/lib/workspace/sheets/documents";

interface CustomSolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSheet: SheetPage;
  onGenerate: (config: any) => void;
}

export default function CustomSolutionModal({
  isOpen,
  onClose,
  activeSheet,
  onGenerate
}: CustomSolutionModalProps) {
  const [objective, setObjective] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [step, setStep] = useState<"input" | "review">("input");

  // Custom generated solution configs
  const [solutionName, setSolutionName] = useState("");
  const [solutionType, setSolutionType] = useState("operations");
  const [headers, setHeaders] = useState<string[]>([]);
  const [forms, setForms] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [charts, setCharts] = useState<any[]>([]);
  const [automations, setAutomations] = useState<any[]>([]);
  const [statusCol, setStatusCol] = useState("");
  const [dateCol, setDateCol] = useState("");
  const [primaryCol, setPrimaryCol] = useState("");
  const [newHeader, setNewHeader] = useState("");

  const existingHeaders = getSheetHeaders(activeSheet).filter(Boolean);

  useEffect(() => {
    if (isOpen) {
      setObjective("");
      setIsAnalyzing(false);

      // Perform automatic intelligent pre-analysis of existing spreadsheet columns
      if (existingHeaders.length > 0) {
        setIsAnalyzing(true);
        setStep("input");
        setTimeout(() => {
          const suggested = analyzeSheetDataForCustomSolution(activeSheet);
          setSolutionName(suggested.solutionName);
          setSolutionType(suggested.solutionType);
          setHeaders(suggested.headers);
          setForms(suggested.forms);
          setMetrics(suggested.metrics);
          setCharts(suggested.charts);
          setAutomations(suggested.automations);
          setStatusCol(suggested.statusCol || "");
          setDateCol(suggested.dateCol || "");
          setPrimaryCol(suggested.primaryCol || "");

          setStep("review");
          setIsAnalyzing(false);
        }, 1000);
      } else {
        setStep("input");
      }
    }
  }, [isOpen, activeSheet]);

  if (!isOpen) return null;

  // Handle preset objective click
  const selectPreset = (type: string) => {
    let obj = "";
    if (type === "accounting") {
      obj = "Accounting System to manage ledger transactions, income, expense, and amount statistics.";
    } else if (type === "financial_statements") {
      obj = "Financial reporting system to track balance sheet items, assets, liabilities, and period reviews.";
    } else if (type === "audit") {
      obj = "Audit checklist registry with risk classification levels, audit statuses, and findings.";
    } else if (type === "compliance") {
      obj = "Regulatory compliance tracker showing requirements, compliance status, and responsible person.";
    } else if (type === "operations") {
      obj = "General operations workspace to map project tasks, membership status, and actions.";
    }
    setObjective(obj);
    triggerAnalysis(type, obj);
  };

  const triggerAnalysis = (presetType: string, customObj: string) => {
    setIsAnalyzing(true);
    // Simulate dynamic AI analyzer compiling configurations based on described objective
    setTimeout(() => {
      // Temporarily construct a mock sheet representing the user's starter model columns
      const tempSheet: SheetPage = {
        name: "Custom",
        cells: {}
      };

      const query = (customObj || objective).toLowerCase();
      let cols: string[] = [];

      if (presetType === "accounting" || query.includes("account") || query.includes("expense") || query.includes("income") || query.includes("financial")) {
        cols = ["Date", "Account Name", "Account Category", "Type", "Amount ($)", "Notes", "Status"];
      } else if (presetType === "audit" || query.includes("audit") || query.includes("finding") || query.includes("checklist")) {
        cols = ["Audit ID", "Area / Process", "Auditor", "Schedule Date", "Status", "Findings", "Risk Classification", "Corrective Action"];
      } else if (presetType === "compliance" || query.includes("compliance") || query.includes("regulation") || query.includes("policy")) {
        cols = ["Regulation", "Requirement", "Section", "Compliance Status", "Responsible Person", "Review Date", "Next Renewal Date"];
      } else {
        cols = ["Record ID", "Title", "Category", "Status", "Owner", "Date Created", "Value ($)"];
      }

      // Write mock headers to temp sheet so analyzer profiles them correctly
      cols.forEach((c, idx) => {
        tempSheet.cells[`0,${idx}`] = c;
      });

      const suggested = analyzeSheetDataForCustomSolution(tempSheet);

      setSolutionName(suggested.solutionName);
      setSolutionType(suggested.solutionType);
      setHeaders(suggested.headers);
      setForms(suggested.forms);
      setMetrics(suggested.metrics);
      setCharts(suggested.charts);
      setAutomations(suggested.automations);
      setStatusCol(suggested.statusCol || "");
      setDateCol(suggested.dateCol || "");
      setPrimaryCol(suggested.primaryCol || "");

      setStep("review");
      setIsAnalyzing(false);
    }, 1200);
  };

  const handleAddHeader = () => {
    if (newHeader.trim() && !headers.includes(newHeader.trim())) {
      setHeaders([...headers, newHeader.trim()]);
      setForms([...forms, newHeader.trim()]);
      setNewHeader("");
    }
  };

  const handleRemoveHeader = (h: string) => {
    setHeaders(headers.filter((x) => x !== h));
    setForms(forms.filter((x) => x !== h));
  };

  const handleAddChart = () => {
    setCharts([...charts, { title: "Custom Metric Grouping", type: "bar", xKey: headers[0] || "", yKey: headers[1] || "" }]);
  };

  const handleRemoveChart = (idx: number) => {
    setCharts(charts.filter((_, i) => i !== idx));
  };

  const handleAddMetric = () => {
    setMetrics([...metrics, { label: "Custom Metric", formula: "COUNT", column: headers[0] || "" }]);
  };

  const handleRemoveMetric = (idx: number) => {
    setMetrics(metrics.filter((_, i) => i !== idx));
  };

  const handleAddAutomation = () => {
    setAutomations([...automations, { trigger: "On Status Change", action: "Log Audit Event", enabled: true }]);
  };

  const handleRemoveAutomation = (idx: number) => {
    setAutomations(automations.filter((_, i) => i !== idx));
  };

  const handleConfirmGenerate = () => {
    onGenerate({
      solutionName,
      solutionType,
      headers,
      forms,
      metrics,
      charts,
      automations,
      statusCol,
      dateCol,
      primaryCol
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-card rounded-xl border border-border shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-in fade-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-accent animate-pulse" />
            <div>
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                Custom Solution Builder <span className="text-[10px] bg-accent/15 text-accent font-extrabold px-1.5 py-0.5 rounded uppercase">Odeneho AI</span>
              </h3>
              <p className="text-[11px] text-muted-foreground">Real-time spreadsheet structure analysis & system compiler</p>
            </div>
          </div>
          <button onClick={onClose} className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === "input" ? (
            <div className="space-y-6 max-w-xl mx-auto py-4">
              <div className="text-center space-y-2">
                <div className="mx-auto h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-accent animate-spin-slow" />
                </div>
                <h4 className="text-sm font-bold text-foreground">Intelligent Sheet Pre-Scanner Active</h4>
                <p className="text-xs text-muted-foreground">
                  Odeneho AI scans columns and row data structures to extract custom status fields, dates, and currency values. Enter your system objectives below.
                </p>
              </div>

              {existingHeaders.length > 0 ? (
                <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-[11px] text-emerald-800 flex items-center gap-2">
                  <Database className="h-4.5 w-4.5 text-emerald-600 animate-pulse flex-shrink-0" />
                  <span>
                    <strong>Dynamic Scan in Progress:</strong> Scanned {existingHeaders.length} headers. Automatically formulating your database relations, charts, and record sync bridges...
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/50 text-[11px] text-amber-800 flex items-center gap-2">
                  <FileSpreadsheet className="h-4.5 w-4.5 text-amber-600 flex-shrink-0" />
                  <span>
                    <strong>Empty spreadsheet template:</strong> Odeneho will seed lightweight starters tailored to your chosen objective.
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Workflow description / Objective</label>
                <textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="e.g. Compliance checklist monitor with policy regulations, compliance status levels, renewal triggers, and audits feed..."
                  rows={4}
                  className="w-full text-xs p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Standard presets</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "accounting", label: "Accounting Management", desc: "Transactions ledger, debits/credits, amounts & summaries" },
                    { id: "financial_statements", label: "Financial Statement Preparation", desc: "Balance sheet, income statements & cash flows Period trackers" },
                    { id: "audit", label: "Audit & Findings Register", desc: "Risk classification checklists, auditor names & findings tracker" },
                    { id: "compliance", label: "Compliance & Regulations", desc: "Regulatory policies, requirements review & compliance statuses" }
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => selectPreset(preset.id)}
                      disabled={isAnalyzing}
                      className="text-left p-3 rounded-lg border border-border hover:border-accent bg-card hover:bg-accent/5 transition flex flex-col justify-between h-20 disabled:opacity-50"
                    >
                      <span className="font-bold text-xs text-foreground block">{preset.label}</span>
                      <span className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{preset.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => triggerAnalysis("custom", objective)}
                  disabled={isAnalyzing || !objective.trim()}
                  className="px-5 py-2.5 bg-accent text-accent-foreground font-bold rounded-lg text-xs hover:bg-accent/90 flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                      <span>Odeneho AI scanner compiling system...</span>
                    </>
                  ) : (
                    <>
                      <span>Construct Connected Solution</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Review Step */
            <div className="space-y-6 text-xs">
              <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-foreground text-sm">Pre-Analysis Suggested Schema & Architecture</h4>
                  <p className="text-xs text-muted-foreground">Spreadsheet-first, data-driven parameters detected. Modify anything before deploying.</p>
                </div>
                {existingHeaders.length === 0 && (
                  <button onClick={() => setStep("input")} className="text-accent hover:underline font-bold">
                    ← Edit Objective
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Left Side: General Info & Columns */}
                <div className="space-y-4">
                  <div className="bg-muted/30 border border-border p-4 rounded-xl space-y-3">
                    <h5 className="font-bold text-foreground flex items-center gap-1.5">
                      <Settings className="h-4 w-4 text-muted-foreground" /> Solution Settings
                    </h5>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Solution Name</label>
                      <input
                        type="text"
                        value={solutionName}
                        onChange={(e) => setSolutionName(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Framework Mode</label>
                      <select
                        value={solutionType}
                        onChange={(e) => setSolutionType(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:outline-none"
                      >
                        <option value="accounting">Accounting Management</option>
                        <option value="financial_statements">Financial Statements</option>
                        <option value="audit">Audit Management</option>
                        <option value="compliance">Compliance Management</option>
                        <option value="operations">Business Operations Solutions</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-muted/30 border border-border p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-foreground flex items-center gap-1.5">
                        <Layers className="h-4 w-4 text-muted-foreground" /> Columns Mapped (Sheet Grid Row 1)
                      </h5>
                      <span className="text-[10px] text-muted-foreground font-semibold bg-background px-2 py-0.5 rounded-full border">
                        {headers.length} Fields
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="New field name..."
                        value={newHeader}
                        onChange={(e) => setNewHeader(e.target.value)}
                        className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background focus:outline-none"
                      />
                      <button
                        onClick={handleAddHeader}
                        className="bg-accent text-accent-foreground p-1.5 rounded-lg hover:bg-accent/90"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1">
                      {headers.map((h, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-background border border-border">
                          <span className="font-medium text-foreground truncate max-w-[180px]">{h}</span>
                          <button onClick={() => handleRemoveHeader(h)} className="text-rose-500 hover:bg-rose-50 p-1 rounded transition">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side: Charts & Metrics */}
                <div className="space-y-4">
                  <div className="bg-muted/30 border border-border p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-foreground flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" /> KPI Cards (Computed from data)
                      </h5>
                      <button onClick={handleAddMetric} className="text-accent hover:underline font-bold text-[10px] flex items-center gap-0.5">
                        <Plus className="h-3 w-3" /> Add Metric
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                      {metrics.map((m, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-background border border-border space-y-1.5">
                          <div className="flex items-center justify-between">
                            <input
                              type="text"
                              value={m.label}
                              onChange={(e) => {
                                const next = [...metrics];
                                next[idx].label = e.target.value;
                                setMetrics(next);
                              }}
                              className="font-bold text-foreground bg-transparent border-none outline-none w-2/3 focus:ring-1 focus:ring-accent rounded px-1"
                            />
                            <button onClick={() => handleRemoveMetric(idx)} className="text-rose-500 p-0.5 hover:bg-rose-50 rounded">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <select
                              value={m.formula}
                              onChange={(e) => {
                                const next = [...metrics];
                                next[idx].formula = e.target.value;
                                setMetrics(next);
                              }}
                              className="p-1 border border-border rounded bg-background"
                            >
                              <option value="COUNT">COUNT</option>
                              <option value="SUM">SUM</option>
                              <option value="AVG">AVERAGE</option>
                            </select>
                            <select
                              value={m.column}
                              onChange={(e) => {
                                const next = [...metrics];
                                next[idx].column = e.target.value;
                                setMetrics(next);
                              }}
                              className="p-1 border border-border rounded bg-background"
                            >
                              {headers.map((h, i) => (
                                <option key={i} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-muted/30 border border-border p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-foreground flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" /> Analytics Charts
                      </h5>
                      <button onClick={handleAddChart} className="text-accent hover:underline font-bold text-[10px] flex items-center gap-0.5">
                        <Plus className="h-3 w-3" /> Add Chart
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                      {charts.map((c, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-background border border-border space-y-1.5">
                          <div className="flex items-center justify-between">
                            <input
                              type="text"
                              value={c.title}
                              onChange={(e) => {
                                const next = [...charts];
                                next[idx].title = e.target.value;
                                setCharts(next);
                              }}
                              className="font-bold text-foreground bg-transparent border-none outline-none w-2/3 focus:ring-1 focus:ring-accent rounded px-1"
                            />
                            <button onClick={() => handleRemoveChart(idx)} className="text-rose-500 p-0.5 hover:bg-rose-50 rounded">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[10px]">
                            <select
                              value={c.type}
                              onChange={(e) => {
                                const next = [...charts];
                                next[idx].type = e.target.value;
                                setCharts(next);
                              }}
                              className="p-1 border border-border rounded bg-background"
                            >
                              <option value="bar">Bar Chart</option>
                              <option value="pie">Pie Chart</option>
                              <option value="line">Line Chart</option>
                            </select>
                            <select
                              value={c.xKey}
                              onChange={(e) => {
                                const next = [...charts];
                                next[idx].xKey = e.target.value;
                                setCharts(next);
                              }}
                              className="p-1 border border-border rounded bg-background"
                            >
                              {headers.map((h, i) => (
                                <option key={i} value={h}>{h}</option>
                              ))}
                            </select>
                            <select
                              value={c.yKey}
                              onChange={(e) => {
                                const next = [...charts];
                                next[idx].yKey = e.target.value;
                                setCharts(next);
                              }}
                              className="p-1 border border-border rounded bg-background"
                            >
                              {headers.map((h, i) => (
                                <option key={i} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-muted/30 border border-border p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-foreground flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-muted-foreground" /> Alert Automation Rules
                      </h5>
                      <button onClick={handleAddAutomation} className="text-accent hover:underline font-bold text-[10px] flex items-center gap-0.5">
                        <Plus className="h-3 w-3" /> Add Rule
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {automations.map((a, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-background border border-border flex items-start gap-2 justify-between">
                          <div className="space-y-1 flex-1">
                            <input
                              type="text"
                              value={a.trigger}
                              onChange={(e) => {
                                const next = [...automations];
                                next[idx].trigger = e.target.value;
                                setAutomations(next);
                              }}
                              className="font-bold text-foreground bg-transparent border-none outline-none w-full focus:ring-1 focus:ring-accent rounded px-1"
                              placeholder="Trigger"
                            />
                            <input
                              type="text"
                              value={a.action}
                              onChange={(e) => {
                                const next = [...automations];
                                next[idx].action = e.target.value;
                                setAutomations(next);
                              }}
                              className="text-[10px] text-muted-foreground bg-transparent border-none outline-none w-full focus:ring-1 focus:ring-accent rounded px-1"
                              placeholder="Action"
                            />
                          </div>
                          <button onClick={() => handleRemoveAutomation(idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border mt-6">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500" /> Connecting dynamically with zero-delay sync.
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (existingHeaders.length > 0) {
                        onClose();
                      } else {
                        setStep("input");
                      }
                    }}
                    className="px-4 py-2 border border-border rounded-lg font-bold text-muted-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmGenerate}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md flex items-center gap-1.5 animate-pulse"
                  >
                    <Sparkles className="h-4 w-4" /> Deploy Custom System
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
