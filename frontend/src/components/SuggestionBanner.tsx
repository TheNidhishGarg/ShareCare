"use client";

import { useState } from "react";

interface SuggestionBannerProps {
    suggestions: {
        id: string;
        message: string;
        category: { name: string; slug: string; iconUrl: string };
    }[];
}

export function SuggestionBanner({ suggestions }: SuggestionBannerProps) {
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    const visible = suggestions.filter((s) => !dismissed.has(s.id));
    if (visible.length === 0) return null;

    const suggestion = visible[0];

    return (
        <div className="mx-4 mb-4 fade-in">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-amber-600/20 border border-indigo-500/20 p-4">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-amber-500/5" />
                <div className="relative flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{suggestion.category.iconUrl || "💡"}</span>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-indigo-200">{suggestion.category.name} · AI Insight</p>
                        <p className="text-sm text-gray-300 mt-1">{suggestion.message}</p>
                    </div>
                    <button
                        onClick={() => setDismissed((prev) => new Set(prev).add(suggestion.id))}
                        className="text-gray-500 hover:text-white transition-colors text-lg"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
}
