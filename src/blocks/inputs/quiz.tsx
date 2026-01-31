import React, { useState } from "react";
import { type BlockConfigProps, type ApplicantViewProps, type ReviewerViewProps } from "../registry";
import { Plus, Trash2, CheckCircle, XCircle } from "lucide-react";

// Question interface for type safety
interface QuizQuestion {
    text: string;
    options: string[];
    correctAnswer?: string; // The correct option (for auto-grading)
}

// --- Configuration Editor ---
export const ConfigEditor: React.FC<BlockConfigProps> = ({ config, onChange }) => {
    // questions: [{ text, options: [string], correctAnswer?: string }]
    const [newQuestionText, setNewQuestionText] = useState("");

    const addQuestion = () => {
        if (!newQuestionText) return;
        const questions = config.questions || [];
        onChange({ ...config, questions: [...questions, { text: newQuestionText, options: [], correctAnswer: undefined }] });
        setNewQuestionText("");
    };

    const updateQuestion = (idx: number, updates: Partial<QuizQuestion>) => {
        const questions = [...(config.questions || [])] as QuizQuestion[];
        questions[idx] = { ...questions[idx], ...updates };
        onChange({ ...config, questions });
    };

    const removeQuestion = (idx: number) => {
        const questions = (config.questions || []).filter((_: QuizQuestion, i: number) => i !== idx);
        onChange({ ...config, questions });
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quiz Questions</label>
                {(config.questions || []).map((q: QuizQuestion, idx: number) => (
                    <div key={idx} className="border p-3 rounded mb-3 bg-white">
                        <div className="flex gap-2 mb-2">
                            <input
                                value={q.text}
                                onChange={e => updateQuestion(idx, { text: e.target.value })}
                                className="flex-1 border p-1 rounded text-sm font-bold"
                                placeholder="Question Text"
                            />
                            <button onClick={() => removeQuestion(idx)} className="text-red-400 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                        <div className="mb-2">
                            <label className="block text-[10px] uppercase text-gray-400 font-bold">Options (Comma separated)</label>
                            <input
                                value={q.options?.join(', ') || ""}
                                onChange={e => updateQuestion(idx, {
                                    options: e.target.value.split(',').map((s: string) => s.trim()),
                                    // Reset correct answer if options change
                                    correctAnswer: undefined
                                })}
                                className="w-full border p-1 rounded text-sm"
                                placeholder="Option A, Option B, Option C"
                            />
                        </div>
                        {q.options && q.options.length > 0 && (
                            <div>
                                <label className="block text-[10px] uppercase text-gray-400 font-bold">Correct Answer (Optional - for auto-grading)</label>
                                <select
                                    value={q.correctAnswer || ""}
                                    onChange={e => updateQuestion(idx, { correctAnswer: e.target.value || undefined })}
                                    className="w-full border p-1 rounded text-sm bg-white"
                                >
                                    <option value="">No answer key (manual review)</option>
                                    {q.options.filter(Boolean).map((opt: string) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                ))}

                <div className="flex gap-2 mt-2">
                    <input
                        value={newQuestionText}
                        onChange={e => setNewQuestionText(e.target.value)}
                        placeholder="New Question..."
                        className="flex-1 border p-2 rounded text-sm"
                        onKeyDown={e => e.key === 'Enter' && addQuestion()}
                    />
                    <button onClick={addQuestion} className="bg-gray-100 px-3 py-1 rounded font-bold hover:bg-gray-200">
                        <Plus size={16} /> Add
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Applicant View ---
export const ApplicantView: React.FC<ApplicantViewProps> = ({ block, value, onChange, readOnly }) => {
    const { config } = block;
    const answers = value || {}; // { [questionIdx]: selectedOption }

    const handleSelect = (qIdx: number, option: string) => {
        onChange({ ...answers, [qIdx]: option });
    };

    return (
        <div className="mb-6 space-y-6">
            {(config.questions || []).map((q: QuizQuestion, idx: number) => (
                <div key={idx} className="p-4 bg-white border rounded-lg shadow-sm">
                    <h5 className="font-bold text-gray-800 mb-3">{idx + 1}. {q.text}</h5>
                    <div className="space-y-2">
                        {q.options?.map((opt: string) => (
                            <label key={opt} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200">
                                <input
                                    type="radio"
                                    name={`q-${block._id}-${idx}`}
                                    checked={answers[idx] === opt}
                                    onChange={() => handleSelect(idx, opt)}
                                    disabled={readOnly}
                                    className="text-brand-blue focus:ring-brand-blue"
                                />
                                <span className="text-sm text-gray-700">{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Reviewer View ---
export const ReviewerView: React.FC<ReviewerViewProps> = ({ block, applicantValue }) => {
    const { config } = block;
    const answers = applicantValue || {};
    const questions = (config.questions || []) as QuizQuestion[];

    // Calculate score if answer keys exist
    const hasAnswerKeys = questions.some((q: QuizQuestion) => q.correctAnswer);
    let correctCount = 0;
    let totalWithKeys = 0;

    if (hasAnswerKeys) {
        questions.forEach((q: QuizQuestion, idx: number) => {
            if (q.correctAnswer) {
                totalWithKeys++;
                if (answers[idx] === q.correctAnswer) {
                    correctCount++;
                }
            }
        });
    }

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-gray-400 uppercase">Quiz Results</div>
                {hasAnswerKeys && (
                    <div className={`text-sm font-bold px-2 py-1 rounded ${correctCount === totalWithKeys ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        Score: {correctCount}/{totalWithKeys}
                    </div>
                )}
            </div>
            <div className="space-y-3">
                {questions.map((q: QuizQuestion, idx: number) => {
                    const userAnswer = answers[idx];
                    const isCorrect = q.correctAnswer && userAnswer === q.correctAnswer;
                    const isIncorrect = q.correctAnswer && userAnswer && userAnswer !== q.correctAnswer;

                    return (
                        <div key={idx} className="text-sm border rounded p-2">
                            <div className="font-medium text-gray-700 mb-1">{idx + 1}. {q.text}</div>
                            <div className={`flex items-center gap-2 pl-2 border-l-2 ${isCorrect ? 'border-green-500' : isIncorrect ? 'border-red-400' : 'border-brand-blue'}`}>
                                {isCorrect && <CheckCircle size={14} className="text-green-500" />}
                                {isIncorrect && <XCircle size={14} className="text-red-400" />}
                                <span className={isIncorrect ? 'text-red-600 line-through' : 'text-gray-600'}>
                                    {userAnswer || <span className="text-gray-400 italic">No answer</span>}
                                </span>
                                {isIncorrect && q.correctAnswer && (
                                    <span className="text-green-600 font-medium ml-2">
                                        Correct: {q.correctAnswer}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- Validation ---
export const validate = (value: Record<number, string> | undefined, config: { questions?: QuizQuestion[] }) => {
    // Check if all questions are answered
    if (!value) return ["Please answer the quiz."];
    const questions = config.questions || [];
    for (let i = 0; i < questions.length; i++) {
        if (!value[i]) return [`Question ${i + 1} is unanswered.`];
    }
    return null;
};

