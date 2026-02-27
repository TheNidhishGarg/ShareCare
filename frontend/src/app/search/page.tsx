"use client";

import { AppShell } from "@/components/AppShell";

export default function SearchPage() {
    return (
        <AppShell>
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-6 gradient-text">Search</h1>
                <div className="relative mb-6">
                    <input
                        type="text"
                        placeholder="Search items, categories..."
                        className="input pl-12 text-lg"
                        id="search-input"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-500">🔍</span>
                </div>
                <div className="text-center py-12">
                    <span className="text-5xl mb-4 block">🔎</span>
                    <p className="text-gray-400 text-sm">Search for items by name or category</p>
                </div>
            </div>
        </AppShell>
    );
}
