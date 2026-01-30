import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { getAuthUser } from "../../lib/auth";
import PipelineEditor from "../../components/admin/PipelineEditor";
import StageTypeManager from "../../components/admin/stages/StageTypeManager";
import { Plus, Trash2, Edit2, Play, Pause, Save, X, Layout, Users, Briefcase, ChevronRight, Settings } from "lucide-react";

interface PositionGroup {
    committee: string;
    roles: string[];
}

export default function CohortManager() {
    const user = getAuthUser();
    const cohorts = useQuery(api.cohorts.getAllCohorts);
    const updateCohort = useMutation(api.cohorts.updateCohort);
    const createCohort = useMutation(api.cohorts.createCohort);

    // View State
    const [view, setView] = useState<'list' | 'create' | 'types'>('list');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'basic' | 'positions' | 'pipeline'>('basic');

    // Create/Edit Form State
    const [newName, setNewName] = useState("");
    const [newSlug, setNewSlug] = useState("");

    // Complex State for Open Positions
    const [newOpenPositions, setNewOpenPositions] = useState<PositionGroup[]>([
        { committee: "Marketing", roles: ["Graphic Designer", "Content Writer"] }
    ]);

    const [newPipeline, setNewPipeline] = useState<any[]>([
        {
            id: "form",
            name: "Application Form",
            type: "form",
            description: "Initial application questions.",
            formConfig: [
                { id: "q1", label: "Example Question", type: "text", required: true }
            ]
        },
        {
            id: "completed",
            name: "Completed",
            type: "completed",
            description: "End of pipeline."
        }
    ]);

    if (!cohorts) return <div className="p-8 flex items-center justify-center text-gray-400">Loading cohorts...</div>;

    const toggleActive = async (id: Id<"cohorts">, currentState: boolean) => {
        await updateCohort({ token: user?.token || "", cohortId: id, isActive: !currentState });
    };

    const startEdit = (cohort: Doc<"cohorts">) => {
        setEditingId(cohort._id);
        setNewName(cohort.name);
        setNewSlug(cohort.slug);

        // Handle migration from old flat array to new structure if needed
        if (cohort.openPositions && cohort.openPositions.length > 0 && typeof (cohort.openPositions as any)[0] === 'string') {
            // Legacy migration display
            setNewOpenPositions([{ committee: "General", roles: cohort.openPositions as any as string[] }]);
        } else {
            setNewOpenPositions(cohort.openPositions || []);
        }

        setNewPipeline(cohort.pipeline || []);
        setActiveTab('basic');
        setView('create');
    };

    const handleSave = async () => {
        try {
            const payload = {
                name: newName,
                slug: newSlug,
                openPositions: newOpenPositions,
                pipeline: newPipeline
            };



            if (editingId) {
                await updateCohort({
                    token: user?.token || "",
                    cohortId: editingId as Id<"cohorts">,
                    ...payload
                });
                alert("Cohort Updated!");
            } else {
                const now = Date.now();
                await createCohort({
                    token: user?.token || "",
                    ...payload,
                    startDate: now,
                });
                alert("Cohort Created!");
            }
            setView('list');
            setEditingId(null);
            setNewName(""); setNewSlug("");
        } catch (e) {
            alert("Error: " + (e instanceof Error ? e.message : "Unknown error"));
        }
    };

    // Position Editor Handlers
    const addCommittee = () => {
        setNewOpenPositions([...newOpenPositions, { committee: "New Committee", roles: [] }]);
    };
    const updateCommitteeName = (idx: number, name: string) => {
        const copy = [...newOpenPositions];
        copy[idx].committee = name;
        setNewOpenPositions(copy);
    };
    const addRole = (comIdx: number) => {
        const copy = [...newOpenPositions];
        copy[comIdx].roles.push("New Role");
        setNewOpenPositions(copy);
    };
    const updateRole = (comIdx: number, roleIdx: number, val: string) => {
        const copy = [...newOpenPositions];
        copy[comIdx].roles[roleIdx] = val;
        setNewOpenPositions(copy);
    };
    const removeRole = (comIdx: number, roleIdx: number) => {
        const copy = [...newOpenPositions];
        copy[comIdx].roles = copy[comIdx].roles.filter((_, rI) => rI !== roleIdx);
        setNewOpenPositions(copy);
    };
    const removeCommittee = (comIdx: number) => {
        setNewOpenPositions(newOpenPositions.filter((_, i) => i !== comIdx));
    };

    const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: React.ElementType }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition font-bold text-sm ${activeTab === id
                ? 'border-brand-blue text-brand-blue bg-blue-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold font-heading text-brand-blueDark flex items-center gap-3">
                    <Users className="w-8 h-8" /> Cohort Management
                </h1>
                <div className="flex gap-3">
                    <button
                        onClick={() => setView('types')}
                        className={`px-4 py-2 rounded font-bold transition border flex items-center gap-2 ${view === 'types' ? 'bg-gray-100 text-brand-blue border-brand-blue' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Settings size={18} /> Configure Stage Types
                    </button>
                    {view === 'list' && (
                        <button
                            onClick={() => {
                                setEditingId(null);
                                setNewName(""); setNewSlug("");
                                setNewOpenPositions([{ committee: "Marketing", roles: ["Designer"] }]);
                                setNewPipeline([
                                    {
                                        id: "form",
                                        name: "Application Form",
                                        type: "form",
                                        description: "Initial application questions.",
                                        formConfig: [
                                            { id: "q1", label: "Example Question", type: "text", required: true }
                                        ]
                                    },
                                    {
                                        id: "completed",
                                        name: "Completed",
                                        type: "completed",
                                        description: "End of pipeline."
                                    }
                                ]);
                                setView('create');
                                setActiveTab('basic');
                            }}
                            className="bg-brand-blue text-white px-4 py-2 rounded font-bold hover:bg-brand-blueDark transition flex items-center gap-2"
                        >
                            <Plus size={18} /> New Cohort
                        </button>
                    )}
                </div>
            </div>

            {view === 'types' ? (
                <div className="animate-fade-in">
                    <div className="mb-4">
                        <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 font-semibold text-sm">
                            <ChevronRight className="rotate-180" size={16} /> Back to Cohorts
                        </button>
                    </div>
                    <StageTypeManager />
                </div>
            ) : view === 'list' ? (
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 font-semibold text-gray-700">Name</th>
                                <th className="p-4 font-semibold text-gray-700">Slug</th>
                                <th className="p-4 font-semibold text-gray-700">Status</th>
                                <th className="p-4 font-semibold text-gray-700">Start Date</th>
                                <th className="p-4 font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cohorts.map((cohort) => (
                                <tr key={cohort._id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-bold">{cohort.name}</td>
                                    <td className="p-4 font-mono text-sm text-gray-500">{cohort.slug}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 w-fit ${cohort.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {cohort.isActive ? <Play size={10} /> : <Pause size={10} />}
                                            {cohort.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4">{new Date(cohort.startDate).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleActive(cohort._id, cohort.isActive)}
                                                title={cohort.isActive ? "Deactivate" : "Activate"}
                                                className={`p-2 rounded border transition ${cohort.isActive
                                                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                                                    : 'border-green-200 text-green-600 hover:bg-green-50'
                                                    }`}
                                            >
                                                {cohort.isActive ? <Pause size={16} /> : <Play size={16} />}
                                            </button>
                                            <button
                                                onClick={() => startEdit(cohort)}
                                                className="p-2 text-brand-blue hover:bg-blue-50 rounded border border-transparent hover:border-blue-100 transition"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {cohorts.length === 0 && (
                        <div className="p-8 text-center text-gray-500 italic">No cohorts found. Create one to get started.</div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-xl border animate-fade-in w-full overflow-hidden flex flex-col h-[calc(100vh-140px)]">
                    {/* Header */}
                    <div className="flex justify-between items-center px-8 py-5 border-b bg-white z-10">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                                {editingId ? <Edit2 className="text-brand-blue" /> : <Plus className="text-brand-blue" />}
                                {editingId ? "Edit Cohort Workflow" : "Create New Cohort Workflow"}
                            </h2>
                        </div>
                        <button onClick={() => setView('list')} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex px-8 border-b bg-gray-50/50">
                        <TabButton id="basic" label="Basic Details" icon={Layout} />
                        <TabButton id="positions" label="Open Positions" icon={Briefcase} />
                        <TabButton id="pipeline" label="Pipeline & Forms" icon={Users} />
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                        {activeTab === 'basic' && (
                            <div className="max-w-2xl animate-fade-in space-y-6">
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 text-blue-800 text-sm mb-6">
                                    <div className="mt-0.5"><Layout size={16} /></div>
                                    <p>Start by defining the core identity of this cohort. The slug will be used in the URL for applicants.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cohort Name</label>
                                    <input
                                        className="w-full border p-3 rounded-lg text-lg focus:ring-2 focus:ring-brand-blue/20 outline-none transition"
                                        placeholder="e.g. Batch 2027"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">URL Slug</label>
                                    <div className="flex items-center">
                                        <span className="bg-gray-100 border border-r-0 rounded-l-lg px-3 py-3 text-gray-500 text-sm font-mono">/apply/</span>
                                        <input
                                            placeholder="batch-2027"
                                            value={newSlug}
                                            disabled={!!editingId}
                                            className={`w-full border p-3 rounded-r-lg font-mono text-sm ${editingId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-brand-blue/20'}`}
                                            onChange={e => setNewSlug(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">This cannot be changed once created to prevent broken links.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'positions' && (
                            <div className="max-w-4xl animate-fade-in">
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 text-blue-800 text-sm mb-6">
                                    <div className="mt-0.5"><Briefcase size={16} /></div>
                                    <p>Define which committees are accepting applicants and the specific roles available within them.</p>
                                </div>

                                <div className="space-y-6">
                                    {newOpenPositions.map((group, gIdx) => (
                                        <div key={gIdx} className="bg-white p-5 rounded-lg border shadow-sm hover:border-brand-blue/30 transition group">
                                            <div className="flex items-center gap-3 mb-4 border-b pb-3">
                                                <input
                                                    className="font-bold text-lg text-brand-blueDark border-b-2 border-transparent hover:border-gray-200 focus:border-brand-blue outline-none flex-1 px-1"
                                                    value={group.committee}
                                                    onChange={(e) => updateCommitteeName(gIdx, e.target.value)}
                                                    placeholder="Committee Name"
                                                />
                                                <button onClick={() => removeCommittee(gIdx)} className="text-gray-300 hover:text-red-500 p-2 rounded hover:bg-red-50 transition"><Trash2 size={16} /></button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-1">
                                                {group.roles.map((role, rIdx) => (
                                                    <div key={rIdx} className="flex items-center gap-2 bg-gray-50 rounded p-2 border hover:bg-white transition">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-blue/40"></div>
                                                        <input
                                                            className="text-sm bg-transparent w-full outline-none text-gray-700 font-medium"
                                                            value={role}
                                                            onChange={(e) => updateRole(gIdx, rIdx, e.target.value)}
                                                            placeholder="Role Title"
                                                        />
                                                        <button onClick={() => removeRole(gIdx, rIdx)} className="text-gray-300 hover:text-red-500 p-1"><X size={14} /></button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => addRole(gIdx)}
                                                    className="text-sm border border-dashed border-brand-blue/30 text-brand-blue hover:bg-blue-50 rounded p-2 flex items-center justify-center gap-2 font-bold transition"
                                                >
                                                    <Plus size={14} /> Add Role
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        onClick={addCommittee}
                                        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-brand-blue hover:text-brand-blue text-lg font-bold flex items-center justify-center gap-2 transition hover:bg-gray-50"
                                    >
                                        <div className="bg-gray-200 rounded-full p-1"><Plus size={20} /></div>
                                        Add Committee
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'pipeline' && (
                            <div className="animate-fade-in max-w-5xl">
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 text-blue-800 text-sm mb-6">
                                    <div className="mt-0.5"><Users size={16} /></div>
                                    <p>Configure the linear stages required for this cohort. Drag to reorder. Use the "Form" type to build custom questions.</p>
                                </div>
                                <PipelineEditor
                                    pipeline={newPipeline}
                                    onChange={setNewPipeline}
                                />
                            </div>
                        )}

                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center gap-4 border-t px-8 py-5 bg-gray-50">
                        <div className="text-sm text-gray-400 font-medium">
                            {activeTab === 'basic' && "Step 1 of 3: Identity"}
                            {activeTab === 'positions' && "Step 2 of 3: Roles"}
                            {activeTab === 'pipeline' && "Step 3 of 3: Workflow"}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setView('list')} className="text-gray-500 px-6 py-2 font-bold hover:bg-gray-200 rounded transition">Cancel</button>

                            {activeTab !== 'pipeline' ? (
                                <button
                                    onClick={() => setActiveTab(activeTab === 'basic' ? 'positions' : 'pipeline')}
                                    className="bg-brand-blue text-white px-6 py-2 rounded font-bold hover:bg-brand-blueDark transition flex items-center gap-2"
                                >
                                    Next <ChevronRight size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSave}
                                    className="bg-brand-orange text-white px-8 py-3 rounded font-bold hover:bg-brand-orange/90 shadow-lg flex items-center gap-2 transform hover:-translate-y-0.5 transition"
                                >
                                    <Save size={18} /> {editingId ? "Save Changes" : "Create Cohort"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
