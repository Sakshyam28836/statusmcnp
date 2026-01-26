import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Survival from "./pages/Survival";
import Lifesteal from "./pages/Lifesteal";
import Bedwar from "./pages/Bedwar";
import Anarchy from "./pages/Anarchy";
import PracticePvp from "./pages/PracticePvp";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/survival" element={<Survival />} />
          <Route path="/lifesteal" element={<Lifesteal />} />
          <Route path="/bedwar" element={<Bedwar />} />
          <Route path="/anarchy" element={<Anarchy />} />
          <Route path="/practice-pvp" element={<PracticePvp />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
