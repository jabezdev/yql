import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate, Link } from "react-router-dom";
import { setAuthUser } from "../../lib/auth";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const authenticate = useMutation(api.users.authenticate);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const user = await authenticate({ email, password });
            if (user) {
                setAuthUser(user);
                // Artificial delay for better UX if it's too fast? No, instant is good.
                if (user.role === "admin") navigate("/admin");
                else if (user.role === "reviewer") navigate("/reviewer");
                else navigate("/applicant");
            } else {
                setError("Invalid email or password");
                setIsLoading(false);
            }
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md p-8 pt-10 relative overflow-visible" variant="bordered">
                {/* Decorative top border or accent if needed */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blueDark to-brand-orange"></div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-brand-blueDark mb-2">Welcome Back</h1>
                    <p className="text-gray-500">Sign in to continue to YQL</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm flex items-center justify-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            type="email"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blueDark/20 focus:border-brand-blueDark transition-colors outline-none"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            {/* <Link to="/forgot-password" className="text-xs text-brand-orange hover:underline">Forgot password?</Link> */}
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blueDark/20 focus:border-brand-blueDark transition-colors outline-none pr-10"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        variant="geometric-primary"
                        fullWidth
                        disabled={isLoading}
                        className="py-3"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin mr-2" size={20} />
                                Logging in...
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </Button>
                </form>

                <div className="mt-8 text-center bg-gray-50 -mx-8 -mb-8 py-6 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{" "}
                        <Link to="/register" className="text-brand-orange font-semibold hover:underline">
                            Create an account
                        </Link>
                    </p>
                    <div className="mt-2">
                        <Link to="/" className="text-xs text-gray-400 hover:text-gray-600">
                            &larr; Back to Home
                        </Link>
                    </div>
                </div>
            </Card>
        </div>
    );
}
