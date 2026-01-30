import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { getAuthUser } from "../../lib/auth";
import { useState } from "react";
import { Plus, UploadCloud } from "lucide-react";

export default function AdminDashboard() {
    const user = getAuthUser();
    const activeCohort = useQuery(api.cohorts.getActiveCohort);
    // Pass token to queries if they require it (getAllApplications requires it now)
    const applications = useQuery(api.applications.getAllApplications, { token: user?.token || "", cohortId: activeCohort?._id });
    const reviewers = useQuery(api.users.getReviewers, { token: user?.token || "", cohortId: activeCohort?._id });

    const updateStage = useMutation(api.applications.updateStage);
    const updateStatus = useMutation(api.applications.updateStatus);
    const createReviewer = useMutation(api.users.createReviewer);
    const onboardUser = useMutation(api.users.onboardUser);

    const [activeTab, setActiveTab] = useState<string>('applicants');

    // Reviewer Form State
    const [revName, setRevName] = useState("");
    const [revEmail, setRevEmail] = useState("");
    const [revPass, setRevPass] = useState("");

    // Import User State
    const [showImport, setShowImport] = useState(false);
    const [impName, setImpName] = useState("");
    const [impEmail, setImpEmail] = useState("");
    const [impStage, setImpStage] = useState("agreement");

    // const user = getAuthUser(); // Removed duplicate

    if (!applications) return <div>Loading applications...</div>;

    const handleStageChange = async (appId: Id<"applications">, stage: string) => {
        if (confirm(`Are you sure you want to move this applicant to ${stage}?`)) {
            await updateStage({ token: user?.token || "", applicationId: appId, stage });
        }
    };


    const handleStatusChange = async (appId: Id<"applications">, status: string) => {
        await updateStatus({ token: user?.token || "", applicationId: appId, status });
    };

    const handleCreateReviewer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            await createReviewer({
                token: user?.token || "", // Added token (Wait, createReviewer args needs update in users.ts first?)
                adminId: user._id,
                name: revName,
                email: revEmail,
                password: revPass,
                assignToCohortId: activeCohort?._id
            });
            alert("Reviewer created!");
            setRevName(""); setRevEmail(""); setRevPass("");
        } catch (err) {
            alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
        }
    };

    const handleImportUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            await onboardUser({
                token: user.token,
                adminId: user._id,
                email: impEmail,
                name: impName,
                targetStageId: impStage
            });
            alert("User imported successfully!");
            setImpName(""); setImpEmail(""); setShowImport(false);
        } catch (e) {
            alert("Error: " + (e instanceof Error ? e.message : "Unknown error"));
        }
    }

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800">
                    {activeCohort ? `Active Cohort: ${activeCohort.name}` : "No Active Cohort"}
                </h2>
                <p className="text-gray-500 text-sm">Manage applicants and reviewers for the currently active admission cycle.</p>
            </div>

            <div className="flex gap-4 mb-6 border-b pb-2">
                <button onClick={() => setActiveTab('applicants')} className={`pb-2 ${activeTab === 'applicants' ? 'font-bold text-brand-blue border-b-2 border-brand-blue' : 'text-gray-500'}`}>Applicants</button>
                <button onClick={() => setActiveTab('reviewers')} className={`pb-2 ${activeTab === 'reviewers' ? 'font-bold text-brand-blue border-b-2 border-brand-blue' : 'text-gray-500'}`}>Reviewers</button>
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
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-brand-blueDark">Applicant Pipelines</h3>
                        <button
                            onClick={() => setShowImport(!showImport)}
                            className="bg-white border hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition"
                        >
                            <UploadCloud size={16} /> Import / Fast Track
                        </button>
                    </div>

                    {showImport && (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 animate-fade-in">
                            <h4 className="font-bold text-brand-blueDark mb-3 flex items-center gap-2">
                                <Plus size={16} /> Import Applicant / Fast Track
                            </h4>
                            <form onSubmit={handleImportUser} className="flex gap-4 items-end flex-wrap">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                                    <input className="border p-2 rounded text-sm" value={impName} onChange={e => setImpName(e.target.value)} placeholder="Full Name" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                    <input className="border p-2 rounded text-sm" value={impEmail} onChange={e => setImpEmail(e.target.value)} type="email" placeholder="user@example.com" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Starting Stage</label>
                                    <select className="border p-2 rounded text-sm min-w-[150px]" value={impStage} onChange={e => setImpStage(e.target.value)}>
                                        {activeCohort?.pipeline.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                                        ))}
                                    </select>
                                </div>
                                <button className="bg-brand-blue text-white px-4 py-2 rounded font-bold text-sm hover:bg-brand-blueDark transition">Import User</button>
                            </form>
                            <p className="text-xs text-blue-600 mt-2">
                                * Takes an existing or new user and creates an application for the current cohort starting at the selected stage.
                            </p>
                        </div>
                    )}

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
                                                    {activeCohort?.pipeline.map((p) => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
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
