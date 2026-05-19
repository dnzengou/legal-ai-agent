import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  MessageSquare, FileText, Settings, LogOut, Scale,
  PanelLeft, PanelLeftClose, Plus,
} from "lucide-react";

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
      {/* Sidebar */}
      <aside
        className={`flex flex-col flex-shrink-0 border-r border-[#172130] transition-all duration-200 ease-in-out
          ${collapsed ? "w-[60px]" : "w-[220px]"}
          bg-[#07101a]/95 backdrop-blur-xl`}
      >
        {/* Logo + collapse */}
        <div className={`flex items-center gap-2.5 px-3 py-4 border-b border-[#172130] ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <Scale className="w-5 h-5 text-[#00BFBF] flex-shrink-0" />
              <span className="text-sm font-semibold text-[#E0F2F1] truncate">Nexus Legal</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-[#5a7080] hover:text-[#00BFBF] hover:bg-[#00BFBF]/10 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* New chat button */}
        <div className="px-2 pt-3 pb-1">
          <button
            onClick={() => navigate("/")}
            className={`flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-xs font-medium
              bg-[#00BFBF]/10 text-[#00BFBF] border border-[#00BFBF]/20
              hover:bg-[#00BFBF]/20 transition-colors
              ${collapsed ? "justify-center" : ""}`}
            title="New chat"
          >
            <Plus size={14} />
            {!collapsed && <span>New Chat</span>}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive
                    ? "bg-[#00BFBF]/15 text-[#00BFBF] border border-[#00BFBF]/20"
                    : "text-[#5a7080] hover:text-[#E0F2F1] hover:bg-[#172130]/60 border border-transparent"
                  }
                  ${collapsed ? "justify-center" : ""}`}
              >
                <Icon size={17} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User row */}
        <div className="p-2 border-t border-[#172130]">
          {user ? (
            <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
              {user.avatar
                ? <img src={user.avatar} alt="" className="w-7 h-7 rounded-full border border-[#00BFBF]/30 flex-shrink-0" />
                : (
                  <div className="w-7 h-7 rounded-full bg-[#00BFBF]/20 border border-[#00BFBF]/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-semibold text-[#00BFBF]">
                      {(user.name ?? "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )
              }
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#E0F2F1] truncate">{user.name ?? "User"}</p>
                    <p className="text-[10px] text-[#5a7080] truncate">{user.email ?? ""}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 rounded-lg text-[#5a7080] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Sign out"
                  >
                    <LogOut size={14} />
                  </button>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[#00BFBF]/10 text-[#00BFBF]
                text-xs font-medium hover:bg-[#00BFBF]/20 transition-colors border border-[#00BFBF]/20 w-full
                ${collapsed ? "justify-center" : ""}`}
            >
              <LogOut size={14} />
              {!collapsed && <span>Sign In</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-hidden">{children}</main>
    </div>
  );
}
