import { Outlet, useNavigate } from "react-router-dom";
import { clearAuthUser, getAuthUser } from "../lib/auth";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";

export default function DashboardLayout() {
    const navigate = useNavigate();
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
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{user.name}</span>
                    <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-full text-red-500" title="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>
            <main className="flex-1 container mx-auto p-6">
                <Outlet />
            </main>
        </div>
    );
}
