import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Loader2, ArrowLeft, Save, Send } from "lucide-react";
import { Button } from "../../components/ui/Button";



export default function ReviewSubmissionForm() {
    const { type, id } = useParams(); // type: 'self', 'peer', 'manager'; id: depends on type
    const [searchParams] = useSearchParams();
    const mode = searchParams.get("mode") || "edit"; // 'edit' or 'view'
    const navigate = useNavigate();

    const [formData, setFormData] = useState<any>({});
    const [ratings, setRatings] = useState<Record<string, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Queries handling
    const user = useQuery(api.users.getMe);
    const cycleId = type === 'self' ? id as any : undefined;
    const assignmentId = type === 'peer' ? id as any : undefined;

    // TODO: Fetch existing data based on type
    // This is simplified. In real app, we would load the 'data' from the respective review query.

    const submitSelf = useMutation(api.performanceReviews.submitSelfReview);
    const submitPeer = useMutation(api.performanceReviews.submitPeerReview);
    // const savePeer = useMutation(api.performanceReviews.savePeerReviewDraft);

    const questions = [
        { id: "q1", label: "What were your/their biggest achievements this cycle?", type: "text" },
        { id: "q2", label: "What areas could use improvement?", type: "text" },
        { id: "q3", label: "How well did you/they demonstrate our core values?", type: "rating" },
    ];

    const handleSubmit = async (submit: boolean) => {
        setIsSubmitting(true);
        try {
            const data = { answers: formData, ratings };

            if (type === 'self') {
                await submitSelf({
                    cycleId: cycleId,
                    data,
                    submit
                });
            } else if (type === 'peer') {
                if (submit) {
                    await submitPeer({
                        assignmentId,
                        data
                    });
                } else {
                    // await savePeer(...)
                    alert("Draft saving for peer review not implemented in this demo");
                    setIsSubmitting(false);
                    return;
                }
            }

            navigate("/dashboard/performance");
        } catch (error) {
            console.error(error);
            alert("Failed to submit review");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

    const isReadOnly = mode === 'view';

    return (
        <div className="max-w-3xl mx-auto p-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 pl-0 hover:bg-transparent hover:text-brand-blue">
                <ArrowLeft size={16} className="mr-2" /> Back
            </Button>

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 capitalize">{type} Review</h1>
                <p className="text-gray-600">Please answer the following questions honestly and constructively.</p>
            </div>

            <div className="space-y-8">
                {questions.map((q) => (
                    <div key={q.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <label className="block text-lg font-medium text-gray-900 mb-4">{q.label}</label>

                        {q.type === 'text' ? (
                            <textarea
                                disabled={isReadOnly}
                                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:outline-none resize-none"
                                placeholder="Write your thoughts here..."
                                value={formData[q.id] || ""}
                                onChange={(e) => setFormData({ ...formData, [q.id]: e.target.value })}
                            />
                        ) : (
                            <div className="flex gap-4">
                                {[1, 2, 3, 4, 5].map((stars) => (
                                    <button
                                        key={stars}
                                        disabled={isReadOnly}
                                        onClick={() => setRatings({ ...ratings, [q.id]: stars })}
                                        className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-lg font-bold transition-all
                                            ${ratings[q.id] === stars
                                                ? "border-brand-blue bg-brand-blue text-white"
                                                : "border-gray-200 hover:border-brand-blue hover:text-brand-blue text-gray-400"
                                            }
                                        `}
                                    >
                                        {stars}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {!isReadOnly && (
                <div className="mt-8 flex justify-end gap-3 sticky bottom-4 bg-white/80 backdrop-blur p-4 rounded-xl border border-gray-200 shadow-lg">
                    <Button variant="outline" onClick={() => handleSubmit(false)} disabled={isSubmitting}>
                        <Save size={16} className="mr-2" /> Save Draft
                    </Button>
                    <Button onClick={() => handleSubmit(true)} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
                        Submit Review
                    </Button>
                </div>
            )}
        </div>
    );
}
