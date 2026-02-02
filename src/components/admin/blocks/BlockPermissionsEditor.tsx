
import { Lock, Eye, X, Edit3 } from 'lucide-react';

interface BlockPermissionsEditorProps {
    roleAccess: Array<{
        roleSlug: string;
        canView: boolean;
        canEdit?: boolean;
    }> | undefined;
    onChange: (newRoleAccess: any[]) => void;
}

export default function BlockPermissionsEditor({ roleAccess = [], onChange }: BlockPermissionsEditorProps) {
    // Ideally we fetch real roles, but for now we might mock or use what we know
    // Since roles are in DB, let's fetch them if possible, otherwise use hardcoded common ones for MVP
    // Assuming we have an api.roles.getAllRoles or similar. If not, we'll use a standard list.
    // For now, let's just use the known system roles + guest.
    const knownRoles = [
        { slug: 'guest', name: 'Guest' },
        { slug: 'member', name: 'Member' },
        { slug: 'manager', name: 'Manager' },
        { slug: 'lead', name: 'Team Lead' },
        { slug: 'admin', name: 'Admin' }
    ];

    const getRule = (slug: string) => roleAccess.find(r => r.roleSlug === slug) || { roleSlug: slug, canView: true, canEdit: true };

    const toggleView = (slug: string) => {
        const current = getRule(slug);
        const newRule = { ...current, canView: !current.canView };
        updateRule(slug, newRule);
    };

    const toggleEdit = (slug: string) => {
        const current = getRule(slug);
        const newRule = { ...current, canEdit: !current.canEdit };
        updateRule(slug, newRule);
    };

    const updateRule = (slug: string, newRule: any) => {
        // Remove old rule for this slug if exists
        const otherRules = roleAccess.filter(r => r.roleSlug !== slug);
        onChange([...otherRules, newRule]);
    };

    return (
        <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800 flex items-start gap-2">
                <Lock size={16} className="mt-0.5 shrink-0" />
                <div>
                    <h4 className="font-bold">Access Control</h4>
                    <p>Configure who can see and interact with this block. By default, blocks are visible to everyone who can see the stage.</p>
                </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold border-b">
                        <tr>
                            <th className="p-3">Role</th>
                            <th className="p-3 text-center">Can View</th>
                            <th className="p-3 text-center">Can Edit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {knownRoles.map(role => {
                            const rule = getRule(role.slug);
                            // Admins usually always have access, maybe disable toggle for them?
                            const isAdmin = role.slug === 'admin';

                            return (
                                <tr key={role.slug} className="hover:bg-gray-50">
                                    <td className="p-3 font-medium text-gray-700">{role.name}</td>
                                    <td className="p-3 text-center">
                                        <button
                                            onClick={() => toggleView(role.slug)}
                                            disabled={isAdmin}
                                            className={`p-1.5 rounded transition-colors ${rule.canView ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                        >
                                            {rule.canView ? <Eye size={16} /> : <X size={16} />}
                                        </button>
                                    </td>
                                    <td className="p-3 text-center">
                                        <button
                                            onClick={() => toggleEdit(role.slug)}
                                            disabled={isAdmin || !rule.canView}
                                            className={`p-1.5 rounded transition-colors ${rule.canEdit !== false ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}
                                            title={rule.canEdit !== false ? "Editable" : "Read Only"}
                                        >
                                            {rule.canEdit !== false ? <Edit3 size={16} /> : <Lock size={16} />}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
