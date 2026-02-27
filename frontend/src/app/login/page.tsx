"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((s) => s.login);
    const [step, setStep] = useState<"phone" | "otp">("phone");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [devOtp, setDevOtp] = useState("");

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
            await api.post("/auth/request-otp", { phone: formattedPhone });
            setPhone(formattedPhone);
            setStep("otp");
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to send OTP");
        }
        setLoading(false);
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const { data } = await api.post("/auth/verify-otp", { phone, otp });
            if (data.success) {
                login(data.data.accessToken, data.data.user);
                router.push("/feed");
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Invalid OTP");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-10 slide-up">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30 pulse-glow">
                        <span className="text-3xl font-bold text-white">S</span>
                    </div>
                    <h1 className="text-3xl font-bold gradient-text mb-2">ShareCare</h1>
                    <p className="text-gray-400 text-sm">Donate & receive items from people near you</p>
                </div>

                {step === "phone" && (
                    <form onSubmit={handleRequestOtp} className="space-y-4 fade-in">
                        <div>
                            <label className="text-sm text-gray-400 mb-1.5 block">Phone Number</label>
                            <div className="flex gap-2">
                                <div className="flex items-center justify-center rounded-xl bg-[var(--color-surface-lighter)] border border-[var(--color-border)] text-[var(--color-text)] px-4 shrink-0">
                                    +91
                                </div>
                                <input
                                    type="tel"
                                    value={phone.replace("+91", "")}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                    placeholder="Enter 10-digit number"
                                    className="input flex-1 !w-auto"
                                    required
                                    autoFocus
                                    id="phone-input"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || phone.replace("+91", "").length < 10}
                            className="btn-primary w-full text-center"
                            id="request-otp-btn"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Sending OTP...
                                </span>
                            ) : (
                                "Get OTP"
                            )}
                        </button>
                    </form>
                )}

                {step === "otp" && (
                    <form onSubmit={handleVerifyOtp} className="space-y-4 fade-in">
                        <div className="text-center mb-4">
                            <p className="text-gray-400 text-sm">
                                OTP sent to <span className="text-indigo-400 font-medium">{phone}</span>
                            </p>
                            <button
                                type="button"
                                onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
                                className="text-indigo-400 text-sm hover:underline mt-1"
                            >
                                Change number
                            </button>
                        </div>

                        <div>
                            <label className="text-sm text-gray-400 mb-1.5 block">Enter 6-digit OTP</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="• • • • • •"
                                className="input text-center text-2xl tracking-[0.5em] font-mono"
                                maxLength={6}
                                required
                                autoFocus
                                id="otp-input"
                            />
                        </div>

                        {error && (
                            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || otp.length < 6}
                            className="btn-primary w-full text-center"
                            id="verify-otp-btn"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Verifying...
                                </span>
                            ) : (
                                "Verify & Continue"
                            )}
                        </button>

                        <p className="text-center text-xs text-gray-500 mt-4">
                            Check your terminal/console for the OTP in dev mode
                        </p>
                    </form>
                )}

                <p className="text-center text-xs text-gray-600 mt-8">
                    By continuing, you agree to ShareCare&apos;s Terms of Service
                </p>
            </div>
        </div>
    );
}
