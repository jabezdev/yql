import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Loader2, Calendar, Clock, CheckCircle } from "lucide-react";
import { Button } from "../ui/Button";

interface MeetingSchedulerBlockProps {
    block: Doc<"block_instances">;
    value: any; // Ideally this is the eventId booked
    onChange: (value: any) => void;
    readOnly?: boolean;
}

export function MeetingSchedulerBlock({ block, value, onChange, readOnly }: MeetingSchedulerBlockProps) {
    const events = useQuery(api.events.getEventsForBlock, { blockId: block._id });
    const bookEvent = useMutation(api.events.bookEvent);


    // value here is likely the eventId if single booking allowed
    // But value might also be locally managed if we don't save it to process state immediately.
    // However, for stage persistence, we should save the booked eventId.

    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleBook = async (eventId: string) => {
        setLoadingId(eventId);
        setError(null);
        try {
            await bookEvent({ eventId: eventId as any });
            onChange(eventId); // Save to stage data
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoadingId(null);
        }
    };

    if (events === undefined) {
        return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-brand-blue" /></div>;
    }

    if (events.length === 0) {
        return <div className="p-4 bg-gray-50 text-gray-500 rounded border border-gray-200">No available slots found.</div>;
    }

    return (
        <div className="mb-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Calendar className="text-brand-blue" />
                {block.config?.label || "Select a time slot"}
            </h3>

            {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded">{error}</div>}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => {
                    const isBookedByMe = value === event._id; // Simple check if our stored value matches
                    // Note: Ideally we check `getMyBookings` to be sure, but value sync is okay for now.

                    const isFull = event.status === 'full' || event.attendees.length >= event.maxAttendees;
                    const startTime = new Date(event.startTime);
                    const endTime = new Date(event.endTime);

                    return (
                        <div
                            key={event._id}
                            className={`
                                relative p-4 rounded-xl border transition-all
                                ${isBookedByMe
                                    ? 'bg-blue-50 border-blue-500 shadow-md'
                                    : isFull
                                        ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                                        : 'bg-white border-gray-200 hover:border-brand-blue hover:shadow-sm cursor-pointer'
                                }
                            `}
                            onClick={() => !isFull && !readOnly && !isBookedByMe ? handleBook(event._id) : null}
                        >
                            {isBookedByMe && (
                                <div className="absolute top-2 right-2 text-blue-600">
                                    <CheckCircle size={18} />
                                </div>
                            )}

                            <div className="text-sm font-semibold text-gray-900 mb-1">
                                {startTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                            <div className="text-xs text-gray-600 flex items-center gap-1 mb-3">
                                <Clock size={12} />
                                {startTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} -
                                {endTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                            </div>

                            <div className="mt-2">
                                {isBookedByMe ? (
                                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded">Booked</span>
                                ) : isFull ? (
                                    <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded">Full</span>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full text-xs h-8"

                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleBook(event._id);
                                        }}
                                        disabled={readOnly || loadingId === event._id}
                                    >
                                        Book Slot
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
