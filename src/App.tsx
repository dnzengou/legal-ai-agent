import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router";
import NeuralBackground from "./components/NeuralBackground";
import AppLayout from "./components/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import GlobalSearch from "./components/GlobalSearch";
import KeyboardShortcuts from "./components/KeyboardShortcuts";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { Toaster } from "@/components/ui/sonner";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Documents = lazy(() => import("./pages/Documents"));
const ContractReview = lazy(() => import("./pages/ContractReview"));
const Analysis = lazy(() => import("./pages/Analysis"));
const Contracts = lazy(() => import("./pages/Contracts"));
const Precedents = lazy(() => import("./pages/Precedents"));
const Judgments = lazy(() => import("./pages/Judgments"));
const Ethics = lazy(() => import("./pages/Ethics"));
const AiEngines = lazy(() => import("./pages/AiEngines"));
const Settings = lazy(() => import("./pages/Settings"));
const BatchReview = lazy(() => import("./pages/BatchReview"));
const Generate = lazy(() => import("./pages/Generate"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-[#00BFBF]/20" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-t-[#00BFBF] animate-spin" />
      </div>
    </div>
  );
}

function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <NeuralBackground />
      <AppLayout>
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </AppLayout>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GlobalSearch />
      <KeyboardShortcuts />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<AppLayoutWrapper><Dashboard /></AppLayoutWrapper>} />
        <Route path="/documents" element={<AppLayoutWrapper><Documents /></AppLayoutWrapper>} />
        <Route path="/contract-review" element={<AppLayoutWrapper><ContractReview /></AppLayoutWrapper>} />
        <Route path="/analysis" element={<AppLayoutWrapper><Analysis /></AppLayoutWrapper>} />
        <Route path="/contracts" element={<AppLayoutWrapper><Contracts /></AppLayoutWrapper>} />
        <Route path="/precedents" element={<AppLayoutWrapper><Precedents /></AppLayoutWrapper>} />
        <Route path="/judgments" element={<AppLayoutWrapper><Judgments /></AppLayoutWrapper>} />
        <Route path="/ethics" element={<AppLayoutWrapper><Ethics /></AppLayoutWrapper>} />
        <Route path="/ai-engines" element={<AppLayoutWrapper><AiEngines /></AppLayoutWrapper>} />
        <Route path="/settings" element={<AppLayoutWrapper><Settings /></AppLayoutWrapper>} />
        <Route path="/batch-review" element={<AppLayoutWrapper><BatchReview /></AppLayoutWrapper>} />
        <Route path="/generate" element={<AppLayoutWrapper><Generate /></AppLayoutWrapper>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="bottom-right" toastOptions={{ style: { background: "#002B52", border: "1px solid rgba(0,191,191,0.2)", color: "#E0F2F1" } }} />
    </ErrorBoundary>
  );
}
