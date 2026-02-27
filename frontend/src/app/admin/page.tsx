"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function AdminDashboard() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [listings, setListings] = useState<any[]>([]);
    const [tab, setTab] = useState<"dashboard" | "users" | "listings" | "categories">("dashboard");

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
            router.push("/login");
        }
    }, [isAuthenticated, authLoading, user, router]);

    useEffect(() => {
        if (user?.role !== "admin") return;
        api.get("/admin/dashboard").then(({ data }) => { if (data.success) setStats(data.data); setLoading(false); }).catch(() => setLoading(false));
        api.get("/admin/users", { params: { limit: 10 } }).then(({ data }) => { if (data.success) setUsers(data.data); }).catch(() => { });
        api.get("/admin/listings", { params: { limit: 10 } }).then(({ data }) => { if (data.success) setListings(data.data); }).catch(() => { });
    }, [user]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Admin Panel</h1>
                    <p className="text-sm text-gray-400 mt-1">ShareCare Management Dashboard</p>
                </div>
                <button onClick={() => router.push("/feed")} className="btn-secondary text-sm">← Back to App</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
                {["dashboard", "users", "listings", "categories"].map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t as any)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${tab === t ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-gray-400 hover:text-white"
                            }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Dashboard */}
            {tab === "dashboard" && stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Total Users", value: stats.totalUsers, color: "text-indigo-400", icon: "👥" },
                        { label: "Total Listings", value: stats.totalListings, color: "text-purple-400", icon: "📦" },
                        { label: "Active Listings", value: stats.activeListings, color: "text-emerald-400", icon: "✅" },
                        { label: "Completed", value: stats.completedTransactions, color: "text-amber-400", icon: "🎉" },
                    ].map((stat) => (
                        <div key={stat.label} className="glass-card p-5 text-center">
                            <span className="text-2xl mb-2 block">{stat.icon}</span>
                            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Users Tab */}
            {tab === "users" && (
                <div className="glass-card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-800">
                                <th className="text-left p-4 text-gray-400 font-medium">Name</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Phone</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Listings</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Requests</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id} className="border-b border-gray-800/50 hover:bg-white/5">
                                    <td className="p-4 text-white">{u.name || "—"}</td>
                                    <td className="p-4 text-gray-400">{u.phone}</td>
                                    <td className="p-4 text-gray-400">{u._count?.listings || 0}</td>
                                    <td className="p-4 text-gray-400">{u._count?.requestsAsReceiver || 0}</td>
                                    <td className="p-4">
                                        <button
                                            onClick={async () => {
                                                await api.put(`/admin/users/${u.id}/deactivate`);
                                                setUsers(users.map((x) => x.id === u.id ? { ...x, isActive: false } : x));
                                            }}
                                            className="text-xs text-red-400 hover:underline"
                                            disabled={!u.isActive}
                                        >
                                            {u.isActive ? "Deactivate" : "Deactivated"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Listings Tab */}
            {tab === "listings" && (
                <div className="glass-card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-800">
                                <th className="text-left p-4 text-gray-400 font-medium">Title</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Donor</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Category</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listings.map((l) => (
                                <tr key={l.id} className="border-b border-gray-800/50 hover:bg-white/5">
                                    <td className="p-4 text-white">{l.title}</td>
                                    <td className="p-4 text-gray-400">{l.donor?.name || l.donor?.phone || "—"}</td>
                                    <td className="p-4 text-gray-400">{l.category?.name || "—"}</td>
                                    <td className="p-4"><span className={`badge ${l.status === "active" ? "badge-accepted" : l.status === "completed" ? "badge-completed" : "badge-pending"}`}>{l.status}</span></td>
                                    <td className="p-4">
                                        {l.status === "active" && (
                                            <button
                                                onClick={async () => {
                                                    await api.put(`/admin/listings/${l.id}/expire`);
                                                    setListings(listings.map((x) => x.id === l.id ? { ...x, status: "expired" } : x));
                                                }}
                                                className="text-xs text-red-400 hover:underline"
                                            >
                                                Force Expire
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Categories Tab */}
            {tab === "categories" && (
                <div className="glass-card p-4">
                    <p className="text-sm text-gray-400 text-center py-4">Category management — use seed data or API to manage categories</p>
                </div>
            )}
        </div>
    );
}
