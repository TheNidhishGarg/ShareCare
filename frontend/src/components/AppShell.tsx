"use client";

import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col max-w-lg mx-auto relative">
            <Header />
            <main className="flex-1 pb-20 overflow-y-auto">{children}</main>
            <BottomNav />
        </div>
    );
}
