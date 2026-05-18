import { useState } from "react";
import { trpc } from "@/providers/trpc";
import {
  Search,
  Loader2,
  BookOpen,
  Calendar,
  MapPin,
  Scale,
  Tag,
} from "lucide-react";

interface PrecedentItem {
  id: number;
  title: string;
  citation: string;
  court: string;
  date: Date;
  jurisdiction: string;
  summary: string;
  tags: unknown;
  relevanceScore: string | number;
}

export default function Precedents() {
  const [query, setQuery] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");

  const { data: allPrecedents } = trpc.precedent.list.useQuery({ limit: 20 });
  const { data: searchResults, isFetching: searching, refetch } = trpc.precedent.search.useQuery(
    { query, jurisdiction: jurisdiction || undefined, limit: 20 },
    { enabled: false }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    refetch();
  };

  const displayResults: PrecedentItem[] = searchResults && query
    ? (searchResults as PrecedentItem[])
    : ((allPrecedents?.items ?? []) as PrecedentItem[]);

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-[#E0F2F1]">Precedent Search</h1>
        <p className="text-[#7A8B99] mt-1 text-sm">Intelligent case law search with relevance scoring</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="glass-card rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8B99]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search precedents by keyword, citation, or topic..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#001A33]/60 border border-[#00BFBF]/15 text-[#E0F2F1] text-sm placeholder:text-[#7A8B99]/50 focus:border-[#00BFBF]/50 focus:outline-none transition-colors"
            />
          </div>
          <select
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#001A33]/60 border border-[#00BFBF]/15 text-[#E0F2F1] text-sm focus:border-[#00BFBF]/50 focus:outline-none"
          >
            <option value="" className="bg-[#002B52]">All Jurisdictions</option>
            <option value="Federal" className="bg-[#002B52]">Federal</option>
            <option value="State" className="bg-[#002B52]">State</option>
            <option value="International" className="bg-[#002B52]">International</option>
          </select>
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

      {/* Results */}
      <div className="space-y-4">
        {displayResults.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <BookOpen size={48} className="text-[#7A8B99]/30 mx-auto mb-4" />
            <p className="text-[#7A8B99]">
              {searching ? "Searching..." : "No precedents found. Try a different search."}
            </p>
          </div>
        ) : (
          displayResults.map((p) => {
            const relevanceNum = p.relevanceScore ? Number(p.relevanceScore) : 0;
            const tagsArr = p.tags && Array.isArray(p.tags) ? (p.tags as string[]) : [];
            return (
              <div key={p.id} className="glass-card rounded-2xl p-6 hover:border-[#00BFBF]/20 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#00BFBF]/10 flex items-center justify-center flex-shrink-0">
                    <Scale size={18} className="text-[#00BFBF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-[#E0F2F1]">{p.title}</h3>
                    <p className="text-sm font-mono-data text-[#00BFBF] mt-1">{p.citation}</p>

                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[#7A8B99]">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {p.court}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(p.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag size={12} />
                        {p.jurisdiction}
                      </span>
                    </div>

                    <p className="text-sm text-[#7A8B99] mt-3 leading-relaxed">{p.summary}</p>

                    {tagsArr.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {tagsArr.map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-mono-data bg-[#002B52] text-[#7A8B99] border border-[#00BFBF]/10">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {relevanceNum > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs font-mono-data text-[#7A8B99]">Relevance:</span>
                        <div className="w-24 h-1.5 bg-[#002B52] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#00BFBF] rounded-full"
                            style={{ width: String(relevanceNum * 10) + "%" }}
                          />
                        </div>
                        <span className="text-xs font-mono-data text-[#00BFBF]">{relevanceNum.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
