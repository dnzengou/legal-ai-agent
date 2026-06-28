import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import {
  Layers, AlertTriangle, CheckCircle2, Shield, TrendingDown,
  ChevronDown, ChevronUp, Loader2, Plus, Trash2, Zap,
} from "lucide-react";

const DEMO_CONTRACTS = [
  {
    title: "Vendor SaaS Agreement",
    content: `This Master Service Agreement is between Acme Corp and CloudVendor Inc. Services include cloud hosting and software tools. Payment Net-30. Indemnification covers any and all claims without limitation of liability. Auto-renews annually unless cancelled 90 days before renewal. Vendor may assign agreement to subsidiaries without consent. No IP ownership clause specified. No data protection provisions.`,
  },
  {
    title: "NDA with Contractor",
    content: `This Non-Disclosure Agreement between Acme Corp and John Smith establishes mutual confidentiality obligations. Confidential Information defined broadly. Obligations survive for 3 years post-termination. Liability cap of $10,000. IP ownership assigned to Acme Corp upon full payment. Governing law Delaware. Arbitration for disputes. Force majeure clause included. GDPR compliant data handling provisions. No auto-renewal.`,
  },
  {
    title: "Office Lease",
    content: `Commercial lease agreement for 2,000 sq ft office space. Monthly rent $5,000. 3-year term. Landlord may terminate with 30 days notice for any reason. Tenant responsible for all repairs including structural. No subletting without consent. Rent increases 5% annually. Security deposit non-refundable. Tenant indemnifies landlord for any and all losses without limitation. No limitation of liability clause.`,
  },
];

type BatchResult = {
  id: number;
  contractCount: number;
  results: Array<{
    index: number;
    title: string;
    contractType: string;
    safetyScore: number;
    letterGrade: string;
    riskLevel: "low" | "medium" | "high" | "critical";
    missingProtections: string[];
    identifiedRisks: string[];
    priorityActions: string[];
    recommendation: string;
    wordCount: number;
  }>;
  patterns: {
    portfolioScore: number;
    portfolioGrade: string;
    scoreRange: { min: number; max: number };
    lowestRiskContract: { title: string; score: number };
    highestRiskContract: { title: string; score: number };
    commonGaps: Array<{ flag: string; occurrences: number; contracts: string[] }>;
    criticalContracts: Array<{ title: string; score: number; grade: string }>;
    reviewOrder: string[];
    summary: string;
  };
  processingTime: number;
};

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

function scoreBg(score: number) {
  if (score >= 80) return "bg-emerald-500/10 border-emerald-500/20";
  if (score >= 60) return "bg-yellow-500/10 border-yellow-500/20";
  if (score >= 40) return "bg-orange-500/10 border-orange-500/20";
  return "bg-red-500/10 border-red-500/20";
}

function riskBadge(level: string) {
  const map: Record<string, string> = {
    low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    high: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    critical: "bg-red-500/15 text-red-400 border-red-500/20",
  };
  return map[level] ?? map.medium;
}

function ScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#34d399" : score >= 60 ? "#facc15" : score >= 40 ? "#fb923c" : "#f87171";
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle cx="48" cy="48" r="36" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      <div className="text-center">
        <div className={`text-xl font-bold ${scoreColor(score)}`}>{score}</div>
        <div className="text-[10px] text-[#7A8B99]">/ 100</div>
      </div>
    </div>
  );
}

function ContractCard({ result, rank }: { result: BatchResult["results"][0]; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`rounded-2xl border p-5 ${scoreBg(result.safetyScore)} transition-all duration-200`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#001A33] border border-[#00BFBF]/20 flex items-center justify-center">
          <span className="text-xs font-bold text-[#00BFBF]">#{rank}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-semibold text-[#E0F2F1] truncate">{result.title}</h3>
              <p className="text-xs text-[#7A8B99] mt-0.5">{result.contractType} · {result.wordCount} words</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${riskBadge(result.riskLevel)}`}>
                {result.riskLevel.toUpperCase()}
              </span>
              <span className={`text-lg font-bold ${scoreColor(result.safetyScore)}`}>
                {result.letterGrade}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <ScoreGauge score={result.safetyScore} />
            <div className="flex-1 space-y-1">
              {result.priorityActions.slice(0, 2).map((action, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-[#7A8B99]">
                  <AlertTriangle size={12} className="text-orange-400 flex-shrink-0 mt-0.5" />
                  <span>{action}</span>
                </div>
              ))}
              <p className="text-xs text-[#00BFBF] mt-1 italic">{result.recommendation}</p>
            </div>
          </div>

          <button onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-xs text-[#7A8B99] hover:text-[#00BFBF] transition-colors">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? "Hide details" : "Show full analysis"}
          </button>

          {expanded && (
            <div className="mt-4 space-y-4 border-t border-white/5 pt-4">
              {result.missingProtections.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[#E0F2F1] mb-2">Missing Protections</h4>
                  <ul className="space-y-1">
                    {result.missingProtections.map((p, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-red-400">
                        <AlertTriangle size={11} className="flex-shrink-0" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.identifiedRisks.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[#E0F2F1] mb-2">Risk Signals</h4>
                  <ul className="space-y-1">
                    {result.identifiedRisks.map((r, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-orange-400">
                        <Shield size={11} className="flex-shrink-0" /> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BatchReview() {
  const [contracts, setContracts] = useState(DEMO_CONTRACTS.map(c => ({ ...c })));
  const [result, setResult] = useState<BatchResult | null>(null);

  const demoMutation = trpc.batchReview.demo.useMutation({
    onSuccess: (data) => setResult(data as BatchResult),
    onError: (err) => toast.error(err.message),
  });

  function addContract() {
    if (contracts.length >= 10) return toast.error("Maximum 10 contracts per batch");
    setContracts(prev => [...prev, { title: `Contract ${prev.length + 1}`, content: "" }]);
  }

  function removeContract(i: number) {
    if (contracts.length <= 2) return toast.error("Minimum 2 contracts required");
    setContracts(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateContract(i: number, field: "title" | "content", val: string) {
    setContracts(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));
  }

  function runBatch() {
    const valid = contracts.filter(c => c.title.trim() && c.content.trim().length >= 50);
    if (valid.length < 2) return toast.error("At least 2 contracts with 50+ characters of content required");
    demoMutation.mutate({ contracts: valid });
  }

  const isLoading = demoMutation.isPending;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[#00BFBF]/10 border border-[#00BFBF]/20 flex items-center justify-center">
              <Layers className="w-5 h-5 text-[#00BFBF]" />
            </div>
            <h1 className="text-2xl font-semibold text-[#E0F2F1]">Batch Review</h1>
          </div>
          <p className="text-sm text-[#7A8B99]">
            Analyze 2–10 contracts simultaneously. All agents fire in parallel — ranked by risk.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#7A8B99] bg-[#002B52]/60 border border-[#00BFBF]/10 rounded-xl px-3 py-2">
          <Zap size={14} className="text-[#00BFBF]" />
          <span>{contracts.length} contract{contracts.length !== 1 ? "s" : ""} queued</span>
        </div>
      </div>

      {/* Contract input grid */}
      <div className="space-y-4">
        {contracts.map((c, i) => (
          <div key={i} className="bg-[#002B52]/40 border border-[#00BFBF]/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-[#00BFBF]/15 border border-[#00BFBF]/20 flex items-center justify-center text-xs font-bold text-[#00BFBF] flex-shrink-0">
                {i + 1}
              </span>
              <input
                value={c.title}
                onChange={e => updateContract(i, "title", e.target.value)}
                placeholder="Contract title..."
                className="flex-1 bg-transparent text-sm font-medium text-[#E0F2F1] placeholder-[#7A8B99] outline-none border-b border-[#00BFBF]/10 focus:border-[#00BFBF]/40 pb-1 transition-colors"
              />
              <button onClick={() => removeContract(i)}
                className="p-1.5 rounded-lg text-[#7A8B99] hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
            <textarea
              value={c.content}
              onChange={e => updateContract(i, "content", e.target.value)}
              placeholder="Paste contract text here (minimum 50 characters)..."
              rows={4}
              className="w-full bg-[#001A33]/60 border border-[#00BFBF]/10 rounded-xl text-xs text-[#E0F2F1] placeholder-[#7A8B99] resize-none p-3 outline-none focus:border-[#00BFBF]/30 transition-colors font-mono"
            />
            <p className="text-[10px] text-[#7A8B99] text-right">{c.content.length} chars</p>
          </div>
        ))}

        <div className="flex items-center gap-3">
          <button onClick={addContract} disabled={contracts.length >= 10}
            className="flex items-center gap-2 text-sm text-[#7A8B99] hover:text-[#00BFBF] border border-dashed border-[#00BFBF]/20 hover:border-[#00BFBF]/40 rounded-xl px-4 py-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            <Plus size={16} /> Add Contract
          </button>
          <span className="text-xs text-[#7A8B99]">{contracts.length}/10</span>
        </div>
      </div>

      {/* Run button */}
      <button onClick={runBatch} disabled={isLoading}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00BFBF] to-[#0099CC] text-[#001A33] font-semibold text-sm hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Launching {contracts.length} parallel agents...
          </>
        ) : (
          <>
            <Zap size={18} />
            Run Batch Analysis ({contracts.length} contracts)
          </>
        )}
      </button>

      {/* Results */}
      {result && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Portfolio summary */}
          <div className="bg-[#002B52]/60 border border-[#00BFBF]/15 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="w-5 h-5 text-[#00BFBF]" />
              <h2 className="text-lg font-semibold text-[#E0F2F1]">Portfolio Analysis</h2>
              <span className="ml-auto text-xs text-[#7A8B99]">
                Processed in {result.processingTime}ms
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Portfolio Score", value: `${result.patterns.portfolioScore}/100`, sub: result.patterns.portfolioGrade },
                { label: "Score Range", value: `${result.patterns.scoreRange.min}–${result.patterns.scoreRange.max}`, sub: "min–max" },
                { label: "Highest Risk", value: result.patterns.highestRiskContract.title.substring(0, 18), sub: `Score ${result.patterns.highestRiskContract.score}` },
                { label: "Critical Contracts", value: String(result.patterns.criticalContracts.length), sub: "require immediate review" },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#001A33]/60 rounded-xl p-3 border border-[#00BFBF]/10">
                  <p className="text-[10px] text-[#7A8B99] uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-base font-bold text-[#E0F2F1] truncate">{stat.value}</p>
                  <p className="text-[10px] text-[#7A8B99] truncate">{stat.sub}</p>
                </div>
              ))}
            </div>

            <p className="text-sm text-[#7A8B99]">{result.patterns.summary}</p>

            {result.patterns.commonGaps.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[#E0F2F1] mb-2">Common Gaps Across Contracts</h3>
                <div className="space-y-1.5">
                  {result.patterns.commonGaps.map((gap, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <AlertTriangle size={12} className="text-orange-400 flex-shrink-0" />
                      <span className="text-[#E0F2F1]">{gap.flag}</span>
                      <span className="text-[#7A8B99]">({gap.occurrences}/{result.contractCount} contracts)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.patterns.criticalContracts.length > 0 && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-red-400 mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle size={13} /> Critical — Do Not Sign
                </p>
                <div className="space-y-1">
                  {result.patterns.criticalContracts.map((c, i) => (
                    <p key={i} className="text-xs text-[#7A8B99]">
                      <span className="text-red-400 font-medium">{c.grade}</span> · {c.title} (score {c.score})
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Review order recommendation */}
          <div>
            <h2 className="text-sm font-semibold text-[#E0F2F1] mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#00BFBF]" />
              Recommended Review Order (highest risk first)
            </h2>
            <ol className="space-y-2">
              {result.patterns.reviewOrder.map((title, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-[#7A8B99]">
                  <span className="w-5 h-5 rounded-full bg-[#002B52] border border-[#00BFBF]/20 text-[10px] font-bold text-[#00BFBF] flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  {title}
                </li>
              ))}
            </ol>
          </div>

          {/* Individual results */}
          <div>
            <h2 className="text-sm font-semibold text-[#E0F2F1] mb-4 flex items-center gap-2">
              <Shield size={16} className="text-[#00BFBF]" />
              Individual Contract Assessments
            </h2>
            <div className="space-y-3">
              {result.results.map((r, i) => (
                <ContractCard key={r.index} result={r} rank={i + 1} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
