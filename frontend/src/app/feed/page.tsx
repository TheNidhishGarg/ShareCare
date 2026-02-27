"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { AppShell } from "@/components/AppShell";
import { ListingCard } from "@/components/ListingCard";
import { CategoryChips } from "@/components/CategoryChips";
import { SuggestionBanner } from "@/components/SuggestionBanner";
import api from "@/lib/api";

export default function FeedPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuthStore();
    const [listings, setListings] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
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

    // Auth guard
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, authLoading, router]);

    // Fetch categories
    useEffect(() => {
        api.get("/categories").then(({ data }) => {
            if (data.success) setCategories(data.data);
        }).catch(() => { });
    }, []);

    // Fetch listings
    const fetchListings = useCallback(async () => {
        if (!userLocation) return;
        setLoading(true);
        try {
            const params: any = { lat: userLocation.lat, lng: userLocation.lng, radius: 2000, limit: 20 };
            if (selectedCategory) params.category = selectedCategory;
            const { data } = await api.get("/listings", { params });
            if (data.success) setListings(data.data);
        } catch (err) {
            console.error("Failed to fetch listings:", err);
        }
        setLoading(false);
    }, [userLocation, selectedCategory]);

    useEffect(() => { fetchListings(); }, [fetchListings]);

    // Fetch AI suggestions
    useEffect(() => {
        if (!userLocation) return;
        api.get("/ai/suggestions", { params: { lat: userLocation.lat, lng: userLocation.lng } })
            .then(({ data }) => { if (data.success) setSuggestions(data.data); })
            .catch(() => { });
    }, [userLocation]);

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <AppShell>
            {/* AI Suggestions */}
            {suggestions.length > 0 && <SuggestionBanner suggestions={suggestions} />}

            {/* Category Chips */}
            <div className="py-3">
                <CategoryChips categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
            </div>

            {/* Listings */}
            <div className="px-4 space-y-4 pb-4">
                {loading ? (
                    // Shimmer loading cards
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="glass-card overflow-hidden">
                            <div className="aspect-[4/3] shimmer" />
                            <div className="p-4 space-y-3">
                                <div className="h-5 w-3/4 shimmer rounded" />
                                <div className="h-4 w-1/2 shimmer rounded" />
                            </div>
                        </div>
                    ))
                ) : listings.length === 0 ? (
                    <div className="text-center py-16">
                        <span className="text-5xl mb-4 block">📭</span>
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">No items nearby</h3>
                        <p className="text-sm text-gray-500">
                            {selectedCategory
                                ? "No items in this category within 2km. Try another category."
                                : "No active donations within 2km of your location."}
                        </p>
                    </div>
                ) : (
                    listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)
                )}
            </div>
        </AppShell>
    );
}
