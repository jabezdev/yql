import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { AuthErrorBoundary } from "../components/AuthErrorBoundary";

export default function DashboardLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut } = useAuth();
    const user = useQuery(api.users.getMe);
    const storeUser = useMutation(api.users.storeUser);

    useEffect(() => {
        if (user) {
            storeUser();
        }
    }, [user, storeUser]);

    // We rely on the ProtectedRoute wrapper in App.tsx to handle redirection if not logged in.
    // However, since this layout wraps the dashboard, we can just render null or loader until user is loaded.

    if (user === undefined) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 gap-4">
            <Loader2 className="animate-spin text-brand-blue" size={40} />
            <p className="text-gray-400 font-medium animate-pulse">Loading Dashboard...</p>
        </div>
    );

    if (user === null) {
        // Should have been redirected by ProtectedRoute, but just in case
        return null;
    }

    const handleLogout = async () => {
        await signOut();
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
                <h1 className="text-xl font-bold text-brand-blueDark">YQL {user.role === 'admin' ? 'Admin' : user.role === 'reviewer' ? 'Reviewer' : 'Applicant'} Portal</h1>
                <div className="flex items-center gap-6">
                    {user.role === 'admin' && (
                        <nav className="flex items-center gap-4 bg-gray-100 rounded-lg p-1">
                            <Link
                                to="/admin"
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${location.pathname === '/admin' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/admin/cohorts"
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${location.pathname === '/admin/cohorts' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Cohorts
                            </Link>
                        </nav>
                    )}

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-medium text-gray-900">{user.name}</span>
                            <span className="text-xs text-gray-500">{user.email}</span>
                        </div>
                        <button onClick={handleLogout} className="p-2 hover:bg-red-50 rounded-full text-red-500 transition-colors" title="Logout">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>
            <main className="flex-1 container mx-auto p-6">
                <AuthErrorBoundary>
                    <Outlet />
                </AuthErrorBoundary>
            </main>
        </div>
    );
}
