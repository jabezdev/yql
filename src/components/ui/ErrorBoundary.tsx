import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary component that catches JavaScript errors in child components.
 * Prevents the entire page from crashing when a single component fails.
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 rounded-full text-red-600">
                            <AlertTriangle size={18} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-red-800 text-sm">Something went wrong</h4>
                            <p className="text-xs text-red-600 mt-1">
                                This component failed to load. Try refreshing or contact support if the issue persists.
                            </p>
                            {import.meta.env.DEV && this.state.error && (
                                <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-32">
                                    {this.state.error.message}
                                </pre>
                            )}
                            <button
                                onClick={this.handleRetry}
                                className="mt-3 inline-flex items-center gap-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded font-medium transition"
                            >
                                <RefreshCw size={12} />
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
