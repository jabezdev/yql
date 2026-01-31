import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { api } from "../convex/_generated/api";
import { useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import CoreDashboard from "./pages/CoreDashboard";
import { Loader2 } from "lucide-react";

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

        {/* Unified Core Dashboard */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <CoreDashboard />
          </ProtectedRoute>
        } />

        {/* Catch-all for legacy routes - redirect to dashboard */}
        <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/applicant/*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/reviewer/*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
