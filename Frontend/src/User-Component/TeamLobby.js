import React, { useState, useEffect } from 'react';
import { FaUsers, FaCheckCircle, FaSpinner, FaTimes, FaPlay, FaUserCheck, FaHourglassHalf, FaExclamationCircle, FaLock, FaCopy, FaWhatsapp } from 'react-icons/fa';

export default function TeamLobby({ campaignId, leaderEmail, onClose }) {
    const [lobbyData, setLobbyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [approvingEmail, setApprovingEmail] = useState('');
    const [rejectingEmail, setRejectingEmail] = useState('');
    const [startingCampaign, setStartingCampaign] = useState(false);
    const [copied, setCopied] = useState(false);
    const [viewingMemberContacts, setViewingMemberContacts] = useState(null);
    const [dismissCelebration, setDismissCelebration] = useState(false);

    const fetchLobby = async () => {
        try {
            const res = await fetch(`https://goyeorg.onrender.com/api/team-campaign/${campaignId}/lobby`);
            const data = await res.json();
            if (res.ok && data.success) {
                setLobbyData(data);
            } else {
                setErrorMsg(data.message || 'Failed to load team lobby.');
            }
        } catch (err) {
            // Silent retry on background polling if data is already present
            console.log('Lobby poll retry...');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLobby();
        // Poll every 3 seconds for real-time member joins & status updates
        const interval = setInterval(fetchLobby, 3000);
        return () => clearInterval(interval);
    }, [campaignId]);

    const handleApproveMember = async (memberEmail) => {
        setApprovingEmail(memberEmail);
        try {
            const res = await fetch('https://goyeorg.onrender.com/api/team-campaign/approve-member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaignId,
                    memberEmail,
                    leaderEmail
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                fetchLobby();
            } else {
                alert(data.message || 'Failed to approve member.');
            }
        } catch (err) {
            alert('Error approving member.');
        } finally {
            setApprovingEmail('');
        }
    };

    const handleRejectMember = async (memberEmail) => {
        if (!window.confirm('Are you sure you want to reject this join request?')) {
            return;
        }
        setRejectingEmail(memberEmail);
        try {
            const res = await fetch('https://goyeorg.onrender.com/api/team-campaign/reject-member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaignId,
                    memberEmail,
                    leaderEmail
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                fetchLobby();
            } else {
                alert(data.message || 'Failed to reject member.');
            }
        } catch (err) {
            alert('Error rejecting member.');
        } finally {
            setRejectingEmail('');
        }
    };

    const handleStartCampaign = async () => {
        if (!lobbyData || !lobbyData.members) return;
        const approvedMembers = lobbyData.members.filter(m => m.status === 'APPROVED' || m.status === 'READY');
        if (approvedMembers.length === 0) {
            alert('At least 1 approved team member is required to start the campaign.');
            return;
        }

        if (!window.confirm(`Are you sure you want to start the campaign dispatches across ${approvedMembers.length} team member(s)?`)) {
            return;
        }

        setStartingCampaign(true);
        try {
            const res = await fetch('https://goyeorg.onrender.com/api/team-campaign/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaignId, leaderEmail })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert('🚀 Team Campaign Started! Message dispatches are active.');
                fetchLobby();
            } else {
                alert(data.message || 'Failed to start campaign.');
            }
        } catch (err) {
            alert('Error starting team campaign.');
        } finally {
            setStartingCampaign(false);
        }
    };

    const handleCopyLink = () => {
        if (lobbyData && lobbyData.campaign) {
            const joinUrl = `${window.location.origin}/join-team?code=${lobbyData.campaign.joinCode}`;
            navigator.clipboard.writeText(joinUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    };

    const handleShareWhatsApp = () => {
        if (lobbyData && lobbyData.campaign) {
            const joinUrl = `${window.location.origin}/join-team?code=${lobbyData.campaign.joinCode}`;
            const shareText = `👋 Join our broadcast campaign: "${lobbyData.campaign.title}". Link: ${joinUrl}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl p-8 w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center">
                    <FaSpinner className="animate-spin text-emerald-500 text-4xl mb-4" />
                    <p className="text-gray-300 font-bold">Loading Team Lobby...</p>
                </div>
            </div>
        );
    }

    const campaign = lobbyData?.campaign;
    const members = lobbyData?.members || [];
    const stats = lobbyData?.stats || {};
    const pendingMembers = members.filter(m => m.status === 'PENDING_APPROVAL' && m.memberEmail !== leaderEmail);
    const activeMembers = members.filter(m => m.status !== 'PENDING_APPROVAL');
    const readyMembers = members.filter(m => m.status === 'READY' || m.status === 'APPROVED');

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in">
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] text-gray-100 relative overflow-hidden flex flex-col max-h-[90vh]">
                {/* Decorative background glow */}
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                {/* Campaign Completed Celebration Popup Overlay */}
                {campaign?.status === 'COMPLETED' && !dismissCelebration && (
                    <div 
                        className="absolute inset-0 bg-[#0b0f19]/90 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDismissCelebration(true);
                        }}
                    >
                        <div 
                            className="bg-[#0f172a] border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(16,185,129,0.25)] relative max-w-md w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Top-Right Dismiss 'X' button */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDismissCelebration(true);
                                }}
                                className="absolute top-4 right-4 w-8 h-8 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer border border-white/5 z-20"
                                title="Close Popup"
                            >
                                <FaTimes className="text-sm" />
                            </button>

                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="relative inline-block mb-4">
                                <div className="absolute inset-0 bg-emerald-500/25 blur-2xl rounded-full"></div>
                                <FaCheckCircle className="text-emerald-400 text-6xl sm:text-7xl relative z-10 drop-shadow-[0_0_25px_rgba(16,185,129,0.7)]" />
                            </div>
                            <h3 className="text-white text-2xl font-black mb-2 tracking-tight">Campaign Successfully Completed!</h3>
                            <p className="text-gray-300 text-xs sm:text-sm max-w-xs mx-auto font-medium mb-6 leading-relaxed">
                                All assigned messages have been successfully dispatched across all active team members via WhatsApp.
                            </p>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDismissCelebration(true);
                                }}
                                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl text-base transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] cursor-pointer flex items-center justify-center gap-2"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Member Recipient Contacts Popup Modal */}
                {viewingMemberContacts && (
                    <div className="absolute inset-0 bg-[#0b0f19]/95 backdrop-blur-md z-[60] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
                        <div className="bg-[#0f172a] border border-[#334155] rounded-2xl sm:rounded-3xl p-5 sm:p-7 w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.7)] text-gray-100 relative overflow-hidden flex flex-col max-h-[85vh]">
                            <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                            {/* Modal Header */}
                            <div className="flex justify-between items-center pb-4 mb-4 border-b border-[#334155] relative z-10">
                                <div>
                                    <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                                        <span>📱 {viewingMemberContacts.memberName}'s Batch</span>
                                        {viewingMemberContacts.memberEmail === leaderEmail && (
                                            <span className="text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/30">Leader</span>
                                        )}
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Recipient contact numbers dispatched by this member
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setViewingMemberContacts(null)}
                                    className="w-8 h-8 sm:w-9 sm:h-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer border border-white/5"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            {/* Recipient Contacts List */}
                            <div className="overflow-y-auto space-y-2 pr-1 custom-scrollbar flex-1 relative z-10">
                                {(() => {
                                    const memberContacts = (lobbyData?.assignedContacts || []).filter(c => 
                                        c.assignedToEmail === viewingMemberContacts.memberEmail
                                    );

                                    if (memberContacts.length === 0) {
                                        return (
                                            <div className="bg-[#1e293b]/60 border border-dashed border-[#334155] p-6 rounded-xl text-center">
                                                <p className="text-sm text-gray-400 font-medium italic">
                                                    No contacts allocated to this member yet.
                                                </p>
                                            </div>
                                        );
                                    }

                                    return memberContacts.map((contact, idx) => (
                                        <div key={idx} className="bg-[#1e293b] border border-[#334155] p-3 sm:p-3.5 rounded-xl flex items-center justify-between shadow-sm hover:border-emerald-500/30 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                                    <FaWhatsapp className="text-base" />
                                                </div>
                                                <span className="font-mono font-bold text-white text-sm sm:text-base tracking-wide">
                                                    {contact.phoneNumber.startsWith('+') ? contact.phoneNumber : `+${contact.phoneNumber}`}
                                                </span>
                                            </div>
                                            <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                                                contact.status === 'SENT' 
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : contact.status === 'FAILED'
                                                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                            }`}>
                                                {contact.status === 'SENT' && <FaCheckCircle className="text-[10px]" />}
                                                {contact.status === 'FAILED' && <FaTimes className="text-[10px]" />}
                                                {contact.status || 'PENDING'}
                                            </span>
                                        </div>
                                    ));
                                })()}
                            </div>

                            {/* Modal Footer */}
                            <div className="pt-4 mt-4 border-t border-[#334155] flex justify-end relative z-10">
                                <button
                                    onClick={() => setViewingMemberContacts(null)}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-6 sm:p-8 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0">
                                <FaUsers className="text-emerald-400 text-2xl" />
                            </div>
                            <div>
                                <h2 className="m-0 text-2xl font-black text-white tracking-tight leading-none mb-1">Team Campaign Lobby</h2>
                                <span className="text-xs font-bold text-gray-400">{campaign?.title} (Code: <span className="text-emerald-400">{campaign?.joinCode}</span>)</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer border border-white/5 shrink-0">
                            <FaTimes className="text-lg" />
                        </button>
                    </div>

                {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-3 font-medium relative z-10">
                        <FaExclamationCircle className="text-lg shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                <div className="relative z-10 space-y-6">
                    {/* Status Bar */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-inner hover:bg-[#1e293b]/80 transition-colors">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Status</span>
                            <span className={`text-base font-black uppercase tracking-wide ${
                                campaign?.status === 'IN_PROGRESS' || campaign?.status === 'COMPLETED' ? 'text-emerald-400' :
                                campaign?.status === 'FAILED' ? 'text-red-400' : 'text-amber-400'
                            }`}>
                                {campaign?.status || 'WAITING'}
                            </span>
                        </div>
                        <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-inner hover:bg-[#1e293b]/80 transition-colors">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Total Contacts</span>
                            <span className="text-3xl font-black text-white">{stats.totalContacts || campaign?.totalContactsCount || 0}</span>
                        </div>
                        <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-inner hover:bg-[#1e293b]/80 transition-colors">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Members Joined</span>
                            <span className="text-3xl font-black text-blue-400">{members.length} <span className="text-lg text-gray-500">/ {campaign?.maxMembers}</span></span>
                        </div>
                    </div>

                    {/* Share Link Strip */}
                    <div className="bg-[#1e293b] border border-[#334155] p-3 rounded-xl flex items-center gap-4 shadow-inner">
                        <span className="text-xs font-bold text-gray-400 ml-2">Invite Link:</span>
                        <button onClick={handleCopyLink} className="flex-1 py-2.5 bg-[#334155] hover:bg-[#475569] text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors text-sm">
                            <FaCopy /> {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button onClick={handleShareWhatsApp} className="flex-1 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-black font-black rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_3px_10px_rgba(37,211,102,0.2)] text-sm">
                            <FaWhatsapp className="text-lg" /> Share
                        </button>
                    </div>

                    {/* Section 1: Pending Approvals */}
                    {pendingMembers.length > 0 && (
                        <div>
                            <h4 className="text-amber-400 font-bold text-sm mb-3 flex items-center gap-2">
                                <FaHourglassHalf /> Pending Approvals ({pendingMembers.length})
                            </h4>
                            <div className="space-y-2">
                                {pendingMembers.map(member => (
                                    <div key={member._id} className="bg-[#1e293b]/50 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between hover:bg-[#1e293b] transition-colors">
                                        <div>
                                            <div className="font-bold text-white text-base">{member.memberName}</div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {member.memberEmail && !member.memberEmail.endsWith('@goyeteam.com') ? `${member.memberEmail} ` : ''}
                                                {member.memberPhone && <span className="text-gray-400">📱 {member.memberPhone}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleApproveMember(member.memberEmail)}
                                                disabled={approvingEmail === member.memberEmail || rejectingEmail === member.memberEmail}
                                                className="py-2 px-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                                            >
                                                <FaUserCheck /> {approvingEmail === member.memberEmail ? 'Approving...' : 'Approve'}
                                            </button>
                                            <button
                                                onClick={() => handleRejectMember(member.memberEmail)}
                                                disabled={approvingEmail === member.memberEmail || rejectingEmail === member.memberEmail}
                                                className="py-2 px-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                                            >
                                                <FaTimes /> {rejectingEmail === member.memberEmail ? 'Rejecting...' : 'Reject'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section 2: Approved / Active Team Members */}
                    <div>
                        <h4 className="text-emerald-400 font-bold text-sm mb-3 flex items-center gap-2">
                            <FaUserCheck /> Approved Team Members ({activeMembers.length})
                        </h4>
                        {activeMembers.length === 0 ? (
                            <div className="bg-[#1e293b] border border-dashed border-[#334155] p-6 rounded-xl text-center">
                                <p className="text-sm text-gray-400 font-medium italic">No members approved yet. Share the invite link to recruit teammates.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {activeMembers.map(member => (
                                    <div 
                                        key={member._id} 
                                        onClick={() => setViewingMemberContacts(member)}
                                        className="bg-[#1e293b] border border-[#334155] hover:border-emerald-500/50 p-4 rounded-xl flex items-center justify-between hover:bg-[#1e293b]/90 transition-all shadow-sm cursor-pointer group"
                                        title="Click to view recipient contacts"
                                    >
                                        <div>
                                            <div className="font-bold text-white text-base flex items-center gap-2 group-hover:text-emerald-400 transition-colors">
                                                {member.memberName} 
                                                {member.memberEmail === leaderEmail && (
                                                    <span className="text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/30">Leader</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {member.memberEmail && !member.memberEmail.endsWith('@goyeteam.com') 
                                                    ? member.memberEmail 
                                                    : (member.memberPhone ? `📱 ${member.memberPhone}` : 'Team Member')}
                                            </div>
                                            <div className="text-[11px] text-emerald-400/80 font-bold group-hover:text-emerald-300 flex items-center gap-1 mt-1.5 transition-colors">
                                                📱 View Recipients →
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${
                                                member.status === 'READY' || member.status === 'APPROVED' || member.status === 'COMPLETED'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : member.status === 'FAILED'
                                                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                        : 'bg-gray-800 text-gray-300 border-gray-700'
                                            }`}>
                                                {member.status}
                                            </span>
                                            <div className="text-[10px] text-gray-400 mt-2 font-medium">
                                                Batch: {member.allocatedCount || campaign?.splitSizePerPerson} contacts
                                                {(typeof member.sentCount === 'number' || typeof member.failedCount === 'number') && (
                                                    <span className={`${member.failedCount > 0 ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
                                                        {' '}(Sent: {member.sentCount || 0} | Failed: {member.failedCount || 0})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Section 3: Failed Numbers Breakdown */}
                    {lobbyData?.failedContacts && lobbyData.failedContacts.length > 0 && (
                        <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-xl">
                            <h4 className="text-red-400 font-bold text-sm mb-3 flex items-center gap-2">
                                <FaExclamationCircle /> Failed Dispatches ({lobbyData.failedContacts.length})
                            </h4>
                            <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                {lobbyData.failedContacts.map((contact, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg border border-white/5">
                                        <span className="text-gray-200 font-bold text-xs flex items-center gap-1.5"><FaWhatsapp className="text-gray-400"/> {contact.phoneNumber}</span>
                                        <span className="text-red-400 text-[10px] max-w-[50%] truncate text-right">
                                            {contact.assignedToEmail ? `(${contact.assignedToEmail.split('@')[0]}) ` : ''}{contact.failureReason || 'Failed'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Master Action: Start Campaign */}
                    <div className="pt-6 mt-6 border-t border-[#334155] text-center">
                        {campaign?.status === 'COMPLETED' ? (
                            <div className="space-y-3">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl font-bold flex items-center justify-center gap-2.5">
                                    <FaCheckCircle className="text-xl" /> Campaign Completed! All team messages dispatched.
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-bold rounded-xl text-sm transition-all border border-gray-700 cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <FaTimes /> Close Lobby
                                </button>
                            </div>
                        ) : campaign?.status === 'IN_PROGRESS' ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl font-bold flex items-center justify-center gap-3">
                                <FaCheckCircle className="text-xl" /> Campaign Active! Dispatches in Progress across Team.
                            </div>
                        ) : (
                            <div>
                                {readyMembers.length === 0 ? (
                                    <div className="text-xs text-amber-400/80 mb-4 font-medium flex justify-center items-center gap-2">
                                        <FaHourglassHalf className="animate-pulse" /> Waiting for approved members to connect WhatsApp...
                                    </div>
                                ) : readyMembers.length < (campaign?.maxMembers || 1) ? (
                                    <div className="text-xs text-amber-400/80 mb-4 font-medium flex justify-center items-center gap-2">
                                        <FaHourglassHalf className="animate-pulse" /> Waiting for remaining team members to connect WhatsApp ({readyMembers.length}/{campaign?.maxMembers || 1} Ready)
                                    </div>
                                ) : null}

                                <button
                                    onClick={handleStartCampaign}
                                    disabled={startingCampaign || readyMembers.length === 0}
                                    className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all ${
                                        readyMembers.length === 0 
                                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' 
                                        : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] cursor-pointer'
                                    }`}
                                >
                                    <FaPlay className={startingCampaign ? 'animate-pulse' : ''} /> 
                                    {startingCampaign ? 'Launching Dispatches...' : '🚀 Start All Team Dispatches'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
}
