"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { formatTimeAgo } from "@/lib/utils";
import api from "@/lib/api";

export default function MyRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showOtpModal, setShowOtpModal] = useState<string | null>(null);

    useEffect(() => {
        api.get("/requests/mine").then(({ data }) => {
            if (data.success) setRequests(data.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    return (
        <AppShell>
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-6 gradient-text">My Requests</h1>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => <div key={i} className="glass-card p-4 h-24 shimmer" />)}
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-16">
                        <span className="text-5xl mb-4 block">📋</span>
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">No requests yet</h3>
                        <p className="text-sm text-gray-500">Browse the feed to request items from donors</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {requests.map((req) => (
                            <div key={req.id} className="glass-card p-4 fade-in">
                                <div className="flex gap-3">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                                        <img
                                            src={req.listing?.imageUrls?.[0] || `https://placehold.co/128x128/1f2937/6366f1?text=${req.listing?.category?.name?.[0] || "?"}`}
                                            alt={req.listing?.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-white truncate text-sm">{req.listing?.title}</h3>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {req.deliveryMode === "self_pickup" ? "🚶 Self Pickup" : "🚚 Doorstep"} · {formatTimeAgo(req.createdAt)}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <StatusBadge status={req.status} />
                                            {req.status === "accepted" && req.deliveryMode === "self_pickup" && (
                                                <button
                                                    onClick={() => setShowOtpModal(req.id)}
                                                    className="text-xs text-indigo-400 font-medium hover:underline"
                                                >
                                                    Show OTP
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* OTP Modal */}
                                {showOtpModal === req.id && (
                                    <div className="mt-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                        <p className="text-xs text-indigo-300 mb-2">Share this OTP with the donor at pickup:</p>
                                        <p className="text-3xl font-mono font-bold text-center text-white tracking-[0.3em]">
                                            ••••••
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2 text-center">OTP was sent to your phone via SMS</p>
                                        <button
                                            onClick={() => setShowOtpModal(null)}
                                            className="text-xs text-gray-500 hover:text-white mt-2 block mx-auto"
                                        >
                                            Close
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}
