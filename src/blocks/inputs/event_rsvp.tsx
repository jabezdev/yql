import React, { useState } from "react";
import { type BlockConfigProps, type ApplicantViewProps, type ReviewerViewProps } from "../registry";
import { Calendar, MapPin, CheckCircle2, XCircle } from "lucide-react";

// --- Configuration Editor ---
export const ConfigEditor: React.FC<BlockConfigProps> = ({ config, onChange }) => {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Event Title</label>
                <input
                    value={config.title || ""}
                    onChange={e => handleChange('title', e.target.value)}
                    className="w-full border p-2 rounded text-sm"
                    placeholder="e.g. Orientation Session"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date & Time</label>
                    <input
                        value={config.datetime || ""}
                        onChange={e => handleChange('datetime', e.target.value)}
                        className="w-full border p-2 rounded text-sm"
                        placeholder="Aug 24, 2:00 PM"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Location</label>
                    <input
                        value={config.location || ""}
                        onChange={e => handleChange('location', e.target.value)}
                        className="w-full border p-2 rounded text-sm"
                        placeholder="Zoom / Room 404"
                    />
                </div>
            </div>
        </div>
    );
};

// --- Applicant View ---
export const ApplicantView: React.FC<ApplicantViewProps> = ({ block, value, onChange, readOnly }) => {
    const { config } = block;
    // value = { status: 'going' | 'not_going', notes: string }
    const rsvp = value || { status: null, notes: "" };

    const setStatus = (status: 'going' | 'not_going') => {
        onChange({ ...rsvp, status });
    };

    return (
        <div className="mb-6 border rounded-xl overflow-hidden shadow-sm">
            <div className="bg-brand-blue/5 p-4 border-b border-brand-blue/10">
                <h4 className="font-bold text-brand-blue text-lg mb-1">{config.title || "Event Invitation"}</h4>
                <div className="flex gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {config.datetime}</span>
                    <span className="flex items-center gap-1"><MapPin size={14} /> {config.location}</span>
                </div>
            </div>
            <div className="p-4 bg-white">
                <p className="text-sm font-bold text-gray-700 mb-3">Will you attend?</p>
                <div className="flex gap-3 mb-4">
                    <button
                        onClick={() => setStatus('going')}
                        disabled={readOnly}
                        className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-bold transition ${rsvp.status === 'going' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                    >
                        <CheckCircle2 size={18} /> Yes, I'm going
                    </button>
                    <button
                        onClick={() => setStatus('not_going')}
                        disabled={readOnly}
                        className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-bold transition ${rsvp.status === 'not_going' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                    >
                        <XCircle size={18} /> No, I can't
                    </button>
                </div>
                {rsvp.status && (
                    <input
                        value={rsvp.notes}
                        onChange={e => onChange({ ...rsvp, notes: e.target.value })}
                        disabled={readOnly}
                        placeholder={rsvp.status === 'going' ? "Any dietary requirements or notes?" : "Reason (optional)"}
                        className="w-full border-b p-2 text-sm focus:border-brand-blue outline-none bg-transparent"
                    />
                )}
            </div>
        </div>
    );
};

// --- Reviewer View ---
export const ReviewerView: React.FC<ReviewerViewProps> = ({ block, applicantValue }) => {
    const { config } = block;
    const rsvp = applicantValue || {};

    return (
        <div className="mb-4">
            <div className="text-xs font-bold text-gray-400 uppercase mb-1">RSVP: {config.title}</div>
            <div className="flex items-center justify-between">
                <div className={`font-bold ${rsvp.status === 'going' ? 'text-green-600' : rsvp.status === 'not_going' ? 'text-red-500' : 'text-gray-400'}`}>
                    {rsvp.status === 'going' ? "ACCEPTED" : rsvp.status === 'not_going' ? "DECLINED" : "NO RESPONSE"}
                </div>
                {rsvp.notes && <div className="text-xs text-gray-500 max-w-[50%] text-right truncate">"{rsvp.notes}"</div>}
            </div>
        </div>
    );
};

// --- Validation ---
export const validate = (value: any, config: any) => {
    if (!value || !value.status) return ["Please confirm your attendance."];
    return null;
};
