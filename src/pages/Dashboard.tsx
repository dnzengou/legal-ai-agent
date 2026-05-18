import { useEffect, useState } from "react";
import { trpc } from "@/providers/trpc";
import { Link } from "react-router";
import {
  FileText,
  Brain,
  Search,
  Gavel,
  ShieldCheck,
  TrendingUp,
  Activity,
  Zap,
  ArrowRight,
  Scale,
  FileSignature,
  Shield,
  Cpu,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PIE_COLORS = ["#00BFBF", "#FF6B35", "#7A8B99", "#E0F2F1", "#002B52"];

export default function Dashboard() {
  const { data: analytics } = trpc.analytics.dashboard.useQuery({ period: "month" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = [
    {
      label: "Documents",
      value: analytics?.counts.documents ?? 0,
      icon: FileText,
      color: "#00BFBF",
      change: "+12%",
    },
    {
      label: "Analyses",
      value: analytics?.counts.analyses ?? 0,
      icon: Brain,
      color: "#FF6B35",
      change: "+28%",
    },
    {
      label: "Precedents",
      value: analytics?.counts.precedents ?? 0,
      icon: Search,
      color: "#7A8B99",
      change: "+5%",
    },
    {
      label: "Judgments",
      value: analytics?.counts.judgments ?? 0,
      icon: Gavel,
      color: "#E0F2F1",
      change: "+8%",
    },
  ];

  const recentActivity = analytics?.recentAnalyses ?? [];

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[#E0F2F1] tracking-tight">Dashboard</h1>
          <p className="text-[#7A8B99] mt-1">Intelligence-driven legal workflow overview</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono-data text-[#00BFBF]">
          <span className="w-2 h-2 rounded-full bg-[#00BFBF] animate-pulse" />
          SYSTEM ONLINE
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="glass-card rounded-2xl p-5 glow-teal-hover transition-all duration-300"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono-data text-[#7A8B99] uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-semibold text-[#E0F2F1] mt-2">{stat.value}</p>
                <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                  <TrendingUp size={12} />
                  {stat.change} this month
                </p>
              </div>
              <div
                className="p-2.5 rounded-xl"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon size={22} style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-[#00BFBF]" />
              <h3 className="text-sm font-semibold text-[#E0F2F1]">Weekly Activity</h3>
            </div>
            <span className="text-xs font-mono-data text-[#7A8B99]">LAST 7 DAYS</span>
          </div>
          {mounted && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics?.activityData ?? []}>
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#7A8B99", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(0,191,191,0.1)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#7A8B99", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#002B52",
                    border: "1px solid rgba(0,191,191,0.2)",
                    borderRadius: 12,
                    color: "#E0F2F1",
                  }}
                />
                <Bar dataKey="uploads" fill="#00BFBF" radius={[4, 4, 0, 0]} opacity={0.8} />
                <Bar dataKey="analyses" fill="#FF6B35" radius={[4, 4, 0, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Analysis Types */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-[#FF6B35]" />
              <h3 className="text-sm font-semibold text-[#E0F2F1]">Analysis Distribution</h3>
            </div>
            <span className="text-xs font-mono-data text-[#7A8B99]">BY TYPE</span>
          </div>
          {mounted && (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={analytics?.analysisTypes ?? []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="count"
                  nameKey="type"
                  stroke="none"
                >
                  {(analytics?.analysisTypes ?? []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#002B52",
                    border: "1px solid rgba(0,191,191,0.2)",
                    borderRadius: 12,
                    color: "#E0F2F1",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {(analytics?.analysisTypes ?? []).map((item, i) => (
              <div key={item.type} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                <span className="text-xs text-[#7A8B99]">{item.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Analyses */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain size={18} className="text-[#00BFBF]" />
              <h3 className="text-sm font-semibold text-[#E0F2F1]">Recent Analyses</h3>
            </div>
            <Link
              to="/analysis"
              className="flex items-center gap-1 text-xs text-[#00BFBF] hover:text-[#E0F2F1] transition-colors"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-[#7A8B99] py-4 text-center">No analyses yet. Start by uploading a document.</p>
            ) : (
              recentActivity.map((analysis) => (
                <div
                  key={analysis.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-[#001A33]/50 border border-[#00BFBF]/5 hover:border-[#00BFBF]/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#00BFBF]/10 flex items-center justify-center flex-shrink-0">
                    <Scale size={18} className="text-[#00BFBF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#E0F2F1] truncate">
                      {String(analysis.type).replace(/_/g, " ").toUpperCase()}
                    </p>
                    <p className="text-xs text-[#7A8B99] truncate">{analysis.summary ?? "Processing..."}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-mono-data ${
                        analysis.status === "completed"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : analysis.status === "processing"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {analysis.status}
                    </span>
                    {analysis.confidence && (
                      <span className="text-xs font-mono-data text-[#00BFBF]">
                        {(analysis.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[#E0F2F1] mb-4 flex items-center gap-2">
            <Zap size={18} className="text-[#FF6B35]" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link
              to="/contract-review"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#00BFBF]/10 border border-[#00BFBF]/20 hover:border-[#00BFBF]/40 hover:bg-[#00BFBF]/15 transition-all group"
            >
              <Shield size={18} className="text-[#00BFBF] group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-sm font-medium text-[#E0F2F1]">Contract Review</p>
                <p className="text-xs text-[#7A8B99]">5-agent safety analysis</p>
              </div>
            </Link>
            <Link
              to="/documents"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#001A33]/50 border border-[#00BFBF]/10 hover:border-[#00BFBF]/30 hover:bg-[#00BFBF]/5 transition-all group"
            >
              <FileText size={18} className="text-[#00BFBF] group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-sm font-medium text-[#E0F2F1]">Upload Document</p>
                <p className="text-xs text-[#7A8B99]">Add new legal document</p>
              </div>
            </Link>
            <Link
              to="/contracts"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#001A33]/50 border border-[#00BFBF]/10 hover:border-[#00BFBF]/30 hover:bg-[#00BFBF]/5 transition-all group"
            >
              <FileSignature size={18} className="text-[#FF6B35] group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-sm font-medium text-[#E0F2F1]">Generate Contract</p>
                <p className="text-xs text-[#7A8B99]">Create from template</p>
              </div>
            </Link>
            <Link
              to="/precedents"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#001A33]/50 border border-[#00BFBF]/10 hover:border-[#00BFBF]/30 hover:bg-[#00BFBF]/5 transition-all group"
            >
              <Search size={18} className="text-[#7A8B99] group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-sm font-medium text-[#E0F2F1]">Search Precedents</p>
                <p className="text-xs text-[#7A8B99]">Find relevant case law</p>
              </div>
            </Link>
            <Link
              to="/ai-engines"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#001A33]/50 border border-[#00BFBF]/10 hover:border-[#00BFBF]/30 hover:bg-[#00BFBF]/5 transition-all group"
            >
              <Cpu size={18} className="text-[#7A8B99] group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-sm font-medium text-[#E0F2F1]">AI Engines</p>
                <p className="text-xs text-[#7A8B99]">DeepSeek, Kimi, GPT+</p>
              </div>
            </Link>
            <Link
              to="/ethics"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#001A33]/50 border border-[#00BFBF]/10 hover:border-[#00BFBF]/30 hover:bg-[#00BFBF]/5 transition-all group"
            >
              <ShieldCheck size={18} className="text-[#E0F2F1] group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-sm font-medium text-[#E0F2F1]">Ethics Review</p>
                <p className="text-xs text-[#7A8B99]">Audit AI fairness</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
