import React from "react";
// import { useNavigate } from "react-router-dom"; // Assuming standard router
import { ArrowRight, Sparkles } from "lucide-react";

interface ProgramListProps {
    programs: any[]; // Doc<"programs">[]
    role: string;
}

export const ProgramList: React.FC<ProgramListProps> = ({ programs, role }) => {
    // const navigate = useNavigate();

    // Filter out inactive (double check, though query handles it)
    // Map to UI model
    const items = programs.map(p => {
        const config = p.viewConfig?.[role];
        return {
            id: p._id,
            slug: p.slug,
            name: p.name,
            title: config?.cardTitle || p.name,
            description: p.description,
            cta: config?.ctaLabel || "Start",
            icon: config?.icon, // We'd need to map string to Icon component, generic for now
        };
    });

    if (items.length === 0) return null;

    return (
        <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Available Opportunities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden group"
                        onClick={() => console.log(`Navigate to /program/${item.slug}`)} // Todo: Add genuine navigation
                    >
                        {/* Decorative background shape */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity"></div>

                        <h3 className="text-xl font-bold mb-2 relative z-10">{item.title}</h3>
                        <p className="text-blue-100 text-sm mb-6 relative z-10 line-clamp-2">
                            {item.description || "Start this process to begin."}
                        </p>

                        <button className="flex items-center gap-2 text-sm font-semibold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors backdrop-blur-sm">
                            {item.cta} <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
