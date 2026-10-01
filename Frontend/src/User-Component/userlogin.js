import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaTimes, FaArrowRight } from "react-icons/fa";
import API_BASE_URL from "../config";

// Faint tiled chat-bubble motif for the backdrop
const BUBBLE_PATTERN = `<svg xmlns='http://www.w3.org/2000/svg' width='84' height='84'><path d='M16 12h34a7 7 0 017 7v16a7 7 0 01-7 7H30l-9 8v-8h-5a7 7 0 01-7-7V19a7 7 0 017-7z' fill='none' stroke='#25D366' stroke-opacity='0.06' stroke-width='1.4'/></svg>`;
const BUBBLE_BG = `data:image/svg+xml,${encodeURIComponent(BUBBLE_PATTERN)}`;

const C = {
  void: "#07100C",
  panel: "#0E1613",
  panelBorder: "rgba(37, 211, 102, 0.16)",
  green: "#25D366",
  greenDeep: "#128C4A",
  greenDark: "#075E54",
  text: "#F2F6F4",
  muted: "#7C8B84",
  inputBg: "#121A16",
  inputBorder: "#1E2822",
};

export default function Login() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.prefillEmail || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const justRegistered = !!location.state?.registered;
  const registeredName = location.state?.name;

  // Sync prefillEmail whenever navigation state changes
  useEffect(() => {
    if (location.state?.prefillEmail) {
      setEmail(location.state.prefillEmail);
      setPassword("");
    }
  }, [location.state]);

  // Check if this is a returning user (already logged in previously)
  const isReturningUser =
    localStorage.getItem("hasLoggedInBefore") === "true" ||
    !!localStorage.getItem("username") ||
    Boolean(email && localStorage.getItem(`hasLoggedIn_${email}`) === "true");

  // Popup entrance animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const apiBaseUrl = API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (response.ok) {
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

        localStorage.setItem("isLoggedIn", "true");
        if (data.name) {
          localStorage.setItem("username", data.name);
          localStorage.setItem("email", data.email || "");
          localStorage.setItem("phone", data.phone || "");
          localStorage.setItem("location", data.location || "");
          localStorage.setItem("businessName", data.businessName || "");
          localStorage.setItem("businessType", data.businessType || "");
        }
        // Subscription login flow: strictly subscription mode, never freeUserToken.
        localStorage.setItem("loginType", "subscription");
        localStorage.removeItem("freeUserToken");
        localStorage.removeItem("freeUserData");

        const activeSubscription = Boolean(
          data.isSubscribed &&
          (
            !data.subscriptionExpiresAt ||
            new Date(data.subscriptionExpiresAt).getTime() > Date.now()
          )
        );

        if (activeSubscription) {
          localStorage.setItem("isSubscribed", "true");
          if (data.subscriptionPlan) localStorage.setItem("subscriptionPlan", data.subscriptionPlan);
          if (data.subscriptionStartedAt) localStorage.setItem("subscriptionStartedAt", data.subscriptionStartedAt);
          if (data.subscriptionExpiresAt) localStorage.setItem("subscriptionExpiresAt", data.subscriptionExpiresAt);
          localStorage.setItem("credits", "99999");
          localStorage.removeItem("freeUserToken");
          localStorage.removeItem(`renewRequested_${email}`);
          localStorage.removeItem("subscriptionPlan");
        } else {
          localStorage.removeItem("isSubscribed");
          localStorage.removeItem("subscriptionPlan");
          localStorage.removeItem(`renewRequested_${email}`);
          if (data.subscriptionExpiresAt) {
            localStorage.setItem("subscriptionExpiresAt", data.subscriptionExpiresAt);
            if (data.subscriptionStartedAt) localStorage.setItem("subscriptionStartedAt", data.subscriptionStartedAt);
          }
          localStorage.removeItem("freeUserToken");
          localStorage.removeItem("freeUserData");
          localStorage.setItem("credits", String(data.credits || 0));
        }
        const userSent = data.totalSent !== undefined ? Number(data.totalSent) : 0;
        localStorage.setItem("totalSent", String(userSent));
        window.dispatchEvent(new Event("creditsChanged"));
        window.dispatchEvent(new Event("loginStatusChanged"));
        window.dispatchEvent(new Event("freeUserLoginStatusChanged"));
        
        const hasLoggedInKey = `hasLoggedIn_${email}`;
        if (!localStorage.getItem(hasLoggedInKey)) {
          sessionStorage.setItem("isFirstLogin", "true");
          localStorage.setItem(hasLoggedInKey, "true");
        } else {
          sessionStorage.removeItem("isFirstLogin");
        }
        localStorage.setItem("hasLoggedInBefore", "true");

        alert("✅ Login Successful!");
        navigate("/");
      } else {
        alert("Login failed: " + data.message);
      }
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: C.void }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');

        .gy-login-bg {
          position: absolute;
          inset: 0;
          background-image: url("${BUBBLE_BG}");
          background-size: 84px 84px;
        }
        .gy-login-glow {
          position: absolute;
          border-radius: 9999px;
          filter: blur(90px);
          pointer-events: none;
        }
        .gy-login-card {
          font-family: 'Inter', system-ui, sans-serif;
          background: ${C.panel};
          border: 1px solid ${C.panelBorder};
        }
        .gy-login-card::after {
          content: "";
          position: absolute;
          width: 22px;
          height: 22px;
          left: 42px;
          bottom: -9px;
          background: ${C.panel};
          border-right: 1px solid ${C.panelBorder};
          border-bottom: 1px solid ${C.panelBorder};
          transform: rotate(45deg);
          border-radius: 0 0 4px 0;
        }
        .gy-login-heading {
          font-family: 'Space Grotesk', system-ui, sans-serif;
        }
        .gy-status-dot {
          animation: gy-pulse 2s ease-in-out infinite;
        }
        @keyframes gy-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37,211,102,0.55); }
          50% { box-shadow: 0 0 0 5px rgba(37,211,102,0); }
        }
        .gy-input {
          background: ${C.inputBg};
          border: 1px solid ${C.inputBorder};
          color: ${C.text};
        }
        .gy-input::placeholder { color: #57645D; }
        .gy-input:focus {
          border-color: ${C.green};
          box-shadow: 0 0 0 3px rgba(37,211,102,0.12);
        }
        .gy-dots span {
          animation: gy-bounce 1.2s infinite ease-in-out;
        }
        .gy-dots span:nth-child(2) { animation-delay: 0.15s; }
        .gy-dots span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes gy-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

      <div className="gy-login-bg" />
      <div
        className="gy-login-glow"
        style={{ width: 320, height: 320, background: C.greenDeep, opacity: 0.18, top: -100, left: -100 }}
      />
      <div
        className="gy-login-glow"
        style={{ width: 360, height: 360, background: C.greenDark, opacity: 0.22, bottom: -120, right: -120 }}
      />

      <div
        className="gy-login-card w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10 transition-all duration-500 ease-out"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? "scale(1) translateY(0)" : "scale(0.94) translateY(16px)",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.7)",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="absolute top-4 right-4 transition-all duration-200 hover:rotate-90"
          style={{ color: C.muted }}
          aria-label="Close"
        >
          <FaTimes size={18} />
        </button>

        <div className="text-center mb-8">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center p-2 shadow-lg transition-transform duration-300 hover:rotate-6 hover:scale-110"
              style={{ background: `linear-gradient(135deg, ${C.green}, ${C.greenDeep})` }}
            >
              <img src="/Goye.png" alt="Goye Logo" className="w-12 h-12 object-contain" />
            </div>
            <span
              className="gy-status-dot absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2"
              style={{ background: C.green, borderColor: C.panel }}
            />
          </div>
          <h1 className="gy-login-heading text-3xl font-semibold" style={{ color: C.text }}>
            {justRegistered
              ? (registeredName ? `Welcome, ${registeredName}` : "Welcome Goye")
              : (isReturningUser ? "Welcome back" : "Welcome Goye")}
          </h1>
          <p className="mt-2 text-sm" style={{ color: C.muted }}>
            Login to continue to Goye
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#B7C2BC" }}>
              Email
            </label>
            <div className="relative group">
              <FaEnvelope
                className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors"
                size={16}
                style={{ color: C.muted }}
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="gy-input w-full pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all duration-300"
                style={{ caretColor: C.green }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#B7C2BC" }}>
              Password
            </label>
            <div className="relative group">
              <FaLock
                className="absolute left-3 top-1/2 -translate-y-1/2"
                size={16}
                style={{ color: C.muted }}
              />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="gy-input w-full pl-10 pr-10 py-2.5 rounded-xl outline-none transition-all duration-300"
                style={{ caretColor: C.green }}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: C.muted }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer" style={{ color: C.muted }}>
              <input type="checkbox" className="accent-[#25D366]" />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${C.green}, ${C.greenDeep})` }}
          >
            {loading ? (
              <span className="gy-dots flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
              </span>
            ) : (
              <>
                Login <FaArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: C.muted }}>
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            style={{ color: C.green }}
            className="font-semibold hover:underline cursor-pointer"
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}