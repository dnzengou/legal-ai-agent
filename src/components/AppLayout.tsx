import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, FileText, Settings, LogOut, ChevronLeft, ChevronRight,
  Menu, X, Scale, Shield, Layers, Wand2, MessageSquare,
} from "lucide-react";

const navItems = [
  { path: "/chat", icon: MessageSquare, label: "Chat" },
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/documents", icon: FileText, label: "Documents" },
  { path: "/review", icon: Shield, label: "Review" },
  { path: "/batch-review", icon: Layers, label: "Batch Review" },
  { path: "/generate", icon: Wand2, label: "Generate" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex" style={{ zIndex: 1 }}>
      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <button onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-[#002B52]/80 border border-[#00BFBF]/20 text-[#E0F2F1]">
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <aside className={`fixed lg:sticky top-0 left-0 h-screen z-40 flex flex-col border-r border-[#00BFBF]/10 transition-all duration-300 ease-in-out ${collapsed ? "w-20" : "w-64"} ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} bg-[#001A33]/90 backdrop-blur-xl`}>
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-[#00BFBF]/10 ${collapsed ? "justify-center" : ""}`}>
          <Scale className="w-8 h-8 text-[#00BFBF] flex-shrink-0" />
          {!collapsed && (<div><h1 className="text-lg font-semibold text-[#E0F2F1] tracking-tight">Nexus Legal</h1><p className="text-[10px] text-[#7A8B99] font-mono-data tracking-wider">AI LEGAL PLATFORM</p></div>)}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive ? "bg-[#00BFBF]/15 text-[#00BFBF] border border-[#00BFBF]/20" : "text-[#7A8B99] hover:text-[#E0F2F1] hover:bg-[#002B52]/60 border border-transparent"} ${collapsed ? "justify-center" : ""}`}>
                <Icon size={20} className={`flex-shrink-0 ${isActive ? "text-[#00BFBF]" : "group-hover:text-[#00BFBF]"}`} />
                {!collapsed && <span>{item.label}</span>}
                {isActive && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00BFBF] animate-pulse" />}
              </Link>
            );
          })}
        </nav>
        <button onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center py-3 border-t border-[#00BFBF]/10 text-[#7A8B99] hover:text-[#00BFBF] transition-colors">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        <div className="p-3 border-t border-[#00BFBF]/10">
          {user ? (
            <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
              {user.avatar ? <img src={user.avatar} alt="" className="w-9 h-9 rounded-full border border-[#00BFBF]/30 flex-shrink-0" />
                : <div className="w-9 h-9 rounded-full bg-[#00BFBF]/20 border border-[#00BFBF]/30 flex items-center justify-center flex-shrink-0"><span className="text-xs font-semibold text-[#00BFBF]">{(user.name ?? "U").charAt(0).toUpperCase()}</span></div>}
              {!collapsed && (<div className="flex-1 min-w-0"><p className="text-sm font-medium text-[#E0F2F1] truncate">{user.name ?? "User"}</p><p className="text-xs text-[#7A8B99] truncate">{user.email ?? ""}</p></div>)}
              {!collapsed && <button onClick={logout} className="p-1.5 rounded-lg text-[#7A8B99] hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Logout"><LogOut size={16} /></button>}
            </div>
          ) : (
            <button onClick={() => navigate("/login")} className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-[#00BFBF]/15 text-[#00BFBF] text-sm font-medium hover:bg-[#00BFBF]/25 transition-colors border border-[#00BFBF]/20 w-full ${collapsed ? "justify-center" : ""}`}>
              <LogOut size={16} />{!collapsed && <span>Sign In</span>}
            </button>
          )}
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}
