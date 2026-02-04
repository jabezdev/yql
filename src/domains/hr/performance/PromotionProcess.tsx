import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Loader2, Search, UserPlus } from "lucide-react";
import { Button } from "../../../core/components/ui/Button";

export default function PromotionProcess() {
    const users = useQuery(api.core.users.getStaffMembers, {});
    // In reality, searchUsers needs to be implemented or we use a filtered user list
    const nominate = useMutation(api.domains.hr.promotions.nominateForPromotion);

    // Fallback if searchUsers is not ready, just list some (unsafe for prod but fine for MVP dev)
    // Actually, let's look at `users.ts` - likely need `getAllUsers` or something.
    // Assuming we have a way to pick a user.

    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [role, setRole] = useState("senior_member");
    const [justification, setJustification] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleNominate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        setIsSubmitting(true);
        try {
            await nominate({
                nomineeId: selectedUser._id,
                proposedRole: role,
                justification
            });
            alert("Nomination submitted successfully!");
            setSelectedUser(null);
            setJustification("");
        } catch (err) {
            console.error(err);
            alert("Failed to nominate.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Promote a Volunteer</h1>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
                <h3 className="font-bold text-lg mb-4">Select Candidate</h3>
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name (Simulated)"
                        className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg"
                        onChange={() => { }}
                    />
                </div>

                {/* Mock user list for selection */}
                <div className="border border-gray-100 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                    {users?.slice(0, 5).map((u: any) => (
                        <div
                            key={u._id}
                            onClick={() => setSelectedUser(u)}
                            className={`p-3 cursor-pointer flex justify-between items-center hover:bg-gray-50
                                ${selectedUser?._id === u._id ? 'bg-brand-blue/5 border-l-4 border-brand-blue' : ''}
                            `}
                        >
                            <div>
                                <p className="font-medium text-sm">{u.name}</p>
                                <p className="text-xs text-gray-500">{u.email}</p>
                            </div>
                            {selectedUser?._id === u._id && <div className="w-2 h-2 rounded-full bg-brand-blue"></div>}
                        </div>
                    ))}
                </div>
            </div>

            {selectedUser && (
                <form onSubmit={handleNominate} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-fade-in">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Role</label>
                        <select
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        >
                            <option value="senior_member">Senior Member</option>
                            <option value="team_lead">Team Lead</option>
                            <option value="manager">Manager</option>
                        </select>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Justification</label>
                        <textarea
                            required
                            value={justification}
                            onChange={e => setJustification(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue h-32"
                            placeholder="Why does this person deserve a promotion?"
                        />
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <UserPlus size={16} className="mr-2" />}
                        Submit Nomination
                    </Button>
                </form>
            )}
        </div>
    );
}
