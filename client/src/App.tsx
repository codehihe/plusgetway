import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AnimatePresence, motion } from "framer-motion";
import Home from "@/pages/Home";
import AdminPanel from "@/pages/AdminPanel";
import TransactionHistory from "@/pages/TransactionHistory";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";

// Page transition wrapper component
const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.02 }}
    transition={{
      type: "spring",
      stiffness: 100,
      damping: 20,
      duration: 0.3
    }}
    className="w-full h-full"
  >
    {children}
  </motion.div>
);

function Router() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Switch key={location}>
        <Route path="/">
          <PageTransition>
            <LandingPage />
          </PageTransition>
        </Route>
        <Route path="/home">
          <PageTransition>
            <Home />
          </PageTransition>
        </Route>
        <Route path="/admin">
          <PageTransition>
            <AdminPanel />
          </PageTransition>
        </Route>
        <Route path="/admin/transactions">
          <PageTransition>
            <TransactionHistory />
          </PageTransition>
        </Route>
        <Route>
          <PageTransition>
            <NotFound />
          </PageTransition>
        </Route>
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative min-h-screen bg-gradient-to-br from-orange-950 via-red-900 to-black overflow-hidden">
        <Router />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;