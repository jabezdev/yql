import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getAuthUser } from "../../lib/auth";
import { useState } from "react";

import CohortManager from "./CohortManager";

export default function AdminDashboard() {
    const applications = useQuery(api.applications.getAllApplications);
    const reviewers = useQuery(api.users.getReviewers);
    const updateStage = useMutation(api.applications.updateStage);
    const updateStatus = useMutation(api.applications.updateStatus);
    const createReviewer = useMutation(api.users.createReviewer);

    const [activeTab, setActiveTab] = useState<string>('applicants');

    const [revName, setRevName] = useState("");
    const [revEmail, setRevEmail] = useState("");
    const [revPass, setRevPass] = useState("");
    const user = getAuthUser();

    // Render logic based on tab
    if (activeTab === 'cohorts') {
        return (
            <div className="space-y-4">
                <div className="flex gap-4 mb-4 border-b pb-2">
                    <button onClick={() => setActiveTab('applicants')} className="text-gray-500 hover:text-brand-blue">Applicants</button>
                    <button onClick={() => setActiveTab('reviewers')} className="text-gray-500 hover:text-brand-blue">Reviewers</button>
                    <button onClick={() => setActiveTab('cohorts')} className="font-bold text-brand-blue border-b-2 border-brand-blue">Cohorts</button>
                </div>
                <CohortManager />
            </div>
        )
    }

    // Default View (will refactor later to cleaner layout)
    if (!applications) return <div>Loading applications...</div>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleStageChange = async (appId: any, stage: any) => {
        if (confirm(`Are you sure you want to move this applicant to ${stage}?`)) {
            await updateStage({ applicationId: appId, stage });
        }
    };


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleStatusChange = async (appId: any, status: any) => {
        await updateStatus({ applicationId: appId, status });
    };

    const handleCreateReviewer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await createReviewer({ adminId: user._id as any, name: revName, email: revEmail, password: revPass });
            alert("Reviewer created!");
            setRevName(""); setRevEmail(""); setRevPass("");
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            alert("Error: " + err.message);
        }
    };

    return (
        <div>
            <div className="flex gap-4 mb-6 border-b pb-2">
                <button onClick={() => setActiveTab('applicants')} className={`pb-2 ${activeTab === 'applicants' ? 'font-bold text-brand-blue border-b-2 border-brand-blue' : 'text-gray-500'}`}>Applicants</button>
                <button onClick={() => setActiveTab('reviewers')} className={`pb-2 ${activeTab === 'reviewers' ? 'font-bold text-brand-blue border-b-2 border-brand-blue' : 'text-gray-500'}`}>Reviewers</button>
                <button onClick={() => setActiveTab('cohorts')} className={`pb-2 ${activeTab === 'cohorts' ? 'font-bold text-brand-blue border-b-2 border-brand-blue' : 'text-gray-500'}`}>Cohorts</button>
            </div>

            {activeTab === 'reviewers' ? (
                <div className="bg-white p-6 rounded-lg shadow mb-8 border border-brand-blue/20">
                    <h3 className="text-xl font-bold mb-4 text-brand-blueDark">Manage Reviewers</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* List Reviewers */}
                        <div>
                            <h4 className="font-semibold mb-2 text-gray-700">Existing Reviewers</h4>
                            {!reviewers ? (
                                <p>Loading...</p>
                            ) : reviewers.length === 0 ? (
                                <p className="text-gray-500 italic">No reviewers found.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {reviewers.map(r => (
                                        <li key={r._id} className="p-3 bg-gray-50 rounded border flex justify-between items-center">
                                            <div>
                                                <div className="font-bold">{r.name}</div>
                                                <div className="text-xs text-gray-500">{r.email}</div>
                                            </div>
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Reviewer</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Create Reviewer Form */}
                        <div className="bg-gray-50 p-4 rounded border">
                            <h4 className="font-semibold mb-3">Add New Reviewer</h4>
                            <form onSubmit={handleCreateReviewer} className="space-y-3">
                                <input
                                    className="w-full border p-2 rounded text-sm"
                                    placeholder="Name"
                                    value={revName}
                                    onChange={e => setRevName(e.target.value)}
                                    required
                                />
                                <input
                                    className="w-full border p-2 rounded text-sm"
                                    placeholder="Email"
                                    type="email"
                                    value={revEmail}
                                    onChange={e => setRevEmail(e.target.value)}
                                    required
                                />
                                <input
                                    className="w-full border p-2 rounded text-sm"
                                    placeholder="Password"
                                    type="password"
                                    value={revPass}
                                    onChange={e => setRevPass(e.target.value)}
                                    required
                                />
                                <button className="w-full bg-brand-blue text-white py-2 rounded font-bold text-sm hover:bg-brand-blueDark transition">
                                    Create Reviewer Account
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'applicants' ? (
                <>
                    <h3 className="text-xl font-bold mb-4 text-brand-blueDark">Applicant Pipelines</h3>

                    <div className="overflow-x-auto bg-white rounded-lg shadow">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 border-b">
                                    <th className="p-4 font-semibold">Applicant ID</th>
                                    <th className="p-4 font-semibold">Current Stage</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.length === 0 && (
                                    <tr><td colSpan={4} className="p-4 text-center">No applications found.</td></tr>
                                )}
                                {applications.map((app) => (
                                    <tr key={app._id} className="border-b hover:bg-gray-50">
                                        <td className="p-4 font-mono text-sm">{app.userId}</td>
                                        <td className="p-4">
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold uppercase">
                                                {app.currentStageId}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${app.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2 text-sm">
                                                <select
                                                    className="border rounded p-1"
                                                    value={app.currentStageId}
                                                    onChange={(e) => handleStageChange(app._id, e.target.value)}
                                                >
                                                    <option value="form">Form</option>
                                                    <option value="skills">Skills</option>
                                                    <option value="interview">Interview</option>
                                                    <option value="agreement">Agreement</option>
                                                    <option value="briefing">Briefing</option>
                                                    <option value="completed">Completed</option>
                                                </select>

                                                {app.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleStatusChange(app._id, 'approved')} className="text-green-600 hover:underline">Approve</button>
                                                        <button onClick={() => handleStatusChange(app._id, 'rejected')} className="text-red-600 hover:underline">Reject</button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : null}
        </div>
    );
}
