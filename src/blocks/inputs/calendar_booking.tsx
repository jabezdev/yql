import React, { useState } from "react";
import { type BlockConfigProps, type ApplicantViewProps, type ReviewerViewProps } from "../registry";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { type Id } from "../../../convex/_generated/dataModel";
import { Calendar, Clock, Loader, Trash2, Plus } from "lucide-react";

// --- Configuration Editor ---
export const ConfigEditor: React.FC<BlockConfigProps> = ({ config, onChange }) => {
    const handleChange = (key: string, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Instruction Text</label>
                <input
                    value={config.label || "Select a slot"}
                    onChange={e => handleChange('label', e.target.value)}
                    className="w-full border p-2 rounded text-sm"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duration (Minutes)</label>
                    <input
                        type="number"
                        value={config.duration || 30}
                        onChange={e => handleChange('duration', parseInt(e.target.value))}
                        className="w-full border p-2 rounded text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Attendees / Slot</label>
                    <input
                        type="number"
                        value={config.maxAttendees || 1}
                        onChange={e => handleChange('maxAttendees', parseInt(e.target.value))}
                        className="w-full border p-2 rounded text-sm"
                    />
                </div>
            </div>
        </div>
    );
};

// --- Participant View ---
export const ParticipantView: React.FC<ApplicantViewProps> = ({ block, onChange }) => {
    const { config } = block;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slots = useQuery(api.events.getEventsForBlock, { blockId: block._id }) || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const myBookings = useQuery(api.events.getMyBookings, { blockId: block._id });
    const bookSlot = useMutation(api.events.bookEvent);
    const cancelBooking = useMutation(api.events.cancelBooking);

    const handleBook = async (eventId: any) => {
        await bookSlot({ eventId });
        onChange(eventId);
    };

    const handleCancel = async (eventId: any) => {
        if (confirm("Cancel this booking?")) {
            await cancelBooking({ eventId });
            onChange(null);
        }
    };

    if (slots === undefined || myBookings === undefined) return <div className="p-4 text-center"><Loader className="animate-spin inline" /></div>;

    const availableSlots = slots.filter((s: { status: string; attendees: string | any[]; maxAttendees: number; }) => s.status === 'open' && s.attendees.length < s.maxAttendees);
    const bookedSlot = myBookings[0];

    return (
        <div className="mb-6">
            <label className="block font-bold text-gray-700 mb-2">{config.label}</label>

            {bookedSlot ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-green-800">Confirmed Booking</h4>
                        <p className="text-green-700 text-sm">
                            {new Date(bookedSlot.startTime).toLocaleString()}
                        </p>
                    </div>
                    <button onClick={() => handleCancel(bookedSlot._id)} className="text-sm text-red-500 hover:underline">
                        Cancel
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
                    {availableSlots.length === 0 ? (
                        <div className="col-span-full text-gray-500 italic text-sm">No slots available at the moment.</div>
                    ) : (
                        availableSlots.map((slot: { _id: React.Key | null | undefined; startTime: string | number | Date; }) => (
                            <button
                                key={slot._id}
                                onClick={() => handleBook(slot._id)}
                                className="flex items-center gap-3 p-3 border rounded-lg hover:border-brand-blue hover:bg-blue-50 transition text-left"
                            >
                                <div className="bg-blue-100 text-brand-blue p-2 rounded">
                                    <Clock size={16} />
                                </div>
                                <div className="text-sm">
                                    <div className="font-bold text-gray-700">
                                        {new Date(slot.startTime).toLocaleDateString()}
                                    </div>
                                    <div className="text-gray-500">
                                        {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

// --- Reviewer View (Manage Slots) ---
export const ReviewerView: React.FC<ReviewerViewProps> = ({ block, isEditable }) => {

    const { config } = block;
    const createEvents = useMutation(api.events.createEvents);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slots = useQuery(api.events.getEventsForBlock, { blockId: block._id }) || [];
    const deleteEvent = useMutation(api.events.deleteEvent);

    const [newDate, setNewDate] = useState("");
    const [newTime, setNewTime] = useState("");

    const handleAddSlot = async () => {
        if (!newDate || !newTime) return;
        const start = new Date(`${newDate}T${newTime}`);
        const end = new Date(start.getTime() + (config.duration || 30) * 60000);

        await createEvents({
            blockId: block._id,
            slots: [{
                startTime: start.getTime(),
                endTime: end.getTime(),
                maxAttendees: config.maxAttendees || 1
            }],
            type: "interview" // Default generic booking type
        });
        // Reset (optional)
        setNewDate("");
        setNewTime("");
    };

    if (!isEditable) {
        return (
            <div className="mb-4">
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Booking Status</div>
                <div className="text-gray-500 italic text-sm">
                    (Booking details visible in participant context)
                </div>
            </div>
        );
    }

    return (
        <div className="mb-8 border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-brand-blue" size={20} />
                <h4 className="font-bold text-gray-800">Manage Availability Slots</h4>
            </div>

            {/* Add Slot */}
            <div className="flex gap-2 mb-6 items-end">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Date</label>
                    <input type="date" className="border p-2 rounded text-sm" value={newDate} onChange={e => setNewDate(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Time</label>
                    <input type="time" className="border p-2 rounded text-sm" value={newTime} onChange={e => setNewTime(e.target.value)} />
                </div>
                <button onClick={handleAddSlot} className="bg-brand-blue text-white px-3 py-2 rounded text-sm font-bold flex items-center gap-1 hover:bg-blue-600 mb-px">
                    <Plus size={16} /> Add Slot
                </button>
            </div>

            {/* List Slots */}
            <div className="space-y-2">
                <div className="text-xs font-bold text-gray-400 uppercase">Existing Slots</div>
                {slots.map((slot: { _id: React.Key | null | undefined; startTime: string | number | Date; attendees: string | any[]; maxAttendees: any; }) => (
                    <div key={slot._id} className="flex items-center justify-between bg-white p-2 border rounded shadow-sm text-sm">
                        <div className="flex gap-4">
                            <span className="font-medium">{new Date(slot.startTime).toLocaleString()}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${slot.attendees.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {slot.attendees.length} / {slot.maxAttendees} Booked
                            </span>
                        </div>
                        <button onClick={() => slot._id && deleteEvent({ eventId: slot._id as Id<"events"> })} className="text-gray-400 hover:text-red-500">
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
                {slots.length === 0 && <div className="text-gray-400 italic text-xs">No slots added yet.</div>}
            </div>
        </div>
    );
};


// --- Validation ---
export const validate = (value: any, config: any) => {
    // If required, ensure they booked something? 
    // Usually handled by the fact that value is the slotId
    if (config.required && !value) return ["Booking is required."];
    return null;
};
