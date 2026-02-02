import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { api } from "../convex/_generated/api";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

// Pages & Components
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardLayout from "./layouts/DashboardLayout";
import RoleGuard from "./layouts/RoleGuard";

// Unified Dashboard (replaces role-specific dashboards)
import UnifiedDashboard from "./pages/UnifiedDashboard";
import ApplicationPortal from "./pages/ApplicationPortal";
import ProcessView from "./pages/ProcessView";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SystemSettings from "./pages/admin/SystemSettings";
import SettingsPage from "./pages/settings/SettingsPage";
import AdminProgramList from "./pages/admin/programs/AdminProgramList";
import ProgramDesigner from "./pages/admin/programs/ProgramDesigner";
import ProgramSettings from "./pages/admin/programs/ProgramSettings";
import DataIntegrityDashboard from "./pages/admin/DataIntegrityDashboard";
import OrganizationDesigner from "./pages/admin/OrganizationDesigner";
import RoleManagement from "./pages/admin/RoleManagement";
import ShiftCalendar from "./pages/operations/ShiftCalendar";
import GoalsPage from "./pages/operations/GoalsPage";
import TimesheetLog from "./pages/operations/TimesheetLog";
import PerformanceDashboard from "./pages/performance/PerformanceDashboard";
import ReviewSubmissionForm from "./pages/performance/ReviewSubmissionForm";
import PromotionProcess from "./pages/performance/PromotionProcess";
import ResignationPage from "./pages/offboarding/ResignationPage";
import ExitProcess from "./pages/offboarding/ExitProcess";
import AlumniNetwork from "./pages/alumni/AlumniNetwork";

import IncidentReport from "./pages/compliance/IncidentReport";
import ComplianceDashboard from "./pages/admin/compliance/ComplianceDashboard";
import ReimbursementForm from "./pages/finance/ReimbursementForm";



import UserManagement from "./pages/admin/UserManagement";


// Component to handle user syncing
function UserIdSync() {
  const storeUser = useMutation(api.users.storeUser);
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
  const storeUser = useMutation(api.users.storeUser);
  useEffect(() => {
    if (storeUser) storeUser();
  }, [storeUser]);

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

          <Route path="admin/integrity" element={
            <RoleGuard allowedRoles={['admin']}>
              <DataIntegrityDashboard />
            </RoleGuard>
          } />

          <Route path="admin/org" element={
            <RoleGuard allowedRoles={['admin']}>
              <OrganizationDesigner />
            </RoleGuard>
          } />

          <Route path="admin/roles" element={
            <RoleGuard allowedRoles={['admin']}>
              <RoleManagement />
            </RoleGuard>
          } />

          <Route path="admin/users" element={
            <RoleGuard allowedRoles={['admin']}>
              <UserManagement />
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

          <Route path="admin/programs/:programId/settings" element={
            <RoleGuard allowedRoles={['admin']}>
              <ProgramSettings />
            </RoleGuard>
          } />
          <Route path="settings" element={<SettingsPage />} />

          {/* Operations & Engagement */}
          <Route path="shifts" element={<ShiftCalendar />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="timesheets" element={<TimesheetLog />} />



          {/* Performance & Feedback */}
          <Route path="performance" element={<PerformanceDashboard />} />
          <Route path="performance/review/:type/:id" element={<ReviewSubmissionForm />} />
          <Route path="performance/promote" element={
            <RoleGuard allowedRoles={['manager', 'admin', 'lead']}>
              <PromotionProcess />
            </RoleGuard>
          } />

          {/* Offboarding & Alumni */}
          <Route path="offboarding/resign" element={<ResignationPage />} />
          <Route path="offboarding/exit" element={<ExitProcess />} />
          <Route path="alumni" element={<AlumniNetwork />} />

          {/* Compliance & Finance */}
          <Route path="compliance/report" element={<IncidentReport />} />
          <Route path="finance/reimbursements" element={<ReimbursementForm />} />

          <Route path="admin/compliance" element={
            <RoleGuard allowedRoles={['admin']}>
              <ComplianceDashboard />
            </RoleGuard>
          } />


          {/* Process & Program Routes */}
          <Route path="program/:programId" element={<ApplicationPortal />} />
          <Route path="process/:processId" element={<ProcessView />} />
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
