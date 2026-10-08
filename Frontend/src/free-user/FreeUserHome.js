import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Minimal placeholder Free User home page. Its only job right now is to
// confirm the register -> login -> authenticated flow works end to end.
// Home / About / Contact / Get Connection / Get Help / Credits /
// Scheduled Messages will be built out in the next phase, per the scope
// given for this pass.

const API_BASE_URL = (process.env.REACT_APP_API_URL || "https://goye.onrender.com").replace(/\/+$/, "");

export default function FreeUserHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("freeUserToken");
    if (!token) {
      navigate("/free-user/login");
      return;
    }

    const fetchMe = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/free-user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          // Expired/invalid token — clear it and send back to login.
          localStorage.removeItem("freeUserToken");
          localStorage.removeItem("freeUserData");
          window.dispatchEvent(new Event("freeUserLoginStatusChanged"));
          navigate("/free-user/login");
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.message || "Could not load your account.");
          return;
        }
        const activeSubscription = Boolean(
          data.user?.isSubscribed &&
          data.user?.subscriptionExpiresAt &&
          new Date(data.user.subscriptionExpiresAt).getTime() > Date.now()
        );

        if (activeSubscription) {
          localStorage.setItem("isSubscribed", "true");
          navigate("/");
          return;
        }

        setUser(data.user);
        localStorage.setItem("freeUserData", JSON.stringify(data.user));
      } catch (err) {
        console.error("Free user /me fetch error:", err);
        const stored = localStorage.getItem("freeUserData");
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch (e) {
            setError("Could not reach the server.");
          }
        } else {
          setError("Could not reach the server.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("freeUserToken");
    localStorage.removeItem("freeUserData");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("phone");
    localStorage.removeItem("location");
    localStorage.removeItem("credits");
    localStorage.removeItem("isSubscribed");
    localStorage.removeItem("subscriptionPlan");
    localStorage.removeItem("subscriptionStartedAt");
    localStorage.removeItem("subscriptionExpiresAt");
    localStorage.removeItem("lastExpiredPlan");
    localStorage.removeItem("lastExpiredTime");
    localStorage.removeItem("totalSent");
    localStorage.removeItem("freeTrialEnded");
    localStorage.removeItem("whatsappConnected");
    sessionStorage.removeItem("isFirstLogin");
    window.dispatchEvent(new Event("freeUserLoginStatusChanged"));
    window.dispatchEvent(new Event("loginStatusChanged"));
    navigate("/free-user/login");
  };

  return (
    <div
      className="min-h-screen w-full px-4 py-12"
      style={{
        background: "linear-gradient(135deg, #050f0a 0%, #0a1a12 100%)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="max-w-2xl mx-auto bg-[#0E1613] border border-white/10 rounded-2xl shadow-2xl p-8">
        {loading ? (
          <p className="text-white/50 text-sm">Loading your account...</p>
        ) : error ? (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {error}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-extrabold text-white">
                {sessionStorage.getItem("isFirstLogin") === "true" 
                  ? `Welcome, ${user?.name}` 
                  : `Welcome back, ${user?.name}`}
              </h1>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-semibold text-white/70 border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
              >
                Log Out
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <InfoRow label="Email" value={user?.email} />
              <InfoRow label="Business Name" value={user?.businessName} />
              <InfoRow label="Business Type" value={user?.businessType} />
              <InfoRow label="Phone" value={user?.phone} />
              <InfoRow label="Location" value={user?.location} />
              <InfoRow label="Status" value={user?.status} />
            </div>

            <div className="mt-8 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07] text-xs text-white/40">
              Home, About, Contact, Get Connection, Get Help, Credits, and Scheduled
              Messages will be added here in the next phase.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="px-4 py-3 rounded-xl bg-[#121A16] border border-[#1E2822]">
      <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-white font-medium truncate">{value || "—"}</p>
    </div>
  );
}