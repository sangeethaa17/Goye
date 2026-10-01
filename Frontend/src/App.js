import './App.css';
import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './User-Component/Navbar';
import UserLogin from './User-Component/userlogin';
import Register from './User-Component/register';
import AdminLogin from './Admin-Component/adminlogin';
import WhatsAppAuth from './WhatsAppAuth'; 
import About from './About';
import Subscriptions from './Subscriptions';
import Contact from './Contact'; 
import Profile from './User-Component/profile';
import WebScraper from './User-Component/WebScraper';
 import SocialExtractor from './User-Component/SocialExtractor';
// import History from './History';
import GroupManagement from './GroupManagement';
import AdminUsers from './Admin-Component/AdminUsers';
import AdminFreeUsers from './Admin-Component/AdminFreeUsers';
import JoinTeamPage from './User-Component/JoinTeamPage';
import StarBackground from './User-Component/StarBackground';

import AdminDashboard from './Admin-Component/admindashboard';
import AdminSidebar from './Admin-Component/AdminSidebar';
import AdminRequest from './Admin-Component/adminrequest';
import { NotificationProvider } from './context/NotificationContext';
import FreeUserLogin from './free-user/FreeUserLogin';
import FreeUserRegister from './free-user/FreeUserRegister';
import FreeUserHome from './free-user/FreeUserHome';
import { FaCheck, FaTimes, FaWhatsapp, FaPlay, FaFilm, FaLock, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import QRCode from 'react-qr-code';
import API_BASE_URL from './config';

// Keeps the browser's address bar always showing "/Goye", regardless of
// which page is actually being rendered underneath. This only rewrites
// what's displayed in the URL bar via history.replaceState — it does NOT
// go through React Router's own navigation, so React Router's internal
// location state (what every page/component actually reads to know which
// route it's on) is completely unaffected. All existing routing, active-
// link highlighting, admin-page checks, and the Messages panel logic
// keep working exactly as before.
function UrlMask() {
  const location = useLocation();

  useEffect(() => {
    if (
      window.location.pathname !== "/whatsapp-bulk-message-sender" && 
      !window.location.pathname.includes("/join-team") && 
      !window.location.pathname.includes("/join_team") &&
      !window.location.pathname.includes("free-user") &&
      !window.location.pathname.includes("admin")
    ) {
      window.history.replaceState(
        window.history.state,
        "",
        "/whatsapp-bulk-message-sender" +
          window.location.search +
          window.location.hash
      );
    }
  }, [location]);

  return null;
}

function LayoutManager() {
  const location = useLocation();
  const isAdminPage = (location.pathname.includes("goye-admin") || location.pathname.includes("adminrequest")) && !location.pathname.includes("login");
  const isLoginPage = location.pathname.includes("goye-admin-login") || location.pathname.includes("adminlogin") || location.pathname.includes("admin-login");

  const ResolvedNavbar = typeof Navbar === 'function' ? Navbar : (Navbar?.default || Navbar);
  const ResolvedAdminSidebar = typeof AdminSidebar === 'function' ? AdminSidebar : (AdminSidebar?.default || AdminSidebar);

  if (isLoginPage) return null;
  if (isAdminPage) return <ResolvedAdminSidebar />;
  return <ResolvedNavbar />;
}

function CreditLimitGuard({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [credits, setCredits] = useState(() => {
    const stored = localStorage.getItem("credits");
    return stored !== null ? Math.max(0, parseInt(stored, 10)) : 0;
  });
  const [isSubscribed, setIsSubscribed] = useState(() => localStorage.getItem("isSubscribed") === "true");

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showFreeUserWelcomeModal, setShowFreeUserWelcomeModal] = useState(() => {
    const email = (localStorage.getItem("freeUserEmail") || localStorage.getItem("email") || "").toLowerCase().trim();
    const hasSeen = email && localStorage.getItem(`hasSeenWelcome_${email}`) === "true";
    return !hasSeen && sessionStorage.getItem("showFreeUserWelcome") === "true";
  });
  const [isFreezeDismissed, setIsFreezeDismissed] = useState(false);
  const [isExplicitlyTriggered, setIsExplicitlyTriggered] = useState(false);
  const isExplicitlyTriggeredRef = useRef(false);
  const [modalPlan, setModalPlan] = useState(null);
  const [modalCategory, setModalCategory] = useState('all');
  const [activeModalTab, setActiveModalTab] = useState('options');
  const [requestFormData, setRequestFormData] = useState({ name: '', email: '', message: '' });

  const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [confirmError, setConfirmError] = useState('');
  const [confirmSuccess, setConfirmSuccess] = useState('');

  const [hasPendingRequest, setHasPendingRequest] = useState(() => {
    let storedEmail = localStorage.getItem("email") || localStorage.getItem("userEmail") || localStorage.getItem("freeUserEmail") || "";
    if (!storedEmail) {
      try {
        const fData = JSON.parse(localStorage.getItem("freeUserData") || "{}");
        if (fData.email) storedEmail = fData.email;
      } catch (e) {}
    }
    return !!storedEmail && localStorage.getItem(`renewRequested_${storedEmail}`) === "true";
  });

  useEffect(() => {
    const isFreeUserActive = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");
    if (isFreeUserActive) return;

    let storedEmail = localStorage.getItem("email") || localStorage.getItem("userEmail") || "";
    if (!storedEmail) return;

    const apiBase = process.env.REACT_APP_API_URL || "https://goyeorg.onrender.com";

    const syncLiveStatus = () => {
      const isFreeUserSession = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");
      if (isFreeUserSession) return;

      // 1. Check if user's subscription was approved live (and still valid!)
      fetch(`${apiBase}/api/user/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: storedEmail })
      })
      .then(r => r.json())
      .then(uData => {
        if (!uData) return;

        const isStillValid = Boolean(
          uData.isSubscribed &&
          (
            (!uData.subscriptionExpiresAt || new Date(uData.subscriptionExpiresAt).getTime() > Date.now()) ||
            (uData.upcomingPlanExpiresAt && new Date(uData.upcomingPlanExpiresAt).getTime() > Date.now())
          )
        );

        if (isStillValid) {
          localStorage.setItem("isSubscribed", "true");
          localStorage.setItem("credits", "99999");
          if (uData.subscriptionPlan) localStorage.setItem("subscriptionPlan", uData.subscriptionPlan);
          if (uData.subscriptionStartedAt) localStorage.setItem("subscriptionStartedAt", uData.subscriptionStartedAt);
          if (uData.subscriptionExpiresAt) localStorage.setItem("subscriptionExpiresAt", uData.subscriptionExpiresAt);
          if (uData.upcomingPlan) localStorage.setItem("upcomingPlan", uData.upcomingPlan);
          if (uData.upcomingPlanStartsAt) localStorage.setItem("upcomingPlanStartsAt", uData.upcomingPlanStartsAt);
          if (uData.upcomingPlanExpiresAt) localStorage.setItem("upcomingPlanExpiresAt", uData.upcomingPlanExpiresAt);
          setCredits(99999);
          setIsSubscribed(true);
          setHasPendingRequest(false);
          localStorage.removeItem(`renewRequested_${storedEmail}`);
          window.dispatchEvent(new Event("creditsChanged"));
        } else {
          localStorage.setItem("isSubscribed", "false");
          localStorage.removeItem("subscriptionPlan");
          if (uData.subscriptionExpiresAt) {
            localStorage.setItem("subscriptionExpiresAt", uData.subscriptionExpiresAt);
          }
          setIsSubscribed(false);
        }
      })
      .catch(() => {});

      // 2. Check pending requests status
      fetch(`${apiBase}/api/subscription-requests`)
        .then(r => r.json())
        .then(data => {
          if (data && Array.isArray(data.requests)) {
            const isPending = data.requests.some(
              r => r.email && r.email.toLowerCase().trim() === storedEmail.toLowerCase().trim() && r.status === "pending"
            );
            const currentExpStr = localStorage.getItem("subscriptionExpiresAt");
            const isExpired = currentExpStr && currentExpStr !== "null" && new Date(currentExpStr).getTime() <= Date.now();

            if (isPending && !isExpired) {
              setHasPendingRequest(true);
              localStorage.setItem(`renewRequested_${storedEmail}`, "true");
            } else {
              setHasPendingRequest(false);
              localStorage.removeItem(`renewRequested_${storedEmail}`);
            }
          }
        })
        .catch(() => {});
    };

    // Run immediately
    syncLiveStatus();

    // Auto-poll every 3 seconds so approval unlocks the screen live without refreshing!
    const pollInterval = setInterval(syncLiveStatus, 3000);

    // Also sync on window focus when user switches back from Admin tab
    window.addEventListener("focus", syncLiveStatus);

    const handler = () => {
      setHasPendingRequest(true);
      if (storedEmail) localStorage.setItem(`renewRequested_${storedEmail}`, "true");
      syncLiveStatus();
    };
    window.addEventListener("renewPlanRequested", handler);
    window.addEventListener("gy:subscription-request-created", handler);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("focus", syncLiveStatus);
      window.removeEventListener("renewPlanRequested", handler);
      window.removeEventListener("gy:subscription-request-created", handler);
    };
  }, [location.pathname]);

  useEffect(() => {
    const handleOpenPlans = () => setShowPlansModal(true);
    window.addEventListener("gy:open-plans-modal", handleOpenPlans);
    return () => window.removeEventListener("gy:open-plans-modal", handleOpenPlans);
  }, []);

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const isFreeUserLoggedIn = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");
  const anyUserLoggedIn = isLoggedIn || isFreeUserLoggedIn;

  const path = location.pathname;
  const isProtectedFeature = 
    path === "/web-scraper" || 
    path === "/group-management" ||
    path === "/social-extractor";

  const isUnprotectedPath = !isProtectedFeature;

  const planDetails = {
    demo: {
      name: 'Demo Access',
      price: '₹0',
      credits: 'Duration: Free Trial',
      color: '#00F5D4',
      colorClass: 'text-[#00F5D4]',
      borderClass: 'border-[#00F5D4]/40',
      glowClass: 'shadow-[0_0_50px_rgba(0,245,212,0.3)]',
      iconBg: 'bg-[#00F5D4]/10 text-[#00F5D4] border-[#00F5D4]/20',
      buttonBg: 'bg-gradient-to-r from-[#00F5D4] to-[#25D366] text-black font-extrabold',
      subTextClass: 'text-[#00F5D4]/80',
      badgeClass: 'bg-[#00F5D4]/10 border-[#00F5D4]/20 text-[#00F5D4]',
      accentGlow: 'hover:border-[#00F5D4]/50 hover:shadow-[0_0_25px_rgba(0,245,212,0.25)]',
      hoverText: 'hover:text-[#00F5D4]'
    },
    oneDay: {
      name: 'One Day',
      price: '₹49',
      credits: 'Duration: 1 Day (24h)',
      color: '#34D399',
      colorClass: 'text-emerald-400',
      borderClass: 'border-emerald-400/30',
      glowClass: 'shadow-[0_0_40px_rgba(52,211,153,0.2)]',
      iconBg: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
      buttonBg: 'bg-emerald-400 hover:bg-emerald-500 text-black font-extrabold',
      subTextClass: 'text-emerald-400/80',
      badgeClass: 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400',
      accentGlow: 'hover:border-emerald-400/50 hover:shadow-[0_0_20px_rgba(52,211,153,0.2)]',
      hoverText: 'hover:text-emerald-400'
    },
    oneWeek: {
      name: 'One Week',
      price: '₹249',
      credits: 'Duration: 7 Days',
      color: '#38bdf8',
      colorClass: 'text-sky-400',
      borderClass: 'border-sky-400/30',
      glowClass: 'shadow-[0_0_40px_rgba(56,189,248,0.2)]',
      iconBg: 'bg-sky-400/10 text-sky-400 border-sky-400/20',
      buttonBg: 'bg-sky-400 hover:bg-sky-500 text-black font-extrabold',
      subTextClass: 'text-sky-400/80',
      badgeClass: 'bg-sky-400/10 border-sky-400/20 text-sky-400',
      accentGlow: 'hover:border-sky-400/50 hover:shadow-[0_0_20px_rgba(56,189,248,0.2)]',
      hoverText: 'hover:text-sky-400'
    },
    fifteenDays: {
      name: '15 Days',
      price: '₹499',
      credits: 'Duration: 15 Days',
      color: '#fb923c',
      colorClass: 'text-orange-400',
      borderClass: 'border-orange-400/30',
      glowClass: 'shadow-[0_0_40px_rgba(251,146,60,0.2)]',
      iconBg: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
      buttonBg: 'bg-orange-400 hover:bg-orange-500 text-black font-extrabold',
      subTextClass: 'text-orange-400/80',
      badgeClass: 'bg-orange-400/10 border-orange-400/20 text-orange-400',
      accentGlow: 'hover:border-orange-400/50 hover:shadow-[0_0_20px_rgba(251,146,60,0.2)]',
      hoverText: 'hover:text-orange-400'
    },
    oneMonth: {
      name: 'One Month',
      price: '₹799',
      credits: 'Duration: 30 Days',
      color: '#34E38A',
      colorClass: 'text-[#34E38A]',
      borderClass: 'border-[#34E38A]/50',
      glowClass: 'shadow-[0_0_50px_rgba(52,227,138,0.25)]',
      iconBg: 'bg-[#34E38A]/15 text-[#34E38A] border-[#34E38A]/30',
      buttonBg: 'bg-[#34E38A] hover:bg-[#22db91] text-black font-extrabold',
      subTextClass: 'text-[#34E38A]/90',
      badgeClass: 'bg-[#34E38A] text-black font-extrabold',
      accentGlow: 'hover:border-[#34E38A]/50 hover:shadow-[0_0_20px_rgba(52,227,138,0.2)]',
      hoverText: 'hover:text-[#34E38A]'
    },
    threeMonths: {
      name: 'Three Months',
      price: '₹1,999',
      credits: 'Duration: 3 Months',
      color: '#22d3ee',
      colorClass: 'text-cyan-400',
      borderClass: 'border-cyan-400/30',
      glowClass: 'shadow-[0_0_40px_rgba(34,211,238,0.18)]',
      iconBg: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
      buttonBg: 'bg-cyan-400 hover:bg-cyan-500 text-black font-extrabold',
      subTextClass: 'text-cyan-400/80',
      badgeClass: 'bg-cyan-400/10 border-cyan-400/20 text-cyan-400',
      accentGlow: 'hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]',
      hoverText: 'hover:text-cyan-400'
    },
    sixMonths: {
      name: 'Six Months',
      price: '₹3,499',
      credits: 'Duration: 6 Months',
      color: '#a855f7',
      colorClass: 'text-purple-400',
      borderClass: 'border-purple-400/30',
      glowClass: 'shadow-[0_0_40px_rgba(168,85,247,0.18)]',
      iconBg: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
      buttonBg: 'bg-purple-400 hover:bg-purple-500 text-white font-extrabold',
      subTextClass: 'text-purple-400/80',
      badgeClass: 'bg-purple-400/10 border-purple-400/20 text-purple-400',
      accentGlow: 'hover:border-purple-400/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]',
      hoverText: 'hover:text-purple-400'
    },
    oneYear: {
      name: 'One Year',
      price: '₹5,499',
      credits: 'Duration: 1 Year',
      color: '#f59e0b',
      colorClass: 'text-amber-400',
      borderClass: 'border-amber-400/30',
      glowClass: 'shadow-[0_0_40px_rgba(245,158,11,0.2)]',
      iconBg: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
      buttonBg: 'bg-amber-400 hover:bg-amber-500 text-black font-extrabold',
      subTextClass: 'text-amber-400/80',
      badgeClass: 'bg-amber-400/10 border-amber-400/20 text-amber-400',
      accentGlow: 'hover:border-amber-400/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]',
      hoverText: 'hover:text-amber-400'
    },
    eighteenMonths: {
      name: '18 Months',
      price: '₹7,299',
      credits: 'Duration: 18 Months',
      color: '#f43f5e',
      colorClass: 'text-rose-400',
      borderClass: 'border-rose-400/30',
      glowClass: 'shadow-[0_0_40px_rgba(244,63,94,0.2)]',
      iconBg: 'bg-rose-400/10 text-rose-400 border-rose-400/20',
      buttonBg: 'bg-rose-400 hover:bg-rose-500 text-white font-extrabold',
      subTextClass: 'text-rose-400/80',
      badgeClass: 'bg-rose-400/10 border-rose-400/20 text-rose-400',
      accentGlow: 'hover:border-rose-400/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)]',
      hoverText: 'hover:text-rose-400'
    }
  };

  const handleCloseConfirmModal = () => {
    setShowPaymentConfirmModal(false);
    setConfirmError('');
    setConfirmSuccess('');
    setUpiId('');
    setScreenshotFile(null);
    setScreenshotPreview(null);
  };

  const handleScreenshotUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setConfirmError('Please upload an image file');
        return;
      }
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setConfirmError('');
    }
  };

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    const cleanUpiId = upiId.trim();
    if (!cleanUpiId) {
      setConfirmError('Please enter your UPI ID');
      return;
    }
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9]{2,64}$/;
    if (!upiRegex.test(cleanUpiId)) {
      setConfirmError('Please enter a valid UPI ID.');
      return;
    }
    if (!screenshotFile && !screenshotPreview) {
      setConfirmError('Please upload your payment screenshot');
      return;
    }

    try {
      let userEmail = localStorage.getItem("email") || localStorage.getItem("userEmail") || "";
      let userName = localStorage.getItem("username") || localStorage.getItem("name") || "";

      if (!userEmail) {
        try {
          const freeUserData = JSON.parse(localStorage.getItem("freeUserData") || "{}");
          if (freeUserData.email) {
            userEmail = freeUserData.email;
            userName = userName || freeUserData.name || freeUserData.username || "";
          }
        } catch (err) {}
      }

      if (!userEmail) {
        try {
          const userObj = JSON.parse(localStorage.getItem("user") || "{}");
          if (userObj.email) {
            userEmail = userObj.email;
            userName = userName || userObj.name || userObj.username || "";
          }
        } catch (err) {}
      }

      if (!userEmail) {
        userEmail = "user@goye.com";
      }
      if (!userName) {
        userName = userEmail.split('@')[0] || "User";
      }

      const planName = (modalPlan && planDetails[modalPlan] && planDetails[modalPlan].name) || "One Day";
      const planPrice = (modalPlan && planDetails[modalPlan] && planDetails[modalPlan].price) || "₹49";

      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://goyeorg.onrender.com';
      const response = await fetch(`${apiBaseUrl}/api/subscription-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          plan: planName,
          amount: planPrice,
          upiId: cleanUpiId,
          screenshot: screenshotPreview,
          message: `QR Payment via UPI (${cleanUpiId})`
        })
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success !== false) {
        setConfirmError('');
        setConfirmSuccess('Payment details captured successfully');
        setHasPendingRequest(true);
        if (userEmail) localStorage.setItem(`renewRequested_${userEmail}`, 'true');
        window.dispatchEvent(new Event('gy:subscription-request-created'));
        window.dispatchEvent(new Event('renewPlanRequested'));
      } else {
        setConfirmError(data.message || 'Failed to submit payment details. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting payment details:', err);
      setConfirmError('Network error. Please try again.');
    }
  };

  const closePlanModal = () => {
    setModalPlan(null);
    setActiveModalTab('options');
    setRequestFormData({ name: '', email: '', message: '' });
    handleCloseConfirmModal();
  };

  // --- Adsterra Watch Video Ad State & Logic ---
  const ADSTERRA_DIRECT_LINK = "https://www.profitableratecpmnetwork.com/baxcy83m5?key=477cf55ce0678f7ab33dcb6987e6f359";
  const [adState, setAdState] = useState('IDLE'); // 'IDLE' | 'WATCHING' | 'COMPLETED' | 'CLAIMED'
  const [adTimer, setAdTimer] = useState(15);
  // Helper: Get user-specific key for storing watched video counts independently per account
  const getUserKey = () => {
    const email = localStorage.getItem("email") || localStorage.getItem("freeUserEmail") || "default_user";
    return email.replace(/[^a-zA-Z0-9]/g, "_");
  };

  const getUserWatchedCount = () => {
    const userKey = getUserKey();
    const today = new Date().toISOString().split('T')[0];
    const lastDateKey = `lastVideoWatchDate_${userKey}`;
    const countKey = `videosWatchedToday_${userKey}`;
    const lastDate = localStorage.getItem(lastDateKey);
    if (lastDate !== today) {
      localStorage.setItem(lastDateKey, today);
      localStorage.setItem(countKey, "0");
      return 0;
    }
    return parseInt(localStorage.getItem(countKey) || "0", 10);
  };

  const [adWatchedCount, setAdWatchedCount] = useState(getUserWatchedCount);

  const [adError, setAdError] = useState('');

  // Countdown timer effect
  useEffect(() => {
    let interval = null;
    if (adState === 'WATCHING' && adTimer > 0) {
      interval = setInterval(() => {
        setAdTimer(prev => prev - 1);
      }, 1000);
    } else if (adState === 'WATCHING' && adTimer === 0) {
      setAdState('COMPLETED');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [adState, adTimer]);

  const handleStartWatchAd = () => {
    setAdError('');
    const count = getUserWatchedCount();
    if (count >= 5) {
      alert("🔒 Daily limit reached! You have already watched 5/5 ad videos today. Please come back tomorrow!");
      return;
    }

    // Start 15s In-Page Adsterra Sponsored Poster Flow (No New Tab!)
    setAdTimer(15);
    setAdState('WATCHING');
  };

  const handleClaimAdReward = () => {
    const userKey = getUserKey();
    const today = new Date().toISOString().split('T')[0];
    const lastDateKey = `lastVideoWatchDate_${userKey}`;
    const countKey = `videosWatchedToday_${userKey}`;

    let count = getUserWatchedCount();
    const newCount = Math.min(5, count + 1);

    localStorage.setItem(lastDateKey, today);
    localStorage.setItem(countKey, String(newCount));
    setAdWatchedCount(newCount);

    // Add +4 credits per video watched
    const currentCredits = parseInt(localStorage.getItem("credits") || "0", 10);
    const newCredits = currentCredits + 4;
    const totalSent = parseInt(localStorage.getItem("totalSent") || "0", 10);
    localStorage.setItem("credits", String(newCredits));
    localStorage.removeItem("freeTrialEnded");
    const freeStr = localStorage.getItem("freeUserData");
    if (freeStr) {
      try {
        const f = JSON.parse(freeStr);
        f.credits = newCredits;
        f.totalSent = totalSent;
        localStorage.setItem("freeUserData", JSON.stringify(f));
      } catch (e) {}
    }
    setCredits(newCredits);

    // Broadcast event so UI updates immediately
    window.dispatchEvent(new Event("creditsChanged"));

    // Also sync backend DB if user email or freeUserId exists
    let userEmail = localStorage.getItem("email") || localStorage.getItem("freeUserEmail") || "";
    let freeUserId = null;
    try {
      const f = JSON.parse(localStorage.getItem("freeUserData") || "{}");
      if (!userEmail && f.email) userEmail = f.email;
      if (f.id) freeUserId = f.id;
    } catch (e) {}

    if (userEmail || freeUserId) {
      const apiBase = API_BASE_URL;
      fetch(`${apiBase}/api/user/add-credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, id: freeUserId, amount: 4, exactCredits: newCredits, totalSent })
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.success && typeof data.credits === 'number') {
          localStorage.setItem("credits", String(data.credits));
          setCredits(data.credits);
          const fStr = localStorage.getItem("freeUserData");
          if (fStr) {
            try {
              const parsed = JSON.parse(fStr);
              parsed.credits = data.credits;
              localStorage.setItem("freeUserData", JSON.stringify(parsed));
            } catch (_) {}
          }
          window.dispatchEvent(new Event("creditsChanged"));
        }
      })
      .catch(() => {});
    }

    setAdState('CLAIMED');
    setIsFreezeDismissed(true);
    setIsExplicitlyTriggered(false);
  };

  useEffect(() => {
    const updateLocalCredits = () => {
      const stored = localStorage.getItem("credits");
      const c = stored !== null ? Math.max(0, parseInt(stored, 10)) : 0;
      const sub = localStorage.getItem("isSubscribed") === "true";
      const expDate = localStorage.getItem("subscriptionExpiresAt");
      const isSubExpired = (expDate && expDate !== "null" && new Date(expDate).getTime() <= Date.now()) || (localStorage.getItem("lastExpiredPlan") || localStorage.getItem("subscriptionPlan")) && !sub;
      const isFree = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");

      setCredits(c);
      setIsSubscribed(sub);
      if (!isExplicitlyTriggeredRef.current && (sub || (c > 0 && isFree && !isSubExpired))) {
        setIsFreezeDismissed(true);
      }
      setAdWatchedCount(getUserWatchedCount());
    };

    const handleShowFreeze = () => {
      isExplicitlyTriggeredRef.current = true;
      setIsExplicitlyTriggered(true);
      setIsFreezeDismissed(false);
    };

    const handleFreeUserWelcome = () => {
      const email = (localStorage.getItem("freeUserEmail") || localStorage.getItem("email") || "").toLowerCase().trim();
      const hasSeen = email && localStorage.getItem(`hasSeenWelcome_${email}`) === "true";
      if (!hasSeen) {
        setShowFreeUserWelcomeModal(true);
      }
    };

    const handleOpenVideoModal = () => {
      setShowVideoModal(true);
    };

    updateLocalCredits();
    window.addEventListener("creditsChanged", updateLocalCredits);
    window.addEventListener("subscriptionActivated", updateLocalCredits);
    window.addEventListener("freeUserLoginStatusChanged", updateLocalCredits);
    window.addEventListener("loginStatusChanged", updateLocalCredits);
    window.addEventListener("showCreditExhaustedPopup", handleShowFreeze);
    window.addEventListener("showFreeUserWelcomePopup", handleFreeUserWelcome);
    window.addEventListener("showVideoModal", handleOpenVideoModal);

    return () => {
      window.removeEventListener("creditsChanged", updateLocalCredits);
      window.removeEventListener("subscriptionActivated", updateLocalCredits);
      window.removeEventListener("freeUserLoginStatusChanged", updateLocalCredits);
      window.removeEventListener("loginStatusChanged", updateLocalCredits);
      window.removeEventListener("showCreditExhaustedPopup", handleShowFreeze);
      window.removeEventListener("showFreeUserWelcomePopup", handleFreeUserWelcome);
      window.removeEventListener("showVideoModal", handleOpenVideoModal);
    };
  }, []);

  useEffect(() => {
    setIsExplicitlyTriggered(false);
    const isMsg = location.pathname === "/" || location.pathname === "/home" || location.pathname.includes("whatsapp-bulk-message-sender");
    if (isProtectedFeature || isMsg) {
      setIsFreezeDismissed(false);
    }
    const welcomeEmail = (localStorage.getItem("freeUserEmail") || localStorage.getItem("email") || "").toLowerCase().trim();
    const hasSeenWelcome = welcomeEmail && localStorage.getItem(`hasSeenWelcome_${welcomeEmail}`) === "true";
    if (
      !hasSeenWelcome &&
      (location.state?.showFreeUserWelcome || sessionStorage.getItem("showFreeUserWelcome") === "true")
    ) {
      setShowFreeUserWelcomeModal(true);
    }
  }, [location.pathname, location.state, isProtectedFeature]);

  useEffect(() => {
    if (modalPlan) {
      const username = localStorage.getItem("username") || "";
      const email = localStorage.getItem("email") || "";
      setRequestFormData(prev => ({
        ...prev,
        name: username,
        email: email
      }));
    }
  }, [modalPlan]);

  const isSubscriptionActive = () => {
    const expiresAt = localStorage.getItem("subscriptionExpiresAt");
    const isSub = localStorage.getItem("isSubscribed") === "true";
    if (expiresAt && expiresAt !== "null") {
      const expTime = new Date(expiresAt).getTime();
      if (!isNaN(expTime)) {
        return isSub && expTime > Date.now();
      }
    }
    return isSub;
  };

  const expDateVal = localStorage.getItem("subscriptionExpiresAt");
  const isPlanDurationExpired = !!(
    expDateVal &&
    expDateVal !== "null" &&
    !isNaN(new Date(expDateVal).getTime()) &&
    new Date(expDateVal).getTime() <= Date.now()
  );
  const hasSubHistory = Boolean(
    isPlanDurationExpired ||
    localStorage.getItem("subscriptionPlan") ||
    localStorage.getItem("lastExpiredPlan") ||
    localStorage.getItem("subscriptionStartedAt") ||
    (expDateVal && expDateVal !== "null")
  );
  const currentStoredEmail = localStorage.getItem("email") || localStorage.getItem("userEmail") || "";
  const isFreshRenewPending = hasPendingRequest && !!currentStoredEmail && localStorage.getItem(`renewRequested_${currentStoredEmail}`) === "true";

  const isSubscribedActive = isSubscriptionActive();
  const isFreeUser = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");
  const isMessagingPage = path === "/" || path === "/home" || path.includes("whatsapp-bulk-message-sender");
  const isProtectedRestricted = !isSubscribedActive && isProtectedFeature;
  const isExpiredSubscribedUser = anyUserLoggedIn && !isFreeUser && (isPlanDurationExpired || hasSubHistory) && !isSubscribedActive;

  const isExhausted = anyUserLoggedIn && !isFreeUser && !isSubscribedActive && credits <= 0;

  // ROCK-SOLID FREEZE:
  // If subscribed user's plan is expired -> permanently freeze Messages, Web Scraper, Group Scraper, Social Leads!
  const shouldFreezeApp = isExpiredSubscribedUser
    ? (isMessagingPage || isProtectedFeature)
    : ((isExhausted && (isProtectedFeature || isMessagingPage)) || isProtectedRestricted || isExplicitlyTriggered);

  // Expired subscribed users can NEVER dismiss the freeze popup!
  const effectiveFreezeDismissed = isExpiredSubscribedUser ? false : isFreezeDismissed;

  useEffect(() => {
    if (shouldFreezeApp && !effectiveFreezeDismissed) {
      document.body.style.overflowX = 'hidden';
    } else {
      document.body.style.overflowX = '';
    }
    return () => {
      document.body.style.overflowX = '';
    };
  }, [shouldFreezeApp, effectiveFreezeDismissed]);

  const showCreditLimitReached = isSubscribedActive && !isPlanDurationExpired && credits <= 0;
  const isChoosePlanMode = !isFreshRenewPending && (!showCreditLimitReached || isPlanDurationExpired || !isSubscribedActive);
  const isExpiredUserMode = !isFreshRenewPending && (isPlanDurationExpired || hasSubHistory) && !isSubscribedActive;
  const isFreshNewUserMode = !isFreshRenewPending && !isExpiredUserMode && !hasSubHistory && !isSubscribedActive;

  return (
    <>
      {/* Background Page Content (No longer blurred to allow Navbar interactions) */}
      <div className="w-full overflow-x-hidden max-w-[100vw]">
        {children}
      </div>

      {/* Floating Reopen Pill when user closes the freeze popup on protected page */}
      {isProtectedFeature && shouldFreezeApp && effectiveFreezeDismissed && (
        <button
          onClick={() => setIsFreezeDismissed(false)}
          className="fixed bottom-6 right-6 z-[99998] bg-[#25D366] text-black font-black py-3.5 px-6 rounded-full shadow-[0_4px_30px_rgba(37,211,102,0.5)] flex items-center gap-2.5 text-sm hover:scale-105 transition-all cursor-pointer animate-bounce"
        >
          <span>🔒</span> Upgrade Plan
        </button>
      )}

      {/* Main Freeze Popup Modal with Blurred Backdrop */}
      {shouldFreezeApp && !effectiveFreezeDismissed && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 text-center animate-fade-in overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
          {/* Ambient Background Glow (Constrained so it cannot overflow) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-[#25D366]/15 rounded-full blur-3xl pointer-events-none overflow-hidden" />
          
          {/* Main Freeze Card */}
          <div className="bg-[#0E1613]/95 border border-[#25D366]/35 rounded-3xl p-8 sm:p-12 max-w-lg w-full shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative z-10 backdrop-blur-2xl flex flex-col items-center">
            
            {/* Top Right Close Button for voluntary modal view */}
            {(!isExpiredSubscribedUser || isFreeUser) && (
              <button
                type="button"
                onClick={() => {
                  setIsFreezeDismissed(true);
                  setIsExplicitlyTriggered(false);
                  isExplicitlyTriggeredRef.current = false;
                }}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 text-white/40 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <FaTimes className="text-base" />
              </button>
            )}

            {/* Warning Lock / Status Icon */}
            {isFreshRenewPending ? (
              <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-inner text-amber-400 animate-pulse">
                ⏳
              </div>
            ) : isFreeUser && credits > 0 ? (
              <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-inner text-emerald-400 animate-pulse">
                🚀
              </div>
            ) : isFreeUser ? (
              <div className="w-20 h-20 bg-purple-500/10 border border-purple-500/30 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-inner text-purple-400 animate-pulse">
                ⚡
              </div>
            ) : (
              <div className="w-20 h-20 bg-[#25D366]/10 border border-[#25D366]/30 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-inner text-[#25D366] animate-pulse">
                🔒
              </div>
            )}

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight leading-snug">
              {isFreshRenewPending
                ? "Plan Request Under Review"
                : isFreeUser && credits > 0
                  ? "Supercharge Your Messaging! 🚀"
                  : isFreeUser
                    ? "Out of Free Credits! ⚡"
                    : isExpiredUserMode
                      ? "Your plan has expired."
                      : isChoosePlanMode
                        ? "Choose a plan to continue."
                        : (
                          <>
                            <div className="block">You reached your credit limit.</div>
                            <div className="block">Choose a plan to continue.</div>
                          </>
                        )}
            </h2>

            <p className="text-sm text-white/50 mb-8 font-medium max-w-xs mx-auto text-center">
              {isFreshRenewPending
                ? "Your subscription request is currently under review by Admin. Your plan will be activated shortly."
                : isFreeUser && credits > 0
                  ? "Upgrade to a Pro Plan for unlimited messaging & premium features, or watch a video to recharge."
                  : isFreeUser
                    ? "You have used all your free credits. Upgrade to a Pro Plan for unlimited messaging & premium features, or watch a video to recharge."
                    : isExpiredUserMode
                      ? "Your subscription validity has ended. Renew your plan to unlock messaging and continue using all premium features."
                      : isChoosePlanMode
                        ? "You haven't selected a plan yet. Choose a plan and subscribe to unlock messaging and premium features."
                        : "You have completely used all your free credits. Upgrade your plan to unlock messaging & all premium features."}
            </p>

            <div className="w-full flex flex-col gap-3.5">
              {isFreshRenewPending ? (
                <>
                  {/* Button 1: Plan Requested (Pending Admin Approval) */}
                  <button
                    disabled={true}
                    className="w-full py-4 bg-amber-500/15 border border-amber-500/40 text-amber-300 font-extrabold rounded-2xl text-base flex items-center justify-center gap-2 cursor-not-allowed opacity-90 shadow-[0_4px_20px_rgba(245,158,11,0.2)]"
                  >
                    <span>⏳</span> Plan Requested (Waiting for Admin Approval)
                  </button>
                </>
              ) : isFreeUser ? (
                <>
                  {/* Free User Primary: Upgrade to Pro Plans (Highlighted First) */}
                  <button
                    onClick={() => {
                      setIsFreezeDismissed(true);
                      setIsExplicitlyTriggered(false);
                      isExplicitlyTriggeredRef.current = false;
                      setShowPlansModal(true);
                    }}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 via-[#25D366] to-emerald-400 hover:brightness-110 text-black font-extrabold rounded-2xl transition-all duration-300 shadow-[0_6px_25px_rgba(37,211,102,0.45)] text-base active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>✨</span> Upgrade to Pro Plans
                  </button>

                  {/* Free User Secondary: Watch Video to Recharge */}
                  <button
                    onClick={() => {
                      setIsFreezeDismissed(true);
                      setIsExplicitlyTriggered(false);
                      isExplicitlyTriggeredRef.current = false;
                      setShowVideoModal(true);
                    }}
                    className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-purple-200 border border-purple-500/40 hover:border-purple-400 font-bold rounded-2xl transition-all duration-300 text-sm active:scale-95 cursor-pointer flex items-center justify-center gap-2.5"
                  >
                    <span>🎬</span> Watch Video to Recharge (+4 Credits)
                  </button>

                  <div className="mt-3 flex flex-col items-center">
                    <p className="text-xs text-white/50 font-medium mb-1">For any queries, contact admin.</p>
                    <p className="text-sm text-white font-bold">Admin: 9943042369</p>
                  </div>
                </>
              ) : (
                <>
                  {/* Subscription Portal: View Plans / Renew Plan / Upgrade Plan */}
                  <button
                    onClick={() => setShowPlansModal(true)}
                    className="w-full py-4 bg-[#25D366] hover:bg-[#128C4A] text-black font-extrabold rounded-2xl transition-all duration-300 shadow-[0_4px_20px_rgba(37,211,102,0.4)] text-base active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>✨</span> {isExpiredUserMode ? "Renew Plan" : (!isChoosePlanMode ? "Upgrade Plan" : "View Plans")}
                  </button>

                  {isFreshNewUserMode && (
                    <div className="mt-2 flex flex-col items-center">
                      <p className="text-xs text-white/40 mb-1.5">Or else, to continue with the free</p>
                      <button
                        onClick={() => {
                          setIsFreezeDismissed(true);
                          setIsExplicitlyTriggered(false);
                          navigate("/free-user/login");
                        }}
                        className="text-[#25D366] text-sm font-semibold underline hover:text-white transition-colors cursor-pointer mb-5"
                      >
                        Continue with Free
                      </button>
                    </div>
                  )}

                  <div className={`${isFreshNewUserMode ? "" : "mt-4"} flex flex-col items-center`}>
                    <p className="text-xs text-white/50 font-medium mb-1">For any queries, contact admin.</p>
                    <p className="text-sm text-white font-bold">Admin: 9943042369</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

          {/* --- POPUP 0: Free User Welcome & Credit Guide Modal --- */}
          {showFreeUserWelcomeModal && (
            <div 
              className="fixed inset-0 z-[100005] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 animate-fade-in text-left overflow-y-auto"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <div 
                className="bg-[#0B1510]/95 border border-[#25D366]/40 rounded-[32px] p-6 sm:p-10 max-w-xl w-full relative shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(37,211,102,0.2)] backdrop-blur-2xl overflow-hidden my-auto"
              >
                {/* Ambient glow in corner */}
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#25D366]/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#00F5D4]/15 rounded-full blur-3xl pointer-events-none" />

                {/* Top Close Button (✖) - Closes Welcome Popup */}
                <button 
                  onClick={() => {
                    const email = (localStorage.getItem("freeUserEmail") || localStorage.getItem("email") || "").toLowerCase().trim();
                    if (email) localStorage.setItem(`hasSeenWelcome_${email}`, "true");
                    setShowFreeUserWelcomeModal(false);
                    sessionStorage.removeItem("showFreeUserWelcome");
                  }}
                  className="absolute top-5 right-5 text-white/50 hover:text-white p-2.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer z-10"
                  title="Close"
                >
                  <FaTimes className="text-base" />
                </button>

                {/* Header Badge & Title */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 uppercase font-mono">
                    <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                    Free User Tier
                  </span>
                  <span className="text-xs text-white/50 font-medium font-mono">• 30 Trial Credits</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                  Welcome to <span className="text-[#25D366]">Goye!</span> 🎉
                </h2>
                <p className="text-xs sm:text-sm text-white/70 font-medium mb-6 leading-relaxed">
                  Here is a quick overview of how your free credits and feature recharge work:
                </p>

                {/* 4 Feature Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {/* Card 1: 30 Free Trial */}
                  <div className="bg-white/[0.03] border border-[#25D366]/25 rounded-2xl p-4 transition-all hover:bg-white/[0.06] hover:border-[#25D366]/50">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-[#25D366]/20 flex items-center justify-center text-[#25D366] text-sm font-bold">
                        🎁
                      </div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">30 Free Credits</h4>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed font-medium">
                      One-time trial credits automatically activated to your account instantly.
                    </p>
                  </div>

                  {/* Card 2: Daily 10 Refill */}
                  <div className="bg-white/[0.03] border border-cyan-400/25 rounded-2xl p-4 transition-all hover:bg-white/[0.06] hover:border-cyan-400/50">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-cyan-400/20 flex items-center justify-center text-cyan-300 text-sm font-bold">
                        🔄
                      </div>
                      <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">Daily 10 Refill</h4>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed font-medium">
                      Credits reset back to 10 free credits every single day when you log in.
                    </p>
                  </div>

                  {/* Card 3: Watch Videos */}
                  <div className="bg-white/[0.03] border border-purple-400/25 rounded-2xl p-4 transition-all hover:bg-white/[0.06] hover:border-purple-400/50">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-400/20 flex items-center justify-center text-purple-300 text-sm font-bold">
                        🎬
                      </div>
                      <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider font-mono">Watch Videos</h4>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed font-medium">
                      Ran out of credits? Watch short sponsored videos anytime for instant free recharges.
                    </p>
                  </div>

                  {/* Card 4: Pro Subscription */}
                  <div className="bg-white/[0.03] border border-amber-400/25 rounded-2xl p-4 transition-all hover:bg-white/[0.06] hover:border-amber-400/50">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-300 text-sm font-bold">
                        👑
                      </div>
                      <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">Pro Plans</h4>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed font-medium">
                      Upgrade for unlimited messages, Web Scraper, Group Scrapper &amp; Team features!
                    </p>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="space-y-3 mt-1">
                  {/* Primary CTA: View Plans (Full Width & Prominent) */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlansModal(true);
                    }}
                    className="w-full py-3.5 sm:py-4 px-6 bg-gradient-to-r from-[#25D366] via-[#22c55e] to-[#128C7E] hover:opacity-95 text-black font-black rounded-2xl text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-[0_6px_25px_rgba(37,211,102,0.4)] hover:shadow-[0_8px_32px_rgba(37,211,102,0.6)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>✨</span>
                    <span>VIEW PLANS</span>
                  </button>

                  {/* Secondary CTA: Start Sending Messages */}
                  <button
                    type="button"
                    onClick={() => {
                      const email = (localStorage.getItem("freeUserEmail") || localStorage.getItem("email") || "").toLowerCase().trim();
                      if (email) localStorage.setItem(`hasSeenWelcome_${email}`, "true");
                      setShowFreeUserWelcomeModal(false);
                      sessionStorage.removeItem("showFreeUserWelcome");
                      if (location.pathname !== "/") {
                        navigate("/", { state: { openMessages: true } });
                      } else {
                        window.dispatchEvent(new Event("gy:open-messages"));
                      }
                    }}
                    className="w-full py-3.5 px-6 rounded-2xl bg-white/[0.04] hover:bg-[#25D366]/15 border border-[#25D366]/30 hover:border-[#25D366]/60 text-[#34E38A] hover:text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-[0_0_25px_rgba(37,211,102,0.25)] hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span>💬</span>
                    <span>START SENDING MESSAGES →</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- POPUP 1: Adsterra Watch Video Ad Modal --- */}
          {showVideoModal && (
            <div 
              onClick={() => {
                if (adState !== 'WATCHING') {
                  setShowVideoModal(false);
                  setAdState('IDLE');
                }
              }}
              className="fixed inset-0 z-[100020] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in text-left"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0E1613] border border-[#25D366]/40 rounded-3xl p-6 sm:p-9 max-w-md w-full text-center relative shadow-[0_0_60px_rgba(37,211,102,0.25)] backdrop-blur-2xl overflow-hidden"
              >
                {/* Ambient glows */}
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#25D366]/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

                <button 
                  onClick={() => {
                    setShowVideoModal(false);
                    setAdState('IDLE');
                    setAdTimer(15);
                    setIsFreezeDismissed(true);
                    setIsExplicitlyTriggered(false);
                  }}
                  className="absolute top-4 right-4 text-white/40 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-20"
                >
                  <FaTimes className="text-base" />
                </button>

                {/* Header Icon */}
                <div className="w-16 h-16 bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner">
                  {adState === 'CLAIMED' ? '🎉' : (adState === 'COMPLETED' ? '🎁' : (adState === 'WATCHING' ? '⏳' : '🎬'))}
                </div>

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-bold mb-3">
                  <span>✨ Reward: +4 Credits</span>
                  <span className="text-white/40">|</span>
                  <span>Daily: {adWatchedCount}/5 Watched</span>
                </div>

                <h3 className="text-2xl font-extrabold text-white mb-2 font-['Sora']">
                  {adState === 'CLAIMED'
                    ? "Credits Added!"
                    : (adState === 'COMPLETED'
                        ? "Ad Completed!"
                        : (adState === 'WATCHING'
                            ? "Watching Ad Video..."
                            : "Watch Ad Video (+4 Credits)"))}
                </h3>

                <p className="text-xs sm:text-sm text-white/60 leading-relaxed mb-6 font-medium max-w-xs mx-auto">
                  {adState === 'CLAIMED'
                    ? `🎉 Successfully added +4 Credits to your account! (${adWatchedCount}/5 videos watched today).`
                    : (adState === 'COMPLETED'
                        ? "Thank you for watching the ad! Click below to claim your 4 free credits."
                        : (adState === 'WATCHING'
                            ? "Please keep the ad tab open for 15 seconds to unlock your 4 credits."
                            : "Watch a short ad video to receive 4 free messaging credits. Maximum 5 videos per day."))}
                </p>

                {/* Action Area */}
                {adState === 'IDLE' && (
                  adWatchedCount >= 5 ? (
                    <button
                      disabled={true}
                      className="w-full py-3.5 bg-white/10 border border-white/20 text-white/50 font-extrabold rounded-xl text-sm cursor-not-allowed"
                    >
                      🔒 Daily Limit Reached (5/5 Videos Watched Today)
                    </button>
                  ) : (
                    <button
                      onClick={handleStartWatchAd}
                      className="w-full py-4 bg-gradient-to-r from-[#25D366] to-[#128C4A] hover:brightness-110 text-black font-extrabold rounded-xl transition-all shadow-[0_4px_20px_rgba(37,211,102,0.4)] text-base active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>🎬</span> Watch Video Ad (+4 Credits)
                    </button>
                  )
                )}

                {adError && (
                  <div className="w-full mb-4 p-3.5 bg-red-500/15 border border-red-500/40 text-red-300 rounded-xl text-xs text-center font-medium">
                    ⚠️ {adError}
                    <button
                      onClick={handleStartWatchAd}
                      className="mt-2.5 w-full py-2 bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white font-bold rounded-lg text-xs tracking-wider"
                    >
                      🚀 Open Ad Page Again
                    </button>
                  </div>
                )}

                {adState === 'WATCHING' && (
                  <div className="w-full flex flex-col gap-3.5 my-1">
                    {/* Official Adsterra Banner Poster Frame from /adsterra.html */}
                    <div className="w-full min-h-[265px] bg-[#07130b] border border-[#25D366]/40 rounded-2xl overflow-hidden relative shadow-[0_10px_35px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center p-2 text-center">
                      {/* Shimmer / Skeleton Loader behind the iframe */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#07170e] to-[#030d07] p-4 z-0 pointer-events-none">
                        <div className="relative flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full border-3 border-[#25D366]/20 border-t-[#25D366] animate-spin shadow-[0_0_15px_rgba(37,211,102,0.4)]" />
                          <span className="absolute text-base">🎬</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-bold text-[#25D366] animate-pulse tracking-wide flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-ping inline-block" />
                            Loading Sponsor Ad...
                          </span>
                          <span className="text-[11px] text-white/45 font-medium">
                            Please wait a moment while video connects
                          </span>
                        </div>
                      </div>

                      <iframe
                        src="/adsterra.html"
                        title="Advertisement"
                        width="300"
                        height="250"
                        scrolling="no"
                        className="relative z-10"
                        style={{
                          border: 0,
                          display: "block",
                          width: "300px",
                          height: "250px",
                          overflow: "hidden",
                          background: "transparent"
                        }}
                      />
                    </div>

                    {/* Live 15s Countdown Timer Bar */}
                    <div className="w-full py-3 bg-amber-500/15 border border-amber-500/40 text-amber-300 font-extrabold rounded-xl text-base flex flex-col items-center justify-center gap-1 shadow-lg">
                      <div className="text-2xl font-mono font-black text-[#25D366]">
                        ⏳ 00:{adTimer < 10 ? `0${adTimer}` : adTimer}
                      </div>
                      <span className="text-xs text-amber-200/90 font-medium">
                        Adsterra Ad Playing... Please wait 15 seconds!
                      </span>
                    </div>
                  </div>
                )}

                {adState === 'COMPLETED' && (
                  <button
                    onClick={handleClaimAdReward}
                    className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-black rounded-xl transition-all shadow-[0_4px_25px_rgba(245,158,11,0.4)] text-base animate-pulse cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>🎁</span> Claim +4 Free Credits
                  </button>
                )}

                {adState === 'CLAIMED' && (
                  <div className="w-full flex flex-col gap-4 my-2">
                    <div className="w-full p-5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-extrabold rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg text-center">
                      <div className="text-3xl mb-0.5">🎉</div>
                      <h4 className="text-lg font-extrabold text-white">4 Credits Added to Account!</h4>
                      <p className="text-xs text-emerald-200/90 font-medium leading-relaxed">
                        Successfully added +4 messaging credits to your account. ({adWatchedCount}/5 videos watched today).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- POPUP 2: Floating In-Page "View Plans" Modal --- */}
          {showPlansModal && (
            <div 
              onClick={() => setShowPlansModal(false)}
              className="fixed inset-0 z-[100020] flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in text-left"
            >
              {/* Modal Box Container */}
              <div 
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-6xl max-h-[92vh] sm:max-h-[90vh] bg-[#0c1511]/95 border border-[#25D366]/35 rounded-2xl sm:rounded-[32px] shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden backdrop-blur-2xl"
              >
                {/* Sticky Modal Header */}
                <div className="flex items-center justify-between px-4 sm:px-10 py-3.5 sm:py-5 border-b border-white/10 bg-[#0c1511]/90 backdrop-blur-md z-10 shrink-0">
                  <div>
                    <h2 className="text-lg sm:text-3xl font-black text-white tracking-tight">
                      Choose Your <span className="text-[#25D366]">Plan</span>
                    </h2>
                    <p className="text-[11px] sm:text-sm text-white/50 font-medium mt-0.5">
                      Choose the plan that fits your messaging needs.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPlansModal(false)}
                    className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-200 border border-white/10 flex items-center justify-center shadow-lg cursor-pointer shrink-0"
                    title="Close"
                  >
                    <FaTimes className="text-sm sm:text-base" />
                  </button>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex justify-start sm:justify-center pt-3 sm:pt-6 pb-2 px-3 sm:px-6 shrink-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <div className="bg-[#0a120d] border border-[#25D366]/30 rounded-full p-1 sm:p-1.5 shadow-md inline-flex items-center gap-1 sm:gap-2 backdrop-blur-xl select-none shrink-0">
                    <button
                      type="button"
                      onClick={() => setModalCategory('daily')}
                      className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
                        modalCategory === 'daily'
                          ? 'bg-gradient-to-r from-[#25D366] to-[#128C7E] text-black shadow-[0_4px_15px_rgba(37,211,102,0.4)] scale-105'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      <span>⚡</span> Daily Plans
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalCategory('monthly')}
                      className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
                        modalCategory === 'monthly'
                          ? 'bg-gradient-to-r from-[#25D366] to-[#128C7E] text-black shadow-[0_4px_15px_rgba(37,211,102,0.4)] scale-105'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      <span>🚀</span> Monthly Plans
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalCategory('yearly')}
                      className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
                        modalCategory === 'yearly'
                          ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C5A028] text-black shadow-[0_4px_15px_rgba(212,175,55,0.35)] scale-105'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      <span>👑</span> Yearly Plans
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalCategory('all')}
                      className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
                        modalCategory === 'all'
                          ? 'bg-gradient-to-r from-[#25D366] to-[#128C7E] text-black shadow-[0_4px_15px_rgba(37,211,102,0.4)] scale-105'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      All Plans
                    </button>
                  </div>
                </div>

                {/* Scrollable Modal Interior */}
                <div className="overflow-y-auto px-3 sm:px-10 py-4 sm:py-6 flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {/* Plans Grid (3 Cards Per Row) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 w-full mb-6">
                    {[
                      {
                        key: 'demo',
                        title: 'SPARK',
                        subtitle: 'Try Goye for free with 30 welcome credits.',
                        price: 'FREE',
                        duration: 'Duration: Demo Access',
                        category: 'daily',
                        isDemo: true,
                        features: [
                          '30 Instant Welcome Credits',
                          'Bulk WhatsApp Messaging',
                          'Smart Instant & Scheduled Campaigns',
                          'Quick QR Code Device Sync',
                          'Real-Time Live Delivery Reports',
                          'Get 10 Credits Daily',
                          'Direct Help & Support Button',
                          '24/7 Admin Support',
                        ]
                      },
                      {
                        key: 'oneDay',
                        title: 'MERCURY',
                        subtitle: 'Try everything out for a single day.',
                        price: '₹49',
                        duration: 'Duration: 1 Day (24 Hours)',
                        category: 'daily',
                        features: [
                          'Limitless Bulk WhatsApp Messaging',
                          'Unlimited Web Scraping',
                          'Infinite Group Scraping',
                          'Unrestricted Scheduled Campaigns',
                          'Endless Team Campaigns & Team Split',
                          'Instant Team Join via Room Code',
                          'Live Team Activity & Progress Tracker',
                          'Real-Time Live Delivery Reports',
                          'Quick QR Code Device Sync',
                          '24/7 Smart AI Auto-Reply Chatbot',
                          'One-Click WhatsApp Group Member Extractor',
                          'Individual Contact Extraction',
                          'Seamless Group-to-Excel Data Export',
                          'Targeted City & Category Business Finder',
                          'Instant Campaign Launch for Scraped Leads',
                          'Multi-Platform Scraping',
                          'City/Location Targeting',
                          'Verified Business Email Extraction',
                          'Complete Contact Details',
                          'Easy Pause & Resume Controls',
                          'Direct Social Media Profile Links',
                          'Admin Support',
                        ]
                      },
                      {
                        key: 'oneWeek',
                        title: 'MARS',
                        subtitle: 'Perfect for short-term projects & campaigns.',
                        price: '₹249',
                        duration: 'Duration: 7 Days',
                        category: 'daily',
                        features: [
                          'Limitless Bulk WhatsApp Messaging',
                          'Unlimited Web Scraping',
                          'Infinite Group Scraping',
                          'Unrestricted Scheduled Campaigns',
                          'Endless Team Campaigns & Team Split',
                          'Instant Team Join via Room Code',
                          'Live Team Activity & Progress Tracker',
                          'Real-Time Live Delivery Reports',
                          'Quick QR Code Device Sync',
                          '24/7 Smart AI Auto-Reply Chatbot',
                          'One-Click WhatsApp Group Member Extractor',
                          'Individual Contact Extraction',
                          'Seamless Group-to-Excel Data Export',
                          'Targeted City & Category Business Finder',
                          'Instant Campaign Launch for Scraped Leads',
                          'Multi-Platform Scraping',
                          'City/Location Targeting',
                          'Verified Business Email Extraction',
                          'Complete Contact Details',
                          'Easy Pause & Resume Controls',
                          'Direct Social Media Profile Links',
                          '24/7 Admin Support',
                        ]
                      },
                      {
                        key: 'fifteenDays',
                        title: 'VENUS',
                        subtitle: 'Great value for bi-weekly marketing needs.',
                        price: '₹499',
                        duration: 'Duration: 15 Days',
                        category: 'monthly',
                        features: [
                          'Limitless Bulk WhatsApp Messaging',
                          'Unlimited Web Scraping',
                          'Infinite Group Scraping',
                          'Unrestricted Scheduled Campaigns',
                          'Endless Team Campaigns & Team Split',
                          'Instant Team Join via Room Code',
                          'Live Team Activity & Progress Tracker',
                          'Real-Time Live Delivery Reports',
                          'Quick QR Code Device Sync',
                          '24/7 Smart AI Auto-Reply Chatbot',
                          'One-Click WhatsApp Group Member Extractor',
                          'Individual Contact Extraction',
                          'Seamless Group-to-Excel Data Export',
                          'Targeted City & Category Business Finder',
                          'Instant Campaign Launch for Scraped Leads',
                          'Multi-Platform Scraping',
                          'City/Location Targeting',
                          'Verified Business Email Extraction',
                          'Complete Contact Details',
                          'Easy Pause & Resume Controls',
                          'Direct Social Media Profile Links',
                          '24/7 Admin Support',
                        ]
                      },
                      {
                        key: 'oneMonth',
                        title: 'EARTH',
                        subtitle: 'The most popular way to get started.',
                        price: '₹799',
                        duration: 'Duration: 30 Days',
                        category: 'monthly',
                        isPopular: true,
                        features: [
                          'Limitless Bulk WhatsApp Messaging',
                          'Unlimited Web Scraping',
                          'Infinite Group Scraping',
                          'Unrestricted Scheduled Campaigns',
                          'Instant Team Join via Room Code',
                          'Live Team Activity & Progress Tracker',
                          'Endless Team Campaigns & Team Split',
                          'Real-Time Live Delivery Reports',
                          'Quick QR Code Device Sync',
                          '24/7 Smart AI Auto-Reply Chatbot',
                          'One-Click WhatsApp Group Member Extractor',
                          'Individual Contact Extraction',
                          'Seamless Group-to-Excel Data Export',
                          'Targeted City & Category Business Finder',
                          'Instant Campaign Launch for Scraped Leads',
                          'Multi-Platform Scraping',
                          'City/Location Targeting',
                          'Verified Business Email Extraction',
                          'Complete Contact Details',
                          'Easy Pause & Resume Controls',
                          'Direct Social Media Profile Links',
                          'Priority Admin Support',
                        ]
                      },
                      {
                        key: 'threeMonths',
                        title: 'NEPTUNE',
                        subtitle: 'Save more with a quarterly plan.',
                        price: '₹1,999',
                        duration: 'Duration: 3 Months',
                        category: 'monthly',
                        features: [
                          'Limitless Bulk WhatsApp Messaging',
                          'Unlimited Web Scraping',
                          'Infinite Group Scraping',
                          'Unrestricted Scheduled Campaigns',
                          'Endless Team Campaigns & Team Split',
                          'Instant Team Join via Room Code',
                          'Live Team Activity & Progress Tracker',
                          'Real-Time Live Delivery Reports',
                          'Quick QR Code Device Sync',
                          '24/7 Smart AI Auto-Reply Chatbot',
                          'One-Click WhatsApp Group Member Extractor',
                          'Individual Contact Extraction',
                          'Seamless Group-to-Excel Data Export',
                          'Targeted City & Category Business Finder',
                          'Instant Campaign Launch for Scraped Leads',
                          'Multi-Platform Scraping',
                          'City/Location Targeting',
                          'Verified Business Email Extraction',
                          'Complete Contact Details',
                          'Easy Pause & Resume Controls',
                          'Direct Social Media Profile Links',
                          '24/7 Admin Support',
                        ]
                      },
                      {
                        key: 'sixMonths',
                        title: 'URANUS',
                        subtitle: 'Half a year of uninterrupted access.',
                        price: '₹3,499',
                        duration: 'Duration: 6 Months',
                        category: 'yearly',
                        features: [
                          'Limitless Bulk WhatsApp Messaging',
                          'Unlimited Web Scraping',
                          'Infinite Group Scraping',
                          'Unrestricted Scheduled Campaigns',
                          'Endless Team Campaigns & Team Split',
                          'Instant Team Join via Room Code',
                          'Live Team Activity & Progress Tracker',
                          'Real-Time Live Delivery Reports',
                          'Quick QR Code Device Sync',
                          '24/7 Smart AI Auto-Reply Chatbot',
                          'One-Click WhatsApp Group Member Extractor',
                          'Individual Contact Extraction',
                          'Seamless Group-to-Excel Data Export',
                          'Targeted City & Category Business Finder',
                          'Instant Campaign Launch for Scraped Leads',
                          'Multi-Platform Scraping',
                          'City/Location Targeting',
                          'Verified Business Email Extraction',
                          'Complete Contact Details',
                          'Easy Pause & Resume Controls',
                          'Direct Social Media Profile Links',
                          '24/7 Admin Support',
                        ]
                      },
                      {
                        key: 'oneYear',
                        title: 'SATURN',
                        subtitle: 'The best value for long-term use.',
                        price: '₹5,499',
                        duration: 'Duration: 1 Year',
                        category: 'yearly',
                        isGolden: true,
                        features: [
                          'Limitless Bulk WhatsApp Messaging',
                          'Unlimited Web Scraping',
                          'Infinite Group Scraping',
                          'Unrestricted Scheduled Campaigns',
                          'Instant Team Join via Room Code',
                          'Live Team Activity & Progress Tracker',
                          'Endless Team Campaigns & Team Split',
                          'Real-Time Live Delivery Reports',
                          'Quick QR Code Device Sync',
                          '24/7 Smart AI Auto-Reply Chatbot',
                          'One-Click WhatsApp Group Member Extractor',
                          'Individual Contact Extraction',
                          'Seamless Group-to-Excel Data Export',
                          'Targeted City & Category Business Finder',
                          'Instant Campaign Launch for Scraped Leads',
                          'Multi-Platform Scraping',
                          'City/Location Targeting',
                          'Verified Business Email Extraction',
                          'Complete Contact Details',
                          'Easy Pause & Resume Controls',
                          'Direct Social Media Profile Links',
                          'VIP Admin Support',
                        ]
                      },
                      {
                        key: 'eighteenMonths',
                        title: 'JUPITER',
                        subtitle: 'Maximum savings for scaling businesses.',
                        price: '₹7,299',
                        duration: 'Duration: 18 Months',
                        category: 'yearly',
                        features: [
                          'Limitless Bulk WhatsApp Messaging',
                          'Unlimited Web Scraping',
                          'Infinite Group Scraping',
                          'Unrestricted Scheduled Campaigns',
                          'Endless Team Campaigns & Team Split',
                          'Instant Team Join via Room Code',
                          'Live Team Activity & Progress Tracker',
                          'Real-Time Live Delivery Reports',
                          'Quick QR Code Device Sync',
                          '24/7 Smart AI Auto-Reply Chatbot',
                          'One-Click WhatsApp Group Member Extractor',
                          'Individual Contact Extraction',
                          'Seamless Group-to-Excel Data Export',
                          'Targeted City & Category Business Finder',
                          'Instant Campaign Launch for Scraped Leads',
                          'Multi-Platform Scraping',
                          'City/Location Targeting',
                          'Verified Business Email Extraction',
                          'Complete Contact Details',
                          'Easy Pause & Resume Controls',
                          'Direct Social Media Profile Links',
                          '24/7 VIP Admin Support',
                        ]
                      }
                    ]
                    .filter(plan => modalCategory === 'all' || plan.category === modalCategory)
                    .map(plan => {
                      const storedCredits = localStorage.getItem("credits");
                      const numCredits = storedCredits !== null ? parseInt(storedCredits, 10) : 0;
                      const freeTrialEnded = localStorage.getItem("freeTrialEnded") === "true";
                      const isFreeUser = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");
                      const activeSubPlan = (localStorage.getItem("subscriptionPlan") || "").toLowerCase();
                      
                      const isDemoActive = plan.isDemo && (isFreeUser && numCredits > 0 && !freeTrialEnded && !isSubscribed);
                      const isPaidPlanActive = !plan.isDemo && isSubscribed && (activeSubPlan === plan.key.toLowerCase() || activeSubPlan === plan.title.toLowerCase());
                      const isPlanActive = isDemoActive || isPaidPlanActive;
                      
                      let cardStyle = "bg-[#06140b] border border-[#25D366]/40 hover:border-[#25D366] hover:shadow-[0_0_30px_rgba(37,211,102,0.25)] shadow-[0_10px_35px_rgba(0,0,0,0.6)]";
                      if (plan.isGolden) {
                        cardStyle = "bg-[#06140b] border-2 border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.35)] hover:shadow-[0_0_40px_rgba(212,175,55,0.5)]";
                      } else if (plan.isPopular) {
                        cardStyle = "bg-[#06140b] border-2 border-[#25D366] shadow-[0_0_30px_rgba(37,211,102,0.35)] hover:shadow-[0_0_45px_rgba(37,211,102,0.5)]";
                      }

                      return (
                        <div
                          key={plan.key}
                          onClick={() => {
                            if (!plan.isDemo) {
                              setModalPlan(plan.key);
                            }
                          }}
                          className={`rounded-2xl sm:rounded-[28px] p-5 sm:p-8 flex flex-col justify-between relative cursor-pointer group transition-all duration-300 ${cardStyle}`}
                        >
                          {/* Top Centered Pill Badges */}
                          {isPlanActive ? (
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-bold bg-[#0d2a17] text-[#25D366] border border-[#25D366]/60 shadow-[0_0_15px_rgba(37,211,102,0.35)] whitespace-nowrap z-10">
                              <FaCheckCircle className="text-xs text-[#25D366]" /> Active Plan
                            </div>
                          ) : plan.isPopular ? (
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#25D366] text-black shadow-[0_0_20px_rgba(37,211,102,0.5)] whitespace-nowrap z-10">
                              MOST POPULAR
                            </div>
                          ) : plan.isGolden ? (
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C5A028] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)] whitespace-nowrap z-10">
                              BEST VALUE PACK
                            </div>
                          ) : null}

                          {/* Card Header & Price */}
                          <div className="flex flex-col items-center text-center">
                            <h3 className={`text-xl font-bold uppercase tracking-wider mb-1 ${plan.isGolden ? 'text-[#D4AF37]' : plan.title === 'SPARK' ? 'text-[#25D366]' : 'text-white'}`}>
                              {plan.title}
                            </h3>
                            <p className="text-xs text-white/60 mb-4 min-h-[30px] flex items-center justify-center max-w-xs font-normal">
                              {plan.subtitle}
                            </p>

                            {/* Price */}
                            <div className="flex flex-col items-center mb-1">
                              <span className={`text-4xl sm:text-5xl font-black tracking-tight drop-shadow-[0_0_12px_rgba(37,211,102,0.35)] ${plan.isGolden ? 'text-[#D4AF37]' : 'text-[#25D366]'}`}>
                                {plan.price}
                              </span>
                              <span className="text-xs font-normal text-white/50 mt-1.5">
                                {plan.duration}
                              </span>
                            </div>

                            {/* Feature Bullet Points */}
                            <ul className="w-full flex flex-col gap-2.5 text-left my-6 pt-5 border-t border-white/10">
                              {plan.features.map((feat, idx) => (
                                <li key={idx} className="flex items-start gap-2.5 text-xs text-white/85 font-normal leading-relaxed">
                                  <span className={`font-bold text-xs shrink-0 mt-0.5 ${plan.isGolden ? 'text-[#D4AF37]' : 'text-[#25D366]'}`}>✓</span>
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Bottom Button */}
                          {isPlanActive ? (
                            <button 
                              disabled 
                              onClick={(e) => e.stopPropagation()}
                              className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#0c2616] text-[#25D366] border border-[#25D366]/50 shadow-[0_0_15px_rgba(37,211,102,0.25)] cursor-default flex items-center justify-center gap-2 select-none"
                            >
                              <FaCheckCircle className="text-sm" /> Active Plan
                            </button>
                          ) : plan.isDemo ? (
                            <button 
                              disabled={true}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full py-3.5 rounded-xl font-bold text-sm bg-white/5 border border-white/10 text-white/40 cursor-not-allowed flex items-center justify-center gap-2 select-none opacity-60"
                            >
                              Choose Plan
                            </button>
                          ) : plan.isGolden ? (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setModalPlan(plan.key);
                                setShowPlansModal(false);
                              }}
                              className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C5A028] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:opacity-95 transition-all duration-300 cursor-pointer flex items-center justify-center"
                            >
                              Choose Plan
                            </button>
                          ) : plan.isPopular ? (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setModalPlan(plan.key);
                                setShowPlansModal(false);
                              }}
                              className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-[#25D366] hover:bg-[#1ebd5a] text-black shadow-[0_0_20px_rgba(37,211,102,0.6)] hover:opacity-95 transition-all duration-300 cursor-pointer flex items-center justify-center"
                            >
                              Choose Plan
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setModalPlan(plan.key);
                                setShowPlansModal(false);
                              }}
                              className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#0a2012] hover:bg-[#25D366] text-white hover:text-black border border-[#25D366]/40 shadow-md transition-all duration-300 cursor-pointer flex items-center justify-center"
                            >
                              Choose Plan
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Dialog for Activation Methods Inside Plans Popup */}
              {modalPlan && (
                <div 
                  onClick={closePlanModal}
                  className="fixed inset-0 z-[100010] flex items-center justify-center bg-black/90 backdrop-blur-xl p-3 sm:p-6 transition-all duration-300 overflow-y-auto no-scrollbar"
                >
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className={`bg-gradient-to-br from-[#121214]/95 to-[#080809]/95 border-2 border-white/5 max-w-2xl w-full rounded-2xl sm:rounded-[2.5rem] overflow-hidden shadow-[0_30px_100px_-15px_rgba(0,0,0,1)] relative transition-all duration-500 text-left backdrop-blur-3xl ring-1 ring-white/10 my-auto max-h-[92vh] flex flex-col no-scrollbar`}
                  >
                    {/* Premium Glowing Orbs */}
                    <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[100px] opacity-30 bg-${planDetails[modalPlan].colorClass.replace('text-', '')} pointer-events-none`}></div>
                    <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20 bg-${planDetails[modalPlan].colorClass.replace('text-', '')} pointer-events-none`}></div>
                    
                    {/* Back button */}
                    <button 
                      onClick={() => activeModalTab === 'options' ? closePlanModal() : setActiveModalTab('options')}
                      className="absolute top-4 sm:top-5 left-4 sm:left-5 text-white/80 hover:text-white transition-all p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 z-50 hover:-translate-x-0.5 backdrop-blur-md border border-white/15 cursor-pointer shadow-md"
                      title="Back"
                    >
                      <FaArrowLeft className="text-xs sm:text-sm" />
                    </button>

                    {/* Close button */}
                    <button 
                      onClick={closePlanModal}
                      className="absolute top-4 sm:top-5 right-4 sm:right-5 text-white/80 hover:text-white transition-all p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 z-50 hover:rotate-90 hover:scale-110 backdrop-blur-md border border-white/15 cursor-pointer shadow-md"
                      title="Close"
                    >
                      <FaTimes className="text-xs sm:text-sm" />
                    </button>

                    {/* Modal Tabs Content */}
                    {activeModalTab === 'options' && (
                      <>
                        <div className="text-center p-4 sm:p-7 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent relative overflow-hidden shrink-0">
                          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-${planDetails[modalPlan].colorClass.replace('text-', 'bg-')} shadow-[0_0_20px_var(--tw-shadow-color)] shadow-${planDetails[modalPlan].colorClass.replace('text-', '')}`}></div>
                          <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/50 font-black">You selected</span>
                          <h3 className={`text-2xl sm:text-3xl font-black mt-1 sm:mt-2 tracking-tight ${planDetails[modalPlan].colorClass} drop-shadow-md`}>{planDetails[modalPlan].name}</h3>
                          <p className="text-xs sm:text-sm font-bold mt-1.5 sm:mt-2 text-white/80 bg-black/20 inline-block px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full border border-white/5">
                            {planDetails[modalPlan].price} <span className="text-white/30 mx-1.5 sm:mx-2">•</span> {planDetails[modalPlan].credits}
                          </p>
                        </div>
                        <div className="p-4 sm:p-8 overflow-y-auto overscroll-contain flex-1 no-scrollbar">
                          <h4 className="text-[11px] sm:text-xs font-bold text-white/50 uppercase tracking-widest mb-4 sm:mb-6 text-center">Choose your activation method</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-6 max-w-xl mx-auto">
                            {/* Option 1: Request Activation */}
                            <div 
                              onClick={() => setActiveModalTab('request')}
                              className={`bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-400/50 flex flex-col justify-between group`}
                            >
                              <div>
                                <div className="text-3xl sm:text-4xl mb-2 sm:mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 drop-shadow-lg">📨</div>
                                <h5 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider mb-1.5 sm:mb-2 group-hover:text-blue-300 transition-colors">Request Activation</h5>
                                <p className="text-[11px] sm:text-xs text-white/50 font-medium leading-relaxed mb-3 sm:mb-4">Send your selected plan request directly to the admin for manual approval</p>
                              </div>
                              <span className={`text-[11px] sm:text-xs font-black ${planDetails[modalPlan].colorClass} bg-white/5 py-2 sm:py-2.5 rounded-xl group-hover:bg-white/10 transition-colors uppercase tracking-widest`}>Send Request &rarr;</span>
                            </div>

                            {/* Option 2: Pay Directly */}
                            <div 
                              onClick={() => setActiveModalTab('payment')}
                              className={`bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-green-400/50 flex flex-col justify-between group`}
                            >
                              <div>
                                <div className="text-3xl sm:text-4xl mb-2 sm:mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 drop-shadow-lg">💳</div>
                                <h5 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider mb-1.5 sm:mb-2 group-hover:text-green-300 transition-colors">Pay Directly</h5>
                                <p className="text-[11px] sm:text-xs text-white/50 font-medium leading-relaxed mb-3 sm:mb-4">Complete your payment securely via QR code and activate instantly</p>
                              </div>
                              <span className={`text-[11px] sm:text-xs font-black ${planDetails[modalPlan].colorClass} bg-white/5 py-2 sm:py-2.5 rounded-xl group-hover:bg-white/10 transition-colors uppercase tracking-widest`}>Proceed to Pay &rarr;</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {activeModalTab === 'payment' && (
                      <div className="p-4 sm:p-8 text-center overflow-y-auto overscroll-contain flex-1 no-scrollbar">
                        <button 
                          onClick={() => setActiveModalTab('options')} 
                          className="text-xs font-bold text-white/50 hover:text-white mb-4 sm:mb-6 flex items-center gap-1.5 transition-colors absolute top-4 left-5"
                        >
                          ← Back
                        </button>
                        <div className="mt-4">
                          <h4 className="text-xl font-bold text-white">Scan & Pay</h4>
                          <p className="text-xs text-white/50 mt-1 max-w-sm mx-auto mb-6">
                            Scan the QR code to pay for <strong>{planDetails[modalPlan].name}</strong> ({planDetails[modalPlan].price})
                          </p>

                          <div className="p-5 bg-white rounded-3xl inline-block shadow-2xl mb-3 max-w-[260px] text-center border-4 border-[#25D366]/40 relative">
                            <div className="flex items-center justify-center gap-2 mb-3">
                              <span className="text-xs font-black text-slate-800 tracking-wide uppercase">Life Changers Ind</span>
                            </div>
                            <div className="bg-white p-2 rounded-2xl flex items-center justify-center">
                              <QRCode 
                                value={`upi://pay?pa=lifechangersacademyind@okaxis&pn=Life%20Changers%20Ind&aid=uGICAgIC35OCTEA&am=${planDetails[modalPlan].price.replace(/[^0-9]/g, '')}.00&cu=INR&tn=${encodeURIComponent(planDetails[modalPlan].name + ' Subscription')}`} 
                                size={180} 
                                level="M"
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                              />
                            </div>
                            <div className="mt-3 pt-2 border-t border-slate-100">
                              <p className="text-[10px] font-bold text-slate-600 font-mono select-all">
                                UPI ID: lifechangersacademyind@okaxis
                              </p>
                              <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                                Scan to pay with any UPI app
                              </p>
                            </div>
                          </div>

                          <p className="text-xs text-[#25D366] font-semibold mb-4 flex items-center justify-center gap-1.5">
                            <span>⚡</span> Amount {planDetails[modalPlan].price} auto-fills upon scanning
                          </p>

                          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mt-4">
                            <button 
                              type="button"
                              onClick={() => {
                                setConfirmError('');
                                setConfirmSuccess('');
                                setShowPaymentConfirmModal(true);
                              }}
                              className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 ${planDetails[modalPlan].buttonBg} font-extrabold rounded-xl transition-all shadow-md text-sm cursor-pointer`}
                            >
                              <FaCheckCircle className="text-base" />
                              I've Paid
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeModalTab === 'request' && (
                      <div className="p-4 sm:p-8 relative overflow-y-auto overscroll-contain flex-1 no-scrollbar">
                        <button 
                          onClick={() => setActiveModalTab('options')} 
                          className="text-xs sm:text-sm font-bold text-white/50 hover:text-white mb-4 sm:mb-6 flex items-center gap-1.5 sm:gap-2 transition-colors absolute top-4 left-5"
                        >
                          ← Back
                        </button>
                        
                        <div className="text-center mb-8 mt-6">
                          <div className="w-16 h-16 mx-auto bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center text-2xl mb-5 shadow-[0_0_20px_rgba(59,130,246,0.2)] border border-blue-500/20">
                            <FaCheckCircle className="text-2xl" />
                          </div>
                          <h4 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">Send Activation Request</h4>
                          <p className="text-sm sm:text-base text-white/60 font-medium max-w-sm mx-auto">Fill in details. Our team will verify and activate your credits.</p>
                        </div>

                        <form 
                          onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                              const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://goyeorg.onrender.com';
                              const response = await fetch(`${apiBaseUrl}/api/subscription-requests`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  name: requestFormData.name,
                                  email: requestFormData.email,
                                  plan: planDetails[modalPlan].name,
                                  message: requestFormData.message
                                })
                              });
                              const data = await response.json().catch(() => ({}));
                              if (response.ok && data.success !== false) {
                                setActiveModalTab('success');
                              } else {
                                alert(data.message || "Failed to send request. Please try again.");
                              }
                            } catch (err) {
                              alert("Network error. Please try again.");
                            }
                          }}
                          className="space-y-5 max-w-md mx-auto text-left"
                        >
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-black text-white/40 uppercase tracking-wider mb-2">Selected Plan</label>
                                <div className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center">
                                    <span className="text-base font-bold text-white/80">{planDetails[modalPlan].name}</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-black text-white/40 uppercase tracking-wider mb-2">Amount</label>
                                <div className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center">
                                    <span className="text-base font-bold text-[#25D366]">{planDetails[modalPlan].price}</span>
                                </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-black text-white/40 uppercase tracking-wider mb-2">Your Name</label>
                            <input 
                              type="text" 
                              required
                              value={requestFormData.name}
                              onChange={(e) => setRequestFormData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g. John Doe"
                              className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl text-base text-white placeholder-white/20 outline-none transition-all focus:border-blue-500/50 focus:bg-white/5 shadow-inner"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-black text-white/40 uppercase tracking-wider mb-2">Email Address</label>
                            <input 
                              type="email" 
                              required
                              value={requestFormData.email}
                              onChange={(e) => setRequestFormData(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="e.g. john@example.com"
                              className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl text-base text-white placeholder-white/20 outline-none transition-all focus:border-blue-500/50 focus:bg-white/5 shadow-inner"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-black text-white/40 uppercase tracking-wider mb-2">Optional Message</label>
                            <textarea 
                              rows={2}
                              value={requestFormData.message}
                              onChange={(e) => setRequestFormData(prev => ({ ...prev, message: e.target.value }))}
                              placeholder="e.g. Please activate my credits."
                              className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl text-base text-white placeholder-white/20 outline-none transition-all focus:border-blue-500/50 focus:bg-white/5 shadow-inner resize-none"
                            />
                          </div>

                          <button 
                            type="submit" 
                            className={`w-full py-4 px-6 ${planDetails[modalPlan].buttonBg} rounded-2xl font-black text-base transition-all shadow-lg hover:shadow-xl mt-4 text-white flex items-center justify-center gap-2`}
                          >
                            SEND REQUEST →
                          </button>
                        </form>
                      </div>
                    )}

                    {activeModalTab === 'success' && (
                      <div className="p-6 sm:p-10 text-center animate-fade-in flex flex-col items-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-[#25D366]/20 to-[#25D366]/5 text-[#25D366] border border-[#25D366]/30 shadow-[0_0_40px_rgba(37,211,102,0.4)] rounded-full flex items-center justify-center text-5xl mb-8 transform hover:scale-110 transition-transform duration-500">
                          ✓
                        </div>
                        <h4 className="text-3xl font-black text-white mb-6 tracking-tight">Request Submitted!</h4>
                        
                        <div className="bg-black/20 border border-white/10 rounded-2xl p-6 sm:p-8 w-full max-w-sm mx-auto mb-8 text-left space-y-4 shadow-xl backdrop-blur-sm">
                          <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <span className="text-sm text-white/50 font-bold">Plan</span>
                            <span className="text-base text-white font-black">{planDetails[modalPlan].name}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <span className="text-sm text-white/50 font-bold">Amount</span>
                            <span className="text-base text-[#25D366] font-black">{planDetails[modalPlan].price}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-sm text-white/50 font-bold">Status</span>
                            <span className="text-xs text-amber-400 font-black bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-lg shadow-sm">
                              Pending Verification
                            </span>
                          </div>
                        </div>

                        <p className="text-sm sm:text-base text-white/60 mb-10 max-w-sm mx-auto leading-relaxed font-medium">
                          Your payment request has been logged. Admin will verify your transaction reference and activate your <strong className="text-white">{planDetails[modalPlan].name}</strong> access shortly.
                        </p>

                        <button 
                          onClick={closePlanModal}
                          className="w-full max-w-xs py-4 px-8 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl border border-white/10 transition-all text-sm shadow-md hover:shadow-lg"
                        >
                          Close Window
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              )}

          {/* --- Centered Payment Confirmation Popup / Modal --- */}
          {showPaymentConfirmModal && (
            <div 
              onClick={handleCloseConfirmModal}
              className="fixed inset-0 z-[100020] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in text-left"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-[#121b16] border border-[#25D366]/30 rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-md w-full relative shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-left backdrop-blur-xl max-h-[92vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                {/* Top Close (X) Button */}
                <button 
                  onClick={handleCloseConfirmModal}
                  className="absolute top-4 right-4 text-white/40 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer z-10"
                  title="Close"
                >
                  <FaTimes className="text-sm" />
                </button>

                {/* Modal Content: Success State OR Input Form */}
                {confirmSuccess ? (
                  <div className="py-6 text-center animate-fade-in flex flex-col items-center">
                    {/* Big Green Success Badge */}
                    <div className="w-16 h-16 bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] rounded-full flex items-center justify-center text-3xl mb-4 shadow-[0_0_30px_rgba(37,211,102,0.25)]">
                      <FaCheckCircle className="text-3xl" />
                    </div>

                    {/* Prominent Success Title */}
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
                      Payment Details Captured Successfully
                    </h3>

                    {/* Clear Subtext */}
                    <p className="text-xs sm:text-sm text-white/70 font-medium max-w-sm mb-5 leading-relaxed">
                      Your payment details have been submitted successfully. Please wait for our confirmation call to verify your payment.
                    </p>

                    {/* Subtle Status Indicator */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold mb-6">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                      Payment Verification Pending
                    </div>

                    {/* Close Button */}
                    <button 
                      type="button"
                      onClick={() => {
                        handleCloseConfirmModal();
                        navigate('/profile');
                      }}
                      className="w-full py-3.5 px-6 bg-white/10 hover:bg-white/20 text-white font-extrabold rounded-xl transition-all text-xs cursor-pointer border border-white/15 shadow-md"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] text-sm">
                          💳
                        </div>
                        <h3 className="text-xl font-black text-white tracking-tight">Payment Confirmation</h3>
                      </div>
                      <p className="text-xs text-white/50 font-medium">
                        Enter your UPI ID and upload the payment screenshot to confirm.
                      </p>
                    </div>

                    {/* Error Message */}
                    {confirmError && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{confirmError}</span>
                      </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleConfirmSubmit} className="space-y-4">
                      {/* UPI ID Field */}
                      <div>
                        <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5">
                          UPI ID <span className="text-[#25D366]">*</span>
                        </label>
                        <input 
                          type="text"
                          value={upiId}
                          onChange={(e) => {
                            setUpiId(e.target.value);
                            if (confirmError) setConfirmError('');
                          }}
                          placeholder="Enter your UPI ID"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 outline-none focus:border-[#25D366] transition-all"
                        />
                      </div>

                      {/* Screenshot Upload Field */}
                      <div>
                        <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5">
                          Payment Screenshot <span className="text-[#25D366]">*</span>
                        </label>
                        
                        {!screenshotPreview ? (
                          <label className="border-2 border-dashed border-white/15 hover:border-[#25D366]/50 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all bg-white/[0.02] hover:bg-white/[0.04] group">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleScreenshotUpload}
                              className="hidden"
                            />
                            <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-[#25D366]/10 flex items-center justify-center text-white/50 group-hover:text-[#25D366] transition-colors mb-2">
                              📤
                            </div>
                            <span className="text-xs font-bold text-white group-hover:text-[#25D366] transition-colors">
                              Click to upload screenshot
                            </span>
                            <span className="text-[10px] text-white/40 mt-0.5">
                              Image files only (PNG, JPG, JPEG)
                            </span>
                          </label>
                        ) : (
                          <div className="relative rounded-xl overflow-hidden border border-white/20 bg-black/40 p-2 flex flex-col items-center">
                            <img 
                              src={screenshotPreview} 
                              alt="Payment Screenshot Preview" 
                              className="max-h-44 object-contain rounded-lg w-full"
                            />
                            <div className="w-full flex items-center justify-between mt-2 pt-2 border-t border-white/10 px-1">
                              <span className="text-[11px] text-white/60 truncate max-w-[200px]">
                                {screenshotFile ? screenshotFile.name : 'screenshot.png'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setScreenshotFile(null);
                                  setScreenshotPreview(null);
                                }}
                                className="text-xs text-red-400 hover:text-red-300 font-bold transition-colors cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Buttons */}
                      <div className="pt-2 flex flex-col sm:flex-row gap-3">
                        <button 
                          type="button"
                          onClick={handleCloseConfirmModal}
                          className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold rounded-xl border border-white/10 transition-all text-xs cursor-pointer text-center"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className="flex-1 py-3 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold rounded-xl transition-all shadow-md text-xs cursor-pointer text-center"
                        >
                          Submit Payment Details
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}

    </>
  );
}

function App() {
  const ResolvedWhatsAppAuth = typeof WhatsAppAuth === 'function' ? WhatsAppAuth : (WhatsAppAuth?.default || WhatsAppAuth);
  const ResolvedJoinTeamPage = typeof JoinTeamPage === 'function' ? JoinTeamPage : (JoinTeamPage?.default || JoinTeamPage);
  const ResolvedUserLogin = typeof UserLogin === 'function' ? UserLogin : (UserLogin?.default || UserLogin);
  const ResolvedRegister = typeof Register === 'function' ? Register : (Register?.default || Register);
  const ResolvedAdminLogin = typeof AdminLogin === 'function' ? AdminLogin : (AdminLogin?.default || AdminLogin);
  const ResolvedAdminDashboard = typeof AdminDashboard === 'function' ? AdminDashboard : (AdminDashboard?.default || AdminDashboard);
  const ResolvedAdminUsers = typeof AdminUsers === 'function' ? AdminUsers : (AdminUsers?.default || AdminUsers);
  const ResolvedAdminFreeUsers = typeof AdminFreeUsers === 'function' ? AdminFreeUsers : (AdminFreeUsers?.default || AdminFreeUsers);
  const ResolvedAdminRequest = typeof AdminRequest === 'function' ? AdminRequest : (AdminRequest?.default || AdminRequest);
  const ResolvedAbout = typeof About === 'function' ? About : (About?.default || About);
  const ResolvedSubscriptions = typeof Subscriptions === 'function' ? Subscriptions : (Subscriptions?.default || Subscriptions);
  const ResolvedContact = typeof Contact === 'function' ? Contact : (Contact?.default || Contact);
  const ResolvedProfile = typeof Profile === 'function' ? Profile : (Profile?.default || Profile);
  const ResolvedWebScraper = typeof WebScraper === 'function' ? WebScraper : (WebScraper?.default || WebScraper);
  const ResolvedSocialExtractor = typeof SocialExtractor === 'function' ? SocialExtractor : (SocialExtractor?.default || SocialExtractor);
  const ResolvedGroupManagement = typeof GroupManagement === 'function' ? GroupManagement : (GroupManagement?.default || GroupManagement);
  const ResolvedFreeUserLogin = typeof FreeUserLogin === 'function' ? FreeUserLogin : (FreeUserLogin?.default || FreeUserLogin);
  const ResolvedFreeUserRegister = typeof FreeUserRegister === 'function' ? FreeUserRegister : (FreeUserRegister?.default || FreeUserRegister);
  const ResolvedFreeUserHome = typeof FreeUserHome === 'function' ? FreeUserHome : (FreeUserHome?.default || FreeUserHome);
  const ResolvedStarBackground = typeof StarBackground === 'function' ? StarBackground : (StarBackground?.default || StarBackground);

  return (
    <NotificationProvider>
      <BrowserRouter>
        <CreditLimitGuard>
          <div className="relative min-h-screen">
            <ResolvedStarBackground />
            <LayoutManager />
            <UrlMask />
            <Routes>
              <Route path="/" element={<ResolvedWhatsAppAuth />} />
              
              <Route path="/join-team" element={<ResolvedJoinTeamPage />} />
              <Route path="/join_team" element={<ResolvedJoinTeamPage />} />
              <Route path="/userloginpage" element={<ResolvedUserLogin />} />
              <Route path="/userlogin" element={<ResolvedUserLogin />} />
              <Route path="/login" element={<ResolvedUserLogin />} />
              <Route path="/register" element={<ResolvedRegister />} />
              <Route path="/goye-admin-login" element={<ResolvedAdminLogin />} />
              <Route path="/adminlogin" element={<ResolvedAdminLogin />} />
              <Route path="/admin-login" element={<ResolvedAdminLogin />} />
              <Route path="/goye-admin-dashboard" element={<ResolvedAdminDashboard />} />
              <Route path="/goye-admin-users" element={<ResolvedAdminUsers />} />
              <Route path="/goye-admin-free-users" element={<ResolvedAdminFreeUsers />} />
              <Route path="/adminrequest" element={<ResolvedAdminRequest />} />
              <Route path="/about" element={<ResolvedAbout />} />
              <Route path="/subscriptions" element={<ResolvedSubscriptions />} />
              <Route path="/pricing" element={<ResolvedSubscriptions />} />
              <Route path="/contact" element={<ResolvedContact />} />
              <Route path="/profile" element={<ResolvedProfile />} />
              <Route path="/web-scraper" element={<ResolvedWebScraper />} />
               <Route path="/social-extractor" element={<ResolvedSocialExtractor />} /> 
              {/* <Route path="/history" element={<History />} /> */}
              <Route path="/group-management" element={<ResolvedGroupManagement />} />
              <Route path="/free-user/login" element={<ResolvedFreeUserLogin />} />
              <Route path="/free-user/register" element={<ResolvedFreeUserRegister />} />
              <Route path="/free-user/home" element={<ResolvedFreeUserHome />} />

              {/* Fallback */}
              <Route path="*" element={<ResolvedWhatsAppAuth />} />

            </Routes>
          </div>
        </CreditLimitGuard>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;