import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/use-auth";
import LoginPage from "./pages/login";
import DashboardPage from "./pages/dashboard";
import { OfflineIndicator } from "./components/pwa/offline-indicator";
import { InstallPrompt } from "./components/pwa/install-prompt";
import { CacheUpdateNotification } from "./components/pwa/cache-update-notification";
import { useEffect } from "react";

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  // console.log("AuthWrapper state:", { isAuthenticated, isLoading, user, token: localStorage.getItem("sessionToken") });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // console.log("AuthWrapper rendering children for authenticated user:", user?.name);
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={() => (
        <AuthWrapper>
          <DashboardPage />
        </AuthWrapper>
      )} />
      <Route path="/dashboard" component={() => (
        <AuthWrapper>
          <DashboardPage />
        </AuthWrapper>
      )} />
      <Route component={() => (
        <AuthWrapper>
          <DashboardPage />
        </AuthWrapper>
      )} />
    </Switch>
  );
}

function App() {
  // Service worker registration is handled in main.tsx
  // Apply dark theme globally
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OfflineIndicator />
        <InstallPrompt />
        <CacheUpdateNotification />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
