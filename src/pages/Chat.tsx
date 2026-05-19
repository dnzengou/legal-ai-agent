import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  Send, Paperclip, X, Copy, Download, FileText, Shield,
  BookOpen, ChevronDown, Scale, Sparkles, AlertTriangle,
  CheckCircle, RotateCcw, Loader2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────

type Role = "user" | "assistant";

interface Citation {
  text: string;
  reference: string;
}

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

interface UploadedDoc {
  name: string;
  content: string;
  size: number;
}

type AnalysisType =
  | "auto"
  | "contract_review"
  | "risk_assessment"
  | "compliance_check"
  | "plain_english"
  | "negotiate"
  | "missing_protection";

const ANALYSIS_OPTIONS: { value: AnalysisType; label: string }[] = [
  { value: "auto", label: "Auto-detect" },
  { value: "contract_review", label: "Contract Review" },
  { value: "risk_assessment", label: "Risk Assessment" },
  { value: "compliance_check", label: "Compliance Check" },
  { value: "plain_english", label: "Plain English" },
  { value: "negotiate", label: "Negotiate" },
  { value: "missing_protection", label: "Missing Protections" },
];

const QUICK_ACTIONS = [
  { icon: Shield, label: "Review Contract", prompt: "Review this contract for risks and issues", color: "text-red-400" },
  { icon: AlertTriangle, label: "Find Risks", prompt: "What are the major risks in this agreement?", color: "text-amber-400" },
  { icon: CheckCircle, label: "Check Compliance", prompt: "Is this contract GDPR and CCPA compliant?", color: "text-emerald-400" },
  { icon: BookOpen, label: "Plain English", prompt: "Explain this contract in plain English", color: "text-blue-400" },
  { icon: RotateCcw, label: "Negotiate", prompt: "Generate counter-proposals for this contract", color: "text-violet-400" },
  { icon: Sparkles, label: "Draft NDA", prompt: "Generate a mutual NDA for a software partnership", color: "text-[#00BFBF]" },
];

// ── Helpers ───────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Typewriter hook ───────────────────────────────────────────────

function useTypewriter(text: string, active: boolean) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);

  useEffect(() => {
    if (!active) { setDisplayed(text); return; }
    setDisplayed("");
    idx.current = 0;
    const speed = text.length > 800 ? 4 : text.length > 400 ? 8 : 14;
    const tick = setInterval(() => {
      if (idx.current >= text.length) { clearInterval(tick); return; }
      const chunk = Math.min(3, text.length - idx.current);
      setDisplayed(text.slice(0, idx.current + chunk));
      idx.current += chunk;
    }, speed);
    return () => clearInterval(tick);
  }, [text, active]);

  return displayed;
}

// ── Score Gauge ───────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0d1829]/80 border border-[#172130]">
      <div className="relative w-20 h-20 flex-shrink-0">
        <svg viewBox="0 0 88 88" className="rotate-[-90deg] w-full h-full">
          <circle cx="44" cy="44" r={r} stroke="#172130" strokeWidth="8" fill="none" />
          <circle
            cx="44" cy="44" r={r}
            stroke={color} strokeWidth="8" fill="none"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono-data text-lg font-bold" style={{ color }}>{score}</span>
          <span className="text-[10px] text-[#5a7080]">/ 100</span>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl font-bold" style={{ color }}>{grade}</span>
          <span className="text-sm text-[#E0F2F1] font-medium">Safety Score</span>
        </div>
        <p className="text-xs text-[#5a7080]">
          {score >= 80
            ? "Low risk — proceed with minor revisions"
            : score >= 60
            ? "Moderate risk — negotiate key clauses"
            : "High risk — significant issues need attention"}
        </p>
      </div>
    </div>
  );
}

// ── Inline markdown renderer ──────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[.+?\]\(.+?\))/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-semibold text-[#E0F2F1]">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} className="font-mono-data text-xs bg-[#00BFBF]/10 text-[#00BFBF] px-1.5 py-0.5 rounded">{part.slice(1, -1)}</code>;
    const linkMatch = part.match(/\[(.+?)\]\((.+?)\)/);
    if (linkMatch)
      return <a key={i} href={linkMatch[2]} className="text-[#00BFBF] underline underline-offset-2 hover:text-[#00DFDF]">{linkMatch[1]}</a>;
    return part;
  });
}

function renderMarkdown(raw: string): React.ReactNode[] {
  const lines = raw.split("\n");
  const out: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  function flushTable() {
    if (!tableRows.length) return;
    const [head, , ...body] = tableRows;
    out.push(
      <div key={`t${out.length}`} className="overflow-x-auto my-3">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>{head?.map((c, i) => (
              <th key={i} className="text-left font-medium text-[#7A8B99] border-b border-[#172130] pb-1.5 pr-4">{c.trim()}</th>
            ))}</tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri}>{row.map((c, ci) => (
                <td key={ci} className="border-b border-[#172130]/50 py-1.5 pr-4 text-[#C8E0DC] align-top">{c.trim()}</td>
              ))}</tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith("|")) { inTable = true; tableRows.push(l.split("|").slice(1, -1)); continue; }
    if (inTable) flushTable();

    if (l.startsWith("## "))
      out.push(<h2 key={i} className="text-base font-semibold text-[#E0F2F1] mt-5 mb-2 first:mt-0">{l.slice(3)}</h2>);
    else if (l.startsWith("### "))
      out.push(<h3 key={i} className="text-sm font-semibold text-[#00BFBF] mt-4 mb-1.5">{l.slice(4)}</h3>);
    else if (l.startsWith("---"))
      out.push(<hr key={i} className="border-[#172130] my-4" />);
    else if (l.startsWith("- ") || l.startsWith("* "))
      out.push(<li key={i} className="text-sm text-[#C8E0DC] pl-1 ml-4" style={{ listStyleType: "disc" }}>{renderInline(l.slice(2))}</li>);
    else if (/^\d+\.\s/.test(l))
      out.push(<li key={i} className="text-sm text-[#C8E0DC] pl-1 ml-4" style={{ listStyleType: "decimal" }}>{renderInline(l.replace(/^\d+\.\s/, ""))}</li>);
    else if (l.startsWith("> "))
      out.push(<blockquote key={i} className="border-l-2 border-[#00BFBF]/40 pl-3 italic text-[#7A8B99] my-2 text-sm">{renderInline(l.slice(2))}</blockquote>);
    else if (l.trim() === "")
      out.push(<div key={i} className="h-2" />);
    else
      out.push(<p key={i} className="text-sm text-[#C8E0DC] leading-relaxed">{renderInline(l)}</p>);
  }
  if (inTable) flushTable();
  return out;
}

// ── Message bubble ────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === "user";

  const displayed = useTypewriter(msg.content, msg.role === "assistant" && Boolean(msg.isStreaming));
  const text = msg.isStreaming ? displayed : msg.content;

  const scoreMatch = text.match(/Safety Score.*?(\d{1,3})\s*\/\s*100/i) ?? text.match(/Score[:\s]+(\d{1,3})\s*\/\s*100/i);
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;

  function copy() {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    const blob = new Blob([msg.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus-legal-${msg.timestamp.slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-sm bg-[#00BFBF]/15 border border-[#00BFBF]/20 text-sm text-[#E0F2F1] leading-relaxed">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-[#00BFBF]/15 border border-[#00BFBF]/25 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Scale size={14} className="text-[#00BFBF]" />
        </div>
        <div className="flex-1 min-w-0">
          {score !== null && score >= 0 && score <= 100 && (
            <div className="mb-4"><ScoreGauge score={score} /></div>
          )}

          <div className="space-y-0.5">{renderMarkdown(text)}</div>

          {msg.isStreaming && displayed.length < msg.content.length && (
            <span className="inline-block w-0.5 h-4 bg-[#00BFBF] animate-pulse ml-0.5 align-middle" />
          )}

          {msg.citations && msg.citations.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {msg.citations.map((c, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[#0d1829]/60 border border-[#172130]">
                  <BookOpen size={12} className="text-[#5a7080] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[#C8E0DC]">{c.text}</p>
                    <p className="text-[10px] text-[#5a7080] mt-0.5 font-mono-data">{c.reference}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!msg.isStreaming && (
            <div className="flex items-center gap-2 mt-3">
              <button onClick={copy} className="flex items-center gap-1.5 text-[10px] text-[#5a7080] hover:text-[#E0F2F1] transition-colors px-2 py-1 rounded-md hover:bg-[#172130]/60">
                <Copy size={11} />{copied ? "Copied!" : "Copy"}
              </button>
              <button onClick={download} className="flex items-center gap-1.5 text-[10px] text-[#5a7080] hover:text-[#E0F2F1] transition-colors px-2 py-1 rounded-md hover:bg-[#172130]/60">
                <Download size={11} />Download
              </button>
              {msg.processingTime && (
                <span className="text-[10px] text-[#5a7080] ml-auto font-mono-data">
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
    <div className="flex items-center gap-3 animate-fade-in">
      <div className="w-7 h-7 rounded-lg bg-[#00BFBF]/15 border border-[#00BFBF]/25 flex items-center justify-center flex-shrink-0">
        <Scale size={14} className="text-[#00BFBF]" />
      </div>
      <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-[#0d1829]/60 border border-[#172130]">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────

export default function Chat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [doc, setDoc] = useState<UploadedDoc | null>(null);
  const [analysisType, setAnalysisType] = useState<AnalysisType>("auto");
  const [isDragging, setIsDragging] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchParams.get("s")) setSearchParams({ s: uid() }, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMutation = trpc.chat.send.useMutation({
    onSuccess(data) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: data.content,
          intent: data.intent,
          processingTime: data.processingTime,
          timestamp: data.timestamp,
          isStreaming: true,
        },
      ]);
    },
    onError(err) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: `Error: ${err.message}. Please try again.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    },
  });

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sendMutation.isPending) return;

    setMessages((prev) => [...prev, {
      id: uid(), role: "user", content: trimmed, timestamp: new Date().toISOString(),
    }]);
    setInput("");
    setIsTyping(true);

    const augmented = analysisType !== "auto"
      ? `[Mode: ${ANALYSIS_OPTIONS.find((o) => o.value === analysisType)?.label}]\n\n${trimmed}`
      : trimmed;

    sendMutation.mutate({
      message: augmented,
      documentContent: doc?.content,
      documentName: doc?.name,
      conversationHistory: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
    });
  }, [sendMutation, doc, messages, analysisType]);

  async function readFile(file: File) {
    const content = await file.text();
    setDoc({ name: file.name, content, size: file.size });
  }

  const selectedLabel = useMemo(
    () => ANALYSIS_OPTIONS.find((o) => o.value === analysisType)?.label ?? "Auto-detect",
    [analysisType],
  );

  const isEmpty = messages.length === 0;

  return (
    <div
      className="flex flex-col h-full bg-[#080f1a]"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) readFile(f); }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#172130] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-[#00BFBF]" />
          <span className="text-sm font-semibold text-[#E0F2F1]">Nexus Legal</span>
          <span className="text-[10px] font-mono-data text-[#5a7080] tracking-wider uppercase">AI</span>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowTypeSelector(!showTypeSelector)}
            className="flex items-center gap-1.5 text-xs text-[#5a7080] hover:text-[#E0F2F1] transition-colors px-2.5 py-1.5 rounded-lg border border-[#172130] hover:border-[#00BFBF]/30"
          >
            {selectedLabel}
            <ChevronDown size={12} className={`transition-transform ${showTypeSelector ? "rotate-180" : ""}`} />
          </button>
          {showTypeSelector && (
            <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-[#172130] bg-[#0d1829] shadow-2xl z-50 overflow-hidden animate-slide-up">
              {ANALYSIS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setAnalysisType(opt.value); setShowTypeSelector(false); }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                    analysisType === opt.value ? "text-[#00BFBF] bg-[#00BFBF]/10" : "text-[#C8E0DC] hover:bg-[#172130]/60"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {isEmpty ? (
            <div className="animate-fade-in">
              <div className="text-center mb-10">
                <div className="w-14 h-14 rounded-2xl bg-[#00BFBF]/10 border border-[#00BFBF]/20 flex items-center justify-center mx-auto mb-4">
                  <Scale size={24} className="text-[#00BFBF]" />
                </div>
                <h1 className="text-xl font-semibold text-[#E0F2F1] mb-2">Nexus Legal AI</h1>
                <p className="text-sm text-[#5a7080] max-w-xs mx-auto leading-relaxed">
                  Upload a contract or ask a legal question. I'll analyze, explain, and help you negotiate.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => send(action.prompt)}
                      className="flex flex-col items-start gap-2 p-3.5 rounded-xl border border-[#172130] bg-[#0d1829]/40
                        hover:border-[#00BFBF]/30 hover:bg-[#0d1829]/80 transition-all text-left group"
                    >
                      <Icon size={15} className={action.color} />
                      <span className="text-xs font-medium text-[#C8E0DC] group-hover:text-[#E0F2F1] transition-colors leading-tight">
                        {action.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-[10px] text-[#5a7080] mt-5">
                Drop a PDF or text file anywhere, or click the attach button below
              </p>
            </div>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
          )}
          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-[#172130]">
        <div className="max-w-3xl mx-auto">
          {/* Document pill */}
          {doc && (
            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg bg-[#00BFBF]/10 border border-[#00BFBF]/20 w-fit max-w-full">
              <FileText size={12} className="text-[#00BFBF] flex-shrink-0" />
              <span className="text-xs text-[#00BFBF] truncate max-w-[200px]">{doc.name}</span>
              <span className="text-[10px] text-[#5a7080] font-mono-data flex-shrink-0">{formatBytes(doc.size)}</span>
              <button onClick={() => setDoc(null)} className="text-[#5a7080] hover:text-red-400 transition-colors ml-1">
                <X size={12} />
              </button>
            </div>
          )}

          {/* Drag hint */}
          {isDragging && (
            <div className="flex items-center justify-center h-14 rounded-xl border-2 border-dashed border-[#00BFBF]/60 bg-[#00BFBF]/5 mb-2 animate-fade-in">
              <p className="text-sm text-[#00BFBF]">Drop document to attach</p>
            </div>
          )}

          <div className="flex items-end gap-2 p-2 rounded-xl border border-[#172130] bg-[#0d1829]/80
            focus-within:border-[#00BFBF]/40 focus-within:ring-1 focus-within:ring-[#00BFBF]/20 transition-all">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg text-[#5a7080] hover:text-[#00BFBF] hover:bg-[#00BFBF]/10 transition-colors flex-shrink-0"
              title="Attach document (PDF, TXT)"
            >
              <Paperclip size={16} />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 160)}px`;
              }}
              placeholder="Ask a legal question or describe your contract…"
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-[#E0F2F1] placeholder-[#5a7080]
                focus:outline-none py-1.5 leading-relaxed max-h-40 overflow-y-auto"
              style={{ minHeight: "36px" }}
            />

            <button
              onClick={() => send(input)}
              disabled={!input.trim() || sendMutation.isPending}
              className="p-2 rounded-lg bg-[#00BFBF] text-[#080f1a] hover:bg-[#00DFDF]
                disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
              title="Send (Enter)"
            >
              {sendMutation.isPending
                ? <Loader2 size={16} className="animate-spin" />
                : <Send size={16} />}
            </button>
          </div>

          <p className="text-[10px] text-[#5a7080] text-center mt-2">
            Legal analysis only — not legal advice.{" "}
            <span className="opacity-60">Consult a qualified attorney before acting.</span>
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.md,.doc,.docx"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); e.target.value = ""; }}
      />
    </div>
  );
}
