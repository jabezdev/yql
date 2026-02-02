import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Users, Search } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

export default function UserManagement() {
    const [searchTerm, setSearchTerm] = useState("");
    // In a real app, this would be paginated and debounced
    // For MVP with <1000 users, loading all staff is acceptable
    const staff = useQuery(api.users.getStaffMembers, {});

    if (!staff) return <div>Loading...</div>;

    const filteredStaff = staff.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="text-brand-blue" />
                        User & Matrix Management
                    </h1>
                    <p className="text-gray-500">Manage staff, roles, and reporting lines</p>
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
                        placeholder="Search staff..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 font-semibold text-sm text-gray-600">User</th>
                            <th className="p-4 font-semibold text-sm text-gray-600">Role</th>
                            <th className="p-4 font-semibold text-sm text-gray-600">Position</th>
                            <th className="p-4 font-semibold text-sm text-gray-600">Department</th>
                            <th className="p-4 font-semibold text-sm text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStaff.map(user => {
                            const primaryPos = user.profile?.positions?.find(p => p.isPrimary);
                            return (
                                <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-4">
                                        <div className="font-medium text-brand-darkBlue">{user.name}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold uppercase">
                                            {user.systemRole}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {primaryPos?.title || "-"}
                                    </td>
                                    <td className="p-4 text-gray-500">
                                        {primaryPos ? <DepartmentBadge deptId={primaryPos.departmentId} /> : "-"}
                                    </td>
                                    <td className="p-4">
                                        <button className="text-blue-500 hover:underline text-sm font-medium">
                                            Manage
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredStaff.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400">
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function DepartmentBadge({ deptId }: { deptId?: Id<"departments"> }) {
    const dept = useQuery(api.departments.getDepartment, deptId ? { departmentId: deptId } : "skip");

    if (!deptId) return null;
    if (!dept) return <span className="animate-pulse bg-gray-200 h-4 w-12 inline-block rounded"></span>;
    return <span>{dept.name}</span>;
}
