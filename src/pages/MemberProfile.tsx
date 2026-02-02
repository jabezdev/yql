
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

import { Loader2, User, Briefcase, Calendar, Shield } from "lucide-react";

export default function MemberProfile() {
    const user = useQuery(api.users.getMe);
    // Ideally we would have a mutation to update profile, but for now just read-only or placeholder
    // const updateProfile = useMutation(api.users.updateProfile); 

    if (!user) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-brand-blue" />
            </div>
        );
    }

    const { name, email, systemRole, clearanceLevel, profile } = user;
    const positions = profile?.positions || [];
    const status = profile?.status || "Unknown";
    const joinDate = profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString() : "N/A";

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header / Identity Card */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 flex items-start justify-between">
                <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                        <User size={40} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
                        <p className="text-gray-500">{email}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider 
                                ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {status}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                Tier {clearanceLevel ?? 0}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Positions & Roles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4 text-brand-blueDark">
                        <Briefcase size={20} />
                        <h2 className="text-lg font-bold">Positions & Titles</h2>
                    </div>

                    {positions.length === 0 ? (
                        <p className="text-gray-400 italic">No official positions assigned.</p>
                    ) : (
                        <div className="space-y-3">
                            {positions.map((pos: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div>
                                        <p className="font-semibold text-gray-800">{pos.title || "Untitled"}</p>
                                        <p className="text-sm text-gray-500">{pos.department || "General Member"}</p>
                                    </div>
                                    {pos.isPrimary && (
                                        <span className="text-xs bg-brand-wine text-white px-2 py-1 rounded">Primary</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4 text-brand-blueDark">
                        <Shield size={20} />
                        <h2 className="text-lg font-bold">System Access</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-600">System Role</span>
                            <span className="font-medium capitalize">{systemRole || "Guest"}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-600">Clearance Level</span>
                            <span className="font-medium">Level {clearanceLevel ?? 0}</span>
                        </div>
                        <div className="flex justify-between pb-2">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Calendar size={16} />
                                <span>Joined</span>
                            </div>
                            <span className="font-medium">{joinDate}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Future: Processes List */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 opacity-50">
                <h2 className="text-lg font-bold text-gray-400 mb-2">Active Processes (Coming Soon)</h2>
                <p className="text-gray-400 text-sm">Track your generic workflows, LOA requests, and recommitment forms here.</p>
            </div>
        </div>
    );
}
