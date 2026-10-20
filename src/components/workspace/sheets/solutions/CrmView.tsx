import { useState, useMemo } from "react";
import {
  Building2,
  Users,
  GitBranch,
  Calendar,
  Briefcase,
  Search,
  Plus,
  ArrowRight,
  User,
  Mail,
  Phone,
  DollarSign,
  MapPin,
  Globe,
  Edit2,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Loader2,
  Filter,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/appwrite/client";
import { toast } from "@/hooks/use-toast";

interface CrmViewProps {
  records: Record<string, any>[];
  onUpdateRecord: (rowIndex: number, field: string, value: any) => void;
  onAddRecord: (record: Record<string, any>) => void;
  onOpenMeetingModal: (prefilled: { title: string; participants: string }) => void;
}

export default function CrmView({
  records = [],
  onUpdateRecord,
  onAddRecord,
  onOpenMeetingModal
}: CrmViewProps) {
  const [activeTab, setActiveTab] = useState<"orgs" | "contacts" | "pipeline" | "activities" | "opportunities">("pipeline");
  const [search, setSearch] = useState("");
  const [selectedOrgIndex, setSelectedOrgIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Opportunity Intel states
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("All Sectors");
  const [regionFilter, setRegionFilter] = useState("Greater Accra");
  const [isSearching, setIsSearching] = useState(false);
  const [liveProspects, setLiveProspects] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Form states for creating/editing records
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  const PIPELINE_STATUSES = [
    "Yet to Contact",
    "Contacted",
    "Follow-up Required",
    "Meeting Scheduled",
    "Proposal Sent",
    "Negotiation",
    "Partnership Active",
    "Closed"
  ];

  // Pipeline Kanban Grouping
  const pipelineGroups = useMemo(() => {
    const groups: Record<string, typeof records> = {};
    PIPELINE_STATUSES.forEach((status) => {
      groups[status] = [];
    });
    records.forEach((rec) => {
      const status = rec.status || rec["Status"] || "Yet to Contact";
      if (groups[status]) {
        groups[status].push(rec);
      } else {
        // Fallback for unmapped statuses
        groups["Yet to Contact"].push(rec);
      }
    });
    return groups;
  }, [records]);

  // Handle Pipeline status transition (Two-way sync)
  const movePipelineCard = (rowIndex: number, nextStatus: string) => {
    onUpdateRecord(rowIndex, "status", nextStatus);
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const query = search.toLowerCase();
      const orgName = (rec.organizationName || rec.Organization || "").toLowerCase();
      const contactName = (rec.contactName || rec["Contact Person"] || "").toLowerCase();
      const email = (rec.email || rec["Email"] || "").toLowerCase();
      const sector = (rec.Sector || "").toLowerCase();

      return orgName.includes(query) || contactName.includes(query) || email.includes(query) || sector.includes(query);
    });
  }, [records, search]);

  const selectedOrg = useMemo(() => {
    if (selectedOrgIndex === null) return null;
    return records.find((r) => r.rowIndex === selectedOrgIndex) || null;
  }, [records, selectedOrgIndex]);

  const openOrgProfile = (rowIndex: number) => {
    setSelectedOrgIndex(rowIndex);
    const org = records.find((r) => r.rowIndex === rowIndex);
    if (org) {
      setEditForm({ ...org });
    }
    setIsEditing(false);
  };

  const handleSaveProfile = () => {
    if (!selectedOrg) return;
    Object.entries(editForm).forEach(([key, val]) => {
      if (key !== "rowIndex" && !key.startsWith("_")) {
        onUpdateRecord(selectedOrg.rowIndex, key, val);
      }
    });
    setIsEditing(false);
  };

  const handleAddNewOrg = () => {
    const defaultNew = {
      Organization: "New Organization",
      "Contact Person": "New Contact Person",
      Email: "contact@company.com",
      Phone: "+233 ",
      Status: "Yet to Contact",
      "Value (USD)": 0,
      Sector: "Consulting",
      Region: "Greater Accra"
    };
    onAddRecord(defaultNew);
  };

  const runDipaOpportunitySearch = async () => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("dipaOpportunitySearch", {
        body: {
          action: "dipaOpportunitySearch",
          query: searchQuery,
          sector: sectorFilter,
          region: regionFilter
        }
      });

      if (error) {
        throw new Error(error.message || "Failed to execute Dipa search.");
      }

      if (data && data.prospects) {
        setLiveProspects(data.prospects);
        setHasSearched(true);
        toast({
          title: "Dipa Live Discovery Complete",
          description: `Found ${data.prospects.length} verified online business prospects.`
        });
      } else {
        throw new Error(data?.error || "Invalid response format from Dipa search engine.");
      }
    } catch (err: any) {
      toast({
        title: "Dipa Search Error",
        description: err?.message || "Live prospect search failed. Check network connection.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addProspectToPipeline = (prospect: any) => {
    const recordToAdd = {
      Organization: prospect.organizationName,
      "Contact Person": prospect.contactName || "Direct Inquiry",
      Email: prospect.email || "",
      Phone: prospect.phone || "",
      Status: "Yet to Contact",
      "Follow-up Date": new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
      "Value (USD)": prospect.estimatedValue || 50000,
      Sector: prospect.sector || sectorFilter,
      Region: prospect.region || regionFilter
    };
    onAddRecord(recordToAdd);
    toast({
      title: "Prospect Added to CRM",
      description: `${prospect.organizationName} added to Pipeline under 'Yet to Contact'.`
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-muted/10">
      {/* Sub-Header bar */}
      <div className="h-12 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-1">
          {[
            { id: "pipeline", label: "Pipeline (Kanban)", icon: GitBranch },
            { id: "orgs", label: "Organizations", icon: Building2 },
            { id: "contacts", label: "Contacts", icon: Users },
            { id: "activities", label: "Activities & Actions", icon: Calendar },
            { id: "opportunities", label: "Opportunity Intel", icon: Sparkles }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id as any);
                setSelectedOrgIndex(null);
              }}
              className={`flex items-center gap-2 px-3 h-8 rounded-lg text-xs font-semibold transition ${
                activeTab === t.id
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Global Directory Search */}
        {activeTab !== "pipeline" && activeTab !== "opportunities" && (
          <div className="relative w-64">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search CRM..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        )}
      </div>

      {/* Main CRM panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tab 1: Pipeline Kanban */}
        {activeTab === "pipeline" && (
          <div className="flex-1 overflow-x-auto p-6 flex gap-4 items-start select-none">
            {PIPELINE_STATUSES.map((status) => (
              <div key={status} className="w-72 bg-muted/40 rounded-xl border border-border/80 flex flex-col flex-shrink-0 max-h-full overflow-hidden">
                <div className="p-3 border-b border-border bg-card flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground truncate">{status}</span>
                  <span className="text-[10px] bg-muted text-muted-foreground font-bold px-2 py-0.5 rounded-full">
                    {pipelineGroups[status]?.length || 0}
                  </span>
                </div>

                <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[400px]">
                  {pipelineGroups[status]?.map((item) => (
                    <div
                      key={item.rowIndex}
                      onClick={() => openOrgProfile(item.rowIndex)}
                      className="p-3 rounded-lg border border-border bg-card shadow-sm hover:border-accent/40 cursor-pointer transition space-y-2"
                    >
                      <div className="font-semibold text-xs text-foreground truncate">
                        {item.organizationName || item.Organization}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span className="truncate">{item.contactName || item["Contact Person"] || "No Contact"}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-border/40 mt-1">
                        <span className="text-[10px] font-semibold text-emerald-600">
                          ${(Number(item.value || item["Value (USD)"]) || 0).toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentIdx = PIPELINE_STATUSES.indexOf(status);
                              if (currentIdx < PIPELINE_STATUSES.length - 1) {
                                movePipelineCard(item.rowIndex, PIPELINE_STATUSES[currentIdx + 1]);
                              }
                            }}
                            className="h-5 w-5 rounded bg-muted hover:bg-accent/15 hover:text-accent flex items-center justify-center text-muted-foreground"
                            title="Move to next status"
                          >
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pipelineGroups[status]?.length === 0 && (
                    <div className="text-center py-8 text-[11px] text-muted-foreground italic border-2 border-dashed border-border/40 rounded-lg">
                      Drop deals here
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Organizations Profile Directory */}
        {activeTab === "orgs" && (
          <div className="flex-1 flex overflow-hidden">
            {/* List */}
            <div className="w-80 border-r border-border bg-card flex flex-col flex-shrink-0 overflow-y-auto">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">All Companies</span>
                <button
                  onClick={handleAddNewOrg}
                  className="flex items-center gap-1 text-[11px] bg-accent text-accent-foreground font-semibold px-2 py-1 rounded"
                >
                  <Plus className="h-3 w-3" /> Add Org
                </button>
              </div>
              <div className="divide-y divide-border/60">
                {filteredRecords.map((item) => (
                  <button
                    key={item.rowIndex}
                    onClick={() => openOrgProfile(item.rowIndex)}
                    className={`w-full p-3 text-left hover:bg-muted/30 flex flex-col gap-1 transition ${
                      selectedOrgIndex === item.rowIndex ? "bg-accent/5" : ""
                    }`}
                  >
                    <div className="font-semibold text-xs text-foreground truncate">
                      {item.organizationName || item.Organization}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">{item.Sector || "No Sector specified"}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-muted text-muted-foreground truncate max-w-[120px]">
                        {item.status || item.Status}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600">
                        ${(Number(item.value || item["Value (USD)"]) || 0).toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Profile Panel */}
            <div className="flex-1 bg-card overflow-y-auto p-6">
              {selectedOrg ? (
                <div className="max-w-2xl space-y-6">
                  <div className="flex items-start justify-between border-b border-border pb-4">
                    <div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.Organization || editForm.organizationName || ""}
                          onChange={(e) => setEditForm({ ...editForm, Organization: e.target.value })}
                          className="font-bold text-lg text-foreground border border-border px-2 py-1 rounded focus:outline-none"
                        />
                      ) : (
                        <h3 className="text-lg font-bold text-foreground">
                          {selectedOrg.organizationName || selectedOrg.Organization}
                        </h3>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">Record ID: Row {selectedOrg.rowIndex}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSaveProfile}
                            className="bg-emerald-600 text-white font-semibold text-xs px-3 py-1.5 rounded hover:bg-emerald-700"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="bg-muted text-foreground font-semibold text-xs px-3 py-1.5 rounded hover:bg-muted/80"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-1.5 border border-border text-xs font-semibold px-3 py-1.5 rounded hover:bg-muted"
                        >
                          <Edit2 className="h-3.5 w-3.5" /> Edit Profile
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 text-xs">
                    <div className="space-y-4">
                      <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                        Contact Person
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm["Contact Person"] || editForm.contactName || ""}
                              onChange={(e) => setEditForm({ ...editForm, "Contact Person": e.target.value })}
                              className="border border-border p-1 rounded"
                            />
                          ) : (
                            <span className="text-foreground font-medium">
                              {selectedOrg.contactName || selectedOrg["Contact Person"]}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.Email || editForm.email || ""}
                              onChange={(e) => setEditForm({ ...editForm, Email: e.target.value })}
                              className="border border-border p-1 rounded"
                            />
                          ) : (
                            <span className="text-foreground">{selectedOrg.email || selectedOrg.Email || "No Email"}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.Phone || editForm.phone || ""}
                              onChange={(e) => setEditForm({ ...editForm, Phone: e.target.value })}
                              className="border border-border p-1 rounded"
                            />
                          ) : (
                            <span className="text-foreground">{selectedOrg.phone || selectedOrg.Phone || "No Phone"}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                        Metadata & Classification
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground w-16">Deal Value:</span>
                          {isEditing ? (
                            <input
                              type="number"
                              value={editForm["Value (USD)"] || editForm.value || 0}
                              onChange={(e) => setEditForm({ ...editForm, "Value (USD)": Number(e.target.value) })}
                              className="border border-border p-1 rounded w-24"
                            />
                          ) : (
                            <span className="text-foreground font-semibold">
                              ${(Number(selectedOrg.value || selectedOrg["Value (USD)"]) || 0).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground w-16">Region:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.Region || ""}
                              onChange={(e) => setEditForm({ ...editForm, Region: e.target.value })}
                              className="border border-border p-1 rounded"
                            />
                          ) : (
                            <span className="text-foreground">{selectedOrg.Region || "Not Specified"}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground w-16">Sector:</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.Sector || ""}
                              onChange={(e) => setEditForm({ ...editForm, Sector: e.target.value })}
                              className="border border-border p-1 rounded"
                            />
                          ) : (
                            <span className="text-foreground">{selectedOrg.Sector || "Not Specified"}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex items-center gap-2">
                    <button
                      onClick={() =>
                        onOpenMeetingModal({
                          title: `Partnership Review with ${selectedOrg.organizationName || selectedOrg.Organization}`,
                          participants: selectedOrg.email || selectedOrg.Email || ""
                        })
                      }
                      className="bg-accent text-accent-foreground font-semibold text-xs px-3.5 py-2 rounded-lg hover:bg-accent/90"
                    >
                      Schedule Online Meeting
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                  <Building2 className="h-12 w-12 stroke-1 mb-2 text-muted-foreground/60" />
                  <span>Select an Organization from the left panel to inspect their profile.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Contacts Directory */}
        {activeTab === "contacts" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Linked Workspace Contacts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {records
                .filter((r) => r.contactName || r["Contact Person"])
                .map((r) => (
                  <div
                    key={r.rowIndex}
                    className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-accent/40 transition flex items-start gap-4"
                  >
                    <div className="h-10 w-10 rounded-full bg-accent/15 text-accent flex items-center justify-center font-bold text-sm">
                      {(r.contactName || r["Contact Person"] || "U")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 text-xs space-y-1">
                      <div className="font-bold text-sm text-foreground">
                        {r.contactName || r["Contact Person"]}
                      </div>
                      <div className="text-muted-foreground font-medium">
                        {r.organizationName || r.Organization || "Independent Contact"}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground pt-1">
                        <Mail className="h-3 w-3" />
                        <span>{r.email || r.Email || "No Email listed"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{r.phone || r.Phone || "No Phone listed"}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Tab 4: Activities Feed */}
        {activeTab === "activities" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-foreground mb-1">Contextual Activity log</h3>
              <p className="text-xs text-muted-foreground">Record audit tracking and online client meetings history.</p>
            </div>
            <div className="space-y-4 max-w-2xl">
              {records.map((r, i) => (
                <div key={i} className="p-4 rounded-xl border border-border bg-card shadow-sm text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{r.organizationName || r.Organization}</span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Status: {r.status || r.Status}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    Action Required: Follow-up on <span className="font-semibold text-foreground">{r["Follow-up Date"] || r.date || "N/A"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Opportunity Intel (Dipa Search Engine) */}
        {activeTab === "opportunities" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-5 rounded-xl border border-border shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Sparkles className="h-4 w-4 text-accent animate-pulse" />
                  Dipa Realtime Opportunity Intel & Online Prospect Search
                </div>
                <p className="text-xs text-muted-foreground">
                  Search, discover, and verify live business websites across sectors and regions to source verified online prospects directly into your CRM.
                </p>
              </div>
            </div>

            {/* Search Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-card p-4 rounded-xl border border-border shadow-sm">
              <div className="md:col-span-2 relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Enter business name, website URL (e.g. gipc.gov.gh), or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runDipaOpportunitySearch()}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <select
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="All Sectors">All Sectors</option>
                  <option value="Government & Investment">Government & Investment</option>
                  <option value="Agribusiness & Food">Agribusiness & Food</option>
                  <option value="Logistics & Supply Chain">Logistics & Supply Chain</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Finance & Banking">Finance & Banking</option>
                </select>
              </div>

              <div>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="Greater Accra">Greater Accra</option>
                  <option value="Ashanti Region">Ashanti Region</option>
                  <option value="Western Region (Takoradi)">Western Region (Takoradi)</option>
                  <option value="All Regions">All Regions</option>
                </select>
              </div>

              <div className="md:col-span-4 flex justify-end">
                <button
                  onClick={runDipaOpportunitySearch}
                  disabled={isSearching}
                  className="flex items-center gap-2 bg-accent text-accent-foreground font-semibold text-xs px-4 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50 transition"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying Live Websites...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" /> Run Dipa Search
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results Display */}
            {hasSearched ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>Found <strong className="text-foreground">{liveProspects.length}</strong> verified online prospects</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified via Dipa Realtime HTTP Engine
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {liveProspects.map((prospect, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-xl border border-border bg-card shadow-sm hover:border-accent/40 transition space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                              {prospect.organizationName}
                              {prospect.verified && (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-600 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  <CheckCircle2 className="h-3 w-3" /> Live Verified ({prospect.httpStatus})
                                </span>
                              )}
                            </h4>
                            <a
                              href={prospect.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-accent hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <Globe className="h-3 w-3" /> {prospect.website} <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                            ${(prospect.estimatedValue || 0).toLocaleString()}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/40">
                          {prospect.opportunityInsight}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <User className="h-3 w-3 text-muted-foreground/70" />
                            <span className="truncate">{prospect.contactName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="h-3 w-3 text-muted-foreground/70" />
                            <span className="truncate">{prospect.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <Phone className="h-3 w-3 text-muted-foreground/70" />
                            <span className="truncate">{prospect.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="h-3 w-3 text-muted-foreground/70" />
                            <span className="truncate">{prospect.region}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground italic">
                          Verified at {new Date(prospect.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({prospect.latencyMs}ms)
                        </span>
                        <button
                          onClick={() => addProspectToPipeline(prospect)}
                          className="flex items-center gap-1.5 bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground font-semibold text-xs px-3 py-1.5 rounded-lg transition"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add to CRM Pipeline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-xl border border-dashed border-border/80 bg-card space-y-3">
                <TrendingUp className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                <h4 className="font-bold text-sm text-foreground">No Active Discovery Search Executed</h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Click <strong>'Run Dipa Search'</strong> above to query live verified online prospects and verify website response statuses in real time.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
