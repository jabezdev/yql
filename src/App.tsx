import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { api } from "../convex/_generated/api";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

// Auth & Pages
import LoginPage from "./core/pages/LoginPage";
import RegisterPage from "./core/pages/RegisterPage";
import LandingPage from "./core/pages/LandingPage";
import AdminDashboard from "./core/pages/AdminDashboard";
import DashboardView from "./engine/views/DashboardView";

// Layouts
import DashboardLayout from "./core/layouts/DashboardLayout";
import RoleGuard from "./core/layouts/RoleGuard";

// Component to handle user syncing
function UserIdSync() {
  const storeUser = useMutation(api.core.users.storeUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    storeUser().catch(err => {
      console.error("Failed to sync user:", err);
      setError("Failed to create account. Please try again.");
    });
  }, [storeUser]);

  if (error) return <div className="text-red-500 text-sm">{error}</div>;
  return null;
}

// Redirect logic
function RedirectToHome() {
  const user = useQuery(api.core.users.getMe);
  if (user === undefined) return <Loader2 className="animate-spin text-brand-blue" />;

  // Everyone goes to dashboard now
  return <Navigate to="/dashboard" replace />;
}

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.core.users.getMe);

  // 1. Clerk Loading or Convex Query Loading
  if (user === undefined) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-blue" />
      </div>
    );
  }

  // 2. Not Authenticated by Clerk -> Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. Authenticated by Clerk, but User not in Convex DB yet -> Sync
  if (user === null) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-brand-blue" size={32} />
        <p className="text-gray-500">Setting up your profile...</p>
        <UserIdSync />
      </div>
    );
  }

  // 4. Render
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          <>
            <Authenticated><RedirectToHome /></Authenticated>
            <Unauthenticated><LoginPage /></Unauthenticated>
          </>
        } />
        <Route path="/register" element={
          <>
            <Authenticated><RedirectToHome /></Authenticated>
            <Unauthenticated><RegisterPage /></Unauthenticated>
          </>
        } />
        <Route path="/" element={<LandingPage />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Outlet />
            </DashboardLayout>
          </ProtectedRoute>
        }>
          {/* Main dashboard */}
          <Route index element={<DashboardView />} />

          {/* Admin Section */}
          <Route path="admin" element={
            <RoleGuard allowedRoles={['admin']}>
              <Outlet />
            </RoleGuard>
          }>
            <Route index element={<AdminDashboard />} />
            {/* Future Admin Routes will go here, currently disabled/cleaned up */}
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
