"use client";

import { useState } from "react";

interface CategoryChipsProps {
    categories: { id: string; name: string; slug: string; iconUrl: string }[];
    selected: string | null;
    onSelect: (slug: string | null) => void;
}

export function CategoryChips({ categories, selected, onSelect }: CategoryChipsProps) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-2 px-4 scrollbar-hide">
            <button
                onClick={() => onSelect(null)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${!selected
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/25"
                        : "bg-[var(--color-surface-light)] text-gray-400 border border-[var(--color-border)] hover:border-indigo-500/50 hover:text-white"
                    }`}
            >
                All
            </button>
            {categories.map((cat) => (
                <button
                    key={cat.id}
                    onClick={() => onSelect(cat.slug === selected ? null : cat.slug)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${selected === cat.slug
                            ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/25"
                            : "bg-[var(--color-surface-light)] text-gray-400 border border-[var(--color-border)] hover:border-indigo-500/50 hover:text-white"
                        }`}
                >
                    <span>{cat.iconUrl}</span>
                    <span>{cat.name}</span>
                </button>
            ))}
        </div>
    );
}
