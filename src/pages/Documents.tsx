import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Trash2,
  Loader2,
  ChevronRight,
  Upload,
  Filter,
} from "lucide-react";

const docTypes = ["contract", "judgment", "statute", "brief", "pleading", "other"];

export default function Documents() {
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("contract");
  const [filterType, setFilterType] = useState<string>("");

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.document.list.useQuery({
    type: filterType || undefined,
    limit: 50,
  });
  const createDoc = trpc.document.create.useMutation({
    onSuccess: () => {
      utils.document.list.invalidate();
      setShowUpload(false);
      setTitle("");
      setContent("");
      toast.success("Document uploaded successfully");
    },
    onError: (err) => toast.error("Upload failed: " + err.message),
  });
  const deleteDoc = trpc.document.delete.useMutation({
    onSuccess: () => {
      utils.document.list.invalidate();
      toast.success("Document deleted");
    },
    onError: (err) => toast.error("Delete failed: " + err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    createDoc.mutate({
      userId: 1,
      title,
      content,
      type: type as any,
    });
  };

  const documents = data?.items ?? [];

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#E0F2F1]">Documents</h1>
          <p className="text-[#7A8B99] mt-1 text-sm">Manage and organize your legal documents</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00BFBF] text-[#001A33] text-sm font-semibold hover:brightness-110 transition-all glow-teal-hover"
        >
          {showUpload ? <ChevronRight size={16} className="rotate-90" /> : <Plus size={16} />}
          {showUpload ? "Cancel" : "New Document"}
        </button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="glass-card rounded-2xl p-6 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono-data text-[#7A8B99] uppercase tracking-wider block mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter document title..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#001A33]/60 border border-[#00BFBF]/15 text-[#E0F2F1] text-sm placeholder:text-[#7A8B99]/50 focus:border-[#00BFBF]/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-mono-data text-[#7A8B99] uppercase tracking-wider block mb-2">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#001A33]/60 border border-[#00BFBF]/15 text-[#E0F2F1] text-sm focus:border-[#00BFBF]/50 focus:outline-none transition-colors"
                >
                  {docTypes.map((t) => (
                    <option key={t} value={t} className="bg-[#002B52]">
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-mono-data text-[#7A8B99] uppercase tracking-wider block mb-2">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste document content here..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-[#001A33]/60 border border-[#00BFBF]/15 text-[#E0F2F1] text-sm placeholder:text-[#7A8B99]/50 focus:border-[#00BFBF]/50 focus:outline-none transition-colors resize-none font-mono-data"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createDoc.isPending || !title.trim() || !content.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00BFBF] text-[#001A33] text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-teal-hover"
              >
                {createDoc.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                {createDoc.isPending ? "Uploading..." : "Upload Document"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter size={16} className="text-[#7A8B99] flex-shrink-0" />
        <button
          onClick={() => setFilterType("")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
            !filterType
              ? "bg-[#00BFBF]/15 text-[#00BFBF] border border-[#00BFBF]/20"
              : "text-[#7A8B99] hover:text-[#E0F2F1] border border-transparent"
          }`}
        >
          All
        </button>
        {docTypes.map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 capitalize ${
              filterType === t
                ? "bg-[#00BFBF]/15 text-[#00BFBF] border border-[#00BFBF]/20"
                : "text-[#7A8B99] hover:text-[#E0F2F1] border border-transparent"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Documents List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-[#00BFBF] animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <FileText size={48} className="text-[#7A8B99]/30 mx-auto mb-4" />
          <p className="text-[#7A8B99]">No documents yet. Upload your first legal document.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="glass-card rounded-xl p-4 flex items-center gap-4 group hover:border-[#00BFBF]/20 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-[#00BFBF]/10 flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-[#00BFBF]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[#E0F2F1] truncate">{doc.title}</p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-data bg-[#002B52] text-[#7A8B99] border border-[#00BFBF]/10 capitalize flex-shrink-0">
                    {doc.type}
                  </span>
                </div>
                <p className="text-xs text-[#7A8B99] mt-0.5 truncate">
                  {doc.content.slice(0, 120)}...
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-mono-data ${
                    doc.status === "analyzed"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : doc.status === "processing"
                      ? "bg-amber-500/15 text-amber-400"
                      : "bg-[#002B52] text-[#7A8B99]"
                  }`}
                >
                  {doc.status}
                </span>
                <span className="text-xs font-mono-data text-[#7A8B99]">
                  {(doc as any).analysisCount ?? 0} analyses
                </span>
                <button
                  onClick={() => {
                    if (confirm("Delete this document?")) deleteDoc.mutate({ id: doc.id });
                  }}
                  className="p-1.5 rounded-lg text-[#7A8B99] hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
