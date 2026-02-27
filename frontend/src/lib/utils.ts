export function formatDistance(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)}m away`;
    return `${(meters / 1000).toFixed(1)}km away`;
}

export function formatTimeAgo(date: string | Date): string {
    const now = new Date();
    const d = new Date(date);
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
}

export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        pending: 'badge-pending',
        accepted: 'badge-accepted',
        otp_sent: 'badge-otp',
        completed: 'badge-completed',
        cancelled: 'badge-cancelled',
        rejected: 'badge-rejected',
        active: 'badge-accepted',
        reserved: 'badge-reserved',
        expired: 'badge-cancelled',
    };
    return colors[status] || 'badge-pending';
}

export function getConditionLabel(condition: string): string {
    const labels: Record<string, string> = {
        new_item: 'New',
        like_new: 'Like New',
        good: 'Good',
        fair: 'Fair',
    };
    return labels[condition] || condition;
}

export function formatCurrency(amount: number, currency = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
    }).format(amount);
}

export function truncate(str: string, len: number): string {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
}
