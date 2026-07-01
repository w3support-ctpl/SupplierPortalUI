"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function Icon({ name, className = "", filled = false }: { name: string; className?: string; filled?: boolean }) {
  return (
    <span
      className={`material-symbols-outlined inline-flex items-center justify-center ${className}`}
      style={{
        fontSize: "20px",
        width: "20px",
        height: "20px",
        lineHeight: "1",
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
      }}
    >
      {name}
    </span>
  );
}

type Tab = "supplier" | "admin";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("supplier");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});

  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  const resetForgotState = () => {
    setForgotStep(1);
    setForgotEmail("");
    setForgotOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotError("");
    setForgotSuccess("");
  };

  const handleForgotOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    resetForgotState();
    setForgotModalOpen(true);
  };

  const handleSendOtp = async () => {
    setForgotError("");
    if (!username.trim() || !forgotEmail.trim()) {
      setForgotError("Please enter both your Username/PAN and Email.");
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch("/api/forgotPassword/sendOtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tab, username: username.trim(), email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotSuccess("OTP sent to your email!");
        setForgotStep(2);
      } else {
        setForgotError(data.message || "Failed to send OTP.");
      }
    } catch {
      setForgotError("Network error. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setForgotError("");
    if (!forgotOtp.trim() || !newPassword || !confirmPassword) {
      setForgotError("Please fill out all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError("Passwords do not match.");
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch("/api/forgotPassword/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tab, 
          username: username.trim(), 
          email: forgotEmail.trim(), 
          otp: forgotOtp.trim(), 
          newPassword 
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotSuccess("Password reset successfully! You can now sign in.");
        setTimeout(() => {
          setForgotModalOpen(false);
          resetForgotState();
        }, 3000);
      } else {
        setForgotError(data.message || "Failed to reset password.");
      }
    } catch {
      setForgotError("Network error. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };


  const resetState = (newTab: Tab) => {
    setTab(newTab);
    setUsername("");
    setPassword("");
    setErrorMsg("");
    setFieldErrors({});
  };

  const validate = () => {
    const errors: { username?: string; password?: string } = {};
    if (!username.trim()) {
      errors.username = tab === "supplier" ? "PAN number is required." : "Username is required.";
    } else if (tab === "supplier" && !/^[A-Za-z0-9]{10}$/.test(username.trim())) {
      errors.username = "Enter a valid 10-character PAN number.";
    }
    if (!password) errors.password = "Password is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!validate()) return;
    setLoading(true);
    const endpoint = tab === "supplier" ? "/api/login" : "/api/adminLogin";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Username: username.trim(), Password: password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/portal/dashboard");
      } else {
        setErrorMsg(data.message || "Invalid credentials. Please try again.");
      }
    } catch {
      setErrorMsg("Failed to connect to the authentication server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Material Symbols */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      <div className="min-h-screen w-full flex flex-col bg-white">

        {/* ─── Top Bar ─── */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-700/30">
              S
            </div>
            <span className="font-bold text-sm text-slate-900 tracking-wide" style={{ fontFamily: "var(--font-headline)" }}>
              Supplier Portal
            </span>
          </div>

        </header>

        {/* ─── Body: Split Layout ─── */}
        <main className="flex-1 flex">

          {/* LEFT: Digital Network Branding Panel */}
          <div className="hidden md:flex md:w-1/2 bg-[#0B1120] flex-col justify-center px-16 relative overflow-hidden">
            {/* Reference SAP Digital Network Image */}
            <img
              src="/app/images/landingPage.jpg"
              alt="Digital Network Background"
              className="absolute inset-0 z-0 w-full h-full object-cover opacity-90"
            />

            {/* Cyber/Tech Overlays to ensure text readability */}
            <div className="absolute inset-0 z-0 bg-[#0B1120]/40" />
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/60 to-transparent" />

            <div className="relative z-10">
              <div className="mb-2 text-blue-400">
                <Icon name="hub" className="text-blue-400" filled />
              </div>
              <h1
                className="text-4xl font-bold text-white leading-tight mb-4"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                Welcome to your<br />
                Supplier Portal
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-md mb-10" style={{ fontFamily: "var(--font-body)" }}>
                Access your global supply chain, orders, and invoices in one secure place. Manage enterprise resources with precision and speed.
              </p>

              {/* <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "99.9%", label: "Platform Uptime" },
                  { value: "256-bit", label: "AES Encryption" },
                  { value: "SAP", label: "S/4HANA Integrated" },
                  { value: "ISO", label: "27001 Certified" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-headline)" }}>{stat.value}</div>
                    <div className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ fontFamily: "var(--font-label)" }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div> */}
            </div>
          </div>

          {/* RIGHT: Login Form Panel */}
          <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
            <div className="w-full max-w-md">

              {/* Title */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-headline)" }}>
                  Sign In
                </h2>
                <p className="text-slate-500 text-sm mt-1" style={{ fontFamily: "var(--font-body)" }}>
                  Enter your credentials to manage your account.
                </p>
              </div>

              {/* Account type toggle */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200 rounded-lg mb-6">
                {(["supplier", "admin"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => resetState(t)}
                    className={`py-2.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition ${tab === t
                      ? "bg-blue-700 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                      }`}
                    style={{ fontFamily: "var(--font-label)" }}
                  >
                    <Icon name={t === "supplier" ? "person" : "shield"} className={tab === t ? "text-white" : "text-slate-400"} />
                    {t === "supplier" ? "Supplier Account" : "Internal Admin"}
                  </button>
                ))}
              </div>

              {/* Error box */}
              {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 mb-5">
                  <Icon name="error" className="text-rose-500 shrink-0 mt-0.5" filled />
                  <p className="text-xs font-medium text-rose-700" style={{ fontFamily: "var(--font-body)" }}>{errorMsg}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Username / PAN */}
                <div>
                  <label
                    className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5"
                    style={{ fontFamily: "var(--font-label)" }}
                    htmlFor="username"
                  >
                    {tab === "supplier" ? "PAN Card Number" : "Username"}
                  </label>
                  <div className="relative">
                    <Icon name="person" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="username"
                      type="text"
                      placeholder={tab === "supplier" ? "ABCDE1234F" : "admin_username"}
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className={`input-field !pl-10 ${fieldErrors.username ? "border-rose-400 focus:border-rose-400" : ""}`}
                      style={{ fontFamily: "var(--font-body)" }}
                    />
                  </div>
                  {fieldErrors.username && (
                    <p className="text-rose-500 text-[10px] mt-1 font-medium" style={{ fontFamily: "var(--font-label)" }}>
                      {fieldErrors.username}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider"
                      style={{ fontFamily: "var(--font-label)" }}
                      htmlFor="password"
                    >
                      Password
                    </label>
                    <a href="#" onClick={handleForgotOpen} className="text-[10px] font-semibold text-blue-600 hover:underline">Forgot?</a>
                  </div>
                  <div className="relative">
                    <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={`input-field !pl-10 !pr-10 ${fieldErrors.password ? "border-rose-400 focus:border-rose-400" : ""}`}
                      style={{ fontFamily: "var(--font-body)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition flex items-center justify-center"
                    >
                      <Icon name={showPassword ? "visibility_off" : "visibility"} />
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-rose-500 text-[10px] mt-1 font-medium" style={{ fontFamily: "var(--font-label)" }}>
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md shadow-blue-700/20"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Continue
                      <Icon name="arrow_forward" className="text-white" />
                    </>
                  )}
                </button>
              </form>

              {/* Register link */}
              {tab === "supplier" && (
                <p className="text-center text-xs text-slate-500 mt-6" style={{ fontFamily: "var(--font-body)" }}>
                  New supplier?{" "}
                  <Link href="/onboarding" className="text-blue-700 font-bold hover:underline">
                    Register here
                  </Link>
                </p>
              )}

            </div>
          </div>
        </main>

      {/* ─── Forgot Password Modal ─── */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setForgotModalOpen(false)}></div>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-fade-in-up">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: "var(--font-headline)" }}>
                Reset Password
              </h3>
              <button onClick={() => setForgotModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Icon name="close" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              
              {forgotError && (
                <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-lg border border-rose-100 flex items-start gap-2">
                  <Icon name="error" className="shrink-0 text-sm" />
                  <span>{forgotError}</span>
                </div>
              )}
              
              {forgotSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-600 text-xs rounded-lg border border-emerald-100 flex items-start gap-2">
                  <Icon name="check_circle" className="shrink-0 text-sm" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {forgotStep === 1 ? (
                <>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    Enter your {tab === "supplier" ? "PAN Card Number" : "Username"} and registered email address to receive an OTP.
                  </p>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {tab === "supplier" ? "PAN Card Number" : "Username"}
                    </label>
                    <input 
                      type="text" 
                      value={username} 
                      onChange={e => setUsername(e.target.value)} 
                      className="input-field" 
                      placeholder={tab === "supplier" ? "Enter PAN" : "Enter Username"}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Registered Email
                    </label>
                    <input 
                      type="email" 
                      value={forgotEmail} 
                      onChange={e => setForgotEmail(e.target.value)} 
                      className="input-field" 
                      placeholder="Enter your email"
                    />
                  </div>

                  <button 
                    onClick={handleSendOtp} 
                    disabled={forgotLoading}
                    className="w-full mt-2 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2"
                  >
                    {forgotLoading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <>Send Verification OTP <Icon name="send" className="text-sm" /></>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    Please enter the 6-digit OTP sent to <b>{forgotEmail}</b> and your new password.
                  </p>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      6-Digit OTP
                    </label>
                    <input 
                      type="text" 
                      maxLength={6}
                      value={forgotOtp} 
                      onChange={e => setForgotOtp(e.target.value)} 
                      className="input-field tracking-widest font-bold" 
                      placeholder="••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      New Password
                    </label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      className="input-field" 
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Confirm Password
                    </label>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      className="input-field" 
                      placeholder="Confirm new password"
                    />
                  </div>

                  <button 
                    onClick={handleResetPassword} 
                    disabled={forgotLoading}
                    className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2"
                  >
                    {forgotLoading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <>Reset Password <Icon name="lock_reset" className="text-sm" /></>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}


        {/* ─── Footer ─── */}
        <footer className="h-12 border-t border-slate-150 bg-slate-50/50 flex items-center justify-center text-[10px] text-slate-400 font-semibold uppercase tracking-widest shrink-0">
          <span style={{ fontFamily: "var(--font-label)" }}>
            © Powered by Castaliaz Technologies
          </span>
        </footer>
      </div>
    </>
  );
}
