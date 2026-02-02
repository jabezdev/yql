import { Save, AlertTriangle } from "lucide-react";

export default function SystemSettings() {
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
                    {/* Recruitment Cycle Config */}
                    <div className="flex items-start justify-between pb-8 border-b border-brand-border/50">
                        <div>
                            <h3 className="text-xl font-bold text-brand-text mb-1">Recruitment Cycle</h3>
                            <p className="text-brand-textMuted text-sm max-w-md">
                                Control whether the system accepts new applications from guests.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                                <span className="ml-3 text-sm font-medium text-brand-text">Active</span>
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
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-wine"></div>
                        </label>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button className="flex items-center gap-2 bg-brand-darkBlue hover:bg-brand-blue text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95">
                            <Save size={20} />
                            Save Configuration
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
