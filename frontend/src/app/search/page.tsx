"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { ListingCard } from "@/components/ListingCard";
import api from "@/lib/api";

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    // Get user location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => setUserLocation({ lat: 28.6139, lng: 77.209 }) // Default: Delhi
            );
        } else {
            setUserLocation({ lat: 28.6139, lng: 77.209 });
        }
    }, []);

    const fetchSearchResults = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim() || !userLocation) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const params: any = {
                lat: userLocation.lat,
                lng: userLocation.lng,
                radius: 2000,
                limit: 20,
                q: searchQuery.trim()
            };
            const { data } = await api.get("/listings", { params });
            if (data.success) {
                setResults(data.data);
            }
        } catch (err) {
            console.error("Search failed:", err);
        }
        setLoading(false);
    }, [userLocation]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchSearchResults(query);
        }, 500); // 500ms debounce
        return () => clearTimeout(timeoutId);
    }, [query, fetchSearchResults]);

    return (
        <AppShell>
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-6 gradient-text">Search</h1>
                <div className="relative mb-6">
                    <input
                        type="text"
                        placeholder="Search items..."
                        className="input pl-12 text-lg"
                        id="search-input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-500">🔍</span>
                </div>

                {query.trim() === "" ? (
                    <div className="text-center py-12">
                        <span className="text-5xl mb-4 block">🔎</span>
                        <p className="text-gray-400 text-sm">Search for items by name or description</p>
                    </div>
                ) : loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="glass-card overflow-hidden">
                                <div className="aspect-[4/3] shimmer" />
                                <div className="p-4 space-y-3">
                                    <div className="h-5 w-3/4 shimmer rounded" />
                                    <div className="h-4 w-1/2 shimmer rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : results.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="text-5xl mb-4 block">😔</span>
                        <p className="text-gray-400 text-sm">No items found matching "{query}"</p>
                    </div>
                ) : (
                    <div className="space-y-4 pb-4">
                        {results.map((listing) => (
                            <ListingCard key={listing.id} listing={listing} />
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}
