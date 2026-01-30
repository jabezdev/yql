import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

import DashboardLayout from "./layouts/DashboardLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ReviewerDashboard from "./pages/reviewer/ReviewerDashboard";
import ApplicantDashboard from "./pages/applicant/ApplicantDashboard";
import { getAuthUser } from "./lib/auth";

// Protected Route wrapper
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const user = getAuthUser();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to correct dashboard if trying to access wrong one
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'reviewer') return <Navigate to="/reviewer" replace />;
    return <Navigate to="/applicant" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />


        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
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
