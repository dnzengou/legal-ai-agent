import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  Send, Paperclip, X, Copy, Download, FileText, Shield,
  BookOpen, ChevronDown, Scale, Sparkles, AlertTriangle,
  CheckCircle, RotateCcw, Loader2,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────

type Role = "user" | "assistant";

interface Citation { text: string; reference: string; }

interface Message {
  id: string;
  role: Role;
  content: string;
  intent?: string;
  citations?: Citation[];
  processingTime?: number;
  timestamp: string;
  isStreaming?: boolean;
}

interface UploadedDoc { name: string; content: string; size: number; }

type AnalysisMode =
  | "auto" | "contract_review" | "risk_assessment"
  | "compliance_check" | "plain_english" | "negotiate" | "missing_protection";

const MODES: { value: AnalysisMode; label: string }[] = [
  { value: "auto",               label: "Auto-detect" },
  { value: "contract_review",    label: "Contract Review" },
  { value: "risk_assessment",    label: "Risk Assessment" },
  { value: "compliance_check",   label: "Compliance Check" },
  { value: "plain_english",      label: "Plain English" },
  { value: "negotiate",          label: "Negotiate" },
  { value: "missing_protection", label: "Missing Protections" },
];

const QUICK_ACTIONS = [
  { icon: Shield,       label: "Review Contract",   prompt: "Review this contract for risks and issues",          color: "#f87171" },
  { icon: AlertTriangle,label: "Find Risks",        prompt: "What are the major risks in this agreement?",         color: "#fbbf24" },
  { icon: CheckCircle,  label: "Check Compliance",  prompt: "Is this contract GDPR and CCPA compliant?",           color: "#34d399" },
  { icon: BookOpen,     label: "Plain English",     prompt: "Explain this contract in plain English",              color: "#60a5fa" },
  { icon: RotateCcw,    label: "Negotiate",         prompt: "Generate counter-proposals for this contract",        color: "#c084fc" },
  { icon: Sparkles,     label: "Draft NDA",         prompt: "Generate a mutual NDA for a software partnership",   color: "#00CCCC" },
];

// ── Utilities ─────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10);

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 ** 2).toFixed(1)} MB`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Typewriter ────────────────────────────────────────────────────

function useTypewriter(text: string, active: boolean) {
  const [out, setOut] = useState("");
  const idx = useRef(0);
  useEffect(() => {
    if (!active) { setOut(text); return; }
    setOut(""); idx.current = 0;
    const speed = text.length > 800 ? 3 : text.length > 400 ? 7 : 12;
    const t = setInterval(() => {
      if (idx.current >= text.length) { clearInterval(t); return; }
      const n = Math.min(4, text.length - idx.current);
      setOut(text.slice(0, idx.current + n));
      idx.current += n;
    }, speed);
    return () => clearInterval(t);
  }, [text, active]);
  return out;
}

// ── Score Gauge ───────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(100, score)) / 100);
  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";
  const [strokeStart, strokeEnd, textColor] =
    score >= 80 ? ["#10b981", "#34d399", "#34d399"]
    : score >= 60 ? ["#f59e0b", "#fbbf24", "#fbbf24"]
    :              ["#ef4444", "#f87171", "#f87171"];

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#0b1828] border border-[#1f3044]"
      role="img" aria-label={`Contract safety score: ${score} out of 100, grade ${grade}`}>
      <div className="relative w-[78px] h-[78px] flex-shrink-0">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <defs>
            <linearGradient id={`gauge-${score}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={strokeStart} />
              <stop offset="100%" stopColor={strokeEnd} />
            </linearGradient>
          </defs>
          <circle cx="40" cy="40" r={r} stroke="#1f3044" strokeWidth="7" fill="none" />
          <circle cx="40" cy="40" r={r}
            stroke={`url(#gauge-${score})`} strokeWidth="7" fill="none"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" className="gauge-ring"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono-data text-base font-bold leading-none" style={{ color: textColor }}>{score}</span>
          <span className="text-[9px] text-[#8da4b8] mt-0.5">/100</span>
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-2xl font-bold leading-none" style={{ color: textColor }}>{grade}</span>
          <span className="text-sm font-semibold text-[#E4F5F4]">Safety Score</span>
        </div>
        <p className="text-xs text-[#8da4b8] leading-relaxed">
          {score >= 80 ? "Low risk — minor revisions recommended"
            : score >= 60 ? "Moderate risk — negotiate key clauses"
            : "High risk — major issues need attention"}
        </p>
      </div>
    </div>
  );
}

// ── Markdown renderer ─────────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[.+?\]\(.+?\))/g).map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i} className="font-semibold text-[#E4F5F4]">{p.slice(2,-2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`"))
      return <code key={i} className="font-mono-data text-xs bg-[#00CCCC]/10 text-[#00CCCC] px-1.5 py-0.5 rounded">{p.slice(1,-1)}</code>;
    const lm = p.match(/\[(.+?)\]\((.+?)\)/);
    if (lm) return <a key={i} href={lm[2]} className="text-[#00CCCC] underline underline-offset-2 hover:text-[#40E0D0] transition-colors">{lm[1]}</a>;
    return p;
  });
}

function renderMarkdown(raw: string): React.ReactNode[] {
  const lines = raw.split("\n");
  const out: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;

  function flushTable() {
    if (!tableRows.length) return;
    const [head, , ...body] = tableRows;
    out.push(
      <div key={`t${out.length}`} className="overflow-x-auto my-3 rounded-xl border border-[#1f3044]">
        <table className="w-full text-xs">
          <thead className="bg-[#0e1b2e]/80">
            <tr>{head?.map((c,i) => (
              <th key={i} className="text-left font-medium text-[#8da4b8] px-3 py-2 border-b border-[#1f3044]">{c.trim()}</th>
            ))}</tr>
          </thead>
          <tbody>
            {body.map((row,ri) => (
              <tr key={ri} className={ri % 2 ? "bg-[#0b1522]/40" : ""}>
                {row.map((c,ci) => (
                  <td key={ci} className="px-3 py-2 text-[#c5dde6] align-top border-b border-[#1a2840]/50 last:border-r-0">{c.trim()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = []; inTable = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith("|")) { inTable = true; tableRows.push(l.split("|").slice(1,-1)); continue; }
    if (inTable) flushTable();

    if      (l.startsWith("## "))  out.push(<h2 key={i} className="text-base font-semibold text-[#E4F5F4] mt-5 mb-2 first:mt-0">{l.slice(3)}</h2>);
    else if (l.startsWith("### ")) out.push(<h3 key={i} className="text-sm font-semibold text-[#00CCCC] mt-4 mb-1.5">{l.slice(4)}</h3>);
    else if (l.startsWith("---"))  out.push(<hr key={i} className="border-[#1f3044] my-4" />);
    else if (l.startsWith("- ") || l.startsWith("* "))
      out.push(<li key={i} className="text-sm text-[#c5dde6] ml-4 pl-1" style={{ listStyleType:"disc" }}>{renderInline(l.slice(2))}</li>);
    else if (/^\d+\.\s/.test(l))
      out.push(<li key={i} className="text-sm text-[#c5dde6] ml-4 pl-1" style={{ listStyleType:"decimal" }}>{renderInline(l.replace(/^\d+\.\s/,""))}</li>);
    else if (l.startsWith("> "))
      out.push(<blockquote key={i} className="border-l-2 border-[#00CCCC]/35 pl-3 italic text-[#8da4b8] my-2 text-sm">{renderInline(l.slice(2))}</blockquote>);
    else if (l.trim() === "")
      out.push(<div key={i} className="h-1.5" />);
    else
      out.push(<p key={i} className="text-sm text-[#c5dde6] leading-relaxed">{renderInline(l)}</p>);
  }
  if (inTable) flushTable();
  return out;
}

// ── Message ───────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false);
  const displayed = useTypewriter(msg.content, msg.role === "assistant" && Boolean(msg.isStreaming));
  const text = msg.isStreaming ? displayed : msg.content;

  const scoreMatch = text.match(/Safety Score.*?(\d{1,3})\s*\/\s*100/i) ?? text.match(/Score[:\s]+(\d{1,3})\s*\/\s*100/i);
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;

  function copy() { navigator.clipboard.writeText(msg.content); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  function download() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([msg.content], { type: "text/markdown" }));
    a.download = `nexus-${msg.timestamp.slice(0,10)}.md`;
    a.click();
  }

  if (msg.role === "user") {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[78%] px-4 py-3 rounded-2xl rounded-br-md
          bg-[#00CCCC]/12 border border-[#00CCCC]/20
          text-sm text-[#E4F5F4] leading-relaxed">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-start gap-3">
        {/* AI avatar */}
        <div className="w-7 h-7 rounded-lg bg-[#00CCCC]/12 border border-[#00CCCC]/22
          flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
          <Scale size={13} className="text-[#00CCCC]" />
        </div>

        <div className="flex-1 min-w-0 space-y-0.5">
          {/* Score card */}
          {score !== null && score >= 0 && score <= 100 && (
            <div className="mb-4"><ScoreGauge score={score} /></div>
          )}

          {/* Content */}
          {renderMarkdown(text)}

          {/* Cursor */}
          {msg.isStreaming && displayed.length < msg.content.length && (
            <span className="inline-block w-0.5 h-[15px] bg-[#00CCCC] animate-pulse align-middle ml-0.5" aria-hidden="true" />
          )}

          {/* Citations */}
          {msg.citations && msg.citations.length > 0 && (
            <div className="mt-3 space-y-2">
              {msg.citations.map((c, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-[#0b1828] border border-[#1f3044]">
                  <BookOpen size={12} className="text-[#8da4b8] mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-[#c5dde6]">{c.text}</p>
                    <p className="text-[10px] text-[#8da4b8] mt-0.5 font-mono-data">{c.reference}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {!msg.isStreaming && (
            <div className="flex items-center gap-1 mt-3 pt-2 border-t border-[#1a2840]/50">
              <button onClick={copy}
                className="flex items-center gap-1.5 text-[11px] text-[#8da4b8] hover:text-[#E4F5F4]
                  transition-colors px-2.5 py-1 rounded-lg hover:bg-[#1f3044]/60">
                <Copy size={11} aria-hidden="true" />{copied ? "Copied!" : "Copy"}
              </button>
              <button onClick={download}
                className="flex items-center gap-1.5 text-[11px] text-[#8da4b8] hover:text-[#E4F5F4]
                  transition-colors px-2.5 py-1 rounded-lg hover:bg-[#1f3044]/60">
                <Download size={11} aria-hidden="true" />Save .md
              </button>
              {msg.processingTime && (
                <span className="ml-auto text-[10px] text-[#4a6880] font-mono-data">
                  {msg.processingTime}ms · {formatTime(msg.timestamp)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 animate-fade-in" role="status" aria-label="Nexus Legal is thinking">
      <div className="w-7 h-7 rounded-lg bg-[#00CCCC]/12 border border-[#00CCCC]/22 flex items-center justify-center flex-shrink-0" aria-hidden="true">
        <Scale size={13} className="text-[#00CCCC]" />
      </div>
      <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-[#0e1b2e] border border-[#1f3044]" aria-hidden="true">
        <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────

export default function Chat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [doc, setDoc] = useState<UploadedDoc | null>(null);
  const [mode, setMode] = useState<AnalysisMode>("auto");
  const [dragging, setDragging] = useState(false);
  const [typing, setTyping] = useState(false);
  const [showModes, setShowModes] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchParams.get("s")) setSearchParams({ s: uid() }, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const sendMutation = trpc.chat.send.useMutation({
    onSuccess(data) {
      setTyping(false);
      setMessages(prev => [...prev, {
        id: uid(), role: "assistant", content: data.content,
        intent: data.intent, processingTime: data.processingTime,
        timestamp: data.timestamp, isStreaming: true,
      }]);
    },
    onError(err) {
      setTyping(false);
      setMessages(prev => [...prev, {
        id: uid(), role: "assistant",
        content: `Something went wrong: ${err.message}. Please try again.`,
        timestamp: new Date().toISOString(),
      }]);
    },
  });

  const send = useCallback((text: string) => {
    const t = text.trim();
    if (!t || sendMutation.isPending) return;
    setMessages(prev => [...prev, { id: uid(), role: "user", content: t, timestamp: new Date().toISOString() }]);
    setInput("");
    setTyping(true);
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
    const aug = mode !== "auto"
      ? `[Mode: ${MODES.find(m => m.value === mode)?.label}]\n\n${t}`
      : t;
    sendMutation.mutate({
      message: aug,
      documentContent: doc?.content,
      documentName: doc?.name,
      conversationHistory: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
    });
  }, [sendMutation, doc, messages, mode]);

  async function readFile(file: File) {
    setDoc({ name: file.name, content: await file.text(), size: file.size });
  }

  const modeLabel = useMemo(() => MODES.find(m => m.value === mode)?.label ?? "Auto-detect", [mode]);
  const empty = messages.length === 0;

  return (
    <div
      className="flex flex-col h-full bg-[#080f1a]"
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) readFile(f); }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-[#1f3044] flex-shrink-0
        bg-[#060c18]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Scale size={15} className="text-[#00CCCC]" aria-hidden="true" />
          <span className="text-sm font-semibold text-[#E4F5F4]">Nexus Legal</span>
          <span className="pwa-install-badge">AI · Legal Analysis</span>
        </div>

        {/* Mode selector */}
        <div className="relative">
          <button
            onClick={() => setShowModes(v => !v)}
            aria-haspopup="listbox"
            aria-expanded={showModes}
            aria-label={`Analysis mode: ${modeLabel}`}
            className="flex items-center gap-1.5 text-xs text-[#8da4b8] hover:text-[#E4F5F4]
              transition-colors px-2.5 py-1.5 rounded-lg border border-[#1f3044] hover:border-[#00CCCC]/30
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00CCCC]"
          >
            {modeLabel}
            <ChevronDown size={11} className={`transition-transform duration-150 ${showModes ? "rotate-180" : ""}`} />
          </button>
          {showModes && (
            <div role="listbox" aria-label="Select analysis mode"
              className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-[#1f3044]
                bg-[#0e1b2e] shadow-2xl z-50 overflow-hidden animate-scale-in">
              {MODES.map(opt => (
                <button key={opt.value} role="option" aria-selected={mode === opt.value}
                  onClick={() => { setMode(opt.value); setShowModes(false); }}
                  className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors ${
                    mode === opt.value
                      ? "text-[#00CCCC] bg-[#00CCCC]/10 font-medium"
                      : "text-[#c5dde6] hover:bg-[#1f3044]/60"
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── Messages ───────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-4 py-6" id="chat-messages" aria-live="polite" aria-label="Chat messages">
        <div className="max-w-[720px] mx-auto space-y-6">
          {empty ? (
            /* Empty state */
            <div className="animate-fade-in pt-4">
              <div className="text-center mb-10">
                {/* Hero icon with glow ring */}
                <div className="relative mx-auto w-16 h-16 mb-5">
                  <div className="absolute inset-0 rounded-2xl bg-[#00CCCC]/8 animate-pulse" />
                  <div className="relative w-16 h-16 rounded-2xl bg-[#0b1828] border border-[#00CCCC]/22
                    flex items-center justify-center shadow-lg">
                    <Scale size={26} className="text-[#00CCCC]" aria-hidden="true" />
                  </div>
                </div>
                <h1 className="text-xl font-semibold text-[#E4F5F4] mb-2 text-gradient-teal">Nexus Legal AI</h1>
                <p className="text-sm text-[#8da4b8] max-w-[300px] mx-auto leading-relaxed">
                  Upload a contract or ask a legal question. I analyze, explain, and help you negotiate.
                </p>
              </div>

              {/* Quick action grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5" role="list" aria-label="Quick actions">
                {QUICK_ACTIONS.map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      role="listitem"
                      onClick={() => send(action.prompt)}
                      className="group flex flex-col items-start gap-2.5 p-4 rounded-2xl text-left
                        bg-[#0b1828] border border-[#1f3044]
                        hover:border-[#2a4060] hover:bg-[#0e1f36]
                        active:scale-[0.97]
                        transition-all duration-150"
                      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
                    >
                      <Icon size={16} style={{ color: action.color }} aria-hidden="true" />
                      <span className="text-xs font-medium text-[#c5dde6] group-hover:text-[#E4F5F4] transition-colors leading-snug">
                        {action.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="text-center text-[11px] text-[#4a6880] mt-6">
                Drop a PDF, TXT, or DOCX anywhere — or use the attach button below
              </p>
            </div>
          ) : (
            messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
          )}
          {typing && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* ── Input area ─────────────────────────────────────────── */}
      <footer className="flex-shrink-0 px-4 pb-4 pt-2.5 border-t border-[#1a2e42] bg-[#080f1a]">
        <div className="max-w-[720px] mx-auto">

          {/* Doc pill */}
          {doc && (
            <div className="flex items-center gap-2 mb-2.5 px-3 py-1.5 rounded-xl
              bg-[#00CCCC]/10 border border-[#00CCCC]/22 w-fit max-w-full">
              <FileText size={12} className="text-[#00CCCC] flex-shrink-0" aria-hidden="true" />
              <span className="text-xs text-[#00CCCC] truncate max-w-[200px] font-medium">{doc.name}</span>
              <span className="text-[10px] text-[#8da4b8] font-mono-data flex-shrink-0">{formatBytes(doc.size)}</span>
              <button onClick={() => setDoc(null)} aria-label="Remove attached document"
                className="text-[#8da4b8] hover:text-red-400 transition-colors ml-1">
                <X size={12} />
              </button>
            </div>
          )}

          {/* Drag hint */}
          {dragging && (
            <div className="flex items-center justify-center h-12 mb-2.5 rounded-xl border-2 border-dashed
              border-[#00CCCC]/55 bg-[#00CCCC]/4 animate-fade-in" aria-live="polite">
              <p className="text-sm text-[#00CCCC] font-medium">Drop document to attach</p>
            </div>
          )}

          {/* Composer */}
          <div className="flex items-end gap-2 px-3 py-2 rounded-2xl border border-[#1f3044] bg-[#0b1828]
            focus-within:border-[#00CCCC]/45 focus-within:shadow-[0_0_0_3px_rgba(0,204,204,0.08)]
            transition-all duration-150">

            <button onClick={() => fileRef.current?.click()}
              aria-label="Attach document (PDF, TXT, DOCX)"
              className="p-1.5 rounded-lg text-[#4a6880] hover:text-[#00CCCC] hover:bg-[#00CCCC]/10
                transition-colors flex-shrink-0 self-end mb-0.5">
              <Paperclip size={16} aria-hidden="true" />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              onInput={e => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 160)}px`;
              }}
              placeholder="Ask a legal question or describe your contract…"
              rows={1}
              aria-label="Message"
              className="flex-1 resize-none bg-transparent text-sm text-[#E4F5F4]
                placeholder-[#4a6880] focus:outline-none py-1.5 leading-relaxed
                max-h-40 overflow-y-auto"
              style={{ minHeight: "34px" }}
            />

            <button
              onClick={() => send(input)}
              disabled={!input.trim() || sendMutation.isPending}
              aria-label={sendMutation.isPending ? "Sending…" : "Send message"}
              className="flex-shrink-0 self-end mb-0.5 w-8 h-8 rounded-xl
                bg-[#00CCCC] text-[#080f1a] font-semibold
                hover:bg-[#00E0E0] active:scale-95
                disabled:opacity-30 disabled:cursor-not-allowed
                transition-all duration-150 flex items-center justify-center"
            >
              {sendMutation.isPending
                ? <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                : <Send size={15} aria-hidden="true" />}
            </button>
          </div>

          <p className="text-[10px] text-[#4a6880] text-center mt-2 leading-snug">
            Legal <em>analysis</em> only — not legal advice.
            Consult a qualified attorney before acting on any analysis.
          </p>
        </div>
      </footer>

      <input ref={fileRef} type="file" accept=".pdf,.txt,.md,.doc,.docx" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f); e.target.value = ""; }} />
    </div>
  );
}
