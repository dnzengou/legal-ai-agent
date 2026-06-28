import { useState, useEffect } from "react";
import { X, Keyboard } from "lucide-react";

const shortcuts = [
  { key: "CMD + K", action: "Open global search" },
  { key: "?", action: "Show keyboard shortcuts" },
  { key: "ESC", action: "Close any overlay / dialog" },
  { key: "G then D", action: "Go to Dashboard" },
  { key: "G then C", action: "Go to Contract Review" },
  { key: "G then F", action: "Go to Documents" },
  { key: "G then A", action: "Go to AI Analysis" },
  { key: "G then E", action: "Go to Ethics Review" },
  { key: "G then S", action: "Go to Settings" },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Navigation shortcuts: G then letter
  useEffect(() => {
    let gPressed = false;
    const navMap: Record<string, string> = {
      d: "/dashboard", c: "/contract-review", f: "/documents",
      a: "/analysis", n: "/contracts", p: "/precedents",
      j: "/judgments", e: "/ethics", m: "/ai-engines", s: "/settings",
    };
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "g" && !gPressed) { gPressed = true; setTimeout(() => { gPressed = false; }, 800); return; }
      if (gPressed && navMap[e.key]) { window.location.href = navMap[e.key]; gPressed = false; }
      gPressed = false;
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-[#00BFBF]/20 bg-[#001A33]/95 backdrop-blur-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#00BFBF]/10">
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-[#00BFBF]" />
            <h3 className="text-sm font-semibold text-[#E0F2F1]">Keyboard Shortcuts</h3>
          </div>
          <button onClick={() => setOpen(false)} className="p-1 rounded-lg text-[#7A8B99] hover:text-[#E0F2F1] hover:bg-[#002B52] transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 space-y-1">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#002B52]/40 transition-colors">
              <span className="text-sm text-[#E0F2F1]">{s.action}</span>
              <kbd className="px-2 py-1 rounded-lg bg-[#002B52] text-xs font-mono-data text-[#7A8B99] border border-[#00BFBF]/10">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
