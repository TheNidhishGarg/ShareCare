"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function ProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading, logout, setMode } = useAuthStore();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);
    const [addresses, setAddresses] = useState<any[]>([]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) router.push("/login");
    }, [isAuthenticated, authLoading, router]);

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            api.get("/users/me/addresses").then(({ data }) => {
                if (data.success) setAddresses(data.data);
            }).catch(() => { });
        }
    }, [user]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put("/users/me", { name });
            setEditing(false);
        } catch (err) {
            console.error("Failed to update:", err);
        }
        setSaving(false);
    };

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    if (authLoading || !user) {
        return (
            <AppShell>
                <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="p-4 space-y-6">
                {/* Profile Card */}
                <div className="glass-card p-6 text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-indigo-500/20 mb-4">
                        {user.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    {editing ? (
                        <div className="flex gap-2 items-center justify-center">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input w-48 text-center"
                                autoFocus
                            />
                            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm px-3 py-2">
                                {saving ? "..." : "Save"}
                            </button>
                            <button onClick={() => setEditing(false)} className="text-gray-400 text-sm hover:text-white">Cancel</button>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold text-white">{user.name || "Set your name"}</h2>
                            <p className="text-sm text-gray-400 mt-1">{user.phone}</p>
                            <button onClick={() => setEditing(true)} className="text-sm text-indigo-400 hover:underline mt-2">
                                Edit Profile
                            </button>
                        </>
                    )}
                </div>

                {/* Saved Addresses */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Saved Addresses</h3>
                    {addresses.length === 0 ? (
                        <div className="glass-card p-4 text-center text-gray-400 text-sm">No saved addresses</div>
                    ) : (
                        <div className="space-y-2">
                            {addresses.map((addr) => (
                                <div key={addr.id} className="glass-card p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-white flex items-center gap-2">
                                                {addr.label || "Address"}
                                                {addr.isDefault && <span className="badge badge-accepted text-[10px]">Default</span>}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">{addr.addressLine1}</p>
                                            {addr.city && <p className="text-xs text-gray-500">{addr.city}, {addr.state} {addr.pincode}</p>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Settings */}
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white mb-3">Settings</h3>
                    <div className="glass-card p-4 flex items-center justify-between">
                        <span className="text-sm text-gray-300">Default Mode</span>
                        <select
                            value={user.defaultMode}
                            onChange={(e) => {
                                setMode(e.target.value as "receiver" | "donor");
                                api.put("/users/me", { defaultMode: e.target.value }).catch(() => { });
                            }}
                            className="input w-32 text-sm py-2"
                        >
                            <option value="receiver">Receiver</option>
                            <option value="donor">Donor</option>
                        </select>
                    </div>
                    <div className="glass-card p-4 flex items-center justify-between">
                        <span className="text-sm text-gray-300">Account Status</span>
                        <span className="badge badge-completed">{user.isVerified ? "Verified" : "Unverified"}</span>
                    </div>
                    {user.role === "admin" && (
                        <button
                            onClick={() => router.push("/admin")}
                            className="glass-card p-4 w-full text-left text-sm text-amber-400 font-medium hover:border-amber-500/30 transition-colors"
                        >
                            🛡️ Admin Panel
                        </button>
                    )}
                </div>

                {/* Logout */}
                <button onClick={handleLogout} className="btn-danger w-full text-center">
                    Logout
                </button>
            </div>
        </AppShell>
    );
}
