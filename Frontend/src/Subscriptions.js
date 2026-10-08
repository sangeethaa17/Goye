import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { 
    FaShieldAlt, 
    FaCheckCircle, FaTimes, FaCrown, FaArrowLeft,
    FaWhatsapp, FaFileCsv, FaRegClock, 
    FaHeadset, FaBolt
} from 'react-icons/fa';

export default function Subscriptions() {
    const navigate = useNavigate();
    const location = useLocation();

    const [activeCategory, setActiveCategory] = useState('daily');
    const isFreeUserLoggedIn = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");

    const [modalPlan, setModalPlan] = useState(null);
    const [activeModalTab, setActiveModalTab] = useState('options');
    const [requestFormData, setRequestFormData] = useState({ name: '', email: '', message: '' });

    const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState(false);
    const [upiId, setUpiId] = useState('');
    const [screenshotFile, setScreenshotFile] = useState(null);
    const [screenshotPreview, setScreenshotPreview] = useState(null);
    const [confirmError, setConfirmError] = useState('');
    const [confirmSuccess, setConfirmSuccess] = useState('');
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

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
            buttonBg: 'bg-gradient-to-r from-[#00F5D4] to-[#25D366] hover:opacity-90 text-black font-extrabold',
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
            buttonBg: 'bg-sky-400 hover:bg-sky-500 text-black',
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
            buttonBg: 'bg-orange-400 hover:bg-orange-500 text-black',
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
            buttonBg: 'bg-[#34E38A] hover:bg-[#22db91] text-black',
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
            buttonBg: 'bg-cyan-400 hover:bg-cyan-500 text-black',
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
            buttonBg: 'bg-purple-400 hover:bg-purple-500 text-white',
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
            buttonBg: 'bg-amber-400 hover:bg-amber-500 text-black',
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
            buttonBg: 'bg-rose-400 hover:bg-rose-500 text-white',
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
        setIsSubmittingPayment(false);
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
        if (isSubmittingPayment) return;

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

        setIsSubmittingPayment(true);
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

            const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://goye.onrender.com';
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
                window.dispatchEvent(new Event('gy:subscription-request-created'));
                window.dispatchEvent(new Event('renewPlanRequested'));
            } else {
                setConfirmError(data.message || 'Failed to submit payment details. Please try again.');
            }
        } catch (err) {
            console.error('Error submitting payment details:', err);
            setConfirmError('Network error. Please try again.');
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    const closeModal = () => {
        setModalPlan(null);
        setActiveModalTab('options');
        setRequestFormData({ name: '', email: '', message: '' });
        handleCloseConfirmModal();
    };

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

    return (
        <div className="min-h-screen w-full bg-[#212122] py-12 px-4 sm:py-20 sm:px-6 overflow-x-hidden relative">
            <style>{`
                @keyframes gyFloat { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-24px) translateX(10px); } }
                @keyframes gyFloatSlow { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(20px) translateX(-14px); } }
                @keyframes gyGradientMove { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
                @keyframes gyPopIn { 0% { opacity: 0; transform: translateY(28px) scale(0.96); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes gyShine { 0% { transform: translateX(-120%) skewX(-12deg); } 100% { transform: translateX(220%) skewX(-12deg); } }
                .gy-gradient-text { background-size: 200% auto; animation: gyGradientMove 6s ease-in-out infinite; }
                .gy-pop { opacity: 0; animation: gyPopIn 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }
                .gy-shine-btn { position: relative; overflow: hidden; }
                .gy-shine-btn .gy-shine { position: absolute; top: 0; left: 0; width: 40%; height: 100%; background: linear-gradient(120deg, transparent, rgba(255,255,255,0.55), transparent); transform: translateX(-120%) skewX(-12deg); }
                .gy-shine-btn:hover .gy-shine { animation: gyShine 0.9s ease forwards; }
                .gy-tilt { transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease; }
                .gy-tilt:hover { transform: translateY(-10px) scale(1.02); }
                @keyframes gyModalPop { 0% { opacity: 0; transform: scale(0.9) translateY(24px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
                @keyframes gyFadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
                .gy-modal-pop { animation: gyModalPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                .gy-fade-in { animation: gyFadeIn 0.25s ease-out forwards; }
            `}</style>
            
            {/* Background Decorations */}
            <div className="absolute top-0 left-4 sm:left-20 w-40 h-40 sm:w-72 sm:h-72 bg-[#25D366] rounded-full mix-blend-screen filter blur-3xl opacity-[0.12]" style={{ animation: 'gyFloat 9s ease-in-out infinite' }}></div>
            <div className="absolute bottom-20 right-4 sm:right-20 w-48 h-48 sm:w-96 sm:h-96 bg-[#128C7E] rounded-full mix-blend-screen filter blur-3xl opacity-[0.16]" style={{ animation: 'gyFloatSlow 11s ease-in-out infinite', animationDelay: '2s' }}></div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Hero Header */}
                <div className="text-center mb-6 sm:mb-8 animate-fade-in-up px-2">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#25D366]/10 text-[#25D366] font-bold text-xs sm:text-sm tracking-widest uppercase rounded-full mb-4 border border-[#25D366]/20">
                        <span className="animate-pulse">💎</span> PREMIUM PRICING &amp; PLANS
                    </div>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white mb-4 sm:mb-6 tracking-tight break-words">
                        Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#128C7E] via-[#25D366] to-[#128C7E] gy-gradient-text">Subscription Plan</span>
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-white/60 max-w-2xl mx-auto font-medium">
                        Supercharge your business growth with powerful WhatsApp automation, high-converting leads, and effortless customer engagement.
                    </p>
                </div>

                {/* - OR WATCH VIDEO TO EARN CREDITS - Section (Only for Free Users) */}
                {isFreeUserLoggedIn && (
                    <div className="flex flex-col items-center justify-center mt-6 mb-10 animate-fade-in px-2">
                        <div className="text-xs sm:text-sm font-bold tracking-[0.2em] text-[#25D366] uppercase mb-4 drop-shadow-[0_0_10px_rgba(37,211,102,0.4)]">
                            - OR WATCH VIDEO TO EARN CREDITS -
                        </div>
                        
                        <div className="flex items-center gap-2 sm:gap-3.5">
                            {/* Left Radiant Sparks */}
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#25D366] shrink-0 drop-shadow-[0_0_8px_rgba(37,211,102,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                                {/* Top diagonal up-left */}
                                <line x1="18" y1="8" x2="6" y2="4" />
                                {/* Middle horizontal left */}
                                <line x1="20" y1="12" x2="4" y2="12" />
                                {/* Bottom diagonal down-left */}
                                <line x1="18" y1="16" x2="6" y2="20" />
                            </svg>

                            {/* Watch Video Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    window.dispatchEvent(new Event("showVideoModal"));
                                }}
                                className="group relative inline-flex items-center gap-3 px-6 sm:px-8 py-3 rounded-full bg-[#051a0e] border-2 border-[#25D366] shadow-[0_0_25px_rgba(37,211,102,0.6)] hover:shadow-[0_0_35px_rgba(37,211,102,0.9)] hover:bg-[#072414] transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
                            >
                                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center text-black shadow-md group-hover:scale-110 transition-transform pl-0.5">
                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black fill-current" viewBox="0 0 24 24">
                                        <polygon points="6 3 20 12 6 21 6 3" />
                                    </svg>
                                </span>
                                <span className="text-sm sm:text-base font-bold text-white group-hover:text-[#25D366] transition-colors tracking-wide">
                                    Watch Video
                                </span>
                            </button>

                            {/* Right Radiant Sparks */}
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#25D366] shrink-0 drop-shadow-[0_0_8px_rgba(37,211,102,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                                {/* Top diagonal up-right */}
                                <line x1="6" y1="8" x2="18" y2="4" />
                                {/* Middle horizontal right */}
                                <line x1="4" y1="12" x2="20" y2="12" />
                                {/* Bottom diagonal down-right */}
                                <line x1="6" y1="16" x2="18" y2="20" />
                            </svg>
                        </div>
                    </div>
                )}

                {/* Category Toggle Switch */}
                <div className="flex justify-center mb-12 w-full pt-2">
                    <div className="bg-[#061109] border border-[#143e24] rounded-full p-1.5 inline-flex items-center gap-1.5 shadow-[0_8px_25px_rgba(0,0,0,0.6)] select-none max-w-full overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setActiveCategory('daily')}
                            className={`px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer whitespace-nowrap ${
                                activeCategory === 'daily'
                                    ? 'bg-[#25D366] text-black shadow-[0_0_20px_rgba(37,211,102,0.5)] scale-105'
                                    : 'text-white/70 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            Daily Plans
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveCategory('monthly')}
                            className={`px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer whitespace-nowrap ${
                                activeCategory === 'monthly'
                                    ? 'bg-[#25D366] text-black shadow-[0_0_20px_rgba(37,211,102,0.5)] scale-105'
                                    : 'text-white/70 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            Monthly Plans
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveCategory('yearly')}
                            className={`px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer whitespace-nowrap ${
                                activeCategory === 'yearly'
                                    ? 'bg-[#25D366] text-black shadow-[0_0_20px_rgba(37,211,102,0.5)] scale-105'
                                    : 'text-white/70 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            Yearly Plans
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveCategory('all')}
                            className={`px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer whitespace-nowrap ${
                                activeCategory === 'all'
                                    ? 'bg-[#25D366] text-black shadow-[0_0_20px_rgba(37,211,102,0.5)] scale-105'
                                    : 'text-white/70 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            All Plans
                        </button>
                    </div>
                </div>

                {/* Pricing Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full max-w-7xl mb-20">
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
                                'Manual Delay Setting',
                                'Automatic AI Response',
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
                                        'Manual Delay Setting',
                                'Automatic AI Response',
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
                                        'Manual Delay Setting',
                                'Automatic AI Response',
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
                                        'Manual Delay Setting',
                                'Automatic AI Response',
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
                                        'Manual Delay Setting',
                                'Automatic AI Response',
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
                                        'Manual Delay Setting',
                                'Automatic AI Response',
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
                                        'Manual Delay Setting',
                                'Automatic AI Response',
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
                                        'Manual Delay Setting',
                                'Automatic AI Response',
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
                    .filter(plan => activeCategory === 'all' || plan.category === activeCategory)
                    .map(plan => {
                        const storedCredits = localStorage.getItem("credits");
                        const numCredits = storedCredits !== null ? parseInt(storedCredits, 10) : 0;
                        const freeTrialEnded = localStorage.getItem("freeTrialEnded") === "true";
                        const isFreeUser = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");
                        const isSubscribed = localStorage.getItem("isSubscribed") === "true";
                        const activeSubPlan = (localStorage.getItem("subscriptionPlan") || "").toLowerCase();
                        
                        const isDemoActive = plan.isDemo && (isFreeUser && numCredits > 0 && !freeTrialEnded && !isSubscribed);
                        const isPaidPlanActive = !plan.isDemo && isSubscribed && (activeSubPlan === plan.key.toLowerCase() || activeSubPlan === plan.title.toLowerCase());
                        const isPlanActive = isDemoActive || isPaidPlanActive;

                        let borderAndShadow = 'border border-[#143e24] shadow-[8px_8px_0px_0px_#0d2e1a,0_15px_35px_rgba(0,0,0,0.8)] hover:border-[#25D366] hover:shadow-[10px_10px_0px_0px_#25D366,0_20px_40px_rgba(0,0,0,0.9)] hover:-translate-x-0.5 hover:-translate-y-0.5';
                        if (isPlanActive) {
                            borderAndShadow = 'border-2 border-[#25D366] shadow-[8px_8px_0px_0px_#15803d,0_15px_35px_rgba(0,0,0,0.8)]';
                        } else if (plan.isGolden) {
                            borderAndShadow = 'border-2 border-[#eab308] shadow-[8px_8px_0px_0px_#ca8a04,0_15px_35px_rgba(0,0,0,0.8)] hover:shadow-[10px_10px_0px_0px_#eab308,0_20px_40px_rgba(0,0,0,0.9)] hover:-translate-x-0.5 hover:-translate-y-0.5';
                        } else if (plan.isPopular) {
                            borderAndShadow = 'border-2 border-[#25D366] shadow-[8px_8px_0px_0px_#15803d,0_15px_35px_rgba(0,0,0,0.8)] hover:shadow-[10px_10px_0px_0px_#25D366,0_20px_40px_rgba(0,0,0,0.9)] hover:-translate-x-0.5 hover:-translate-y-0.5';
                        }

                        const titleColor = plan.isGolden 
                            ? 'text-[#eab308]' 
                            : (plan.isPopular || plan.title === 'SPARK') 
                                ? 'text-[#25D366]' 
                                : 'text-white group-hover:text-[#25D366] transition-colors duration-300';

                        const priceColor = plan.isGolden ? 'text-[#eab308]' : 'text-[#25D366]';
                        const checkColor = plan.isGolden ? 'text-[#eab308]' : 'text-[#25D366]';

                        return (
                            <div
                                key={plan.key}
                                onClick={() => {
                                    if (!plan.isDemo) {
                                        setModalPlan(plan.key);
                                    }
                                }}
                                className={`rounded-[24px] p-8 sm:p-9 flex flex-col justify-between relative cursor-pointer group transition-all duration-300 ease-out bg-[#030e06] ${borderAndShadow}`}
                            >
                                {/* Top Centered Pill Badges */}
                                {isPlanActive ? (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-semibold bg-[#0d2a17] text-[#25D366] border border-[#25D366]/60 shadow-[0_0_15px_rgba(37,211,102,0.35)] whitespace-nowrap z-10">
                                        <FaCheckCircle className="text-xs text-[#25D366]" /> Active Plan
                                    </div>
                                ) : plan.isPopular ? (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-bold bg-[#0d2a17] text-[#25D366] border border-[#25D366]/60 shadow-[0_0_15px_rgba(37,211,102,0.35)] whitespace-nowrap z-10">
                                        <FaCrown className="text-xs text-[#25D366]" /> Most Popular
                                    </div>
                                ) : plan.isGolden ? (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-bold bg-[#261d07] text-[#f59e0b] border border-[#f59e0b]/60 shadow-[0_0_15px_rgba(245,158,11,0.35)] whitespace-nowrap z-10">
                                        <FaCrown className="text-xs text-[#f59e0b]" /> Best Value Pack
                                    </div>
                                ) : null}

                                {/* Card Header & Price */}
                                <div className="flex flex-col items-center text-center">
                                    <h3 className={`text-xl font-serif font-black uppercase tracking-widest mb-1.5 ${titleColor}`}>
                                        {plan.title}
                                    </h3>
                                    <p className="text-xs text-white/60 mb-5 min-h-[28px] flex items-center justify-center font-normal max-w-xs">
                                        {plan.subtitle}
                                    </p>

                                    {/* Price */}
                                    <div className="flex flex-col items-center mb-6">
                                        <span className={`text-4xl sm:text-5xl font-serif font-black ${priceColor} tracking-tight drop-shadow-[0_0_18px_rgba(37,211,102,0.45)]`}>
                                            {plan.price}
                                        </span>
                                        <span className="text-xs font-normal text-white/50 mt-1.5">
                                            {plan.duration}
                                        </span>
                                    </div>

                                    {/* Feature Bullet Points */}
                                    <ul className="w-full flex flex-col gap-2.5 text-left mb-8">
                                        {plan.features.map((feat, idx) => (
                                             <li key={idx} className="flex items-start gap-2.5 text-sm text-white/90 leading-relaxed font-medium">
                                                <span className={`${checkColor} font-bold text-sm shrink-0 mt-0.5 drop-shadow-md`}>✓</span>
                                                <span className="tracking-wide">{feat}</span>
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
                                        }}
                                        className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#C5A028] text-black shadow-[0_0_20px_rgba(212,175,55,0.45)] hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] hover:opacity-95 transition-all duration-300 cursor-pointer flex items-center justify-center"
                                    >
                                        Choose Plan
                                    </button>
                                ) : plan.isPopular ? (
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setModalPlan(plan.key); 
                                        }}
                                        className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-[#25D366] hover:bg-[#1ebd5a] text-black shadow-[0_0_20px_rgba(37,211,102,0.6)] hover:shadow-[0_0_30px_rgba(37,211,102,0.8)] transition-all duration-300 cursor-pointer flex items-center justify-center"
                                    >
                                        Choose Plan
                                    </button>
                                ) : (
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setModalPlan(plan.key); 
                                        }}
                                        className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#06190e] hover:bg-[#25D366] text-white hover:text-black border border-[#25D366]/40 hover:border-[#25D366] hover:shadow-[0_0_25px_rgba(37,211,102,0.5)] transition-all duration-300 cursor-pointer shadow-md flex items-center justify-center"
                                    >
                                        Choose Plan
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Pricing Features Footer Strip */}
                <div className="w-full max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-[20px] bg-white/[0.01] border border-white/[0.06] backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center text-lg shrink-0">
                            <FaShieldAlt />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-white leading-tight">Secure Payments</p>
                            <p className="text-[10px] text-white/40 font-medium">100% Protected</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center text-lg shrink-0">
                            <FaHeadset />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-white leading-tight">24/7 Support</p>
                            <p className="text-[10px] text-white/40 font-medium">Always Here to Help</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center text-lg shrink-0">
                            <FaBolt />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-white leading-tight">Instant Activation</p>
                            <p className="text-[10px] text-white/40 font-medium">Get Started Immediately</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center text-lg shrink-0">
                            <FaRegClock />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-white leading-tight">No Hidden Charges</p>
                            <p className="text-[10px] text-white/40 font-medium">Transparent Pricing</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Dialog for Activation Methods */}
            {modalPlan && (
                <div 
                    onClick={closeModal}
                    className="fixed inset-0 z-[100010] flex items-center justify-center bg-black/85 backdrop-blur-xl p-3 sm:p-6 transition-all duration-300 gy-fade-in overflow-y-auto no-scrollbar"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className={`bg-gradient-to-br from-[#121214]/98 to-[#080809]/98 border-2 border-[#25D366]/30 max-w-2xl w-full overflow-hidden rounded-2xl sm:rounded-[2.5rem] shadow-[0_30px_100px_-15px_rgba(0,0,0,1),0_0_50px_rgba(37,211,102,0.15)] relative transition-all duration-500 text-left backdrop-blur-3xl gy-modal-pop ring-1 ring-white/10 my-auto max-h-[92vh] flex flex-col no-scrollbar`}
                    >
                        {/* Premium Glowing Orbs */}
                        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[100px] opacity-30 bg-${planDetails[modalPlan].colorClass.replace('text-', '')} pointer-events-none`}></div>
                        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20 bg-${planDetails[modalPlan].colorClass.replace('text-', '')} pointer-events-none`}></div>
                        
                        {/* Back button */}
                        <button 
                            onClick={() => activeModalTab === 'options' ? closeModal() : setActiveModalTab('options')}
                            className={`absolute top-4 sm:top-5 left-4 sm:left-5 text-white/80 hover:text-white transition-all p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 z-50 hover:-translate-x-0.5 backdrop-blur-md border border-white/15 cursor-pointer shadow-md`}
                            title="Back"
                        >
                            <FaArrowLeft className="text-xs sm:text-sm" />
                        </button>
                        
                        {/* Close button */}
                        <button 
                            onClick={closeModal}
                            className={`absolute top-4 sm:top-5 right-4 sm:right-5 text-white/80 hover:text-white transition-all p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 z-50 hover:rotate-90 hover:scale-110 backdrop-blur-md border border-white/15 cursor-pointer shadow-md`}
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
                                             className={`bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${planDetails[modalPlan].hoverText.replace('hover:', 'hover:shadow-')} flex flex-col justify-between group`}
                                         >
                                             <div>
                                                 <div className={`text-3xl sm:text-4xl mb-2.5 sm:mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 drop-shadow-lg`}>📨</div>
                                                 <h5 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider mb-1.5 sm:mb-2 group-hover:text-blue-300 transition-colors">Request Activation</h5>
                                                 <p className="text-[11px] sm:text-xs text-white/50 font-medium leading-relaxed mb-3 sm:mb-4">Send your selected plan request directly to the admin for manual approval</p>
                                             </div>
                                             <span className={`text-[11px] sm:text-xs font-black ${planDetails[modalPlan].colorClass} bg-white/5 py-2 sm:py-2.5 rounded-xl group-hover:bg-white/10 transition-colors uppercase tracking-widest`}>Send Request &rarr;</span>
                                         </div>

                                         {/* Option 2: Pay Directly */}
                                         <div 
                                             onClick={() => setActiveModalTab('payment')}
                                             className={`bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${planDetails[modalPlan].hoverText.replace('hover:', 'hover:shadow-')} flex flex-col justify-between group`}
                                         >
                                             <div>
                                                 <div className={`text-3xl sm:text-4xl mb-2.5 sm:mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 drop-shadow-lg`}>💳</div>
                                                 <h5 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider mb-1.5 sm:mb-2 group-hover:text-green-300 transition-colors">Pay Directly</h5>
                                                 <p className="text-[11px] sm:text-xs text-white/50 font-medium leading-relaxed mb-3 sm:mb-4">Complete your payment securely via QR code and activate instantly</p>
                                             </div>
                                             <span className={`text-[11px] sm:text-xs font-black ${planDetails[modalPlan].colorClass} bg-white/5 py-2 sm:py-2.5 rounded-xl group-hover:bg-white/10 transition-colors uppercase tracking-widest`}>Proceed to Pay &rarr;</span>
                                         </div>
                                     </div>
                                </div>
                            </>
                        )}

                        {activeModalTab === 'contact' && (
                            <div className="p-4 sm:p-8 text-center overflow-y-auto overscroll-contain flex-1 no-scrollbar">
                                <div className="mt-4">
                                    <div className={`w-16 h-16 ${planDetails[modalPlan].iconBg} rounded-full flex items-center justify-center text-3xl mx-auto mb-4`}>
                                        📞
                                    </div>
                                    <h4 className="text-xl font-bold text-white">Contact Admin</h4>
                                    <p className="text-xs text-white/50 mt-1 max-w-sm mx-auto mb-8">
                                        Get in touch with us via WhatsApp or Call to activate your plan instantly.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                                        <a 
                                            href={`https://wa.me/918825961577?text=Hi%20Admin,%20I%20want%20to%20activate%20the%20${encodeURIComponent(planDetails[modalPlan].name)}%20plan%20on%20Goye.%20Please%20guide%20me.`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex-1 flex items-center justify-center gap-2.5 py-4 px-6 ${planDetails[modalPlan].buttonBg} font-extrabold rounded-xl transition-all duration-300 shadow-md text-sm`}
                                        >
                                            <FaWhatsapp className="text-lg" />
                                            WhatsApp Admin
                                        </a>
                                        <a 
                                            href="tel:+918825961577"
                                            className="flex-1 flex items-center justify-center gap-2.5 py-4 px-6 bg-white/5 hover:bg-white/10 text-white font-extrabold rounded-xl border border-white/10 transition-all duration-300 text-sm"
                                        >
                                            Call +91 8825961577
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeModalTab === 'request' && (
                            <div className="p-4 sm:p-8 relative overflow-y-auto overscroll-contain flex-1 no-scrollbar">
                                
                                <div className="text-center mb-6 sm:mb-8 mt-4 sm:mt-6">
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
                                            const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://goye.onrender.com';
                                            const response = await fetch(`${apiBaseUrl}/api/subscription-requests`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    name: requestFormData.name || localStorage.getItem("username") || "User",
                                                    email: requestFormData.email || localStorage.getItem("email") || "",
                                                    plan: (planDetails[modalPlan] && planDetails[modalPlan].name) || "One Day",
                                                    amount: (planDetails[modalPlan] && planDetails[modalPlan].price) || "₹49",
                                                    message: requestFormData.message || ""
                                                })
                                            });
                                            const data = await response.json().catch(() => ({}));
                                            if (response.ok || (data && data.message && (data.message.includes('pending') || data.message.includes('already')))) {
                                                setActiveModalTab('success');
                                                localStorage.setItem("gy_last_request_time", Date.now().toString());
                                                window.dispatchEvent(new Event("gy:subscription-request-created"));
                                            } else {
                                                alert(data.message || 'Failed to send activation request. Please try again.');
                                            }
                                        } catch (err) {
                                            console.error('Error submitting request:', err);
                                            alert('Connection error. Please try again.');
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
                                            placeholder="e.g. John Doe"
                                            value={requestFormData.name}
                                            onChange={(e) => setRequestFormData({ ...requestFormData, name: e.target.value })}
                                            className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl text-base text-white placeholder-white/20 outline-none transition-all focus:border-blue-500/50 focus:bg-white/5 shadow-inner"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-white/40 uppercase tracking-wider mb-2">Email Address</label>
                                        <input 
                                            type="email" 
                                            required
                                            placeholder="e.g. john@example.com"
                                            value={requestFormData.email}
                                            onChange={(e) => setRequestFormData({ ...requestFormData, email: e.target.value })}
                                            className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl text-base text-white placeholder-white/20 outline-none transition-all focus:border-blue-500/50 focus:bg-white/5 shadow-inner"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-white/40 uppercase tracking-wider mb-2">Optional Message</label>
                                        <textarea 
                                            rows="2"
                                            placeholder="e.g. Please activate my credits."
                                            value={requestFormData.message}
                                            onChange={(e) => setRequestFormData({ ...requestFormData, message: e.target.value })}
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
                                    onClick={closeModal}
                                    className="w-full max-w-xs py-4 px-8 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl border border-white/10 transition-all text-sm shadow-md hover:shadow-lg"
                                >
                                    Close Window
                                </button>
                            </div>
                        )}

                        {activeModalTab === 'payment' && (
                            <div className="p-4 sm:p-8 text-center relative overflow-y-auto overscroll-contain flex-1 no-scrollbar">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#25D366]/5 via-transparent to-transparent pointer-events-none"></div>
                                <div className="mt-2 flex flex-col items-center relative z-10">
                                    <div className="flex items-center gap-2 mb-2 justify-center">
                                        <div className="w-10 h-10 rounded-full bg-[#34E38A]/20 flex items-center justify-center border border-[#34E38A]/30 text-[#34E38A] shadow-[0_0_15px_rgba(52,227,138,0.2)]">
                                            <span className="text-sm font-extrabold">QR</span>
                                        </div>
                                        <h4 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#34E38A] to-[#25D366] tracking-tight">Scan & Pay</h4>
                                    </div>
                                    <p className="text-xs text-white/50 mb-6 max-w-sm font-medium">
                                        Scan the QR code using any UPI app to pay for the <strong>{planDetails[modalPlan].name}</strong>.
                                    </p>
                                    
                                    {/* Amount Display */}
                                    <div className="mb-6 bg-gradient-to-b from-white/10 to-transparent border border-white/20 rounded-2xl px-8 py-3 text-center shadow-lg backdrop-blur-md">
                                        <span className="text-[10px] text-[#34E38A] uppercase font-black tracking-widest block mb-1">Amount to Pay</span>
                                        <span className="text-3xl font-black text-white drop-shadow-md">{planDetails[modalPlan].price}</span>
                                    </div>

                                    {/* Dynamic QR Code Container with Plan Accent Border */}
                                    <div className="bg-white p-5 rounded-[2rem] inline-block shadow-[0_20px_50px_rgba(37,211,102,0.3)] mb-8 border-4 border-[#25D366]/80 w-full max-w-[220px] relative">
                                        <div className="absolute inset-0 border-4 border-white rounded-[2rem] pointer-events-none"></div>
                                        <QRCode 
                                            value={`upi://pay?pa=lifechangersacademyind@okaxis&pn=Life%20Changers%20Ind&aid=uGICAgIC35OCTEA&am=${planDetails[modalPlan].price.replace(/[^0-9]/g, '')}.00&cu=INR&tn=${encodeURIComponent(planDetails[modalPlan].name + ' Subscription')}`} 
                                            size={180} 
                                            level="M"
                                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                        />
                                    </div>

                                    {/* Actions Container */}
                                    <div className="w-full max-w-[260px] flex flex-col gap-3 justify-center">
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setConfirmError('');
                                                setConfirmSuccess('');
                                                setShowPaymentConfirmModal(true);
                                            }}
                                            className="w-full py-4 bg-gradient-to-r from-[#25D366] to-[#128C4A] hover:brightness-110 text-white font-extrabold rounded-2xl transition-all text-sm uppercase tracking-wider shadow-[0_10px_20px_rgba(37,211,102,0.3)] hover:shadow-[0_15px_30px_rgba(37,211,102,0.4)] hover:-translate-y-1 flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <FaCheckCircle className="text-lg drop-shadow-sm" />
                                            I've Paid
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Further queries? Contact Admin Section */}
                        <div className="text-center pb-6 pt-4 border-t border-white/5 mt-2 bg-black/10">
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                                Further queries? <span className="text-white/80 font-black">Contact Admin</span>
                            </p>
                            <a 
                                href="tel:9943042369" 
                                className={`text-sm font-black font-mono tracking-widest block mt-1 transition-all ${planDetails[modalPlan].colorClass} hover:underline`}
                            >
                                99430 42369
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Centered Payment Confirmation Popup / Modal --- */}
            {showPaymentConfirmModal && (
                <div 
                    onClick={handleCloseConfirmModal}
                    className="fixed inset-0 z-[100020] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-3 sm:p-4 animate-fade-in text-left"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="bg-gradient-to-br from-[#0c1410]/95 to-[#050a07]/95 border-2 border-white/10 ring-1 ring-[#25D366]/20 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 max-w-md w-full relative shadow-[0_40px_100px_-20px_rgba(37,211,102,0.3)] text-left backdrop-blur-3xl max-h-[92vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {/* Glowing Orbs for Payment Modal */}
                        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full blur-[100px] opacity-30 bg-blue-500 pointer-events-none"></div>
                        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-20 bg-[#25D366] pointer-events-none"></div>

                        {/* Top Close (X) Button */}
                        <button 
                            onClick={handleCloseConfirmModal}
                            className="absolute top-5 right-5 text-white/60 hover:text-white transition-all p-3 rounded-full hover:bg-white/10 z-50 hover:rotate-90 hover:scale-110 backdrop-blur-md border border-transparent hover:border-white/10 cursor-pointer"
                            title="Close"
                        >
                            <FaTimes className="text-sm" />
                        </button>

                        {/* Modal Content: Success State OR Input Form */}
                        {confirmSuccess ? (
                            <div className="py-6 text-center animate-fade-in flex flex-col items-center relative overflow-hidden">
                                <style>{`
                                    @keyframes popEmoji {
                                        0% { opacity: 0; transform: scale(0.5) translate(0, 0) rotate(0deg); }
                                        50% { opacity: 1; transform: scale(1.2) translate(var(--tx), var(--ty)) rotate(var(--rot)); }
                                        100% { opacity: 0; transform: scale(1) translate(calc(var(--tx) * 1.5), calc(var(--ty) * 1.5)) rotate(calc(var(--rot) * 2)); }
                                    }
                                    .emoji-pop {
                                        position: absolute;
                                        top: 50%;
                                        left: 50%;
                                        font-size: 24px;
                                        pointer-events: none;
                                        animation: popEmoji 1.5s ease-out forwards;
                                        z-index: 10;
                                    }
                                    @keyframes scaleUpBounce {
                                        0% { transform: scale(0); opacity: 0; }
                                        50% { transform: scale(1.2); opacity: 1; }
                                        100% { transform: scale(1); opacity: 1; }
                                    }
                                `}</style>
                                
                                <div className="relative w-24 h-24 mb-6 mt-4 flex items-center justify-center">
                                    {/* Emojis bursting */}
                                    <span className="emoji-pop" style={{ '--tx': '-60px', '--ty': '-60px', '--rot': '-45deg', animationDelay: '0.1s' }}>🎉</span>
                                    <span className="emoji-pop" style={{ '--tx': '60px', '--ty': '-50px', '--rot': '45deg', animationDelay: '0.2s' }}>🎊</span>
                                    <span className="emoji-pop" style={{ '--tx': '-40px', '--ty': '50px', '--rot': '-20deg', animationDelay: '0.15s' }}>✨</span>
                                    <span className="emoji-pop" style={{ '--tx': '50px', '--ty': '40px', '--rot': '20deg', animationDelay: '0.25s' }}>⭐</span>
                                    <span className="emoji-pop" style={{ '--tx': '0px', '--ty': '-80px', '--rot': '10deg', animationDelay: '0.3s' }}>🎈</span>
                                    
                                    <div 
                                        className="w-20 h-20 bg-gradient-to-tr from-[#128C4A] to-[#25D366] text-white rounded-full flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(37,211,102,0.5)] z-20"
                                        style={{ animation: 'scaleUpBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
                                    >
                                        <FaCheckCircle className="drop-shadow-md" />
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#25D366] tracking-tight mb-2">
                                    Payment Details Captured Successfully
                                </h3>

                                <p className="text-sm text-white/80 font-medium max-w-sm mb-6 leading-relaxed">
                                    Your payment details have been submitted successfully. Please wait for our confirmation call to verify your payment.
                                </p>

                                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold mb-8 shadow-inner shadow-amber-400/10">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
                                    Payment Verification Pending
                                </div>

                                <button 
                                    type="button"
                                    onClick={() => {
                                        handleCloseConfirmModal();
                                        navigate('/profile');
                                    }}
                                    className="w-full py-4 px-6 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 text-white font-extrabold rounded-2xl transition-all text-sm cursor-pointer border border-white/20 shadow-lg hover:shadow-xl hover:-translate-y-1"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="mb-6 text-center">
                                    <div className="flex items-center gap-3 mb-2 justify-center">
                                        <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xl shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                            💳
                                        </div>
                                        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-300 tracking-tight">Payment Confirmation</h3>
                                    </div>
                                    <p className="text-sm text-white/50 font-medium">
                                        Enter your UPI ID and upload the payment screenshot to confirm.
                                    </p>
                                </div>

                                {confirmError && (
                                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2">
                                        <span>⚠️</span>
                                        <span>{confirmError}</span>
                                    </div>
                                )}

                                <form onSubmit={handleConfirmSubmit} className="space-y-4">
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

                                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                        <button 
                                            type="button"
                                            disabled={isSubmittingPayment}
                                            onClick={handleCloseConfirmModal}
                                            className="flex-1 py-3.5 px-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 hover:border-white/20 transition-all text-xs cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit"
                                            disabled={isSubmittingPayment}
                                            className={`flex-1 py-3.5 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-extrabold rounded-2xl transition-all shadow-lg text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 ${
                                                isSubmittingPayment 
                                                    ? 'opacity-80 cursor-not-allowed' 
                                                    : 'hover:brightness-110 hover:shadow-[0_10px_20px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 cursor-pointer'
                                            }`}
                                        >
                                            {isSubmittingPayment ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                                    </svg>
                                                    <span>Submitting Payment...</span>
                                                </>
                                            ) : (
                                                "SUBMIT PAYMENT DETAILS"
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ================= FOOTER ================= */}
            <footer className="relative bg-[#212122] mt-20 border-t border-white/5">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#25D366]/50 to-transparent"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 sm:gap-8 mb-10 sm:mb-14">

                        {/* Brand */}
                        <div className="sm:col-span-2 md:col-span-2">
                            <div className="flex items-center gap-2.5 mb-4">
                                <img src="/Goye.png" alt="Goye Logo" className="w-9 h-9 object-contain drop-shadow-md" />
                                <p className="gy-display text-white font-bold text-lg tracking-tight">Goye <span className="text-[#25D366]">Broadcast</span></p>
                            </div>
                            <p className="text-sm text-white/50 leading-relaxed max-w-sm mb-5">
                                Connect your WhatsApp and reach your entire audience with personalized bulk messages &mdash; no coding, no hassle.
                            </p>
                            <div className="flex items-center gap-2 text-xs font-semibold text-white/40">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse"></div>
                                Secure, encrypted sessions
                            </div>
                        </div>

                        {/* Navigate */}
                        <div>
                            <p className="text-white text-sm font-bold tracking-wide uppercase mb-4">Navigate</p>
                            <ul className="space-y-3">
                                <li><a href="/" className="text-sm text-white/50 hover:text-[#25D366] transition-colors">Home</a></li>
                                <li><a href="/about" className="text-sm text-white/50 hover:text-[#25D366] transition-colors">About</a></li>
                                <li><a href="/subscriptions" className="text-sm text-white/50 hover:text-[#25D366] transition-colors">Subscriptions</a></li>
                                <li><a href="/contact" className="text-sm text-white/50 hover:text-[#25D366] transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        {/* Capabilities */}
                        <div>
                            <p className="text-white text-sm font-bold tracking-wide uppercase mb-4">Capabilities</p>
                            <ul className="space-y-3">
                                <li className="text-sm text-white/50 flex items-center gap-2"><FaBolt className="text-[#25D366] text-xs shrink-0" /> Bulk Sending</li>
                                <li className="text-sm text-white/50 flex items-center gap-2"><FaFileCsv className="text-[#25D366] text-xs shrink-0" /> Easy Import</li>
                                <li className="text-sm text-white/50 flex items-center gap-2"><FaShieldAlt className="text-[#25D366] text-xs shrink-0" /> Secure Sessions</li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-xs text-white/35 text-center sm:text-left">&copy; {new Date().getFullYear()} Goye Broadcast. All rights reserved.</p>
                        <p className="text-xs text-white/25 text-center sm:text-right">WhatsApp is a trademark of Meta Platforms, Inc. Goye Broadcast is an independent tool and is not affiliated with WhatsApp.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
