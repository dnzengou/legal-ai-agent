// @ts-nocheck
import { useState } from "react";
import { trpc } from "@/providers/trpc";
import {
  Gavel,
  Loader2,
  Search,
  BookOpen,
  Calendar,
  Users,
  MessageSquare,
  Layers,
} from "lucide-react";

interface JudgmentItem {
  id: number;
  title: string;
  caseNumber: string;
  court: string;
  date: Date;
  parties: unknown;
  summary: string;
  fullText: string;
  holding: string;
  rhetoricLabels: unknown;
  createdAt: Date;
}

export default function Judgments() {
  const [query, setQuery] = useState("");
  const [selectedJudgment, setSelectedJudgment] = useState<JudgmentItem | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [labeling, setLabeling] = useState(false);
  type SummaryData = { summary: string; keyHoldings?: string[] };
  type LabelData = { labels: Array<{ paragraph: number; label: string; text: string }> };
  const [summaryResult, setSummaryResult] = useState<SummaryData | null>(null);
  const [labelResult, setLabelResult] = useState<LabelData | null>(null);

  const { data: judgmentsData, isLoading } = trpc.judgment.list.useQuery({ limit: 50 });
  const { data: searchResults, isFetching: searching, refetch } = trpc.judgment.search.useQuery(
    { query, limit: 20 },
    { enabled: false }
  );
  const summarizeMutation = trpc.judgment.summarize.useMutation({
    onSuccess: (data) => {
      setSummarizing(false);
      if (data && "summary" in data) setSummaryResult(data as unknown as { summary: string; keyHoldings?: string[] });
    },
  });
  const labelMutation = trpc.judgment.labelRhetoric.useMutation({
    onSuccess: (data) => {
      setLabeling(false);
      if (data && "labels" in data) setLabelResult(data as unknown as { labels: Array<{ paragraph: number; label: string; text: string }> });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    refetch();
  };

  const judgments = (searchResults && query ? searchResults : (judgmentsData?.items ?? [])) as JudgmentItem[];

  const handleSummarize = (id: number) => {
    setSummarizing(true);
    summarizeMutation.mutate({ judgmentId: id });
  };

  const handleLabel = (id: number) => {
    setLabeling(true);
    labelMutation.mutate({ judgmentId: id });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-[#E0F2F1]">Judgments</h1>
        <p className="text-[#7A8B99] mt-1 text-sm">Judgment summarization and rhetorical role labeling</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="glass-card rounded-2xl p-5">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8B99]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search judgments by title, case number, or keyword..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#001A33]/60 border border-[#00BFBF]/15 text-[#E0F2F1] text-sm placeholder:text-[#7A8B99]/50 focus:border-[#00BFBF]/50 focus:outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="px-6 py-3 rounded-xl bg-[#00BFBF] text-[#001A33] text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2 flex-shrink-0 glow-teal-hover"
          >
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Search
          </button>
        </div>
      </form>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Judgments List */}
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={28} className="text-[#00BFBF] animate-spin" />
            </div>
          ) : judgments.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <BookOpen size={48} className="text-[#7A8B99]/30 mx-auto mb-4" />
              <p className="text-[#7A8B99]">No judgments found.</p>
            </div>
          ) : (
            judgments.map((j: JudgmentItem) => (
              <button
                key={j.id}
                onClick={() => setSelectedJudgment(j)}
                className={`w-full text-left p-4 rounded-xl transition-all border ${
                  selectedJudgment?.id === j.id
                    ? "bg-[#00BFBF]/10 border-[#00BFBF]/30"
                    : "bg-[#001A33]/30 border-[#00BFBF]/5 hover:border-[#00BFBF]/15"
                }`}
              >
                <h3 className="text-sm font-medium text-[#E0F2F1]">{j.title}</h3>
                <p className="text-xs font-mono-data text-[#00BFBF] mt-1">{j.caseNumber}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-[#7A8B99]">
                  <span className="flex items-center gap-1">
                    <Gavel size={12} /> {j.court}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {new Date(j.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-[#7A8B99] mt-2 line-clamp-2">{j.summary}</p>
              </button>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div>
          {selectedJudgment ? (
            <div className="glass-card rounded-2xl p-6 space-y-5 animate-fade-in">
              <div>
                <h2 className="text-lg font-semibold text-[#E0F2F1]">{selectedJudgment.title}</h2>
                <p className="text-sm font-mono-data text-[#00BFBF] mt-1">{selectedJudgment.caseNumber}</p>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-[#7A8B99]">
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#001A33]/50">
                  <Gavel size={12} /> {selectedJudgment.court}
                </span>
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#001A33]/50">
                  <Calendar size={12} /> {new Date(selectedJudgment.date).toLocaleDateString()}
                </span>
                {selectedJudgment.parties != null ? (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#001A33]/50">
                    <Users size={12} />
                    {typeof selectedJudgment.parties === "string"
                      ? selectedJudgment.parties
                      : `${(selectedJudgment.parties as Record<string, string>).plaintiff} v. ${(selectedJudgment.parties as Record<string, string>).defendant}`}
                  </span>
                ) : null}
              </div>

              <div className="p-4 rounded-xl bg-[#001A33]/50 border-l-2 border-[#00BFBF]">
                <p className="text-xs font-mono-data text-[#7A8B99] uppercase mb-1">Holding</p>
                <p className="text-sm text-[#E0F2F1] leading-relaxed">{selectedJudgment.holding}</p>
              </div>

              <p className="text-sm text-[#7A8B99] leading-relaxed">{selectedJudgment.summary}</p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSummarize(selectedJudgment.id)}
                  disabled={summarizing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00BFBF]/15 text-[#00BFBF] text-xs font-medium hover:bg-[#00BFBF]/25 transition-colors border border-[#00BFBF]/20 disabled:opacity-50"
                >
                  {summarizing ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                  AI Summarize
                </button>
                <button
                  onClick={() => handleLabel(selectedJudgment.id)}
                  disabled={labeling}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#002B52] text-[#E0F2F1] text-xs font-medium hover:bg-[#002B52]/80 transition-colors border border-[#00BFBF]/20 disabled:opacity-50"
                >
                  {labeling ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />}
                  Label Rhetoric
                </button>
              </div>

              {/* Summary Result */}
              {summaryResult != null ? (
                <div className="p-4 rounded-xl bg-[#001A33]/50 border border-[#00BFBF]/10 animate-fade-in">
                  <p className="text-xs font-mono-data text-[#00BFBF] uppercase mb-2">AI Summary</p>
                  <p className="text-sm text-[#E0F2F1]">{summaryResult.summary}</p>
                  <div className="mt-3 space-y-1">
                    {(summaryResult.keyHoldings ?? []).map((h, i) => (
                      <p key={i} className="text-xs text-[#7A8B99] pl-3 border-l border-[#00BFBF]/20">{h}</p>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Rhetoric Labels */}
              {labelResult != null ? (
                <div className="p-4 rounded-xl bg-[#001A33]/50 border border-[#00BFBF]/10 animate-fade-in">
                  <p className="text-xs font-mono-data text-[#00BFBF] uppercase mb-2">Rhetorical Role Labels</p>
                  <div className="space-y-2">
                    {labelResult.labels.map((l, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-xs font-mono-data text-[#7A8B99] w-6">{l.paragraph}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono-data bg-[#00BFBF]/15 text-[#00BFBF] flex-shrink-0">
                          {l.label}
                        </span>
                        <span className="text-xs text-[#7A8B99]">{l.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Stored Rhetoric Labels */}
              {selectedJudgment.rhetoricLabels && Array.isArray(selectedJudgment.rhetoricLabels) && (
                <div className="p-4 rounded-xl bg-[#001A33]/50 border border-[#00BFBF]/10">
                  <p className="text-xs font-mono-data text-[#00BFBF] uppercase mb-2">Stored Labels</p>
                  <div className="space-y-2">
                    {(selectedJudgment.rhetoricLabels as Array<{ paragraph: number; label: string; text: string }>).map((l, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-xs font-mono-data text-[#7A8B99] w-6">{l.paragraph}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono-data bg-[#00BFBF]/15 text-[#00BFBF] flex-shrink-0">
                          {l.label}
                        </span>
                        <span className="text-xs text-[#7A8B99]">{l.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <Gavel size={48} className="text-[#7A8B99]/30 mb-4" />
              <p className="text-[#E0F2F1] font-medium">Select a judgment</p>
              <p className="text-sm text-[#7A8B99] mt-1">View details and run AI analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
