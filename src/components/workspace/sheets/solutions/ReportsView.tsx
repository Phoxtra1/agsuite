import { useState, useMemo } from "react";
import {
  FileText,
  DollarSign,
  Briefcase,
  Layers,
  Sparkles,
  TrendingUp,
  Download,
  Plus,
  Trash2,
  Calendar,
  ShieldCheck,
  Edit3,
  ArrowRight
} from "lucide-react";

interface ReportsViewProps {
  records: Record<string, any>[];
  solutionType: string;
  solutionName: string;
}

export default function ReportsView({
  records = [],
  solutionType,
  solutionName
}: ReportsViewProps) {
  const [selectedReport, setSelectedReport] = useState<string>("summary");

  // Custom keyword selectors for calculations
  const [revenueCategory, setRevenueCategory] = useState("Revenue");
  const [expenseCategory, setExpenseCategory] = useState("Expense");
  const [assetCategory, setAssetCategory] = useState("Asset");
  const [liabilityCategory, setLiabilityCategory] = useState("Liability");

  const [isEditingCategories, setIsEditingCategories] = useState(false);

  // Accounting / Financial statement calculations (completely data-driven)
  const financialTotals = useMemo(() => {
    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalAssets = 0;
    let totalLiabilities = 0;

    records.forEach((r) => {
      // Traverse all numeric values to aggregate
      const amount = Number(r["Amount ($)"] || r.Amount || r["Value ($)"] || r.Value || r.value || 0);
      const cat = String(r["Account Category"] || r.Category || r.type || r.Type || "").toLowerCase();

      if (cat.includes(revenueCategory.toLowerCase()) || cat.includes("revenue") || cat.includes("income") || cat.includes("sales") || cat.includes("credit")) {
        totalRevenue += amount;
      } else if (cat.includes(expenseCategory.toLowerCase()) || cat.includes("expense") || cat.includes("cost") || cat.includes("debit") || cat.includes("rent") || cat.includes("infrastructure")) {
        totalExpenses += amount;
      } else if (cat.includes(assetCategory.toLowerCase()) || cat.includes("asset")) {
        totalAssets += amount;
      } else if (cat.includes(liabilityCategory.toLowerCase()) || cat.includes("liability") || cat.includes("debt")) {
        totalLiabilities += amount;
      }
    });

    return {
      totalRevenue,
      totalExpenses,
      netCashFlow: totalRevenue - totalExpenses,
      totalAssets,
      totalLiabilities,
      ownerEquity: totalAssets - totalLiabilities
    };
  }, [records, revenueCategory, expenseCategory, assetCategory, liabilityCategory]);

  // Audit / Risk metrics (completely data-driven)
  const auditStats = useMemo(() => {
    let totalAudits = records.length;
    let highRisk = 0;
    let mediumRisk = 0;
    let lowRisk = 0;
    let completed = 0;
    let openFindings = 0;

    records.forEach((r) => {
      const risk = String(r["Risk Classification"] || r.Risk || r.risk || "").toLowerCase();
      const status = String(r.Status || r.status || "").toLowerCase();

      if (risk.includes("high")) highRisk++;
      else if (risk.includes("medium")) mediumRisk++;
      else if (risk.includes("low")) lowRisk++;

      if (status.includes("completed") || status.includes("done") || status.includes("cleared")) completed++;
      if (r.Findings && String(r.Findings).trim().length > 0) openFindings++;
    });

    return {
      totalAudits,
      highRisk,
      mediumRisk,
      lowRisk,
      completed,
      openFindings
    };
  }, [records]);

  // Compliance policy checks
  const complianceStats = useMemo(() => {
    let totalRequirements = records.length;
    let compliant = 0;
    let nonCompliant = 0;
    let underReview = 0;

    records.forEach((r) => {
      const status = String(r["Compliance Status"] || r.Status || r.status || "").toLowerCase();
      if (status.includes("compliant") && !status.includes("non")) compliant++;
      else if (status.includes("non")) nonCompliant++;
      else if (status.includes("review") || status.includes("pending")) underReview++;
    });

    const compliantRate = totalRequirements ? Math.round((compliant / totalRequirements) * 100) : 0;

    return {
      totalRequirements,
      compliant,
      nonCompliant,
      underReview,
      compliantRate
    };
  }, [records]);

  // General operational generic aggregator
  const operationalStats = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      // Group by first text columns e.g. Category or Status
      const key = String(r.Category || r.Status || r.status || "General");
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [records]);

  const handleExportCSV = () => {
    alert("Exporting dynamic report aggregates as CSV...");
  };

  const handleExportJSON = () => {
    const reportData = {
      reportType: selectedReport,
      solutionType,
      solutionName,
      timestamp: new Date().toISOString(),
      financialTotals,
      auditStats,
      complianceStats
    };
    alert(`Exporting dynamic report JSON: \n${JSON.stringify(reportData, null, 2)}`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-muted/20 space-y-6 text-xs">

      {/* Report Header Banner */}
      <div className="flex items-center justify-between border-b border-border pb-4 bg-card p-4 rounded-xl border shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <FileText className="h-5 w-5 text-accent animate-pulse" /> {solutionName} Intelligent Report Engine
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Dynamic data-driven ledger totals, risk breakdowns, and compliance ratios calculated in real-time.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 border border-border rounded-lg hover:bg-muted font-bold flex items-center gap-1 text-[11px]"
          >
            <Download className="h-3.5 w-3.5" /> CSV Export
          </button>
          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg font-bold flex items-center gap-1 hover:bg-accent/90 shadow-sm text-[11px]"
          >
            <Download className="h-3.5 w-3.5" /> JSON Statement
          </button>
        </div>
      </div>

      {/* Categories Configurator */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground text-xs flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-accent animate-pulse" /> Custom Report Category Filters
            </h3>
            <p className="text-[11px] text-muted-foreground">Define custom keywords for Profit & Loss or Asset/Liability balance sheets matching your spreadsheet rows.</p>
          </div>
          <button
            onClick={() => setIsEditingCategories(!isEditingCategories)}
            className="text-accent hover:underline font-bold flex items-center gap-1 text-[11px]"
          >
            <Edit3 className="h-3.5 w-3.5" /> {isEditingCategories ? "Lock Category Rules" : "Customize Calculations"}
          </button>
        </div>

        {isEditingCategories && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-muted/40 rounded-lg border">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Revenue Keyword</label>
              <input
                type="text"
                value={revenueCategory}
                onChange={(e) => setRevenueCategory(e.target.value)}
                className="w-full text-[11px] p-1.5 border rounded bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Expense Keyword</label>
              <input
                type="text"
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full text-[11px] p-1.5 border rounded bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Asset Keyword</label>
              <input
                type="text"
                value={assetCategory}
                onChange={(e) => setAssetCategory(e.target.value)}
                className="w-full text-[11px] p-1.5 border rounded bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Liability Keyword</label>
              <input
                type="text"
                value={liabilityCategory}
                onChange={(e) => setLiabilityCategory(e.target.value)}
                className="w-full text-[11px] p-1.5 border rounded bg-background"
              />
            </div>
          </div>
        )}
      </div>

      {/* Reports Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Navigation Sidebar */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs space-y-2 h-fit">
          <h4 className="font-bold text-foreground text-[10px] uppercase tracking-wider mb-2">Select Report Format</h4>
          {[
            { id: "summary", label: "Financial / Audit Summary" },
            { id: "income_statement", label: "Profit & Loss (Income Statement)", hide: solutionType !== "accounting" && solutionType !== "financial_statements" },
            { id: "balance_sheet", label: "Balance Sheet Summary", hide: solutionType !== "accounting" && solutionType !== "financial_statements" },
            { id: "audit_findings", label: "Audit Risk Summary", hide: solutionType !== "audit" },
            { id: "compliance_status", label: "Compliance policy rating", hide: solutionType !== "compliance" },
            { id: "operations_activity", label: "Operations Categorization", hide: solutionType === "accounting" || solutionType === "financial_statements" }
          ].map((rep) => {
            if (rep.hide) return null;
            return (
              <button
                key={rep.id}
                onClick={() => setSelectedReport(rep.id)}
                className={`w-full text-left p-2.5 rounded-lg font-bold transition flex items-center justify-between text-xs ${
                  selectedReport === rep.id ? "bg-accent/15 text-accent" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <span>{rep.label}</span>
                <ArrowRight className="h-3 w-3 opacity-60" />
              </button>
            );
          })}
        </div>

        {/* Dynamic Summary Cards */}
        <div className="md:col-span-3 bg-card border border-border p-6 rounded-xl shadow-xs space-y-6">

          {selectedReport === "summary" && (
            <div className="space-y-4">
              <h3 className="font-bold text-foreground text-sm border-b pb-2">Data-Driven Executive Summary</h3>
              <p className="text-muted-foreground">This report summarizes spreadsheet values, records, and active business formulas with zero-delay live connections.</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-blue-50/40 border border-blue-100">
                  <div className="text-[10px] uppercase font-bold text-blue-600">Total Records Tracked</div>
                  <div className="text-2xl font-bold mt-1 text-foreground">{records.length} Rows</div>
                </div>
                <div className="p-4 rounded-lg bg-emerald-50/40 border border-emerald-100">
                  <div className="text-[10px] uppercase font-bold text-emerald-600">Solution Category</div>
                  <div className="text-base font-bold mt-1 text-foreground capitalize">{solutionType} System</div>
                </div>
                <div className="p-4 rounded-lg bg-purple-50/40 border border-purple-100">
                  <div className="text-[10px] uppercase font-bold text-purple-600">Sync Status</div>
                  <div className="text-base font-bold mt-1 text-foreground">Live Two-Way Grid</div>
                </div>
              </div>
            </div>
          )}

          {selectedReport === "income_statement" && (
            <div className="space-y-4">
              <h3 className="font-bold text-foreground text-sm border-b pb-2 flex items-center gap-1.5">
                <DollarSign className="h-4.5 w-4.5 text-emerald-500" /> Income Statement (Profit & Loss)
              </h3>

              <div className="space-y-3 font-semibold">
                <div className="flex justify-between border-b py-2 bg-muted/20 px-2.5 rounded">
                  <span className="font-bold text-foreground uppercase text-[10px]">{revenueCategory} (Total Income)</span>
                  <span className="text-emerald-600 font-extrabold">${financialTotals.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b py-2 bg-muted/20 px-2.5 rounded">
                  <span className="font-bold text-foreground uppercase text-[10px]">{expenseCategory} (Total Expenses)</span>
                  <span className="text-rose-500 font-extrabold">(${financialTotals.totalExpenses.toLocaleString()})</span>
                </div>
                <div className="flex justify-between border-b py-3 px-2.5 rounded bg-accent/5">
                  <span className="font-black text-foreground uppercase">Net Profit Margin</span>
                  <span className={`font-black ${financialTotals.netCashFlow >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    ${financialTotals.netCashFlow.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {selectedReport === "balance_sheet" && (
            <div className="space-y-4">
              <h3 className="font-bold text-foreground text-sm border-b pb-2 flex items-center gap-1.5">
                <Layers className="h-4.5 w-4.5 text-blue-500" /> Balance Sheet Summary
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-muted/20 space-y-2">
                  <span className="font-bold text-foreground uppercase text-[10px]">{assetCategory} Assets</span>
                  <div className="text-lg font-bold text-blue-600">${financialTotals.totalAssets.toLocaleString()}</div>
                </div>
                <div className="p-4 border rounded-lg bg-muted/20 space-y-2">
                  <span className="font-bold text-foreground uppercase text-[10px]">{liabilityCategory} Liabilities</span>
                  <div className="text-lg font-bold text-rose-500">${financialTotals.totalLiabilities.toLocaleString()}</div>
                </div>
              </div>

              <div className="flex justify-between border-t border-border pt-4 bg-accent/5 p-3 rounded font-semibold">
                <span className="font-black text-foreground uppercase">Net Worth (Owner's Equity)</span>
                <span className="font-black text-emerald-600">${financialTotals.ownerEquity.toLocaleString()}</span>
              </div>
            </div>
          )}

          {selectedReport === "audit_findings" && (
            <div className="space-y-4">
              <h3 className="font-bold text-foreground text-sm border-b pb-2 flex items-center gap-1.5">
                <Briefcase className="h-4.5 w-4.5 text-amber-500" /> Audit Risks Checklist
              </h3>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg">
                  <div className="text-rose-600 font-bold uppercase text-[9px]">High Risk Findings</div>
                  <div className="text-xl font-bold mt-1 text-rose-700">{auditStats.highRisk}</div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <div className="text-amber-600 font-bold uppercase text-[9px]">Medium Risk</div>
                  <div className="text-xl font-bold mt-1 text-amber-700">{auditStats.mediumRisk}</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <div className="text-emerald-600 font-bold uppercase text-[9px]">Completed reviews</div>
                  <div className="text-xl font-bold mt-1 text-emerald-700">{auditStats.completed}</div>
                </div>
              </div>
            </div>
          )}

          {selectedReport === "compliance_status" && (
            <div className="space-y-4">
              <h3 className="font-bold text-foreground text-sm border-b pb-2 flex items-center gap-1.5">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" /> Regulatory Compliance Ratings
              </h3>

              <div className="p-4 rounded-xl border border-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Compliance Rating</span>
                  <div className="text-2xl font-bold mt-1 text-emerald-600">{complianceStats.compliantRate}% Compliant</div>
                </div>
                <div className="h-10 w-32 bg-muted rounded-full overflow-hidden border">
                  <div className="bg-emerald-500 h-full transition-all" style={{ width: `${complianceStats.compliantRate}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold text-muted-foreground uppercase">
                <div className="p-2.5 border rounded">Compliant: <span className="text-emerald-600 font-extrabold">{complianceStats.compliant}</span></div>
                <div className="p-2.5 border rounded">Non-Compliant: <span className="text-rose-600 font-extrabold">{complianceStats.nonCompliant}</span></div>
                <div className="p-2.5 border rounded">Under Review: <span className="text-amber-600 font-extrabold">{complianceStats.underReview}</span></div>
              </div>
            </div>
          )}

          {selectedReport === "operations_activity" && (
            <div className="space-y-4">
              <h3 className="font-bold text-foreground text-sm border-b pb-2 flex items-center gap-1.5">
                <Layers className="h-4.5 w-4.5 text-purple-500" /> Operations Category Breakdown
              </h3>

              <div className="space-y-2">
                {operationalStats.map((item, i) => (
                  <div key={i} className="flex justify-between border-b py-2 px-1">
                    <span className="font-bold text-foreground">{item.name}</span>
                    <span className="text-accent font-bold">{item.count} Rows</span>
                  </div>
                ))}
                {operationalStats.length === 0 && (
                  <div className="text-center text-muted-foreground py-6">
                    No categorical data found in spreadsheet.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
