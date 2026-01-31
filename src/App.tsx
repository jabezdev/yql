import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { api } from "../convex/_generated/api";
import { useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CohortManager from "./pages/admin/CohortManager";
import ReviewerDashboard from "./pages/reviewer/ReviewerDashboard";
import ApplicantDashboard from "./pages/applicant/ApplicantDashboard";
import { Loader2 } from "lucide-react";

function UserIdSync() {
  const storeUser = useMutation(api.users.storeUser);
  useEffect(() => {
    storeUser();
  }, [storeUser]);
  return null;
}

// Protected Route wrapper
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.getMe);

  // 1. Clerk Loading or Convex Query Loading
  if (user === undefined) {
    // Note: useConvexAuth 'isLoading' isn't destructured but 'user === undefined' covers Convex load.
    // If Clerk is loading, isAuthenticated might be false, but let's assume useConvexAuth handles it or we should check isLoading too.
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

  // 4. Authenticated & Synced -> Check Roles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'reviewer') return <Navigate to="/reviewer" replace />;
    return <Navigate to="/applicant" replace />;
  }

  // 5. Render
  return (
    <>
      {/* Kept here just to ensure updates happen if needed, though usually handled above */}
      {children}
    </>
  );
}

function RoleDispatcher() {
  const user = useQuery(api.users.getMe);
  if (!user) return null; // Or loader
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'reviewer') return <Navigate to="/reviewer" replace />;
  return <Navigate to="/applicant" replace />;
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

        {/* Redirect generic dashboard link to correct role */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <RoleDispatcher />
          </ProtectedRoute>
        } />

        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/cohorts" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CohortManager />
            </ProtectedRoute>
          } />
          <Route path="/reviewer" element={
            <ProtectedRoute allowedRoles={['reviewer']}>
              <ReviewerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/applicant" element={
            <ProtectedRoute allowedRoles={['applicant']}>
              <ApplicantDashboard />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
