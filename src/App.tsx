import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import FloatingNav from "@/components/FloatingNav";
import Index from "./pages/Index.tsx";
import MatchDetail from "./pages/MatchDetail.tsx";
import Scoreboard from "./pages/Scoreboard.tsx";
import NotFound from "./pages/NotFound.tsx";
import MyPicks from "./pages/MyPicks.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <FloatingNav />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/match/:id" element={<MatchDetail />} />
          
          <Route path="/my-picks" element={<MyPicks />} />
          <Route path="/scoreboard" element={<Scoreboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
