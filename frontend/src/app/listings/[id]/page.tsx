"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDistance, formatTimeAgo, getConditionLabel, formatCurrency } from "@/lib/utils";
import api from "@/lib/api";

export default function ListingDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [listing, setListing] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [deliveryMode, setDeliveryMode] = useState<"self_pickup" | "doorstep">("self_pickup");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [currentImage, setCurrentImage] = useState(0);

    useEffect(() => {
        if (!id) return;
        api.get(`/listings/${id}`).then(({ data }) => {
            if (data.success) setListing(data.data);
            setLoading(false);
        }).catch(() => setLoading(false));

        // Increment view count
        api.post(`/listings/${id}/view`).catch(() => { });
    }, [id]);

    const handleRequest = async () => {
        setRequesting(true);
        setError("");
        try {
            const { data } = await api.post("/requests", {
                listingId: id,
                deliveryMode,
            });
            if (data.success) {
                setSuccess("Request sent! The donor will review your request.");
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to send request");
        }
        setRequesting(false);
    };

    if (loading) {
        return (
            <AppShell>
                <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                </div>
            </AppShell>
        );
    }

    if (!listing) {
        return (
            <AppShell>
                <div className="text-center py-20">
                    <span className="text-5xl mb-4 block">🔍</span>
                    <h3 className="text-lg font-semibold text-gray-300">Listing not found</h3>
                </div>
            </AppShell>
        );
    }

    const images = listing.imageUrls?.length > 0
        ? listing.imageUrls
        : [`https://placehold.co/600x450/1f2937/6366f1?text=${encodeURIComponent(listing.category?.name || "Item")}`];

    return (
        <AppShell>
            <div className="slide-up">
                {/* Image Gallery */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-900">
                    <img src={images[currentImage]} alt={listing.title} className="w-full h-full object-cover" />
                    {images.length > 1 && (
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                            {images.map((_: string, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentImage(i)}
                                    className={`w-2 h-2 rounded-full transition-all ${i === currentImage ? "bg-white w-6" : "bg-white/40"}`}
                                />
                            ))}
                        </div>
                    )}
                    <button onClick={() => router.back()} className="absolute top-4 left-4 w-10 h-10 rounded-full glass flex items-center justify-center">
                        ←
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-5">
                    {/* Category & Condition */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {listing.category && (
                            <span className="badge bg-indigo-500/15 text-indigo-400">
                                {listing.category.iconUrl} {listing.category.name}
                            </span>
                        )}
                        <span className="badge bg-emerald-500/15 text-emerald-400">
                            {getConditionLabel(listing.condition)}
                        </span>
                        <StatusBadge status={listing.status} />
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-white">{listing.title}</h1>

                    {/* Description */}
                    {listing.description && (
                        <p className="text-gray-400 text-sm leading-relaxed">{listing.description}</p>
                    )}

                    {/* Donor */}
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-lg font-bold text-white">
                                {listing.donor.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div>
                                <p className="font-semibold text-white">{listing.donor.name || "Anonymous"}</p>
                                <p className="text-sm text-gray-400">{listing.addressDisplay || "Nearby"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                            <span>👁️ {listing.viewCount} views</span>
                            <span>🕐 {formatTimeAgo(listing.createdAt)}</span>
                        </div>
                    </div>

                    {/* Pickup Options */}
                    {listing.status === "active" && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Pickup Options</h3>

                            {(listing.pickupMode === "self_pickup" || listing.pickupMode === "both") && (
                                <label className={`glass-card p-4 flex items-center gap-3 cursor-pointer transition-all ${deliveryMode === "self_pickup" ? "border-indigo-500/50 bg-indigo-500/5" : ""}`}>
                                    <input
                                        type="radio"
                                        name="deliveryMode"
                                        value="self_pickup"
                                        checked={deliveryMode === "self_pickup"}
                                        onChange={() => setDeliveryMode("self_pickup")}
                                        className="w-4 h-4 accent-indigo-500"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-white">Self Pickup</p>
                                        <p className="text-xs text-gray-400">Pick up from donor&apos;s location</p>
                                    </div>
                                    <span className="text-emerald-400 font-semibold text-sm">Free</span>
                                </label>
                            )}

                            {(listing.pickupMode === "doorstep" || listing.pickupMode === "both") && (
                                <label className={`glass-card p-4 flex items-center gap-3 cursor-pointer transition-all ${deliveryMode === "doorstep" ? "border-indigo-500/50 bg-indigo-500/5" : ""}`}>
                                    <input
                                        type="radio"
                                        name="deliveryMode"
                                        value="doorstep"
                                        checked={deliveryMode === "doorstep"}
                                        onChange={() => setDeliveryMode("doorstep")}
                                        className="w-4 h-4 accent-indigo-500"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-white">Doorstep Delivery</p>
                                        <p className="text-xs text-gray-400">Delivered to your address</p>
                                    </div>
                                    <span className="text-amber-400 font-semibold text-sm">{formatCurrency(100)}</span>
                                </label>
                            )}
                        </div>
                    )}

                    {/* Error/Success */}
                    {error && (
                        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div>
                    )}
                    {success && (
                        <div className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">{success}</div>
                    )}

                    {/* Request Button */}
                    {listing.status === "active" && !success && (
                        <button
                            onClick={handleRequest}
                            disabled={requesting}
                            className="btn-primary w-full text-center text-lg py-4"
                            id="request-item-btn"
                        >
                            {requesting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Sending Request...
                                </span>
                            ) : (
                                "Request This Item"
                            )}
                        </button>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
