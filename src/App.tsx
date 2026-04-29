import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import FloatingNav from "@/components/FloatingNav";
import TopRightAuth from "@/components/TopRightAuth";

// Eager: landing route users see first
import Index from "./pages/Index.tsx";

// Lazy: everything else (split into separate chunks)
const MatchDetail = lazy(() => import("./pages/MatchDetail.tsx"));
const Scoreboard = lazy(() => import("./pages/Scoreboard.tsx"));
const MakeYourBets = lazy(() => import("./pages/MakeYourBets.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const MyPicks = lazy(() => import("./pages/MyPicks.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const DemoMatchDetail = lazy(() => import("./pages/DemoMatchDetail.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <FloatingNav />
          <TopRightAuth />
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/match/:id" element={<MatchDetail />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/demo-match" element={<DemoMatchDetail />} />
              <Route path="/my-picks" element={<MyPicks />} />
              <Route path="/make-your-bets" element={<MakeYourBets />} />
              <Route path="/leaderboard" element={<Scoreboard />} />
              <Route path="/scoreboard" element={<Scoreboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
