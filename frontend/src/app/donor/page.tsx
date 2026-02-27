"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SuggestionBanner } from "@/components/SuggestionBanner";
import { StatusBadge } from "@/components/StatusBadge";
import { formatTimeAgo } from "@/lib/utils";
import api from "@/lib/api";
import Link from "next/link";

export default function DonorHomePage() {
    const [listings, setListings] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get("/listings/mine").then(({ data }) => data.success ? setListings(data.data) : null),
            api.get("/requests/incoming").then(({ data }) => data.success ? setRequests(data.data) : null),
        ]).catch(() => { }).finally(() => setLoading(false));

        // Fetch AI suggestions
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                api.get("/ai/suggestions", { params: { lat: pos.coords.latitude, lng: pos.coords.longitude } })
                    .then(({ data }) => { if (data.success) setSuggestions(data.data); })
                    .catch(() => { });
            });
        }
    }, []);

    const activeListings = listings.filter((l) => l.status === "active");
    const pendingRequests = requests.filter((r) => r.status === "pending");

    return (
        <AppShell>
            <div className="p-4 space-y-6">
                <h1 className="text-2xl font-bold gradient-text">Donor Dashboard</h1>

                {/* AI Demand Insight */}
                {suggestions.length > 0 && <SuggestionBanner suggestions={suggestions} />}

                {/* Active Listings */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-white">
                            Active Listings <span className="text-indigo-400">({activeListings.length})</span>
                        </h2>
                        <Link href="/listings/new" className="text-sm text-indigo-400 hover:underline">+ Add New</Link>
                    </div>
                    {activeListings.length === 0 ? (
                        <div className="glass-card p-6 text-center">
                            <p className="text-gray-400 text-sm">No active listings</p>
                            <Link href="/listings/new" className="btn-primary mt-3 inline-block text-sm">Create Your First Listing</Link>
                        </div>
                    ) : (
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {activeListings.slice(0, 5).map((listing) => (
                                <Link key={listing.id} href={`/listings/${listing.id}`} className="flex-shrink-0 w-36">
                                    <div className="glass-card overflow-hidden hover:border-indigo-500/30 transition-all">
                                        <div className="aspect-square bg-gray-800">
                                            <img
                                                src={listing.imageUrls?.[0] || `https://placehold.co/160x160/1f2937/6366f1?text=${listing.category?.name?.[0] || "?"}`}
                                                alt={listing.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="p-2">
                                            <p className="text-xs font-medium text-white truncate">{listing.title}</p>
                                            <p className="text-[10px] text-gray-500">👁️ {listing.viewCount}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Incoming Requests */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-white">
                            Incoming Requests <span className="text-amber-400">({pendingRequests.length})</span>
                        </h2>
                        <Link href="/requests/incoming" className="text-sm text-indigo-400 hover:underline">View All</Link>
                    </div>
                    {pendingRequests.length === 0 ? (
                        <div className="glass-card p-6 text-center">
                            <p className="text-gray-400 text-sm">No pending requests</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {pendingRequests.slice(0, 5).map((req) => (
                                <Link key={req.id} href="/requests/incoming" className="block">
                                    <div className="glass-card p-4 hover:border-indigo-500/30 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-sm font-bold text-white">
                                                {req.receiver?.name?.[0]?.toUpperCase() || "?"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {req.receiver?.name || "Someone"} wants &ldquo;{req.listing?.title}&rdquo;
                                                </p>
                                                <p className="text-xs text-gray-400">{req.deliveryMode.replace("_", " ")} · {formatTimeAgo(req.createdAt)}</p>
                                            </div>
                                            <StatusBadge status={req.status} />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="glass-card p-4 text-center">
                        <p className="text-2xl font-bold text-indigo-400">{listings.length}</p>
                        <p className="text-[10px] text-gray-500 mt-1">Total Listings</p>
                    </div>
                    <div className="glass-card p-4 text-center">
                        <p className="text-2xl font-bold text-emerald-400">
                            {listings.filter((l) => l.status === "completed").length}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">Donated</p>
                    </div>
                    <div className="glass-card p-4 text-center">
                        <p className="text-2xl font-bold text-amber-400">{pendingRequests.length}</p>
                        <p className="text-[10px] text-gray-500 mt-1">Pending</p>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
