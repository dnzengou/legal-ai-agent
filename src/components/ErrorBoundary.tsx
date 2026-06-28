import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Link } from "react-router";

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#001A33] px-6">
          <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-[#E0F2F1] mb-2">Something went wrong</h2>
            <p className="text-sm text-[#7A8B99] mb-6">
              {this.state.error?.message ?? "An unexpected error occurred"}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00BFBF] text-[#001A33] text-sm font-semibold hover:brightness-110 transition-all"
              >
                <RefreshCw size={16} /> Reload Page
              </button>
              <Link
                to="/dashboard"
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#002B52] text-[#E0F2F1] text-sm font-medium border border-[#00BFBF]/20 hover:border-[#00BFBF]/40 transition-all"
              >
                <Home size={16} /> Go Home
              </Link>
            </div>
            {this.state.error?.stack && (
              <pre className="mt-6 p-3 rounded-xl bg-[#001A33]/80 text-[10px] text-[#7A8B99] font-mono-data overflow-x-auto text-left border border-red-500/10">
                {this.state.error.stack.split("\n").slice(0, 5).join("\n")}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
