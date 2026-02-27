"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function CreateListingPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuthStore();
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [form, setForm] = useState({
        title: "",
        description: "",
        categoryId: "",
        condition: "good",
        pickupMode: "both",
        imageUrls: [] as string[],
        latitude: 28.6139,
        longitude: 77.209,
        addressDisplay: "",
    });

    useEffect(() => {
        if (!authLoading && !isAuthenticated) router.push("/login");
    }, [isAuthenticated, authLoading, router]);

    useEffect(() => {
        api.get("/categories").then(({ data }) => {
            if (data.success) setCategories(data.data);
        }).catch(() => { });

        // Get location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setForm((f) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
            });
        }
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const remaining = 5 - form.imageUrls.length;
        if (remaining <= 0) {
            setError("Maximum 5 images allowed");
            return;
        }

        const filesToUpload = Array.from(files).slice(0, remaining);
        setUploading(true);
        setError("");

        try {
            const uploadedUrls: string[] = [];
            for (const file of filesToUpload) {
                const formData = new FormData();
                formData.append("file", file);
                const { data } = await api.post("/media/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                if (data.success) {
                    uploadedUrls.push(data.data.url);
                }
            }
            setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, ...uploadedUrls] }));
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to upload image");
        }
        setUploading(false);
        // Reset input so the same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeImage = (index: number) => {
        setForm((f) => ({ ...f, imageUrls: f.imageUrls.filter((_, i) => i !== index) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.categoryId) {
            setError("Title and category are required");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const { data } = await api.post("/listings", form);
            if (data.success) {
                router.push("/listings/mine");
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to create listing");
        }
        setLoading(false);
    };

    return (
        <AppShell>
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-6 gradient-text">New Donation</h1>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Image Upload */}
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                        {form.imageUrls.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                                {form.imageUrls.map((url, i) => (
                                    <div key={i} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-[var(--color-border)]">
                                        <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {form.imageUrls.length < 5 && (
                            <div
                                onClick={() => !uploading && fileInputRef.current?.click()}
                                className="glass-card p-6 text-center cursor-pointer hover:border-indigo-500/30 transition-colors"
                            >
                                {uploading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                        <p className="text-sm text-gray-400">Uploading...</p>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-4xl mb-2 block">📸</span>
                                        <p className="text-sm text-gray-400">Tap to upload photos ({form.imageUrls.length}/5)</p>
                                        <p className="text-xs text-gray-500 mt-1">JPEG, PNG, WEBP • Max 5MB each</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Category */}
                    <div>
                        <label className="text-sm text-gray-400 mb-1.5 block">Category *</label>
                        <div className="grid grid-cols-2 gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setForm({ ...form, categoryId: cat.id })}
                                    className={`p-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${form.categoryId === cat.id
                                        ? "bg-indigo-500/20 border border-indigo-500/50 text-indigo-300"
                                        : "glass-card text-gray-400 hover:text-white"
                                        }`}
                                >
                                    <span>{cat.iconUrl}</span>
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="text-sm text-gray-400 mb-1.5 block">Title *</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="What are you donating?"
                            className="input"
                            required
                            id="listing-title-input"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-sm text-gray-400 mb-1.5 block">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Describe the item, its condition, etc."
                            className="input min-h-[100px] resize-none"
                            rows={4}
                        />
                    </div>

                    {/* Condition */}
                    <div>
                        <label className="text-sm text-gray-400 mb-1.5 block">Condition</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { value: "new_item", label: "New" },
                                { value: "like_new", label: "Like New" },
                                { value: "good", label: "Good" },
                                { value: "fair", label: "Fair" },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, condition: opt.value })}
                                    className={`p-2.5 rounded-xl text-xs font-medium transition-all ${form.condition === opt.value
                                        ? "bg-indigo-500/20 border border-indigo-500/50 text-indigo-300"
                                        : "glass-card text-gray-400"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Pickup Mode */}
                    <div>
                        <label className="text-sm text-gray-400 mb-1.5 block">Pickup Options</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: "self_pickup", label: "Self Pickup" },
                                { value: "doorstep", label: "Doorstep" },
                                { value: "both", label: "Both" },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, pickupMode: opt.value })}
                                    className={`p-2.5 rounded-xl text-xs font-medium transition-all ${form.pickupMode === opt.value
                                        ? "bg-indigo-500/20 border border-indigo-500/50 text-indigo-300"
                                        : "glass-card text-gray-400"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="text-sm text-gray-400 mb-1.5 block">Location</label>
                        <div className="glass-card p-4">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <span>📍</span>
                                <span>Using current location</span>
                            </div>
                            <input
                                type="text"
                                value={form.addressDisplay}
                                onChange={(e) => setForm({ ...form, addressDisplay: e.target.value })}
                                placeholder="Area name (e.g., Connaught Place, Delhi)"
                                className="input mt-3"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full text-center text-lg py-4"
                        id="publish-listing-btn"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Publishing...
                            </span>
                        ) : (
                            "Publish Listing"
                        )}
                    </button>
                </form>
            </div>
        </AppShell>
    );
}
