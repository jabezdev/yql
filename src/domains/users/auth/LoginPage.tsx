import { SignIn } from "@clerk/clerk-react";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <SignIn
                signUpUrl="/register"
                redirectUrl="/dashboard" // We'll handle routing based on role in the dashboard layout or via a protected route wrapper
            />
        </div>
    );
}
