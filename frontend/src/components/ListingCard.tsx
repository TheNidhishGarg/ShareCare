"use client";

import { formatDistance, formatTimeAgo, getConditionLabel } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import Link from "next/link";

interface ListingCardProps {
    listing: {
        id: string;
        title: string;
        imageUrls: string[];
        status: string;
        isSponsored: boolean;
        distanceMeters: number;
        condition: string;
        createdAt: string;
        donor: { name: string; profilePhoto: string | null };
        category: { name: string; iconUrl: string; slug: string } | null;
    };
}

export function ListingCard({ listing }: ListingCardProps) {
    const placeholderImg = `https://placehold.co/600x450/1f2937/6366f1?text=${encodeURIComponent(listing.category?.name || "Item")}`;

    return (
        <Link href={`/listings/${listing.id}`} className="block slide-up">
            <div className="glass-card overflow-hidden group hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                        src={listing.imageUrls[0] || placeholderImg}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Badges overlay */}
                    <div className="absolute top-3 left-3 flex gap-2">
                        {listing.isSponsored && <span className="badge badge-sponsored">✨ Sponsored</span>}
                        {listing.status === "reserved" && <span className="badge badge-reserved">Reserved</span>}
                    </div>
                    <div className="absolute top-3 right-3">
                        <span className="badge bg-black/50 text-white backdrop-blur-sm">
                            {formatDistance(listing.distanceMeters)}
                        </span>
                    </div>
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {/* Bottom info on image */}
                    <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                            <span>{listing.category?.iconUrl}</span>
                            <span>{listing.category?.name}</span>
                            <span className="text-gray-500">·</span>
                            <span>{getConditionLabel(listing.condition)}</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    <h3 className="font-semibold text-white text-lg leading-tight mb-2 group-hover:text-indigo-300 transition-colors">
                        {listing.title}
                    </h3>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-[10px] font-bold text-white">
                                {listing.donor.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <span className="text-sm text-gray-400">{listing.donor.name || "Anonymous"}</span>
                        </div>
                        <span className="text-xs text-gray-500">{formatTimeAgo(listing.createdAt)}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
