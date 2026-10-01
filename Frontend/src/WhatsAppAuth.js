import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import QRCode from 'react-qr-code';
import { FaCheckCircle, FaSpinner, FaCloudUploadAlt, FaPaperPlane, FaPlus, FaWhatsapp, FaUserCircle, FaBolt, FaShieldAlt, FaFileCsv, FaCheckDouble, FaArrowRight, FaUsers, FaLock, FaChartLine, FaCommentDots, FaBell, FaHome, FaCog, FaAddressBook, FaTimes, FaDownload, FaMicrophone, FaInfinity, FaCalendarAlt, FaChartBar, FaHeartbeat, FaRobot, FaChevronDown, FaGlobe } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { FiClock, FiLayers, FiPhone, FiCheck, FiSparkles, FiTrash2, FiSend } from 'react-icons/fi';
import TeamCampaignModal from './User-Component/TeamCampaignModal';
import TeamLobby from './User-Component/TeamLobby';
import API_BASE_URL from './config';

const socket = io(API_BASE_URL, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ["websocket", "polling"]
});
export { socket };

export default function WhatsAppAuth() {
    const location = useLocation();
    const navigate = useNavigate();
    // When the Navbar's "Messages" item navigates here from another page,
    // it passes { openMessages: true } via router state. Reading it here
    // (instead of waiting for a delayed window event) lets this component
    // render its connecting/messages view on the very first paint, instead
    // of first flashing the Home hero section and then swapping.
    const openedFromMessagesNav = !!(location.state && location.state.openMessages);

    const [qrCode, setQrCode] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [connectedUser, setConnectedUser] = useState(null);
    const [showFormOnly, setShowFormOnly] = useState(() => {
        const isFree = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");
        const isTesting = Date.now() <= new Date("2026-09-21T23:39:00+05:30").getTime();
        const anyLogged = localStorage.getItem("isLoggedIn") === "true" || isFree;
        const isSub = localStorage.getItem("isSubscribed") === "true";
        const c = parseInt(localStorage.getItem("credits") || "0", 10);
        return anyLogged && !isSub && ((isTesting && !isFree) ? true : c <= 0);
    }); 
    const [failedList, setFailedList] = useState([]);
    const [startClicked, setStartClicked] = useState(() => {
        const loggedIn = localStorage.getItem("isLoggedIn") === "true";
        const freeLoggedIn = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");
        return openedFromMessagesNav || loggedIn || freeLoggedIn;
    });
    const [message, setMessage] = useState("");
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleDate, setScheduleDate] = useState("");
    const [scheduleHour, setScheduleHour] = useState("12");
    const [scheduleMinute, setScheduleMinute] = useState("00");
    const [scheduleAmPm, setScheduleAmPm] = useState("AM");
    const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
    const [delayOption, setDelayOption] = useState("2");
    const [customDelay, setCustomDelay] = useState("4");
    const [currentEmail, setCurrentEmail] = useState(localStorage.getItem("email") || "");
    const getActiveEmail = () => {
        let em = localStorage.getItem("email");
        if (!em) {
            try {
                const f = JSON.parse(localStorage.getItem("freeUserData") || "{}");
                em = f.email || "";
            } catch (e) {}
        }
        return em ? String(em).trim().toLowerCase() : "";
    };
    const getEffectiveDelay = () => {
        if (typeof isSubscriptionActive === 'function' && !isSubscriptionActive()) {
            return 2;
        }
        if (delayOption === "custom") {
            const parsed = parseInt(customDelay, 10);
            return isNaN(parsed) || parsed < 1 ? 2 : parsed;
        }
        const parsed = parseInt(delayOption, 10);
        return isNaN(parsed) || parsed < 1 ? 2 : parsed;
    };

    // --- Goyee AI 24/7 WhatsApp Auto-Reply States ---
    const [aiEnabled, setAiEnabled] = useState(false);
    const [aiKnowledgeBase, setAiKnowledgeBase] = useState("");
    const [aiApiKey, setAiApiKey] = useState("");
    const [isSavingAi, setIsSavingAi] = useState(false);
    const [aiSaveSuccess, setAiSaveSuccess] = useState(false);
    const [showAiTester, setShowAiTester] = useState(false);
    const [testQuery, setTestQuery] = useState("");
    const [testReply, setTestReply] = useState("");
    const [isTestingAi, setIsTestingAi] = useState(false);
    const [recentAiReplies, setRecentAiReplies] = useState([]);

    useEffect(() => {
        const em = getActiveEmail();
        if (em) {
            fetch(`${API_BASE_URL}/api/ai-config?email=${encodeURIComponent(em)}`)
                .then(r => r.json())
                .then(data => {
                    if (data && data.success && data.config) {
                        setAiEnabled(!!data.config.enabled);
                        setAiKnowledgeBase(data.config.knowledgeBase || "");
                        setAiApiKey(data.config.apiKey || "");
                    }
                })
                .catch(err => console.error("Error loading AI config:", err));
        }
    }, [currentEmail]);

    useEffect(() => {
        const handleAiReplySent = (payload) => {
            if (payload) {
                setRecentAiReplies(prev => [payload, ...prev.slice(0, 4)]);
            }
        };
        socket.on("ai_reply_sent", handleAiReplySent);
        return () => socket.off("ai_reply_sent", handleAiReplySent);
    }, []);

    const handleSaveAiConfig = async (newEnabledState) => {
        const em = getActiveEmail();
        if (!em) return alert("Please login first to configure Goyee AI.");
        setIsSavingAi(true);
        try {
            const enabledToSave = typeof newEnabledState === "boolean" ? newEnabledState : aiEnabled;
            const res = await fetch(`${API_BASE_URL}/api/ai-config`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: em,
                    enabled: enabledToSave,
                    knowledgeBase: aiKnowledgeBase,
                    apiKey: aiApiKey
                })
            });
            const data = await res.json();
            if (data && data.success) {
                setAiSaveSuccess(true);
                setTimeout(() => setAiSaveSuccess(false), 2500);
            } else {
                alert(`⚠️ Error saving AI config: ${data.error || "Unknown error"}`);
            }
        } catch(e) {
            alert(`⚠️ Failed to connect to server: ${e.message}`);
        } finally {
            setIsSavingAi(false);
        }
    };

    const handleToggleAi = () => {
        const nextState = !aiEnabled;
        setAiEnabled(nextState);
        handleSaveAiConfig(nextState);
    };

    const handleTestAiReply = async () => {
        if (!testQuery.trim()) return;
        setIsTestingAi(true);
        setTestReply("");
        try {
            const res = await fetch(`${API_BASE_URL}/api/ai-config/test`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    knowledgeBase: aiKnowledgeBase,
                    query: testQuery,
                    apiKey: aiApiKey
                })
            });
            const data = await res.json();
            if (data && data.success) {
                setTestReply(data.reply);
            } else {
                setTestReply(`❌ Error: ${data.error || "Failed to generate reply"}`);
            }
        } catch(e) {
            setTestReply(`❌ Network error: ${e.message}`);
        } finally {
            setIsTestingAi(false);
        }
    };
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
    const isSubscribedUser = isSubscriptionActive();
    const [connectionStatus, setConnectionStatus] = useState("connecting");
    const [isUserLoggedIn, setIsUserLoggedIn] = useState(() => {
        const loggedIn = localStorage.getItem("isLoggedIn") === "true";
        const freeLoggedIn = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");
        return loggedIn || freeLoggedIn;
    });
    const [userName, setUserName] = useState(() => {
        let name = localStorage.getItem("username") || localStorage.getItem("name") || "";
        if (!name) {
            try {
                const f = JSON.parse(localStorage.getItem("freeUserData") || "{}");
                name = f.name || f.username || "";
            } catch (e) {}
        }
        return name || "User";
    }); 
    const [manualContacts, setManualContacts] = useState([""]); 
    const [excelFile, setExcelFile] = useState(null);
    const [mediaFiles, setMediaFiles] = useState([]);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [activeCampaignId, setActiveCampaignId] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [voiceLang, setVoiceLang] = useState('en-US');
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
    const langDropdownRef = useRef(null);

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
                setIsLangDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const toggleVoiceInput = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech Recognition is not supported in this browser. Please use Google Chrome.");
            return;
        }
        if (isListening) {
            setIsListening(false);
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = voiceLang;
        recognition.interimResults = false;
        recognition.start();
        setIsListening(true);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setMessage((prev) => (prev ? prev + " " + transcript : transcript));
            setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
    };

    // Drives the send-progress popup: null when no send is in flight,
    // otherwise { total, sent, failed, pending, done }.
    const [sendProgress, setSendProgress] = useState(null);
    // Tracks whether the current auth flow was triggered by the Navbar's
    // "Messages" item (an existing/valid session) vs. a fresh "Connect
    // Device" click, so we know whether to skip straight to the chat/
    // messages panel or keep showing the normal QR -> Success animation.
    const messagesRequestedRef = useRef(openedFromMessagesNav);
    // Refs to the native file inputs for Excel/CSV and Media uploads, used
    // only to clear the input's value when a selected file is removed (so
    // selecting the same file again still fires a change event).
    const excelInputRef = useRef(null);
    const mediaInputRef = useRef(null);

    // Consume the one-shot "openMessages" navigation state so refreshing
    // this page or using browser back/forward doesn't keep re-triggering
    // this same startup behavior.
    useEffect(() => {
        if (location.state && location.state.openMessages) {
            navigate(location.pathname, { replace: true, state: {} });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Lets the unified Navbar's "Home" item reset this page back to the
    // landing/hero view when we're already on this route (e.g. after
    // opening Messages here, then clicking Home again). This only resets
    // which section of this page is shown — it does not touch
    // isAuthenticated, qrCode, or the underlying socket connection, so the
    // WhatsApp session stays connected.
    useEffect(() => {
        const handleGoHome = () => {
            setStartClicked(false);
            setShowFormOnly(false);
            messagesRequestedRef.current = false;
        };
        window.addEventListener("gy:go-home", handleGoHome);
        return () => window.removeEventListener("gy:go-home", handleGoHome);
    }, []);

    useEffect(() => {
        const isMsg = startClicked || showFormOnly;
        window.dispatchEvent(new CustomEvent("gy:view-changed", { detail: isMsg ? "messages" : "home" }));
    }, [startClicked, showFormOnly]);

    useEffect(() => {
        const checkAndFreezeMessages = () => {
            const expiresAt = localStorage.getItem("subscriptionExpiresAt");
            const isSubscribedVal = localStorage.getItem("isSubscribed") === "true";
            let activeSubscription = isSubscribedVal;
            if (expiresAt && expiresAt !== "null") {
                const expTime = new Date(expiresAt).getTime();
                if (!isNaN(expTime)) {
                    activeSubscription = isSubscribedVal && expTime > Date.now();
                }
            }

            const creditsVal = parseInt(localStorage.getItem("credits") || "0", 10);
            const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
            const isFreeUserLoggedIn = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");
            const anyLoggedIn = isLoggedIn || isFreeUserLoggedIn;

            if ((startClicked || showFormOnly) && anyLoggedIn && !activeSubscription && creditsVal <= 0) {
                // Do not trigger the global popup overlay anymore.
                // The inline lock card will handle the UI, leaving the navbar accessible.
            }
        };

        checkAndFreezeMessages();

        window.addEventListener("creditsChanged", checkAndFreezeMessages);
        window.addEventListener("subscriptionExpired", checkAndFreezeMessages);
        window.addEventListener("loginStatusChanged", checkAndFreezeMessages);
        window.addEventListener("storage", checkAndFreezeMessages);

        return () => {
            window.removeEventListener("creditsChanged", checkAndFreezeMessages);
            window.removeEventListener("subscriptionExpired", checkAndFreezeMessages);
            window.removeEventListener("loginStatusChanged", checkAndFreezeMessages);
            window.removeEventListener("storage", checkAndFreezeMessages);
        };
    }, [startClicked, showFormOnly]);

    useEffect(() => {
        const updateName = () => {
            const loggedIn = localStorage.getItem("isLoggedIn") === "true";
            const freeLoggedIn = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");
            const anyLoggedIn = loggedIn || freeLoggedIn;
            setIsUserLoggedIn(anyLoggedIn);

            if (anyLoggedIn) {
                setStartClicked(true);
            } else {
                setStartClicked(false);
                setShowFormOnly(false);
            }

            let storedName = localStorage.getItem("username") || localStorage.getItem("name") || "";
            if (!storedName) {
                try {
                    const f = JSON.parse(localStorage.getItem("freeUserData") || "{}");
                    storedName = f.name || f.username || "";
                } catch (e) {}
            }
            setUserName(storedName || "User");
        };
        updateName();
        window.addEventListener("loginStatusChanged", updateName);
        window.addEventListener("freeUserLoginStatusChanged", updateName);
        window.addEventListener("storage", updateName);

        const handleEmailChange = () => {
            const email = localStorage.getItem("email") || "";
            if (email !== currentEmail) {
                setCurrentEmail(email);
                setQrCode("");
                setIsAuthenticated(false);
                setConnectedUser(null);
                
                if (email) {
                    setStartClicked(true);
                    socket.emit("register_email", email);
                    socket.emit("check_status");
                } else {
                    const freeLoggedIn = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");
                    if (freeLoggedIn) {
                        setStartClicked(true);
                    } else {
                        setStartClicked(false);
                        setShowFormOnly(false);
                    }
                }
            }
        };

        const email = localStorage.getItem("email");
        if (email) {
            socket.emit("register_email", email);
            socket.emit("check_status");
        }

        window.addEventListener("loginStatusChanged", handleEmailChange);
        window.addEventListener("freeUserLoginStatusChanged", handleEmailChange);

        return () => {
            window.removeEventListener("loginStatusChanged", updateName);
            window.removeEventListener("freeUserLoginStatusChanged", updateName);
            window.removeEventListener("storage", updateName);
            window.removeEventListener("loginStatusChanged", handleEmailChange);
            window.removeEventListener("freeUserLoginStatusChanged", handleEmailChange);
        };
    }, [currentEmail]);

    useEffect(() => {
        const handleConnect = () => {
            setConnectionStatus("connected");
            const em = getActiveEmail();
            if (em) {
                socket.emit("register_email", em);
            }
            socket.emit("check_status");
        };

        const handleDisconnect = () => {
            setConnectionStatus("disconnected");
        };

        const handleConnectError = () => {
            setConnectionStatus("disconnected");
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);
        if (socket.connected) {
            handleConnect();
        }
        socket.on("qr", (qr) => setQrCode(qr));
        
        socket.on("ready", (data) => {
            setIsAuthenticated(true);
            localStorage.setItem("whatsappConnected", "true");
            window.dispatchEvent(new Event("whatsappConnectionChanged"));
            if (data && data.user) {
                setConnectedUser(data.user);
            }
            // If this "ready" was in response to opening the Messages page
            // from the Navbar (existing session), skip the Success screen
            // and go straight to the chat/messages panel.
            if (messagesRequestedRef.current) {
                setShowFormOnly(true);
                messagesRequestedRef.current = false;
            }
        });

        socket.on("logout", () => {
            setIsAuthenticated(false);  // Removes 'Linked Successfully'
            localStorage.setItem("whatsappConnected", "false");
            window.dispatchEvent(new Event("whatsappConnectionChanged"));
            setShowFormOnly(false);     // Hides the message form
            setQrCode("");              // Clears old QR so loader shows until new QR comes
            setConnectedUser(null);     // Clear connected user
            messagesRequestedRef.current = false;
        });

        // Setup listeners for bulk message sending progress from the backend.
        const handleBulkProgressStart = (payload) => {
            setSendProgress({
                total: payload.total || 0,
                processed: 0,
                sent: 0,
                failed: 0,
                currentNumber: "Initializing...",
                done: false
            });
        };

        const handleBulkProgressUpdate = (payload) => {
            if (!payload) return;

            // Update progress state immediately so the UI is 100% reactive in real time
            setSendProgress((prev) => {
                if (!prev || prev.done) return prev;
                let processed = prev.processed;
                let sent = prev.sent;
                let failed = prev.failed;
                let currentNumber = prev.currentNumber;

                if (payload.status === "sending") {
                    currentNumber = payload.number ? `Sending to +${String(payload.number).replace(/\D/g, '')}` : "Sending...";
                } else if (payload.status === "sent") {
                    processed += 1;
                    sent += 1;
                    currentNumber = payload.number ? `Sent to +${String(payload.number).replace(/\D/g, '')}` : "Sent";
                } else if (payload.status === "failed") {
                    processed += 1;
                    failed += 1;
                    currentNumber = payload.number ? `Failed for +${String(payload.number).replace(/\D/g, '')}` : "Failed";
                }

                return {
                    ...prev,
                    processed,
                    sent,
                    failed,
                    currentNumber
                };
            });

            if (payload.status === "failed") {
                setFailedList((prevList) => [
                    ...prevList,
                    {
                        number: payload.number,
                        reason: payload.reason || "Unable to send message",
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ]);
            }

            if (payload.status === "sent") {
                const isSubscribed = localStorage.getItem("isSubscribed") === "true";
                let currentCredits = parseInt(localStorage.getItem("credits") || "0", 10);
                if (!isSubscribed && currentCredits <= 0) {
                    return;
                }

                let currentSent = parseInt(localStorage.getItem("totalSent") || "0", 10);
                const newTotalSent = currentSent + 1;
                localStorage.setItem("totalSent", newTotalSent);

                let newCredits = currentCredits;
                if (newTotalSent % 2 === 0) {
                    newCredits = Math.max(0, currentCredits - 1);
                }
                localStorage.setItem("credits", String(newCredits));

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

                const storedEmail = localStorage.getItem("email") || (freeUserData && freeUserData.email) || localStorage.getItem("freeUserEmail") || "";
                const freeUserId = freeUserData?.id || freeUserData?._id;

                if (storedEmail || freeUserId) {
                    fetch(`${API_BASE_URL}/api/user/sync-usage`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: storedEmail, id: freeUserId, credits: newCredits, totalSent: newTotalSent })
                    }).catch(e => console.error(e));
                }

                if (newCredits <= 0) {
                    localStorage.setItem("credits", "0");
                    if (freeUserData) freeUserData.credits = 0;
                }

                window.dispatchEvent(new Event("creditsChanged"));
            }
        };

        const handleBulkProgressCompleted = () => {
            setSendProgress((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    processed: prev.total,
                    sent: prev.total - prev.failed,
                    done: true
                };
            });
        };

        socket.on("bulk_progress_start", handleBulkProgressStart);
        socket.on("bulk_progress_update", handleBulkProgressUpdate);
        socket.on("bulk_progress_completed", handleBulkProgressCompleted);

        // This component's local state (isAuthenticated, etc.) resets on
        // every mount, but the underlying socket connection/session is
        // shared across the app and usually stays connected. Re-check the
        // real status here so returning to this page (e.g. via the Navbar's
        // Messages item, or navigating back from Profile/About) reflects
        // the existing WhatsApp session instead of looking "disconnected".
        socket.emit("check_status");

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("connect_error", handleConnectError);
            socket.off("ready");
            socket.off("logout");
            socket.off("bulk_progress_start", handleBulkProgressStart);
            socket.off("bulk_progress_update", handleBulkProgressUpdate);
            socket.off("bulk_progress_completed", handleBulkProgressCompleted);
        };
    }, []);

    // Timer to transition from "Success" screen to "Message Configuration"
    useEffect(() => {
        if (startClicked && isAuthenticated && !showFormOnly) {
            const timer = setTimeout(() => setShowFormOnly(true), 2500);
            return () => clearTimeout(timer);
        }
    }, [startClicked, isAuthenticated, showFormOnly]);

    // Auto-populate extracted numbers if redirected from SocialExtractor
    useEffect(() => {
        const stored = sessionStorage.getItem("importedExtractedNumbers");
        if (stored) {
            try {
                const nums = JSON.parse(stored);
                if (Array.isArray(nums) && nums.length > 0) {
                    setManualContacts(nums);
                    sessionStorage.removeItem("importedExtractedNumbers");
                    setStartClicked(true);
                    setShowFormOnly(true);
                }
            } catch (e) {}
        }
    }, []);

    // Function to add new input box
    const addContactField = () => {
        setManualContacts([...manualContacts, ""]);
    };

    // Function to remove input box
    const removeContactField = (index) => {
        if (index === 0) return; // Do not delete the first/default input field
        const newContacts = manualContacts.filter((_, i) => i !== index);
        setManualContacts(newContacts);
    };

    // Function to update input value
    const handleContactChange = (index, value) => {
        const newContacts = [...manualContacts];
        newContacts[index] = value;
        setManualContacts(newContacts);
    };

    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        let imgCount = mediaFiles.filter(m => (m.mimetype || '').startsWith('image/') || m.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)).length;
        let vidCount = mediaFiles.filter(m => (m.mimetype || '').startsWith('video/') || m.filename.match(/\.(mp4|mov|avi|webm|mkv)$/i)).length;
        let docCount = mediaFiles.filter(m => !((m.mimetype || '').startsWith('image/') || m.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) && !((m.mimetype || '').startsWith('video/') || m.filename.match(/\.(mp4|mov|avi|webm|mkv)$/i))).length;

        files.forEach(file => {
            let mime = file.type;
            const name = file.name.toLowerCase();
            if (!mime) {
                const ext = name.split('.').pop();
                const mimeMap = {
                    'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'gif': 'image/gif', 'webp': 'image/webp',
                    'mp4': 'video/mp4', 'mov': 'video/quicktime', 'pdf': 'application/pdf', 'csv': 'text/csv',
                    'doc': 'application/msword', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                };
                mime = mimeMap[ext] || 'application/octet-stream';
            }

            const isImage = mime.startsWith('image/') || name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
            const isVideo = mime.startsWith('video/') || name.match(/\.(mp4|mov|avi|webm|mkv)$/i);

            if (isImage) {
                if (imgCount >= 3) return alert(`⚠️ Limit Exceeded: Maximum 3 Images allowed! Skipped ${file.name}`);
                imgCount++;
            } else if (isVideo) {
                if (vidCount >= 1) return alert(`⚠️ Limit Exceeded: Maximum 1 Video allowed! Skipped ${file.name}`);
                vidCount++;
            } else {
                if (docCount >= 2) return alert(`⚠️ Limit Exceeded: Maximum 2 Documents allowed! Skipped ${file.name}`);
                docCount++;
            }

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setMediaFiles(prev => [...prev, {
                    mimetype: mime,
                    data: reader.result.split(',')[1],
                    filename: file.name
                }]);
            };
        });
        if (mediaInputRef.current) mediaInputRef.current.value = "";
    };

    // Converts already-read file bytes into a base64 string, the same
    // format the existing Media/Document upload already sends over the
    // socket as `media.data`. Used to attach the selected CSV/Excel file
    // itself (not just the parsed phone numbers) to outgoing messages.
    const bytesToBase64 = (bytes) => {
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    };

    // Shows the popup immediately with everyone pending, before the send
    // request even goes out.
    const startSendProgress = (total) => {
        setFailedList([]);
        setSendProgress({ total, processed: 0, sent: 0, failed: 0, currentNumber: "Initializing...", done: false });
    };

    // Called from the send_bulk_message ack callback. If the backend's ack
    // includes final sent/failed counts, those win; otherwise, whatever
    // wasn't already reported (via live events) as sent or
    // failed is assumed successful, so the popup always reaches a correct,
    // fully-accounted-for final state.
    const finishSendProgress = (response) => {
        setSendProgress((prev) => {
            if (!prev) return prev;
            if (response && response.success === false) {
                return null;
            }
            if (response && (typeof response.sent === "number" || typeof response.failed === "number")) {
                const sent = typeof response.sent === "number" ? response.sent : prev.sent;
                const failed = typeof response.failed === "number" ? response.failed : prev.failed;
                return { ...prev, processed: sent + failed, sent, failed, done: true };
            }
            return { ...prev, processed: prev.sent + prev.failed, done: true };
        });
    };

    const [parsedExcelContacts, setParsedExcelContacts] = useState([]);

    useEffect(() => {
        if (!excelFile) {
            setParsedExcelContacts([]);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames && workbook.SheetNames[0];
                if (!firstSheetName) return;
                const sheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                const extracted = [];
                jsonData.forEach(row => {
                    if (Array.isArray(row)) {
                        row.forEach(cell => {
                            if (cell !== null && cell !== undefined) {
                                const cellStr = String(cell).trim();
                                if (cellStr.includes('@')) return;
                                if (/[a-zA-Z]{4,}/.test(cellStr)) return;
                                const cleanNum = cellStr.replace(/\D/g, '');
                                if (cleanNum.length >= 10 && cleanNum.length <= 15) {
                                    extracted.push(cleanNum);
                                }
                            }
                        });
                    }
                });
                setParsedExcelContacts(extracted);
            } catch (err) {
                console.error("Error parsing Excel file:", err);
            }
        };
        reader.readAsArrayBuffer(excelFile);
    }, [excelFile]);

    // Clears a selected file (state + the underlying native input value)
    // without affecting any other upload/send logic.
    const removeExcelFile = (e) => {
        e.stopPropagation();
        setExcelFile(null);
        setParsedExcelContacts([]);
        if (excelInputRef.current) excelInputRef.current.value = "";
    };

    const removeMediaFileItem = (index, e) => {
        if (e) e.stopPropagation();
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
        if (mediaInputRef.current) mediaInputRef.current.value = "";
    };

    const removeMediaFile = (e) => {
        if (e) e.stopPropagation();
        setMediaFiles([]);
        if (mediaInputRef.current) mediaInputRef.current.value = "";
    };

    const getParsedNumbers = () => {
        let nums = [];
        manualContacts.forEach(contact => {
            if (contact) {
                contact.split(/[\r\n,\s]+/).forEach(num => {
                    const trimmed = num.trim();
                    if (trimmed) nums.push(trimmed);
                });
            }
        });
        const combined = [...nums, ...parsedExcelContacts];
        return Array.from(new Set(combined));
    };

    const recipientCount = getParsedNumbers().length;

    const sendBulkMessages = () => {
        let currentCredits = parseInt(localStorage.getItem("credits") || "0", 10);
        const isSubscribed = localStorage.getItem("isSubscribed") === "true";
        if (currentCredits <= 0 && !isSubscribed) {
            window.dispatchEvent(new Event("showCreditExhaustedPopup"));
            return;
        }

        if (!message && !mediaFiles.length && !excelFile) return alert("Please type a message or attach at least one media file!");
        const effectiveDelay = getEffectiveDelay();
        
        let allNumbers = [];
        manualContacts.forEach(contact => {
            if (contact) {
                // Support comma, space, and newline-separated numbers
                contact.split(/[\r\n,\s]+/).forEach(num => {
                    const trimmed = num.trim();
                    if (trimmed) allNumbers.push(trimmed);
                });
            }
        });

        if (excelFile) {
            const reader = new FileReader();

            reader.onerror = () => {
                console.error("❌ Failed to read the selected CSV/Excel file:", reader.error);
                alert("⚠️ Could not read the selected file. Please try again with a valid CSV or Excel file.");
            };

            reader.onload = (e) => {
              try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames && workbook.SheetNames[0];
                if (!firstSheetName) {
                    throw new Error("The selected file doesn't contain any readable sheet.");
                }
                const sheet = workbook.Sheets[firstSheetName];
                
                // Parse row by row using sheet_to_json to inspect individual cells
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                jsonData.forEach(row => {
                    if (Array.isArray(row)) {
                        row.forEach(cell => {
                            if (cell !== null && cell !== undefined) {
                                const cellStr = String(cell).trim();
                                // Ignore emails
                                if (cellStr.includes('@')) return;
                                // Ignore column headers / long text values
                                if (/[a-zA-Z]{4,}/.test(cellStr)) return;
                                
                                // Keep only digits
                                const cleanNum = cellStr.replace(/\D/g, '');
                                // Accept only valid phone number lengths (10 to 15 digits)
                                if (cleanNum.length >= 10 && cleanNum.length <= 15) {
                                    allNumbers.push(cleanNum);
                                }
                            }
                        });
                    }
                });
                
                // Remove duplicates
                allNumbers = [...new Set(allNumbers)];

                if (allNumbers.length === 0) {
                    alert("⚠️ No valid phone numbers were found in the selected file. Please check the file and try again.");
                    return;
                }

                // Only send the user-selected media file (image/video/document).
                // The CSV/XLSX file itself is NEVER sent as an attachment.
                const attachment = mediaFiles.length ? mediaFiles : null;
                
                const maxAllowed = isSubscribed ? Infinity : currentCredits * 2;
                if (!isSubscribed && allNumbers.length > maxAllowed) {
                    if (maxAllowed <= 0) {
                        window.dispatchEvent(new Event("showCreditExhaustedPopup"));
                        return;
                    }
                    alert(`⚠️ Your available credit balance (${currentCredits} credits) allows sending a maximum of ${maxAllowed} messages. Sending only the first ${maxAllowed} contacts.`);
                    allNumbers = allNumbers.slice(0, maxAllowed);
                }

                console.log("📤 Sending numbers to backend:", allNumbers);
                if (isScheduling && isSubscribedUser) {
                    if (!scheduleDate) return alert("Please select a date for scheduling");
                    let hour = parseInt(scheduleHour);
                    if (scheduleAmPm === 'PM' && hour < 12) hour += 12;
                    if (scheduleAmPm === 'AM' && hour === 12) hour = 0;
                    const scheduledFor = new Date(`${scheduleDate}T${hour.toString().padStart(2, '0')}:${scheduleMinute}:00`);
                    if (scheduledFor < new Date()) return alert("Scheduled time must be in the future!");
                    
                    setIsSubmittingSchedule(true);
                    fetch(`${API_BASE_URL}/api/schedules`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: getActiveEmail(), contacts: allNumbers, message, media: attachment, scheduledFor, delay: effectiveDelay })
                    }).then(() => {
                        alert("🎉 Message & Media scheduled successfully!");
                        setMessage("");
                        setMediaFiles([]);
                        setIsScheduling(false);
                    }).catch(e => {
                        console.error(e);
                        alert("⚠️ Failed to schedule message. Please check connection and try again.");
                    }).finally(() => {
                        setIsSubmittingSchedule(false);
                    });
                    return;
                }
                startSendProgress(allNumbers.length);
                socket.emit("send_bulk_message", { email: getActiveEmail(), numbers: allNumbers, text: message, media: attachment, delay: effectiveDelay }, (response) => {
                    if (response && response.success === false) {
                        setSendProgress(null);
                        alert(`❌ ${response.error || "WhatsApp is not connected. Please connect WhatsApp first."}`);
                        return;
                    }
                    finishSendProgress(response);
                });
                
                setMessage("");
              } catch (err) {
                console.error("❌ Failed to parse the selected CSV/Excel file:", err);
                alert("⚠️ We couldn't read that file. Please make sure it's a valid CSV or Excel (.csv, .xls, .xlsx) file and try again.");
              }
            };
            reader.readAsArrayBuffer(excelFile);
        } else {
            const maxAllowed = isSubscribed ? Infinity : currentCredits * 2;
            if (!isSubscribed && allNumbers.length > maxAllowed) {
                if (maxAllowed <= 0) {
                    window.dispatchEvent(new Event("showCreditExhaustedPopup"));
                    return;
                }
                alert(`⚠️ Your available credit balance (${currentCredits} credits) allows sending a maximum of ${maxAllowed} messages. Sending only the first ${maxAllowed} contacts.`);
                allNumbers = allNumbers.slice(0, maxAllowed);
            }

            console.log("📤 Sending numbers to backend:", allNumbers);
            const attachment = mediaFiles.length ? mediaFiles : null;
            if (isScheduling && isSubscribedUser) {
                if (!scheduleDate) return alert("Please select a date for scheduling");
                let hour = parseInt(scheduleHour);
                if (scheduleAmPm === 'PM' && hour < 12) hour += 12;
                if (scheduleAmPm === 'AM' && hour === 12) hour = 0;
                const scheduledFor = new Date(`${scheduleDate}T${hour.toString().padStart(2, '0')}:${scheduleMinute}:00`);
                if (scheduledFor < new Date()) return alert("Scheduled time must be in the future!");
                
                setIsSubmittingSchedule(true);
                fetch(`${API_BASE_URL}/api/schedules`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: getActiveEmail(), contacts: allNumbers, message, media: attachment, scheduledFor, delay: effectiveDelay })
                }).then(() => {
                    alert("🎉 Message & Media scheduled successfully!");
                    setMessage("");
                    setMediaFiles([]);
                    setIsScheduling(false);
                }).catch(e => {
                    console.error(e);
                    alert("⚠️ Failed to schedule message. Please check connection and try again.");
                }).finally(() => {
                    setIsSubmittingSchedule(false);
                });
                return;
            }
            startSendProgress(allNumbers.length);
            socket.emit("send_bulk_message", { email: getActiveEmail(), numbers: allNumbers, text: message, media: attachment, delay: effectiveDelay }, (response) => {
                if (response && response.success === false) {
                    setSendProgress(null);
                    alert(`❌ ${response.error || "WhatsApp is not connected. Please connect WhatsApp first."}`);
                    return;
                }
                finishSendProgress(response);
            });
            
            setMessage(""); 
        }
    };

    const handleConnectClick = () => {
        const creditsVal = parseInt(localStorage.getItem("credits") || "0", 10);
        const isSubscribedVal = localStorage.getItem("isSubscribed") === "true";
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        const isFreeUserLoggedIn = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");
        const anyLoggedIn = isLoggedIn || isFreeUserLoggedIn;

        if (!anyLoggedIn) {
            alert("⚠️ Please login first to connect your device!");
            return;
        }

        if (creditsVal <= 0 && !isSubscribedVal) {
            setStartClicked(false);
            window.dispatchEvent(new Event("showCreditExhaustedPopup"));
            return;
        }

        setStartClicked(true);
        setQrCode(""); // Show spinner while generating
        socket.emit("request_new_qr");
    };

    // Lets the unified Navbar's "Connect" button trigger this page's connect flow
    useEffect(() => {
        window.addEventListener("gy:connect-device", handleConnectClick);
        return () => window.removeEventListener("gy:connect-device", handleConnectClick);
    }, []);

    // Lets the unified Navbar's "Messages" item reopen this same chat/
    // messages panel. If the WhatsApp session is still valid, it opens
    // straight to the messages panel (no QR re-scan). If the session has
    // actually expired/disconnected, it falls back to the normal QR flow.
    const handleOpenMessages = () => {
        const creditsVal = parseInt(localStorage.getItem("credits") || "0", 10);
        const isSubscribedVal = localStorage.getItem("isSubscribed") === "true";
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        const isFreeUserLoggedIn = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");
        const anyLoggedIn = isLoggedIn || isFreeUserLoggedIn;

        if (anyLoggedIn && creditsVal <= 0 && !isSubscribedVal) {
            setStartClicked(false);
            window.dispatchEvent(new Event("showCreditExhaustedPopup"));
            return;
        }

        messagesRequestedRef.current = true;
        setStartClicked(true);
        if (isAuthenticated) {
            setShowFormOnly(true);
        } else {
            setQrCode("");
            socket.emit("request_new_qr");
            socket.emit("check_status");
        }
    };

    useEffect(() => {
        window.addEventListener("gy:open-messages", handleOpenMessages);
        return () => window.removeEventListener("gy:open-messages", handleOpenMessages);
    }, [isAuthenticated]);

    const isSubscribedVal = localStorage.getItem("isSubscribed") === "true";
    let activeSubscription = isSubscribedVal;
    const expiresAt = localStorage.getItem("subscriptionExpiresAt");
    if (expiresAt && expiresAt !== "null") {
        const expTime = new Date(expiresAt).getTime();
        if (!isNaN(expTime)) {
            activeSubscription = isSubscribedVal && expTime > Date.now();
        }
    }
    const creditsVal = parseInt(localStorage.getItem("credits") || "0", 10);
    const anyLoggedIn = isUserLoggedIn;
    const isFreeUser = !!localStorage.getItem("freeUserToken") || !!localStorage.getItem("freeUserData");
    const isTestingConditionActive = Date.now() <= new Date("2026-09-21T23:39:00+05:30").getTime();
    const isLockedOut = anyLoggedIn && !activeSubscription && (
      (isTestingConditionActive && !isFreeUser) ? true : creditsVal <= 0
    );
    const hasPendingRequest = localStorage.getItem("pendingPlanRequest") === "true";

    useEffect(() => {
        if (isLockedOut) {
            setShowFormOnly(true);
            setStartClicked(true);
            window.dispatchEvent(new Event("showCreditExhaustedPopup"));
        }
    }, [isLockedOut]);

    return (
        <div id="gy-top" className="min-h-screen w-full bg-[#212122] transition-all duration-700 relative overflow-x-hidden overflow-y-visible flex flex-col">

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');

                #gy-top { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
                .gy-display { font-family: 'Sora', ui-sans-serif, system-ui, sans-serif; }

                @keyframes gyFloat { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-24px) translateX(10px); } }
                @keyframes gyFloatSlow { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(20px) translateX(-14px); } }
                @keyframes gyGradientMove { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
                @keyframes gyPopIn { 0% { opacity: 0; transform: translateY(28px) scale(0.96); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes gyShine { 0% { transform: translateX(-120%) skewX(-12deg); } 100% { transform: translateX(220%) skewX(-12deg); } }
                @keyframes gyRingPulse { 0% { transform: scale(0.7); opacity: 0.8; } 100% { transform: scale(2.1); opacity: 0; } }
                @keyframes gyScan { 0% { top: 6%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 94%; opacity: 0; } }
                @keyframes gyBadgeFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                @keyframes gyDot { 0%,60%,100% { opacity: 0.3; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }
                .gy-gradient-text { background-size: 200% auto; animation: gyGradientMove 6s ease-in-out infinite; }
                .gy-pop { opacity: 0; animation: gyPopIn 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }
                .gy-shine-btn { position: relative; overflow: hidden; }
                .gy-shine-btn .gy-shine { position: absolute; top: 0; left: 0; width: 40%; height: 100%; background: linear-gradient(120deg, transparent, rgba(255,255,255,0.55), transparent); transform: translateX(-120%) skewX(-12deg); }
                .gy-shine-btn:hover .gy-shine { animation: gyShine 0.9s ease forwards; }
                .gy-tilt { transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease; }
                .gy-tilt:hover { transform: translateY(-8px); }
                .gy-ring { position: absolute; inset: 0; border-radius: 9999px; border: 2px solid #25D366; animation: gyRingPulse 2s ease-out infinite; }
                .gy-scan-line { position: absolute; left: 6%; right: 6%; height: 2px; background: linear-gradient(90deg, transparent, #25D366, transparent); animation: gyScan 2.4s ease-in-out infinite; }
                .gy-badge-float { animation: gyBadgeFloat 4s ease-in-out infinite; }
                .gy-typing-dot { display: inline-block; width: 6px; height: 6px; border-radius: 9999px; background: #9CA3AF; animation: gyDot 1.2s ease-in-out infinite; }

                /* Header / footer additions */
                .gy-navlink { position: relative; }
                .gy-navlink::after { content: ''; position: absolute; left: 14px; right: 14px; bottom: 6px; height: 2px; background: #25D366; border-radius: 2px; transform: scaleX(0); transform-origin: left; transition: transform 0.25s ease; }
                .gy-navlink:hover::after { transform: scaleX(1); }
                .gy-mobile-menu { transition: max-height 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease; }
            `}</style>

            {/* ================= MAIN ================= */}
            <main className="flex-1 relative">
                <div className="absolute top-10 left-4 sm:left-10 w-40 h-40 sm:w-72 sm:h-72 bg-[#25D366] rounded-full mix-blend-multiply filter blur-3xl opacity-[0.08]" style={{ animation: 'gyFloat 9s ease-in-out infinite' }}></div>
                <div className="absolute bottom-10 right-4 sm:right-10 w-48 h-48 sm:w-96 sm:h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.12]" style={{ animation: 'gyFloatSlow 11s ease-in-out infinite', animationDelay: '2s' }}></div>

                {/* ============ LANDING PAGE (not yet connecting a device) ============ */}
                {!startClicked && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 relative z-10">

                        {/* Hero */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-10 items-center mb-20 sm:mb-28">
                            <div className="gy-pop text-center lg:text-left">
                                <div className="inline-flex items-center gap-2.5 bg-[#25D366]/10 text-[#3ce089] pl-2 pr-4 py-2 rounded-full mb-7 border border-[#25D366]/20">
                                    <span className="w-6 h-6 rounded-full bg-[#0B141A] flex items-center justify-center shadow-sm shrink-0">
                                        <FaUserCircle className="text-sm text-[#25D366]" />
                                    </span>
                                    <span className="font-semibold text-xs sm:text-sm tracking-wide">
                                        {isUserLoggedIn 
                                            ? (sessionStorage.getItem("isFirstLogin") === "true"
                                                ? `Welcome, ${userName || 'User'}`
                                                : `Welcome back, ${userName || 'User'}`)
                                            : 'Welcome to LC, Goye'}
                                    </span>
                                </div>

                                <h1 className="gy-display text-[2.75rem] sm:text-6xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-[0.95] break-words">
                                    Reach Thousands <br className="hidden sm:block" />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#128C7E] via-[#25D366] to-[#128C7E] gy-gradient-text">Instantly.</span>
                                </h1>

                                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 text-xs sm:text-sm font-bold text-white mb-6 shadow-[0_0_20px_rgba(37,211,102,0.15)]">
                                    <span className="px-2.5 py-0.5 rounded-full bg-[#25D366] text-black font-extrabold text-xs">⚡ 100% FREE</span>
                                    <span className="text-white/90">WhatsApp Bulk Messaging Software</span>
                                </div>

                                <p className="text-white/50 text-base sm:text-lg mb-9 max-w-md mx-auto lg:mx-0 leading-relaxed">
Connect your WhatsApp and start sending bulk messages instantly with our LC Product.<br></br>
A free, fast, and reliable WhatsApp bulk messaging software for businesses and teams to grow faster.<br></br>
<b>Reach More Customers & Achieve New Heights.</b>

                                </p>

                                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 mb-10 sm:mb-14">
                                    <button onClick={handleConnectClick} className="gy-shine-btn group flex items-center justify-center gap-2.5 w-full sm:w-auto px-7 py-3.5 sm:py-4 bg-[#25D366] text-white text-sm sm:text-base font-bold rounded-xl shadow-[0_10px_24px_rgba(37,211,102,0.3)] hover:shadow-[0_14px_30px_rgba(37,211,102,0.42)] hover:-translate-y-0.5 transition-all duration-300">
                                        <span className="gy-shine"></span>
                                        <FaWhatsapp className="text-lg group-hover:scale-110 transition-transform" /> Connect Device Now
                                    </button>
                                    <a href="#how-it-works" className="group flex items-center justify-center gap-2.5 w-full sm:w-auto pl-7 pr-3 py-3.5 sm:py-4 text-white text-sm sm:text-base font-bold rounded-xl border border-white/15 bg-white/5 hover:border-[#25D366] hover:bg-[#25D366]/10 transition-all duration-300">
                                        See How It Works
                                        <span className="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-[#25D366] flex items-center justify-center transition-colors duration-300">
                                            <FaArrowRight className="text-xs text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                                        </span>
                                    </a>
                                </div>

                                {/* Stats row */}
                                <div className="flex items-stretch justify-center lg:justify-start gap-6 sm:gap-10 max-w-md mx-auto lg:mx-0 pt-7 border-t border-white/10">
                                    <div className="flex flex-col items-center lg:items-start gap-1.5">
                                        <FaUsers className="text-[#25D366] text-sm" />
                                        <p className="gy-display text-lg sm:text-2xl font-black text-white leading-none">10M+</p>
                                        <p className="text-[11px] sm:text-xs text-white/40 font-semibold uppercase tracking-wide">Messages Sent</p>
                                    </div>
                                    <div className="w-px bg-white/10"></div>
                                    <div className="flex flex-col items-center lg:items-start gap-1.5">
                                        <FaChartLine className="text-[#25D366] text-sm" />
                                        <p className="gy-display text-lg sm:text-2xl font-black text-white leading-none">5,000+</p>
                                        <p className="text-[11px] sm:text-xs text-white/40 font-semibold uppercase tracking-wide">Businesses</p>
                                    </div>
                                    <div className="w-px bg-white/10"></div>
                                    <div className="flex flex-col items-center lg:items-start gap-1.5">
                                        <FaShieldAlt className="text-[#25D366] text-sm" />
                                        <p className="gy-display text-lg sm:text-2xl font-black text-white leading-none">99.9%</p>
                                        <p className="text-[11px] sm:text-xs text-white/40 font-semibold uppercase tracking-wide">Uptime</p>
                                    </div>
                                </div>
                            </div>

                            {/* Premium phone-mockup visual — chat preview surrounded by 6 floating WhatsApp badges */}
                            <div className="gy-pop relative w-full flex justify-center" style={{ animationDelay: '150ms' }}>
                                <div className="relative mx-auto w-full max-w-[360px] sm:max-w-[420px] lg:max-w-none lg:w-[720px] xl:w-[760px] lg:h-[640px]">

                                    {/* Ambient glow */}
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#25D366]/20 via-green-400/10 to-transparent blur-3xl -z-10"></div>

                                    {/* ===== Phone mockup (always centered) ===== */}
                                    <div className="relative z-20 mx-auto mb-6 w-[240px] sm:w-[262px] lg:absolute lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:mb-0">
                                        {/* Soft natural shadow beneath the phone */}
                                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 w-[70%] h-6 rounded-full bg-black/50 blur-xl -z-10"></div>

                                        <div className="relative rounded-[2.1rem] bg-gradient-to-b from-[#0E1A20] to-[#060B0D] border-[6px] border-[#1B2A30] shadow-[0_25px_55px_rgba(0,0,0,0.5),0_0_30px_rgba(37,211,102,0.12)] overflow-hidden">
                                            {/* Status bar */}
                                            <div className="flex items-center justify-between px-5 pt-3 pb-1">
                                                <span className="text-[10px] font-bold text-white/70 tracking-wide">9:41</span>
                                                <div className="flex items-center gap-1">
                                                    <div className="flex items-end gap-[2px] h-2.5">
                                                        <span className="w-[2.5px] h-[40%] bg-white/50 rounded-sm"></span>
                                                        <span className="w-[2.5px] h-[65%] bg-white/50 rounded-sm"></span>
                                                        <span className="w-[2.5px] h-[85%] bg-white/50 rounded-sm"></span>
                                                        <span className="w-[2.5px] h-full bg-white/70 rounded-sm"></span>
                                                    </div>
                                                    <span className="w-4 h-2.5 rounded-[2px] border border-white/50 relative ml-1">
                                                        <span className="absolute inset-[1.5px] right-[3px] bg-[#25D366] rounded-[1px]"></span>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* App bar */}
                                            <div className="flex items-center justify-between px-4 pt-2 pb-3.5">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span
                                                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-extrabold shrink-0 shadow-[0_4px_12px_rgba(37,211,102,0.35)]"
                                                        style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
                                                    >
                                                        G
                                                    </span>
                                                    <div className="leading-tight min-w-0">
                                                        <p className="text-white text-[13px] font-bold truncate">Goye</p>
                                                        <p className="text-[9px] text-white/40 truncate">Broadcast Dashboard</p>
                                                    </div>
                                                </div>
                                                <span className="relative w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 shrink-0">
                                                    <FaBell size={12} />
                                                    <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-[#25D366]"></span>
                                                </span>
                                            </div>

                                            {/* Free unlimited access banner */}
                                            <div className="mx-4 mb-3 rounded-2xl bg-[#111B21]/90 border border-[#25D366]/40 p-2.5 flex items-center justify-between shadow-[0_4px_16px_rgba(37,211,102,0.15)]">
                                                <span className="px-2.5 py-1 rounded-full bg-[#25D366] text-black text-[10px] font-black tracking-wider uppercase shadow-[0_2px_8px_rgba(37,211,102,0.4)]">
                                                    FREE
                                                </span>
                                                <div className="text-right leading-tight">
                                                    <p className="text-[11px] font-black text-white tracking-wide flex items-center justify-end gap-1">
                                                        100% UNLIMITED ACCESS <span className="text-[#25D366] text-[10px]">✦</span>
                                                    </p>
                                                    <p className="text-[9px] font-medium text-[#25D366]/80">Free Forever</p>
                                                </div>
                                            </div>

                                            {/* Hero: live campaign progress */}
                                            <div className="mx-4 rounded-2xl bg-white/[0.04] border border-white/10 p-3 flex items-center gap-3 mb-3">
                                                <div className="relative w-[58px] h-[58px] shrink-0">
                                                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
                                                        <circle
                                                            cx="50" cy="50" r="42" fill="none" stroke="#25D366" strokeWidth="9"
                                                            strokeLinecap="round" strokeDasharray="264" strokeDashoffset="58"
                                                        />
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-white font-black text-[13px]">78%</span>
                                                    </div>
                                                </div>
                                                <div className="min-w-0 leading-tight">
                                                    <p className="text-white text-[12px] font-bold truncate">Campaign Live</p>
                                                    <p className="text-[9.5px] text-white/45 mt-0.5 truncate">9,842 of 12,600 delivered</p>
                                                    <span className="inline-flex items-center gap-1.5 mt-1 text-[9px] font-semibold text-[#25D366]">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse"></span>
                                                        Sending now
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Quick metrics */}
                                            <div className="grid grid-cols-3 gap-2 px-4 mb-3">
                                                {[
                                                    { label: 'Sent', value: '12.4K' },
                                                    { label: 'Read', value: '98%' },
                                                    { label: 'Failed', value: '0.2%' },
                                                ].map((m) => (
                                                    <div key={m.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] py-1.5 text-center">
                                                        <p className="text-white text-[11.5px] font-extrabold leading-tight">{m.value}</p>
                                                        <p className="text-[8px] text-white/40 mt-0.5">{m.label}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Recent campaigns */}
                                            <div className="px-4 flex items-center justify-between mb-2">
                                                <p className="text-white text-[11px] font-bold">Recent Campaigns</p>
                                                <p className="text-[9px] text-[#25D366] font-semibold">See all</p>
                                            </div>
                                            <div className="px-4 space-y-2 mb-3">
                                                {[
                                                    { name: 'Diwali Offer Blast', meta: '4,200 contacts', icon: <FaCheckDouble />, tone: '#25D366' },
                                                    { name: 'Order Reminders', meta: '1,860 contacts', icon: <FaBolt />, tone: '#F5A623' },
                                                ].map((row) => (
                                                    <div key={row.name} className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] px-3 py-2 border border-white/[0.05]">
                                                        <span
                                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] shrink-0"
                                                            style={{ backgroundColor: `${row.tone}26`, color: row.tone }}
                                                        >
                                                            {row.icon}
                                                        </span>
                                                        <div className="min-w-0 leading-tight flex-1">
                                                            <p className="text-white text-[10px] font-semibold truncate">{row.name}</p>
                                                            <p className="text-[8px] text-white/40 truncate">{row.meta}</p>
                                                        </div>
                                                        <FaCheckCircle className="text-[#25D366] text-[10px] shrink-0" />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* New broadcast CTA */}
                                            <div className="px-4 pb-3">
                                                <div
                                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white text-[11.5px] font-bold shadow-[0_6px_16px_rgba(37,211,102,0.35)] cursor-pointer"
                                                    style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
                                                >
                                                    <FaPlus size={10} /> New Broadcast
                                                </div>
                                            </div>

                                            {/* Bottom nav */}
                                            <div className="flex items-center justify-between px-8 py-2.5 border-t border-white/[0.06] bg-[#0B141A]/60">
                                                <FaHome className="text-[#25D366] text-[13px]" />
                                                <FaCommentDots className="text-white/30 text-[13px]" />
                                                <FaAddressBook className="text-white/30 text-[13px]" />
                                                <FaCog className="text-white/30 text-[13px]" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* ===== 6 Organically Floating WhatsApp Chat Badges (Desktop) ===== */}
                                    <div className="hidden lg:block pointer-events-none">
                                        {/* Badge 1: Top-Left (FREE) */}
                                        <div 
                                            className="gy-badge-float-1 lg:absolute z-30 flex items-center gap-2 select-none pointer-events-auto"
                                            style={{ right: 'calc(50% + 165px)', top: '18px' }}
                                        >
                                            <div className="w-8 h-8 rounded-full border-2 border-[#25D366] bg-[#111B21] flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(37,211,102,0.45)]">
                                                <FaWhatsapp className="text-[#25D366] text-[13px]" />
                                            </div>
                                            <div className="relative bg-[#202C33] border border-white/10 rounded-2xl rounded-tl-none px-3.5 py-1.5 flex items-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                                                <span className="absolute -left-1.5 top-2.5 w-0 h-0 border-y-[5px] border-y-transparent border-r-[7px] border-r-[#202C33]"></span>
                                                <span className="font-black text-[11px] tracking-wider text-white">FREE</span>
                                                <span className="text-[9.5px] text-white/50 font-medium ml-0.5">11:59</span>
                                            </div>
                                        </div>

                                        {/* Badge 2: Top-Right (UNLIMITED) */}
                                        <div 
                                            className="gy-badge-float-2 lg:absolute z-30 flex items-center gap-2 select-none pointer-events-auto"
                                            style={{ left: 'calc(50% + 175px)', top: '65px' }}
                                        >
                                            <div className="relative bg-[#005C4B] border border-[#25D366]/35 rounded-2xl rounded-tr-none px-3.5 py-1.5 flex items-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.4),0_0_15px_rgba(37,211,102,0.2)]">
                                                <span className="font-black text-[11px] tracking-wider text-white">UNLIMITED</span>
                                                <span className="text-[9.5px] text-white/70 font-medium ml-0.5">11:59</span>
                                                <FaCheckDouble className="text-[10px] text-[#53bdeb] shrink-0" />
                                                <span className="absolute -right-1.5 top-2.5 w-0 h-0 border-y-[5px] border-y-transparent border-l-[7px] border-l-[#005C4B]"></span>
                                            </div>
                                            <div className="w-8 h-8 rounded-full border-2 border-[#25D366] bg-[#111B21] flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(37,211,102,0.45)]">
                                                <FaWhatsapp className="text-[#25D366] text-[13px]" />
                                            </div>
                                        </div>

                                        {/* Badge 3: Mid-Left (INFINITE MESSAGES) */}
                                        <div 
                                            className="gy-badge-float-3 lg:absolute z-30 flex items-center gap-2 select-none pointer-events-auto"
                                            style={{ right: 'calc(50% + 175px)', top: '220px' }}
                                        >
                                            <div className="relative bg-[#005C4B] border border-[#25D366]/35 rounded-2xl rounded-tr-none px-3.5 py-1.5 flex items-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.4),0_0_15px_rgba(37,211,102,0.2)]">
                                                <FaInfinity className="text-[12px] text-[#25D366] shrink-0" />
                                                <span className="font-black text-[11px] tracking-wider text-white">INFINITE MESSAGES</span>
                                                <span className="text-[9.5px] text-white/70 font-medium ml-0.5">11:59</span>
                                                <FaCheckDouble className="text-[10px] text-[#53bdeb] shrink-0" />
                                                <span className="absolute -right-1.5 top-2.5 w-0 h-0 border-y-[5px] border-y-transparent border-l-[7px] border-l-[#005C4B]"></span>
                                            </div>
                                            <div className="w-8 h-8 rounded-full border-2 border-[#25D366] bg-[#111B21] flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(37,211,102,0.45)]">
                                                <FaWhatsapp className="text-[#25D366] text-[13px]" />
                                            </div>
                                        </div>

                                        {/* Badge 4: Lower-Mid Right (INSTANT ACCESS) */}
                                        <div 
                                            className="gy-badge-float-4 lg:absolute z-30 flex items-center gap-2 select-none pointer-events-auto"
                                            style={{ left: 'calc(50% + 175px)', top: '340px' }}
                                        >
                                            <div className="w-8 h-8 rounded-full border-2 border-[#25D366] bg-[#111B21] flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(37,211,102,0.45)]">
                                                <FaWhatsapp className="text-[#25D366] text-[13px]" />
                                            </div>
                                            <div className="relative bg-[#202C33] border border-white/10 rounded-2xl rounded-tl-none px-3.5 py-1.5 flex items-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                                                <span className="absolute -left-1.5 top-2.5 w-0 h-0 border-y-[5px] border-y-transparent border-r-[7px] border-r-[#202C33]"></span>
                                                <FaBolt className="text-[11px] text-[#25D366] shrink-0" />
                                                <span className="font-black text-[11px] tracking-wider text-white">INSTANT ACCESS</span>
                                                <span className="text-[9.5px] text-white/50 font-medium ml-0.5">11:59</span>
                                            </div>
                                        </div>

                                        {/* Badge 5: Bottom-Left (CREDIT FLEX) */}
                                        <div 
                                            className="gy-badge-float-5 lg:absolute z-30 flex items-center gap-2 select-none pointer-events-auto"
                                            style={{ right: 'calc(50% + 165px)', bottom: '45px' }}
                                        >
                                            <div className="w-8 h-8 rounded-full border-2 border-[#25D366] bg-[#111B21] flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(37,211,102,0.45)]">
                                                <FaWhatsapp className="text-[#25D366] text-[13px]" />
                                            </div>
                                            <div className="relative bg-[#005C4B] border border-[#25D366]/35 rounded-2xl rounded-tl-none px-3.5 py-1.5 flex items-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.4),0_0_15px_rgba(37,211,102,0.2)]">
                                                <span className="absolute -left-1.5 top-2.5 w-0 h-0 border-y-[5px] border-y-transparent border-r-[7px] border-r-[#005C4B]"></span>
                                                <span className="text-[11px] text-[#25D366] font-bold shrink-0">✦</span>
                                                <span className="font-black text-[11px] tracking-wider text-white">CREDIT FLEX</span>
                                                <span className="text-[9.5px] text-white/70 font-medium ml-0.5">11:59</span>
                                                <FaCheckDouble className="text-[10px] text-[#53bdeb] shrink-0" />
                                            </div>
                                        </div>

                                        {/* Badge 6: Bottom-Right (SECURE) */}
                                        <div 
                                            className="gy-badge-float-6 lg:absolute z-30 flex items-center gap-2 select-none pointer-events-auto"
                                            style={{ left: 'calc(50% + 170px)', bottom: '50px' }}
                                        >
                                            <div className="relative bg-[#005C4B] border border-[#25D366]/35 rounded-2xl rounded-tr-none px-3.5 py-1.5 flex items-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.4),0_0_15px_rgba(37,211,102,0.2)]">
                                                <FaShieldAlt className="text-[11px] text-[#25D366] shrink-0" />
                                                <span className="font-black text-[11px] tracking-wider text-white">SECURE</span>
                                                <span className="text-[9.5px] text-white/70 font-medium ml-0.5">11:59</span>
                                                <FaCheckDouble className="text-[10px] text-[#53bdeb] shrink-0" />
                                                <span className="absolute -right-1.5 top-2.5 w-0 h-0 border-y-[5px] border-y-transparent border-l-[7px] border-l-[#005C4B]"></span>
                                            </div>
                                            <div className="w-8 h-8 rounded-full border-2 border-[#25D366] bg-[#111B21] flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(37,211,102,0.45)]">
                                                <FaWhatsapp className="text-[#25D366] text-[13px]" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* ===== Mobile / Tablet Chips Wrap Strip ===== */}
                                    <div className="flex lg:hidden flex-wrap items-center justify-center gap-2.5 mt-6 px-2">
                                        <div className="flex items-center gap-1.5 bg-[#202C33] border border-white/10 rounded-full px-3 py-1 text-white shadow-md">
                                            <FaWhatsapp className="text-[#25D366] text-xs" />
                                            <span className="font-extrabold text-[10px] tracking-wider">FREE</span>
                                            <span className="text-[9px] text-white/50">11:59</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-[#005C4B] border border-[#25D366]/30 rounded-full px-3 py-1 text-white shadow-md">
                                            <span className="font-extrabold text-[10px] tracking-wider">UNLIMITED</span>
                                            <span className="text-[9px] text-white/70">11:59</span>
                                            <FaCheckDouble className="text-[9px] text-[#53bdeb]" />
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-[#005C4B] border border-[#25D366]/30 rounded-full px-3 py-1 text-white shadow-md">
                                            <FaInfinity className="text-[11px] text-[#25D366]" />
                                            <span className="font-extrabold text-[10px] tracking-wider">INFINITE MESSAGES</span>
                                            <span className="text-[9px] text-white/70">11:59</span>
                                            <FaCheckDouble className="text-[9px] text-[#53bdeb]" />
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-[#202C33] border border-white/10 rounded-full px-3 py-1 text-white shadow-md">
                                            <FaBolt className="text-[10px] text-[#25D366]" />
                                            <span className="font-extrabold text-[10px] tracking-wider">INSTANT ACCESS</span>
                                            <span className="text-[9px] text-white/50">11:59</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-[#005C4B] border border-[#25D366]/30 rounded-full px-3 py-1 text-white shadow-md">
                                            <span className="text-[10px] text-[#25D366]">✦</span>
                                            <span className="font-extrabold text-[10px] tracking-wider">CREDIT FLEX</span>
                                            <span className="text-[9px] text-white/70">11:59</span>
                                            <FaCheckDouble className="text-[9px] text-[#53bdeb]" />
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-[#005C4B] border border-[#25D366]/30 rounded-full px-3 py-1 text-white shadow-md">
                                            <FaShieldAlt className="text-[10px] text-[#25D366]" />
                                            <span className="font-extrabold text-[10px] tracking-wider">SECURE</span>
                                            <span className="text-[9px] text-white/70">11:59</span>
                                            <FaCheckDouble className="text-[9px] text-[#53bdeb]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature strip (9 Features) */}
                        <div id="features" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7 mb-24 sm:mb-32 scroll-mt-24">
                            {[
                                {
                                    icon: <FaBolt />,
                                    title: "Bulk Sending",
                                    desc: "Send thousands of personalized messages in a single click, instantly.",
                                    delay: "0ms"
                                },
                                {
                                    icon: <FaFileCsv />,
                                    title: "Easy Import",
                                    desc: "Upload an Excel or CSV file or type and your contact list is ready to go.",
                                    delay: "60ms"
                                },
                                {
                                    icon: <FaShieldAlt />,
                                    title: "Secure Sessions",
                                    desc: "Your WhatsApp session stays end to end encrypted and private.",
                                    delay: "120ms"
                                },
                                {
                                    icon: <FaCalendarAlt />,
                                    title: "Smart Scheduling",
                                    desc: "Schedule your broadcast campaigns in advance to reach customers at the perfect time.",
                                    delay: "180ms"
                                },
                                {
                                    icon: <FaChartBar />,
                                    title: "Live Delivery Reports",
                                    desc: "Track message delivery, success rates, and campaign statistics in real-time.",
                                    delay: "240ms"
                                },
                                {
                                    icon: <FaInfinity />,
                                    title: "Unlimited Reach",
                                    desc: "Broadcast to your entire audience without limits, maintaining peak delivery speed.",
                                    delay: "300ms"
                                },
                                {
                                    icon: <FaBolt />,
                                    title: "30 Welcome Credits",
                                    desc: "Start sending free immediately with 30 complimentary welcome credits on sign up.",
                                    delay: "360ms"
                                },
                                {
                                    icon: <FaCheckCircle />,
                                    title: "Quick QR Sync",
                                    desc: "Scan QR code and link your WhatsApp in seconds with seamless device sync.",
                                    delay: "420ms"
                                },
                                {
                                    icon: <FaHeartbeat />,
                                    title: "24/7 Admin Support",
                                    desc: "Round-the-clock priority support to resolve your broadcast queries anytime.",
                                    delay: "480ms"
                                }
                            ].map((item, idx) => (
                                <div 
                                    key={idx}
                                    className="gy-pop gy-tilt bg-white/[0.03] p-6 sm:p-8 rounded-3xl shadow-[0_2px_16px_rgba(0,0,0,0.2)] border border-white/10 hover:shadow-[0_20px_40px_rgba(37,211,102,0.18)] hover:border-[#25D366]/40 transition-all duration-300" 
                                    style={{ animationDelay: item.delay }}
                                >
                                    <div className="w-14 h-14 bg-[#25D366]/10 text-[#25D366] rounded-2xl flex items-center justify-center mb-5 text-2xl">
                                        {item.icon}
                                    </div>
                                    <h3 className="gy-display text-lg sm:text-xl font-bold text-white mb-2">{item.title}</h3>
                                    <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* How it works */}
                        <div id="how-it-works" className="gy-pop relative bg-white/[0.03] rounded-[1.5rem] sm:rounded-[3rem] shadow-[0_2px_24px_rgba(0,0,0,0.25)] p-6 sm:p-14 border border-white/10 overflow-visible scroll-mt-24">
                            <div className="text-center mb-10 sm:mb-14">
                                <div className="inline-block px-4 py-2 bg-[#25D366]/10 text-[#3ce089] font-bold text-xs tracking-widest uppercase rounded-full mb-4 border border-[#25D366]/20">Getting Started</div>
                                <h2 className="gy-display text-2xl sm:text-4xl font-extrabold text-white">Live in three simple steps</h2>
                            </div>
                            {/*
                              Fix: the previous "sm:grid-cols-3" switched to a 3-column layout at 640px,
                              a width many phones/phablets (and landscape phones) still hit, which squeezed
                              step 3 into a too-narrow column and made it look clipped with no way to scroll
                              to it. Columns now stay stacked (grid-cols-1, full width, natural page scroll)
                              all the way up to the "md" breakpoint (768px), which is the point where there's
                              actually enough room for 3 columns side by side. Desktop/tablet (md+) is unchanged.
                            */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 md:gap-6 relative overflow-visible">
                                <div className="hidden md:block absolute top-8 left-[16.5%] right-[16.5%] h-0.5 bg-gradient-to-r from-green-200 via-[#25D366] to-green-200"></div>
                                {[
                                    { step: "1", title: "Scan QR Code", desc: "Link your WhatsApp in seconds, just like WhatsApp Web.", icon: <FaWhatsapp /> },
                                    { step: "2", title: "Upload Contacts", desc: "Add numbers manually or import a CSV / Excel file.", icon: <FaFileCsv /> },
                                    { step: "3", title: "Send & Track", desc: "Fire off your campaign and watch delivery in real time.", icon: <FaChartLine /> },
                                ].map((s) => (
                                    <div key={s.step} className="relative flex flex-col items-center text-center min-w-0 w-full">
                                        <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#128C7E] to-[#25D366] text-white flex items-center justify-center text-2xl shadow-lg mb-4 shrink-0">
                                            {s.icon}
                                        </div>
                                        <span className="text-xs font-black text-[#25D366] tracking-widest mb-1">STEP {s.step}</span>
                                        <h3 className="gy-display text-lg font-bold text-white mb-2">{s.title}</h3>
                                        <p className="text-sm text-white/50 max-w-[220px] mx-auto">{s.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Bottom safe-space so the last section is never flush against the viewport edge on mobile */}
                        <div className="h-6 sm:h-0" aria-hidden="true"></div>
                    </div>
                )}

                {/* ============ CONNECT / QR / FORM FLOW (unchanged logic) ============ */}
                {startClicked && (
                <div className="flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 gap-8 min-h-[75vh] relative z-10 w-full max-w-7xl mx-auto">
                <div className={`gy-pop relative z-10 w-full bg-[#111814]/95 sm:bg-[#111814]/90 backdrop-blur-2xl rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.6)] border border-white/10 overflow-hidden transition-all duration-700 ease-out flex flex-col items-center justify-center min-h-[400px] ${
                    isAuthenticated && !showFormOnly ? 'max-w-2xl' : 
                      ((isAuthenticated || isLockedOut) && (showFormOnly || isLockedOut) ? 'max-w-6xl' : 'max-w-md')}`}>

                    {/* Glowing ambient background gradient */}
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#25D366]/10 rounded-full filter blur-3xl pointer-events-none -z-0"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#128C7E]/10 rounded-full filter blur-3xl pointer-events-none -z-0"></div>
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#25D366]/50 to-transparent"></div>

                    {/* 2. QR Screen */}
                    {startClicked && !isAuthenticated && !showFormOnly && !isLockedOut && (
                        <div className="flex flex-col items-center justify-center p-6 sm:p-10 w-full animate-fade-in-up relative z-10">
                            <h2 className="gy-display text-2xl sm:text-3xl font-extrabold mb-6 sm:mb-8 text-center text-[#25D366]">Secure Link</h2>
                            <div className="flex flex-col items-center w-full">
                                {connectionStatus === "disconnected" ? (
                                    <div className="flex flex-col items-center py-8 sm:py-12 text-center">
                                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-6"><div className="absolute inset-0 border-4 border-green-200 rounded-full"></div><div className="absolute inset-0 border-4 border-[#25D366] rounded-full border-t-transparent animate-spin"></div></div>
                                        <p className="text-white/80 font-semibold">Connecting to WhatsApp server...</p>
                                        <p className="text-sm text-white/50 mt-2 px-4">If this continues, start the backend server on port 5000.</p>
                                    </div>
                                ) : qrCode ? (
                                    <div className="relative p-3 sm:p-4 bg-white border-4 border-dashed rounded-2xl shadow-[0_0_40px_rgba(37,211,102,0.25)] mb-6 hover:border-solid hover:scale-105 transition-all duration-300 cursor-pointer max-w-full overflow-hidden" style={{ borderColor: "#25D366" }}>
                                        <QRCode value={qrCode} size={220} style={{ maxWidth: '100%', height: 'auto', width: '100%' }} />
                                        <span className="gy-scan-line"></span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center py-8 sm:py-12">
                                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-6"><div className="absolute inset-0 border-4 border-green-200 rounded-full"></div><div className="absolute inset-0 border-4 border-[#25D366] rounded-full border-t-transparent animate-spin"></div></div>
                                        <p className="text-white/50 font-medium animate-pulse text-center px-4">Establishing secure connection...</p>
                                    </div>
                                )}
                                <div className="mt-4 text-center px-4 max-w-sm mx-auto space-y-1.5">
                                    <p className="text-xs font-black tracking-widest text-[#25D366] uppercase">
                                        NOTE:
                                    </p>
                                    <p className="text-sm font-semibold text-white/90">
                                        You have to link your WhatsApp to continue.
                                    </p>
                                    <p className="text-xs text-white/50 pt-1 leading-relaxed">
                                        Open WhatsApp → Linked Devices → Link a Device → Scan this QR code.
                                    </p>
                                </div>
                                <button onClick={() => setStartClicked(false)} className="mt-6 text-sm text-white/40 hover:text-white transition-colors underline">Cancel & Go Back</button>
                            </div>
                        </div>
                    )}

                    {/* 3. Auth Success */}
                    {startClicked && isAuthenticated && !showFormOnly && (
                        <div className="flex flex-col items-center justify-center p-6 sm:p-12 w-full h-full bg-gradient-to-b from-[#25D366]/10 to-transparent animate-fade-in-up relative z-10">
                            <h2 className="gy-display text-3xl sm:text-4xl font-extrabold mb-6 sm:mb-8 text-center text-[#25D366]">Success!</h2>
                            <div className="flex flex-col items-center text-center">
                                <div className="relative rounded-full bg-[#25D366]/10 p-6 sm:p-8 mb-6 shadow-inner flex items-center justify-center">
                                    <span className="gy-ring" style={{ animationDelay: '0s' }}></span>
                                    <span className="gy-ring" style={{ animationDelay: '0.5s' }}></span>
                                    <span className="gy-ring" style={{ animationDelay: '1s' }}></span>
                                    <FaCheckCircle className="relative text-6xl sm:text-8xl text-[#25D366] animate-bounce" />
                                </div>
                                <h3 className="gy-display text-2xl sm:text-3xl text-white font-bold mb-2">Device Linked</h3>
                                <p className="text-base sm:text-lg text-white/50">Preparing your dashboard...</p>
                            </div>
                        </div>
                    )}

                    {/* 4. Form Panel */}
                    {startClicked && (isAuthenticated || showFormOnly || isLockedOut) && (
                        <div className={`p-4 sm:p-7 md:p-9 w-full flex flex-col transition-all duration-700 ease-in-out relative z-10 ${(showFormOnly || isLockedOut) ? 'w-full opacity-100 translate-x-0' : 'md:w-2/3 opacity-0 translate-x-10'}`}>

                            {/* WhatsApp Status Banner */}
                            <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-[#14261d]/90 via-[#183124]/90 to-[#14261d]/90 border border-[#25D366]/30 rounded-2xl px-5 py-3.5 mb-7 shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-xl">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] shadow-sm">
                                        <FaWhatsapp className="text-lg" />
                                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#25D366] rounded-full ring-2 ring-[#111814] animate-pulse"></span>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#25D366]">Sender Device</span>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#25D366]/20 text-[#3ce089] border border-[#25D366]/30">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-ping"></span> Online
                                            </span>
                                        </div>
                                        <span className="text-xs sm:text-sm font-mono font-bold text-white/90 tracking-wide">
                                            {connectedUser && connectedUser.id ? `+${connectedUser.id}` : "Ready & Connected"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-semibold text-white/60">
                                        <FaShieldAlt className="text-[#25D366]" />
                                        <span>End-to-End Encrypted</span>
                                    </div>
                                </div>
                            </div>

                            {/* Header Section */}
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-7 pb-6 border-b border-white/10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#128C7E] to-[#25D366] p-0.5 shadow-[0_4px_20px_rgba(37,211,102,0.3)] shrink-0 flex items-center justify-center">
                                        <div className="w-full h-full bg-[#111814] rounded-[14px] flex items-center justify-center text-[#25D366] text-xl">
                                            <FaPaperPlane />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2.5">
                                            <h2 className="gy-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Message Configuration</h2>
                                        </div>
                                        <p className="text-xs sm:text-sm text-white/50 mt-1 font-medium">Add your audience recipients, compose your message, and broadcast effortlessly.</p>
                                    </div>
                                </div>
                                <div className="hidden sm:inline-flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#25D366] shadow-sm">
                                    <FaBolt className="animate-pulse" /> Ready to Broadcast
                                </div>
                            </div>

                            {/* Two-column layout: Recipients | Message */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                {/* LEFT CARD: RECIPIENTS */}
                                <div className="bg-[#142019]/75 hover:bg-[#16241c]/85 border border-white/10 hover:border-[#25D366]/30 rounded-3xl p-5 sm:p-7 space-y-6 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all duration-300 flex flex-col justify-between">
                                    <div className="space-y-6">
                                        
                                        {/* Card Top Title */}
                                        <div className="flex items-center justify-between pb-4 border-b border-white/10">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] text-sm">
                                                    <FaUsers />
                                                </div>
                                                <h3 className="text-base font-extrabold text-white tracking-tight">Audience & Contacts</h3>
                                            </div>
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${
                                                recipientCount > 0 
                                                    ? 'bg-[#25D366]/15 border-[#25D366]/30 text-[#25D366] shadow-[0_0_12px_rgba(37,211,102,0.25)]' 
                                                    : 'bg-white/5 border-white/10 text-white/40'
                                            }`}>
                                                {recipientCount} {recipientCount === 1 ? 'Contact' : 'Contacts'} Ready
                                            </span>
                                        </div>

                                        {/* Contacts File Upload */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                                                    <span>Import Contacts File</span>
                                                </label>
                                                <span className="text-[10px] text-white/40 font-mono font-medium">.xlsx, .xls, .csv</span>
                                            </div>

                                            {/* Dropzone */}
                                            <div className="relative group/drop">
                                                <div className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all duration-300 cursor-pointer overflow-hidden ${
                                                    excelFile 
                                                        ? 'border-[#25D366] bg-[#25D366]/[0.08]' 
                                                        : 'border-white/15 hover:border-[#25D366] hover:bg-[#25D366]/5 bg-black/20'
                                                }`}>
                                                    {excelFile ? (
                                                        <div className="flex items-center justify-between gap-3 p-1 relative z-10">
                                                            <div className="flex items-center gap-3 text-left truncate">
                                                                <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] text-lg shrink-0">
                                                                    <FaFileCsv />
                                                                </div>
                                                                <div className="truncate">
                                                                    <p className="text-sm font-bold text-white truncate">{excelFile.name}</p>
                                                                    <p className="text-xs text-[#25D366] font-semibold">
                                                                        {parsedExcelContacts.length} numbers extracted
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={removeExcelFile}
                                                                aria-label="Remove selected file"
                                                                title="Remove file"
                                                                className="relative z-10 w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 flex items-center justify-center transition-all shrink-0 hover:scale-110 cursor-pointer"
                                                            >
                                                                <FaTimes className="text-xs" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="py-2 flex flex-col items-center">
                                                            <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center text-[#25D366] text-xl mb-3 group-hover/drop:-translate-y-1 transition-transform">
                                                                <FaCloudUploadAlt />
                                                            </div>
                                                            <p className="text-xs sm:text-sm text-white/70 font-medium">
                                                                Drag & drop contacts sheet or <span className="text-[#25D366] font-bold underline underline-offset-2">Browse</span>
                                                            </p>
                                                            <p className="text-[11px] text-white/40 mt-1">Automatic phone number column detection</p>
                                                        </div>
                                                    )}
                                                    <input 
                                                        ref={excelInputRef} 
                                                        type="file" 
                                                        accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
                                                        onChange={(e) => setExcelFile(e.target.files[0])} 
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-0" 
                                                    />
                                                </div>
                                            </div>

                                            {/* Download Sample Excel Template Card */}
                                            <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#25D366]/30 transition-all duration-300 flex items-start gap-3.5">
                                                <div className="w-9 h-9 rounded-xl bg-[#25D366]/15 border border-[#25D366]/25 flex items-center justify-center text-[#25D366] text-base shrink-0 mt-0.5">
                                                    <FaDownload />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                        <div>
                                                            <h4 className="text-xs sm:text-sm font-bold text-white">Need an Excel Template?</h4>
                                                            <p className="text-[11px] text-white/45 mt-0.5 leading-snug">
                                                                Download our sample format with country code guide (<code className="text-[#25D366] font-mono">+91...</code>).
                                                            </p>
                                                        </div>
                                                        <a 
                                                            href="/contacts-template.xlsx" 
                                                            download="contacts-template.xlsx"
                                                            className="inline-flex items-center justify-center gap-1.5 py-2 px-3.5 bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-black border border-[#25D366]/30 font-bold rounded-xl text-xs shadow-sm transition-all duration-300 cursor-pointer shrink-0"
                                                        >
                                                            <FaDownload className="text-[10px]" />
                                                            <span>Download</span>
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Manual Contacts */}
                                        <div className="pt-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-bold text-white/70 uppercase tracking-wider">Manual Contacts</label>
                                                <span className="text-[10px] text-white/40">Comma or line separated</span>
                                            </div>
                                            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                                                {manualContacts.map((contact, index) => (
                                                    <div key={index} className="relative w-full group">
                                                        <input 
                                                            type="text" 
                                                            value={contact}
                                                            onChange={(e) => handleContactChange(index, e.target.value)}
                                                            placeholder={index === 0 ? "e.g. 917418888999, 917418888998" : "e.g. +91 98765 43210"} 
                                                            className={`w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 outline-none focus:bg-black/50 focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all font-medium ${
                                                                index > 0 ? "pr-12" : ""
                                                            }`} 
                                                        />
                                                        {index > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeContactField(index)}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                                                                title="Delete contact field"
                                                            >
                                                                <FaTimes className="text-xs" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={addContactField} 
                                                className="inline-flex items-center gap-2 mt-3 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-[#25D366]/10 text-xs text-[#25D366] font-bold border border-white/10 hover:border-[#25D366]/30 transition-all cursor-pointer"
                                            >
                                                <FaPlus className="text-[10px]" /> Add another contact field
                                            </button>
                                        </div>

                                    </div>
                                </div>

                                {/* RIGHT CARD: MESSAGE & CONTENT */}
                                <div className="bg-[#142019]/75 hover:bg-[#16241c]/85 border border-white/10 hover:border-[#25D366]/30 rounded-3xl p-5 sm:p-7 space-y-6 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all duration-300 flex flex-col justify-between">
                                    <div className="space-y-6">

                                        {/* Card Top Title */}
                                        <div className="flex items-center justify-between pb-4 border-b border-white/10">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] text-sm">
                                                    <FaCommentDots />
                                                </div>
                                                <h3 className="text-base font-extrabold text-white tracking-tight">Message Composer</h3>
                                            </div>
                                            <span className="text-xs font-semibold text-white/40">
                                                {message.length} chars
                                            </span>
                                        </div>

                                        {/* Message Content */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-bold text-white/70 uppercase tracking-wider">Message Content</label>
                                                <div className="flex items-center gap-2">
                                                    {/* Custom Language Dropdown */}
                                                    <div className="relative" ref={langDropdownRef}>
                                                        <button
                                                            type="button"
                                                            onClick={() => !isListening && setIsLangDropdownOpen(!isLangDropdownOpen)}
                                                            disabled={isListening}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all duration-300 border shadow-sm ${
                                                                isLangDropdownOpen 
                                                                    ? 'bg-[#25D366]/20 text-[#25D366] border-[#25D366] shadow-[0_0_12px_rgba(37,211,102,0.3)] ring-1 ring-[#25D366]/40' 
                                                                    : 'bg-black/60 text-[#25D366] border-[#25D366]/40 hover:border-[#25D366] hover:bg-black/80'
                                                            } ${isListening ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                                                            title="Select Voice Language"
                                                        >
                                                            <FaGlobe className="text-xs text-[#25D366]" />
                                                            <span>{voiceLang === 'ta-IN' ? 'Tamil' : 'English'}</span>
                                                            <FaChevronDown className={`text-[9px] transition-transform duration-300 ${isLangDropdownOpen ? 'rotate-180 text-[#25D366]' : 'text-[#25D366]/70'}`} />
                                                        </button>

                                                        {/* Sleek Glassmorphism Dropdown Menu */}
                                                        {isLangDropdownOpen && (
                                                            <div className="absolute right-0 top-full mt-2 w-40 bg-[#0d1410]/95 border border-[#25D366]/40 backdrop-blur-2xl rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.85),0_0_20px_rgba(37,211,102,0.2)] py-1.5 z-50 animate-fade-in-up overflow-hidden ring-1 ring-white/10">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setVoiceLang('en-US');
                                                                        setIsLangDropdownOpen(false);
                                                                    }}
                                                                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold transition-all ${
                                                                        voiceLang === 'en-US' 
                                                                            ? 'bg-[#25D366]/20 text-[#25D366]' 
                                                                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-2.5">
                                                                        <span className="text-sm">🇬🇧</span>
                                                                        <span>English</span>
                                                                    </div>
                                                                    {voiceLang === 'en-US' && <span className="text-[#25D366] text-xs font-black">✓</span>}
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setVoiceLang('ta-IN');
                                                                        setIsLangDropdownOpen(false);
                                                                    }}
                                                                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold transition-all border-t border-white/5 ${
                                                                        voiceLang === 'ta-IN' 
                                                                            ? 'bg-[#25D366]/20 text-[#25D366]' 
                                                                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-2.5">
                                                                        <span className="text-sm">🇮🇳</span>
                                                                        <span>Tamil (தமிழ்)</span>
                                                                    </div>
                                                                    {voiceLang === 'ta-IN' && <span className="text-[#25D366] text-xs font-black">✓</span>}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={toggleVoiceInput}
                                                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-300 cursor-pointer shadow-md select-none active:scale-95 ${
                                                            isListening 
                                                                ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] border border-red-400 animate-pulse' 
                                                                : 'bg-gradient-to-r from-[#25D366] to-[#128C7E] text-black hover:opacity-95 shadow-[0_3px_15px_rgba(37,211,102,0.4)] hover:shadow-[0_4px_22px_rgba(37,211,102,0.6)] hover:-translate-y-0.5 border border-[#34E38A]/50'
                                                        }`}
                                                        title="Click to speak and convert voice to text"
                                                    >
                                                        <FaMicrophone className={isListening ? 'animate-bounce text-white text-sm' : 'text-black text-xs'} />
                                                        <span>{isListening ? 'Listening...' : 'Voice to Text'}</span>
                                                    </button>
                                                </div>
                                            </div>
                                            <textarea 
                                                rows="5" 
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                placeholder="Type your broadcast message here... or click 'Voice to Text' to speak."
                                                className="w-full px-4 py-3.5 bg-black/30 border border-white/10 rounded-2xl text-sm text-white placeholder:text-white/25 outline-none focus:bg-black/50 focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all resize-none shadow-inner leading-relaxed"
                                            ></textarea>
                                        </div>

                                        {/* Media & Attachments */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-bold text-white/70 uppercase tracking-wider">
                                                    Media & Attachments
                                                </label>
                                                <span className="text-[10px] text-white/40">Max 3 Img, 2 Docs, 1 Vid</span>
                                            </div>

                                            <div className="relative border-2 border-dashed border-white/15 hover:border-[#25D366] hover:bg-[#25D366]/5 rounded-2xl p-4 transition-all duration-300 cursor-pointer bg-black/20 group/media">
                                                <div className="flex items-center justify-center gap-2.5 py-1">
                                                    <FaCloudUploadAlt className="text-xl text-[#25D366] group-hover/media:-translate-y-0.5 transition-transform" />
                                                    <span className="text-xs sm:text-sm text-white/60 font-medium">
                                                        Attach Images, Videos, or Documents
                                                    </span>
                                                </div>
                                                <input 
                                                    ref={mediaInputRef} 
                                                    type="file" 
                                                    multiple 
                                                    onChange={handleMediaChange} 
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                                />
                                            </div>

                                            {/* Media Files list */}
                                            {mediaFiles.length > 0 && (
                                                <div className="mt-3 p-3 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2">
                                                    <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
                                                        <span className="font-bold text-[#25D366]">
                                                            {mediaFiles.length} {mediaFiles.length === 1 ? 'file' : 'files'} attached
                                                        </span>
                                                        <button 
                                                            type="button" 
                                                            onClick={removeMediaFile} 
                                                            className="text-[11px] text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                                                        >
                                                            Remove all
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 pt-1">
                                                        {mediaFiles.map((m, idx) => (
                                                            <div key={idx} className="inline-flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/25 text-white text-xs px-3 py-1.5 rounded-xl">
                                                                <span className="truncate max-w-[130px] font-medium">{m.filename}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => removeMediaFileItem(idx, e)}
                                                                    className="text-white/40 hover:text-red-400 p-0.5 transition-colors cursor-pointer"
                                                                    title="Remove file"
                                                                >
                                                                    <FaTimes className="text-[10px]" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Smart Scheduler Section */}
                                        {isSubscribedUser ? (
                                            <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/10 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div 
                                                            className={`w-11 h-6 rounded-full p-0.5 cursor-pointer transition-colors duration-300 flex items-center ${isScheduling ? 'bg-[#25D366]' : 'bg-white/20'}`} 
                                                            onClick={() => setIsScheduling(!isScheduling)}
                                                        >
                                                            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isScheduling ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                                        </div>
                                                        <span className="text-base font-bold text-white/90">Schedule this message for later</span>
                                                    </div>
                                                </div>
                                                
                                                 {isScheduling && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 border-t border-white/10 animate-fade-in-up">
                                                        <div>
                                                            <label className="block text-xs sm:text-sm font-bold text-white/60 mb-1.5 sm:mb-2 uppercase tracking-wider">Select Date</label>
                                                            <input 
                                                                type="date" 
                                                                min={new Date().toISOString().split('T')[0]} 
                                                                value={scheduleDate} 
                                                                onChange={e => setScheduleDate(e.target.value)} 
                                                                className="w-full h-11 sm:h-12 px-3 border border-white/15 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-transparent outline-none bg-black/40 text-white text-xs sm:text-sm font-semibold" 
                                                                style={{ colorScheme: "dark" }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs sm:text-sm font-bold text-white/60 mb-1.5 sm:mb-2 uppercase tracking-wider">Select Time</label>
                                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="HH" 
                                                                    value={scheduleHour} 
                                                                    onChange={e => {
                                                                        const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                                                                        if (!v || parseInt(v) <= 12) {
                                                                            setScheduleHour(v);
                                                                            if (v.length === 2 && parseInt(v) >= 1 && parseInt(v) <= 12) {
                                                                                const minInput = document.getElementById('schedule-min-input');
                                                                                if (minInput) minInput.focus();
                                                                            }
                                                                        }
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        if (e.target.value && parseInt(e.target.value) >= 1) {
                                                                            setScheduleHour(e.target.value.padStart(2, '0'));
                                                                        } else {
                                                                            setScheduleHour("12");
                                                                        }
                                                                    }}
                                                                    className="w-12 sm:w-14 h-11 sm:h-12 px-1.5 sm:px-2 border border-white/15 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-transparent outline-none bg-black/40 text-white text-center font-bold text-xs sm:text-sm" 
                                                                />
                                                                <span className="text-base sm:text-xl font-bold text-white/40">:</span>
                                                                <input 
                                                                    id="schedule-min-input"
                                                                    type="text" 
                                                                    placeholder="MM" 
                                                                    value={scheduleMinute} 
                                                                    onChange={e => {
                                                                        const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                                                                        if (!v || parseInt(v) <= 59) {
                                                                            setScheduleMinute(v);
                                                                        }
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        if (e.target.value) {
                                                                            setScheduleMinute(e.target.value.padStart(2, '0'));
                                                                        } else {
                                                                            setScheduleMinute("00");
                                                                        }
                                                                    }}
                                                                    className="w-12 sm:w-14 h-11 sm:h-12 px-1.5 sm:px-2 border border-white/15 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-transparent outline-none bg-black/40 text-white text-center font-bold text-xs sm:text-sm" 
                                                                />
                                                                <select 
                                                                    value={scheduleAmPm} 
                                                                    onChange={e => setScheduleAmPm(e.target.value)} 
                                                                    className="h-11 sm:h-12 px-2.5 sm:px-3 border border-white/15 rounded-xl focus:ring-2 focus:ring-[#25D366] focus:border-transparent outline-none bg-black/40 font-bold text-[#25D366] text-xs sm:text-sm cursor-pointer"
                                                                >
                                                                    <option value="AM" className="text-black bg-white">AM</option>
                                                                    <option value="PM" className="text-black bg-white">PM</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        {(scheduleDate && scheduleHour && scheduleMinute) && (
                                                            <div className="col-span-full mt-2 sm:mt-3 text-xs sm:text-sm text-center text-[#25D366] bg-[#25D366]/10 p-2.5 sm:p-3 rounded-xl border border-[#25D366]/30 font-semibold leading-relaxed">
                                                                ⏰ Scheduled for <strong>{new Date(`${scheduleDate}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, {scheduleHour}:{scheduleMinute} {scheduleAmPm}</strong>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div 
                                                onClick={() => window.dispatchEvent(new Event("gy:open-plans-modal"))}
                                                className="p-3.5 sm:p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl border border-white/10 hover:border-amber-400/40 transition-all duration-300 cursor-pointer flex items-center justify-between gap-2.5 sm:gap-3 group"
                                            >
                                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center text-base sm:text-lg shrink-0">
                                                        <FiClock size={18} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                                            <span className="text-xs sm:text-sm md:text-base font-bold text-white/90 group-hover:text-white transition-colors truncate">
                                                                Smart Scheduler
                                                            </span>
                                                            <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black uppercase tracking-wider inline-flex items-center gap-0.5 shrink-0 shadow-sm">
                                                                🔒 PRO
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] sm:text-xs text-white/50 group-hover:text-white/70 transition-colors line-clamp-1 sm:line-clamp-none mt-0.5">
                                                            Schedule automated messages for later • Upgrade to Pro to unlock
                                                        </p>
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button"
                                                    className="shrink-0 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-amber-400/10 group-hover:bg-amber-400 text-amber-300 group-hover:text-black text-[11px] sm:text-xs font-bold transition-all border border-amber-400/30 flex items-center gap-1 whitespace-nowrap"
                                                >
                                                    <span>View Plans</span>
                                                    <span className="text-xs sm:text-sm">→</span>
                                                </button>
                                            </div>
                                        )}

                                        {/* Message Delay / Sending Interval */}
                                        {isSubscribedUser ? (
                                            <div className="p-4 bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl border border-white/10 transition-all duration-200">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 text-[#25D366] flex items-center justify-center text-lg shrink-0">
                                                            <FiClock />
                                                        </div>
                                                        <span className="text-base font-bold text-white/90">
                                                            Message Delay
                                                        </span>
                                                    </div>

                                                    <div className="relative shrink-0">
                                                        <select
                                                            value={delayOption}
                                                            onChange={(e) => setDelayOption(e.target.value)}
                                                            className="h-10 pl-3.5 pr-8 bg-black/50 border border-white/15 hover:border-white/30 rounded-xl text-white font-semibold text-xs sm:text-sm focus:border-[#25D366] outline-none cursor-pointer appearance-none transition-colors"
                                                        >
                                                            <option value="1" className="bg-[#18181b] text-white">1s (Ultra Fast)</option>
                                                            <option value="2" className="bg-[#18181b] text-white">2s (Standard - Default)</option>
                                                            <option value="3" className="bg-[#18181b] text-white">3s (Recommended)</option>
                                                            <option value="5" className="bg-[#18181b] text-white">5s (Safe)</option>
                                                            <option value="10" className="bg-[#18181b] text-white">10s (High Safe)</option>
                                                            <option value="custom" className="bg-[#18181b] text-[#25D366] font-bold">⚙️ Custom</option>
                                                        </select>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-white/40">
                                                            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                                                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expandable Custom Delay Input */}
                                                {delayOption === "custom" && (
                                                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-3 animate-fade-in-up">
                                                        <span className="text-xs text-white/60 font-medium">
                                                            Enter delay duration:
                                                        </span>
                                                        <div className="flex items-center gap-2 bg-black/50 border border-white/15 focus-within:border-[#25D366] px-3 py-1.5 rounded-xl transition-colors">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max="120"
                                                                value={customDelay}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    if (val === "" || parseInt(val, 10) >= 0) {
                                                                        setCustomDelay(val);
                                                                    }
                                                                }}
                                                                placeholder="4"
                                                                className="w-12 bg-transparent text-center text-[#25D366] font-bold text-sm outline-none"
                                                            />
                                                            <span className="text-xs font-semibold text-white/50">seconds</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div 
                                                onClick={() => window.dispatchEvent(new Event("gy:open-plans-modal"))}
                                                className="p-3.5 sm:p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl border border-white/10 hover:border-amber-400/40 transition-all duration-300 cursor-pointer flex items-center justify-between gap-2.5 sm:gap-3 group"
                                            >
                                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center text-base sm:text-lg shrink-0">
                                                        <FiClock size={18} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                                            <span className="text-xs sm:text-sm md:text-base font-bold text-white/90 group-hover:text-white transition-colors truncate">
                                                                Message Delay
                                                            </span>
                                                            <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black uppercase tracking-wider inline-flex items-center gap-0.5 shrink-0 shadow-sm">
                                                                🔒 PRO
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] sm:text-xs text-white/50 group-hover:text-white/70 transition-colors line-clamp-1 sm:line-clamp-none mt-0.5">
                                                            Custom message intervals (1s - 120s) • Upgrade to Pro to unlock
                                                        </p>
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button"
                                                    className="shrink-0 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-amber-400/10 group-hover:bg-amber-400 text-amber-300 group-hover:text-black text-[11px] sm:text-xs font-bold transition-all border border-amber-400/30 flex items-center gap-1 whitespace-nowrap"
                                                >
                                                    <span>View Plans</span>
                                                    <span className="text-xs sm:text-sm">→</span>
                                                </button>
                                            </div>
                                        )}

                                        {/* Goyee AI 24/7 Customer Support & Sales Auto-Reply Card */}
                                        {isSubscribedUser ? (
                                            <div className="p-4 bg-white/[0.02] hover:bg-white/[0.03] rounded-2xl border border-white/10 transition-all duration-300">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-lg shrink-0">
                                                            <FaRobot className="text-xl text-indigo-400" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-base font-bold text-white/90">
                                                                    Goyee AI 24/7 Auto-Reply
                                                                </span>
                                                                {aiEnabled ? (
                                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#25D366] border border-emerald-500/30 flex items-center gap-1">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse"></span>
                                                                        ACTIVE
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">
                                                                        INACTIVE
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-white/50">
                                                                24/7 AI WhatsApp customer support & sales agent
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={handleToggleAi}
                                                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${aiEnabled ? 'bg-[#25D366]' : 'bg-white/20'}`}
                                                        title={aiEnabled ? "Turn OFF Goyee AI" : "Turn ON Goyee AI"}
                                                    >
                                                        <div className={`bg-black w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${aiEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>

                                                {/* AI Knowledge Base & Settings Area */}
                                                <div className="mt-4 pt-3 border-t border-white/10 space-y-3">
                                                    <div>
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <label className="text-xs font-semibold text-white/80">
                                                                Business Details, Daily Rates & Offers:
                                                            </label>
                                                            <span className="text-[10px] text-white/40">
                                                                AI strictly grounds replies on this
                                                            </span>
                                                        </div>
                                                        <textarea
                                                            rows={5}
                                                            value={aiKnowledgeBase}
                                                            onChange={(e) => setAiKnowledgeBase(e.target.value)}
                                                            placeholder="Enter your business details, daily rates, active offers, product pricing, location, working hours, and common customer FAQs here..."
                                                            className="w-full bg-black/40 border border-white/15 focus:border-[#25D366] rounded-xl p-3 text-xs text-white placeholder-white/30 outline-none transition-colors resize-none leading-relaxed font-sans [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                                                        />
                                                    </div>

                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSaveAiConfig()}
                                                            disabled={isSavingAi}
                                                            className="px-4 py-2 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                                                        >
                                                            {isSavingAi ? (
                                                                <FaSpinner className="animate-spin text-xs" />
                                                            ) : aiSaveSuccess ? (
                                                                <FaCheckCircle className="text-xs text-[#25D366]" />
                                                            ) : (
                                                                <FaBolt className="text-xs" />
                                                            )}
                                                            <span>{aiSaveSuccess ? "Saved Successfully!" : isSavingAi ? "Saving..." : "Save Knowledge Base"}</span>
                                                        </button>
                                                    </div>

                                                    {/* Live Feed of Auto-Replies */}
                                                    {recentAiReplies.length > 0 && (
                                                        <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] font-bold text-white/70 flex items-center gap-1.5">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse"></span>
                                                                    ⚡ Recent Live Auto-Replies:
                                                                </span>
                                                                <span className="text-[10px] text-white/40">{recentAiReplies.length} active</span>
                                                            </div>
                                                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                                                {recentAiReplies.map((r, idx) => (
                                                                    <div key={idx} className="p-2.5 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 text-[11px] flex items-start justify-between gap-3 transition-colors">
                                                                        <div className="space-y-0.5">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="font-bold text-[#25D366]">{r.name || r.phone}:</span>
                                                                                <span className="text-white/60 italic font-sans">"{r.query}"</span>
                                                                            </div>
                                                                            <div className="text-white/90 pl-2 border-l border-[#25D366]/30 font-sans leading-relaxed">
                                                                                {r.reply}
                                                                            </div>
                                                                        </div>
                                                                        <span className="text-[10px] font-mono text-white/40 shrink-0 bg-white/5 px-2 py-0.5 rounded-md">
                                                                            {r.time || (r.timestamp && !isNaN(new Date(r.timestamp)) ? new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now")}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div 
                                                onClick={() => window.dispatchEvent(new Event("gy:open-plans-modal"))}
                                                className="p-3.5 sm:p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl border border-white/10 hover:border-amber-400/40 transition-all duration-300 cursor-pointer flex items-center justify-between gap-2.5 sm:gap-3 group"
                                            >
                                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center text-base sm:text-lg shrink-0">
                                                        <FaRobot size={18} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                                            <span className="text-xs sm:text-sm md:text-base font-bold text-white/90 group-hover:text-white transition-colors truncate">
                                                                Goyee AI 24/7 Auto-Reply
                                                            </span>
                                                            <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black uppercase tracking-wider inline-flex items-center gap-0.5 shrink-0 shadow-sm">
                                                                🔒 PRO
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] sm:text-xs text-white/50 group-hover:text-white/70 transition-colors line-clamp-1 sm:line-clamp-none mt-0.5">
                                                            24/7 AI WhatsApp customer support & sales agent • Upgrade to Pro to unlock
                                                        </p>
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button"
                                                    className="shrink-0 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-amber-400/10 group-hover:bg-amber-400 text-amber-300 group-hover:text-black text-[11px] sm:text-xs font-bold transition-all border border-amber-400/30 flex items-center gap-1 whitespace-nowrap"
                                                >
                                                    <span>View Plans</span>
                                                    <span className="text-xs sm:text-sm">→</span>
                                                </button>
                                            </div>
                                        )}

                                    </div>
                                </div>

                            </div>

                            {/* Bottom Action Controls */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/10 relative z-10">
                                <button 
                                    onClick={sendBulkMessages} 
                                    disabled={isSubmittingSchedule}
                                    className={`gy-shine-btn w-full h-[54px] flex items-center justify-center gap-3 text-black font-extrabold rounded-2xl shadow-[0_8px_30px_rgba(37,211,102,0.4)] hover:shadow-[0_12px_40px_rgba(37,211,102,0.6)] transition-all duration-300 text-sm sm:text-base bg-gradient-to-r from-[#25D366] via-[#22c55e] to-[#128C7E] ${isSubmittingSchedule ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98] cursor-pointer'}`} 
                                >
                                    <span className="gy-shine"></span>
                                    {isSubmittingSchedule ? (
                                        <>
                                            <FaSpinner className="animate-spin text-lg" />
                                            <span>Scheduling broadcast... Please wait</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaPaperPlane className="text-base" /> 
                                            <span>{isScheduling ? "Schedule Broadcast" : "Send Broadcast Messages"}</span>
                                        </>
                                    )}
                                </button>

                                <button 
                                    type="button"
                                    onClick={() => {
                                        const expiresAt = localStorage.getItem("subscriptionExpiresAt");
                                        const isSubscribedVal = localStorage.getItem("isSubscribed") === "true";
                                        let isSubActive = isSubscribedVal;
                                        if (expiresAt && expiresAt !== "null") {
                                            const expTime = new Date(expiresAt).getTime();
                                            if (!isNaN(expTime)) {
                                                isSubActive = isSubscribedVal && expTime > Date.now();
                                            }
                                        }

                                        if (!isSubActive) {
                                            window.dispatchEvent(new Event("gy:open-plans-modal"));
                                            return;
                                        }

                                        const nums = getParsedNumbers();
                                        if (nums.length === 0 && !excelFile) {
                                            alert("Please add at least one recipient contact or upload an Excel file first!");
                                            return;
                                        }
                                        setShowTeamModal(true);
                                    }}
                                    className={`w-full h-[54px] flex items-center justify-center gap-2.5 px-4 font-bold rounded-2xl border transition-all duration-300 text-sm sm:text-base relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                                        (() => {
                                            const expiresAt = localStorage.getItem("subscriptionExpiresAt");
                                            const isSubscribedVal = localStorage.getItem("isSubscribed") === "true";
                                            let isSubActive = isSubscribedVal;
                                            if (expiresAt && expiresAt !== "null") {
                                                const expTime = new Date(expiresAt).getTime();
                                                if (!isNaN(expTime)) {
                                                    isSubActive = isSubscribedVal && expTime > Date.now();
                                                }
                                            }
                                            return isSubActive
                                                ? "bg-gradient-to-r from-[#14261c] via-[#1a3828] to-[#102217] text-white border-[#25D366]/40 hover:border-[#25D366] shadow-[0_4px_20px_rgba(37,211,102,0.25)]"
                                                : "bg-[#142019]/80 hover:bg-[#18261f] text-white/80 hover:text-white border-white/10 hover:border-[#25D366]/30 shadow-md";
                                        })()
                                    }`}
                                    title={
                                        (() => {
                                            const expiresAt = localStorage.getItem("subscriptionExpiresAt");
                                            const isSubscribedVal = localStorage.getItem("isSubscribed") === "true";
                                            let isSubActive = isSubscribedVal;
                                            if (expiresAt && expiresAt !== "null") {
                                                const expTime = new Date(expiresAt).getTime();
                                                if (!isNaN(expTime)) {
                                                    isSubActive = isSubscribedVal && expTime > Date.now();
                                                }
                                            }
                                            return !isSubActive ? "Split with Team is a Premium Subscribed Feature. Click to upgrade!" : "Split campaign across team";
                                        })()
                                    }
                                >
                                    <FaUsers className="text-base shrink-0 text-[#25D366]" /> 
                                    <span className="whitespace-nowrap font-bold">Split with Team</span>
                                    {(() => {
                                        const expiresAt = localStorage.getItem("subscriptionExpiresAt");
                                        const isSubscribedVal = localStorage.getItem("isSubscribed") === "true";
                                        let isSubActive = isSubscribedVal;
                                        if (expiresAt && expiresAt !== "null") {
                                            const expTime = new Date(expiresAt).getTime();
                                            if (!isNaN(expTime)) {
                                                isSubActive = isSubscribedVal && expTime > Date.now();
                                            }
                                        }
                                        return !isSubActive ? (
                                            <span className="ml-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-black tracking-wider uppercase font-mono shadow-sm">
                                                <FaLock size={9} /> PRO
                                            </span>
                                        ) : null;
                                    })()}
                                </button>
                            </div>

                        </div>
                    )}
                </div>
                </div>
                )}

                {showTeamModal && (
                    <TeamCampaignModal
                        contacts={getParsedNumbers()}
                        messageText={message}
                        mediaFile={mediaFiles.length ? mediaFiles[0] : null}
                        mediaFiles={mediaFiles}
                        onClose={() => setShowTeamModal(false)}
                        onCampaignCreated={(camp) => {
                            setShowTeamModal(false);
                            if (camp && camp._id) {
                                setActiveCampaignId(camp._id);
                            }
                        }}
                    />
                )}

                {activeCampaignId && (
                    <TeamLobby
                        campaignId={activeCampaignId}
                        leaderEmail={getActiveEmail() || localStorage.getItem("email") || "leader@goye.com"}
                        onClose={() => setActiveCampaignId(null)}
                    />
                )}
            </main>

            {/* ================= FOOTER ================= */}
            <footer className="relative bg-[#212122] mt-auto">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#25D366]/50 to-transparent"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 sm:gap-8 mb-10 sm:mb-14">

                        {/* Brand */}
                        <div className="sm:col-span-2 md:col-span-2">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-[0_4px_14px_rgba(37,211,102,0.3)]">
                                    <FaWhatsapp className="text-white text-lg" />
                                </div>
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
                                <li><a href="#gy-top" className="text-sm text-white/50 hover:text-[#25D366] transition-colors">Home</a></li>
                                <li><a href="#features" className="text-sm text-white/50 hover:text-[#25D366] transition-colors">Features</a></li>
                                <li><a href="#how-it-works" className="text-sm text-white/50 hover:text-[#25D366] transition-colors">How It Works</a></li>
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

            {/* ============ SEND PROGRESS POPUP ============ */}
            {sendProgress && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
                    <div className="gy-pop w-full max-w-md bg-[#111B21] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden p-8 text-center">
                        <div className="flex justify-between items-start mb-2">
                            <div className="w-6 h-6"></div> {/* Spacer */}
                            <h3 className="gy-display text-xl font-bold text-white">
                                {sendProgress.done ? "Send Complete" : (isScheduling ? "Scheduling Messages..." : "Sending Bulk Messages...")}
                            </h3>
                            {sendProgress.done ? (
                                <button
                                    type="button"
                                    onClick={() => setSendProgress(null)}
                                    aria-label="Close"
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors duration-200"
                                >
                                    <FaTimes className="text-xs" />
                                </button>
                            ) : (
                                <div className="w-6 h-6"></div>
                            )}
                        </div>
                        <p className="text-sm text-white/50 mb-6">
                            {sendProgress.done ? "Your message campaign has finished." : `Please wait while your messages are being ${isScheduling ? "scheduled" : "sent"}.`}
                        </p>
                        
                        {/* Progress Bar Line */}
                        <div className="w-full bg-white/10 rounded-full h-3 mb-2 overflow-hidden">
                            <div 
                                className="bg-[#25D366] h-3 rounded-full transition-all duration-300" 
                                style={{ width: `${sendProgress.total > 0 ? (sendProgress.processed / sendProgress.total) * 100 : 0}%` }}
                            ></div>
                        </div>
                        
                        {/* Percentage Text */}
                        <p className="text-sm font-bold text-[#25D366] mb-6">
                            {Math.round(sendProgress.total > 0 ? (sendProgress.processed / sendProgress.total) * 100 : 0)}%
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {/* Processed Count Box */}
                            <div className="bg-[#25D366]/10 p-3 rounded-xl border border-[#25D366]/20">
                                <p className="text-xs text-[#25D366] font-bold uppercase">Processed</p>
                                <p className="text-lg font-extrabold text-white mt-1">
                                    {sendProgress.processed} / {sendProgress.total}
                                </p>
                            </div>
                            {/* Failed Count Box */}
                            <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                                <p className="text-xs text-red-400 font-bold uppercase">Failed</p>
                                <p className="text-lg font-extrabold text-white mt-1">
                                    {sendProgress.failed}
                                </p>
                            </div>
                        </div>
                        
                        {/* Currently Sending Number Display */}
                        {!sendProgress.done && (
                            <div className="bg-white/[0.03] p-3 rounded-xl text-left border border-white/[0.07] mb-6">
                                <p className="text-xs text-white/40 font-semibold mb-1">
                                    Currently {isScheduling ? "Scheduling" : "Sending"}:
                                </p>
                                <p className="font-mono text-sm font-bold text-white/80 truncate">
                                    {sendProgress.currentNumber || "Initializing..."}
                                </p>
                            </div>
                        )}

                        {/* Failed Numbers List */}
                        {failedList.length > 0 && (
                            <div className="bg-black/20 rounded-xl p-3 border border-white/5 max-h-40 overflow-y-auto mb-6 text-left space-y-2">
                                <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-2">Failure Log</p>
                                {failedList.map((item, idx) => (
                                    <div key={idx} className="text-xs border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
                                        <div className="font-bold text-white flex items-center justify-between">
                                            <span>❌ {item.number}</span>
                                            <span className="text-[10px] text-white/40">{item.time}</span>
                                        </div>
                                        <div className="text-white/50 mt-1">
                                            Reason : <span className="text-red-400/90">{item.reason}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {sendProgress.done ? (
                            <button
                                type="button"
                                onClick={() => setSendProgress(null)}
                                className="w-full py-3 text-sm font-bold text-white rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                                style={{ backgroundColor: "#25D366" }}
                            >
                                Done
                            </button>
                        ) : (
                            <p className="text-xs text-white/30">Please keep this tab open until sending finishes.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}