import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import {
  ShieldCheck,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Scale,
  Lock,
  FileText,
  Play,
} from "lucide-react";

export default function Ethics() {
  const [selectedDoc, setSelectedDoc] = useState<number | null>(null);
  const [reviewResult, setReviewResult] = useState<any>(null);

  const { data: docsData } = trpc.document.list.useQuery({ limit: 50 });
  const { data: concernsData } = trpc.ethical.listConcerns.useQuery({ limit: 20 });
  const reviewMutation = trpc.ethical.review.useMutation({
    onSuccess: (data) => {
      if (data) {
        setReviewResult(data);
        toast.success("Ethics audit completed");
      }
    },
    onError: (err) => toast.error("Audit failed: " + err.message),
  });

  const documents = docsData?.items ?? [];
  const concerns = concernsData ?? [];

  const handleReview = () => {
    if (!selectedDoc) return;
    setReviewResult(null);
    reviewMutation.mutate({ documentId: selectedDoc });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "#00BFBF";
    if (score >= 6) return "#E0F2F1";
    return "#FF6B35";
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return "bg-emerald-500/15 text-emerald-400";
    if (score >= 6) return "bg-amber-500/15 text-amber-400";
    return "bg-red-500/15 text-red-400";
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-[#E0F2F1]">Ethics Review</h1>
        <p className="text-[#7A8B99] mt-1 text-sm">AI fairness, bias detection, and ethical compliance auditing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Run Review */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-[#E0F2F1] mb-4 flex items-center gap-2">
              <Play size={16} className="text-[#00BFBF]" />
              Run Ethics Review
            </h3>
            <div className="space-y-3">
              <select
                value={selectedDoc ?? ""}
                onChange={(e) => setSelectedDoc(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-[#001A33]/60 border border-[#00BFBF]/15 text-[#E0F2F1] text-sm focus:border-[#00BFBF]/50 focus:outline-none transition-colors"
              >
                <option value="" className="bg-[#002B52]">Select document...</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id} className="bg-[#002B52]">
                    {doc.title}
                  </option>
                ))}
              </select>
              <button
                onClick={handleReview}
                disabled={!selectedDoc || reviewMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00BFBF] text-[#001A33] text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 glow-teal-hover"
              >
                {reviewMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ShieldCheck size={16} />
                )}
                {reviewMutation.isPending ? "Auditing..." : "Run Ethics Audit"}
              </button>
            </div>
          </div>

          {/* Score Legend */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-[#E0F2F1] mb-3">Score Guide</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-[#7A8B99]">8-10: Excellent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-[#7A8B99]">6-7: Needs Attention</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <span className="text-[#7A8B99]">0-5: Critical</span>
              </div>
            </div>
          </div>

          {/* Recent Concerns */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-[#E0F2F1] mb-3">Recent Concerns</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {concerns.length === 0 ? (
                <p className="text-xs text-[#7A8B99] text-center py-4">No concerns recorded</p>
              ) : (
                concerns.slice(0, 10).map((c: any, i: number) => (
                  <div key={i} className="p-2.5 rounded-lg bg-[#001A33]/30 border border-[#00BFBF]/5">
                    <div className="flex items-center gap-2">
                      {c.severity === "high" ? (
                        <AlertTriangle size={12} className="text-red-400 flex-shrink-0" />
                      ) : (
                        <Eye size={12} className="text-amber-400 flex-shrink-0" />
                      )}
                      <span className="text-xs font-mono-data text-[#00BFBF] uppercase">{c.category}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ml-auto ${getScoreBg(c.severity === "high" ? 4 : 7)}`}>
                        {c.severity}
                      </span>
                    </div>
                    <p className="text-xs text-[#7A8B99] mt-1">{c.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Results */}
        <div className="lg:col-span-2">
          {reviewMutation.isPending && !reviewResult ? (
            <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center">
              <div className="relative mb-6">
                <ShieldCheck size={32} className="text-[#00BFBF]" />
                <div className="absolute -inset-2 rounded-full border border-[#00BFBF]/30 animate-ping" />
              </div>
              <p className="text-[#E0F2F1] font-medium">Running Ethics Audit</p>
              <p className="text-sm text-[#7A8B99] mt-1">Bias Detection → Fairness Analysis → Transparency Review → Privacy Check</p>
            </div>
          ) : reviewResult ? (
            <div className="glass-card rounded-2xl p-6 space-y-6 animate-fade-in">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#00BFBF]/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
                    backgroundColor: `${getScoreColor((reviewResult.scores.biasScore + reviewResult.scores.fairnessScore + reviewResult.scores.transparencyScore + reviewResult.scores.privacyScore) / 4)}20`,
                  }}>
                    <ShieldCheck size={24} style={{ color: getScoreColor((reviewResult.scores.biasScore + reviewResult.scores.fairnessScore + reviewResult.scores.transparencyScore + reviewResult.scores.privacyScore) / 4) }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#E0F2F1]">Ethics Audit Report</h3>
                    <p className="text-xs text-[#7A8B99]">{reviewResult.overallAssessment.slice(0, 100)}...</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono-data text-[#7A8B99]">Overall</p>
                  <p className="text-2xl font-semibold" style={{
                    color: getScoreColor((reviewResult.scores.biasScore + reviewResult.scores.fairnessScore + reviewResult.scores.transparencyScore + reviewResult.scores.privacyScore) / 4),
                  }}>
                    {((reviewResult.scores.biasScore + reviewResult.scores.fairnessScore + reviewResult.scores.transparencyScore + reviewResult.scores.privacyScore) / 4).toFixed(1)}/10
                  </p>
                </div>
              </div>

              {/* Score Cards */}
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(reviewResult.scores).map(([key, val]: [string, any]) => (
                  <div key={key} className="p-4 rounded-xl bg-[#001A33]/50 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      {key.includes("bias") ? <Eye size={14} className="text-[#7A8B99]" /> :
                       key.includes("fair") ? <Scale size={14} className="text-[#7A8B99]" /> :
                       key.includes("trans") ? <FileText size={14} className="text-[#7A8B99]" /> :
                       <Lock size={14} className="text-[#7A8B99]" />}
                      <p className="text-xs font-mono-data text-[#7A8B99] uppercase">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </p>
                    </div>
                    <p className="text-2xl font-semibold" style={{ color: getScoreColor(Number(val)) }}>
                      {Number(val).toFixed(1)}
                    </p>
                    <div className="w-full h-1.5 bg-[#002B52] rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Number(val) * 10}%`,
                          backgroundColor: getScoreColor(Number(val)),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Concerns */}
              {reviewResult.concerns && reviewResult.concerns.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[#E0F2F1] mb-3 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-[#FF6B35]" />
                    Identified Concerns
                  </h4>
                  <div className="space-y-2">
                    {reviewResult.concerns.map((c: any, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-[#001A33]/30 border border-[#00BFBF]/5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono-data uppercase ${getScoreBg(c.severity === "high" ? 4 : 7)}`}>
                            {c.severity}
                          </span>
                          <span className="text-xs font-mono-data text-[#00BFBF] uppercase">{c.category}</span>
                        </div>
                        <p className="text-sm text-[#E0F2F1]">{c.description}</p>
                        <p className="text-xs text-[#00BFBF] mt-1">Mitigation: {c.mitigation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {reviewResult.recommendations && reviewResult.recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[#E0F2F1] mb-3 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    Recommendations
                  </h4>
                  <div className="space-y-2">
                    {reviewResult.recommendations.map((r: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[#001A33]/30">
                        <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-[#7A8B99]">{r}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Assessment */}
              <div className="p-4 rounded-xl bg-[#001A33]/50 border border-[#00BFBF]/10">
                <p className="text-xs font-mono-data text-[#00BFBF] uppercase mb-2">Overall Assessment</p>
                <p className="text-sm text-[#E0F2F1] leading-relaxed">{reviewResult.overallAssessment}</p>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <ShieldCheck size={48} className="text-[#7A8B99]/30 mb-4" />
              <p className="text-[#E0F2F1] font-medium">Select a document to audit</p>
              <p className="text-sm text-[#7A8B99] mt-1">Run a comprehensive ethical AI review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
