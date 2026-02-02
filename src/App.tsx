import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { api } from "../convex/_generated/api";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

// Pages & Components
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardLayout from "./layouts/DashboardLayout";
import RoleGuard from "./layouts/RoleGuard";

// Unified Dashboard (replaces role-specific dashboards)
import UnifiedDashboard from "./pages/UnifiedDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SystemSettings from "./pages/admin/SystemSettings";
import SettingsPage from "./pages/settings/SettingsPage";
import AdminProgramList from "./pages/admin/programs/AdminProgramList";
import ProgramDesigner from "./pages/admin/programs/ProgramDesigner";

function UserIdSync() {
  const storeUser = useMutation(api.users.storeUser);
  useEffect(() => {
    storeUser();
  }, [storeUser]);
  return null;
}

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.getMe);

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
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={
          <>
            <Authenticated><Navigate to="/dashboard" /></Authenticated>
            <Unauthenticated><LoginPage /></Unauthenticated>
          </>
        } />
        <Route path="/register" element={
          <>
            <Authenticated><Navigate to="/dashboard" /></Authenticated>
            <Unauthenticated><RegisterPage /></Unauthenticated>
          </>
        } />

        {/* Unified Dashboard Route */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Outlet />
            </DashboardLayout>
          </ProtectedRoute>
        }>
          {/* Main dashboard - dynamic content based on role from backend */}
          <Route index element={<UnifiedDashboard />} />

          {/* Admin Routes - protected by RoleGuard */}
          <Route path="admin" element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleGuard>
          } />

          <Route path="admin/settings" element={
            <RoleGuard allowedRoles={['admin']}>
              <SystemSettings />
            </RoleGuard>
          } />


          {/* Program Management */}
          <Route path="admin/programs" element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminProgramList />
            </RoleGuard>
          } />

          <Route path="admin/programs/:programId/design" element={
            <RoleGuard allowedRoles={['admin']}>
              <ProgramDesigner />
            </RoleGuard>
          } />
          <Route path="settings" element={<SettingsPage />} />

          {/* Future: Process view route */}
          {/* <Route path="program/:programId" element={<ProgramView />} /> */}
          {/* <Route path="process/:processId" element={<ProcessView />} /> */}
        </Route>

        {/* Legacy role-based routes - redirect to unified dashboard */}
        <Route path="/dashboard/guest" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard/member" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard/manager" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard/lead" element={<Navigate to="/dashboard" replace />} />

        {/* Catch-all for other legacy routes */}
        <Route path="/applicant/*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/reviewer/*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
