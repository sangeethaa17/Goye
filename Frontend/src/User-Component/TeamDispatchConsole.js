import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import QRCode from 'react-qr-code';
import { FaWhatsapp, FaCheckCircle, FaSpinner, FaLock, FaPaperPlane, FaHourglassHalf, FaSignal, FaTimes } from 'react-icons/fa';

const socket = io("https://goyeorg.onrender.com", {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ["websocket", "polling"]
});

export default function TeamDispatchConsole({ memberInfo, campaignInfo }) {
    const [qrCode, setQrCode] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [connectedUser, setConnectedUser] = useState(null);
    const [memberStatus, setMemberStatus] = useState(memberInfo?.status || 'APPROVED');
    const [progress, setProgress] = useState({ total: 0, sent: 0, failed: 0, status: 'idle' });
    const [showMyContacts, setShowMyContacts] = useState(false);
    const [myContactsList, setMyContactsList] = useState([]);
    const [loadingMyContacts, setLoadingMyContacts] = useState(false);

    const fetchMyContacts = async () => {
        const email = memberInfo?.memberEmail || localStorage.getItem("email");
        const campaignId = memberInfo?.campaignId || campaignInfo?.campaignId;
        if (!campaignId || !email) return;

        setLoadingMyContacts(true);
        setShowMyContacts(true);
        try {
            const res = await fetch(`https://goyeorg.onrender.com/api/team-campaign/${campaignId}/my-contacts?email=${encodeURIComponent(email)}`);
            const data = await res.json();
            if (res.ok && data.success) {
                setMyContactsList(data.contacts || []);
            }
        } catch (e) {
            console.error('Error fetching contacts:', e);
        } finally {
            setLoadingMyContacts(false);
        }
    };

    useEffect(() => {
        const email = memberInfo?.memberEmail || localStorage.getItem("email");
        if (!email) return;

        const handleQr = (qr) => {
            setQrCode(qr);
            setIsConnected(false);
        };

        const handleReady = (data) => {
            setQrCode("");
            setIsConnected(true);
            setConnectedUser(data?.user || null);
            setMemberStatus('READY');
            fetch('https://goyeorg.onrender.com/api/team-campaign/member-ready', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaignId: memberInfo.campaignId,
                    memberEmail: email,
                    memberPhone: data?.user?.id || ''
                })
            }).catch(console.error);
        };

        const handleLogout = () => {
            setIsConnected(false);
            setQrCode("");
            setConnectedUser(null);
            setMemberStatus('APPROVED');
        };

        const handleProgress = (data) => {
            if (data.memberEmail === email) {
                setProgress({
                    total: data.total,
                    sent: data.sent,
                    failed: data.failed,
                    status: data.status
                });
                if (data.status === 'COMPLETED') setMemberStatus('COMPLETED');
            }
        };

        socket.on("qr", handleQr);
        socket.on("ready", handleReady);
        socket.on("logout", handleLogout);
        socket.on("team_progress_update", handleProgress);

        socket.emit("register_email", email);
        socket.emit("check_status");

        const interval = setInterval(() => {
            if (memberInfo?.campaignId) {
                fetch(`https://goyeorg.onrender.com/api/team-campaign/${memberInfo.campaignId}/lobby`)
                    .then(r => r.json())
                    .then(data => {
                        if (data.success && data.members) {
                            const current = data.members.find(m => m.memberEmail === email);
                            if (current) {
                                setMemberStatus(current.status);
                                if (current.allocatedCount > 0) {
                                    setProgress(prev => ({ ...prev, total: current.allocatedCount, sent: current.sentCount, failed: current.failedCount }));
                                }
                            }
                        }
                    })
                    .catch(() => {});
            }
        }, 2500);

        return () => {
            clearInterval(interval);
            socket.off("qr", handleQr);
            socket.off("ready", handleReady);
            socket.off("logout", handleLogout);
            socket.off("team_progress_update", handleProgress);
        };
    }, [memberInfo]);

    const percentage = progress.total > 0 ? Math.round((progress.sent / progress.total) * 100) : 0;

    return (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-2xl w-full mx-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
            {/* Decorative background glow */}
            <div className="absolute -top-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
                {/* Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 sm:pb-5 mb-4 sm:mb-5 border-b border-[#1e293b] gap-2.5 sm:gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center justify-center shrink-0">
                            <FaWhatsapp className="text-[#25D366] text-xl sm:text-2xl" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="m-0 text-white text-base sm:text-xl font-black truncate">Team Member Dispatch Console</h3>
                            <span className="text-xs sm:text-sm text-gray-400 font-medium truncate block">{campaignInfo?.title || 'Team Bulk Campaign'}</span>
                        </div>
                    </div>
                    <div className={`self-start sm:self-auto flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border text-[11px] sm:text-xs font-black tracking-wide shrink-0 ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                        <FaSignal className={isConnected ? 'animate-pulse' : ''} />
                        <span>{isConnected ? 'ONLINE' : 'CONNECTING'}</span>
                    </div>
                </div>

                {/* Compact Status Grid */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-[#1e293b]/50 border border-[#334155] rounded-xl p-2.5 sm:p-4 flex flex-col gap-0.5 sm:gap-1 text-left shadow-inner">
                        <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider">WhatsApp Session</span>
                        <span className={`text-xs sm:text-base font-black truncate ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {isConnected ? '✅ Connected' : '⏳ Action Needed'}
                        </span>
                    </div>
                    <div className="bg-[#1e293b]/50 border border-[#334155] rounded-xl p-2.5 sm:p-4 flex flex-col gap-0.5 sm:gap-1 text-left shadow-inner">
                        <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider">Linked Number</span>
                        <span className="text-xs sm:text-base font-black text-white whitespace-nowrap overflow-hidden text-ellipsis">
                            {connectedUser?.id || connectedUser?.name || (isConnected ? 'Verified' : 'Not Linked')}
                        </span>
                    </div>
                </div>

                {/* Main Interactive Area */}
                <div className="bg-[#1e293b]/80 border border-[#334155] rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-lg">
                    {/* State 1: QR Code Scan Needed */}
                    {!isConnected && (
                        <div className="text-center py-2">
                            <p className="text-gray-300 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                                Scan QR code using WhatsApp (Linked Devices) to connect.
                            </p>
                            <div className="bg-white p-3 sm:p-4 rounded-xl inline-block shadow-md max-w-full">
                                {qrCode ? (
                                    <QRCode value={qrCode} size={170} className="w-36 h-36 sm:w-48 sm:h-48" bgColor="#ffffff" fgColor="#000000" />
                                ) : (
                                    <div className="flex flex-col items-center gap-3 py-8 w-[170px]">
                                        <FaSpinner className="animate-spin text-emerald-500 text-3xl sm:text-4xl" />
                                        <span className="text-xs sm:text-sm text-gray-400 font-medium">Generating QR Code...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* State 2: Connected & Waiting for Leader */}
                    {isConnected && (memberStatus === 'APPROVED' || memberStatus === 'READY') && (
                        <div className="flex flex-col items-center text-center py-4 sm:py-6">
                            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20 mb-3 sm:mb-4 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                                <FaHourglassHalf className="text-amber-500 text-2xl sm:text-4xl animate-pulse" />
                            </div>
                            <div className="text-white text-lg sm:text-xl font-black mb-1">Ready & Waiting for Leader</div>
                            <div className="text-gray-400 text-xs sm:text-sm max-w-xs">Your batch will assign automatically when Leader clicks "Start All".</div>
                        </div>
                    )}

                    {/* State 3: Active Dispatching */}
                    {isConnected && memberStatus === 'SENDING' && (
                        <div className="text-center py-4 sm:py-6">
                            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                <FaPaperPlane className="animate-bounce text-emerald-500 text-xl sm:text-2xl" />
                                <span className="text-white text-base sm:text-xl font-black">Dispatching Assigned Batch...</span>
                            </div>

                            {/* Sleek Progress Bar */}
                            <div className="w-full bg-[#0f172a] h-3 sm:h-4 rounded-full overflow-hidden mt-3 sm:mt-4 border border-[#334155] shadow-inner">
                                <div className="bg-emerald-500 h-full rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] relative overflow-hidden" style={{ width: `${percentage}%` }}>
                                    <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-xs sm:text-sm mt-2.5 sm:mt-3 text-emerald-400 font-black tracking-wide">
                                <span>Progress: {progress.sent} / {progress.total} Sent</span>
                                <span className="text-base sm:text-lg">{percentage}%</span>
                            </div>
                        </div>
                    )}

                    {/* State 4: Completed */}
                    {memberStatus === 'COMPLETED' && (
                        <div className="text-center py-4 sm:py-6">
                            <div className="relative inline-block mb-3 sm:mb-4">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
                                <FaCheckCircle className="text-emerald-500 text-5xl sm:text-6xl relative z-10 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
                            </div>
                            <h4 className="text-white text-xl sm:text-2xl font-black mb-1 sm:mb-2">Campaign Batch Complete!</h4>
                            <p className="text-gray-400 text-xs sm:text-sm max-w-sm mx-auto font-medium mb-4">
                                All assigned messages successfully dispatched via your WhatsApp session.
                            </p>
                            <button
                                onClick={fetchMyContacts}
                                className="px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center gap-2 shadow-sm"
                            >
                                📱 View My Dispatched Numbers
                            </button>
                        </div>
                    )}
                </div>

                {/* Member My Contacts Popup Modal */}
                {showMyContacts && (
                    <div className="absolute inset-0 bg-[#0b0f19]/95 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
                        <div className="bg-[#0f172a] border border-[#334155] rounded-2xl sm:rounded-3xl p-5 sm:p-7 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.7)] text-gray-100 relative overflow-hidden flex flex-col max-h-[85vh]">
                            <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                            {/* Header */}
                            <div className="flex justify-between items-center pb-3 mb-4 border-b border-[#334155] relative z-10">
                                <div>
                                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                                        📱 My Dispatched Numbers
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Numbers you personally sent messages to ({myContactsList.length})
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setShowMyContacts(false)}
                                    className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer border border-white/5"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            {/* List */}
                            <div className="overflow-y-auto space-y-2 pr-1 custom-scrollbar flex-1 relative z-10">
                                {loadingMyContacts ? (
                                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                                        <FaSpinner className="animate-spin text-emerald-400 text-2xl" />
                                        <span className="text-xs text-gray-400">Loading your contacts...</span>
                                    </div>
                                ) : myContactsList.length === 0 ? (
                                    <div className="bg-[#1e293b]/60 border border-dashed border-[#334155] p-6 rounded-xl text-center">
                                        <p className="text-xs text-gray-400 font-medium italic">
                                            No dispatched numbers found in your session.
                                        </p>
                                    </div>
                                ) : (
                                    myContactsList.map((c, i) => (
                                        <div key={i} className="bg-[#1e293b] border border-[#334155] p-3 rounded-xl flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                                    <FaWhatsapp className="text-sm" />
                                                </div>
                                                <span className="font-mono font-bold text-white text-xs sm:text-sm">
                                                    {c.phoneNumber.startsWith('+') ? c.phoneNumber : `+${c.phoneNumber}`}
                                                </span>
                                            </div>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                                c.status === 'SENT'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                                {c.status === 'SENT' ? <FaCheckCircle className="text-[9px]" /> : <FaTimes className="text-[9px]" />}
                                                {c.status}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            <div className="pt-3 mt-4 border-t border-[#334155] flex justify-end relative z-10">
                                <button
                                    onClick={() => setShowMyContacts(false)}
                                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-gray-500 font-bold bg-[#1e293b]/30 py-2.5 sm:py-3 px-2 rounded-xl border border-[#334155]/50 text-center">
                    <FaLock className="text-emerald-500/70 shrink-0" /> Restricted Workspace • Leader Credits Active
                </div>
            </div>
        </div>
    );
}
