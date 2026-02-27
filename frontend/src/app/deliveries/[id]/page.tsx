"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import api from "@/lib/api";

const steps = [
    { key: "requested", label: "Requested", icon: "📋" },
    { key: "accepted", label: "Accepted", icon: "✅" },
    { key: "awaiting_pickup", label: "Pickup Scheduled", icon: "📦" },
    { key: "picked_up", label: "Picked Up", icon: "🚚" },
    { key: "in_transit", label: "In Transit", icon: "🛣️" },
    { key: "delivered", label: "Delivered", icon: "🎉" },
];

function getStepIndex(status: string) {
    const map: Record<string, number> = {
        pending: 0, accepted: 1, awaiting_pickup: 2, picked_up: 3, in_transit: 4, delivered: 5,
    };
    return map[status] ?? 0;
}

export default function DeliveryStatusPage() {
    const { id } = useParams();
    const [delivery, setDelivery] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        api.get(`/deliveries/${id}`).then(({ data }) => {
            if (data.success) setDelivery(data.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <AppShell>
                <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                </div>
            </AppShell>
        );
    }

    const currentStep = delivery ? getStepIndex(delivery.status) : 0;

    return (
        <AppShell>
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-6 gradient-text">Delivery Status</h1>

                {!delivery ? (
                    <div className="text-center py-16">
                        <span className="text-5xl mb-4 block">🔍</span>
                        <h3 className="text-lg font-semibold text-gray-300">Delivery not found</h3>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Progress Steps */}
                        <div className="glass-card p-6">
                            <div className="space-y-4">
                                {steps.map((step, i) => {
                                    const isComplete = i <= currentStep;
                                    const isCurrent = i === currentStep;
                                    return (
                                        <div key={step.key} className="flex items-start gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 ${isComplete
                                                        ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30"
                                                        : "bg-gray-800 border border-gray-700"
                                                    } ${isCurrent ? "ring-2 ring-emerald-400/50 ring-offset-2 ring-offset-gray-900 pulse-glow" : ""}`}>
                                                    {isComplete ? step.icon : "⏳"}
                                                </div>
                                                {i < steps.length - 1 && (
                                                    <div className={`w-0.5 h-8 mt-1 ${isComplete ? "bg-emerald-500/50" : "bg-gray-700"}`} />
                                                )}
                                            </div>
                                            <div className="pt-2">
                                                <p className={`text-sm font-medium ${isComplete ? "text-white" : "text-gray-500"}`}>
                                                    {step.label}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Delivery Details */}
                        <div className="glass-card p-4 space-y-3">
                            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Delivery Info</h3>
                            {delivery.logisticsPartner && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Logistics Partner</span>
                                    <span className="text-white">{delivery.logisticsPartner}</span>
                                </div>
                            )}
                            {delivery.logisticsOrderId && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">AWB Number</span>
                                    <span className="text-white font-mono">{delivery.logisticsOrderId}</span>
                                </div>
                            )}
                            {delivery.deliveryChargeUser && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Delivery Charge</span>
                                    <span className="text-amber-400 font-semibold">₹{delivery.deliveryChargeUser}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
