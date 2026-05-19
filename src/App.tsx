import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router";
import AppLayout from "./components/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { Toaster } from "@/components/ui/sonner";

const Chat = lazy(() => import("./pages/Chat"));
const Documents = lazy(() => import("./pages/Documents"));
const Settings = lazy(() => import("./pages/Settings"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#080f1a]">
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-2 border-[#00BFBF]/20" />
        <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-t-[#00BFBF] animate-spin" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="*"
          element={
            <AppLayout>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Chat />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AppLayout>
          }
        />
      </Routes>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#0d1829",
            border: "1px solid rgba(0,191,191,0.2)",
            color: "#E0F2F1",
          },
        }}
      />
    </ErrorBoundary>
  );
}
