import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import {
  Cpu, Plus, Loader2, Trash2, Check, Star, Zap,
  Brain, Sparkles, Gem, Bot, Wifi, WifiOff,
} from "lucide-react";

const providerIcons: Record<string, typeof Cpu> = {
  deepseek: Brain,
  kimi: Sparkles,
  openai: Zap,
  anthropic: Gem,
  gemini: Sparkles,
  custom: Bot,
};

const providerColors: Record<string, string> = {
  deepseek: "#00BFBF",
  kimi: "#FF6B35",
  openai: "#10a37f",
  anthropic: "#d4a574",
  gemini: "#4285f4",
  custom: "#7A8B99",
};

const defaultEngines = [
  { name: "DeepSeek V3", provider: "deepseek" as const, model: "deepseek-chat", isDefault: true },
  { name: "Kimi K1.5", provider: "kimi" as const, model: "kimi-latest", isDefault: false },
  { name: "GPT-4o", provider: "openai" as const, model: "gpt-4o", isDefault: false },
  { name: "Claude 3.5 Sonnet", provider: "anthropic" as const, model: "claude-3-5-sonnet", isDefault: false },
  { name: "Gemini 1.5 Pro", provider: "gemini" as const, model: "gemini-1.5-pro", isDefault: false },
  { name: "Local (Ollama)", provider: "custom" as const, model: "llama3.1", isDefault: false },
];

export default function AiEngines() {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", provider: "deepseek" as const, model: "", baseUrl: "" });

  const utils = trpc.useUtils();
  const { data: engines, isLoading } = trpc.aiEngine.list.useQuery();
  const createEngine = trpc.aiEngine.create.useMutation({
    onSuccess: () => { utils.aiEngine.list.invalidate(); setShowAdd(false); setForm({ name: "", provider: "deepseek", model: "", baseUrl: "" }); toast.success("AI Engine added"); },
    onError: (err) => toast.error("Failed: " + err.message),
  });
  const updateEngine = trpc.aiEngine.update.useMutation({
    onSuccess: () => { utils.aiEngine.list.invalidate(); toast.success("Engine updated"); },
  });
  const deleteEngine = trpc.aiEngine.delete.useMutation({
    onSuccess: () => { utils.aiEngine.list.invalidate(); toast.success("Engine removed"); },
  });

  const engineList = engines && engines.length > 0 ? engines : defaultEngines.map((e) => ({ ...e, id: 0, apiKey: null, baseUrl: null, temperature: "0.7", maxTokens: 4096, isActive: true, userId: null, createdAt: new Date() }));

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#E0F2F1]">AI Engines</h1>
          <p className="text-[#7A8B99] mt-1 text-sm">Configure DeepSeek, Kimi, GPT, Claude, and custom models</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00BFBF] text-[#001A33] text-sm font-semibold hover:brightness-110 transition-all glow-teal-hover">
          <Plus size={16} /> {showAdd ? "Cancel" : "Add Engine"}
        </button>
      </div>

      {showAdd && (
        <div className="glass-card rounded-2xl p-6 animate-fade-in">
          <h3 className="text-sm font-semibold text-[#E0F2F1] mb-4">Add AI Engine</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono-data text-[#7A8B99] uppercase block mb-1">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g., DeepSeek V3" className="w-full px-4 py-2.5 rounded-xl bg-[#001A33]/60 border border-[#00BFBF]/15 text-[#E0F2F1] text-sm placeholder:text-[#7A8B99]/50 focus:border-[#00BFBF]/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-mono-data text-[#7A8B99] uppercase block mb-1">Provider</label>
              <select value={form.provider} onChange={(e) => setForm(f => ({ ...f, provider: e.target.value as any }))}
                className="w-full px-4 py-2.5 rounded-xl bg-[#001A33]/60 border border-[#00BFBF]/15 text-[#E0F2F1] text-sm focus:border-[#00BFBF]/50 focus:outline-none">
                {["deepseek", "kimi", "openai", "anthropic", "gemini", "custom"].map(p => (
                  <option key={p} value={p} className="bg-[#002B52] capitalize">{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-mono-data text-[#7A8B99] uppercase block mb-1">Model</label>
              <input type="text" value={form.model} onChange={(e) => setForm(f => ({ ...f, model: e.target.value }))}
                placeholder="e.g., deepseek-chat" className="w-full px-4 py-2.5 rounded-xl bg-[#001A33]/60 border border-[#00BFBF]/15 text-[#E0F2F1] text-sm placeholder:text-[#7A8B99]/50 focus:border-[#00BFBF]/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-mono-data text-[#7A8B99] uppercase block mb-1">Base URL (optional)</label>
              <input type="text" value={form.baseUrl} onChange={(e) => setForm(f => ({ ...f, baseUrl: e.target.value }))}
                placeholder="https://api.example.com/v1" className="w-full px-4 py-2.5 rounded-xl bg-[#001A33]/60 border border-[#00BFBF]/15 text-[#E0F2F1] text-sm placeholder:text-[#7A8B99]/50 focus:border-[#00BFBF]/50 focus:outline-none" />
            </div>
          </div>
          <button onClick={() => { if (form.name && form.model) createEngine.mutate(form); }}
            disabled={createEngine.isPending || !form.name || !form.model}
            className="mt-4 px-6 py-2.5 rounded-xl bg-[#00BFBF] text-[#001A33] text-sm font-semibold hover:brightness-110 disabled:opacity-50 flex items-center gap-2">
            {createEngine.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add Engine
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 size={28} className="text-[#00BFBF] animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {engineList.map((engine: any, idx: number) => {
            const Icon = providerIcons[engine.provider] || Cpu;
            const color = providerColors[engine.provider] || "#7A8B99";
            return (
              <div key={engine.id || idx} className="glass-card rounded-2xl p-5 glow-teal-hover transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <div className="flex items-center gap-1">
                    {engine.isDefault && <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-data bg-[#00BFBF]/15 text-[#00BFBF] border border-[#00BFBF]/20 flex items-center gap-1"><Star size={10} /> Default</span>}
                    {engine.isActive ? <Wifi size={14} className="text-emerald-400" /> : <WifiOff size={14} className="text-red-400" />}
                  </div>
                </div>
                <h3 className="text-base font-semibold text-[#E0F2F1]">{engine.name}</h3>
                <p className="text-xs font-mono-data mt-1" style={{ color }}>{engine.provider} / {engine.model}</p>
                {engine.baseUrl && <p className="text-[10px] text-[#7A8B99] mt-1 truncate">{engine.baseUrl}</p>}
                <div className="flex items-center gap-2 mt-4">
                  {!engine.isDefault && (
                    <button onClick={() => updateEngine.mutate({ id: engine.id, isDefault: true })}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-[#7A8B99] hover:text-[#00BFBF] hover:bg-[#00BFBF]/10 transition-colors border border-[#00BFBF]/10">
                      <Check size={12} /> Set Default
                    </button>
                  )}
                  {engine.id > 0 && (
                    <button onClick={() => { if (confirm("Remove this engine?")) deleteEngine.mutate({ id: engine.id }); }}
                      className="ml-auto p-1.5 rounded-lg text-[#7A8B99] hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
