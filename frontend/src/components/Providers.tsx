"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function Providers({ children }: { children: React.ReactNode }) {
    const fetchProfile = useAuthStore((s) => s.fetchProfile);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return <>{children}</>;
}
