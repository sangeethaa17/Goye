import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUserShield, FaArrowRight, FaSpinner, FaCrown, FaTimes } from "react-icons/fa";

import API_BASE_URL from "../config";

export default function FreeUserLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.prefillEmail || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [vipMessage, setVipMessage] = useState("");
  const [vipUserName, setVipUserName] = useState("");
  const [showVipModal, setShowVipModal] = useState(false);
  const [justRegistered, setJustRegistered] = useState(!!location.state?.registered);

  useEffect(() => {
    if (justRegistered) {
      // One-shot banner; consume the navigation state so a refresh or
      // back/forward doesn't keep showing it.
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setVipMessage("");

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/free-user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        const user = data.user || {};
        const activeSubscription = Boolean(
          user.isSubscribed &&
          user.subscriptionExpiresAt &&
          new Date(user.subscriptionExpiresAt).getTime() > Date.now()
        );

        // Clear previous user cache
        localStorage.removeItem("lastExpiredPlan");
        localStorage.removeItem("lastExpiredTime");
        localStorage.removeItem("freeUserData");
        localStorage.removeItem("freeUserToken");
        localStorage.removeItem("freeTrialEnded");
        localStorage.removeItem("subscriptionPlan");
        localStorage.removeItem("subscriptionStartedAt");
        localStorage.removeItem("subscriptionExpiresAt");
        localStorage.removeItem("isSubscribed");
        localStorage.removeItem(`renewRequested_${email}`);

        // Free-user login owns this session; do not inherit a subscription
        // user's marker from a previous login.
        localStorage.removeItem("isLoggedIn");
        localStorage.setItem("freeUserToken", data.token || "");
        localStorage.setItem("freeUserData", JSON.stringify(user));
        localStorage.setItem("username", user.name || "");
        localStorage.setItem("email", user.email || "");
        localStorage.setItem("phone", user.phone || "");
        localStorage.setItem("location", user.location || "");
        localStorage.setItem("businessName", user.businessName || "");
        localStorage.setItem("businessType", user.businessType || "");

        // Free User session: strictly Free User state, never inherit subscription
        localStorage.removeItem("isSubscribed");
        localStorage.removeItem("subscriptionPlan");
        localStorage.removeItem("subscriptionStartedAt");
        localStorage.removeItem("subscriptionExpiresAt");

        const userSent = user.totalSent !== undefined ? Number(user.totalSent) : 0;
        const userCreds = user.credits !== undefined ? Number(user.credits) : 0;
        localStorage.setItem("credits", String(userCreds));
        localStorage.setItem("totalSent", String(userSent));
        window.dispatchEvent(new Event("creditsChanged"));
        window.dispatchEvent(new Event("loginStatusChanged"));
        window.dispatchEvent(new Event("freeUserLoginStatusChanged"));
        
        // Custom Free User UI triggers - only for first time user!
        const userEmailKey = (email || "").toLowerCase().trim();
        const hasSeenWelcomeKey = `hasSeenWelcome_${userEmailKey}`;
        const hasLoggedInKey = `hasLoggedIn_${userEmailKey}`;
        const isFirstTime = !localStorage.getItem(hasSeenWelcomeKey) && !localStorage.getItem(hasLoggedInKey);

        if (isFirstTime) {
          sessionStorage.setItem("showFreeUserWelcome", "true");
          sessionStorage.setItem("isFirstLogin", "true");
          window.dispatchEvent(new Event("showFreeUserWelcomePopup"));
        } else {
          sessionStorage.removeItem("showFreeUserWelcome");
          sessionStorage.removeItem("isFirstLogin");
        }
        localStorage.setItem(hasLoggedInKey, "true");

        navigate("/");
      } else {
        if (data.isUpgradedUser) {
          const userIdentifier = data.username || data.name || (email ? email.split('@')[0] : "User");
          setVipUserName(userIdentifier);
          setShowVipModal(true);
        } else {
          setError(data.message || "Login failed. Please try again.");
        }
      }
    } catch (err) {
      console.error("Free user login error:", err);
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at top, #0d281a 0%, #050f0a 60%, #030805 100%)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#25D366]/10 rounded-full blur-3xl pointer-events-none" />

      {/* High-End VIP Subscribed Member Modal (Interactive, No Auto-Redirect) */}
      {showVipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#14231A] via-[#0E1A13] to-[#08100B] border border-amber-500/40 rounded-3xl p-7 sm:p-9 shadow-[0_0_60px_rgba(245,158,11,0.25)] text-center animate-scale-up">
            
            {/* Close 'X' Button on Right Corner */}
            <button
              type="button"
              onClick={() => setShowVipModal(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 cursor-pointer"
              aria-label="Close"
            >
              <FaTimes className="text-lg" />
            </button>

            {/* Sparkling Gold Crown Icon */}
            <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-amber-400/25 via-amber-500/15 to-transparent border border-amber-400/40 flex items-center justify-center text-amber-400 text-3xl shadow-[0_0_35px_rgba(245,158,11,0.4)]">
              <FaCrown className="drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-extrabold uppercase tracking-widest mb-3">
              👑 Subscribed Member
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2.5 font-['Space_Grotesk',sans-serif]">
              Subscribed Account Detected
            </h2>

            <p className="text-xs sm:text-sm text-white/70 leading-relaxed mb-6 font-medium">
              Hey <span className="text-amber-300 font-semibold">{vipUserName || (email ? email.split('@')[0] : "User")}</span>, you have already upgraded to a Subscribed plan. Free User portal is reserved only for new trial users.
            </p>

            {/* Glowing Action Button: Direct navigation on click */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate("/userloginpage", { state: { prefillEmail: email } })}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-[#25D366] to-emerald-400 text-black font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(245,158,11,0.45)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Go to Subscription Login</span>
                <FaArrowRight />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Glassmorphic Login Card */}
      <div className="w-full max-w-md bg-[#0B140E]/95 border border-[#25D366]/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(37,211,102,0.15)] p-8 sm:p-10 backdrop-blur-2xl relative z-10 animate-fade-in">
        
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] text-2xl shadow-[0_0_25px_rgba(37,211,102,0.25)]">
            <FaUserShield />
          </div>

          <span className="text-[11px] uppercase tracking-widest font-extrabold text-[#25D366] bg-[#25D366]/10 px-3.5 py-1 rounded-full border border-[#25D366]/30 inline-block mb-3">
            ✨ Welcome to Goye
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Space_Grotesk',sans-serif]">
            Free User Login
          </h1>
          <p className="text-xs sm:text-sm text-white/60 mt-2 font-medium">
            Log in to your free Goye account & claim trial credits
          </p>
        </div>

        {justRegistered && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-[#25D366]/15 border border-[#25D366]/40 text-sm text-[#34E38A] flex items-center gap-2">
            <span>✓</span> Registration successful! Please log in below.
          </div>
        )}

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-white/70 uppercase tracking-wide">
              <FaEnvelope className="text-[#25D366] text-xs" />
              <span>Email Address</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none">
                <FaEnvelope />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-[#121A16] border border-[#25D366]/20 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-white/70 uppercase tracking-wide">
              <FaLock className="text-[#25D366] text-xs" />
              <span>Password</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none">
                <FaLock />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full pl-10 pr-11 py-3 bg-[#121A16] border border-[#25D366]/20 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#25D366] transition-colors p-1"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-gradient-to-r from-[#25D366] via-[#20BD5A] to-[#128C7E] hover:opacity-95 text-black font-extrabold text-base rounded-xl shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_25px_rgba(37,211,102,0.6)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 mt-2 flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <FaSpinner className="animate-spin text-sm" />
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <span>Log In</span>
                <FaArrowRight className="text-xs" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs sm:text-sm text-white/60 mt-6 font-medium">
          Don't have an account?{" "}
          <Link to="/free-user/register" className="text-[#25D366] font-bold hover:underline inline-flex items-center gap-1">
            Create Account →
          </Link>
        </p>
      </div>
    </div>
  );
}