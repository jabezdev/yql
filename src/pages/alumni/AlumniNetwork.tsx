import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Search, Mail, Briefcase, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { Button } from "../../components/ui/Button";

export default function AlumniNetwork() {
    const alumniList = useQuery(api.alumni.getAlumniDirectory);
    const user = useQuery(api.users.getMe);
    const toggleMentorship = useMutation(api.alumni.toggleMentorshipStatus);

    const [search, setSearch] = useState("");

    if (!alumniList || !user) return <div className="p-8">Loading...</div>;

    const filteredAlumni = alumniList.filter(a =>
        a.name?.toLowerCase().includes(search.toLowerCase())
    );

    const isAlumni = user.profile?.status === 'alumni';
    const myMentorshipStatus = isAlumni ? user.profile?.customFields?.mentorshipOpen : false;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Alumni Network</h1>
                    <p className="text-gray-600 mt-1">Connect with former members and find mentors.</p>
                </div>
                {isAlumni && (
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-sm font-medium text-gray-700">Available to Mentor?</span>
                        <button
                            onClick={() => toggleMentorship({ isOpen: !myMentorshipStatus })} // This needs to be correctly passed
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${myMentorshipStatus ? 'bg-brand-blue' : 'bg-gray-200'
                                }`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${myMentorshipStatus ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                        </button>
                    </div>
                )}
            </div>

            <div className="relative mb-8">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search alumni by name..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAlumni.map((alum) => (
                    <div key={alum._id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg">
                                {alum.name?.[0]}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{alum.name}</h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <GraduationCap size={12} />
                                    Class of {alum.exitDate ? format(alum.exitDate, "yyyy") : "Unknown"}
                                </p>
                            </div>
                        </div>

                        {/* Last Position */}
                        {alum.positions && alum.positions.length > 0 && (
                            <div className="mb-4 text-sm text-gray-600 flex items-center gap-2">
                                <Briefcase size={14} className="text-gray-400" />
                                {alum.positions[alum.positions.length - 1].title || "Member"}
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                            {alum.mentorshipOpen ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Open to Mentorship
                                </span>
                            ) : (
                                <span className="text-xs text-gray-400">Not available for mentorship</span>
                            )}

                            <Button size="sm" variant="outline" onClick={() => window.location.href = `mailto:${alum.email}`}>
                                <Mail size={14} className="mr-1" /> Contact
                            </Button>
                        </div>
                    </div>
                ))}

                {filteredAlumni.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No alumni found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
}
