import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus, Edit2, Trash2, FolderTree, ChevronRight, ChevronDown } from "lucide-react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

export default function OrganizationDesigner() {
    const departments = useQuery(api.departments.getAllDepartments, { includeInactive: true });
    const createDepartment = useMutation(api.departments.createDepartment);
    const updateDepartment = useMutation(api.departments.updateDepartment);
    const deleteDepartment = useMutation(api.departments.deleteDepartment);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Doc<"departments"> | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        parentDepartmentId: "" as string
    });

    if (!departments) return <div>Loading...</div>;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingDept) {
                await updateDepartment({
                    departmentId: editingDept._id,
                    name: formData.name,
                    slug: formData.slug,
                    description: formData.description,
                    parentDepartmentId: formData.parentDepartmentId ? formData.parentDepartmentId as Id<"departments"> : undefined,
                });
            } else {
                await createDepartment({
                    name: formData.name,
                    slug: formData.slug,
                    description: formData.description,
                    parentDepartmentId: formData.parentDepartmentId ? formData.parentDepartmentId as Id<"departments"> : undefined,
                });
            }
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            alert("Error saving department: " + (err as Error).message);
        }
    };

    const handleEdit = (dept: Doc<"departments">) => {
        setEditingDept(dept);
        setFormData({
            name: dept.name,
            slug: dept.slug,
            description: dept.description || "",
            parentDepartmentId: dept.parentDepartmentId || ""
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: Id<"departments">) => {
        if (confirm("Are you sure you want to delete this department? This action cannot be undone.")) {
            try {
                await deleteDepartment({ departmentId: id });
            } catch (err) {
                alert("Error deleting department: " + (err as Error).message);
            }
        }
    };

    const resetForm = () => {
        setEditingDept(null);
        setFormData({ name: "", slug: "", description: "", parentDepartmentId: "" });
    };

    // Hierarchy Builder
    const buildHierarchy = (parentId: string | null = null) => {
        return departments
            .filter(d => (d.parentDepartmentId || null) === parentId)
            .map(dept => (
                <DepartmentNode
                    key={dept._id}
                    dept={dept}
                    children={buildHierarchy(dept._id)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            ));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FolderTree className="text-brand-blue" />
                        Organization Designer
                    </h1>
                    <p className="text-gray-500">Manage departments and hierarchy</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-brand-blue text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition"
                >
                    <Plus size={16} /> New Department
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                {departments.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        No departments found. Create your first one!
                    </div>
                ) : (
                    <div className="space-y-1">
                        {buildHierarchy(null)}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{editingDept ? "Edit Department" : "New Department"}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Slug (ID)</label>
                                <input
                                    value={formData.slug}
                                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Parent Department</label>
                                <select
                                    value={formData.parentDepartmentId}
                                    onChange={e => setFormData({ ...formData, parentDepartmentId: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                >
                                    <option value="">None (Top Level)</option>
                                    {departments
                                        .filter(d => d._id !== editingDept?._id) // Prevent self-parenting loop in UI
                                        .map(d => (
                                            <option key={d._id} value={d._id}>{d.name}</option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border rounded-lg p-2 h-24"
                                />
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

function DepartmentNode({ dept, children, onEdit, onDelete }: {
    dept: Doc<"departments">,
    children: React.ReactNode[],
    onEdit: (d: Doc<"departments">) => void,
    onDelete: (id: Id<"departments">) => void
}) {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = children.length > 0;

    return (
        <div className="ml-4">
            <div className={`
        flex items-center justify-between p-3 rounded-lg border border-transparent 
        hover:bg-gray-50 hover:border-gray-200 transition group
        ${!dept.isActive ? "opacity-50" : ""}
      `}>
                <div className="flex items-center gap-2">
                    {hasChildren ? (
                        <button onClick={() => setIsExpanded(!isExpanded)} className="text-gray-400 hover:text-gray-600">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                    ) : <span className="w-4" />}

                    <FolderTree size={18} className="text-brand-lightBlue" />
                    <span className="font-medium">{dept.name}</span>
                    <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1 rounded">{dept.slug}</span>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => onEdit(dept)} className="p-1 hover:bg-white rounded text-blue-500">
                        <Edit2 size={14} />
                    </button>
                    <button onClick={() => onDelete(dept._id)} className="p-1 hover:bg-white rounded text-red-500">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {isExpanded && hasChildren && (
                <div className="border-l border-gray-100 ml-5 pl-1">
                    {children}
                </div>
            )}
        </div>
    );
}
