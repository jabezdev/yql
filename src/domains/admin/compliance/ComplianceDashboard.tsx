import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AlertTriangle, Download } from "lucide-react";

export default function ComplianceDashboard() {
    const incidents = useQuery(api.domains.compliance.compliance.getIncidentReports);

    if (!incidents) return <div className="p-8">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Compliance & Safety</h1>

            <div className="grid gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-red-500" size={20} />
                        Incident Reports
                    </h3>

                    <div className="divide-y divide-gray-100">
                        {incidents.map(inc => (
                            <div key={inc._id} className="py-4">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-gray-900">{inc.title}</span>
                                    <span className="text-xs text-gray-500">{new Date(inc.submittedAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{inc.description}</p>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">Reporter: {inc.reporterName}</span>
                                    <span className="bg-gray-100 px-2 py-1 rounded text-gray-600 capitalize">Status: {inc.status}</span>
                                </div>
                            </div>
                        ))}
                        {incidents.length === 0 && <p className="text-gray-500 text-sm">No incidents reported.</p>}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Download size={20} />
                        Data Export Requests
                    </h3>
                    <p className="text-sm text-gray-500">
                        GDPR data export requests are handled automatically by the system.
                        (List of historical exports could go here)
                    </p>
                </div>
            </div>
        </div>
    );
}
