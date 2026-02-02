import { useState, useEffect } from "react";
import type { Doc } from "../../../convex/_generated/dataModel";

interface ReviewRubricBlockProps {
    block: Doc<"block_instances">;
    value: any;
    onChange: (value: any) => void;
    readOnly?: boolean;
}

interface RubricCriterion {
    id: string;
    label: string;
    description?: string;
    maxScore: number;
}



export function ReviewRubricBlock({ block, value, onChange, readOnly }: ReviewRubricBlockProps) {
    const criteria: RubricCriterion[] = block.config?.criteria || [];
    const [scores, setScores] = useState<Record<string, number>>(value?.scores || {});
    const [comments, setComments] = useState<string>(value?.comments || "");

    useEffect(() => {
        if (value) {
            setScores(value.scores || {});
            setComments(value.comments || "");
        }
    }, [value]);

    const handleScoreChange = (id: string, score: number) => {
        const newScores = { ...scores, [id]: score };
        setScores(newScores);
        updateValue(newScores, comments);
    };

    const handleCommentChange = (text: string) => {
        setComments(text);
        updateValue(scores, text);
    };

    const updateValue = (s: Record<string, number>, c: string) => {
        const total = Object.values(s).reduce((a, b) => a + b, 0);
        onChange({
            scores: s,
            comments: c,
            totalScore: total
        });
    };

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const maxTotal = criteria.reduce((a, b) => a + b.maxScore, 0);

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-4 flex justify-between items-center">
                <span>{block.config?.label || "Evaluation Rubric"}</span>
                <span className="text-sm bg-slate-200 px-3 py-1 rounded-full">
                    Score: {totalScore} / {maxTotal}
                </span>
            </h3>

            {criteria.length === 0 && <p className="text-gray-500 italic">No criteria defined.</p>}

            <div className="space-y-6 mb-6">
                {criteria.map((criterion) => (
                    <div key={criterion.id}>
                        <div className="flex justify-between mb-1">
                            <label className="font-medium text-slate-700">{criterion.label}</label>
                            <span className="text-sm text-slate-500">Max: {criterion.maxScore}</span>
                        </div>
                        {criterion.description && (
                            <p className="text-sm text-slate-500 mb-2">{criterion.description}</p>
                        )}
                        <input
                            type="range"
                            min="0"
                            max={criterion.maxScore}
                            value={scores[criterion.id] || 0}
                            onChange={(e) => handleScoreChange(criterion.id, parseInt(e.target.value))}
                            className="w-full accent-brand-blue"
                            disabled={readOnly}
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>0</span>
                            <span>{scores[criterion.id] || 0}</span>
                            <span>{criterion.maxScore}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div>
                <label className="block font-medium text-slate-700 mb-2">Overall Comments</label>
                <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue min-h-[100px]"
                    value={comments}
                    onChange={(e) => handleCommentChange(e.target.value)}
                    placeholder="Enter evaluation notes..."
                    disabled={readOnly}
                />
            </div>
        </div>
    );
}
