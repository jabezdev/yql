import { SignIn } from "@clerk/clerk-react";


export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 flex flex-col items-center">
                <div className="text-center mb-8">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Sign in to YQL
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Access your dashboard and applications
                    </p>
                </div>
                <SignIn fallbackRedirectUrl="/dashboard" signUpUrl="/register" />
            </div>
        </div>
    );
}
