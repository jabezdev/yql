import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate, Link } from "react-router-dom";
import { setAuthUser } from "../../lib/auth";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // For simplicity, we allow registering as any role, but in production, this should be restricted.
    // We'll default to 'applicant' but maybe let them choose for testing OR just force applicant.
    // The user requirement implies specific pipelines so public registration should probably be Applicant only.
    // However, I need to create an Admin to test.
    // I'll add a hidden/dev toggle or just hardcode applicant for now and user can manually edit db or I can make a script.
    // Actually, I'll make a secret code for admin creation or just keep it simple: Public registration = Applicant.
    // I will seed the admin user separately or just allow it for now.
    // Let's stick to APPLICANT only for public registration.

    const role = "applicant";

    const registerApplicant = useMutation(api.users.registerApplicant);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const userId = await registerApplicant({ email, password, name });
            // Auto login after register
            setAuthUser({ _id: userId, name, email, role });
            navigate("/applicant");
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.message || "Registration failed");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-brand-blueDark">Apply to YQL</h2>
                {error && <p className="text-red-500 mb-4 text-sm text-center">{error}</p>}
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Full Name</label>
                        <input
                            type="text"
                            className="w-full border rounded p-2"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
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
                    <button type="submit" className="w-full bg-brand-blueDark text-white py-2 rounded font-bold hover:bg-opacity-90 transition">
                        Start Application
                    </button>
                </form>
                <p className="mt-4 text-center text-sm">
                    Already have an account? <Link to="/login" className="text-brand-orange hover:underline">Login here</Link>
                </p>
                <p className="mt-2 text-center text-sm">
                    <Link to="/" className="text-gray-500 hover:text-gray-700">Back to Home</Link>
                </p>
            </div>
        </div>
    );
}
