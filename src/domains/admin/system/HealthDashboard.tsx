import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from "../../../core/components/ui/Card";
import { Loader2, Activity, Database, AlertCircle, CheckCircle } from "lucide-react";

export default function HealthDashboard() {
    const stats = useQuery(api.domains.admin.health.getSystemStats);

    if (!stats) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-gray-400" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
                <p className="text-muted-foreground">Real-time status of the YQL Engine.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="text-sm font-medium">Active Processes</div>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{stats.processHealth.active}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.processHealth.stalled} stalled ({'>'}7 days)
                        </p>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="text-sm font-medium">Active Programs</div>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{stats.configurations.activePrograms}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.configurations.totalAutomations} active automations
                        </p>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="text-sm font-medium">Database Load</div>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{stats.system.rowCounts.users}</div>
                        <p className="text-xs text-muted-foreground">
                            Users registered
                        </p>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="text-sm font-medium">Error Rate</div>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{(stats.system.errorRateProportion * 100).toFixed(0)}%</div>
                        <p className="text-xs text-muted-foreground">
                            In last 50 audit logs
                        </p>
                    </div>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 p-6">
                    <div className="mb-4">
                        <div className="text-lg font-semibold">Configuration Overview</div>
                    </div>
                    <div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Total Programs</span>
                                <span className="font-mono text-sm">{stats.configurations.totalPrograms}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Total Processes</span>
                                <span className="font-mono text-sm">{stats.processHealth.total}</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
