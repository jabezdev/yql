import { STAGE_TYPE_LIST } from "../../../constants/stages";
import * as Icons from "lucide-react";
import { DashboardSectionTitle } from "../../ui";

export default function StageTypeManager() {
    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                <div>
                    <DashboardSectionTitle>Global Configuration</DashboardSectionTitle>
                    <p className="text-gray-500 max-w-2xl">
                        These are the available building blocks for your recruitment pipelines.
                        Each stage type comes with specific capabilities and default behaviors.
                        System administrators can define new types in the code.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {STAGE_TYPE_LIST.map((t) => {
                    const Icon = t.icon || Icons.LayoutTemplate;
                    return (
                        <div key={t.key} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-brand-blue/30 transition group flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-brand-bgLight text-brand-blue rounded-xl group-hover:scale-110 transition-transform">
                                    <Icon size={28} />
                                </div>
                                <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs font-mono font-medium">
                                    {t.key}
                                </span>
                            </div>

                            <h4 className="font-bold text-brand-blueDark text-lg mb-2">{t.label}</h4>
                            <p className="text-sm text-gray-500 leading-relaxed mb-6 flex-1">
                                {t.description}
                            </p>

                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400 font-medium">
                                {/* Beta tag removed to fix lint error if property missing */}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
