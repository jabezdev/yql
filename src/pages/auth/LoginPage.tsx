import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate, Link } from "react-router-dom";
import { setAuthUser } from "../../lib/auth";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const authenticate = useMutation(api.users.authenticate);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        const user = await authenticate({ email, password });
        if (user) {
            setAuthUser(user);
            if (user.role === "admin") navigate("/admin");
            else if (user.role === "reviewer") navigate("/reviewer");
            else navigate("/applicant");
        } else {
            setError("Invalid email or password");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-brand-blueDark">Login to YQL</h2>
                {error && <p className="text-red-500 mb-4 text-sm text-center">{error}</p>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full border rounded p-2"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full border rounded p-2"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-brand-orange text-white py-2 rounded font-bold hover:bg-orange-600 transition">
                        Login
                    </button>
                </form>
                <p className="mt-4 text-center text-sm">
                    No account yet? <Link to="/register" className="text-brand-orange hover:underline">Register here</Link>
                </p>
                <p className="mt-2 text-center text-sm">
                    <Link to="/" className="text-gray-500 hover:text-gray-700">Back to Home</Link>
                </p>
            </div>
        </div>
    );
}
