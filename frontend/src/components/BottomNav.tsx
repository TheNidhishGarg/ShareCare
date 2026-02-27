"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const receiverTabs = [
    { href: "/feed", label: "Feed", icon: "🏠" },
    { href: "/search", label: "Search", icon: "🔍" },
    { href: "/requests", label: "Requests", icon: "📋" },
    { href: "/notifications", label: "Alerts", icon: "🔔" },
    { href: "/profile", label: "Me", icon: "👤" },
];

const donorTabs = [
    { href: "/donor", label: "Home", icon: "🏠" },
    { href: "/listings/new", label: "Add", icon: "➕" },
    { href: "/listings/mine", label: "My Items", icon: "📦" },
    { href: "/requests/incoming", label: "Requests", icon: "📋" },
    { href: "/profile", label: "Me", icon: "👤" },
];

export function BottomNav() {
    const pathname = usePathname();
    const mode = useAuthStore((s) => s.mode);
    const tabs = mode === "donor" ? donorTabs : receiverTabs;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-[var(--glass-border)]">
            <div className="max-w-lg mx-auto flex items-center justify-around py-2">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href || pathname?.startsWith(tab.href + "/");
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-200 ${isActive
                                    ? "text-indigo-400 scale-105"
                                    : "text-gray-500 hover:text-gray-300"
                                }`}
                        >
                            <span className="text-xl">{tab.icon}</span>
                            <span className="text-[10px] font-medium">{tab.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
