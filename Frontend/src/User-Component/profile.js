import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft, FiEdit2, FiMail, FiPhone, FiMapPin, FiCamera, FiSave, FiX,
  FiLogOut, FiSettings, FiShield, FiBell, FiHelpCircle, FiChevronRight,
  FiActivity, FiStar, FiVideo, FiPlayCircle, FiSend, FiCheck, FiZap
} from "react-icons/fi";
import { FaCrown } from "react-icons/fa";
import { useNotifications } from "../context/NotificationContext";
import API_BASE_URL from "../config";


function useGoyeFonts() {
  useEffect(() => {
    const id = "goye-profile-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

export default function Profile() {
  const navigate = useNavigate();
  const { credits: contextCredits } = useNotifications();
  useGoyeFonts();

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [userName, setUserName] = useState(localStorage.getItem("username") || "User");
  const [email, setEmail] = useState(localStorage.getItem("email") || "No email provided");
  const [phone, setPhone] = useState(localStorage.getItem("phone") || "No phone provided");
  const [location, setLocation] = useState(localStorage.getItem("location") || "No location provided");

  const isFreeUserAccount = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");

  const [subscriptionStartedAt, setSubscriptionStartedAt] = useState(() => localStorage.getItem("subscriptionStartedAt") || "");
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState(() => localStorage.getItem("subscriptionExpiresAt") || "");
  const [subscriptionPlan, setSubscriptionPlan] = useState(() => localStorage.getItem("subscriptionPlan") || "");
  const [upcomingPlan, setUpcomingPlan] = useState(() => localStorage.getItem("upcomingPlan") || "");
  const [upcomingPlanStartsAt, setUpcomingPlanStartsAt] = useState(() => localStorage.getItem("upcomingPlanStartsAt") || "");
  const [upcomingPlanExpiresAt, setUpcomingPlanExpiresAt] = useState(() => localStorage.getItem("upcomingPlanExpiresAt") || "");

  const [isSubscribed, setIsSubscribed] = useState(() => {
    if (isFreeUserAccount) return false;
    const expiresAt = localStorage.getItem("subscriptionExpiresAt");
    const upcomingExp = localStorage.getItem("upcomingPlanExpiresAt");
    const isSub = localStorage.getItem("isSubscribed") === "true";
    if (expiresAt && expiresAt !== "null") {
      const expTime = new Date(expiresAt).getTime();
      if (!isNaN(expTime) && expTime > Date.now()) {
        return isSub;
      }
    }
    if (upcomingExp && upcomingExp !== "null") {
      const upTime = new Date(upcomingExp).getTime();
      if (!isNaN(upTime) && upTime > Date.now()) {
        return isSub;
      }
    }
    return isSub;
  });

  const [renewRequested, setRenewRequested] = useState(() => {
    let storedEmail = localStorage.getItem("email") || localStorage.getItem("userEmail") || localStorage.getItem("freeUserEmail") || "";
    if (!storedEmail) {
      try {
        const fData = JSON.parse(localStorage.getItem("freeUserData") || "{}");
        if (fData.email) storedEmail = fData.email;
      } catch (e) {}
    }
    return localStorage.getItem(`renewRequested_${storedEmail}`) === "true";
  });

  const hasSubscriptionHistory = useMemo(() => {
    return !!(subscriptionExpiresAt || subscriptionStartedAt || (subscriptionPlan && subscriptionPlan !== ""));
  }, [subscriptionExpiresAt, subscriptionStartedAt, subscriptionPlan]);

  const isPlanExpired = useMemo(() => {
    if (!hasSubscriptionHistory) return false;
    if (isSubscribed) {
      if (subscriptionExpiresAt && new Date(subscriptionExpiresAt).getTime() <= Date.now()) {
        return true;
      }
      return false;
    }
    if (subscriptionExpiresAt && new Date(subscriptionExpiresAt).getTime() <= Date.now()) {
      return true;
    }
    return false;
  }, [isSubscribed, subscriptionExpiresAt, hasSubscriptionHistory]);

  const isNewSubscriptionUser = !isFreeUserAccount && !isSubscribed && !hasSubscriptionHistory;

  const getDurationMs = (plan) => {
    const lower = (plan || '').toLowerCase();
    if (lower.includes('week')) return 7 * 24 * 60 * 60 * 1000;
    if (lower.includes('15') || lower.includes('fifteen')) return 15 * 24 * 60 * 60 * 1000;
    if (lower.includes('3 month') || lower.includes('three')) return 90 * 24 * 60 * 60 * 1000;
    if (lower.includes('6 month') || lower.includes('six')) return 180 * 24 * 60 * 60 * 1000;
    if (lower.includes('18 month') || lower.includes('eighteen')) return 540 * 24 * 60 * 60 * 1000;
    if (lower.includes('year') || lower.includes('1 yr')) return 365 * 24 * 60 * 60 * 1000;
    if (lower.includes('month')) return 30 * 24 * 60 * 60 * 1000;
    return 24 * 60 * 60 * 1000; // default 24h
  };

  const getEffectiveStartedAt = (startedAt, expiresAt, plan) => {
    if (startedAt && !isNaN(new Date(startedAt).getTime())) {
      return startedAt;
    }
    if (expiresAt && !isNaN(new Date(expiresAt).getTime())) {
      const expTime = new Date(expiresAt).getTime();
      const dur = getDurationMs(plan);
      return new Date(expTime - dur).toISOString();
    }
    return null;
  };

  const formatDateTime = (dateVal) => {
    if (!dateVal) return "—";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
           d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getDurationLabel = (plan) => {
    const lower = (plan || '').toLowerCase();
    if (lower.includes('week')) return '7 Days';
    if (lower.includes('15') || lower.includes('fifteen')) return '15 Days';
    if (lower.includes('3 month') || lower.includes('three')) return '3 Months';
    if (lower.includes('6 month') || lower.includes('six')) return '6 Months';
    if (lower.includes('18 month') || lower.includes('eighteen')) return '18 Months';
    if (lower.includes('year') || lower.includes('1 yr')) return '1 Year';
    if (lower.includes('month')) return '30 Days';
    return '24 Hours';
  };

  const getRemainingTimeText = (expiresAt) => {
    if (!expiresAt) return 'Active';
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    return `${hours}h ${mins}m remaining`;
  };

  // Credits & Trial State
  const [credits, setCredits] = useState(() => {
    const isFreeUser = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");
    if (isFreeUser) {
      const stored = localStorage.getItem("credits");
      if (stored !== null) return Math.max(0, parseInt(stored, 10));
      return 30;
    }
    const isSubVal = localStorage.getItem("isSubscribed") === "true";
    const expiresAt = localStorage.getItem("subscriptionExpiresAt");
    let isSubActive = isSubVal;
    if (expiresAt && expiresAt !== "null") {
      const expTime = new Date(expiresAt).getTime();
      if (!isNaN(expTime)) {
        isSubActive = isSubVal && expTime > Date.now();
      }
    }
    if (isSubActive) return 99999;
    
    const stored = localStorage.getItem("credits");
    if (stored !== null) return Math.max(0, parseInt(stored, 10));
    if (contextCredits !== undefined) return Math.max(0, contextCredits);
    return 0;
  });

  const [totalSent, setTotalSent] = useState(() => parseInt(localStorage.getItem("totalSent") || "0", 10));
  const [isFreeTrial, setIsFreeTrial] = useState(() => {
    const isSubVal = localStorage.getItem("isSubscribed") === "true";
    const expiresAt = localStorage.getItem("subscriptionExpiresAt");
    let isSubActive = isSubVal;
    if (expiresAt && expiresAt !== "null") {
      const expTime = new Date(expiresAt).getTime();
      if (!isNaN(expTime)) {
        isSubActive = isSubVal && expTime > Date.now();
      }
    }
    if (isSubActive) return false;
    const isFreeUserAccount = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");
    if (!isFreeUserAccount) return false;
    
    const stored = localStorage.getItem("credits");
    const credVal = stored !== null ? parseInt(stored, 10) : 0;
    return credVal > 0;
  });

  useEffect(() => {
    const syncProfileCredits = () => {
      const isFreeUserAccount = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");
      if (isFreeUserAccount) {
        setIsSubscribed(false);
        setIsFreeTrial(true);
        const stored = localStorage.getItem("credits");
        if (stored !== null) {
          const c = Math.max(0, parseInt(stored, 10));
          setCredits(c);
          setIsFreeTrial(c > 0);
        } else if (contextCredits !== undefined) {
          const c = Math.max(0, contextCredits);
          setCredits(c);
          setIsFreeTrial(c > 0);
        } else {
          setCredits(30);
        }
        return;
      }

      const isSubVal = localStorage.getItem("isSubscribed") === "true";
      const expiresAt = localStorage.getItem("subscriptionExpiresAt");
      let isSubActive = isSubVal;
      if (expiresAt && expiresAt !== "null") {
        const expTime = new Date(expiresAt).getTime();
        if (!isNaN(expTime)) {
          isSubActive = isSubVal && expTime > Date.now();
        }
      }

      if (isSubActive) {
        setCredits(99999);
        setIsSubscribed(true);
        setIsFreeTrial(false);
        return;
      }

      setCredits(0);
      setIsFreeTrial(false);
    };

    syncProfileCredits();
    window.addEventListener("creditsChanged", syncProfileCredits);
    return () => window.removeEventListener("creditsChanged", syncProfileCredits);
  }, [contextCredits]);

  // Helper to extract active user email from all localStorage keys
  const getActiveUserEmail = () => {
    let em = localStorage.getItem("email") || localStorage.getItem("userEmail") || localStorage.getItem("freeUserEmail") || "";
    if (!em) {
      try {
        const fData = JSON.parse(localStorage.getItem("freeUserData") || "{}");
        if (fData.email) em = fData.email;
      } catch (e) {}
    }
    return em;
  };

  // On mount: check backend for any pending renewal request for this user (Free Users & Expired Users)
  useEffect(() => {
    const storedEmail = getActiveUserEmail();
    if (!storedEmail) return;

    const apiBase = API_BASE_URL;
    fetch(`${apiBase}/api/subscription-requests`)
      .then(r => r.json())
      .then(data => {
        if (data && Array.isArray(data.requests)) {
          const hasPending = data.requests.some(
            r => r.email && r.email.toLowerCase().trim() === storedEmail.toLowerCase().trim() && r.status === "pending"
          );
          if (hasPending) {
            setRenewRequested(true);
            localStorage.setItem(`renewRequested_${storedEmail}`, "true");
          } else {
            setRenewRequested(false);
            localStorage.removeItem(`renewRequested_${storedEmail}`);
          }
        }
      })
      .catch(() => {});

    // Also listen for real-time event
    const handler = () => {
      setRenewRequested(true);
      if (storedEmail) localStorage.setItem(`renewRequested_${storedEmail}`, "true");
    };
    window.addEventListener("renewPlanRequested", handler);
    return () => window.removeEventListener("renewPlanRequested", handler);
  }, []);

  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [securityLock, setSecurityLock] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    const isTrialEnded = localStorage.getItem("freeTrialEnded") === "true";
    const currentSent = parseInt(localStorage.getItem("totalSent") || "0", 10);

    const freeUserDataStr = localStorage.getItem("freeUserData");
    if (freeUserDataStr) {
      try {
        const freeUserData = JSON.parse(freeUserDataStr);
        if (freeUserData.name) setUserName(freeUserData.name);
        if (freeUserData.email) setEmail(freeUserData.email);
        if (freeUserData.phone) setPhone(freeUserData.phone);
        if (freeUserData.location) setLocation(freeUserData.location);

        const storedCredits = localStorage.getItem("credits");
        const currentCreditsVal = storedCredits !== null ? Math.max(0, parseInt(storedCredits, 10)) : (freeUserData.credits !== undefined ? Math.max(0, freeUserData.credits) : 0);

        setCredits(currentCreditsVal);
        setIsFreeTrial(currentCreditsVal > 0);
        if (freeUserData.totalSent !== undefined) setTotalSent(freeUserData.totalSent);

        if (freeUserData.id || freeUserData.email) {
          if (freeUserData.id) {
            fetch(`${API_BASE_URL}/api/free-user/profile/${freeUserData.id}`)
              .then(res => res.json())
              .then(data => {
                if (data.name) setUserName(data.name);
                if (data.email) setEmail(data.email);
                if (data.phone) setPhone(data.phone);
                if (data.location) setLocation(data.location);
              })
              .catch(() => {});
          }

          fetch(`${API_BASE_URL}/api/free-user/credits`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: freeUserData.id, email: freeUserData.email })
          })
            .then(res => res.json())
            .then(data => {
              if (data.isSubscribed && !isFreeUserAccount) {
                setIsSubscribed(true);
                localStorage.setItem("isSubscribed", "true");
                setSubscriptionPlan(data.subscriptionPlan || "One Day");
                localStorage.setItem("subscriptionPlan", data.subscriptionPlan || "One Day");
                if (data.subscriptionStartedAt) {
                  setSubscriptionStartedAt(data.subscriptionStartedAt);
                  localStorage.setItem("subscriptionStartedAt", data.subscriptionStartedAt);
                }
                if (data.subscriptionExpiresAt) {
                  setSubscriptionExpiresAt(data.subscriptionExpiresAt);
                  localStorage.setItem("subscriptionExpiresAt", data.subscriptionExpiresAt);
                }
                if (data.upcomingPlan) {
                  setUpcomingPlan(data.upcomingPlan);
                  localStorage.setItem("upcomingPlan", data.upcomingPlan);
                } else {
                  setUpcomingPlan("");
                  localStorage.removeItem("upcomingPlan");
                }
                if (data.upcomingPlanStartsAt) {
                  setUpcomingPlanStartsAt(data.upcomingPlanStartsAt);
                  localStorage.setItem("upcomingPlanStartsAt", data.upcomingPlanStartsAt);
                } else {
                  setUpcomingPlanStartsAt("");
                  localStorage.removeItem("upcomingPlanStartsAt");
                }
                if (data.upcomingPlanExpiresAt) {
                  setUpcomingPlanExpiresAt(data.upcomingPlanExpiresAt);
                  localStorage.setItem("upcomingPlanExpiresAt", data.upcomingPlanExpiresAt);
                } else {
                  setUpcomingPlanExpiresAt("");
                  localStorage.removeItem("upcomingPlanExpiresAt");
                }
                setCredits(99999);
                localStorage.setItem("credits", "99999");
                localStorage.removeItem("freeTrialEnded");
                setIsFreeTrial(false);
                if (freeUserData) {
                  freeUserData.isSubscribed = true;
                  freeUserData.subscriptionPlan = data.subscriptionPlan || "One Day";
                  freeUserData.subscriptionStartedAt = data.subscriptionStartedAt;
                  freeUserData.subscriptionExpiresAt = data.subscriptionExpiresAt;
                  freeUserData.upcomingPlan = data.upcomingPlan || "";
                  freeUserData.upcomingPlanStartsAt = data.upcomingPlanStartsAt || null;
                  freeUserData.upcomingPlanExpiresAt = data.upcomingPlanExpiresAt || null;
                  freeUserData.credits = 99999;
                  localStorage.setItem("freeUserData", JSON.stringify(freeUserData));
                }
                window.dispatchEvent(new Event("creditsChanged"));
              } else {
                setIsSubscribed(false);
                localStorage.removeItem("isSubscribed");
                localStorage.removeItem("subscriptionPlan");
                localStorage.removeItem("subscriptionStartedAt");
                localStorage.removeItem("subscriptionExpiresAt");
                localStorage.removeItem("upcomingPlan");
                localStorage.removeItem("upcomingPlanStartsAt");
                localStorage.removeItem("upcomingPlanExpiresAt");
                setUpcomingPlan("");
                setUpcomingPlanStartsAt("");
                setUpcomingPlanExpiresAt("");

                const sentLocal = parseInt(localStorage.getItem("totalSent") || "0", 10);
                let sent = data.totalSent !== undefined ? Number(data.totalSent) : sentLocal;
                const effectiveCredits = data.credits !== undefined ? Number(data.credits) : (parseInt(localStorage.getItem("credits") || "0", 10));

                if (effectiveCredits <= 0 && sent % 2 !== 0) {
                  sent = Math.floor(sent / 2) * 2;
                }

                setCredits(effectiveCredits);
                localStorage.setItem("credits", String(effectiveCredits));
                setIsFreeTrial(effectiveCredits > 0);
                if (effectiveCredits > 0) {
                  localStorage.removeItem("freeTrialEnded");
                }
                freeUserData.credits = effectiveCredits;
                freeUserData.totalSent = sent;
                localStorage.setItem("freeUserData", JSON.stringify(freeUserData));
                setTotalSent(sent);
                localStorage.setItem("totalSent", String(sent));
              }
            })
            .catch(() => {});
        }
      } catch (e) {}
    } else {
      const fetchCredits = async () => {
        const storedEmail = localStorage.getItem("email");
        if (!storedEmail) return;
        try {
          const response = await fetch(`${API_BASE_URL}/api/user/credits`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: storedEmail, isFreeUser: isFreeUserAccount })
          });
          if (response.ok) {
            const data = await response.json();
            if (data.isSubscribed && !isFreeUserAccount) {
              setIsSubscribed(true);
              localStorage.setItem("isSubscribed", "true");
              setSubscriptionPlan(data.subscriptionPlan || "One Day");
              localStorage.setItem("subscriptionPlan", data.subscriptionPlan || "One Day");
              if (data.subscriptionStartedAt) {
                setSubscriptionStartedAt(data.subscriptionStartedAt);
                localStorage.setItem("subscriptionStartedAt", data.subscriptionStartedAt);
              }
              if (data.subscriptionExpiresAt) {
                setSubscriptionExpiresAt(data.subscriptionExpiresAt);
                localStorage.setItem("subscriptionExpiresAt", data.subscriptionExpiresAt);
              }
              if (data.upcomingPlan) {
                setUpcomingPlan(data.upcomingPlan);
                localStorage.setItem("upcomingPlan", data.upcomingPlan);
              } else {
                setUpcomingPlan("");
                localStorage.removeItem("upcomingPlan");
              }
              if (data.upcomingPlanStartsAt) {
                setUpcomingPlanStartsAt(data.upcomingPlanStartsAt);
                localStorage.setItem("upcomingPlanStartsAt", data.upcomingPlanStartsAt);
              } else {
                setUpcomingPlanStartsAt("");
                localStorage.removeItem("upcomingPlanStartsAt");
              }
              if (data.upcomingPlanExpiresAt) {
                setUpcomingPlanExpiresAt(data.upcomingPlanExpiresAt);
                localStorage.setItem("upcomingPlanExpiresAt", data.upcomingPlanExpiresAt);
              } else {
                setUpcomingPlanExpiresAt("");
                localStorage.removeItem("upcomingPlanExpiresAt");
              }
              setCredits(99999);
              localStorage.setItem("credits", "99999");
              localStorage.removeItem("freeTrialEnded");
              setIsFreeTrial(false);
              window.dispatchEvent(new Event("creditsChanged"));
            } else {
              setIsSubscribed(false);
              localStorage.removeItem("isSubscribed");
              localStorage.removeItem("subscriptionPlan");
              localStorage.removeItem("subscriptionStartedAt");
              localStorage.removeItem("subscriptionExpiresAt");
              localStorage.removeItem("upcomingPlan");
              localStorage.removeItem("upcomingPlanStartsAt");
              localStorage.removeItem("upcomingPlanExpiresAt");
              setUpcomingPlan("");
              setUpcomingPlanStartsAt("");
              setUpcomingPlanExpiresAt("");

              const trialEndedNow = localStorage.getItem("freeTrialEnded") === "true";
              const sentLocal = parseInt(localStorage.getItem("totalSent") || "0", 10);
              let sent = data.totalSent !== undefined ? Number(data.totalSent) : sentLocal;
              const backendC = data.credits !== undefined ? Number(data.credits) : 0;
              const localC = parseInt(localStorage.getItem("credits") || "0", 10);
              // Non-free user accounts (Subscription flow) without active subscription must be 0 credits
              const effectiveCredits = isFreeUserAccount ? (data.credits !== undefined ? backendC : localC) : (data.isSubscribed ? 99999 : 0);

              if (effectiveCredits <= 0 && sent % 2 !== 0) {
                sent = Math.floor(sent / 2) * 2;
              }

              setCredits(effectiveCredits);
              localStorage.setItem("credits", String(effectiveCredits));
              setIsFreeTrial(isFreeUserAccount && effectiveCredits > 0);
              if (effectiveCredits > 0 && isFreeUserAccount) {
                localStorage.removeItem("freeTrialEnded");
              } else if (!isFreeUserAccount && !data.isSubscribed) {
                localStorage.setItem("freeTrialEnded", "true");
              }

              setTotalSent(sent);
              localStorage.setItem("totalSent", String(sent));
              window.dispatchEvent(new Event("creditsChanged"));
            }
          }
        } catch (err) { console.error("Failed to fetch credits", err); }
      };
      fetchCredits();
    }

    const handleCreditsChange = () => {
      const currentSentNow = parseInt(localStorage.getItem("totalSent") || "0", 10);
      const storedCreds = localStorage.getItem("credits");

      const freeStr = localStorage.getItem("freeUserData");
      if (freeStr) {
        try {
          const f = JSON.parse(freeStr);
          if (f.name) setUserName(f.name);
          if (f.email) setEmail(f.email);
          if (f.phone) setPhone(f.phone);
          if (f.location) setLocation(f.location);
        } catch (e) {}
      } else {
        setUserName(localStorage.getItem("username") || "User");
        setEmail(localStorage.getItem("email") || "No email provided");
        setPhone(localStorage.getItem("phone") || "No phone provided");
        setLocation(localStorage.getItem("location") || "No location provided");
      }

      setTotalSent(currentSentNow);
    };
    window.addEventListener("creditsChanged", handleCreditsChange);
    return () => window.removeEventListener("creditsChanged", handleCreditsChange);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("freeUserToken");
      localStorage.removeItem("freeUserData");
      localStorage.removeItem("username");
      localStorage.removeItem("email");
      localStorage.removeItem("phone");
      localStorage.removeItem("location");
      localStorage.removeItem("credits");
      localStorage.removeItem("isSubscribed");
      localStorage.removeItem("totalSent");
      localStorage.removeItem("freeTrialEnded");
      window.dispatchEvent(new Event("loginStatusChanged"));
      window.dispatchEvent(new Event("freeUserLoginStatusChanged"));
      navigate("/");
    }
  };

  const handleSaveProfile = () => {
    localStorage.setItem("username", userName);
    window.dispatchEvent(new Event("loginStatusChanged"));
    setIsEditing(false);
    alert("Profile updated successfully!");
  };

  const handleAlert = (name) => alert(`Navigating to ${name}...`);

  // Simulate using a credit (1 credit for every 2 messages)
  const handleUseCredit = () => {
    const currentCreds = parseInt(localStorage.getItem("credits") || "0", 10);

    if (currentCreds <= 0 || credits <= 0) {
      setCredits(0);
      setIsFreeTrial(false);
      localStorage.setItem("credits", "0");
      alert("No credits left! Watch a video to earn more.");
      return;
    }

    const newTotalSent = totalSent + 1;
    setTotalSent(newTotalSent);
    localStorage.setItem("totalSent", String(newTotalSent));

    let newCredits = currentCreds;
    if (newTotalSent % 2 === 0) {
      newCredits = Math.max(0, currentCreds - 1);
    }

    setCredits(newCredits);
    localStorage.setItem("credits", String(newCredits));
    setIsFreeTrial(newCredits > 0);

    let freeUserData = null;
    const freeUserDataStr = localStorage.getItem("freeUserData");
    if (freeUserDataStr) {
      try {
        freeUserData = JSON.parse(freeUserDataStr);
        freeUserData.totalSent = newTotalSent;
        freeUserData.credits = newCredits;
        localStorage.setItem("freeUserData", JSON.stringify(freeUserData));
      } catch (e) {}
    }

    const storedEmail = localStorage.getItem("email");
    const freeUserId = freeUserData?.id;

    if (storedEmail || freeUserId) {
      fetch(`${API_BASE_URL}/api/user/sync-usage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: storedEmail, id: freeUserId, credits: newCredits, totalSent: newTotalSent })
      }).catch(err => console.error(err));
    }

    if (newCredits <= 0) {
      setCredits(0);
      setIsFreeTrial(false);
      localStorage.setItem("credits", "0");
      if (freeUserData) {
        freeUserData.credits = 0;
        localStorage.setItem("freeUserData", JSON.stringify(freeUserData));
      }
    }

    window.dispatchEvent(new Event("creditsChanged"));
  };

  // Watch Video Logic
  const handleWatchVideo = () => {
    window.dispatchEvent(new Event("showVideoModal"));
  };

  return (
    <div className="min-h-screen bg-[#07090A] text-[#F5F7F6] font-['Inter'] relative overflow-hidden px-5 py-10 sm:px-8 lg:px-14 lg:py-14">

      <style>{`
        @keyframes goye-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes goye-pulse-ring { 0%, 100% { opacity: .55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.06); } }
        @keyframes goye-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-14px); } }
        @keyframes goye-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .goye-rise { animation: goye-rise .6s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      {/* Ambient mesh background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-32 w-[560px] h-[560px] rounded-full bg-[#1CE0A0] opacity-[0.14] blur-[140px]" style={{ animation: "goye-float 10s ease-in-out infinite" }} />
        <div className="absolute -bottom-52 -right-32 w-[620px] h-[620px] rounded-full bg-[#0E4B3E] opacity-30 blur-[150px]" style={{ animation: "goye-float 12s ease-in-out infinite 1s" }} />
        <div className="absolute top-1/3 right-1/4 w-[380px] h-[380px] rounded-full bg-[#F0B858] opacity-[0.06] blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "56px 56px" }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-10 goye-rise">
          <button onClick={() => navigate(-1)} className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl flex items-center justify-center group-hover:bg-white/[0.08] group-hover:border-[#1CE0A0]/40 transition-all">
              <FiArrowLeft size={18} className="text-[#C9D4CF] group-hover:text-[#1CE0A0] group-hover:-translate-x-0.5 transition-all" />
            </div>
            <span className="text-sm font-medium text-[#8FA39C] group-hover:text-[#E9EFEC] transition-colors hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-2 bg-gradient-to-r from-[#F0B858]/15 to-[#F0B858]/5 border border-[#F0B858]/30 text-[#F0D9A0] px-4 py-2 rounded-full backdrop-blur-xl">
            <FaCrown size={13} className="text-[#F0B858]" />
            <span className="text-xs font-semibold tracking-wide">
              {isSubscribed && !isPlanExpired ? "VIP Premium" : (isFreeUserAccount && isFreeTrial ? "Free Trial" : "Pro Plan (Locked)")}
            </span>
          </div>
        </div>

        {/* Page heading */}
        <div className="mb-8 goye-rise" style={{ animationDelay: "40ms" }}>
          <p className="text-[11px] font-semibold tracking-[0.28em] text-[#1CE0A0] uppercase font-['JetBrains_Mono'] mb-2">Account</p>
          <h1 className="text-4xl sm:text-5xl font-['Sora'] font-bold text-[#F5F7F6] tracking-tight">Your Profile</h1>
          <p className="text-[#8FA39C] mt-2 text-[15px]">Manage your identity, usage, and preferences in one place.</p>
        </div>

        {/* Hero identity strip */}
        <div className="relative rounded-[28px] p-[1px] bg-gradient-to-br from-white/[0.14] via-white/[0.04] to-transparent mb-6 goye-rise" style={{ animationDelay: "80ms" }}>
          <div className="rounded-[27px] bg-gradient-to-br from-white/[0.05] to-white/[0.015] backdrop-blur-2xl px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-7">

              {/* Avatar with glowing VIP border for Subscribed or normal border for Free */}
              <div className="relative shrink-0">
                <div
                  className={`w-28 h-28 rounded-[26px] transition-all duration-500 ${
                    isSubscribed && !isPlanExpired
                      ? "p-[3.5px] bg-gradient-to-br from-[#FFD700] via-[#34E38A] to-[#F59E0B] shadow-[0_0_30px_rgba(255,215,0,0.6),0_0_50px_rgba(52,227,138,0.35)] ring-2 ring-[#FFD700]/70"
                      : "p-[2px] bg-white/[0.08] border border-white/20 shadow-none"
                  }`}
                >
                  <div className="w-full h-full rounded-[23px] bg-[#0B0F0D] flex items-center justify-center">
                    <span
                      className={`text-4xl font-['Sora'] font-bold ${
                        isSubscribed && !isPlanExpired
                          ? "bg-gradient-to-br from-[#FFD700] via-[#FFE57F] to-[#34E38A] bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(255,215,0,0.4)]"
                          : "text-white/80"
                      }`}
                    >
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                {!isEditing ? (
                  isSubscribed && !isPlanExpired ? (
                    <div
                      className="absolute -bottom-2 -right-2 px-2.5 py-1 bg-gradient-to-r from-[#FFD700] to-[#F59E0B] text-black text-[11px] font-black rounded-full flex items-center gap-1 border border-[#FFF0A0] shadow-[0_0_12px_rgba(255,215,0,0.7)]"
                      title="VIP Premium Member"
                    >
                      <FaCrown size={11} className="text-black" />
                      <span>VIP</span>
                    </div>
                  ) : (
                    <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-white/20 rounded-full flex items-center justify-center border-[2px] border-[#07090A]" title="Free Tier Account">
                      <FiCheck size={13} className="text-white/80" strokeWidth={2.5} />
                    </div>
                  )
                ) : (
                  <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#1CE0A0] text-[#052018] rounded-2xl flex items-center justify-center shadow-[0_8px_24px_rgba(28,224,160,0.35)] hover:scale-110 transition-transform">
                    <FiCamera size={17} />
                  </button>
                )}
              </div>

              {/* Name / handle / edit */}
              <div className="flex-1 w-full text-center sm:text-left">
                {!isEditing ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-['Sora'] font-bold text-[#F5F7F6] tracking-tight">{userName}</h2>
                        <p className="text-[#1CE0A0] font-medium mt-1 text-sm font-['JetBrains_Mono']">
                          {isSubscribed && !isPlanExpired ? "@goye_vip" : (isFreeUserAccount ? "@goye_trial" : "@goye_user")}
                        </p>
                      </div>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center justify-center gap-2 bg-white/[0.06] border border-white/10 text-[#E9EFEC] px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-[#1CE0A0]/10 hover:border-[#1CE0A0]/40 hover:text-[#1CE0A0] transition-all"
                      >
                        <FiEdit2 size={15} /> Edit Profile
                      </button>
                    </div>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-5">
                      <span className="text-xs font-medium text-[#8FA39C] bg-white/[0.04] border border-white/[0.06] rounded-full px-3 py-1.5">Messaging tier · Standard</span>
                      <span className="text-xs font-medium text-[#8FA39C] bg-white/[0.04] border border-white/[0.06] rounded-full px-3 py-1.5">Account verified</span>
                      {!isSubscribed && !isFreeUserAccount && (
                        <span className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/25 rounded-full px-3 py-1.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Unsubscribed
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="w-full space-y-4">
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full px-5 py-4 bg-white/[0.04] border-2 border-[#1CE0A0]/30 rounded-2xl focus:outline-none focus:border-[#1CE0A0] font-['Sora'] font-semibold text-center sm:text-left text-xl text-[#F5F7F6] transition-colors"
                    />
                    <div className="flex gap-3">
                      <button onClick={handleSaveProfile} className="flex-1 flex justify-center items-center gap-2 bg-[#1CE0A0] text-[#052018] py-3.5 rounded-2xl font-bold hover:shadow-[0_10px_28px_rgba(28,224,160,0.35)] transition-all">
                        <FiSave size={17} /> Save
                      </button>
                      <button onClick={() => setIsEditing(false)} className="flex-1 flex justify-center items-center gap-2 bg-white/[0.05] border border-white/10 text-[#C9D4CF] py-3.5 rounded-2xl font-bold hover:bg-white/[0.09] transition-all">
                        <FiX size={17} /> Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact rows */}
            <div className="mt-9 pt-8 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-6">
              <DetailItem icon={FiMail} title="Email" value={email} isEditing={isEditing} onChange={setEmail} />
              <DetailItem icon={FiPhone} title="Phone" value={phone} isEditing={isEditing} onChange={setPhone} />
              <DetailItem icon={FiMapPin} title="Location" value={location} isEditing={isEditing} onChange={setLocation} />
            </div>
          </div>
        </div>

        {/* Bento stat grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

          {/* Energy Core — signature element */}
          <div className="goye-rise rounded-[28px] p-[1px] bg-gradient-to-br from-white/[0.14] via-white/[0.04] to-transparent" style={{ animationDelay: "120ms" }}>
            <div className="h-full rounded-[27px] bg-gradient-to-br from-white/[0.05] to-white/[0.015] backdrop-blur-2xl p-6 flex flex-col justify-between text-left relative overflow-hidden">
              {isSubscribed && !isPlanExpired ? (
                <>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#1CE0A0]/20 border border-[#1CE0A0]/40 flex items-center justify-center text-[#1CE0A0] shadow-sm">
                          <FaCrown size={15} />
                        </div>
                        <p className="text-xs font-black tracking-wider text-[#1CE0A0] uppercase font-['JetBrains_Mono']">
                          {(subscriptionPlan || "ONE DAY").toUpperCase()} PLAN ACTIVATED
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#1CE0A0]/20 text-[#1CE0A0] border border-[#1CE0A0]/40 font-mono animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1CE0A0]"></span>
                        ACTIVE
                      </span>
                    </div>

                    <div className="space-y-2 bg-black/40 p-3.5 rounded-2xl border border-white/5 font-mono text-xs">
                      <div className="flex items-center justify-between text-[#8FA39C]">
                        <span className="font-medium text-xs">Start:</span>
                        <span className="text-white font-semibold text-xs">
                          {formatDateTime(getEffectiveStartedAt(subscriptionStartedAt, subscriptionExpiresAt, subscriptionPlan))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[#8FA39C]">
                        <span className="font-medium text-xs">Expires:</span>
                        <span className="text-white font-semibold text-xs">
                          {formatDateTime(subscriptionExpiresAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[#8FA39C]">
                        <span className="font-medium text-xs">Valid for:</span>
                        <span className="text-[#1CE0A0] font-bold text-xs">
                          {getDurationLabel(subscriptionPlan)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-[#8FA39C] font-medium">Status:</span>
                    <span className="text-[#1CE0A0] font-extrabold flex items-center gap-1 font-mono">
                      ✨ {getRemainingTimeText(subscriptionExpiresAt)}
                    </span>
                  </div>

                  {upcomingPlan && (
                    <div className="mt-3 p-3 rounded-2xl bg-[#F0B858]/10 border border-[#F0B858]/30 flex flex-col gap-1.5 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[#F0D9A0] font-bold text-[11px] uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-[#F0B858] animate-pulse" />
                          Queued Next Plan
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#1CE0A0]/20 text-[#1CE0A0] border border-[#1CE0A0]/40 font-bold uppercase text-[10px]">
                          {upcomingPlan}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[#8FA39C]">
                        <span className="font-medium text-[11px]">Auto-activates:</span>
                        <span className="text-white font-semibold text-[11px]">{formatDateTime(upcomingPlanStartsAt)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[#8FA39C]">
                        <span className="font-medium text-[11px]">Valid until:</span>
                        <span className="text-[#1CE0A0] font-semibold text-[11px]">{formatDateTime(upcomingPlanExpiresAt)}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : isPlanExpired && !isFreeUserAccount ? (
                <>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
                          <FaCrown size={15} />
                        </div>
                        <p className="text-xs font-black tracking-wider text-amber-400 uppercase font-['JetBrains_Mono']">
                          {(subscriptionPlan || "ONE DAY").toUpperCase()} PLAN EXPIRED
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/40 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                        EXPIRED
                      </span>
                    </div>

                    <div className="space-y-2 bg-black/40 p-3.5 rounded-2xl border border-white/5 font-mono text-xs">
                      <div className="flex items-center justify-between text-[#8FA39C]">
                        <span className="font-medium text-xs">Start:</span>
                        <span className="text-white/70 font-semibold text-xs">
                          {formatDateTime(getEffectiveStartedAt(subscriptionStartedAt, subscriptionExpiresAt, subscriptionPlan))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[#8FA39C]">
                        <span className="font-medium text-xs">Expires:</span>
                        <span className="text-white/70 font-semibold text-xs">
                          {formatDateTime(subscriptionExpiresAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[#8FA39C]">
                        <span className="font-medium text-xs">Valid for:</span>
                        <span className="text-red-400 font-bold text-xs">
                          {getDurationLabel(subscriptionPlan)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-[#8FA39C] font-medium">Status:</span>
                    <span className="text-red-400 font-bold flex items-center gap-1 font-mono">
                      ✨ Expired
                    </span>
                  </div>
                </>
              ) : (isNewSubscriptionUser && credits === 0) ? (
                <>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm">
                          <FaCrown size={15} />
                        </div>
                        <p className="text-xs font-black tracking-wider text-cyan-400 uppercase font-['JetBrains_Mono']">
                          NO ACTIVE PLAN
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                        INACTIVE
                      </span>
                    </div>

                    <div className="space-y-2 bg-black/40 p-3.5 rounded-2xl border border-white/5 font-mono text-xs">
                      <div className="flex items-center justify-between text-[#8FA39C]">
                        <span className="font-medium text-xs">Start:</span>
                        <span className="text-white/50 font-semibold text-xs">—</span>
                      </div>
                      <div className="flex items-center justify-between text-[#8FA39C]">
                        <span className="font-medium text-xs">Expires:</span>
                        <span className="text-white/50 font-semibold text-xs">—</span>
                      </div>
                      <div className="flex items-center justify-between text-[#8FA39C]">
                        <span className="font-medium text-xs">Valid for:</span>
                        <span className="text-cyan-400 font-bold text-xs">Select a plan</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-[#8FA39C] font-medium">Status:</span>
                    <span className="text-cyan-400 font-bold flex items-center gap-1 font-mono">
                      ✨ Ready to activate
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-center w-full">
                  <p className="text-[11px] font-semibold tracking-[0.24em] text-[#8FA39C] uppercase font-['JetBrains_Mono'] self-start mb-4">Energy Core</p>
                  <EnergyDial credits={credits} max={Math.max(30, credits)} />
                  <p className="text-xs text-[#8FA39C] font-medium mt-3">
                    {credits > 0 ? "One-time free trial credits" : "Recharge to keep sending"}
                  </p>
                  {/* {credits > 0 && (
                    <button
                      onClick={handleUseCredit}
                      className="mt-5 w-full bg-white/[0.05] border border-white/10 text-[#C9D4CF] px-4 py-3 rounded-2xl text-sm font-semibold hover:bg-white/[0.09] hover:border-[#1CE0A0]/30 hover:text-[#1CE0A0] transition-all flex items-center justify-center gap-2"
                    >
                      <FiSend size={15} /> Simulate Send (−1)
                    </button>
                  )} */}
                </div>
              )}
            </div>
          </div>

          {/* Lifetime sent */}
          <div className="goye-rise rounded-[28px] p-[1px] bg-gradient-to-br from-white/[0.14] via-white/[0.04] to-transparent" style={{ animationDelay: "160ms" }}>
            <div className="h-full rounded-[27px] bg-gradient-to-br from-white/[0.05] to-white/[0.015] backdrop-blur-2xl p-7 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#3E8BFF]/10 border border-[#3E8BFF]/20 text-[#6EA8FF] flex items-center justify-center mb-6">
                  <FiActivity size={20} />
                </div>
                <p className="text-[11px] font-semibold tracking-[0.24em] text-[#8FA39C] uppercase font-['JetBrains_Mono'] mb-2">Lifetime Sent</p>
                <h3 className="text-5xl font-['Sora'] font-bold text-[#F5F7F6] tabular-nums">{totalSent}</h3>
              </div>
              <div className="mt-8 flex items-end gap-1.5 h-10">
                {[40, 65, 35, 80, 50, 90, 60].map((h, i) => (
                  <div key={i} className="flex-1 rounded-full bg-gradient-to-t from-[#3E8BFF]/50 to-[#6EA8FF]/10" style={{ height: `${h}%` }} />
                ))}
              </div>
              <p className="text-xs font-medium text-[#8FA39C] mt-3">Messages sent across all time</p>
            </div>
          </div>

          {/* Plan / recharge card */}
          {isSubscribed && !isPlanExpired ? (
            <div className="goye-rise rounded-[28px] bg-gradient-to-br from-[#0B3B2E] via-[#0E4B3E] to-[#1CE0A0] p-7 relative overflow-hidden flex flex-col justify-between hover:-translate-y-1.5 transition-transform duration-300 shadow-[0_15px_40px_rgba(28,224,160,0.2)] border border-[#1CE0A0]/30" style={{ animationDelay: "200ms" }}>
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/[0.18] rounded-full blur-3xl" />
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-6 relative shadow-inner">
                <FaCrown size={22} className="text-[#052018]" />
              </div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#1CE0A0] animate-ping" />
                  <p className="text-emerald-200 font-bold uppercase tracking-[0.2em] text-[11px] font-['JetBrains_Mono']">Active Subscription</p>
                </div>
                <h3 className="text-2xl font-['Sora'] font-black text-white mb-1 tracking-tight">
                  {subscriptionPlan ? `${subscriptionPlan} Plan Activated` : "1 Day Plan Activated"}
                </h3>
                <p className="text-xs text-white/80 font-medium mb-5">
                  {subscriptionExpiresAt ? `Valid until ${new Date(subscriptionExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${new Date(subscriptionExpiresAt).toLocaleDateString()})` : "Active for 24 Hours"}
                </p>
                <div className="bg-white/20 border border-white/30 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-center backdrop-blur-md shadow-lg">
                  ✨ All Features Unlocked
                </div>

                {upcomingPlan && (
                  <div className="mt-4 pt-3.5 border-t border-white/20 flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-100 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
                        Next Plan in Queue:
                      </span>
                      <span className="text-amber-200 font-bold uppercase tracking-wide">
                        {upcomingPlan}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/70">
                      Auto-activates on {new Date(upcomingPlanStartsAt).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date(upcomingPlanStartsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : renewRequested ? (
            <div className="goye-rise rounded-[28px] bg-gradient-to-br from-[#3A2A18] via-[#4A351F] to-[#8C6227] p-7 relative overflow-hidden flex flex-col justify-between hover:-translate-y-1.5 transition-transform duration-300 shadow-[0_15px_40px_rgba(245,158,11,0.2)] border border-amber-500/30" style={{ animationDelay: "200ms" }}>
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/[0.12] rounded-full blur-3xl" />
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-400 mb-6 relative shadow-inner">
                <FaCrown size={22} />
              </div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400 animate-pulse" />
                  <p className="text-amber-300 font-bold uppercase tracking-[0.2em] text-[11px] font-['JetBrains_Mono']">
                    Plan Requested
                  </p>
                </div>
                <h3 className="text-2xl font-['Sora'] font-black text-white mb-1 tracking-tight">
                  Request Submitted!
                </h3>
                <p className="text-xs text-white/80 font-medium mb-5 leading-relaxed">
                  Your request is under review. Admin will activate your plan shortly.
                </p>
                <button
                  disabled={true}
                  className="w-full bg-white/10 border border-amber-400/30 text-amber-300 font-black text-xs uppercase tracking-wider py-3.5 px-5 rounded-2xl text-center shadow-lg flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
                >
                  💳 Plan Request Submitted
                </button>
              </div>
            </div>
          ) : isPlanExpired ? (
            <div className="goye-rise rounded-[28px] bg-gradient-to-br from-[#3A1818] via-[#4A1F1F] to-[#8C2727] p-7 relative overflow-hidden flex flex-col justify-between hover:-translate-y-1.5 transition-transform duration-300 shadow-[0_15px_40px_rgba(239,68,68,0.2)] border border-red-500/30" style={{ animationDelay: "200ms" }}>
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/[0.12] rounded-full blur-3xl" />
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-400 mb-6 relative shadow-inner">
                <FaCrown size={22} />
              </div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500 animate-pulse" />
                  <p className="text-red-200 font-bold uppercase tracking-[0.2em] text-[11px] font-['JetBrains_Mono']">Subscription Expired</p>
                </div>
                <h3 className="text-2xl font-['Sora'] font-black text-white mb-1 tracking-tight">
                  {subscriptionPlan ? `${subscriptionPlan} Plan Expired` : "Plan Expired"}
                </h3>
                <p className="text-xs text-white/80 font-medium mb-5 leading-relaxed">
                  Subscribe to use all features & unlock unlimited messaging.
                </p>
                <button
                  onClick={() => {
                    window.dispatchEvent(new Event("showCreditExhaustedPopup"));
                    const storedEmail = getActiveUserEmail();
                    // Listen for successful request submission
                    const handler = () => {
                      setRenewRequested(true);
                      if (storedEmail) localStorage.setItem(`renewRequested_${storedEmail}`, "true");
                      window.removeEventListener("renewPlanRequested", handler);
                    };
                    window.addEventListener("renewPlanRequested", handler);
                  }}
                  className="w-full bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-wider py-3.5 px-5 rounded-2xl text-center shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  💳 Renew / Upgrade Plan
                </button>
              </div>
            </div>
          ) : isNewSubscriptionUser ? (
            <div className="goye-rise rounded-[28px] bg-gradient-to-br from-[#0B251C] via-[#0E3528] to-[#164D3A] p-7 relative overflow-hidden flex flex-col justify-between hover:-translate-y-1.5 transition-transform duration-300 shadow-[0_15px_40px_rgba(28,224,160,0.15)] border border-[#1CE0A0]/20" style={{ animationDelay: "200ms" }}>
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/[0.12] rounded-full blur-3xl" />
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-[#1CE0A0] mb-6 relative shadow-inner">
                <FaCrown size={22} />
              </div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full shadow-sm animate-pulse ${credits > 0 ? 'bg-green-400 shadow-green-400' : 'bg-cyan-400 shadow-cyan-400'}`} />
                  <p className={`font-bold uppercase tracking-[0.2em] text-[11px] font-['JetBrains_Mono'] ${credits > 0 ? 'text-green-200' : 'text-emerald-200'}`}>
                    {credits > 0 ? "Active Trial" : "Choose a Plan"}
                  </p>
                </div>
                <h3 className="text-2xl font-['Sora'] font-black text-white mb-1 tracking-tight">
                  {credits > 0 ? "Free Trial" : "No Active Plan"}
                </h3>
                <p className="text-xs text-white/80 font-medium mb-5 leading-relaxed">
                  {credits > 0
                    ? "You are currently using free trial credits to access premium tools."
                    : "Subscribe to a plan to unlock WhatsApp bulk messaging, group scraper & all premium tools."}
                </p>
                <button
                  onClick={() => {
                    window.dispatchEvent(new Event("showCreditExhaustedPopup"));
                  }}
                  className="w-full bg-gradient-to-r from-[#25D366] to-[#128C4A] hover:brightness-110 text-black font-black text-xs uppercase tracking-wider py-3.5 px-5 rounded-2xl text-center shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  ✨ {credits > 0 ? "Upgrade Plan" : "Choose a Plan / Upgrade"}
                </button>
              </div>
            </div>
          ) : credits === 0 ? (
            <div className="goye-rise rounded-[28px] bg-gradient-to-br from-[#3A2A6B] to-[#5B3FA0] p-7 relative overflow-hidden flex flex-col justify-between hover:-translate-y-1.5 transition-transform duration-300" style={{ animationDelay: "200ms" }}>
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/[0.12] rounded-full blur-3xl" />
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white mb-6 relative">
                <FiPlayCircle size={22} />
              </div>
              <div className="relative">
                <p className="text-purple-200 font-semibold uppercase tracking-[0.2em] text-[11px] mb-1 font-['JetBrains_Mono']">Out of credits</p>
                <h3 className="text-2xl font-['Sora'] font-bold text-white mb-5">Recharge instantly</h3>
                <button
                  onClick={handleWatchVideo}
                  disabled={isVideoLoading}
                  className="bg-white text-[#5B3FA0] px-5 py-3.5 rounded-2xl font-bold text-sm hover:scale-[1.03] transition-transform w-full shadow-lg flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {isVideoLoading ? "Loading video…" : (<><FiVideo size={17} /> Watch a video</>)}
                </button>
              </div>
            </div>
          ) : (
            <div className="goye-rise rounded-[28px] bg-gradient-to-br from-[#0E4B3E] to-[#1CE0A0] p-7 relative overflow-hidden flex flex-col justify-between hover:-translate-y-1.5 transition-transform duration-300" style={{ animationDelay: "200ms" }}>
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/[0.15] rounded-full blur-3xl" />
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white mb-6 relative">
                <FiStar size={20} />
              </div>
              <div className="relative">
                <p className="text-emerald-100 font-semibold uppercase tracking-[0.2em] text-[11px] mb-1 font-['JetBrains_Mono']">Current plan</p>
                <h3 className="text-2xl font-['Sora'] font-bold text-white mb-5">
                  {isFreeUserAccount ? "Free Starter" : (subscriptionPlan || "Goye Pro")}
                </h3>
                <button 
                  onClick={() => {
                    window.dispatchEvent(new Event("showCreditExhaustedPopup"));
                  }}
                  className="bg-white text-[#0E4B3E] px-5 py-3.5 rounded-2xl font-bold text-sm hover:scale-[1.03] transition-transform w-full shadow-lg cursor-pointer"
                >
                  Upgrade plan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preferences + Logout */}
        <div className="grid grid-cols-1 gap-6">
          <div className="goye-rise rounded-[28px] p-[1px] bg-gradient-to-br from-white/[0.14] via-white/[0.04] to-transparent" style={{ animationDelay: "240ms" }}>
            <div className="rounded-[27px] bg-gradient-to-br from-white/[0.05] to-white/[0.015] backdrop-blur-2xl overflow-hidden">
              <div className="px-7 py-6 border-b border-white/[0.06] flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#C9D4CF]">
                  <FiSettings size={19} />
                </div>
                <div>
                  <h3 className="text-lg font-['Sora'] font-bold text-[#F5F7F6]">Preferences</h3>
                  <p className="text-xs text-[#8FA39C] mt-0.5">Security, alerts, and support</p>
                </div>
              </div>
              <div className="p-3.5 space-y-3">
                {/* Security & Privacy Card */}
                <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-[#1CE0A0]/30 transition-all gap-3">
                  <div className="flex items-center gap-4 text-[#E9EFEC] font-semibold text-[15px]">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#1CE0A0] shrink-0">
                      <FiShield size={16} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white text-sm">Security & Privacy</p>
                      <p className="text-[11px] text-[#8FA39C] font-normal">Active session encryption</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-[10px] font-bold text-[#1CE0A0] bg-[#1CE0A0]/10 border border-[#1CE0A0]/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      🟢 Encrypted
                    </span>
                    <button 
                      type="button"
                      onClick={() => setSecurityLock(!securityLock)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${securityLock ? 'bg-[#1CE0A0]' : 'bg-white/10'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-[#052018] shadow-md transform transition-transform ${securityLock ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                {/* Notifications Card */}
                <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-[#1CE0A0]/30 transition-all gap-3">
                  <div className="flex items-center gap-4 text-[#E9EFEC] font-semibold text-[15px]">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#1CE0A0] shrink-0">
                      <FiBell size={16} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white text-sm">Notifications</p>
                      <p className="text-[11px] text-[#8FA39C] font-normal">Sound & alert popups</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-[10px] font-bold text-white/50 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Sound Alerts
                    </span>
                    <button 
                      type="button"
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${notificationsEnabled ? 'bg-[#1CE0A0]' : 'bg-white/10'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-[#052018] shadow-md transform transition-transform ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                {/* Help & Support Card */}
                <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-[#1CE0A0]/30 transition-all gap-3">
                  <div className="flex items-center gap-4 text-[#E9EFEC] font-semibold text-[15px]">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#1CE0A0] shrink-0">
                      <FiHelpCircle size={16} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white text-sm">Help & Support</p>
                      <p className="text-[11px] text-[#8FA39C] font-normal">Report issue or feedback</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('openSupportModal'))}
                    className="self-end sm:self-center px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-extrabold text-xs rounded-xl shadow-[0_4px_14px_rgba(37,211,102,0.3)] hover:scale-105 transition-transform flex items-center gap-1.5 cursor-pointer"
                  >
                    💬 Get Support
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="goye-rise w-full flex justify-between items-center bg-gradient-to-br from-white/[0.05] to-white/[0.015] backdrop-blur-2xl p-6 rounded-[27px] border border-white/[0.08] hover:border-[#FF5C6C]/40 hover:shadow-[0_15px_40px_rgba(255,92,108,0.12)] transition-all group"
            style={{ animationDelay: "280ms" }}
          >
            <div className="flex items-center gap-5 text-[#FF8993] font-bold text-lg">
              <div className="w-12 h-12 bg-[#FF5C6C]/10 border border-[#FF5C6C]/20 rounded-2xl flex items-center justify-center group-hover:bg-[#FF5C6C] group-hover:text-white transition-colors">
                <FiLogOut size={20} />
              </div>
              Log out securely
            </div>
            <FiChevronRight size={22} className="text-[#5C6D67] group-hover:text-[#FF5C6C] group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Signature element — circular credits gauge with orbiting glow      */
/* ------------------------------------------------------------------ */
function EnergyDial({ credits, max = 30 }) {
  const pct = Math.max(0, Math.min(1, credits / max));
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);
  const depleted = credits <= 0;

  return (
    <div className="relative w-[152px] h-[152px]">
      {/* ambient glow */}
      <div
        className="absolute inset-2 rounded-full blur-2xl"
        style={{
          background: depleted ? "#FF5C6C" : "#1CE0A0",
          opacity: 0.28,
          animation: "goye-pulse-ring 3s ease-in-out infinite"
        }}
      />
      <svg viewBox="0 0 140 140" className="w-full h-full relative">
        <defs>
          <linearGradient id="goye-dial-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={depleted ? "#FF8993" : "#1CE0A0"} />
            <stop offset="100%" stopColor={depleted ? "#B23A46" : "#0E9E78"} />
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke="url(#goye-dial-gradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(.16,1,.3,1)" }}
        />
      </svg>

      {/* orbiting particle */}
      {!depleted && (
        <div className="absolute inset-0" style={{ animation: "goye-spin 6s linear infinite" }}>
          <div className="absolute top-[3px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#8FE8C8] shadow-[0_0_10px_2px_rgba(28,224,160,0.7)]" />
        </div>
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <FiZap size={13} className={depleted ? "text-[#FF8993] mb-1" : "text-[#1CE0A0] mb-1"} />
        <span className="text-3xl font-['JetBrains_Mono'] font-bold text-[#F5F7F6] tabular-nums leading-none">{credits}</span>
        <span className="text-[10px] text-[#8FA39C] font-medium mt-1">of {max} credits</span>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, title, value, isEditing, onChange }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-11 h-11 shrink-0 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#1CE0A0]">
        <Icon size={17} />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-[10px] font-semibold text-[#8FA39C] uppercase tracking-[0.2em] font-['JetBrains_Mono'] mb-1">{title}</p>
        {!isEditing ? (
          <p className="text-[15px] font-semibold text-[#E9EFEC] truncate">{value}</p>
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 font-medium text-sm text-[#F5F7F6] focus:outline-none focus:border-[#1CE0A0]/50 transition-colors"
          />
        )}
      </div>
    </div>
  );
}

function SettingRow({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.04] transition-colors group">
      <div className="flex items-center gap-4 text-[#E9EFEC] font-semibold text-[15px]">
        <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#8FA39C] group-hover:text-[#1CE0A0] group-hover:border-[#1CE0A0]/30 transition-colors">
          <Icon size={16} />
        </div>
        {label}
      </div>
      <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center text-[#5C6D67] group-hover:bg-[#1CE0A0] group-hover:text-[#052018] transition-colors">
        <FiChevronRight size={16} />
      </div>
    </button>
  );
}