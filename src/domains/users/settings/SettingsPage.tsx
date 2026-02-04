import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Loader2, Save, Bell, Shield, User, Download } from "lucide-react";
import { Button } from "../../../core/components/ui/Button";

export default function SettingsPage() {
    const user = useQuery(api.core.users.getMe);
    const updateProfile = useMutation(api.core.users.updateProfile);

    const [isSaving, setIsSaving] = useState(false);
    const [notificationFreq, setNotificationFreq] = useState("daily");
    const [privacyLevel, setPrivacyLevel] = useState("members_only");

    const exportData = useMutation(api.domains.compliance.compliance.exportMyData);

    // Initialize state from user data once loaded
    // Note: in a real app, use useEffect or better form handling to sync state
    if (!user) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-brand-blue" />
            </div>
        );
    }

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProfile({
                privacyLevel,
                notificationPreferences: {
                    email: { enabled: true, frequency: notificationFreq },
                    inApp: true
                }
            });
            // Show success toast (mock)
            setTimeout(() => setIsSaving(false), 500);
        } catch (error) {
            console.error(error);
            setIsSaving(false);
        }
    };


    const handleExport = async () => {
        if (!confirm("Download your personal data?")) return;
        try {
            const json = await exportData({ format: "json" });
            // Trigger download
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `my-data-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert("Failed to export data.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-brand-text mb-2">Account Settings</h1>
                <p className="text-brand-textMuted text-lg">
                    Manage your profile, preferences, and privacy.
                </p>
            </header>

            <div className="grid gap-8">
                {/* Profile Section */}
                <section className="bg-white rounded-2xl p-6 shadow-soft border border-brand-border/50">
                    <div className="flex items-center gap-3 mb-6 border-b border-brand-border/50 pb-4">
                        <User className="text-brand-blue" />
                        <h2 className="text-xl font-bold text-brand-text">My Profile</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-brand-text mb-2">Full Name</label>
                            <input
                                type="text"
                                value={user.name}
                                disabled
                                className="w-full p-3 rounded-xl bg-brand-bgSubtle border border-brand-border text-brand-textMuted cursor-not-allowed font-medium"
                            />
                            <p className="text-xs text-brand-textMuted mt-1">Contact admin to change name.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-brand-text mb-2">Email Address</label>
                            <input
                                type="email"
                                value={user.email}
                                disabled
                                className="w-full p-3 rounded-xl bg-brand-bgSubtle border border-brand-border text-brand-textMuted cursor-not-allowed font-medium"
                            />
                        </div>
                    </div>
                </section>

                {/* Notifications Section */}
                <section className="bg-white rounded-2xl p-6 shadow-soft border border-brand-border/50">
                    <div className="flex items-center gap-3 mb-6 border-b border-brand-border/50 pb-4">
                        <Bell className="text-brand-yellow" />
                        <h2 className="text-xl font-bold text-brand-text">Notifications</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl hover:bg-brand-bgSubtle transition-colors">
                            <div>
                                <h3 className="font-semibold text-brand-text">Email Digest</h3>
                                <p className="text-sm text-brand-textMuted">Receive a summary of updates.</p>
                            </div>
                            <select
                                value={notificationFreq}
                                onChange={(e) => setNotificationFreq(e.target.value)}
                                className="p-2 rounded-lg border border-brand-border bg-white text-brand-text focus:ring-2 focus:ring-brand-blue outline-none"
                            >
                                <option value="instant">Instant</option>
                                <option value="daily">Daily Digest</option>
                                <option value="weekly">Weekly Summary</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Privacy Section */}
                <section className="bg-white rounded-2xl p-6 shadow-soft border border-brand-border/50">
                    <div className="flex items-center gap-3 mb-6 border-b border-brand-border/50 pb-4">
                        <Shield className="text-green-500" />
                        <h2 className="text-xl font-bold text-brand-text">Privacy</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-brand-text mb-2">Profile Visibility</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {['public', 'members_only', 'private'].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setPrivacyLevel(level)}
                                        className={`
                                            p-4 rounded-xl border text-left transition-all
                                            ${privacyLevel === level
                                                ? 'border-brand-blue bg-blue-50/50 text-brand-blue ring-1 ring-brand-blue'
                                                : 'border-brand-border hover:border-brand-blue/50 text-brand-textMuted'
                                            }
                                        `}
                                    >
                                        <span className="block font-bold capitalize mb-1">{level.replace('_', ' ')}</span>
                                        <span className="text-xs opacity-80">
                                            {level === 'public' ? 'Visible to everyone' :
                                                level === 'members_only' ? 'Visible to other members' :
                                                    'Only visible to you and admins'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Data Export Section (GDPR) */}
                <section className="bg-white rounded-2xl p-6 shadow-soft border border-brand-border/50">
                    <div className="flex items-center gap-3 mb-6 border-b border-brand-border/50 pb-4">
                        <Download className="text-gray-500" />
                        <h2 className="text-xl font-bold text-brand-text">Data Export</h2>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-brand-text">Download Your Data</h3>
                            <p className="text-sm text-brand-textMuted">Get a copy of your personal data and history.</p>
                        </div>
                        <Button variant="outline" onClick={handleExport}>
                            Request Export
                        </Button>
                    </div>
                </section>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-brand-darkBlue hover:bg-brand-blue text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
