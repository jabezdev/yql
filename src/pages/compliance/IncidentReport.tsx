import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AlertOctagon, Lock, Send } from "lucide-react";
import { Button } from "../../components/ui/Button";

export default function IncidentReport() {
    const submitReport = useMutation(api.compliance.submitIncidentReport);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await submitReport({
                title,
                description,
                isAnonymous
            });
            setTitle("");
            setDescription("");
            alert("Report submitted successfully. We take this seriously and will investigate.");
        } catch (err) {
            console.error(err);
            alert("Failed to submit report.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl border border-gray-200 shadow-sm mt-8">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                    <AlertOctagon size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Incident & Grievance Reporting</h1>
                    <p className="text-sm text-gray-500">Submit a confidential report regarding misconduct or safety concerns.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
                        placeholder="e.g., Harassment, Safety Hazard, Code of Conduct Violation"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
                    <textarea
                        required
                        className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 resize-none"
                        placeholder="Please describe the incident, including dates, locations, and involved parties..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                    <input
                        type="checkbox"
                        id="anon"
                        checked={isAnonymous}
                        onChange={e => setIsAnonymous(e.target.checked)}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <label htmlFor="anon" className="text-sm text-gray-700 flex items-center gap-2 cursor-pointer">
                        <Lock size={14} className="text-gray-400" />
                        Submit Anonymously (Your name will not be displayed to admins)
                    </label>
                </div>

                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
                        <Send size={16} className="mr-2" /> Submit Report
                    </Button>
                </div>
            </form>
        </div>
    );
}
