"use client";

import Link from "next/link";
import { ModeToggle } from "./ModeToggle";
import { useNotificationStore } from "@/store/notificationStore";

export function Header() {
    const unreadCount = useNotificationStore((s) => s.unreadCount);

    return (
        <header className="sticky top-0 z-50 glass border-b border-[var(--glass-border)]">
            <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
                <Link href="/feed" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/30">
                        S
                    </div>
                    <span className="font-bold text-lg gradient-text">ShareCare</span>
                </Link>

                <ModeToggle />

                <div className="flex items-center gap-3">
                    <Link href="/notifications" className="relative p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <span className="text-xl">🔔</span>
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white animate-pulse">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </Link>
                    <Link href="/profile" className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <span className="text-xl">👤</span>
                    </Link>
                </div>
            </div>
        </header>
    );
}
