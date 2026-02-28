"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { formatTimeAgo } from "@/lib/utils";
import api from "@/lib/api";
import Link from "next/link";

export default function MyListingsPage() {
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/listings/mine").then(({ data }) => {
            if (data.success) setListings(data.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleDeleteListing = async (e: React.MouseEvent, id: string) => {
        e.preventDefault(); // Prevent navigating to the link
        if (!confirm("Are you sure you want to delete this listing?")) return;
        try {
            const { data } = await api.delete(`/listings/${id}`);
            if (data.success) {
                setListings(listings.filter(l => l.id !== id));
            }
        } catch (err) {
            console.error("Failed to delete listing", err);
            alert("Failed to delete listing.");
        }
    };

    return (
        <AppShell>
            <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold gradient-text">My Listings</h1>
                    <Link href="/listings/new" className="btn-primary text-sm">+ New</Link>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="glass-card p-4 flex gap-3">
                                <div className="w-20 h-20 rounded-xl shimmer" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 shimmer rounded" />
                                    <div className="h-3 w-1/2 shimmer rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : listings.length === 0 ? (
                    <div className="text-center py-16">
                        <span className="text-5xl mb-4 block">📦</span>
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">No listings yet</h3>
                        <p className="text-sm text-gray-500 mb-4">Start donating by creating your first listing</p>
                        <Link href="/listings/new" className="btn-primary">Create Listing</Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {listings.map((listing) => (
                            <Link key={listing.id} href={`/listings/${listing.id}`} className="block group relative">
                                <div className="glass-card p-4 flex gap-3 hover:border-indigo-500/30 transition-all">
                                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                                        <img
                                            src={listing.imageUrls?.[0] || `https://placehold.co/160x160/1f2937/6366f1?text=${listing.category?.name?.[0] || "?"}`}
                                            alt={listing.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0 pr-8">
                                        <h3 className="font-semibold text-white truncate">{listing.title}</h3>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {listing.category?.name} · {formatTimeAgo(listing.createdAt)}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <StatusBadge status={listing.status} />
                                            <span className="text-xs text-gray-500">👁️ {listing.viewCount}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => handleDeleteListing(e, listing.id)}
                                    className="absolute top-4 right-4 p-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm opacity-0 shadow-lg group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 z-10 focus:opacity-100"
                                    title="Delete Listing"
                                >
                                    🗑️
                                </button>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}
