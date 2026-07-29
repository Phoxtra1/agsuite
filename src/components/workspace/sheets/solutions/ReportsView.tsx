import { useState, useMemo } from "react";
import {
  FileText,
  MapPin,
  Calendar,
  Activity,
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
  }, [records, columnTypes]);

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

            {columnTypes.status && (
              <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Folders</span>
                <div className="text-3xl font-extrabold text-emerald-600">{summaryData.active}</div>
                <p className="text-[11px] text-muted-foreground pt-1">Current operational & verified records.</p>
              </div>
            )}

            {(columnTypes.category || columnTypes.location) && (
              <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">MAPPED CLASSIFICATIONS</span>
                <div className="text-3xl font-extrabold text-purple-600">
                  {summaryData.categoriesCount > 0 ? `${summaryData.categoriesCount} cats` : ""}
                  {summaryData.categoriesCount > 0 && summaryData.locationsCount > 0 ? " / " : ""}
                  {summaryData.locationsCount > 0 ? `${summaryData.locationsCount} locs` : ""}
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">Dynamically mapped sectors and geological hubs.</p>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
              <Database className="h-4 w-4 text-accent" /> Registry Master
              Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center divide-y md:divide-y-0 md:divide-x divide-border">
              <div className="py-2">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Columns</span>
                <span className="block text-xl font-bold text-foreground mt-1">
                  {allHeaders.length}
                </span>
              </div>

              {columnTypes.status && (
                <>
                  <div className="py-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Pending Approval</span>
                    <span className="block text-xl font-bold text-amber-500 mt-1">{summaryData.pending}</span>
                  </div>
                  <div className="py-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Archived Index</span>
                    <span className="block text-xl font-bold text-muted-foreground mt-1">{summaryData.archived}</span>
                  </div>
                </>
              )}

              <div className="py-2">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">
                  Sync Reliability
                </span>
                <span className="block text-xl font-bold text-emerald-600 mt-1 flex items-center justify-center gap-1">
                  <Check className="h-4 w-4" /> 100% Dynamic
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. CATEGORY BREAKDOWN REPORT */}
      {activeReport === "category" && columnTypes.category && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-purple-500" /> Category Analysis
              Index
            </h3>
            <span className="bg-accent/15 text-accent font-bold px-2 py-0.5 rounded text-[10px]">
              {categoryBreakdown.length} Categories Mapped
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                  <th className="p-3">Category Name</th>
                  <th className="p-3">Total Registered Records</th>
                  {columnTypes.status && <th className="p-3">Active Records</th>}
                  {columnTypes.status && <th className="p-3">Archived Records</th>}
                </tr>
              </thead>
              <tbody>
                {categoryBreakdown.map((cat, i) => (
                  <tr key={i} className="border-b border-border/60 hover:bg-muted/10">
                    <td className="p-3 font-bold text-foreground capitalize">{cat.name}</td>
                    <td className="p-3 font-medium text-foreground">{cat.count} records</td>
                    {columnTypes.status && <td className="p-3 text-emerald-600 font-semibold">{cat.active}</td>}
                    {columnTypes.status && <td className="p-3 text-muted-foreground">{cat.archived}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {/* 3. STATUS REPORT */}
      {activeReport === "status" && columnTypes.status && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-emerald-500" /> Status Allocation
              Metrics
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                  <th className="p-3">Status Value</th>
                  <th className="p-3">Assigned Count</th>
                  <th className="p-3">Distribution Percentage</th>
                  <th className="p-3">Sync State</th>
                </tr>
              </thead>
              <tbody>
                {statusBreakdown.map((st, i) => (
                  <tr
                    key={i}
                    className="border-b border-border/60 hover:bg-muted/10"
                  >
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded font-bold uppercase text-[9px] border bg-accent/5 text-accent border-accent/20">
                        {st.name}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-foreground">
                      {st.count} records
                    </td>
                    <td className="p-3 font-medium text-muted-foreground">
                      {records.length > 0
                        ? Math.round((st.count / records.length) * 100)
                        : 0}
                      %
                    </td>
                    <td className="p-3 text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Synchronized
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. LOCATION REPORT */}
      {activeReport === "location" && columnTypes.location && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-blue-500" /> Geological Location
              Summary
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                  <th className="p-3">Filing / Registry Location</th>
                  <th className="p-3">Aggregated Records Count</th>
                  {columnTypes.status && <th className="p-3">Active Records</th>}
                  <th className="p-3">Proportional Weight</th>
                </tr>
              </thead>
              <tbody>
                {locationBreakdown.map((loc, i) => (
                  <tr key={i} className="border-b border-border/60 hover:bg-muted/10">
                    <td className="p-3 font-bold text-foreground">{loc.name}</td>
                    <td className="p-3 font-medium text-foreground">{loc.count}</td>
                    {columnTypes.status && <td className="p-3 text-emerald-600 font-semibold">{loc.active}</td>}
                    <td className="p-3 font-medium text-muted-foreground">
                      {records.length > 0
                        ? Math.round((loc.count / records.length) * 100)
                        : 0}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. ACTIVITY HISTORY REPORT */}
      {activeReport === "activity" && columnTypes.date && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-amber-500" /> Operational Action
              Trail (Real-Time Sync Audit)
            </h3>
          </div>
          <div className="divide-y divide-border">
            {activityHistory.map((act) => (
              <div
                key={act.id}
                className="p-4 flex items-start gap-4 hover:bg-muted/10"
              >
                <div className="h-8 w-8 rounded-full bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">
                      {act.recordName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {act.date}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{act.action}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
                    <span>Performed by: <span className="font-semibold text-foreground">{act.user}</span></span>
                    {columnTypes.status && (
                      <>
                        <span>•</span>
                        <span className="uppercase text-[9px] bg-muted px-1.5 py-0.2 rounded font-bold">{act.status}</span>
                      </>
                    )}
                  </div>
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
