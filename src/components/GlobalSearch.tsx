import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Search, Command, X, FileText, Shield, Brain, FileSignature,
  Gavel, ShieldCheck, Search as SearchIcon, Cpu, Settings,
  ArrowRight,
} from "lucide-react";
import { trpc } from "@/providers/trpc";

const navActions = [
  { label: "Dashboard", path: "/dashboard", icon: Command, shortcut: "G D" },
  { label: "Contract Review", path: "/contract-review", icon: Shield, shortcut: "G C" },
  { label: "Documents", path: "/documents", icon: FileText, shortcut: "G F" },
  { label: "AI Analysis", path: "/analysis", icon: Brain, shortcut: "G A" },
  { label: "Contract Generator", path: "/contracts", icon: FileSignature, shortcut: "G N" },
  { label: "Precedents", path: "/precedents", icon: SearchIcon, shortcut: "G P" },
  { label: "Judgments", path: "/judgments", icon: Gavel, shortcut: "G J" },
  { label: "Ethics Review", path: "/ethics", icon: ShieldCheck, shortcut: "G E" },
  { label: "AI Engines", path: "/ai-engines", icon: Cpu, shortcut: "G M" },
  { label: "Settings", path: "/settings", icon: Settings, shortcut: "G S" },
];

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data: docResults } = trpc.document.list.useQuery(
    { limit: 5 },
    { enabled: open && query.length > 0 }
  );

  // CMD+K / CTRL+K toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIdx(0);
    }
  }, [open]);

  const filteredNav = navActions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  const docItems = docResults?.items.filter((d) =>
    d.title.toLowerCase().includes(query.toLowerCase())
  ) ?? [];

  const allItems = [
    ...filteredNav.map((a) => ({ type: "nav" as const, ...a })),
    ...docItems.map((d) => ({ type: "doc" as const, label: d.title, id: d.id, icon: FileText })),
  ];

  const handleSelect = useCallback((item: typeof allItems[0]) => {
    if (item.type === "nav") {
      navigate(item.path);
    } else {
      navigate("/documents");
    }
    setOpen(false);
  }, [navigate]);

  // Arrow key navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, allItems.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && allItems[selectedIdx]) {
        e.preventDefault();
        handleSelect(allItems[selectedIdx]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, allItems, selectedIdx, handleSelect]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl mx-4 rounded-2xl border border-[#00BFBF]/20 bg-[#001A33]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#00BFBF]/10">
          <Search size={20} className="text-[#7A8B99] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
            placeholder="Search pages, documents, features..."
            className="flex-1 bg-transparent text-[#E0F2F1] text-sm placeholder:text-[#7A8B99]/50 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded-lg bg-[#002B52] text-[10px] font-mono-data text-[#7A8B99] border border-[#00BFBF]/10">
            <Command size={10} /> K
          </kbd>
          <button onClick={() => setOpen(false)} className="p-1 rounded-lg text-[#7A8B99] hover:text-[#E0F2F1] hover:bg-[#002B52] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {filteredNav.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-[10px] font-mono-data text-[#7A8B99] uppercase tracking-wider">Pages</p>
              {filteredNav.map((item, i) => {
                const globalIdx = i;
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleSelect({ type: "nav", ...item })}
                    onMouseEnter={() => setSelectedIdx(globalIdx)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                      selectedIdx === globalIdx ? "bg-[#00BFBF]/15 text-[#00BFBF]" : "text-[#E0F2F1] hover:bg-[#002B52]/60"
                    }`}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    <span className="text-sm flex-1">{item.label}</span>
                    <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-[#002B52] text-[10px] font-mono-data text-[#7A8B99]">
                      {item.shortcut}
                    </kbd>
                    <ArrowRight size={14} className="text-[#7A8B99]" />
                  </button>
                );
              })}
            </div>
          )}

          {docItems.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[10px] font-mono-data text-[#7A8B99] uppercase tracking-wider">Documents</p>
              {docItems.map((doc, i) => {
                const globalIdx = filteredNav.length + i;
                return (
                  <button
                    key={doc.id}
                    onClick={() => handleSelect({ type: "doc", label: doc.title, id: doc.id, icon: FileText })}
                    onMouseEnter={() => setSelectedIdx(globalIdx)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                      selectedIdx === globalIdx ? "bg-[#00BFBF]/15 text-[#00BFBF]" : "text-[#E0F2F1] hover:bg-[#002B52]/60"
                    }`}
                  >
                    <FileText size={18} className="flex-shrink-0 text-[#7A8B99]" />
                    <span className="text-sm flex-1 truncate">{doc.title}</span>
                    <span className="text-[10px] font-mono-data text-[#7A8B99] capitalize">{doc.type}</span>
                  </button>
                );
              })}
            </div>
          )}

          {allItems.length === 0 && (
            <div className="py-8 text-center text-sm text-[#7A8B99]">
              No results found for "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-[#00BFBF]/10 text-[10px] text-[#7A8B99]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="px-1 rounded bg-[#002B52]">&#8593;</kbd><kbd className="px-1 rounded bg-[#002B52]">&#8595;</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1 rounded bg-[#002B52]">&#8629;</kbd> Select</span>
          </div>
          <span>{allItems.length} results</span>
        </div>
      </div>
    </div>
  );
}
