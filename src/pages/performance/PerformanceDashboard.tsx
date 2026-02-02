import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { format } from "date-fns";
import { CheckCircle, Clock, ChevronRight, Lock } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useNavigate } from "react-router-dom";

export default function PerformanceDashboard() {
    const navigate = useNavigate();
    // For MVP, just getting the most active cycle or all cycles
    const cycles = useQuery(api.performanceReviews.getAllCycles, { status: "active" });
    const activeCycle = cycles?.[0];

    // Get my tasks
    const peerReviews = useQuery(api.performanceReviews.getMyPeerReviews, activeCycle ? { cycleId: activeCycle._id } : "skip");

    // Check if I have a self review for this cycle


    // Better pattern: get my ID first
    const user = useQuery(api.users.getMe);
    const summaryData = useQuery(api.performanceReviews.getPerformanceSummary,
        (activeCycle && user) ? { userId: user._id, cycleId: activeCycle._id } : "skip"
    );

    if (!cycles || !user) return <div className="p-8">Loading...</div>;

    if (!activeCycle) {
        return (
            <div className="max-w-4xl mx-auto p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <h2 className="text-xl font-semibold text-gray-700">No active review cycles</h2>
                <p className="text-gray-500 mt-2">Check back later for upcoming performance reviews.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded uppercase">Active Cycle</span>
                    <span className="text-sm text-gray-500">Ends {format(activeCycle.endDate, "MMM d, yyyy")}</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">{activeCycle.name}</h1>
                <p className="text-gray-600 mt-1">Complete your assigned reviews to help your team grow.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Action Area */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Self Review Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">Self Review</h3>
                                <p className="text-sm text-gray-500">Reflect on your achievements and areas for growth.</p>
                            </div>
                            {summaryData?.selfReview?.status === "submitted" ? (
                                <span className="flex items-center text-green-600 text-sm font-medium gap-1">
                                    <CheckCircle size={16} /> Submitted
                                </span>
                            ) : (
                                <span className="flex items-center text-amber-600 text-sm font-medium gap-1">
                                    <Clock size={16} /> Due {activeCycle.selfReviewDeadline ? format(activeCycle.selfReviewDeadline, "MMM d") : "Soon"}
                                </span>
                            )}
                        </div>
                        <div className="p-6">
                            {summaryData?.selfReview?.status === "submitted" ? (
                                <div className="flex items-center justify-between">
                                    <p className="text-gray-600">You submitted your self-review on {format(summaryData.selfReview.submittedAt, "PPP")}.</p>
                                    <Button variant="outline" onClick={() => navigate(`/dashboard/performance/review/self/${activeCycle._id}?mode=view`)}>View</Button>
                                </div>
                            ) : (
                                <Button
                                    className="w-full"
                                    onClick={() => navigate(`/dashboard/performance/review/self/${activeCycle._id}`)}
                                >
                                    {summaryData?.selfReview ? "Continue Self Review" : "Start Self Review"}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Peer Reviews Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="font-bold text-lg text-gray-900">Peer Reviews ({peerReviews?.filter(r => r.status !== 'submitted').length || 0} pending)</h3>
                            <p className="text-sm text-gray-500">Provide anonymous feedback for your colleagues.</p>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {peerReviews?.map((assignment) => (
                                <div key={assignment._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-brand-lightBlue/10 flex items-center justify-center text-brand-blue font-bold text-sm">
                                            {assignment.revieweeName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{assignment.revieweeName}</p>
                                            <p className="text-xs text-gray-500">{assignment.status === 'submitted' ? 'Submitted' : 'Pending Review'}</p>
                                        </div>
                                    </div>
                                    {assignment.status === 'submitted' ? (
                                        <Button variant="ghost" size="sm" disabled className="text-green-600">
                                            <CheckCircle size={16} className="mr-1" /> Done
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/performance/review/peer/${assignment._id}`)}>
                                            Write Review
                                        </Button>
                                    )}
                                </div>
                            ))}
                            {peerReviews?.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    You have no assigned peer reviews yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-brand-darkBlue text-white rounded-xl p-6 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Lock size={100} />
                        </div>
                        <h3 className="font-bold text-lg mb-2 relative z-10">Confidentiality</h3>
                        <p className="text-brand-blue/20 text-sm relative z-10">
                            Peer reviews are always anonymous. Your feedback helps your colleagues improve without revealing your identity.
                            Manager reviews are private until shared explicitly.
                        </p>
                    </div>

                    {/* Manager Section (Conditional) */}
                    {['manager', 'admin', 'lead'].includes(user.systemRole || "") && activeCycle.config?.includeManagerReview && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 className="font-bold text-lg text-gray-900 mb-2">Manager Actions</h3>
                            <p className="text-sm text-gray-500 mb-4">Review your direct reports.</p>
                            <Button
                                variant="outline"
                                className="w-full justify-between group"
                                onClick={() => navigate("/dashboard/performance/team")}
                            >
                                Team Reviews
                                <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
