import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus } from "lucide-react";
import { Button } from "../../components/ui/Button";

export default function ReimbursementForm() {
    const submitRequest = useMutation(api.finance.submitReimbursement);
    const myRequests = useQuery(api.finance.getMyReimbursements);

    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [receiptUrl, setReceiptUrl] = useState(""); // Simplified

    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submitRequest({
            amount: parseFloat(amount),
            description,
            receiptUrl: receiptUrl || "https://example.com/receipt-placeholder"
        });
        setIsOpen(false);
        setAmount("");
        setDescription("");
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Reimbursements</h1>
                <Button onClick={() => setIsOpen(!isOpen)}>
                    <Plus size={16} className="mr-2" /> New Request
                </Button>
            </div>

            {isOpen && (
                <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm animate-fade-in relative z-10">
                    <h3 className="font-bold mb-4">New Request</h3>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Amount ($)</label>
                                <input
                                    type="number" step="0.01" required
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={amount} onChange={e => setAmount(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Receipt URL (Mock)</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="http://..."
                                    value={receiptUrl} onChange={e => setReceiptUrl(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <input
                                type="text" required
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="Lunch for orientation event..."
                                value={description} onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit">Submit Request</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 font-medium text-gray-500">Date</th>
                            <th className="p-4 font-medium text-gray-500">Description</th>
                            <th className="p-4 font-medium text-gray-500">Amount</th>
                            <th className="p-4 font-medium text-gray-500">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {myRequests?.map(req => (
                            <tr key={req._id}>
                                <td className="p-4 text-gray-600">{new Date(req.data?.reimbursement.submittedAt).toLocaleDateString()}</td>
                                <td className="p-4 font-medium text-gray-900">{req.data?.reimbursement.description}</td>
                                <td className="p-4 text-gray-900">${req.data?.reimbursement.amount}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize
                                        ${req.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}
                                    `}>
                                        {req.status.replace('_', ' ')}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {myRequests?.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No requests found.</div>
                )}
            </div>
        </div>
    );
}
