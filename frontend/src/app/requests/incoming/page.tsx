"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { formatTimeAgo } from "@/lib/utils";
import api from "@/lib/api";

export default function IncomingRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [otpInput, setOtpInput] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = () => {
        api.get("/requests/incoming").then(({ data }) => {
            if (data.success) setRequests(data.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    const handleAccept = async (id: string) => {
        setActionLoading(id);
        try {
            await api.put(`/requests/${id}/accept`);
            fetchRequests();
        } catch (err) {
            console.error("Failed to accept:", err);
        }
        setActionLoading(null);
    };

    const handleReject = async (id: string) => {
        setActionLoading(id);
        try {
            await api.put(`/requests/${id}/reject`);
            fetchRequests();
        } catch (err) {
            console.error("Failed to reject:", err);
        }
        setActionLoading(null);
    };

    const handleVerifyOtp = async (id: string) => {
        const otp = otpInput[id];
        if (!otp || otp.length !== 6) return;
        setActionLoading(id);
        try {
            await api.post(`/requests/${id}/verify-otp`, { otp });
            fetchRequests();
        } catch (err: any) {
            alert(err.response?.data?.error || "Invalid OTP");
        }
        setActionLoading(null);
    };

    return (
        <AppShell>
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-6 gradient-text">Incoming Requests</h1>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => <div key={i} className="glass-card p-4 h-28 shimmer" />)}
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-16">
                        <span className="text-5xl mb-4 block">📨</span>
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">No incoming requests</h3>
                        <p className="text-sm text-gray-500">When someone requests your items, they&apos;ll appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {requests.map((req) => (
                            <div key={req.id} className="glass-card p-4 fade-in">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                        {req.receiver?.name?.[0]?.toUpperCase() || "?"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white text-sm">
                                            {req.receiver?.name || "Someone"}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Wants &ldquo;{req.listing?.title}&rdquo; · {req.deliveryMode === "self_pickup" ? "🚶 Pickup" : "🚚 Doorstep"}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">{formatTimeAgo(req.createdAt)}</p>
                                    </div>
                                    <StatusBadge status={req.status} />
                                </div>

                                {/* Actions for pending */}
                                {req.status === "pending" && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAccept(req.id)}
                                            disabled={actionLoading === req.id}
                                            className="btn-primary flex-1 text-sm py-2.5 text-center"
                                        >
                                            {actionLoading === req.id ? "..." : "Accept"}
                                        </button>
                                        <button
                                            onClick={() => handleReject(req.id)}
                                            disabled={actionLoading === req.id}
                                            className="btn-danger flex-1 text-sm py-2.5 text-center"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}

                                {/* OTP verification for accepted self-pickup */}
                                {(req.status === "accepted" || req.status === "otp_sent") && req.deliveryMode === "self_pickup" && (
                                    <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                        <p className="text-xs text-amber-300 mb-2">Enter the OTP from the receiver to confirm pickup:</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={otpInput[req.id] || ""}
                                                onChange={(e) => setOtpInput({ ...otpInput, [req.id]: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                                                placeholder="Enter 6-digit OTP"
                                                className="input flex-1 text-center font-mono"
                                                maxLength={6}
                                            />
                                            <button
                                                onClick={() => handleVerifyOtp(req.id)}
                                                disabled={actionLoading === req.id || (otpInput[req.id]?.length || 0) < 6}
                                                className="btn-primary text-sm px-4"
                                            >
                                                Verify
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Completed */}
                                {req.status === "completed" && (
                                    <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                                        <p className="text-xs text-emerald-400">✅ Transaction completed</p>
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
