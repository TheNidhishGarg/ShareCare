"use client";

import { getStatusColor } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
    const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return <span className={`badge ${getStatusColor(status)}`}>{label}</span>;
}
