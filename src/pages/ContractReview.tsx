import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import {
  Shield,
  Loader2,
  Play,
  FileText,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Download,

  Eye,
  FileCheck,
  MapPin,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
} from "lucide-react";

function SafetyGauge({ score, grade }: { score: number; grade: string }) {
  const color = score >= 80 ? "#00BFBF" : score >= 60 ? "#FF6B35" : "#ef4444";
  const bg = score >= 80 ? "bg-emerald-500/15" : score >= 60 ? "bg-amber-500/15" : "bg-red-500/15";
  return (
    <div className={`p-6 rounded-2xl ${bg} border border-[${color}]/20 text-center`}>
      <div className="relative w-32 h-32 mx-auto mb-4">
        <svg viewBox="0 0 120 120" className="w-full h-full">
          <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(0,191,191,0.1)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="50" fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${(score / 100) * 314} 314`}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{score}</span>
          <span className="text-xs text-[#7A8B99]">/ 100</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl font-bold" style={{ color }}>Grade {grade}</span>
        {score >= 80 ? <ShieldCheck size={24} className="text-emerald-400" /> :
         score >= 60 ? <ShieldAlert size={24} className="text-amber-400" /> :
         <ShieldAlert size={24} className="text-red-400" />}
      </div>
      <p className="text-xs text-[#7A8B99] mt-2">
        {score >= 80 ? "This contract has strong protections" :
         score >= 60 ? "Several issues need attention before signing" :
         "Major risks identified - do not sign without legal counsel"}
      </p>
    </div>
  );
}

export default function ContractReviewPage() {
  const [selectedDoc, setSelectedDoc] = useState<number | null>(null);
  const [activeResult, setActiveResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "clauses" | "risks" | "compliance" | "obligations" | "recommendations">("overview");

  const { data: docsData } = trpc.document.list.useQuery({ limit: 50 });
  const { data: reviewsData } = trpc.contractReview.list.useQuery({ limit: 20 });

  const createReview = trpc.contractReview.create.useMutation({
    onSuccess: (data) => {
      const d = data as any;
      if (d.error) {
        toast.error(d.error);
        return;
      }
      toast.success("5-Agent Contract Review Complete");
      setActiveResult(data);
    },
    onError: (err) => toast.error("Review failed: " + err.message),
  });

  const documents = docsData?.items ?? [];
  const reviews = reviewsData?.items ?? [];

  const handleRunReview = () => {
    if (!selectedDoc) return;
    setActiveResult(null);
    createReview.mutate({ documentId: selectedDoc, userId: 1 });
  };

  const displayResult = activeResult ?? (reviews.length > 0 ? reviews[0] : null);

  const riskColors: Record<string, string> = {
    high: "text-red-400 bg-red-500/15 border-red-500/20",
    medium: "text-amber-400 bg-amber-500/15 border-amber-500/20",
    low: "text-emerald-400 bg-emerald-500/15 border-emerald-500/20",
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-[#E0F2F1]">Contract Review</h1>
        <p className="text-[#7A8B99] mt-1 text-sm">5 parallel AI agents analyze your contract for risks, compliance, and protection gaps</p>
      </div>

      {!displayResult && !createReview.isPending && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Config Panel */}
          <div className="lg:col-span-1 glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-[#E0F2F1] mb-4 flex items-center gap-2">
              <Shield size={16} className="text-[#00BFBF]" />
              Start Review
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono-data text-[#7A8B99] uppercase tracking-wider block mb-2">Select Contract</label>
                <select
                  value={selectedDoc ?? ""}
                  onChange={(e) => setSelectedDoc(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#001A33]/60 border border-[#00BFBF]/15 text-[#E0F2F1] text-sm focus:border-[#00BFBF]/50 focus:outline-none"
                >
                  <option value="" className="bg-[#002B52]">Choose a contract...</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id} className="bg-[#002B52]">{doc.title}</option>
                  ))}
                </select>
                {documents.length === 0 && (
                  <p className="text-xs text-[#7A8B99] mt-2">No contracts. <a href="/documents" className="text-[#00BFBF]">Upload one first.</a></p>
                )}
              </div>

              {/* Pipeline preview */}
              <div className="p-4 rounded-xl bg-[#001A33]/50 border border-[#00BFBF]/10">
                <p className="text-xs font-mono-data text-[#00BFBF] uppercase mb-3">5-Agent Pipeline</p>
                {[
                  { icon: FileCheck, label: "Clause Analyst", desc: "Maps all contractual clauses" },
                  { icon: ShieldAlert, label: "Risk Assessor", desc: "Identifies protection gaps" },
                  { icon: ShieldCheck, label: "Compliance Checker", desc: "Audits regulatory compliance" },
                  { icon: MapPin, label: "Terms Mapper", desc: "Extracts obligations & key dates" },
                  { icon: Sparkles, label: "Recommendations", desc: "Suggests contract improvements" },
                ].map((agent, i) => (
                  <div key={agent.label} className="flex items-center gap-3 py-2">
                    <div className="w-8 h-8 rounded-lg bg-[#00BFBF]/10 flex items-center justify-center flex-shrink-0">
                      <agent.icon size={16} className="text-[#00BFBF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#E0F2F1]">{i + 1}. {agent.label}</p>
                      <p className="text-[10px] text-[#7A8B99]">{agent.desc}</p>
                    </div>
                    <ChevronRight size={14} className="text-[#7A8B99] flex-shrink-0" />
                  </div>
                ))}
              </div>

              <button
                onClick={handleRunReview}
                disabled={!selectedDoc || createReview.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#00BFBF] text-[#001A33] text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 glow-teal-hover"
              >
                {createReview.isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> 5 Agents Processing...</>
                ) : (
                  <><Play size={16} /> Run Full Review</>
                )}
              </button>
            </div>
          </div>

          {/* Empty state */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center">
            <Shield size={64} className="text-[#7A8B99]/30 mb-4" />
            <p className="text-[#E0F2F1] font-medium text-lg">No contract review yet</p>
            <p className="text-sm text-[#7A8B99] mt-2 max-w-md">
              Upload a contract and run the 5-agent pipeline to get a full Contract Safety Score, 
              clause analysis, risk assessment, compliance audit, obligations map, and recommendations.
            </p>
          </div>
        </div>
      )}

      {createReview.isPending && !displayResult && (
        <div className="glass-card rounded-2xl p-16 flex flex-col items-center justify-center">
          <div className="grid grid-cols-5 gap-4 mb-8">
            {["Clause Analyst", "Risk Assessor", "Compliance Checker", "Terms Mapper", "Recommendations"].map((name, i) => (
              <div key={name} className="text-center animate-pulse" style={{ animationDelay: `${i * 200}ms` }}>
                <div className="w-14 h-14 rounded-2xl bg-[#00BFBF]/15 border border-[#00BFBF]/30 flex items-center justify-center mx-auto mb-2">
                  <Loader2 size={24} className="text-[#00BFBF] animate-spin" />
                </div>
                <p className="text-xs font-mono-data text-[#00BFBF]">{name}</p>
                <p className="text-[10px] text-[#7A8B99]">Running...</p>
              </div>
            ))}
          </div>
          <p className="text-[#E0F2F1] font-medium">5-Parallel-Agent Contract Analysis in Progress</p>
          <p className="text-sm text-[#7A8B99] mt-1">Analyzing clauses, risks, compliance, obligations, and generating recommendations</p>
        </div>
      )}

      {displayResult && (
        <div className="space-y-6">
          {/* Top bar: Score + Tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <SafetyGauge score={displayResult.safetyScore ?? 0} grade={displayResult.letterGrade ?? "N/A"} />
            <div className="lg:col-span-3 glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#E0F2F1]">Contract Safety Analysis</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono-data text-[#7A8B99]">
                    {(displayResult.processingTime ? (displayResult.processingTime / 1000).toFixed(2) : 0)}s
                  </span>
                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(displayResult, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url; a.download = `contract-review-${displayResult.id}.json`; a.click();
                      toast.success("Report exported");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#7A8B99] hover:text-[#00BFBF] hover:bg-[#00BFBF]/10 transition-colors border border-[#00BFBF]/10"
                  >
                    <Download size={14} /> Export
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "High Risk", value: displayResult.highRiskCount ?? 0, icon: ShieldAlert, color: "text-red-400" },
                  { label: "Medium Risk", value: displayResult.mediumRiskCount ?? 0, icon: ShieldQuestion, color: "text-amber-400" },
                  { label: "Low Risk", value: displayResult.lowRiskCount ?? 0, icon: ShieldCheck, color: "text-emerald-400" },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-xl bg-[#001A33]/50 text-center">
                    <item.icon size={20} className={item.color + " mx-auto mb-2"} />
                    <p className="text-2xl font-semibold text-[#E0F2F1]">{item.value}</p>
                    <p className="text-xs text-[#7A8B99]">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="flex flex-wrap gap-2 mt-6">
                {[
                  { key: "overview" as const, label: "Overview", icon: Eye },
                  { key: "clauses" as const, label: "Clauses", icon: FileText },
                  { key: "risks" as const, label: "Risks", icon: AlertTriangle },
                  { key: "compliance" as const, label: "Compliance", icon: ShieldCheck },
                  { key: "obligations" as const, label: "Obligations", icon: MapPin },
                  { key: "recommendations" as const, label: "Recommendations", icon: TrendingUp },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
                      activeTab === tab.key
                        ? "bg-[#00BFBF]/15 text-[#00BFBF] border-[#00BFBF]/30"
                        : "text-[#7A8B99] hover:text-[#E0F2F1] border-[#00BFBF]/5 hover:border-[#00BFBF]/15"
                    }`}
                  >
                    <tab.icon size={14} /> {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="glass-card rounded-2xl p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-[#E0F2F1] mb-3">5-Agent Results Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {[
                      { icon: FileCheck, label: "Clause Analyst", desc: `${(displayResult.clauseAnalysis as any[])?.filter((c: any) => c.found).length ?? 0}/${(displayResult.clauseAnalysis as any[])?.length ?? 0} clauses found` },
                      { icon: ShieldAlert, label: "Risk Assessor", desc: `${displayResult.highRiskCount ?? 0} high, ${displayResult.mediumRiskCount ?? 0} medium risks` },
                      { icon: ShieldCheck, label: "Compliance", desc: `${(displayResult.complianceFlags as any[])?.filter((c: any) => c.status === "non-compliant").length ?? 0} non-compliant` },
                      { icon: MapPin, label: "Terms Mapper", desc: `${(displayResult.obligationsMap as any)?.keyDates?.length ?? 0} key dates mapped` },
                      { icon: Sparkles, label: "Recommendations", desc: `${(displayResult.recommendations as any[])?.filter((r: any) => r.priority === "critical").length ?? 0} critical actions` },
                    ].map((a) => (
                      <div key={a.label} className="p-3 rounded-xl bg-[#001A33]/50 border border-[#00BFBF]/10 text-center">
                        <a.icon size={18} className="text-[#00BFBF] mx-auto mb-2" />
                        <p className="text-xs font-medium text-[#E0F2F1]">{a.label}</p>
                        <p className="text-[10px] text-[#7A8B99] mt-1">{a.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "clauses" && displayResult.clauseAnalysis && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#E0F2F1] mb-3">Clause Map (15 Standard Clauses)</h3>
                {(displayResult.clauseAnalysis as any[]).map((clause: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#001A33]/30 border border-[#00BFBF]/5">
                    <span className="text-xs font-mono-data text-[#7A8B99] w-8">{clause.section}</span>
                    <span className="text-sm font-medium text-[#E0F2F1] flex-1">{clause.type}</span>
                    {clause.found ? (
                      <><CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" /><span className="text-xs text-[#7A8B99] flex-1 truncate">{clause.text}</span></>
                    ) : (
                      <><AlertCircle size={14} className="text-red-400 flex-shrink-0" /><span className="text-xs text-red-400/70 flex-1">Missing - high risk</span></>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "risks" && displayResult.riskAssessment && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[#E0F2F1] mb-3">Risk Assessment</h3>
                {((displayResult.riskAssessment as any)?.risks as any[])?.map((risk: any, i: number) => (
                  <div key={i} className={`p-4 rounded-xl border ${riskColors[risk.level]}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono-data uppercase ${riskColors[risk.level]}`}>{risk.level}</span>
                      <span className="text-sm font-medium text-[#E0F2F1]">{risk.category}</span>
                    </div>
                    <p className="text-sm text-[#7A8B99]">{risk.text}</p>
                    <p className="text-xs text-[#FF6B35] mt-1">Impact: {risk.impact}</p>
                    <p className="text-xs text-[#00BFBF] mt-1">Fix: {risk.recommendation}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "compliance" && displayResult.complianceFlags && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#E0F2F1] mb-3">Compliance Audit</h3>
                {(displayResult.complianceFlags as any[]).map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#001A33]/30 border border-[#00BFBF]/5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono-data uppercase ${
                      c.status === "non-compliant" ? "bg-red-500/15 text-red-400" :
                      c.status === "partial" ? "bg-amber-500/15 text-amber-400" :
                      c.status === "not-applicable" ? "bg-[#002B52] text-[#7A8B99]" :
                      "bg-emerald-500/15 text-emerald-400"
                    }`}>{c.status}</span>
                    <span className="text-sm font-medium text-[#E0F2F1] w-32">{c.framework}</span>
                    <span className="text-xs text-[#7A8B99] flex-1">{c.detail}</span>
                    <span className={`text-[10px] font-mono-data uppercase px-1.5 py-0.5 rounded ${
                      c.severity === "high" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"
                    }`}>{c.severity}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "obligations" && displayResult.obligationsMap && (
              <div className="space-y-4">
                {(() => {
                  const om = displayResult.obligationsMap as any;
                  return (
                    <>
                      <div>
                        <h3 className="text-sm font-semibold text-[#E0F2F1] mb-2">Your Obligations</h3>
                        {(om.yourObligations as string[]).map((o: string, i: number) => (
                          <p key={i} className="text-sm text-[#7A8B99] pl-3 border-l-2 border-[#00BFBF] py-1">{o}</p>
                        ))}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#E0F2F1] mb-2">Their Obligations</h3>
                        {(om.theirObligations as string[]).map((o: string, i: number) => (
                          <p key={i} className="text-sm text-[#7A8B99] pl-3 border-l-2 border-[#FF6B35] py-1">{o}</p>
                        ))}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#E0F2F1] mb-2">Key Dates</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(om.keyDates as any[]).map((d: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg bg-[#001A33]/50 flex justify-between">
                              <span className="text-xs text-[#E0F2F1]">{d.event}</span>
                              <span className="text-xs font-mono-data text-[#00BFBF]">{d.date}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#E0F2F1] mb-2">Payment Schedule</h3>
                        <div className="space-y-2">
                          {(om.paymentSchedule as any[]).map((p: any, i: number) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-xs text-[#7A8B99] w-40">{p.milestone}</span>
                              <div className="flex-1 h-2 bg-[#002B52] rounded-full overflow-hidden">
                                <div className="h-full bg-[#00BFBF] rounded-full" style={{ width: p.percentage + "%" }} />
                              </div>
                              <span className="text-xs font-mono-data text-[#00BFBF] w-16 text-right">{p.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {activeTab === "recommendations" && displayResult.recommendations && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#E0F2F1] mb-3">Priority Recommendations</h3>
                {(displayResult.recommendations as any[]).map((rec: any, i: number) => (
                  <div key={i} className={`p-4 rounded-xl border ${
                    rec.priority === "critical" ? "bg-red-500/5 border-red-500/20" :
                    rec.priority === "high" ? "bg-amber-500/5 border-amber-500/20" :
                    "bg-[#001A33]/30 border-[#00BFBF]/5"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono-data uppercase ${
                        rec.priority === "critical" ? "bg-red-500/15 text-red-400" :
                        rec.priority === "high" ? "bg-amber-500/15 text-amber-400" :
                        "bg-[#00BFBF]/15 text-[#00BFBF]"
                      }`}>{rec.priority}</span>
                      <span className="text-sm font-medium text-[#E0F2F1]">{rec.action}</span>
                    </div>
                    <p className="text-xs text-[#7A8B99]">{rec.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
