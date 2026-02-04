import { Save, AlertTriangle, Loader2, Info } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import type { Doc } from "../../../convex/_generated/dataModel";

export default function SystemSettings() {
    // Explicitly cast or handle the potential 'any' return if types aren't fully generated yet
    const settings = useQuery(api.core.settings.getSettings) as Doc<"system_settings">[] | undefined;
    const updateSetting = useMutation(api.core.settings.updateSetting);

    const [isSaving, setIsSaving] = useState(false);

    // Local state for immediate UI feedback
    const [config, setConfig] = useState<{
        guestAccess: boolean;
        maintenanceMode: boolean;
    }>({
        guestAccess: true,
        maintenanceMode: false
    });

    useEffect(() => {
        if (settings) {
            const guestAccess = settings.find((s) => s.key === "allow_guest_access");
            const maintenance = settings.find((s) => s.key === "maintenance_mode");

            setConfig({
                guestAccess: guestAccess ? guestAccess.value : true,
                maintenanceMode: maintenance ? maintenance.value : false
            });
        }
    }, [settings]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await Promise.all([
                updateSetting({ key: "allow_guest_access", value: config.guestAccess }),
                updateSetting({ key: "maintenance_mode", value: config.maintenanceMode })
            ]);
        } catch (error) {
            console.error("Failed to save settings", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (settings === undefined) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-blue" /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-red-100 text-brand-wine rounded-full text-xs font-bold uppercase tracking-wider">Admin Area</span>
                </div>
                <h1 className="text-3xl font-bold text-brand-text mt-2 mb-2">System Configuration</h1>
                <p className="text-brand-textMuted text-lg">
                    Manage global application behavior and feature flags.
                </p>
            </header>

            <div className="bg-white rounded-2xl p-8 shadow-soft border border-brand-border/50">
                <div className="flex items-center gap-3 p-4 bg-yellow-50 text-yellow-800 rounded-xl mb-8 border border-yellow-200">
                    <AlertTriangle size={24} />
                    <div>
                        <p className="font-bold">Warning</p>
                        <p className="text-sm">Changes made here affect the entire organization immediately.</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Guest Access Config (Generalized) */}
                    <div className="flex items-start justify-between pb-8 border-b border-brand-border/50">
                        <div>
                            <h3 className="text-xl font-bold text-brand-text mb-1">Guest Access</h3>
                            <p className="text-brand-textMuted text-sm max-w-md">
                                Allow users without an account to sign up or view public programs.
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                <Info size={14} />
                                <span>Specific recruitment cycles are managed in the <strong>Programs</strong> tab.</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={config.guestAccess}
                                    onChange={(e) => setConfig(prev => ({ ...prev, guestAccess: e.target.checked }))}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                                <span className={`ml-3 text-sm font-medium ${config.guestAccess ? "text-brand-blue" : "text-gray-500"}`}>
                                    {config.guestAccess ? "Allowed" : "Blocked"}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Feature Flags */}
                    <div className="flex items-start justify-between pb-8 border-b border-brand-border/50">
                        <div>
                            <h3 className="text-xl font-bold text-brand-text mb-1">Maintenance Mode</h3>
                            <p className="text-brand-textMuted text-sm max-w-md">
                                Temporarily disable access for non-admin users.
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={config.maintenanceMode}
                                onChange={(e) => setConfig(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-wine"></div>
                        </label>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-brand-darkBlue hover:bg-brand-blue text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            {isSaving ? "Saving..." : "Save Configuration"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
