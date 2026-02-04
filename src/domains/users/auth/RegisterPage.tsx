import { SignUp } from "@clerk/clerk-react";

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <SignUp
                signInUrl="/login"
                forceRedirectUrl="/dashboard"
            />
        </div>
    );
}
