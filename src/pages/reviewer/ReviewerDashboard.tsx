import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getAuthUser } from "../../lib/auth";

export default function ReviewerDashboard() {
    const applications = useQuery(api.applications.getAllApplications);
    const submitReview = useMutation(api.reviews.submitReview);
    const user = getAuthUser();
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [notes, setNotes] = useState("");

    if (!applications) return <div>Loading...</div>;

    const handleReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAppId || !user) return;

        await submitReview({
            applicationId: selectedAppId as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            reviewerId: user._id,
            score,
            notes
        });

        alert("Review submitted!");
        setScore(0);
        setNotes("");
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Reviewer Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded shadow p-4 md:col-span-1">
                    <h3 className="font-bold mb-4">Applicants</h3>
                    <ul className="space-y-2">
                        {applications.map(app => (
                            <li key={app._id}
                                className={`p-2 rounded cursor-pointer ${selectedAppId === app._id ? 'bg-blue-100 border-blue-500 border' : 'hover:bg-gray-50 border'}`}
                                onClick={() => setSelectedAppId(app._id)}
                            >
                                <div className="font-medium">App ID: {app.userId.slice(0, 8)}...</div>
                                <div className="text-xs text-gray-500">{app.currentStageId}</div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white rounded shadow p-6 md:col-span-2">
                    {selectedAppId ? (
                        <div>
                            <h3 className="font-bold text-xl mb-4">Grading Application</h3>
                            {/* In a real app, show form data here */}
                            <div className="bg-gray-100 p-4 rounded mb-4">
                                <p className="text-sm text-gray-600">Application Data would appear here (Phone, Motivation, etc.)</p>
                            </div>

                            <p className="mb-2 font-medium">Your Review:</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm mb-1">Score (1-10)</label>
                                    <input
                                        type="number"
                                        min="1" max="10"
                                        value={score}
                                        onChange={e => setScore(Number(e.target.value))}
                                        className="border p-2 rounded w-20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">Notes</label>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        className="border p-2 rounded w-full h-32"
                                    />
                                </div>
                                <button onClick={handleReview} className="bg-brand-blueDark text-white px-4 py-2 rounded">Submit Review</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Select an applicant to review
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
