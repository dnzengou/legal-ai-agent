import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, FileText, Settings, LogOut, Scale, PanelLeft, PanelLeftClose, Plus } from "lucide-react";

const navItems = [
  { path: "/", icon: MessageSquare, label: "Chat" },
  { path: "/documents", icon: FileText, label: "Documents" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-[#080f1a] overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`relative flex flex-col flex-shrink-0 transition-all duration-200 ease-in-out sidebar-glow
          ${collapsed ? "w-[60px]" : "w-[210px]"}
          border-r border-[#1f3044] bg-[#060c18]`}
      >
        {/* Top glow accent */}
        <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(0,204,204,0.07) 0%, transparent 70%)" }} />

        {/* Logo row */}
        <div className={`relative flex items-center px-3 py-4 border-b border-[#1a2e42]
          ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#00CCCC]/15 border border-[#00CCCC]/25 flex items-center justify-center flex-shrink-0">
                <Scale size={14} className="text-[#00CCCC]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#E4F5F4] truncate leading-tight">Nexus Legal</p>
                <p className="text-[9px] font-mono-data text-[#00CCCC]/60 tracking-widest uppercase">AI</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-[#4a6880] hover:text-[#00CCCC] hover:bg-[#00CCCC]/10 transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed
              ? <PanelLeft size={15} />
              : <PanelLeftClose size={15} />}
          </button>
        </div>

        {/* New Chat */}
        <div className="px-2 pt-3 pb-1">
          <button
            onClick={() => navigate("/")}
            className={`flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-xs font-medium
              bg-[#00CCCC]/10 text-[#00CCCC] border border-[#00CCCC]/20
              hover:bg-[#00CCCC]/18 hover:border-[#00CCCC]/35
              active:scale-[0.98] transition-all duration-150
              ${collapsed ? "justify-center" : ""}`}
            aria-label="New chat"
          >
            <Plus size={13} />
            {!collapsed && <span>New Chat</span>}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto" role="navigation" aria-label="Main">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                aria-label={collapsed ? label : undefined}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150 group relative
                  ${active
                    ? "bg-[#00CCCC]/12 text-[#00CCCC] border border-[#00CCCC]/22 shadow-sm"
                    : "text-[#8da4b8] hover:text-[#E4F5F4] hover:bg-[#1f3044]/70 border border-transparent"
                  }
                  ${collapsed ? "justify-center" : ""}`}
              >
                <Icon size={17} className={`flex-shrink-0 transition-colors ${active ? "text-[#00CCCC]" : "group-hover:text-[#00CCCC]"}`} />
                {!collapsed && <span>{label}</span>}
                {active && !collapsed && (
                  <div className="ml-auto w-1 h-1 rounded-full bg-[#00CCCC] animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-2 border-t border-[#1a2e42]">
          {user ? (
            <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
              {user.avatar
                ? <img src={user.avatar} alt="" className="w-7 h-7 rounded-full border border-[#00CCCC]/25 flex-shrink-0" />
                : (
                  <div className="w-7 h-7 rounded-full bg-[#00CCCC]/15 border border-[#00CCCC]/25 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-semibold text-[#00CCCC]">
                      {(user.name ?? "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#E4F5F4] truncate">{user.name ?? "User"}</p>
                    <p className="text-[10px] text-[#8da4b8] truncate">{user.email ?? ""}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 rounded-lg text-[#4a6880] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    aria-label="Sign out"
                  >
                    <LogOut size={13} />
                  </button>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg w-full
                bg-[#00CCCC]/10 text-[#00CCCC] text-xs font-medium
                hover:bg-[#00CCCC]/18 border border-[#00CCCC]/20 hover:border-[#00CCCC]/35
                transition-all ${collapsed ? "justify-center" : ""}`}
              aria-label="Sign in"
            >
              <LogOut size={13} />
              {!collapsed && <span>Sign In</span>}
            </button>
          )}
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-hidden" id="main-content">
        {children}
      </main>
    </div>
  );
}
