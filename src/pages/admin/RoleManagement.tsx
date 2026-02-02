import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus, Shield, Edit2, Trash2 } from "lucide-react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

export default function RoleManagement() {
    const roles = useQuery(api.roles.getAllRoles);
    const createRole = useMutation(api.roles.createRole);
    const updateRole = useMutation(api.roles.updateRole);
    const deleteRole = useMutation(api.roles.deleteRole);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Doc<"roles"> | null>(null);

    // Simplified permissions for MVP
    // Ideally this would be a complex grid
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
    });

    if (!roles) return <div>Loading...</div>;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingRole) {
                await updateRole({
                    roleId: editingRole._id,
                    name: formData.name,
                    description: formData.description,
                    // Permissions would be handled here
                });
            } else {
                await createRole({
                    name: formData.name,
                    slug: formData.slug,
                    description: formData.description,
                    uiPermissions: [], // Default empty for custom
                    permissions: [], // Default empty
                    allowedProcessTypes: [],
                });
            }
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            alert("Error saving role: " + (err as Error).message);
        }
    };

    const handleEdit = (role: Doc<"roles">) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            slug: role.slug,
            description: role.description || "",
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: Id<"roles">) => {
        if (confirm("Are you sure you want to delete this role?")) {
            try {
                await deleteRole({ roleId: id });
            } catch (err) {
                alert("Error deleting role: " + (err as Error).message);
            }
        }
    };

    const resetForm = () => {
        setEditingRole(null);
        setFormData({ name: "", slug: "", description: "" });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="text-brand-blue" />
                        Role Management
                    </h1>
                    <p className="text-gray-500">Define roles and access permissions</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-brand-blue text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition"
                >
                    <Plus size={16} /> New Role
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map(role => (
                    <div key={role._id} className="bg-white p-5 rounded-xl border border-brand-border shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-mono ${role.isSystemRole ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {role.slug}
                            </span>
                            <div className="flex gap-1">
                                <button onClick={() => handleEdit(role)} className="p-1 text-gray-400 hover:text-blue-500">
                                    <Edit2 size={16} />
                                </button>
                                {!role.isSystemRole && (
                                    <button onClick={() => handleDelete(role._id)} className="p-1 text-gray-400 hover:text-red-500">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <h3 className="font-bold text-lg mb-1">{role.name}</h3>
                        <p className="text-sm text-gray-600 h-10 overflow-hidden text-ellipsis">{role.description}</p>

                        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
                            <span>{role.permissions?.length || 0} permissions</span>
                            <span>{role.uiPermissions?.length || 0} UI access</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{editingRole ? "Edit Role" : "New Custom Role"}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Role Name</label>
                                <input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Slug (Unique ID)</label>
                                <input
                                    value={formData.slug}
                                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    required
                                    disabled={!!editingRole} // Slug immutable after creation
                                />
                                <p className="text-xs text-gray-400 mt-1">Must be lowercase, no spaces (e.g., "senior_volunteer")</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border rounded-lg p-2 h-24"
                                />
                            </div>

                            <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800">
                                Note: Advanced permission configuration is available in the JSON editor or Database dashboard for now.
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-600"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
