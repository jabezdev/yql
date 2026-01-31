import { STAGE_TYPE_LIST } from "../../../constants/stages";
import * as Icons from "lucide-react";

export default function StageTypeManager() {
    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Stage Types</h2>
                    <p className="text-gray-500">Available building blocks for pipelines (Hardcoded).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {STAGE_TYPE_LIST.map((t) => {
                    // New constants have the component directly in `icon`
                    const Icon = t.icon || Icons.LayoutTemplate;
                    return (
                        <div key={t.key} className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition group relative">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-2 bg-blue-50 text-brand-blue rounded-lg">
                                    <Icon size={24} />
                                </div>
                            </div>
                            <h4 className="font-bold text-gray-800">{t.label}</h4>
                            <div className="flex items-center gap-2 mt-1 mb-2">
                                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{t.key}</code>
                                <span className="text-xs text-gray-400 capitalize">• {t.kind}</span>
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-2">{t.description}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
