import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import {
  Send, Paperclip, X, Plus, MessageSquare, FileText,
  Scale, ChevronRight, Loader2, Copy, Check, Download,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  docName?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

interface AttachedDoc {
  name: string;
  content: string;
  size: number;
}

// ── Quick actions shown on empty state ───────────────────────────
const QUICK_ACTIONS = [
  { label: "Review a Contract", prompt: "Please review the attached contract and give me a full safety assessment.", icon: "⚖️" },
  { label: "Identify All Risks", prompt: "Identify and score all risks in this agreement.", icon: "🔍" },
  { label: "Check GDPR/CCPA", prompt: "Is this contract compliant with GDPR and CCPA?", icon: "✅" },
  { label: "Plain English", prompt: "Explain this contract in plain English, section by section.", icon: "📖" },
  { label: "Generate Counter-Proposals", prompt: "Generate counter-proposals and a negotiation email for this contract.", icon: "🤝" },
  { label: "Generate NDA", prompt: "Generate a mutual NDA.", icon: "🔒" },
];

// ── Markdown-ish renderer (no deps) ──────────────────────────────
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^### (.*?)$/gm, '<h3 class="text-sm font-semibold text-[#E0F2F1] mt-4 mb-2">$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2 class="text-base font-semibold text-[#00BFBF] mt-5 mb-2">$1</h2>')
    .replace(/^---$/gm, '<hr class="border-[#00BFBF]/10 my-3" />')
    .replace(/`([^`]+)`/g, '<code class="bg-[#001A33] text-[#00BFBF] px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/^> (.*?)$/gm, '<blockquote class="border-l-2 border-[#00BFBF]/40 pl-3 text-[#7A8B99] italic my-2 text-xs">$1</blockquote>')
    .replace(/\| (.*?) \|/g, (match) => match) // leave tables as-is for now
    .replace(/\n/g, "<br/>");
}

function hasTable(text: string) { return /\|.*\|/.test(text); }

function TableRenderer({ text }: { text: string }) {
  const rows = text.split("\n").filter(l => l.includes("|") && l.trim());
  if (rows.length < 2) return null;
  const headers = rows[0].split("|").filter(Boolean).map(h => h.trim());
  const body = rows.slice(2).map(r => r.split("|").filter(Boolean).map(c => c.trim()));
  return (
    <div className="overflow-x-auto my-3 rounded-xl border border-[#00BFBF]/10">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#001A33]/60">
            {headers.map((h, i) => <th key={i} className="px-3 py-2 text-left text-[#00BFBF] font-medium whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {body.map((row, i) => (
            <tr key={i} className="border-t border-[#00BFBF]/5 hover:bg-[#001A33]/30 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-[#C8D8E8]"
                  dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/❌/g, '<span class="text-red-400">❌</span>').replace(/✅/g, '<span class="text-emerald-400">✅</span>').replace(/⚠️/g, '<span class="text-yellow-400">⚠️</span>').replace(/🔴/g, '<span class="text-red-400">🔴</span>').replace(/🟡/g, '<span class="text-yellow-400">🟡</span>').replace(/🟢/g, '<span class="text-emerald-400">🟢</span>') }} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  // Split by table blocks
  const parts = content.split(/((?:\|.*\|\n?){2,})/gm);
  return (
    <div className="text-sm text-[#C8D8E8] leading-relaxed space-y-1">
      {parts.map((part, i) => {
        if (hasTable(part)) return <TableRenderer key={i} text={part} />;
        return <div key={i} dangerouslySetInnerHTML={{ __html: renderMarkdown(part) }} />;
      })}
    </div>
  );
}

// ── Typewriter effect ─────────────────────────────────────────────
function useTypewriter(text: string, active: boolean) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!active) { setDisplayed(text); return; }
    setDisplayed("");
    let i = 0;
    const speed = Math.max(4, Math.min(12, Math.floor(3000 / text.length)));
    const iv = setInterval(() => {
      i += Math.ceil(text.length / 400); // adaptive speed
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [text, active]);
  return displayed;
}

function AssistantMessage({ msg, isLatest }: { msg: Message; isLatest: boolean }) {
  const [copied, setCopied] = useState(false);
  const displayed = useTypewriter(msg.content, isLatest);

  function copy() {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    const blob = new Blob([msg.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus-legal-${msg.timestamp.toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-3 group">
      <div className="w-8 h-8 rounded-full bg-[#00BFBF]/15 border border-[#00BFBF]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Scale size={14} className="text-[#00BFBF]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-[#7A8B99] mb-1.5">Nexus Legal</div>
        <div className="bg-[#002B52]/50 border border-[#00BFBF]/10 rounded-2xl rounded-tl-sm px-4 py-3">
          <MessageContent content={displayed} />
          {isLatest && displayed.length < msg.content.length && (
            <span className="inline-block w-1.5 h-4 bg-[#00BFBF] ml-0.5 animate-pulse rounded-sm" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={copy} className="flex items-center gap-1 text-[10px] text-[#7A8B99] hover:text-[#00BFBF] transition-colors">
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={download} className="flex items-center gap-1 text-[10px] text-[#7A8B99] hover:text-[#00BFBF] transition-colors">
            <Download size={11} /> Save
          </button>
          <span className="text-[10px] text-[#4A5B6A]">{msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>
    </div>
  );
}

function UserMessage({ msg }: { msg: Message }) {
  return (
    <div className="flex gap-3 justify-end">
      <div className="max-w-[75%]">
        {msg.docName && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#7A8B99] mb-1 justify-end">
            <FileText size={10} className="text-[#00BFBF]" /> {msg.docName}
          </div>
        )}
        <div className="bg-[#00BFBF]/10 border border-[#00BFBF]/20 rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-sm text-[#E0F2F1] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        </div>
        <p className="text-[10px] text-[#4A5B6A] mt-1 text-right">
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ onAction }: { onAction: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center space-y-8">
      <div className="space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-[#00BFBF]/10 border border-[#00BFBF]/20 flex items-center justify-center mx-auto">
          <Scale className="w-8 h-8 text-[#00BFBF]" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[#E0F2F1]">Nexus Legal</h2>
          <p className="text-sm text-[#7A8B99] mt-1">AI-powered legal analysis. Upload a contract or ask anything.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        {QUICK_ACTIONS.map((action) => (
          <button key={action.label} onClick={() => onAction(action.prompt)}
            className="flex items-center gap-3 text-left px-4 py-3 rounded-xl bg-[#002B52]/50 border border-[#00BFBF]/10 hover:border-[#00BFBF]/30 hover:bg-[#002B52]/80 transition-all group">
            <span className="text-xl flex-shrink-0">{action.icon}</span>
            <span className="text-sm text-[#C8D8E8] group-hover:text-[#E0F2F1] transition-colors">{action.label}</span>
            <ChevronRight size={14} className="text-[#7A8B99] ml-auto flex-shrink-0 group-hover:text-[#00BFBF] transition-colors" />
          </button>
        ))}
      </div>

      <p className="text-xs text-[#4A5B6A] max-w-sm">
        Legal analysis only — not legal advice. Always consult a qualified attorney before signing.
      </p>
    </div>
  );
}

// ── Main Chat page ────────────────────────────────────────────────
export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [attachedDoc, setAttachedDoc] = useState<AttachedDoc | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [latestMsgId, setLatestMsgId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find(c => c.id === activeId) ?? null;

  const sendMutation = trpc.chat.send.useMutation({
    onSuccess: (data) => {
      const msg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      };
      setLatestMsgId(msg.id);
      setConversations(prev => prev.map(c =>
        c.id === activeId ? { ...c, messages: [...c.messages, msg] } : c
      ));
    },
    onError: (err) => toast.error(err.message),
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages.length, sendMutation.isPending]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  function newConversation() {
    const id = crypto.randomUUID();
    const conv: Conversation = { id, title: "New conversation", messages: [], createdAt: new Date() };
    setConversations(prev => [conv, ...prev]);
    setActiveId(id);
    setInput("");
    setAttachedDoc(null);
  }

  function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || sendMutation.isPending) return;

    // Create conversation if none active
    let targetId = activeId;
    if (!targetId) {
      const id = crypto.randomUUID();
      const title = content.slice(0, 40) + (content.length > 40 ? "…" : "");
      const conv: Conversation = { id, title, messages: [], createdAt: new Date() };
      setConversations(prev => [conv, ...prev]);
      setActiveId(id);
      targetId = id;
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
      docName: attachedDoc?.name,
    };

    // Update title from first message
    setConversations(prev => prev.map(c => {
      if (c.id !== targetId) return c;
      const title = c.messages.length === 0 ? content.slice(0, 40) + (content.length > 40 ? "…" : "") : c.title;
      return { ...c, title, messages: [...c.messages, userMsg] };
    }));

    setInput("");
    const docContent = attachedDoc?.content;
    const docName = attachedDoc?.name;
    setAttachedDoc(null);

    sendMutation.mutate({
      message: content,
      documentContent: docContent,
      documentName: docName,
      conversationHistory: activeConv?.messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
    });
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }, [input, attachedDoc, activeId]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File too large — max 5 MB"); return; }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["txt", "md", "pdf", "docx"].includes(ext ?? "")) {
      toast.error("Supported formats: .txt .md .pdf .docx");
      return;
    }

    if (ext === "txt" || ext === "md") {
      const text = await file.text();
      setAttachedDoc({ name: file.name, content: text, size: file.size });
    } else {
      // PDF/DOCX: we can't extract client-side without deps — attach with placeholder
      setAttachedDoc({
        name: file.name,
        content: `[Document: ${file.name}] — Document uploaded. In production, text is extracted via server-side OCR. For demo, paste the contract text directly in your message.`,
        size: file.size,
      });
      toast.info("PDF uploaded. For best results, paste the contract text directly too.");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleFileSelect(fakeEvent);
  }

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden" onDrop={handleDrop} onDragOver={e => e.preventDefault()}>

      {/* Sidebar — conversation history */}
      <aside className={`flex-shrink-0 border-r border-[#00BFBF]/10 bg-[#001A33]/60 backdrop-blur flex flex-col transition-all duration-300 ${sidebarOpen ? "w-60" : "w-0 overflow-hidden"}`}>
        <div className="p-3 border-b border-[#00BFBF]/10">
          <button onClick={newConversation}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#00BFBF]/10 border border-[#00BFBF]/20 text-sm font-medium text-[#00BFBF] hover:bg-[#00BFBF]/15 transition-colors">
            <Plus size={16} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-xs text-[#4A5B6A] text-center py-8 px-3">Start a conversation to see history here</p>
          ) : (
            conversations.map(conv => (
              <button key={conv.id} onClick={() => setActiveId(conv.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all group ${conv.id === activeId ? "bg-[#002B52] border border-[#00BFBF]/20 text-[#E0F2F1]" : "text-[#7A8B99] hover:text-[#E0F2F1] hover:bg-[#002B52]/60 border border-transparent"}`}>
                <div className="flex items-start gap-2">
                  <MessageSquare size={12} className="flex-shrink-0 mt-0.5 text-[#00BFBF]" />
                  <span className="truncate leading-relaxed">{conv.title}</span>
                </div>
                <p className="text-[10px] text-[#4A5B6A] mt-0.5 ml-[20px]">
                  {conv.messages.length} message{conv.messages.length !== 1 ? "s" : ""}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#00BFBF]/10 flex-shrink-0">
          <button onClick={() => setSidebarOpen(v => !v)}
            className="p-1.5 rounded-lg text-[#7A8B99] hover:text-[#00BFBF] hover:bg-[#002B52]/60 transition-colors">
            <MessageSquare size={18} />
          </button>
          <span className="text-sm font-medium text-[#E0F2F1] truncate">
            {activeConv?.title ?? "Nexus Legal"}
          </span>
          {activeConv && (
            <button onClick={newConversation}
              className="ml-auto flex items-center gap-1.5 text-xs text-[#7A8B99] hover:text-[#00BFBF] transition-colors flex-shrink-0">
              <Plus size={14} /> New
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {!activeConv || activeConv.messages.length === 0 ? (
            <EmptyState onAction={(prompt) => { if (!activeId) newConversation(); setInput(prompt); setTimeout(() => textareaRef.current?.focus(), 50); }} />
          ) : (
            <>
              {activeConv.messages.map((msg) =>
                msg.role === "user"
                  ? <UserMessage key={msg.id} msg={msg} />
                  : <AssistantMessage key={msg.id} msg={msg} isLatest={msg.id === latestMsgId} />
              )}
              {sendMutation.isPending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#00BFBF]/15 border border-[#00BFBF]/30 flex items-center justify-center flex-shrink-0">
                    <Scale size={14} className="text-[#00BFBF]" />
                  </div>
                  <div className="bg-[#002B52]/50 border border-[#00BFBF]/10 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00BFBF] animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00BFBF] animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00BFBF] animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 px-4 pb-4 pt-2">
          {/* Attached document pill */}
          {attachedDoc && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-[#002B52]/60 border border-[#00BFBF]/20 rounded-xl w-fit max-w-full">
              <FileText size={14} className="text-[#00BFBF] flex-shrink-0" />
              <span className="text-xs text-[#E0F2F1] truncate max-w-[200px]">{attachedDoc.name}</span>
              <span className="text-[10px] text-[#7A8B99]">({(attachedDoc.size / 1024).toFixed(0)} KB)</span>
              <button onClick={() => setAttachedDoc(null)} className="text-[#7A8B99] hover:text-red-400 transition-colors flex-shrink-0">
                <X size={13} />
              </button>
            </div>
          )}

          <div className="relative bg-[#002B52]/60 border border-[#00BFBF]/20 rounded-2xl focus-within:border-[#00BFBF]/50 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about a contract, or describe the document you want to generate…"
              rows={1}
              className="w-full bg-transparent text-sm text-[#E0F2F1] placeholder-[#4A5B6A] resize-none outline-none px-4 pt-3.5 pb-12 max-h-[180px] leading-relaxed"
            />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-lg text-[#7A8B99] hover:text-[#00BFBF] hover:bg-[#00BFBF]/10 transition-colors"
                  title="Attach document">
                  <Paperclip size={16} />
                </button>
                <span className="text-[10px] text-[#4A5B6A]">PDF, TXT, MD · max 5MB</span>
              </div>
              <button onClick={() => send()}
                disabled={!input.trim() || sendMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00BFBF] text-[#001A33] text-xs font-semibold hover:bg-[#00BFBF]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                {sendMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                {sendMutation.isPending ? "Analyzing…" : "Send"}
              </button>
            </div>
          </div>

          <p className="text-center text-[10px] text-[#3A4B59] mt-2">
            Legal analysis only — not legal advice · Always verify with a qualified attorney
          </p>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept=".txt,.md,.pdf,.docx" className="hidden" onChange={handleFileSelect} />
    </div>
  );
}
