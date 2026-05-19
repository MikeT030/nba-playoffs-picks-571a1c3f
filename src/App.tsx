import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import FloatingNav from "@/components/FloatingNav";
import TopRightAuth from "@/components/TopRightAuth";
import AwardDrawerHost from "@/components/AwardDrawerHost";
import SplashScreen from "@/components/SplashScreen";

// Eager: landing route users see first
import Index from "./pages/Index.tsx";
import MatchDetail from "./pages/MatchDetail.tsx";
import Scoreboard from "./pages/Scoreboard.tsx";
import MakeYourBets from "./pages/MakeYourBets.tsx";
import NotFound from "./pages/NotFound.tsx";
import MyPicks from "./pages/MyPicks.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Settings from "./pages/Settings.tsx";
import Admin from "./pages/Admin.tsx";
import DemoMatchDetail from "./pages/DemoMatchDetail.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
            <defs>
              <filter id="broadcast-inner-shadow" x="-20%" y="-20%" width="140%" height="160%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
                <feOffset in="blur" dy="2" result="offsetBlur" />
                <feComposite in="offsetBlur" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="innerShadow" />
                <feColorMatrix in="innerShadow" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.8 0" result="innerShadowColored" />
                <feMerge>
                  <feMergeNode in="SourceGraphic" />
                  <feMergeNode in="innerShadowColored" />
                </feMerge>
              </filter>
            </defs>
          </svg>
          <FloatingNav />
          <TopRightAuth />
          <AwardDrawerHost />
          <SplashScreen />

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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
