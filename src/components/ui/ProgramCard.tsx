import type { Doc } from "../../../convex/_generated/dataModel";
import { Link } from "react-router-dom";
import { ChevronRight, Calendar, Users } from "lucide-react";

interface ProgramCardProps {
    program: Doc<"programs">;
    userRole: string;
}

export default function ProgramCard({ program, userRole }: ProgramCardProps) {
    // Get role-specific config from viewConfig if available
    const roleConfig = program.viewConfig?.[userRole] || {};
    const cardTitle = roleConfig.cardTitle || program.name;
    const cardDescription = roleConfig.cardDescription || program.description || "Click to learn more about this program.";

    // Format dates
    const startDate = new Date(program.startDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    // Determine badge color based on program type
    const getBadgeStyle = () => {
        switch (program.programType) {
            case "recruitment_cycle":
                return "bg-blue-100 text-brand-blue";
            case "survey_campaign":
                return "bg-purple-100 text-purple-600";
            case "performance_review":
                return "bg-green-100 text-green-600";
            case "recommitment":
                return "bg-amber-100 text-amber-600";
            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    const getProgramTypeLabel = () => {
        switch (program.programType) {
            case "recruitment_cycle":
                return "Recruitment";
            case "survey_campaign":
                return "Survey";
            case "performance_review":
                return "Review";
            case "recommitment":
                return "Recommitment";
            default:
                return program.programType || "Program";
        }
    };

    return (
        <Link
            to={`/dashboard/program/${program._id}`}
            className="group block bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-white/50 hover:shadow-lg hover:border-brand-blue/30 transition-all duration-300"
        >
            <div className="flex items-start justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getBadgeStyle()}`}>
                    {getProgramTypeLabel()}
                </span>
                <ChevronRight
                    className="text-brand-textMuted group-hover:text-brand-blue group-hover:translate-x-1 transition-all"
                    size={20}
                />
            </div>

            <h3 className="text-lg font-bold text-brand-text mb-2 group-hover:text-brand-darkBlue transition-colors">
                {cardTitle}
            </h3>

            <p className="text-brand-textMuted text-sm mb-4 line-clamp-2">
                {cardDescription}
            </p>

            <div className="flex items-center gap-4 text-xs text-brand-textMuted">
                <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{startDate}</span>
                </div>
                {program.allowStartBy && program.allowStartBy.length > 0 && (
                    <div className="flex items-center gap-1">
                        <Users size={14} />
                        <span>{program.allowStartBy.length} role(s)</span>
                    </div>
                )}
            </div>
        </Link>
    );
}
