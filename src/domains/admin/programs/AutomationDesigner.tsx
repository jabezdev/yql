// import { useState } from "react";
import { Plus, Trash2, Zap, ArrowRight, Save } from "lucide-react";

interface AutomationAction {
    type: string;
    payload: any;
}

interface AutomationRule {
    trigger: string;
    conditions?: any;
    actions: AutomationAction[];
}

interface AutomationDesignerProps {
    automations: AutomationRule[] | undefined;
    onChange: (newAutomations: AutomationRule[]) => void;
    onSave: () => void;
}

const TRIGGERS = [
    { value: "process_created", label: "Process Started" },
    { value: "stage_submission", label: "Stage Submitted" },
    { value: "offer_accepted", label: "Offer Accepted" },
    { value: "process_completed", label: "Process Completed (End of Pipeline)" },
    { value: "event_booked", label: "Event Booked (for this Program)" },
];

const ACTION_TYPES = [
    { value: "update_role", label: "Update User System Role" },
    { value: "update_status", label: "Update Member Status" },
    { value: "send_email", label: "Send Email Notification" },
    { value: "create_todo", label: "Create Task/Todo" },
];

export default function AutomationDesigner({ automations = [], onChange, onSave }: AutomationDesignerProps) {
    // Local state to handle edits before "saving" to parent if needed, 
    // but here we likely rely on parent passing valid state. 
    // We will just mutate via onChange.

    const addAutomation = () => {
        onChange([
            ...automations,
            { trigger: TRIGGERS[0].value, actions: [] }
        ]);
    };

    const removeAutomation = (index: number) => {
        const next = [...automations];
        next.splice(index, 1);
        onChange(next);
    };

    const updateAutomation = (index: number, field: keyof AutomationRule, value: any) => {
        const next = [...automations];
        next[index] = { ...next[index], [field]: value };
        onChange(next);
    };

    const addAction = (automationIndex: number) => {
        const next = [...automations];
        next[automationIndex].actions.push({ type: "update_status", payload: {} });
        onChange(next);
    };

    const removeAction = (automationIndex: number, actionIndex: number) => {
        const next = [...automations];
        next[automationIndex].actions.splice(actionIndex, 1);
        onChange(next);
    };

    const updateAction = (automationIndex: number, actionIndex: number, field: keyof AutomationAction, value: any) => {
        const next = [...automations];
        const action = next[automationIndex].actions[actionIndex];

        if (field === "type") {
            // Reset payload on type change
            next[automationIndex].actions[actionIndex] = { type: value, payload: {} };
        } else {
            // Update payload
            action.payload = value;
        }
        onChange(next);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div>
                    <h3 className="font-bold text-blue-900 flex items-center gap-2">
                        <Zap size={18} /> Automation Rules
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                        Define side-effects that happen automatically when specific events occur in this program.
                    </p>
                </div>
                <button
                    onClick={onSave}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-sm font-medium"
                >
                    <Save size={16} /> Save Changes
                </button>
            </div>

            <div className="space-y-4">
                {automations.map((rule, idx) => (
                    <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm relative group">
                        <button
                            onClick={() => removeAutomation(idx)}
                            className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={18} />
                        </button>

                        <div className="flex items-start gap-4">
                            {/* Trigger Section */}
                            <div className="w-1/3 space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">When this happens...</label>
                                <select
                                    className="w-full p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    value={rule.trigger}
                                    onChange={(e) => updateAutomation(idx, "trigger", e.target.value)}
                                >
                                    {TRIGGERS.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-8 text-gray-300">
                                <ArrowRight size={20} />
                            </div>

                            {/* Actions Section */}
                            <div className="flex-1 space-y-3">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Do these actions...</label>

                                {rule.actions.map((action, actionIdx) => (
                                    <div key={actionIdx} className="flex gap-2 items-start bg-gray-50 p-2 rounded-md border">
                                        <div className="flex-1 space-y-2">
                                            <select
                                                className="w-full text-sm p-1.5 border rounded bg-white"
                                                value={action.type}
                                                onChange={(e) => updateAction(idx, actionIdx, "type", e.target.value)}
                                            >
                                                {ACTION_TYPES.map(t => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>

                                            {/* Action Configuration / Payload UI */}
                                            <ActionPayloadEditor
                                                type={action.type}
                                                payload={action.payload}
                                                onChange={(newPayload) => updateAction(idx, actionIdx, "payload", newPayload)}
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeAction(idx, actionIdx)}
                                            className="text-gray-400 hover:text-red-500 p-1"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    onClick={() => addAction(idx)}
                                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium mt-2"
                                >
                                    <Plus size={14} /> Add Action
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {automations.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                        <Zap size={32} className="mx-auto mb-2 opacity-20" />
                        <p>No automations configured for this program.</p>
                        <button
                            onClick={addAutomation}
                            className="mt-4 text-blue-600 hover:underline"
                        >
                            Create your first rule
                        </button>
                    </div>
                )}
            </div>

            {automations.length > 0 && (
                <button
                    onClick={addAutomation}
                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-blue-300 hover:text-blue-600 flex justify-center items-center gap-2 transition-colors font-medium"
                >
                    <Plus size={18} /> Add Another Rule
                </button>
            )}
        </div>
    );
}

// Sub-component for editing action payloads specific to the type
function ActionPayloadEditor({ type, payload, onChange }: { type: string, payload: any, onChange: (val: any) => void }) {

    if (type === "update_role") {
        return (
            <div className="text-xs space-y-1">
                <label className="text-gray-500">New System Role</label>
                <select
                    className="w-full p-1 border rounded"
                    value={payload.systemRole || ""}
                    onChange={(e) => onChange({ ...payload, systemRole: e.target.value })}
                >
                    <option value="">Select Role...</option>
                    <option value="member">Member</option>
                    <option value="guest">Guest</option>
                    <option value="manager">Manager</option>
                    <option value="officer">Officer</option>
                </select>
            </div>
        );
    }

    if (type === "update_status") {
        return (
            <div className="text-xs space-y-1">
                <label className="text-gray-500">New Status</label>
                <select
                    className="w-full p-1 border rounded"
                    value={payload.status || ""}
                    onChange={(e) => onChange({ ...payload, status: e.target.value })}
                >
                    <option value="">Select Status...</option>
                    <option value="active">Active</option>
                    <option value="probation">Probation</option>
                    <option value="alumni">Alumni</option>
                    <option value="suspended">Suspended</option>
                </select>
            </div>
        );
    }

    if (type === "send_email") {
        return (
            <div className="text-xs space-y-2">
                <div>
                    <input
                        placeholder="Subject Line (e.g. Welcome!)"
                        className="w-full p-1 border rounded"
                        value={payload.subject || ""}
                        onChange={(e) => onChange({ ...payload, subject: e.target.value })}
                    />
                </div>
                <div>
                    <select
                        className="w-full p-1 border rounded"
                        value={payload.template || ""}
                        onChange={(e) => onChange({ ...payload, template: e.target.value })}
                    >
                        <option value="">Select Template...</option>
                        <option value="welcome_email">Welcome Email</option>
                        <option value="application_received">Application Received</option>
                        <option value="offer_letter">Offer Letter</option>
                        <option value="rejection">Rejection Notice</option>
                    </select>
                </div>
            </div>
        );
    }

    return null;
}
