import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import {
  GitCompare, Loader2, ArrowRight, AlertTriangle,
  CheckCircle2, XCircle,
} from "lucide-react";

export default function ContractCompare() {
  const [docA, setDocA] = useState<number | null>(null);
  const [docB, setDocB] = useState<number | null>(null);
  const [result, setResult] = useState<any>(null);

  const { data: docsData } = trpc.document.list.useQuery({ limit: 50 });
  const compareMutation = trpc.contract.compare.useMutation({
    onSuccess: (data) => {
      if (data) {
        setResult(data);
        toast.success("Comparison complete");
      } else {
        toast.error("Could not compare - documents not found");
      }
    },
    onError: (err) => toast.error("Comparison failed: " + err.message),
  });

  const documents = docsData?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[#E0F2F1] mb-4 flex items-center gap-2">
          <GitCompare size={16} className="text-[#00BFBF]" />
          Compare Two Contracts
        </h3>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <label className="text-xs font-mono-data text-[#7A8B99] uppercase block mb-1">Contract A</label>
            <select value={docA ?? ""} onChange={(e) => setDocA(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#001A33]/60 border border-[#00BFBF]/15 text-[#E0F2F1] text-sm focus:border-[#00BFBF]/50 focus:outline-none">
              <option value="" className="bg-[#002B52]">Select contract A...</option>
              {documents.map((d) => <option key={d.id} value={d.id} className="bg-[#002B52]">{d.title}</option>)}
            </select>
          </div>
          <ArrowRight size={20} className="text-[#7A8B99] hidden sm:block" />
          <div className="flex-1 w-full">
            <label className="text-xs font-mono-data text-[#7A8B99] uppercase block mb-1">Contract B</label>
            <select value={docB ?? ""} onChange={(e) => setDocB(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#001A33]/60 border border-[#00BFBF]/15 text-[#E0F2F1] text-sm focus:border-[#00BFBF]/50 focus:outline-none">
              <option value="" className="bg-[#002B52]">Select contract B...</option>
              {documents.map((d) => <option key={d.id} value={d.id} className="bg-[#002B52]">{d.title}</option>)}
            </select>
          </div>
          <button onClick={() => { if (docA && docB) compareMutation.mutate({ docA, docB }); }}
            disabled={!docA || !docB || compareMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00BFBF] text-[#001A33] text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 flex-shrink-0 glow-teal-hover">
            {compareMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <GitCompare size={16} />}
            Compare
          </button>
        </div>
      </div>

      {result && (
        <div className="glass-card rounded-2xl p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#E0F2F1]">Comparison Results</h3>
            <span className="text-xs font-mono-data text-[#7A8B99]">{result.differences.length} changes found</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-[#001A33]/50 text-center">
              <p className="text-xs text-[#7A8B99]">{result.docA.title}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#001A33]/50 text-center">
              <p className="text-xs text-[#7A8B99]">{result.docB.title}</p>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {result.differences.map((diff: any, i: number) => (
              <div key={i} className="grid grid-cols-5 gap-2 p-3 rounded-xl bg-[#001A33]/30 border border-[#00BFBF]/5 items-center">
                <span className="text-xs font-mono-data text-[#7A8B99] capitalize col-span-1">{diff.field.replace(/_/g, " ")}</span>
                <span className="text-sm text-[#E0F2F1] text-center col-span-1">{diff.docA}</span>
                <div className="flex items-center justify-center col-span-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono-data uppercase ${
                    diff.change === "reduced" ? "bg-red-500/15 text-red-400" :
                    diff.change === "increased" ? "bg-emerald-500/15 text-emerald-400" :
                    "bg-amber-500/15 text-amber-400"
                  }`}>{diff.change}</span>
                </div>
                <span className="text-sm text-[#E0F2F1] text-center col-span-1">{diff.docB}</span>
                <div className="flex items-center justify-center col-span-1">
                  {diff.change === "reduced" ? <XCircle size={14} className="text-red-400" /> :
                   diff.change === "increased" ? <CheckCircle2 size={14} className="text-emerald-400" /> :
                   <AlertTriangle size={14} className="text-amber-400" />}
                </div>
              </div>
            ))}
          </div>

          {result.addedClauses.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-mono-data text-emerald-400 uppercase mb-2">Added in B</p>
              {result.addedClauses.map((c: string, i: number) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span className="text-sm text-[#E0F2F1]">{c}</span>
                </div>
              ))}
            </div>
          )}

          {result.removedClauses.length > 0 && (
            <div>
              <p className="text-xs font-mono-data text-red-400 uppercase mb-2">Removed in B</p>
              {result.removedClauses.map((c: string, i: number) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5">
                  <XCircle size={14} className="text-red-400" />
                  <span className="text-sm text-[#E0F2F1]">{c}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
