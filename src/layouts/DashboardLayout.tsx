import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { clearAuthUser, getAuthUser } from "../lib/auth";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { AuthErrorBoundary } from "../components/AuthErrorBoundary";

export default function DashboardLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user] = useState(getAuthUser());

    useEffect(() => {
        if (!user) {
            navigate("/login");
        }
    }, [user, navigate]);

    const handleLogout = () => {
        clearAuthUser();
        navigate("/");
    };

    if (!user) return null;

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
                        <span className="text-sm font-medium">{user.name}</span>
                        <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-full text-red-500" title="Logout">
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
