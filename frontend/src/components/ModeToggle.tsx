"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function ModeToggle() {
    const router = useRouter();
    const { mode, setMode } = useAuthStore();

    const handleSwitch = (newMode: "receiver" | "donor") => {
        setMode(newMode);
        router.push(newMode === "donor" ? "/donor" : "/feed");
    };

    return (
        <div className="flex items-center bg-[var(--color-surface-light)] rounded-full p-1 border border-[var(--color-border)]">
            <button
                onClick={() => handleSwitch("receiver")}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${mode === "receiver"
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25"
                    : "text-gray-400 hover:text-white"
                    }`}
            >
                Receiver
            </button>
            <button
                onClick={() => handleSwitch("donor")}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${mode === "donor"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
                    : "text-gray-400 hover:text-white"
                    }`}
            >
                Donor
            </button>
        </div>
    );
}
