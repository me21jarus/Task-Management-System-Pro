import { useEffect, useState, lazy, Suspense } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { getSettings, getUser } from "./lib/db";
import { useAuth } from "./hooks/useAuth";
import { Spinner } from "./components/ui/Spinner";
import { logger } from "./lib/logger";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { TaskProvider } from "./contexts/TaskContext";

import Welcome from "./pages/Welcome";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { RouteErrorBoundary } from "./components/ui/ErrorBoundaryWrapper";

const PersonalDashboard = lazy(() => import("./pages/PersonalDashboard"));
const TeamsDashboard = lazy(() => import("./pages/TeamsDashboard"));
const TeamBoard = lazy(() => import("./pages/TeamBoard"));

/** Root route — decides where to redirect */
function RootRedirect() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function decide() {
      try {
        const settings = await getSettings();

        if (cancelled) return;

        // First visit — show welcome
        if (!settings.hasSeenWelcome) {
          navigate("/welcome", { replace: true });
          return;
        }

        // Check for local user
        const localUser = await getUser();

        if (cancelled) return;

        // No local user — go to onboarding
        if (!localUser) {
          navigate("/onboarding", { replace: true });
          return;
        }

        // Wait for auth to settle
        if (authLoading) return;

        // Has Firebase user — go to dashboard
        if (user) {
          navigate("/app/personal", { replace: true });
        } else {
          // Has local user but no Firebase auth — go to login
          navigate("/login", { replace: true });
        }
      } catch (err) {
        logger.error("Root redirect error:", err);
        if (!cancelled) {
          navigate("/welcome", { replace: true });
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    decide();
    return () => {
      cancelled = true;
    };
  }, [navigate, user, authLoading]);

  if (checking || authLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg">
        <Spinner size="lg" />
      </div>
    );
  }

  return null;
}

export function AppRoutes() {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/login" element={<Login />} />

      {/* Protected /app/* routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <TaskProvider>
              <AppLayout />
            </TaskProvider>
          </ProtectedRoute>
        }
      >
        <Route 
          path="personal" 
          element={
            <RouteErrorBoundary>
              <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>}>
                <PersonalDashboard />
              </Suspense>
            </RouteErrorBoundary>
          } 
        />
        <Route 
          path="teams" 
          element={
            <RouteErrorBoundary>
              <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>}>
                <TeamsDashboard />
              </Suspense>
            </RouteErrorBoundary>
          } 
        />
        <Route 
          path="teams/:teamId" 
          element={
            <RouteErrorBoundary>
              <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>}>
                <TeamBoard />
              </Suspense>
            </RouteErrorBoundary>
          } 
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
