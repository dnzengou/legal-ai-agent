import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import {
  User,
  Bell,
  Shield,
  Globe,
  Database,
  Activity,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: health } = trpc.analytics.systemHealth.useQuery();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-[#E0F2F1]">Settings</h1>
        <p className="text-[#7A8B99] mt-1 text-sm">Platform configuration and system status</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[#E0F2F1] mb-5 flex items-center gap-2">
            <User size={16} className="text-[#00BFBF]" />
            Profile
          </h3>
          <div className="flex items-center gap-4 mb-5">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-16 h-16 rounded-full border-2 border-[#00BFBF]/30" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#00BFBF]/20 border-2 border-[#00BFBF]/30 flex items-center justify-center">
                <span className="text-xl font-semibold text-[#00BFBF]">
                  {(user?.name ?? "U").charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="text-base font-medium text-[#E0F2F1]">{user?.name ?? "Guest"}</p>
              <p className="text-sm text-[#7A8B99]">{user?.email ?? "Not signed in"}</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono-data bg-[#00BFBF]/15 text-[#00BFBF] mt-1 capitalize">
                {user?.role ?? "guest"}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono-data text-[#7A8B99] uppercase tracking-wider block mb-1">Display Name</label>
              <input
                type="text"
                defaultValue={user?.name ?? ""}
                className="w-full px-4 py-2 rounded-xl bg-[#001A33]/60 border border-[#00BFBF]/15 text-[#E0F2F1] text-sm focus:border-[#00BFBF]/50 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-mono-data text-[#7A8B99] uppercase tracking-wider block mb-1">Email</label>
              <input
                type="email"
                defaultValue={user?.email ?? ""}
                readOnly
                className="w-full px-4 py-2 rounded-xl bg-[#001A33]/40 border border-[#00BFBF]/10 text-[#7A8B99] text-sm cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[#E0F2F1] mb-5 flex items-center gap-2">
            <Bell size={16} className="text-[#FF6B35]" />
            Preferences
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#E0F2F1]">Notifications</p>
                <p className="text-xs text-[#7A8B99]">Receive alerts for analysis completion</p>
              </div>
              <button
                onClick={() => setNotifEnabled(!notifEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative ${notifEnabled ? "bg-[#00BFBF]" : "bg-[#002B52]"}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${notifEnabled ? "translate-x-5.5" : "translate-x-0.5"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#E0F2F1]">Auto-Analyze</p>
                <p className="text-xs text-[#7A8B99]">Automatically analyze uploaded documents</p>
              </div>
              <button
                onClick={() => setAutoAnalyze(!autoAnalyze)}
                className={`w-11 h-6 rounded-full transition-colors relative ${autoAnalyze ? "bg-[#00BFBF]" : "bg-[#002B52]"}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${autoAnalyze ? "translate-x-5.5" : "translate-x-0.5"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#E0F2F1]">Dark Mode</p>
                <p className="text-xs text-[#7A8B99]">Dark theme for the interface</p>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`w-11 h-6 rounded-full transition-colors relative ${darkMode ? "bg-[#00BFBF]" : "bg-[#002B52]"}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${darkMode ? "translate-x-5.5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[#E0F2F1] mb-5 flex items-center gap-2">
            <Activity size={16} className="text-emerald-400" />
            System Health
          </h3>
          {health ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-[#E0F2F1]">Status: {health.status}</p>
                  <p className="text-xs text-[#7A8B99]">All systems operational</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#001A33]/50 text-center">
                  <p className="text-xs font-mono-data text-[#7A8B99]">Uptime</p>
                  <p className="text-lg font-semibold text-[#00BFBF]">{health.uptime}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#001A33]/50 text-center">
                  <p className="text-xs font-mono-data text-[#7A8B99]">Response</p>
                  <p className="text-lg font-semibold text-[#00BFBF]">{health.responseTime}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#001A33]/50 text-center">
                  <p className="text-xs font-mono-data text-[#7A8B99]">Pending</p>
                  <p className="text-lg font-semibold" style={{ color: health.pendingJobs > 0 ? "#FF6B35" : "#00BFBF" }}>
                    {health.pendingJobs}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#001A33]/50 text-center">
                  <p className="text-xs font-mono-data text-[#7A8B99]">Failed</p>
                  <p className="text-lg font-semibold" style={{ color: health.failedJobs > 0 ? "#FF6B35" : "#00BFBF" }}>
                    {health.failedJobs}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#7A8B99]">Version {health.version}</span>
                <span className="text-[#7A8B99]">{health.totalDocuments} total documents</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="text-[#00BFBF] animate-spin" />
            </div>
          )}
        </div>

        {/* Security */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[#E0F2F1] mb-5 flex items-center gap-2">
            <Shield size={16} className="text-[#00BFBF]" />
            Security
          </h3>
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-[#001A33]/50 flex items-center gap-3">
              <Database size={18} className="text-[#00BFBF]" />
              <div>
                <p className="text-sm font-medium text-[#E0F2F1]">Encryption</p>
                <p className="text-xs text-[#7A8B99]">AES-256 at rest, TLS 1.3 in transit</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#001A33]/50 flex items-center gap-3">
              <Globe size={18} className="text-[#00BFBF]" />
              <div>
                <p className="text-sm font-medium text-[#E0F2F1]">OAuth 2.0</p>
                <p className="text-xs text-[#7A8B99]">Secure authentication via Kimi</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#001A33]/50 flex items-center gap-3">
              <RefreshCw size={18} className="text-[#00BFBF]" />
              <div>
                <p className="text-sm font-medium text-[#E0F2F1]">Auto-Backup</p>
                <p className="text-xs text-[#7A8B99]">Daily automated backups</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
