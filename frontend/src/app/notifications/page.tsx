"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { formatTimeAgo } from "@/lib/utils";
import api from "@/lib/api";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/notifications").then(({ data }) => {
            if (data.success) setNotifications(data.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const markAllRead = async () => {
        await api.put("/notifications/read-all").catch(() => { });
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    };

    return (
        <AppShell>
            <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold gradient-text">Notifications</h1>
                    {notifications.some((n) => !n.isRead) && (
                        <button onClick={markAllRead} className="text-sm text-indigo-400 hover:underline">Mark all read</button>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="glass-card p-4 h-16 shimmer" />)}</div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-16">
                        <span className="text-5xl mb-4 block">🔕</span>
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">No notifications</h3>
                        <p className="text-sm text-gray-500">You&apos;re all caught up!</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notifications.map((n) => (
                            <div key={n.id} className={`glass-card p-4 transition-all ${!n.isRead ? "border-indigo-500/30 bg-indigo-500/5" : ""}`}>
                                <div className="flex items-start gap-3">
                                    <span className="text-xl mt-0.5">
                                        {n.type?.includes("request") ? "📋" : n.type?.includes("delivery") ? "🚚" : "🔔"}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white">{n.title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{n.body}</p>
                                        <p className="text-[10px] text-gray-500 mt-1">{formatTimeAgo(n.createdAt)}</p>
                                    </div>
                                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}
