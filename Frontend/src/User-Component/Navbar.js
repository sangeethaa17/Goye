import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiUser, FiX, FiMenu, FiLogOut, FiHelpCircle, FiBell, FiChevronDown, FiShield, FiZap, FiInfo, FiChevronRight, FiUsers, FiAward, FiGlobe, FiLayers } from "react-icons/fi";
import { FaRobot, FaArrowRight, FaCrown, FaCheckCircle, FaLock } from "react-icons/fa";
import GoyeAiChatbot from "./GoyeAiChatbot";
import NotificationBell from "./NotificationBell";
import { useNotifications } from "../context/NotificationContext";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, unreadCount, markAsRead, credits: contextCredits } = useNotifications();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFreeUserLoggedIn, setIsFreeUserLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeToast, setActiveToast] = useState(null);
  const [dismissedFreeUserToast, setDismissedFreeUserToast] = useState(() => sessionStorage.getItem("dismissedFreeUserToast") === "true");
  const [upgradeApprovalModal, setUpgradeApprovalModal] = useState(null);
  const [dismissedUpgradeModal, setDismissedUpgradeModal] = useState(false);

  // Single Login Dropdown State
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [selectedLoginTab, setSelectedLoginTab] = useState("subscription");
  const loginDropdownRef = useRef(null);

  // WhatsApp Connection State
  const [isWhatsappConnected, setIsWhatsappConnected] = useState(() => localStorage.getItem("whatsappConnected") === "true");

  // About Dropdown State
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const aboutDropdownRef = useRef(null);

  // Subscription Features Dropdown State
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false);
  const [mobileFeaturesOpen, setMobileFeaturesOpen] = useState(false);
  const featuresDropdownRef = useRef(null);

  // Close login, about & features dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(e.target)) {
        setLoginDropdownOpen(false);
      }
      if (aboutDropdownRef.current && !aboutDropdownRef.current.contains(e.target)) {
        setAboutDropdownOpen(false);
      }
      if (featuresDropdownRef.current && !featuresDropdownRef.current.contains(e.target)) {
        setFeaturesDropdownOpen(false);
      }
    };
    if (loginDropdownOpen || aboutDropdownOpen || featuresDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [loginDropdownOpen, aboutDropdownOpen, featuresDropdownOpen]);

  // Close dropdown on location change
  useEffect(() => {
    setLoginDropdownOpen(false);
    setAboutDropdownOpen(false);
    setMobileAboutOpen(false);
    setFeaturesDropdownOpen(false);
    setMobileFeaturesOpen(false);
  }, [location.pathname]);

  // Help & Support Modal States
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("report"); // "report" or "feedback"
  const [issueType, setIssueType] = useState("WhatsApp Connection");
  const [customIssueType, setCustomIssueType] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successState, setSuccessState] = useState(false);

  // AI Chatbot State
  const [botOpen, setBotOpen] = useState(false);

  // Ensure activeToast and upgrade approval modal are strictly user-specific
  useEffect(() => {
    const currentEmail = (localStorage.getItem("email") || "").toLowerCase().trim();
    const isLoggedInLocal = localStorage.getItem("isLoggedIn") === "true";
    const isFreeUserLoggedInLocal = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");
    const isAnyLoggedIn = (isLoggedInLocal || isFreeUserLoggedInLocal) && !!currentEmail;

    if (!isAnyLoggedIn) {
      setActiveToast(null);
      setUpgradeApprovalModal(null);
      return;
    }

    // Check for approval notification for this user
    const approvalNotif = notifications && Array.isArray(notifications) ? notifications.find(
      n => (
        (n.userEmail && n.userEmail.toLowerCase().trim() === currentEmail) ||
        (n.email && n.email.toLowerCase().trim() === currentEmail) ||
        (!n.userEmail && !n.email)
      ) && (
        n.type === 'request_approved' || 
        (n.title && (n.title.includes('Activated') || n.title.includes('Queued') || n.title.includes('Approved')))
      )
    ) : null;

    let freeUserDoc = null;
    try {
      freeUserDoc = JSON.parse(localStorage.getItem("freeUserData") || "{}");
    } catch (e) {}

    const isUpgradedInProfile = !!(
      freeUserDoc?.isSubscribed || 
      freeUserDoc?.hasEverSubscribed ||
      freeUserDoc?.subscriptionPlan ||
      (freeUserDoc?.subscriptionExpiresAt && new Date(freeUserDoc.subscriptionExpiresAt).getTime() > Date.now()) ||
      localStorage.getItem("isSubscribed") === "true"
    );

    // If Free User's plan is approved: FREEZE the app and show the Plan Approved modal!
    if (isFreeUserLoggedInLocal && (approvalNotif || isUpgradedInProfile)) {
      setUpgradeApprovalModal(approvalNotif || {
        title: "🎉 Plan Activated!",
        message: "Your subscription request has been approved and activated by Admin."
      });
      return;
    }

    if (notifications && Array.isArray(notifications) && notifications.length > 0) {
      const unreadNotif = notifications.find(
        n => !n.read && (
          (n.userEmail && n.userEmail.toLowerCase().trim() === currentEmail) ||
          (n.email && n.email.toLowerCase().trim() === currentEmail) ||
          (!n.userEmail && !n.email)
        )
      );
      if (unreadNotif) {
        setActiveToast(unreadNotif);
        const isApproved = unreadNotif.type === 'request_approved' || 
          (unreadNotif.title && (unreadNotif.title.includes('Activated') || unreadNotif.title.includes('Queued') || unreadNotif.title.includes('Approved')));
        if (!isFreeUserLoggedInLocal && isApproved && localStorage.getItem('isSubscribed') !== 'true') {
          localStorage.setItem('isSubscribed', 'true');
          localStorage.setItem('credits', '99999');
          window.dispatchEvent(new Event('creditsChanged'));
          window.dispatchEvent(new Event('subscriptionActivated'));
        }
      } else {
        setActiveToast(null);
        setUpgradeApprovalModal(null);
      }
    } else {
      setActiveToast(null);
      setUpgradeApprovalModal(null);
    }
  }, [notifications, isLoggedIn, isFreeUserLoggedIn, dismissedUpgradeModal]);

  const handleRedirectToSubscriptionLogin = (notif) => {
    const userEmail = (localStorage.getItem("email") || "").trim();
    if (typeof markAsRead === 'function') {
      markAsRead();
    }
    setUpgradeApprovalModal(null);
    setActiveToast(null);

    // Cleanly clear Free User session so Subscription Login page opens
    localStorage.removeItem("freeUserToken");
    localStorage.removeItem("freeUserData");
    localStorage.removeItem("isLoggedIn");
    window.dispatchEvent(new Event("freeUserLoginStatusChanged"));
    window.dispatchEvent(new Event("loginStatusChanged"));

    // Redirect directly to the existing Subscription Login page with prefilled email
    navigate("/userloginpage", { state: { prefillEmail: userEmail } });
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setScreenshot({
          filename: file.name,
          mimetype: file.type,
          data: reader.result.split(',')[1]
        });
      };
    }
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const loggedInUser = localStorage.getItem("username") || "User";
    const loggedInEmail = localStorage.getItem("email") || "";
    const finalIssueType = issueType === "Other" ? (customIssueType ? `Other: ${customIssueType}` : "Other") : issueType;

    const payload = {
      username: loggedInUser,
      email: loggedInEmail,
      type: activeTab === "report" ? "issue" : "feedback",
      issueType: activeTab === "report" ? finalIssueType : undefined,
      description: activeTab === "report" ? issueDescription : feedbackText,
      rating: activeTab === "feedback" ? rating : undefined,
      screenshot: activeTab === "report" ? screenshot : undefined
    };

    try {
      const response = await fetch("https://goyeorg.onrender.com/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSuccessState(true);
        setIssueDescription("");
        setCustomIssueType("");
        setScreenshot(null);
        setFeedbackText("");
        setRating(5);
      } else {
        alert("⚠️ Failed to submit request. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Error submitting support request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          onClick={() => setRating(i)}
          className="cursor-pointer text-2xl sm:text-3xl transition-all duration-150 transform hover:scale-125 select-none"
          style={{ color: i <= rating ? "#F59E0B" : "rgba(255,255,255,0.2)" }}
        >
          ★
        </span>
      );
    }
    return <div className="flex gap-2 justify-center my-2">{stars}</div>;
  };

  const renderSuccess = () => (
    <div className="text-center py-8 space-y-4">
      <div className="w-16 h-16 bg-[#25D366]/10 text-[#25D366] rounded-full flex items-center justify-center mx-auto border border-[#25D366]/30 animate-bounce">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <h3 className="text-xl font-bold text-white font-['Space_Grotesk']">✅ Thank you!</h3>
      <p className="text-sm text-white/70">Your request has been submitted successfully.</p>
      <p className="text-xs text-white/50">Our support team will contact you soon.</p>
      <button
        onClick={() => {
          setSuccessState(false);
          setHelpModalOpen(false);
        }}
        className="mt-6 px-6 py-2.5 bg-[#25D366] text-white text-sm font-semibold rounded-xl hover:bg-[#128C4A] transition-colors"
      >
        Close
      </button>
    </div>
  );

  const [navCredits, setNavCredits] = useState(() => {
    const stored = localStorage.getItem("credits");
    return stored !== null ? Math.max(0, parseInt(stored, 10)) : 0;
  });

  useEffect(() => {
    const updateNavState = () => {
      const loggedIn = localStorage.getItem("isLoggedIn") === "true";
      const freeLoggedIn = !!localStorage.getItem("freeUserToken");
      const stored = localStorage.getItem("credits");
      setIsLoggedIn(loggedIn);
      setIsFreeUserLoggedIn(freeLoggedIn);
      setNavCredits(stored !== null ? Math.max(0, parseInt(stored, 10)) : 0);
    };

    updateNavState();

    window.addEventListener("storage", updateNavState);
    window.addEventListener("loginStatusChanged", updateNavState);
    window.addEventListener("freeUserLoginStatusChanged", updateNavState);
    window.addEventListener("creditsChanged", updateNavState);
    window.addEventListener("subscriptionExpired", updateNavState);

    return () => {
      window.removeEventListener("storage", updateNavState);
      window.removeEventListener("loginStatusChanged", updateNavState);
      window.removeEventListener("freeUserLoginStatusChanged", updateNavState);
      window.removeEventListener("creditsChanged", updateNavState);
      window.removeEventListener("subscriptionExpired", updateNavState);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleOpenSupport = () => {
      setHelpModalOpen(true);
    };
    window.addEventListener("openSupportModal", handleOpenSupport);
    return () => {
      window.removeEventListener("openSupportModal", handleOpenSupport);
    };
  }, []);

  useEffect(() => {
    const handleWpConnChange = () => {
      setIsWhatsappConnected(localStorage.getItem("whatsappConnected") === "true");
    };
    window.addEventListener("whatsappConnectionChanged", handleWpConnChange);
    window.addEventListener("storage", handleWpConnChange);
    return () => {
      window.removeEventListener("whatsappConnectionChanged", handleWpConnChange);
      window.removeEventListener("storage", handleWpConnChange);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    const handleKey = (e) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    setActiveToast(null);
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
    localStorage.removeItem("freeUserToken");
    localStorage.removeItem("freeUserData");
    localStorage.removeItem("whatsappConnected");
    localStorage.removeItem("loginType");

    window.dispatchEvent(new Event("loginStatusChanged"));
    window.dispatchEvent(new Event("freeUserLoginStatusChanged"));
    window.dispatchEvent(new Event("whatsappConnectionChanged"));

    setIsLoggedIn(false);
    setIsFreeUserLoggedIn(false);
    setIsWhatsappConnected(false);
    setMobileOpen(false);

    if (location.pathname.includes("admin")) {
      navigate("/goye-admin-login");
    } else {
      navigate("/userloginpage");
    }
  };

  const handleFreeUserLogout = () => {
    setActiveToast(null);
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

    window.dispatchEvent(new Event("freeUserLoginStatusChanged"));
    window.dispatchEvent(new Event("loginStatusChanged"));
    window.dispatchEvent(new Event("whatsappConnectionChanged"));

    setIsFreeUserLoggedIn(false);
    setIsLoggedIn(false);
    setIsWhatsappConnected(false);
    setMobileOpen(false);
    navigate("/free-user/login");
  };

  /*
   * Connect button:
   * Uses the existing WhatsAppAuth QR scanner.
   * No new QR scanner is created.
   */
  const handleConnect = () => {
    setMobileOpen(false);

    if (isLocked) {
      window.dispatchEvent(new Event("showCreditExhaustedPopup"));
      return;
    }

    // If already on the WhatsAppAuth page,
    // directly trigger the existing QR flow.
    if (location.pathname === "/") {
      window.dispatchEvent(new Event("gy:connect-device"));
      return;
    }

    // Otherwise navigate to the existing WhatsAppAuth page.
    navigate("/");

    // Wait for the page to mount, then trigger
    // the existing QR connection flow.
    setTimeout(() => {
      window.dispatchEvent(new Event("gy:connect-device"));
    }, 500);
  };

  const [activeSubView, setActiveSubView] = useState(() => {
    if (location.state && location.state.openMessages) return "messages";
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    const freeLoggedIn = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");
    if (loggedIn || freeLoggedIn) return "messages";
    return "home";
  });

  useEffect(() => {
    const onGoHome = () => setActiveSubView("home");
    const onOpenMessages = () => setActiveSubView("messages");
    const onViewChanged = (e) => {
      if (e.detail) setActiveSubView(e.detail);
    };

    window.addEventListener("gy:go-home", onGoHome);
    window.addEventListener("gy:open-messages", onOpenMessages);
    window.addEventListener("gy:view-changed", onViewChanged);

    return () => {
      window.removeEventListener("gy:go-home", onGoHome);
      window.removeEventListener("gy:open-messages", onOpenMessages);
      window.removeEventListener("gy:view-changed", onViewChanged);
    };
  }, []);

  useEffect(() => {
    const isRoot = location.pathname === "/" || location.pathname === "/home" || location.pathname.includes("whatsapp-bulk-message-sender");
    if (isRoot) {
      const loggedIn = localStorage.getItem("isLoggedIn") === "true";
      const freeLoggedIn = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");
      if (loggedIn || freeLoggedIn || (location.state && location.state.openMessages)) {
        setActiveSubView("messages");
      } else {
        setActiveSubView("home");
      }
    } else {
      setActiveSubView(null);
    }
  }, [location.pathname, location.state]);

  /*
   * Messages menu item:
   * Reuses the existing WhatsAppAuth chat/messages panel (the same
   * screen shown right after a successful QR scan).
   */
  const handleMessagesClick = () => {
    setMobileOpen(false);

    setActiveSubView("messages");

    // If already on the WhatsAppAuth page, directly trigger the
    // existing messages panel to open (or resume) in place.
    if (location.pathname === "/") {
      window.dispatchEvent(new Event("gy:open-messages"));
      return;
    }

    // Otherwise navigate to the existing WhatsAppAuth page, passing
    // along router state so it can render the correct view on its very
    // first paint instead of briefly showing the Home hero and then
    // swapping to Messages.
    navigate("/", { state: { openMessages: true } });
  };

  /*
   * Home nav item:
   * Navigating to "/" when we're already on "/" is a no-op for the
   * router (no remount happens), so the WhatsAppAuth page previously
   * stayed stuck on whatever view (e.g. Messages) it was already
   * showing. Dispatching this event lets it reset back to the landing
   * view in place, while a normal navigate() handles the cross-page case.
   */
  const handleHomeClick = () => {
    setMobileOpen(false);
    setActiveSubView("home");

    if (location.pathname === "/") {
      window.dispatchEvent(new Event("gy:go-home"));
      return;
    }

    navigate("/");
  };

  const isAdminPage = location.pathname.includes("admin");

  const isAnyUserLoggedIn = isLoggedIn || isFreeUserLoggedIn;
  
  const isSubscriptionActive = () => {
    // STRICT ISOLATION: A Free User session MUST NEVER be considered an active subscribed user!
    const isFree = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData") || isFreeUserLoggedIn;
    if (isFree) return false;

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

  const isSubscribedUser = isSubscriptionActive();
  const effectiveCredits = contextCredits !== undefined ? contextCredits : navCredits;
  const isLocked = !isSubscribedUser && effectiveCredits <= 0;
  const isFeatureRestricted = isLocked;
  const isMessagesLocked = isLocked;

  const isFreeUserAccount = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");
  const showFreeUserToast = isFreeUserAccount && !isSubscribedUser && !dismissedFreeUserToast;

  const handleAboutUsClick = () => {
    setAboutDropdownOpen(false);
    setMobileOpen(false);
    if (location.pathname === "/about") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/about");
    }
  };

  const handleSubscriptionsClick = () => {
    setAboutDropdownOpen(false);
    setMobileOpen(false);
    if (location.pathname === "/subscriptions" || location.pathname === "/pricing") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/subscriptions");
    }
  };

  // Strictly for logged-in Subscription users (Free-trial users remain completely untouched)
  const isSubscriptionUserLoggedIn = isLoggedIn && !isFreeUserLoggedIn;

  const userNavLinks = isSubscriptionUserLoggedIn
    ? [
        ...(isAnyUserLoggedIn ? [{ label: "Messages", href: "/", isMessages: true }] : []),
        { label: "Web Scraper", href: "/web-scraper" },
        { label: "Group Scraper", href: "/group-management" },
        { label: "Social Leads", href: "/social-extractor" },
        { label: "Subscriptions", href: "/subscriptions" },
        { label: "Contact", href: "/contact" },
      ]
    : [
        ...(!isAnyUserLoggedIn ? [{ label: "Home", href: "/", isHome: true }] : []),
        ...(isAnyUserLoggedIn ? [{ label: "Messages", href: "/", isMessages: true, isRestricted: isMessagesLocked }] : []),
        ...(!isAnyUserLoggedIn ? [{ label: "About", href: "/about" }] : []),
        { label: "Subscriptions", href: "/subscriptions" },
        ...(isFreeUserLoggedIn ? [{ label: "Subscription Features", isFeaturesDropdown: true }] : []),
        { label: "Contact", href: "/contact" },
      ];

  const adminNavLinks = [
    { label: "Dashboard", href: "/goye-admin-dashboard" },
    { label: "Users", href: "/goye-admin-users" },
    { label: "Request", href: "/adminrequest" }
  ];

  const navLinks = isAdminPage ? adminNavLinks : userNavLinks;

  const isLinkActive = (link) => {
    if (!link) return false;
    const isRoot = location.pathname === "/" || location.pathname === "/home" || location.pathname.includes("whatsapp-bulk-message-sender");
    if (link.isHome) {
      if (link.href === "/free-user/home") {
        return location.pathname === "/free-user/home";
      }
      return isRoot && (activeSubView === "home" || !activeSubView);
    }
    if (link.isMessages) {
      return isRoot && activeSubView === "messages";
    }
    if (link.hasDropdown) {
      return location.pathname === "/about" || location.pathname === "/subscriptions" || location.pathname === "/pricing";
    }
    if (link.isFeaturesDropdown) {
      return location.pathname === "/group-management" || location.pathname === "/web-scraper" || location.pathname === "/social-extractor";
    }
    return location.pathname === link.href;
  };

  const goTo = (href) => {
    window.scrollTo({ top: 0, behavior: "instant" });
    navigate(href);
    setMobileOpen(false);
  };

  // Routes a nav-link click either to the Messages panel, a Home
  // reset, a frozen popup trigger, pro plan modal, or a normal route navigation.
  const handleNavLinkClick = (link) => {
    if (link.isProOnly && !isSubscribedUser) {
      goTo(link.href);
      return;
    }
    if (link.isRestricted) {
      // Navigate to the tab's actual route so it becomes the active tab,
      // then show the locked popup for that specific feature.
      goTo(link.href);
      setTimeout(() => {
        window.dispatchEvent(new Event("showCreditExhaustedPopup"));
      }, 100);
      return;
    }
    if (link.isMessages) {
      handleMessagesClick();
    } else if (link.isHome) {
      handleHomeClick();
    } else {
      goTo(link.href);
    }
  };

  return (
    <>
      <style>{`
        @keyframes gyLogoFloat {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-4px); }
        }
        @keyframes gyLogoGlow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(52,227,138,0.35)); }
          50%      { filter: drop-shadow(0 0 12px rgba(52,227,138,0.7)); }
        }
        .gy-logo-float {
          animation: gyLogoFloat 3.4s ease-in-out infinite,
                     gyLogoGlow 3.4s ease-in-out infinite;
        }
        .gy-logo-float:hover {
          animation-play-state: paused;
        }

        @keyframes gyPanelDown {
          0%   { opacity: 0; transform: translateY(-12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes gyBackdropIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes gyLinkIn {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .gy-panel-in {
          animation: gyPanelDown 0.35s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .gy-backdrop-in {
          animation: gyBackdropIn 0.3s ease forwards;
        }
        .gy-link-in {
          opacity: 0;
          animation: gyLinkIn 0.35s cubic-bezier(0.22,1,0.36,1) forwards;
        }

        .gy-burger-line {
          transform-origin: center;
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.25s ease;
        }
        .gy-burger-open .gy-burger-line-1 { transform: translateY(6px) rotate(45deg); }
        .gy-burger-open .gy-burger-line-2 { opacity: 0; }
        .gy-burger-open .gy-burger-line-3 { transform: translateY(-6px) rotate(-45deg); }

        .gy-nav-underline {
          background: linear-gradient(90deg, #34E38A, #0F7A45);
        }
        @keyframes gyFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes gyScaleUp {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .gy-fade-in {
          animation: gyFadeIn 0.3s ease forwards;
        }
        .gy-scale-up {
          animation: gyScaleUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      <nav
        className={`fixed top-0 left-0 right-0 z-[100000] w-full px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
          scrolled ? "py-3 shadow-xl" : "py-4 shadow-md"
        }`}
        style={{
          background: scrolled
            ? "linear-gradient(135deg, rgba(4,32,20,0.92) 0%, rgba(6,48,29,0.92) 100%)"
            : "linear-gradient(135deg, rgba(5,38,24,0.85) 0%, rgba(8,56,34,0.85) 100%)",
          borderBottom: scrolled
            ? "1px solid rgba(52,227,138,0.3)"
            : "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        <div className="max-w-[1550px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Logo */}
          <div
            className="gy-logo-float text-xl sm:text-2xl font-extrabold shrink-0 cursor-pointer flex items-center gap-2.5 group mr-2 lg:mr-6"
            onClick={handleHomeClick}
          >
            <img
              src="/Goye.png"
              alt="Goye Logo"
              className="w-11 h-11 sm:w-12 sm:h-12 object-contain transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 drop-shadow-lg"
            />
            <span
              className="bg-clip-text text-transparent transition-opacity duration-300"
              style={{
                backgroundImage: "linear-gradient(135deg, #6CFFB0, #22db91 60%, #34E38A)",
              }}
            >
              Goye
            </span>
          </div>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center gap-3.5 lg:gap-5 xl:gap-7 text-xs sm:text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = isLinkActive(link);
              const isLocked = link.isRestricted;

              if (link.hasDropdown) {
                return (
                  <li
                    key={link.label}
                    className="relative"
                    ref={aboutDropdownRef}
                    onMouseEnter={() => setAboutDropdownOpen(true)}
                    onMouseLeave={() => setAboutDropdownOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => setAboutDropdownOpen((prev) => !prev)}
                      className={`py-1 px-1 whitespace-nowrap transition-colors duration-300 flex items-center gap-1.5 cursor-pointer select-none ${
                        isActive || aboutDropdownOpen ? "text-white font-bold" : "text-white/70 hover:text-white"
                      }`}
                    >
                      <span>{link.label}</span>
                      <FiChevronDown
                        className={`text-xs transition-transform duration-300 ${
                          aboutDropdownOpen ? "rotate-180 text-[#34E38A]" : "text-white/60"
                        }`}
                      />
                    </button>
                    <span
                      className={`gy-nav-underline absolute left-0 -bottom-1 h-[2px] rounded-full transition-all duration-300 ${
                        isActive || aboutDropdownOpen ? "w-full" : "w-0"
                      }`}
                    />

                    {/* About Dropdown Menu - Fancy Glow Style (Premium Touch) */}
                    {aboutDropdownOpen && (
                      <div
                        className="gy-scale-up absolute left-1/2 -translate-x-1/2 top-full mt-3 w-80 sm:w-88 rounded-3xl p-5 shadow-[0_0_35px_rgba(0,229,153,0.35)] z-50 backdrop-blur-2xl border-2 flex flex-col gap-3 before:content-[''] before:absolute before:-top-4 before:left-0 before:right-0 before:h-4"
                        style={{
                          backgroundColor: "#061811",
                          borderColor: "#00E599",
                        }}
                      >
                        {/* Tooltip pointer arrow at top */}
                        <div
                          className="absolute -top-[9px] left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-t-2 border-l-2"
                          style={{
                            backgroundColor: "#061811",
                            borderColor: "#00E599",
                          }}
                        />

                        {/* Option 1: About Us */}
                        <button
                          type="button"
                          onClick={handleAboutUsClick}
                          className="flex items-center gap-4 p-3 rounded-2xl hover:bg-[#00E599]/10 transition-all duration-200 text-left cursor-pointer group/item"
                        >
                          <div className="w-12 h-12 rounded-full bg-[#00E599]/20 text-[#00E599] flex items-center justify-center text-xl shrink-0 group-hover/item:bg-[#00E599] group-hover/item:text-black transition-all shadow-[0_0_15px_rgba(0,229,153,0.3)]">
                            <FiUsers size={22} />
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-bold text-white group-hover/item:text-[#00E599] transition-colors">
                              About Us
                            </span>
                            <span className="text-xs text-white/60 leading-snug mt-0.5">
                              Our mission, vision and what makes Goye different.
                            </span>
                          </div>
                          <FiChevronRight className="text-white/40 text-lg group-hover/item:text-[#00E599] group-hover/item:translate-x-1 transition-all" />
                        </button>

                        {/* Divider line */}
                        <div className="h-[1px] w-full bg-white/10" />

                        {/* Option 2: Subscriptions */}
                        <button
                          type="button"
                          onClick={handleSubscriptionsClick}
                          className="flex items-center gap-4 p-3 rounded-2xl hover:bg-[#00E599]/10 transition-all duration-200 text-left cursor-pointer group/sub"
                        >
                          <div className="w-12 h-12 rounded-full bg-[#00E599]/20 text-[#00E599] flex items-center justify-center text-xl shrink-0 group-hover/sub:bg-[#00E599] group-hover/sub:text-black transition-all shadow-[0_0_15px_rgba(0,229,153,0.3)]">
                            <FiAward size={22} />
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white group-hover/sub:text-[#00E599] transition-colors">
                                Subscriptions
                              </span>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#00E599] text-black uppercase tracking-wider shadow-[0_0_8px_rgba(0,229,153,0.6)]">
                                PLANS
                              </span>
                            </div>
                            <span className="text-xs text-white/60 leading-snug mt-0.5">
                              Explore our plans &amp; choose the best for you.
                            </span>
                          </div>
                          <FiChevronRight className="text-white/40 text-lg group-hover/sub:text-[#00E599] group-hover/sub:translate-x-1 transition-all" />
                        </button>
                      </div>
                    )}
                  </li>
                );
              }

              if (link.isFeaturesDropdown) {
                return (
                  <li
                    key={link.label}
                    className="relative"
                    ref={featuresDropdownRef}
                    onMouseEnter={() => setFeaturesDropdownOpen(true)}
                    onMouseLeave={() => setFeaturesDropdownOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => setFeaturesDropdownOpen((prev) => !prev)}
                      className={`py-1 px-1 whitespace-nowrap transition-colors duration-300 flex items-center gap-1.5 cursor-pointer select-none ${
                        isActive || featuresDropdownOpen ? "text-white font-bold" : "text-white/70 hover:text-white"
                      }`}
                    >
                      <span>{link.label}</span>
                      {!isSubscribedUser && (
                        <span className="text-[10px] font-extrabold bg-gradient-to-r from-amber-400 to-amber-500 text-black px-1.5 py-0.2 rounded-full shadow-sm flex items-center gap-0.5">
                          🔒 PRO
                        </span>
                      )}
                      <FiChevronDown
                        className={`text-xs transition-transform duration-300 ${
                          featuresDropdownOpen ? "rotate-180 text-[#34E38A]" : "text-white/60"
                        }`}
                      />
                    </button>
                    <span
                      className={`gy-nav-underline absolute left-0 -bottom-1 h-[2px] rounded-full transition-all duration-300 ${
                        isActive || featuresDropdownOpen ? "w-full" : "w-0"
                      }`}
                    />

                    {/* Subscription Features Dropdown Menu - Aligned directly under Subscription Features */}
                    {featuresDropdownOpen && (
                      <div
                        className="gy-scale-up absolute left-0 top-full mt-3 w-80 rounded-2xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50 backdrop-blur-2xl border flex flex-col gap-1.5 before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3"
                        style={{
                          backgroundColor: "#0a1712",
                          borderColor: "rgba(37, 211, 102, 0.3)",
                        }}
                      >
                        {/* Tooltip pointer arrow pointing directly at "Subscription Features" */}
                        <div
                          className="absolute -top-[7px] left-10 w-3.5 h-3.5 rotate-45 border-t border-l"
                          style={{
                            backgroundColor: "#0a1712",
                            borderColor: "rgba(37, 211, 102, 0.3)",
                          }}
                        />

                        {/* Option 1: Group Scraping */}
                        <button
                          type="button"
                          onClick={() => {
                            setFeaturesDropdownOpen(false);
                            goTo("/group-management");
                          }}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.06] transition-all duration-200 text-left cursor-pointer group/feat border border-transparent hover:border-white/10"
                        >
                          <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center text-lg shrink-0 group-hover/feat:bg-[#25D366] group-hover/feat:text-black transition-all shadow-[0_0_12px_rgba(37,211,102,0.2)]">
                            <FiUsers size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-bold text-white group-hover/feat:text-[#25D366] transition-colors whitespace-nowrap">
                                Group Scraping
                              </span>
                              {!isSubscribedUser ? (
                                <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                  🔒 PRO
                                </span>
                              ) : (
                                <span className="shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#25D366] text-black uppercase tracking-wider">
                                  PRO
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/50 group-hover/feat:text-white/70 transition-colors leading-tight mt-0.5">
                              Extract WhatsApp contacts from active groups
                            </p>
                          </div>
                          <FiChevronRight className="text-white/30 text-base shrink-0 group-hover/feat:text-[#25D366] group-hover/feat:translate-x-0.5 transition-all" />
                        </button>

                        {/* Divider line */}
                        <div className="h-[1px] w-full bg-white/[0.08]" />

                        {/* Option 2: Web Scraper */}
                        <button
                          type="button"
                          onClick={() => {
                            setFeaturesDropdownOpen(false);
                            goTo("/web-scraper");
                          }}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.06] transition-all duration-200 text-left cursor-pointer group/feat border border-transparent hover:border-white/10"
                        >
                          <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center text-lg shrink-0 group-hover/feat:bg-[#25D366] group-hover/feat:text-black transition-all shadow-[0_0_12px_rgba(37,211,102,0.2)]">
                            <FiGlobe size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-bold text-white group-hover/feat:text-[#25D366] transition-colors whitespace-nowrap">
                                Web Scraper
                              </span>
                              {!isSubscribedUser ? (
                                <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                  🔒 PRO
                                </span>
                              ) : (
                                <span className="shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#25D366] text-black uppercase tracking-wider">
                                  PRO
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/50 group-hover/feat:text-white/70 transition-colors leading-tight mt-0.5">
                              Extract verified leads from Google Maps &amp; Web
                            </p>
                          </div>
                          <FiChevronRight className="text-white/30 text-base shrink-0 group-hover/feat:text-[#25D366] group-hover/feat:translate-x-0.5 transition-all" />
                        </button>

                        {/* Option 3: Social Leads Extractor (Temporarily Disabled) */}
                        
                        <div className="h-[1px] w-full bg-white/[0.08]" />
                        <button
                          type="button"
                          onClick={() => {
                            setFeaturesDropdownOpen(false);
                            goTo("/social-extractor");
                          }}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.06] transition-all duration-200 text-left cursor-pointer group/feat border border-transparent hover:border-white/10"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500/20 to-[#25D366]/20 text-[#25D366] flex items-center justify-center text-lg shrink-0 group-hover/feat:bg-[#25D366] group-hover/feat:text-black transition-all shadow-[0_0_12px_rgba(37,211,102,0.2)]">
                            <FiGlobe size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-bold text-white group-hover/feat:text-[#25D366] transition-colors whitespace-nowrap">
                                Social Leads
                              </span>
                              {!isSubscribedUser ? (
                                <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                  🔒 PRO
                                </span>
                              ) : (
                                <span className="shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#25D366] text-black uppercase tracking-wider">
                                  PRO
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/50 group-hover/feat:text-white/70 transition-colors leading-tight mt-0.5">
                              Extract public phone numbers from Instagram, YT &amp; FB
                            </p>
                          </div>
                          <FiChevronRight className="text-white/30 text-base shrink-0 group-hover/feat:text-[#25D366] group-hover/feat:translate-x-0.5 transition-all" />
                        </button>
                       
                      </div>
                    )}
                  </li>
                );
              }

              const isProLocked = link.isProOnly && !isSubscribedUser;

              return (
                <li key={link.label} className="relative group">
                  <button
                    onClick={() => handleNavLinkClick(link)}
                    className={`py-1 px-1 whitespace-nowrap transition-colors duration-300 flex items-center gap-1.5 ${
                      isActive ? "text-white font-bold" : "text-white/70 group-hover:text-white"
                    } ${isLocked || isProLocked ? "cursor-pointer" : ""}`}
                    title={
                      isProLocked
                        ? "Pro feature. Upgrade to unlock Group & Web Scraping!"
                        : isLocked
                        ? "Credits exhausted. Upgrade or recharge to unlock."
                        : ""
                    }
                  >
                    <span>{link.label}</span>
                    {isProLocked ? (
                      <span className="text-[10px] font-extrabold bg-gradient-to-r from-amber-400 to-amber-500 text-black px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                        🔒 PRO
                      </span>
                    ) : link.isProBadge ? (
                      <span className="text-[10px] font-extrabold bg-[#25D366] text-black px-1.5 py-0.5 rounded-full shadow-sm">
                        PRO
                      </span>
                    ) : isLocked ? (
                      <span className="text-[10px] bg-white/10 text-white/80 px-1.5 py-0.2 rounded-full border border-white/15">
                        🔒
                      </span>
                    ) : null}
                  </button>
                  <span
                    className={`gy-nav-underline absolute left-0 -bottom-1 h-[2px] rounded-full transition-all duration-300 ${
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </li>
              );
            })}
          </ul>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto md:ml-0">
            {/* Desktop Controls */}
            <div className="hidden md:flex items-center gap-2.5">
              {!isAdminPage && !isWhatsappConnected && (
                <button
                  onClick={handleConnect}
                  className="shrink-0 px-4 py-1.5 rounded-full font-semibold text-xs sm:text-sm text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-[0_10px_24px_rgba(52,227,138,0.4)]"
                  style={{
                    background: "linear-gradient(135deg, #34E38A, #0F7A45)",
                    boxShadow: "0 8px 20px rgba(15,122,69,0.35)",
                  }}
                >
                  Connect
                </button>
              )}

              {isLoggedIn ? (
                <>
                  {!isAdminPage && (
                    <>
                      <button
                        onClick={() => {
                          setSuccessState(false);
                          setHelpModalOpen(true);
                        }}
                        className="shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full font-semibold text-xs sm:text-sm text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-[0_10px_24px_rgba(52,227,138,0.4)]"
                        style={{
                          background: "linear-gradient(135deg, #34E38A, #0F7A45)",
                          boxShadow: "0 8px 20px rgba(15,122,69,0.35)",
                        }}
                      >
                        <FiHelpCircle size={16} />
                        <span>Get Help</span>
                      </button>
                      {/* Notification Bell Component */}
                      <NotificationBell />

                                            {/* Account Badge */}
                      {isSubscribedUser ? (
                        <div className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FFD700]/10 via-[#F59E0B]/10 to-transparent border border-[#FFD700]/30 shadow-[0_0_15px_rgba(255,215,0,0.15)] select-none shrink-0" title="Premium Subscriber">
                          <FiAward className="text-[#FFD700]" size={14} />
                          <span className="text-[11px] font-black text-[#FFD700] tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">PRO</span>
                        </div>
                      ) : null}

                      <button
                        onClick={() => goTo("/profile")}
                        className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold text-xs sm:text-sm transition-all duration-300 active:scale-95 cursor-pointer relative ${
                          isSubscribedUser
                            ? "hover:scale-105"
                            : "hover:scale-105 shadow-sm"
                        }`}
                        style={
                          isSubscribedUser
                            ? {
                                background: "linear-gradient(135deg, rgba(255,215,0,0.25), rgba(52,227,138,0.2))",
                                color: "#FFD700",
                                border: "2px solid #FFD700",
                                boxShadow: "0 0 16px rgba(255,215,0,0.65), 0 0 26px rgba(52,227,138,0.4)",
                              }
                            : {
                                backgroundColor: "rgba(255,255,255,0.06)",
                                color: "#E5E7EB",
                                border: "1px solid rgba(255,255,255,0.2)",
                              }
                        }
                        title={isSubscribedUser ? "VIP Profile (Premium ✨)" : "Profile (Free)"}
                      >
                        <FiUser size={15} />
                        <span>Profile</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={handleLogout}
                    className="shrink-0 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold border-2 transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: "transparent",
                      color: "#F87171",
                      borderColor: "#F87171",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#DC2626";
                      e.currentTarget.style.color = "#FFFFFF";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#F87171";
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : isFreeUserLoggedIn ? (
                <>
                  {!isAdminPage && (
                    <>
                      <button
                        onClick={() => {
                          setSuccessState(false);
                          setHelpModalOpen(true);
                        }}
                        className="shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full font-semibold text-xs sm:text-sm text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-[0_10px_24px_rgba(52,227,138,0.4)]"
                        style={{
                          background: "linear-gradient(135deg, #34E38A, #0F7A45)",
                          boxShadow: "0 8px 20px rgba(15,122,69,0.35)",
                        }}
                      >
                        <FiHelpCircle size={16} />
                        <span>Get Help</span>
                      </button>
                      <NotificationBell />

                      <button
                        onClick={() => goTo("/profile")}
                        className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold text-xs sm:text-sm transition-all duration-300 active:scale-95 cursor-pointer relative hover:scale-105 shadow-sm"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.06)",
                          color: "#E5E7EB",
                          border: "1px solid rgba(255,255,255,0.2)",
                        }}
                        title="Profile (Free Trial)"
                      >
                        <FiUser size={15} />
                        <span>Profile</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleFreeUserLogout}
                    className="shrink-0 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold border-2 transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: "transparent",
                      color: "#F87171",
                      borderColor: "#F87171",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#DC2626";
                      e.currentTarget.style.color = "#FFFFFF";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#F87171";
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="relative" ref={loginDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setLoginDropdownOpen((prev) => !prev)}
                    className="shrink-0 flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-[0_10px_24px_rgba(52,227,138,0.4)] cursor-pointer select-none"
                    style={{
                      background: "linear-gradient(135deg, #6CFFB0, #22db91)",
                    }}
                  >
                    <span>Login</span>
                    <FiChevronDown
                      className={`text-sm transition-transform duration-300 ${
                        loginDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Animated 2-Card Login Selector Dropdown */}
                  {loginDropdownOpen && (
                    <div
                      className="gy-panel-in absolute right-0 top-full mt-3 w-80 sm:w-96 rounded-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.9)] z-50 backdrop-blur-2xl border"
                      style={{
                        backgroundColor: "#0E1613",
                        borderColor: "rgba(37, 211, 102, 0.25)",
                      }}
                    >
                      <div className="mb-3 px-1">
                        <h4 className="text-sm font-bold text-white tracking-wide">Select Login Type</h4>
                        <p className="text-xs text-white/50">Choose your account type to continue</p>
                      </div>

                      <div className="flex flex-col gap-2.5">
                        {/* Card 1: Subscription Login */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLoginTab("subscription");
                            setLoginDropdownOpen(false);
                            goTo("/userloginpage");
                          }}
                          onMouseEnter={() => setSelectedLoginTab("subscription")}
                          className={`group flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-all duration-300 cursor-pointer relative overflow-hidden ${
                            selectedLoginTab === "subscription"
                              ? "bg-[#25D366]/15 border-[#25D366] shadow-[0_0_20px_rgba(37,211,102,0.25)] scale-[1.02]"
                              : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-all duration-300 ${
                              selectedLoginTab === "subscription"
                                ? "bg-[#25D366] text-black shadow-md"
                                : "bg-white/10 text-[#34E38A] group-hover:bg-[#25D366]/20"
                            }`}
                          >
                            <FiShield size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-white">Subscription Login</span>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  selectedLoginTab === "subscription"
                                    ? "bg-[#25D366] text-black"
                                    : "bg-white/10 text-white/60"
                                }`}
                              >
                                Pro
                              </span>
                            </div>
                            <p className="text-xs text-white/60 mt-0.5 line-clamp-2">
                              For users with paid plans, bulk messaging &amp; premium tools
                            </p>
                          </div>
                        </button>

                        {/* Card 2: Free User Login */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLoginTab("free");
                            setLoginDropdownOpen(false);
                            goTo("/free-user/login");
                          }}
                          onMouseEnter={() => setSelectedLoginTab("free")}
                          className={`group flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-all duration-300 cursor-pointer relative overflow-hidden ${
                            selectedLoginTab === "free"
                              ? "bg-[#00F5D4]/15 border-[#00F5D4] shadow-[0_0_20px_rgba(0,245,212,0.25)] scale-[1.02]"
                              : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-all duration-300 ${
                              selectedLoginTab === "free"
                                ? "bg-[#00F5D4] text-black shadow-md"
                                : "bg-white/10 text-[#00F5D4] group-hover:bg-[#00F5D4]/20"
                            }`}
                          >
                            <FiZap size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-white">Free User Login</span>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  selectedLoginTab === "free"
                                    ? "bg-[#00F5D4] text-black"
                                    : "bg-white/10 text-white/60"
                                }`}
                              >
                                Free
                              </span>
                            </div>
                            <p className="text-xs text-white/60 mt-0.5 line-clamp-2">
                              Daily 10 free credits &amp; trial access to features
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className={`md:hidden relative w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ${
                mobileOpen ? "gy-burger-open" : ""
              }`}
              style={{ backgroundColor: "rgba(52,227,138,0.12)" }}
            >
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
                <rect className="gy-burger-line gy-burger-line-1" y="0" width="22" height="2.2" rx="1.1" fill="#6CFFB0" />
                <rect className="gy-burger-line gy-burger-line-2" y="6.9" width="22" height="2.2" rx="1.1" fill="#6CFFB0" />
                <rect className="gy-burger-line gy-burger-line-3" y="13.8" width="22" height="2.2" rx="1.1" fill="#6CFFB0" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        {mobileOpen && (
          <div
            className="gy-panel-in md:hidden absolute left-0 right-0 top-full mx-3 mt-2 rounded-2xl overflow-hidden shadow-2xl max-h-[calc(100vh-5rem)] overflow-y-auto"
            style={{
              background: "linear-gradient(160deg, rgba(4,32,20,0.98) 0%, rgba(7,52,32,0.98) 100%)",
              border: "1px solid rgba(52,227,138,0.2)",
              backdropFilter: "blur(16px)",
            }}
            role="dialog"
            aria-modal="true"
          >
            <ul className="flex flex-col px-3 py-4 gap-1">
              {navLinks.map((link, i) => {
                const isActive = isLinkActive(link);
                const isLocked = link.isRestricted;

                if (link.hasDropdown) {
                  return (
                    <li key={link.label} className="gy-link-in" style={{ animationDelay: `${i * 50}ms` }}>
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => setMobileAboutOpen((prev) => !prev)}
                          className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-base transition-all duration-200 flex items-center justify-between cursor-pointer ${
                            isActive || mobileAboutOpen ? "text-white" : "text-white/70 hover:text-white"
                          }`}
                          style={{
                            backgroundColor: isActive || mobileAboutOpen ? "rgba(52,227,138,0.16)" : "transparent",
                          }}
                        >
                          <span>{link.label}</span>
                          <FiChevronDown
                            className={`text-sm transition-transform duration-300 ${
                              mobileAboutOpen ? "rotate-180 text-[#34E38A]" : "text-white/50"
                            }`}
                          />
                        </button>

                        {/* Mobile Dropdown Sub-menu */}
                        {mobileAboutOpen && (
                          <div className="pl-4 pr-2 py-2 flex flex-col gap-1.5 border-l-2 border-[#25D366]/30 ml-4 my-1">
                            <button
                              type="button"
                              onClick={handleAboutUsClick}
                              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <FiInfo size={15} className="text-[#25D366]" />
                              <span>About Us</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleSubscriptionsClick}
                              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold text-[#6CFFB0] bg-[#25D366]/10 hover:bg-[#25D366]/20 flex items-center justify-between transition-colors border border-[#25D366]/20 cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <FiZap size={15} className="text-[#34E38A]" />
                                <span>Subscriptions</span>
                              </div>
                              <span className="text-[10px] bg-[#25D366] text-black font-extrabold px-2 py-0.5 rounded-full">
                                PLANS
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                }

                if (link.isFeaturesDropdown) {
                  return (
                    <li key={link.label} className="gy-link-in" style={{ animationDelay: `${i * 50}ms` }}>
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => setMobileFeaturesOpen((prev) => !prev)}
                          className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-base transition-all duration-200 flex items-center justify-between cursor-pointer ${
                            isActive || mobileFeaturesOpen ? "text-white" : "text-white/70 hover:text-white"
                          }`}
                          style={{
                            backgroundColor: isActive || mobileFeaturesOpen ? "rgba(52,227,138,0.16)" : "transparent",
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span>{link.label}</span>
                            {!isSubscribedUser && (
                              <span className="text-[10px] font-extrabold bg-gradient-to-r from-amber-400 to-amber-500 text-black px-1.5 py-0.5 rounded-full">
                                🔒 PRO
                              </span>
                            )}
                          </div>
                          <FiChevronDown
                            className={`text-sm transition-transform duration-300 ${
                              mobileFeaturesOpen ? "rotate-180 text-[#34E38A]" : "text-white/50"
                            }`}
                          />
                        </button>

                        {/* Mobile Features Dropdown Sub-menu */}
                        {mobileFeaturesOpen && (
                          <div className="pl-4 pr-2 py-2 flex flex-col gap-1.5 border-l-2 border-[#25D366]/30 ml-4 my-1">
                            <button
                              type="button"
                              onClick={() => {
                                setMobileOpen(false);
                                setMobileFeaturesOpen(false);
                                goTo("/group-management");
                              }}
                              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <FiUsers size={16} className="text-[#25D366]" />
                                <span>Group Scraping</span>
                              </div>
                              {!isSubscribedUser ? (
                                <span className="text-[10px] font-extrabold bg-gradient-to-r from-amber-400 to-amber-500 text-black px-2 py-0.5 rounded-full">
                                  🔒 PRO
                                </span>
                              ) : (
                                <span className="text-[10px] bg-[#25D366] text-black font-extrabold px-2 py-0.5 rounded-full">
                                  PRO
                                </span>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setMobileOpen(false);
                                setMobileFeaturesOpen(false);
                                goTo("/web-scraper");
                              }}
                              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <FiGlobe size={16} className="text-[#25D366]" />
                                <span>Web Scraper</span>
                              </div>
                              {!isSubscribedUser ? (
                                <span className="text-[10px] font-extrabold bg-gradient-to-r from-amber-400 to-amber-500 text-black px-2 py-0.5 rounded-full">
                                  🔒 PRO
                                </span>
                              ) : (
                                <span className="text-[10px] bg-[#25D366] text-black font-extrabold px-2 py-0.5 rounded-full">
                                  PRO
                                </span>
                              )}
                            </button>

                            
                            <button
                              type="button"
                              onClick={() => {
                                setMobileOpen(false);
                                setMobileFeaturesOpen(false);
                                goTo("/social-extractor");
                              }}
                              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <FiLayers size={16} className="text-[#25D366]" />
                                <span>Social Leads</span>
                              </div>
                              {!isSubscribedUser ? (
                                <span className="text-[10px] font-extrabold bg-gradient-to-r from-amber-400 to-amber-500 text-black px-2 py-0.5 rounded-full">
                                  🔒 PRO
                                </span>
                              ) : (
                                <span className="text-[10px] bg-[#25D366] text-black font-extrabold px-2 py-0.5 rounded-full">
                                  PRO
                                </span>
                              )}
                            </button>
                           
                          </div>
                        )}
                      </div>
                    </li>
                  );
                }

                const isProLocked = link.isProOnly && !isSubscribedUser;

                return (
                  <li key={link.label} className="gy-link-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <button
                      onClick={() => handleNavLinkClick(link)}
                      className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-base transition-all duration-200 flex items-center justify-between ${
                        isActive ? "text-white" : "text-white/70 hover:text-white"
                      } ${isLocked || isProLocked ? "cursor-pointer" : ""}`}
                      style={{
                        backgroundColor: isActive ? "rgba(52,227,138,0.16)" : "transparent",
                      }}
                    >
                      <span>{link.label}</span>
                      {isProLocked ? (
                        <span className="text-xs font-extrabold bg-gradient-to-r from-amber-400 to-amber-500 text-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                          🔒 PRO
                        </span>
                      ) : link.isProBadge ? (
                        <span className="text-xs font-extrabold bg-[#25D366] text-black px-2 py-0.5 rounded-full shadow-sm">
                          PRO
                        </span>
                      ) : isLocked ? (
                        <span className="text-xs bg-white/10 text-white/80 px-2 py-0.5 rounded-full border border-white/15 flex items-center gap-1">
                          🔒 Locked
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div
              className="px-3 pb-4 pt-3 border-t flex flex-col gap-3"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              {!isAdminPage && !isWhatsappConnected && (
                <button
                  onClick={handleConnect}
                  className="gy-link-in w-full text-center px-4 py-3 rounded-xl font-semibold text-white transition-all duration-200 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #34E38A, #0F7A45)",
                    animationDelay: "120ms",
                  }}
                >
                  Connect
                </button>
              )}

              {isLoggedIn ? (
                <div className="flex flex-col gap-3">
                  {!isAdminPage && (
                    <>
                      {/* Profile Option */}
                      <button
                        onClick={() => {
                          setMobileOpen(false);
                          goTo("/profile");
                        }}
                        className={`gy-link-in flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full font-semibold transition-all duration-300 active:scale-95 cursor-pointer ${
                          isSubscribedUser
                            ? "shadow-[0_0_15px_rgba(255,215,0,0.5),0_0_25px_rgba(52,227,138,0.35)]"
                            : "shadow-none"
                        }`}
                        style={
                          isSubscribedUser
                            ? {
                                border: "2px solid #FFD700",
                                background: "linear-gradient(135deg, rgba(255,215,0,0.2), rgba(52,227,138,0.15))",
                                color: "#FFD700",
                                animationDelay: "140ms",
                              }
                            : {
                                border: "1px solid rgba(255,255,255,0.2)",
                                backgroundColor: "rgba(255,255,255,0.06)",
                                color: "#9CA3AF",
                                animationDelay: "140ms",
                              }
                        }
                      >
                        <FiUser size={18} />
                        Profile {isSubscribedUser ? <span className="text-[#FFD700] ml-1 font-bold">(VIP 👑)</span> : <span className="text-white/60 ml-1">(Trial)</span>}
                      </button>

                      {/* Notification Option */}
                      <NotificationBell isMobileMenu={true} onMobileClose={() => setMobileOpen(false)} />

                      {/* Get Help Option */}
                      <button
                        onClick={() => {
                          setMobileOpen(false);
                          setSuccessState(false);
                          setHelpModalOpen(true);
                        }}
                        className="gy-link-in flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full font-semibold transition-all duration-300 active:scale-95 cursor-pointer"
                        style={{
                          background: "linear-gradient(135deg, #34E38A, #0F7A45)",
                          color: "white",
                          animationDelay: "180ms",
                        }}
                      >
                        <FiHelpCircle size={18} />
                        Get Help
                      </button>
                    </>
                  )}

                  {/* Logout Option */}
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                    className="gy-link-in flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full font-semibold border-2 transition-all duration-300 active:scale-95 cursor-pointer"
                    style={{
                      backgroundColor: "transparent",
                      color: "#F87171",
                      borderColor: "#F87171",
                      animationDelay: "200ms",
                    }}
                  >
                    <FiLogOut size={18} />
                    Logout
                  </button>
                </div>
              ) : isFreeUserLoggedIn ? (
                <div className="flex flex-col gap-3">
                  {!isAdminPage && (
                    <>
                      <button
                        onClick={() => {
                          setMobileOpen(false);
                          goTo("/profile");
                        }}
                        className="gy-link-in flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full font-semibold transition-all duration-300 active:scale-95 cursor-pointer shadow-none"
                        style={{
                          border: "1px solid rgba(255,255,255,0.2)",
                          backgroundColor: "rgba(255,255,255,0.06)",
                          color: "#9CA3AF",
                        }}
                      >
                        <FiUser size={18} />
                        Profile <span className="text-white/60 ml-1">(Trial)</span>
                      </button>
                      <NotificationBell isMobileMenu={true} onMobileClose={() => setMobileOpen(false)} />
                      <button
                        onClick={() => {
                          setMobileOpen(false);
                          setSuccessState(false);
                          setHelpModalOpen(true);
                        }}
                        className="gy-link-in flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full font-semibold transition-all duration-300 active:scale-95 cursor-pointer"
                        style={{
                          background: "linear-gradient(135deg, #34E38A, #0F7A45)",
                          color: "white",
                        }}
                      >
                        <FiHelpCircle size={18} />
                        Get Help
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleFreeUserLogout();
                    }}
                    className="gy-link-in flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full font-semibold border-2 transition-all duration-300 active:scale-95 cursor-pointer"
                    style={{
                      backgroundColor: "transparent",
                      color: "#F87171",
                      borderColor: "#F87171",
                    }}
                  >
                    <FiLogOut size={18} />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <p className="text-xs text-white/50 uppercase tracking-wider font-semibold px-1">Select Login Type</p>
                  
                  {/* Mobile Card 1: Subscription */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      goTo("/userloginpage");
                    }}
                    className="gy-link-in flex items-center justify-between px-5 py-3.5 rounded-xl font-semibold text-white transition-all duration-300 active:scale-95 shadow-md text-sm border border-[#25D366]/40 cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg, rgba(37,211,102,0.2), rgba(18,140,74,0.3))",
                      animationDelay: "170ms",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#25D366]/20 flex items-center justify-center text-[#34E38A]">
                        <FiShield size={16} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-white text-sm">Subscription Login</div>
                        <div className="text-[11px] text-white/60">Paid plans &amp; unlimited access</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-[#25D366] text-black font-extrabold px-2 py-0.5 rounded-full">PRO</span>
                  </button>

                  {/* Mobile Card 2: Free User */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      goTo("/free-user/login");
                    }}
                    className="gy-link-in flex items-center justify-between px-5 py-3.5 rounded-xl font-semibold text-white transition-all duration-300 active:scale-95 text-sm border border-[#00F5D4]/40 cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg, rgba(0,245,212,0.15), rgba(7,94,84,0.3))",
                      animationDelay: "200ms",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#00F5D4]/20 flex items-center justify-center text-[#00F5D4]">
                        <FiZap size={16} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-white text-sm">Free User Login</div>
                        <div className="text-[11px] text-white/60">Daily 10 credits &amp; trial access</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-[#00F5D4] text-black font-extrabold px-2 py-0.5 rounded-full">FREE</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Spacer so page content underneath is never hidden or covered by the fixed navbar */}
      <div className="w-full h-[72px] sm:h-[78px] shrink-0 pointer-events-none" aria-hidden="true" />

      {/* Backdrop for mobile menu */}
      {mobileOpen && (
        <div
          className="gy-backdrop-in fixed inset-0 z-[99995] bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Ultimate Large Glowing Floating AI Assistant Button */}
      {(isLoggedIn || isFreeUserLoggedIn) && !isAdminPage && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] group flex flex-col items-center justify-center">
          <style>{`
            @keyframes gyAiFloatLarge {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-6px); }
            }
            @keyframes gySpinRing {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes gyPulseGlow {
              0%, 100% { opacity: 0.85; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.05); }
            }
            @keyframes gySparkleFloat {
              0%, 100% { opacity: 0.2; transform: translateY(0) scale(0.8); }
              50% { opacity: 1; transform: translateY(-6px) scale(1.2); }
            }
          `}</style>

          {/* Premium Hover Tooltip (Hidden on mobile, visible on desktop) */}
          <div className="hidden sm:block absolute right-28 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 pointer-events-none z-50">
            <div className="bg-[#0D1117]/95 border-2 border-[#25D366]/50 text-white rounded-2xl px-4 py-2.5 shadow-[0_15px_45px_rgba(0,0,0,0.9),0_0_20px_rgba(37,211,102,0.3)] backdrop-blur-xl flex flex-col gap-0.5 whitespace-nowrap relative">
              <div className="flex items-center gap-2 font-extrabold text-sm text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-[#25D366] animate-ping"></span>
                Goye AI Assistant
              </div>
              <span className="text-xs text-[#9AA4AF] font-medium">Ask anything • Replies instantly</span>
              <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 bg-[#0D1117] border-t-2 border-r-2 border-[#25D366]/50 rotate-45"></div>
            </div>
          </div>

          {/* Ground Radial Glow Shadow */}
          <div className="w-12 h-3 sm:w-20 sm:h-4 rounded-full bg-[#25D366]/50 blur-lg sm:blur-xl absolute -bottom-1.5 transition-all duration-300 group-hover:w-16 sm:group-hover:w-24 group-hover:bg-[#25D366]/70"></div>

          {/* Floating Sparkle Particles */}
          <span className="absolute -top-2 -left-1 sm:-top-3 sm:-left-2 text-xs sm:text-sm text-amber-300 pointer-events-none" style={{ animation: 'gySparkleFloat 3s ease-in-out infinite' }}>✨</span>
          <span className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 text-[10px] sm:text-xs text-emerald-300 pointer-events-none" style={{ animation: 'gySparkleFloat 2.5s ease-in-out infinite 0.8s' }}>💫</span>
          <span className="absolute top-1/2 -left-3 sm:-left-4 text-[10px] sm:text-xs text-green-300 pointer-events-none" style={{ animation: 'gySparkleFloat 3.5s ease-in-out infinite 1.5s' }}>⭐</span>

          {/* Main Button */}
          <button
            onClick={() => setBotOpen(!botOpen)}
            className="relative w-14 h-14 sm:w-28 sm:h-28 rounded-full p-1 sm:p-1.5 bg-[#0D1117]/95 backdrop-blur-2xl border-2 sm:border-4 border-[#0D1117] shadow-[0_0_25px_rgba(37,211,102,0.4),0_10px_20px_rgba(0,0,0,0.6)] sm:shadow-[0_0_50px_rgba(37,211,102,0.5),0_0_20px_rgba(37,211,102,0.3),0_15px_30px_rgba(0,0,0,0.7)] hover:shadow-[0_0_70px_rgba(37,211,102,0.8)] hover:scale-105 sm:hover:scale-[1.15] active:scale-90 transition-all duration-300 ease-out cursor-pointer flex items-center justify-center overflow-visible"
            style={{ animation: 'gyAiFloatLarge 4s ease-in-out infinite, gyPulseGlow 3s ease-in-out infinite' }}
            aria-label="Toggle Goye AI Assistant"
          >
            {/* Rotating Outer Glowing Gradient Ring */}
            <span
              className="absolute -inset-1 sm:-inset-1.5 rounded-full bg-gradient-to-r from-[#25D366] via-emerald-400 via-teal-300 to-[#25D366] blur-xs sm:blur-sm opacity-90 group-hover:opacity-100 transition-opacity"
              style={{ animation: 'gySpinRing 6s linear infinite' }}
            ></span>

            {/* Inner Dark Mask Ring */}
            <span className="absolute inset-0.5 rounded-full bg-[#0D1117]"></span>

            {/* Inner WhatsApp-Style Gradient Core Button */}
            <div className="relative w-full h-full rounded-full bg-gradient-to-tr from-[#075E54] via-[#128C7E] to-[#25D366] flex items-center justify-center text-white border sm:border-2 border-white/40 shadow-2xl overflow-hidden">
              {/* Glossy Top Glass Lighting */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-white/10 to-transparent pointer-events-none"></div>

              {botOpen ? (
                <FiX className="relative z-10 text-white drop-shadow-lg transition-transform duration-300 rotate-0 group-hover:rotate-90 shrink-0 text-xl sm:text-3xl" />
              ) : (
                <div className="relative z-10 flex items-center justify-center">
                  <FaRobot className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-110 text-2xl sm:text-4xl" />
                  <span className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 text-xs sm:text-sm text-amber-300 animate-bounce drop-shadow">✨</span>
                </div>
              )}
            </div>

            {/* Live Online Pulse Dot Badge */}
            {!botOpen && (
              <span className="absolute top-0 right-0 sm:top-1 sm:right-1 flex h-3.5 w-3.5 sm:h-5 sm:w-5 z-30">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-85"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 sm:h-5 sm:w-5 bg-[#25D366] border border-white/20 sm:border-2 border-[#0D1117] shadow-md"></span>
              </span>
            )}
          </button>
        </div>
      )}

      {/* Premium Goye AI Chatbot Widget */}
      <GoyeAiChatbot isOpen={botOpen} onClose={() => setBotOpen(false)} />

      {/* Help & Support Modal */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm gy-fade-in">
          <div 
            className="bg-[#0E1613] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 relative max-h-[92vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transition-all transform gy-scale-up text-white"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {/* Close Button */}
            <button
              onClick={() => setHelpModalOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5 z-10"
            >
              <FiX size={20} />
            </button>

            {successState ? (
              renderSuccess()
            ) : (
              <>
                <h3 className="text-xl font-bold text-white mb-6 font-['Space_Grotesk']">Help & Support</h3>

                {/* Tabs Header */}
                <div className="flex border-b border-white/10 mb-6">
                  <button
                    type="button"
                    onClick={() => setActiveTab("report")}
                    className={`flex-1 pb-3 text-sm font-semibold transition-colors relative ${
                      activeTab === "report" ? "text-[#25D366]" : "text-white/50 hover:text-white"
                    }`}
                  >
                    Report an Issue
                    {activeTab === "report" && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#25D366]" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("feedback")}
                    className={`flex-1 pb-3 text-sm font-semibold transition-colors relative ${
                      activeTab === "feedback" ? "text-[#25D366]" : "text-white/50 hover:text-white"
                    }`}
                  >
                    Share Feedback
                    {activeTab === "feedback" && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#25D366]" />
                    )}
                  </button>
                </div>

                {/* Tab Forms */}
                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  {activeTab === "report" ? (
                    <>
                      {/* Issue Type */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide">
                          Issue Type *
                        </label>
                        <select
                          value={issueType}
                          onChange={(e) => setIssueType(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#121A16] border border-[#1E2822] rounded-xl text-sm text-white outline-none focus:bg-[#0E1613] focus:border-[#25D366] transition-all"
                        >
                          <option value="WhatsApp Connection" className="bg-[#0E1613] text-white">WhatsApp Connection</option>
                          <option value="Message Sending" className="bg-[#0E1613] text-white">Message Sending</option>
                          <option value="Bulk Messaging" className="bg-[#0E1613] text-white">Bulk Messaging</option>
                          <option value="Scheduled Messages" className="bg-[#0E1613] text-white">Scheduled Messages</option>
                          <option value="Account/Login" className="bg-[#0E1613] text-white">Account/Login</option>
                          <option value="Credits" className="bg-[#0E1613] text-white">Credits</option>
                          <option value="Bug Report" className="bg-[#0E1613] text-white">Bug Report</option>
                          <option value="Other" className="bg-[#0E1613] text-white">Other</option>
                        </select>
                      </div>

                      {/* Custom Issue Type Input */}
                      {issueType === "Other" && (
                        <div className="space-y-1.5 pt-1">
                          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide">
                            Specify Other Issue *
                          </label>
                          <input
                            type="text"
                            required
                            value={customIssueType}
                            onChange={(e) => setCustomIssueType(e.target.value)}
                            placeholder="Type your custom issue topic..."
                            className="w-full px-4 py-2.5 bg-[#121A16] border border-[#1E2822] rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-[#25D366] transition-all"
                          />
                        </div>
                      )}

                      {/* Description */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide">
                          Description *
                        </label>
                        <textarea
                          required
                          rows="4"
                          value={issueDescription}
                          onChange={(e) => setIssueDescription(e.target.value)}
                          placeholder="Please describe the issue in detail..."
                          className="w-full px-4 py-2.5 bg-[#121A16] border border-[#1E2822] rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-[#25D366] transition-all resize-none"
                        />
                      </div>

                      {/* Screenshot Upload */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide">
                          Screenshot (Optional)
                        </label>
                        <div className="relative border border-dashed border-[#1E2822] rounded-xl px-4 py-3 flex items-center justify-between hover:border-[#25D366] hover:bg-[#25D366]/5 transition-all cursor-pointer">
                          <span className="text-xs text-white/50 truncate pr-4">
                            {screenshot ? screenshot.filename : "Upload screenshot..."}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleScreenshotChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <button
                            type="button"
                            className="text-xs text-[#25D366] font-semibold shrink-0"
                          >
                            Browse
                          </button>
                        </div>
                      </div>

                      {/* Submit button */}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-[#25D366] hover:bg-[#128C4A] disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all mt-4 flex items-center justify-center cursor-pointer"
                      >
                        {submitting ? "Submitting..." : "Submit Report"}
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Rating */}
                      <div className="space-y-1.5 text-center">
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide text-left">
                          Rating *
                        </label>
                        {renderStars()}
                      </div>

                      {/* Feedback Text */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide">
                          Feedback *
                        </label>
                        <textarea
                          required
                          rows="4"
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder="Tell us how we can improve Goye..."
                          className="w-full px-4 py-2.5 bg-[#121A16] border border-[#1E2822] rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-[#25D366] transition-all resize-none"
                        />
                      </div>

                      {/* Submit button */}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-[#25D366] hover:bg-[#128C4A] disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all mt-4 flex items-center justify-center cursor-pointer"
                      >
                        {submitting ? "Submitting..." : "Submit Feedback"}
                      </button>
                    </>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* User Credit Earned & Free User Toast Notification Banner */}
      {(activeToast || showFreeUserToast) && (
        <div className={`fixed top-24 right-4 sm:right-6 z-[100005] bg-[#0E1613]/98 border-2 ${activeToast?.type === 'request_rejected' ? 'border-red-500 shadow-[0_10px_40px_rgba(239,68,68,0.35)]' : 'border-[#25D366] shadow-[0_10px_40px_rgba(37,211,102,0.35)]'} text-white px-5 py-4 rounded-2xl flex items-center gap-4 animate-bounce max-w-sm backdrop-blur-xl`}>
          <div className={`w-10 h-10 rounded-full ${activeToast?.type === 'request_rejected' ? 'bg-red-500/20 text-red-400' : 'bg-[#25D366]/20 text-[#25D366]'} flex items-center justify-center text-xl shrink-0`}>
            {activeToast ? (activeToast.type === 'request_rejected' ? "❌" : (activeToast.title?.includes("Queued") ? "⏳" : "🎉")) : "🎁"}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className={`text-xs sm:text-sm font-extrabold ${activeToast?.type === 'request_rejected' ? 'text-red-400' : 'text-[#6CFFB0]'} leading-tight whitespace-pre-line`}>
              {activeToast ? activeToast.message : `${effectiveCredits !== undefined ? effectiveCredits : 30} Free Trial Credits Activated!`}
            </p>
            <p className="text-[10px] text-white/60 font-medium mt-1">
              {activeToast ? (activeToast.title || (activeToast.type === 'request_rejected' ? "Plan Request Rejected" : "Your subscription plan is active!")) : "Enjoy bulk WhatsApp messaging with Goye free tier!"}
            </p>
          </div>
          <button 
            onClick={() => {
              if (activeToast) {
                setActiveToast(null);
                markAsRead();
              } else {
                setDismissedFreeUserToast(true);
                sessionStorage.setItem("dismissedFreeUserToast", "true");
              }
            }}
            className="text-white/40 hover:text-white text-xs bg-white/10 p-1.5 rounded-full transition-colors shrink-0 cursor-pointer"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Free User Plan Upgraded Modal */}
      {upgradeApprovalModal && (
        <div className="fixed inset-0 z-[100010] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-[#0B140E] border-2 border-[#25D366]/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_50px_rgba(37,211,102,0.25)] p-6 sm:p-8 text-center animate-scaleUp text-white">
            {/* Close Button */}
            <button
              onClick={() => {
                setUpgradeApprovalModal(null);
                setDismissedUpgradeModal(true);
              }}
              className="absolute top-4 right-4 text-white/40 hover:text-white p-2 rounded-xl transition-colors cursor-pointer"
              title="Close"
            >
              ✕
            </button>

            {/* Glowing Icon */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] text-3xl shadow-[0_0_30px_rgba(37,211,102,0.35)]">
              <FaCrown />
            </div>

            {/* Tag */}
            <span className="text-[11px] uppercase tracking-widest font-black text-[#25D366] bg-[#25D366]/10 px-3.5 py-1 rounded-full border border-[#25D366]/30 inline-block mb-3">
              🎉 Plan Approved
            </span>

            {/* Header */}
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-['Space_Grotesk'] mb-2">
              Your plan has been upgraded successfully.
            </h2>

            {/* Description Box */}
            <div className="bg-[#121A16] border border-[#25D366]/20 rounded-2xl p-4 my-4 text-left">
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium whitespace-pre-line">
                {upgradeApprovalModal.message || "Your subscription request has been approved by Admin."}
              </p>
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-xs text-[#6CFFB0] font-semibold">
                <FaLock className="text-xs shrink-0" />
                <span>Please log in through Subscription Login to use your upgraded plan.</span>
              </div>
            </div>

            {/* Login Here Button */}
            <button
              type="button"
              onClick={() => handleRedirectToSubscriptionLogin(upgradeApprovalModal)}
              className="w-full py-3.5 bg-gradient-to-r from-[#25D366] via-[#20BD5A] to-[#128C7E] hover:opacity-95 text-black font-extrabold text-base rounded-xl shadow-[0_4px_25px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_30px_rgba(37,211,102,0.6)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Login Here</span>
              <FaArrowRight className="text-xs" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}