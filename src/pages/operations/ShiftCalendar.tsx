import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { format } from "date-fns";
import { Calendar, MapPin, Clock, Users, CheckCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";

export default function ShiftCalendar() {
    const shifts = useQuery(api.events.getShifts, {});
    const userId = useQuery(api.users.getMe)?._id;
    const bookEvent = useMutation(api.events.bookEvent);
    const cancelBooking = useMutation(api.events.cancelBooking);

    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleAction = async (shiftId: Id<"events">, action: 'book' | 'cancel') => {
        setProcessingId(shiftId);
        try {
            if (action === 'book') {
                await bookEvent({ eventId: shiftId });
            } else {
                await cancelBooking({ eventId: shiftId });
            }
        } catch (error) {
            console.error("Failed to update shift:", error);
            alert("Action failed. Please try again.");
        } finally {
            setProcessingId(null);
        }
    };

    if (!shifts || !userId) return <div className="p-8 text-center text-gray-500">Loading shifts...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Volunteer Shifts</h1>
                    <p className="text-gray-600">Find and sign up for upcoming opportunities.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shifts.map((shift) => {
                    const isBooked = shift.attendees.includes(userId);
                    const isFull = shift.attendees.length >= shift.maxAttendees;
                    const availableSpots = shift.maxAttendees - shift.attendees.length;

                    return (
                        <div key={shift._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{shift.title || "Volunteer Shift"}</h3>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{shift.description}</p>

                                <div className="space-y-2 text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} />
                                        <span>{format(shift.startTime, "EEEE, MMM d, yyyy")}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} />
                                        <span>{format(shift.startTime, "h:mm a")} - {format(shift.endTime, "h:mm a")}</span>
                                    </div>
                                    {shift.location && (
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} />
                                            <span>{shift.location}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Users size={16} />
                                        <span>{availableSpots} spots left</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-100">
                                {isBooked ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                                            <CheckCircle size={16} />
                                            Registered
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 border-red-100 hover:bg-red-50"
                                            onClick={() => handleAction(shift._id, 'cancel')}
                                            disabled={!!processingId}
                                        >
                                            {processingId === shift._id ? "..." : "Cancel"}
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        className="w-full"
                                        disabled={isFull || !!processingId}
                                        onClick={() => handleAction(shift._id, 'book')}
                                    >
                                        {processingId === shift._id ? "Updating..." : (isFull ? "Full" : "Sign Up")}
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {shifts.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        No upcoming shifts found. Check back later!
                    </div>
                )}
            </div>
        </div>
    );
}
