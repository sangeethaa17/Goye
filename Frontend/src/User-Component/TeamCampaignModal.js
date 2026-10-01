import React, { useState } from 'react';
import { FaUsers, FaCopy, FaWhatsapp, FaTimes, FaCheckCircle, FaExclamationTriangle, FaShareAlt } from 'react-icons/fa';

export default function TeamCampaignModal({ contacts = [], messageText = '', mediaFile = null, onClose, onCampaignCreated }) {
    const getLeaderEmail = () => {
        let em = localStorage.getItem('email') || localStorage.getItem('userEmail');
        if (!em) {
            try {
                const f = JSON.parse(localStorage.getItem('freeUserData') || '{}');
                em = f.email;
            } catch (_) {}
        }
        return (em || 'leader@goye.com').trim().toLowerCase();
    };
    const leaderEmail = getLeaderEmail();
    const [title, setTitle] = useState('Bulk Broadcast Team Campaign');
    const [splitSize, setSplitSize] = useState(100);
    const [includeLeader, setIncludeLeader] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [createdCampaign, setCreatedCampaign] = useState(null);
    const [copied, setCopied] = useState(false);

    const totalContacts = contacts.length;
    const estimatedMembersNeeded = Math.ceil(totalContacts / (splitSize || 100));

    const handleCreate = async () => {
        if (!title.trim()) {
            setErrorMsg('Please enter a campaign title.');
            return;
        }
        if (!contacts || contacts.length === 0) {
            setErrorMsg('No recipient contacts found. Please add contacts or upload a CSV/Excel file.');
            return;
        }

        setIsSubmitting(true);
        setErrorMsg('');

        try {
            // Convert media if exists
            let mediaData = null;
            if (mediaFile) {
                if (mediaFile.data) {
                    // Already converted object { data, mimetype, filename }
                    mediaData = {
                        data: mediaFile.data,
                        mimetype: mediaFile.mimetype || mediaFile.type || 'application/octet-stream',
                        filename: mediaFile.filename || mediaFile.name || 'attachment'
                    };
                } else if (typeof Blob !== "undefined" && mediaFile instanceof Blob) {
                    // Raw File or Blob object
                    const reader = new FileReader();
                    mediaData = await new Promise((resolve) => {
                        reader.onload = (e) => {
                            const base64 = e.target.result.split(',')[1];
                            resolve({
                                data: base64,
                                mimetype: mediaFile.type,
                                filename: mediaFile.name
                            });
                        };
                        reader.readAsDataURL(mediaFile);
                    });
                }
            }

            const response = await fetch('https://goyeorg.onrender.com/api/team-campaign/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    leaderEmail,
                    leaderName: localStorage.getItem('username') || localStorage.getItem('name') || 'Leader',
                    messageTemplate: messageText,
                    media: mediaData,
                    contacts,
                    splitSizePerPerson: Number(splitSize),
                    maxMembers: Math.max(1, Number(estimatedMembersNeeded) || 1),
                    includeLeaderAsSender: includeLeader
                })
            });

            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                const rawText = await response.text();
                throw new Error(`Server returned HTML instead of JSON (${response.status}). Please restart your Node Backend server (Server.js) to load the new Team Campaign API routes.`);
            }

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to create campaign');
            }

            const joinUrl = `${window.location.origin}/join-team?code=${data.joinCode}`;
            const result = {
                ...data.campaign,
                joinUrl,
                joinCode: data.joinCode,
                creditsRequired: data.creditsRequired
            };

            setCreatedCampaign(result);
            if (onCampaignCreated) {
                onCampaignCreated(result);
            }
        } catch (err) {
            setErrorMsg(err.message || 'An error occurred while creating the campaign.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyLink = () => {
        if (createdCampaign && createdCampaign.joinUrl) {
            navigator.clipboard.writeText(createdCampaign.joinUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    };

    const handleShareWhatsApp = () => {
        if (createdCampaign && createdCampaign.joinUrl) {
            const shareText = `👋 Hey Team! You are invited to join our broadcast campaign: "${title}". Click the link to join & start dispatching: ${createdCampaign.joinUrl}`;
            const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
            window.open(waUrl, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-2 sm:p-4 animate-fade-in">
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl sm:rounded-3xl p-5 sm:p-8 w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] text-gray-100 relative max-h-[92vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {/* Decorative background glow */}
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* Header */}
                <div className="flex justify-between items-center mb-6 sm:mb-8 relative z-10">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0">
                            <FaUsers className="text-emerald-400 text-xl sm:text-2xl" />
                        </div>
                        <h2 className="m-0 text-xl sm:text-2xl font-black text-white tracking-tight">Create Team Campaign</h2>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 sm:w-10 sm:h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer border border-white/5 shrink-0">
                        <FaTimes className="text-base sm:text-lg" />
                    </button>
                </div>

                {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl mb-4 sm:mb-6 text-xs sm:text-sm flex items-center gap-2.5 font-medium relative z-10">
                        <FaExclamationTriangle className="text-base sm:text-lg shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {!createdCampaign ? (
                    <div className="relative z-10">
                        {/* Summary Badges */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                            <div className="bg-[#1e293b] border border-[#334155] p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-center shadow-inner hover:bg-[#1e293b]/80 transition-colors">
                                <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 sm:mb-2">Contacts</span>
                                <span className="text-xl sm:text-3xl font-black text-white">{totalContacts}</span>
                            </div>
                            <div className="bg-[#1e293b] border border-[#334155] p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-center shadow-inner hover:bg-[#1e293b]/80 transition-colors">
                                <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 sm:mb-2">Teammates</span>
                                <span className="text-xl sm:text-3xl font-black text-blue-400">{estimatedMembersNeeded}</span>
                            </div>
                        </div>

                        {/* Form Inputs */}
                        <div className="space-y-4 sm:space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 sm:mb-2">Campaign Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Festival Season Promotion"
                                    className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-[#1e293b] border border-[#334155] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white placeholder-gray-500 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 sm:mb-2">Contacts / Person</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={totalContacts}
                                    value={splitSize}
                                    onChange={(e) => setSplitSize(e.target.value)}
                                    className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-[#1e293b] border border-[#334155] rounded-xl sm:rounded-2xl text-sm sm:text-base text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
                                />
                            </div>

                            <div className="pt-1 sm:pt-2">
                                <label className="flex items-center gap-3 cursor-pointer group bg-[#1e293b]/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#334155]/50 hover:bg-[#1e293b] transition-colors">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={includeLeader}
                                            onChange={(e) => setIncludeLeader(e.target.checked)}
                                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 border-gray-500 appearance-none checked:bg-emerald-500 checked:border-emerald-500 transition-colors cursor-pointer"
                                        />
                                        {includeLeader && <FaCheckCircle className="absolute inset-0 text-white m-auto pointer-events-none w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                                    </div>
                                    <span className="text-xs sm:text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                                        Include myself (Leader) as an active sender
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="mt-6 sm:mt-8">
                            <button
                                onClick={handleCreate}
                                disabled={isSubmitting}
                                className="w-full py-3.5 sm:py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-black font-black text-base sm:text-lg rounded-xl sm:rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isSubmitting ? 'Creating Campaign...' : '🚀 Launch Team Campaign'}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Created Success Screen */
                    <div className="text-center py-6 relative z-10 flex flex-col items-center">
                        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)] border border-emerald-500/30 transform hover:scale-110 transition-transform">
                            <FaCheckCircle className="text-emerald-400 text-5xl drop-shadow-lg" />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-3">Campaign Live!</h3>
                        <p className="text-gray-400 text-sm max-w-sm mx-auto mb-8 font-medium leading-relaxed">
                            Share the invite link below with your teammates. Once they join, you can approve them and start the campaign.
                        </p>

                        <div className="bg-[#1e293b] border border-[#334155] p-6 rounded-2xl mb-8 w-full shadow-inner relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest block mb-2">JOIN CODE</span>
                            <span className="text-3xl font-black text-white tracking-widest mb-4 block">{createdCampaign.joinCode}</span>
                            
                            <div className="bg-black/30 p-3 rounded-xl border border-white/5 break-all text-gray-300 text-xs font-mono">
                                {createdCampaign.joinUrl}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center w-full mb-8">
                            <button 
                                onClick={handleCopyLink} 
                                className="flex-1 py-3 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                            >
                                <FaCopy /> {copied ? 'Copied!' : 'Copy Link'}
                            </button>
                            <button 
                                onClick={handleShareWhatsApp} 
                                className="flex-1 py-3 bg-[#25D366] hover:bg-[#20ba5a] text-black font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_5px_15px_rgba(37,211,102,0.3)] text-sm"
                            >
                                <FaWhatsapp className="text-lg" /> Share via WhatsApp
                            </button>
                        </div>

                        <button 
                            onClick={onClose} 
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-base rounded-2xl transition-all shadow-[0_5px_20px_rgba(37,130,246,0.4)] flex items-center justify-center gap-2"
                        >
                            Enter Team Lobby <FaShareAlt />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
