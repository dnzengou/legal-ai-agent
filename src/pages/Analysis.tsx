import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import {
  Brain,
  Loader2,
  Play,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Download,
} from "lucide-react";

const analysisTypes = [
  { value: "contract_review", label: "Contract Review", desc: "Analyze clauses, risks, obligations" },
  { value: "judgment_summary", label: "Judgment Summary", desc: "Extract holdings and key facts" },
  { value: "statute_identification", label: "Statute ID", desc: "Identify relevant statutes" },
  { value: "risk_assessment", label: "Risk Assessment", desc: "Evaluate overall legal risk" },
  { value: "precedent_search", label: "Precedent Search", desc: "Find relevant case law" },
  { value: "compliance_check", label: "Compliance Check", desc: "Check regulatory compliance" },
  { value: "sentiment_analysis", label: "Sentiment Analysis", desc: "Analyze document tone" },
  { value: "ethical_review", label: "Ethical Review", desc: "AI ethics and bias review" },
];

export default function Analysis() {
  const [selectedDoc, setSelectedDoc] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState("contract_review");
  const [activeResult, setActiveResult] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: docsData } = trpc.document.list.useQuery({ limit: 50 });
  const { data: analysesData, isLoading: analysesLoading } = trpc.analysis.list.useQuery({ limit: 50 });
  const createAnalysis = trpc.analysis.create.useMutation({
    onSuccess: (data) => {
      utils.analysis.list.invalidate();
      toast.success("Analysis completed successfully");
      if (data.status === "completed") {
        utils.analysis.getById.fetch({ id: data.id }).then((res) => {
          if (res) setActiveResult(res);
        });
      }
    },
    onError: (err) => toast.error("Analysis failed: " + err.message),
  });

  const documents = docsData?.items ?? [];
  const analyses = analysesData?.items ?? [];

  const handleRunAnalysis = () => {
    if (!selectedDoc) return;
    setActiveResult(null);
    createAnalysis.mutate({ documentId: selectedDoc, type: selectedType as any });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-[#E0F2F1]">AI Analysis</h1>
        <p className="text-[#7A8B99] mt-1 text-sm">Multi-agent CoT legal document analysis engine</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[#E0F2F1] flex items-center gap-2">
              <Brain size={16} className="text-[#00BFBF]" />
              Analysis Configuration
            </h3>

            {/* Document Select */}
            <div>
              <label className="text-xs font-mono-data text-[#7A8B99] uppercase tracking-wider block mb-2">
                Select Document
              </label>
              <select
                value={selectedDoc ?? ""}
                onChange={(e) => setSelectedDoc(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-[#001A33]/60 border border-[#00BFBF]/15 text-[#E0F2F1] text-sm focus:border-[#00BFBF]/50 focus:outline-none transition-colors"
              >
                <option value="" className="bg-[#002B52]">Choose a document...</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id} className="bg-[#002B52]">
                    {doc.title}
                  </option>
                ))}
              </select>
              {documents.length === 0 && (
                <p className="text-xs text-[#7A8B99] mt-2">
                  No documents available. <a href="/documents" className="text-[#00BFBF]">Upload one first.</a>
                </p>
              )}
            </div>

            {/* Analysis Type */}
            <div>
              <label className="text-xs font-mono-data text-[#7A8B99] uppercase tracking-wider block mb-2">
                Analysis Type
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {analysisTypes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setSelectedType(t.value)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all border ${
                      selectedType === t.value
                        ? "bg-[#00BFBF]/15 border-[#00BFBF]/30 text-[#E0F2F1]"
                        : "bg-transparent border-[#00BFBF]/5 text-[#7A8B99] hover:border-[#00BFBF]/15 hover:text-[#E0F2F1]"
                    }`}
                  >
                    <span className="font-medium block">{t.label}</span>
                    <span className="text-[10px] opacity-70">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunAnalysis}
              disabled={!selectedDoc || createAnalysis.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#00BFBF] text-[#001A33] text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-teal-hover"
            >
              {createAnalysis.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  CoT Processing...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Run Analysis
                </>
              )}
            </button>
          </div>

          {/* Recent Analyses */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-[#E0F2F1] mb-3">History</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {analysesLoading ? (
                <Loader2 size={20} className="text-[#00BFBF] animate-spin mx-auto" />
              ) : analyses.length === 0 ? (
                <p className="text-xs text-[#7A8B99] text-center py-4">No analyses yet</p>
              ) : (
                analyses.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      if (a.result) setActiveResult(a);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                      activeResult?.id === a.id
                        ? "bg-[#00BFBF]/15 border border-[#00BFBF]/20"
                        : "hover:bg-[#001A33]/50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {a.status === "completed" ? (
                        <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                      ) : a.status === "failed" ? (
                        <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                      ) : (
                        <Loader2 size={14} className="text-amber-400 animate-spin flex-shrink-0" />
                      )}
                      <span className="text-xs font-medium text-[#E0F2F1] truncate">
                        {String(a.type).replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#7A8B99] truncate mt-0.5 pl-5">{a.summary ?? "Processing..."}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {createAnalysis.isPending && !activeResult ? (
            <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full border-2 border-[#00BFBF]/20 flex items-center justify-center">
                  <Brain size={28} className="text-[#00BFBF]" />
                </div>
                <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-t-[#00BFBF] animate-spin" />
              </div>
              <p className="text-[#E0F2F1] font-medium">CoT Multi-Agent Processing</p>
              <p className="text-sm text-[#7A8B99] mt-1">Parser → Identifier → Risk Analyst → Summarizer → Ethics</p>
              <div className="flex items-center gap-2 mt-4">
                <span className="w-2 h-2 rounded-full bg-[#00BFBF] animate-pulse" />
                <span className="text-xs font-mono-data text-[#00BFBF]">Processing document through agent pipeline...</span>
              </div>
            </div>
          ) : activeResult ? (
            <AnalysisResult result={activeResult} />
          ) : (
            <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <BarChart3 size={48} className="text-[#7A8B99]/30 mb-4" />
              <p className="text-[#E0F2F1] font-medium">Select a document and analysis type</p>
              <p className="text-sm text-[#7A8B99] mt-1">Results will appear here after processing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnalysisResult({ result }: { result: any }) {
  const type = result.type;
  const data = result.result ?? {};

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#00BFBF]/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <h3 className="text-lg font-semibold text-[#E0F2F1]">
              {String(type).replace(/_/g, " ").toUpperCase()}
            </h3>
          </div>
          <p className="text-sm text-[#7A8B99] mt-1">{result.summary}</p>
        </div>
        <div className="flex items-center gap-3">
          {result.confidence && (
            <div className="text-xs font-mono-data">
              <span className="text-[#7A8B99]">Confidence: </span>
              <span className="text-[#00BFBF]">{(Number(result.confidence) * 100).toFixed(1)}%</span>
            </div>
          )}
          {result.processingTime && (
            <div className="text-xs font-mono-data text-[#7A8B99]">
              {(result.processingTime / 1000).toFixed(2)}s
            </div>
          )}
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(result.result, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${type}_analysis.json`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success("Analysis exported as JSON");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#7A8B99] hover:text-[#00BFBF] hover:bg-[#00BFBF]/10 transition-colors border border-[#00BFBF]/10"
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* Content based on type */}
      {type === "contract_review" && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[#001A33]/50">
            <span className="text-xs font-mono-data text-[#7A8B99]">Risk Score</span>
            <span className="text-2xl font-semibold" style={{
              color: data.riskScore > 7 ? "#FF6B35" : data.riskScore > 4 ? "#E0F2F1" : "#00BFBF"
            }}>
              {data.riskScore}/10
            </span>
          </div>
          {data.clauses?.map((clause: any, i: number) => (
            <div key={i} className="p-4 rounded-xl bg-[#001A33]/30 border border-[#00BFBF]/5">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono-data uppercase ${
                  clause.risk === "high" ? "bg-red-500/15 text-red-400" :
                  clause.risk === "medium" ? "bg-amber-500/15 text-amber-400" :
                  "bg-emerald-500/15 text-emerald-400"
                }`}>{clause.risk}</span>
                <span className="text-xs font-medium text-[#E0F2F1] capitalize">{clause.type}</span>
              </div>
              <p className="text-sm text-[#7A8B99]">{clause.text}</p>
              <p className="text-xs text-[#00BFBF] mt-1">{clause.recommendation}</p>
            </div>
          ))}
        </div>
      )}

      {type === "judgment_summary" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#001A33]/50 border-l-2 border-[#00BFBF]">
            <p className="text-xs font-mono-data text-[#7A8B99] uppercase mb-1">Holding</p>
            <p className="text-sm text-[#E0F2F1]">{data.holding}</p>
          </div>
          {data.keyFacts && (
            <div>
              <p className="text-xs font-mono-data text-[#7A8B99] uppercase mb-2">Key Facts</p>
              {data.keyFacts.map((fact: string, i: number) => (
                <p key={i} className="text-sm text-[#7A8B99] pl-3 border-l border-[#00BFBF]/20 mb-1">{fact}</p>
              ))}
            </div>
          )}
          {data.legalPrinciples && (
            <div>
              <p className="text-xs font-mono-data text-[#7A8B99] uppercase mb-2">Legal Principles</p>
              {data.legalPrinciples.map((p: string, i: number) => (
                <p key={i} className="text-sm text-[#7A8B99] pl-3 border-l border-[#00BFBF]/20 mb-1">{p}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {type === "risk_assessment" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#001A33]/50">
            <span className="text-xs font-mono-data text-[#7A8B99]">Overall Risk: </span>
            <span className="text-xl font-semibold" style={{
              color: data.overallRisk > 7 ? "#FF6B35" : data.overallRisk > 4 ? "#E0F2F1" : "#00BFBF"
            }}>{data.overallRisk}/10</span>
          </div>
          {data.categories?.map((cat: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-sm text-[#E0F2F1] w-28">{cat.name}</span>
              <div className="flex-1 h-2 bg-[#001A33] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${cat.score * 10}%`,
                    backgroundColor: cat.level === "high" ? "#FF6B35" : cat.level === "medium" ? "#E0F2F1" : "#00BFBF",
                  }}
                />
              </div>
              <span className="text-xs font-mono-data text-[#7A8B99] w-12 text-right">{cat.score}</span>
            </div>
          ))}
        </div>
      )}

      {type === "statute_identification" && (
        <div className="space-y-3">
          {data.statutes?.map((s: any, i: number) => (
            <div key={i} className="p-4 rounded-xl bg-[#001A33]/30 border border-[#00BFBF]/5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono-data text-[#00BFBF]">{s.code}</span>
                <span className="text-xs text-[#7A8B99]">({(s.relevance * 100).toFixed(0)}% match)</span>
              </div>
              <p className="text-sm font-medium text-[#E0F2F1]">{s.title}</p>
              <p className="text-xs text-[#7A8B99] mt-1">{s.context}</p>
            </div>
          ))}
        </div>
      )}

      {type === "ethical_review" && (
        <div className="space-y-4">
          {data.scores && (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(data.scores).map(([key, val]: [string, any]) => (
                <div key={key} className="p-3 rounded-xl bg-[#001A33]/50 text-center">
                  <p className="text-xs font-mono-data text-[#7A8B99] uppercase">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                  <p className="text-xl font-semibold mt-1" style={{
                    color: Number(val) > 7 ? "#00BFBF" : Number(val) > 5 ? "#E0F2F1" : "#FF6B35"
                  }}>{val}/10</p>
                </div>
              ))}
            </div>
          )}
          {data.concerns?.map((c: any, i: number) => (
            <div key={i} className="p-3 rounded-xl bg-[#001A33]/30 border border-[#00BFBF]/5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono-data uppercase ${
                c.severity === "high" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"
              }`}>{c.severity}</span>
              <p className="text-sm text-[#E0F2F1] mt-1">{c.description}</p>
              <p className="text-xs text-[#00BFBF] mt-1">{c.mitigation}</p>
            </div>
          ))}
        </div>
      )}

      {/* Generic fallback for other types */}
      {!["contract_review", "judgment_summary", "risk_assessment", "statute_identification", "ethical_review"].includes(type) && (
        <pre className="text-xs text-[#7A8B99] font-mono-data overflow-x-auto p-4 rounded-xl bg-[#001A33]/50">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
