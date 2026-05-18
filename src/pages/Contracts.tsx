import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import {
  FileSignature,
  Loader2,
  Copy,
  Check,
  Download,
  Scale,
  AlertTriangle,
  Shield,
} from "lucide-react";

const templates = [
  { value: "nda", label: "Non-Disclosure Agreement", icon: Shield },
  { value: "employment", label: "Employment Agreement", icon: FileSignature },
  { value: "service_agreement", label: "Service Agreement", icon: Scale },
  { value: "lease", label: "Commercial Lease", icon: FileSignature },
  { value: "licensing", label: "Software License", icon: Shield },
  { value: "purchase", label: "Purchase Agreement", icon: Scale },
];

const templateParams: Record<string, string[]> = {
  nda: ["partyA", "partyB", "effectiveDate", "term", "jurisdiction"],
  employment: ["employer", "employee", "position", "salary", "startDate"],
  service_agreement: ["provider", "client", "services", "fee", "term"],
  lease: ["landlord", "tenant", "premises", "term", "startDate", "rent", "deposit"],
  licensing: ["licensor", "licensee", "software", "scope", "fee"],
  purchase: ["buyer", "seller", "goods", "price", "delivery", "warranty"],
};

export default function Contracts() {
  const [selectedTemplate, setSelectedTemplate] = useState("nda");
  const [params, setParams] = useState<Record<string, string>>({});
  const [generated, setGenerated] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showAnalyze, setShowAnalyze] = useState(false);
  const [analyzeDocId, setAnalyzeDocId] = useState("");

  const generate = trpc.contract.generate.useMutation({
    onSuccess: (data) => {
      setGenerated(data);
      toast.success("Contract generated successfully");
    },
    onError: (err) => toast.error("Generation failed: " + err.message),
  });
  const analyze = trpc.contract.analyze.useMutation();
  const review = trpc.contract.review.useMutation();

  const currentParams = templateParams[selectedTemplate] ?? [];

  const handleGenerate = () => {
    generate.mutate({
      template: selectedTemplate as any,
      parameters: params,
    });
  };

  const handleCopy = () => {
    if (generated?.draft) {
      navigator.clipboard.writeText(generated.draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-[#E0F2F1]">Contract Generator</h1>
        <p className="text-[#7A8B99] mt-1 text-sm">AI-powered contract drafting and analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Template & Params */}
        <div className="lg:col-span-1 space-y-4">
          {/* Template Select */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-[#E0F2F1] mb-4">Select Template</h3>
            <div className="space-y-2">
              {templates.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    onClick={() => {
                      setSelectedTemplate(t.value);
                      setParams({});
                      setGenerated(null);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all border ${
                      selectedTemplate === t.value
                        ? "bg-[#00BFBF]/15 border-[#00BFBF]/30 text-[#E0F2F1]"
                        : "bg-transparent border-[#00BFBF]/5 text-[#7A8B99] hover:border-[#00BFBF]/15 hover:text-[#E0F2F1]"
                    }`}
                  >
                    <Icon size={18} className={selectedTemplate === t.value ? "text-[#00BFBF]" : ""} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parameters */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-[#E0F2F1] mb-4">Parameters</h3>
            <div className="space-y-3">
              {currentParams.map((param) => (
                <div key={param}>
                  <label className="text-xs font-mono-data text-[#7A8B99] uppercase tracking-wider block mb-1.5">
                    {param.replace(/([A-Z])/g, " $1").trim()}
                  </label>
                  <input
                    type="text"
                    value={params[param] ?? ""}
                    onChange={(e) => setParams((p) => ({ ...p, [param]: e.target.value }))}
                    placeholder={`Enter ${param}...`}
                    className="w-full px-3 py-2 rounded-lg bg-[#001A33]/60 border border-[#00BFBF]/15 text-[#E0F2F1] text-sm placeholder:text-[#7A8B99]/50 focus:border-[#00BFBF]/50 focus:outline-none transition-colors"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleGenerate}
              disabled={generate.isPending}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00BFBF] text-[#001A33] text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 glow-teal-hover"
            >
              {generate.isPending ? <Loader2 size={16} className="animate-spin" /> : <FileSignature size={16} />}
              Generate Contract
            </button>
          </div>
        </div>

        {/* Right Panel - Output */}
        <div className="lg:col-span-2 space-y-4">
          {generated ? (
            <>
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#00BFBF]/10">
                  <div className="flex items-center gap-2">
                    <FileSignature size={16} className="text-[#00BFBF]" />
                    <span className="text-sm font-semibold text-[#E0F2F1]">Generated Contract</span>
                    <span className="text-xs font-mono-data text-[#7A8B99] capitalize">{generated.template.replace(/_/g, " ")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#7A8B99] hover:text-[#00BFBF] hover:bg-[#00BFBF]/10 transition-colors"
                    >
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([generated.draft], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${generated.template}_contract.txt`;
                        a.click();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#7A8B99] hover:text-[#00BFBF] hover:bg-[#00BFBF]/10 transition-colors"
                    >
                      <Download size={14} />
                      Download
                    </button>
                  </div>
                </div>
                <div className="p-5 overflow-x-auto">
                  <pre className="text-sm text-[#E0F2F1] font-mono-data whitespace-pre-wrap leading-relaxed">
                    {generated.draft}
                  </pre>
                </div>
              </div>

              {/* Analysis Tools */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-[#E0F2F1] mb-4 flex items-center gap-2">
                  <Scale size={16} className="text-[#FF6B35]" />
                  Contract Analysis Tools
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowAnalyze(!showAnalyze)}
                    className="px-4 py-2 rounded-xl bg-[#FF6B35]/15 text-[#FF6B35] text-xs font-medium hover:bg-[#FF6B35]/25 transition-colors border border-[#FF6B35]/20"
                  >
                    Deep Contract Analysis
                  </button>
                </div>

                {showAnalyze && (
                  <div className="mt-4 space-y-3 animate-fade-in">
                    <input
                      type="text"
                      value={analyzeDocId}
                      onChange={(e) => setAnalyzeDocId(e.target.value)}
                      placeholder="Enter document ID..."
                      className="w-full px-3 py-2 rounded-lg bg-[#001A33]/60 border border-[#00BFBF]/15 text-[#E0F2F1] text-sm placeholder:text-[#7A8B99]/50 focus:border-[#00BFBF]/50 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (analyzeDocId) analyze.mutate({ documentId: Number(analyzeDocId) });
                        }}
                        disabled={analyze.isPending || !analyzeDocId}
                        className="px-4 py-2 rounded-lg bg-[#00BFBF] text-[#001A33] text-xs font-semibold hover:brightness-110 disabled:opacity-50"
                      >
                        {analyze.isPending ? "Analyzing..." : "Analyze Clauses"}
                      </button>
                      <button
                        onClick={() => {
                          if (analyzeDocId) review.mutate({ documentId: Number(analyzeDocId) });
                        }}
                        disabled={review.isPending || !analyzeDocId}
                        className="px-4 py-2 rounded-lg bg-[#002B52] text-[#E0F2F1] text-xs font-medium border border-[#00BFBF]/20 hover:border-[#00BFBF]/40 disabled:opacity-50"
                      >
                        {review.isPending ? "Reviewing..." : "Risk Review"}
                      </button>
                    </div>
                  </div>
                )}

                {analyze.data && (
                  <div className="mt-4 p-4 rounded-xl bg-[#001A33]/50 border border-[#00BFBF]/10 animate-fade-in">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={16} className="text-[#FF6B35]" />
                      <span className="text-sm font-medium text-[#E0F2F1]">Risk Score: {analyze.data.result?.riskScore}/10</span>
                    </div>
                    {analyze.data.result?.clauses?.map((c: any, i: number) => (
                      <div key={i} className="mb-2 p-2 rounded-lg bg-[#002B52]/50">
                        <span className={`text-[10px] font-mono-data uppercase px-1.5 py-0.5 rounded ${
                          c.risk === "high" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"
                        }`}>{c.risk}</span>
                        <p className="text-xs text-[#7A8B99] mt-1">{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {review.data && (
                  <div className="mt-4 p-4 rounded-xl bg-[#001A33]/50 border border-[#00BFBF]/10 animate-fade-in">
                    <p className="text-sm font-medium text-[#E0F2F1] mb-2">Risk Assessment: {review.data.riskAssessment.overallRisk}/10</p>
                    {review.data.riskAssessment.categories.map((cat: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-[#7A8B99] w-24">{cat.name}</span>
                        <div className="flex-1 h-1.5 bg-[#002B52] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${cat.score * 10}%`,
                            backgroundColor: cat.level === "high" ? "#FF6B35" : "#00BFBF",
                          }} />
                        </div>
                        <span className="text-xs font-mono-data text-[#7A8B99] w-8">{cat.score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <FileSignature size={48} className="text-[#7A8B99]/30 mb-4" />
              <p className="text-[#E0F2F1] font-medium">Select a template and fill parameters</p>
              <p className="text-sm text-[#7A8B99] mt-1">Your generated contract will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
