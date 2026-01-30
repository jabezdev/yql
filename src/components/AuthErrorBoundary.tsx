import { Component, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { clearAuthUser } from "../lib/auth";

interface Props {
    children: ReactNode;
}

interface State {
    hasAuthError: boolean;
    otherError: Error | null;
}

export class AuthErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasAuthError: false, otherError: null };
    }

    static getDerivedStateFromError(error: Error): State {
        // Check if the error is related to authentication
        if (
            error.message.includes("Unauthorized") ||
            error.message.includes("User not found") ||
            error.message.includes("Invalid or expired session") ||
            error.message.includes("Forbidden")
        ) {
            return { hasAuthError: true, otherError: null };
        }
        return { hasAuthError: false, otherError: error };
    }

    componentDidCatch(error: Error) {
        if (
            error.message.includes("Unauthorized") ||
            error.message.includes("User not found") ||
            error.message.includes("Invalid or expired session") ||
            error.message.includes("Forbidden")
        ) {
            clearAuthUser();
        }
        console.error("AuthErrorBoundary caught error:", error);
    }

    render() {
        if (this.state.hasAuthError) {
            return <Navigate to="/login" replace />;
        }

        if (this.state.otherError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                        <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
                        <p className="text-gray-600 mb-6 text-sm">
                            {this.state.otherError.message || "An unexpected error occurred."}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
