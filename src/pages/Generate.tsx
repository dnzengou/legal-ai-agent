import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import {
  FileText, Loader2, Download, Copy, Check, ChevronDown,
  Lock, Globe, Handshake, FileSignature,
} from "lucide-react";

type DocType = "nda" | "terms" | "privacy" | "agreement";

interface DocOption {
  id: DocType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const DOC_OPTIONS: DocOption[] = [
  { id: "nda", label: "NDA", description: "Non-Disclosure Agreement — mutual, one-way, employee, or vendor", icon: Lock, color: "text-violet-400" },
  { id: "terms", label: "Terms of Service", description: "GDPR/CCPA compliant terms with 15 standard sections", icon: FileText, color: "text-blue-400" },
  { id: "privacy", label: "Privacy Policy", description: "Data collection, sharing, and user rights disclosure", icon: Globe, color: "text-teal-400" },
  { id: "agreement", label: "Service Agreement", description: "MSA, SOW, freelancer, or partnership agreement", icon: Handshake, color: "text-[#00BFBF]" },
];

function NdaForm({ onSubmit, loading }: { onSubmit: (d: Record<string, string>) => void; loading: boolean }) {
  const [data, setData] = useState({ disclosingParty: "", receivingParty: "", ndaType: "mutual", purpose: "", duration: "3 years", jurisdiction: "State of Delaware" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setData(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Disclosing Party" placeholder="e.g. Acme Corporation" value={data.disclosingParty} onChange={set("disclosingParty")} />
        <Field label="Receiving Party" placeholder="e.g. Jane Smith / Partner LLC" value={data.receivingParty} onChange={set("receivingParty")} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SelectField label="NDA Type" value={data.ndaType} onChange={set("ndaType")}
          options={[["mutual", "Mutual"], ["one-way", "One-Way"], ["employee", "Employee"], ["vendor", "Vendor"]]} />
        <Field label="Duration" placeholder="e.g. 3 years" value={data.duration} onChange={set("duration")} />
        <Field label="Jurisdiction" placeholder="State of Delaware" value={data.jurisdiction} onChange={set("jurisdiction")} />
      </div>
      <TextareaField label="Purpose of Disclosure" placeholder="Describe the business relationship or project (e.g. Evaluating a potential software integration partnership)" value={data.purpose} onChange={set("purpose")} />
      <SubmitButton loading={loading} onClick={() => onSubmit({ type: "nda", ...data })} label="Generate NDA" />
    </div>
  );
}

function TermsForm({ onSubmit, loading }: { onSubmit: (d: Record<string, string>) => void; loading: boolean }) {
  const [data, setData] = useState({ companyName: "", serviceName: "", websiteUrl: "", jurisdiction: "State of Delaware", gdprCompliant: "true", ccpaCompliant: "true" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setData(p => ({ ...p, [k]: e.target.value }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Company Name" placeholder="Acme Inc." value={data.companyName} onChange={set("companyName")} />
        <Field label="Service Name" placeholder="Acme Dashboard" value={data.serviceName} onChange={set("serviceName")} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Website URL (optional)" placeholder="https://acme.com" value={data.websiteUrl} onChange={set("websiteUrl")} />
        <Field label="Jurisdiction" placeholder="State of Delaware" value={data.jurisdiction} onChange={set("jurisdiction")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="GDPR Compliant" value={data.gdprCompliant} onChange={set("gdprCompliant")} options={[["true", "Yes"], ["false", "No"]]} />
        <SelectField label="CCPA Compliant" value={data.ccpaCompliant} onChange={set("ccpaCompliant")} options={[["true", "Yes"], ["false", "No"]]} />
      </div>
      <SubmitButton loading={loading} onClick={() => onSubmit({ type: "terms", ...data })} label="Generate Terms" />
    </div>
  );
}

function PrivacyForm({ onSubmit, loading }: { onSubmit: (d: Record<string, string>) => void; loading: boolean }) {
  const [data, setData] = useState({ companyName: "", websiteUrl: "", jurisdiction: "State of Delaware", hasAnalytics: "true", hasCookies: "true", sellsData: "false" });
  const [dataTypes, setDataTypes] = useState("name, email, usage data");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setData(p => ({ ...p, [k]: e.target.value }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Company Name" placeholder="Acme Inc." value={data.companyName} onChange={set("companyName")} />
        <Field label="Website URL (optional)" placeholder="https://acme.com" value={data.websiteUrl} onChange={set("websiteUrl")} />
      </div>
      <Field label="Data Types Collected (comma-separated)" placeholder="name, email, IP address, usage data" value={dataTypes} onChange={e => setDataTypes(e.target.value)} />
      <div className="grid grid-cols-3 gap-4">
        <SelectField label="Analytics" value={data.hasAnalytics} onChange={set("hasAnalytics")} options={[["true", "Yes"], ["false", "No"]]} />
        <SelectField label="Cookies" value={data.hasCookies} onChange={set("hasCookies")} options={[["true", "Yes"], ["false", "No"]]} />
        <SelectField label="Sells Data" value={data.sellsData} onChange={set("sellsData")} options={[["false", "No"], ["true", "Yes"]]} />
      </div>
      <SubmitButton loading={loading} onClick={() => onSubmit({ type: "privacy", ...data, dataTypes: JSON.stringify(dataTypes.split(",").map(s => s.trim()).filter(Boolean)) })} label="Generate Privacy Policy" />
    </div>
  );
}

function AgreementForm({ onSubmit, loading }: { onSubmit: (d: Record<string, string>) => void; loading: boolean }) {
  const [data, setData] = useState({ clientName: "", vendorName: "", agreementType: "msa", paymentTerms: "Net-30", startDate: "", endDate: "", value: "", jurisdiction: "State of Delaware" });
  const [services, setServices] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setData(p => ({ ...p, [k]: e.target.value }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Client Name" placeholder="Acme Corp." value={data.clientName} onChange={set("clientName")} />
        <Field label="Vendor / Service Provider" placeholder="Jane Smith Consulting" value={data.vendorName} onChange={set("vendorName")} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SelectField label="Agreement Type" value={data.agreementType} onChange={set("agreementType")}
          options={[["msa", "Master Service Agreement"], ["sow", "Statement of Work"], ["freelancer", "Freelancer Agreement"], ["partnership", "Partnership Agreement"]]} />
        <Field label="Payment Terms" placeholder="Net-30" value={data.paymentTerms} onChange={set("paymentTerms")} />
        <Field label="Contract Value (optional)" placeholder="$25,000" value={data.value} onChange={set("value")} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Start Date (optional)" type="date" value={data.startDate} onChange={set("startDate")} />
        <Field label="End Date (optional)" type="date" value={data.endDate} onChange={set("endDate")} />
      </div>
      <TextareaField label="Services Description" placeholder="Describe the services to be provided in detail..." value={services} onChange={e => setServices(e.target.value)} />
      <SubmitButton loading={loading} onClick={() => onSubmit({ type: "agreement", ...data, services })} label="Generate Agreement" />
    </div>
  );
}

// ── Shared field components ───────────────────────────────────────
function Field({ label, placeholder, value, onChange, type = "text" }: { label: string; placeholder?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[#7A8B99] uppercase tracking-wider">{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        className="w-full bg-[#001A33]/60 border border-[#00BFBF]/15 rounded-xl text-sm text-[#E0F2F1] placeholder-[#4A5B6A] px-3 py-2.5 outline-none focus:border-[#00BFBF]/40 transition-colors" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: [string, string][] }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[#7A8B99] uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select value={value} onChange={onChange}
          className="w-full appearance-none bg-[#001A33]/60 border border-[#00BFBF]/15 rounded-xl text-sm text-[#E0F2F1] px-3 py-2.5 pr-8 outline-none focus:border-[#00BFBF]/40 transition-colors">
          {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8B99] pointer-events-none" />
      </div>
    </div>
  );
}

function TextareaField({ label, placeholder, value, onChange }: { label: string; placeholder?: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[#7A8B99] uppercase tracking-wider">{label}</label>
      <textarea placeholder={placeholder} value={value} onChange={onChange} rows={3}
        className="w-full bg-[#001A33]/60 border border-[#00BFBF]/15 rounded-xl text-sm text-[#E0F2F1] placeholder-[#4A5B6A] px-3 py-2.5 outline-none focus:border-[#00BFBF]/40 transition-colors resize-none" />
    </div>
  );
}

function SubmitButton({ loading, onClick, label }: { loading: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00BFBF] to-[#0099CC] text-[#001A33] font-semibold text-sm hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2">
      {loading ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><FileSignature size={16} /> {label}</>}
    </button>
  );
}

// ── Result viewer ─────────────────────────────────────────────────
function DocumentResult({ content, title, warnings, wordCount }: { content: string; title: string; warnings: string[]; wordCount: number }) {
  const [copied, setCopied] = useState(false);

  function copyToClipboard() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadMarkdown() {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-400">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-[#E0F2F1] text-sm">{title}</h3>
          <p className="text-xs text-[#7A8B99]">{wordCount} words</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyToClipboard}
            className="flex items-center gap-1.5 text-xs text-[#7A8B99] hover:text-[#00BFBF] border border-[#00BFBF]/15 hover:border-[#00BFBF]/30 rounded-xl px-3 py-2 transition-all">
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={downloadMarkdown}
            className="flex items-center gap-1.5 text-xs text-[#001A33] bg-[#00BFBF] hover:bg-[#00BFBF]/90 rounded-xl px-3 py-2 font-medium transition-all">
            <Download size={13} /> Download .md
          </button>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 space-y-1">
          {warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-400">⚠ {w}</p>
          ))}
        </div>
      )}

      <div className="bg-[#001A33]/80 border border-[#00BFBF]/10 rounded-2xl p-5 max-h-[60vh] overflow-y-auto">
        <pre className="text-xs text-[#C8D8E8] whitespace-pre-wrap font-mono leading-relaxed">{content}</pre>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function Generate() {
  const [activeType, setActiveType] = useState<DocType>("nda");
  const [result, setResult] = useState<{ content: string; title: string; warnings: string[]; wordCount: number } | null>(null);

  const mutation = trpc.generate.create.useMutation({
    onSuccess: (data) => setResult({ content: data.content, title: data.title, warnings: data.warnings, wordCount: data.wordCount }),
    onError: (err) => toast.error(err.message),
  });

  function handleSubmit(formData: Record<string, string>) {
    setResult(null);
    const payload: Record<string, unknown> = { ...formData };
    if (payload.gdprCompliant !== undefined) payload.gdprCompliant = payload.gdprCompliant === "true";
    if (payload.ccpaCompliant !== undefined) payload.ccpaCompliant = payload.ccpaCompliant === "true";
    if (payload.hasAnalytics !== undefined) payload.hasAnalytics = payload.hasAnalytics === "true";
    if (payload.hasCookies !== undefined) payload.hasCookies = payload.hasCookies === "true";
    if (payload.sellsData !== undefined) payload.sellsData = payload.sellsData === "true";
    if (typeof payload.dataTypes === "string") {
      try { payload.dataTypes = JSON.parse(payload.dataTypes); } catch { payload.dataTypes = [payload.dataTypes as string]; }
    }
    // Remove empty optional strings
    Object.keys(payload).forEach(k => { if (payload[k] === "") delete payload[k]; });
    mutation.mutate(payload as Parameters<typeof mutation.mutate>[0]);
  }

  const activeOption = DOC_OPTIONS.find(o => o.id === activeType)!;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[#00BFBF]/10 border border-[#00BFBF]/20 flex items-center justify-center">
            <FileSignature className="w-5 h-5 text-[#00BFBF]" />
          </div>
          <h1 className="text-2xl font-semibold text-[#E0F2F1]">Generate</h1>
        </div>
        <p className="text-sm text-[#7A8B99]">
          Create production-ready legal documents — GDPR/CCPA compliant, jurisdiction-aware, ready to negotiate.
        </p>
      </div>

      {/* Document type selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {DOC_OPTIONS.map(opt => {
          const Icon = opt.icon;
          const isActive = activeType === opt.id;
          return (
            <button key={opt.id} onClick={() => { setActiveType(opt.id); setResult(null); }}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all ${isActive ? "bg-[#002B52]/80 border-[#00BFBF]/30" : "bg-[#002B52]/30 border-[#00BFBF]/10 hover:border-[#00BFBF]/20"}`}>
              <Icon size={22} className={isActive ? opt.color : "text-[#7A8B99]"} />
              <span className={`text-xs font-medium ${isActive ? "text-[#E0F2F1]" : "text-[#7A8B99]"}`}>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form panel */}
      <div className="bg-[#002B52]/40 border border-[#00BFBF]/15 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          {(() => { const Icon = activeOption.icon; return <Icon size={18} className={activeOption.color} />; })()}
          <h2 className="text-sm font-semibold text-[#E0F2F1]">{activeOption.label}</h2>
          <p className="text-xs text-[#7A8B99]">— {activeOption.description}</p>
        </div>

        {activeType === "nda" && <NdaForm onSubmit={handleSubmit} loading={mutation.isPending} />}
        {activeType === "terms" && <TermsForm onSubmit={handleSubmit} loading={mutation.isPending} />}
        {activeType === "privacy" && <PrivacyForm onSubmit={handleSubmit} loading={mutation.isPending} />}
        {activeType === "agreement" && <AgreementForm onSubmit={handleSubmit} loading={mutation.isPending} />}
      </div>

      {/* Result */}
      {result && (
        <div className="bg-[#002B52]/40 border border-[#00BFBF]/15 rounded-2xl p-6">
          <DocumentResult {...result} />
        </div>
      )}
    </div>
  );
}
