import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import EmployeeDirectory from "@/pages/employee-directory";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import { MessagingPage } from "@/pages/messaging";
import AdminPage from "@/pages/admin";
import PushDebugPage from "@/pages/push-debug";
import { OnboardingTutorial, useOnboarding } from "@/components/onboarding-tutorial";
import { PWAInstallDialog } from "@/components/pwa-install-dialog";
import { usePWAInstall } from "@/hooks/use-pwa-install";


function Router() {
  const [location, setLocation] = useLocation();

  if (location === "/") {
    setLocation("/directory");
    return null;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/directory">
        <ProtectedRoute>
          <EmployeeDirectory />
        </ProtectedRoute>
      </Route>
      <Route path="/messaging">
        <ProtectedRoute>
          <MessagingPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute>
          <AdminPage />
        </ProtectedRoute>
      </Route>
      <Route path="/push-debug">
        <ProtectedRoute>
          <PushDebugPage />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { showOnboarding, setShowOnboarding } = useOnboarding();
  const { showInstallDialog, setShowInstallDialog } = usePWAInstall();

  return (
    <ThemeProvider defaultTheme="dark" storageKey="secl-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <Toaster />
            <Router />
            <OnboardingTutorial
              open={showOnboarding}
              onClose={() => setShowOnboarding(false)}
            />
            <PWAInstallDialog
              open={showInstallDialog}
              onClose={() => setShowInstallDialog(false)}
            />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
