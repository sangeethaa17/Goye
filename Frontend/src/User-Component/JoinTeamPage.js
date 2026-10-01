import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaUsers, FaCheckCircle, FaHourglassHalf, FaExclamationTriangle, FaLock, FaWhatsapp } from 'react-icons/fa';
import TeamDispatchConsole from './TeamDispatchConsole';

export default function JoinTeamPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const joinCode = queryParams.get('code');

    const [loading, setLoading] = useState(true);
    const [campaignInfo, setCampaignInfo] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    
    // Member form inputs
    const [memberName, setMemberName] = useState('');
    const [memberPhone, setMemberPhone] = useState('');
    const [joining, setJoining] = useState(false);
    const [joinedMember, setJoinedMember] = useState(null);

    useEffect(() => {
        if (!joinCode) {
            setErrorMsg('Invalid link. No campaign join code provided.');
            setLoading(false);
            return;
        }

        fetch(`https://goyeorg.onrender.com/api/team-campaign/join-info/${joinCode}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setCampaignInfo(data);
                } else {
                    setErrorMsg(data.message || 'Unable to fetch campaign details.');
                }
            })
            .catch(err => {
                setErrorMsg('Error connecting to Goye server.');
            })
            .finally(() => setLoading(false));
    }, [joinCode]);

    useEffect(() => {
        if (!joinedMember || joinedMember.status !== 'PENDING_APPROVAL') return;

        const checkApproval = async () => {
            try {
                const res = await fetch(`https://goyeorg.onrender.com/api/team-campaign/${joinedMember.campaignId}/lobby`);
                const data = await res.json();
                if (res.ok && data.success && data.members) {
                    const current = data.members.find(m => m.memberEmail === joinedMember.memberEmail || m.memberPhone === joinedMember.memberPhone);
                    if (current && current.status !== 'PENDING_APPROVAL') {
                        setJoinedMember(current);
                    }
                }
            } catch (err) {}
        };

        const interval = setInterval(checkApproval, 2000);
        return () => clearInterval(interval);
    }, [joinedMember]);

    const handleJoinSubmit = async (e) => {
        e.preventDefault();
        if (!memberPhone.trim() || !memberName.trim()) {
            alert('Please enter your name and mobile number.');
            return;
        }

        setJoining(true);
        try {
            const cleanPhone = memberPhone.replace(/\D/g, '');
            const effectiveEmail = `${cleanPhone}@goyeteam.com`;

            const res = await fetch('https://goyeorg.onrender.com/api/team-campaign/join-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    joinCode,
                    memberEmail: effectiveEmail,
                    memberName: memberName.trim(),
                    memberPhone: memberPhone.trim()
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setJoinedMember(data.member);
            } else {
                alert(data.message || 'Failed to join team.');
            }
        } catch (err) {
            alert('Error joining team campaign.');
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-80px)] bg-[#0b0f19] flex items-center justify-center p-3 sm:p-6 py-6 sm:py-10">
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl sm:rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute -top-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <FaHourglassHalf className="animate-spin text-emerald-500 text-4xl mb-4 relative z-10" />
                    <p className="text-gray-300 font-bold text-center text-sm sm:text-base relative z-10">Loading Campaign Invitation...</p>
                </div>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="min-h-[calc(100vh-80px)] bg-[#0b0f19] flex items-center justify-center p-3 sm:p-6 py-6 sm:py-10">
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl sm:rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center relative overflow-hidden">
                    <div className="absolute -top-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <FaExclamationTriangle className="text-red-500 text-4xl sm:text-5xl mb-4 mx-auto relative z-10" />
                    <h2 className="text-white text-xl sm:text-2xl font-black mb-2 relative z-10">Invitation Error</h2>
                    <p className="text-gray-400 text-xs sm:text-sm mb-6 relative z-10">{errorMsg}</p>
                    <button onClick={() => navigate('/')} className="w-full py-3 sm:py-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold rounded-xl transition-colors relative z-10 cursor-pointer text-sm">
                        Go to Goye Home
                    </button>
                </div>
            </div>
        );
    }

    // Direct render TeamDispatchConsole when member is approved
    if (joinedMember && joinedMember.status !== 'PENDING_APPROVAL') {
        return (
            <div className="min-h-[calc(100vh-80px)] bg-[#0b0f19] flex items-center justify-center p-2.5 sm:p-6 py-6 sm:py-10">
                <TeamDispatchConsole memberInfo={joinedMember} campaignInfo={campaignInfo} />
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[#0b0f19] flex items-center justify-center p-2.5 sm:p-6 py-6 sm:py-10">
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl sm:rounded-3xl p-4 sm:p-8 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden animate-fade-in">
                {/* Decorative background glow */}
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex flex-col items-center justify-center gap-3 mb-6 text-center">
                        <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                            <FaUsers className="text-emerald-400 text-3xl" />
                        </div>
                        <h2 className="m-0 text-2xl font-black text-white tracking-tight">Goye Team Invitation</h2>
                    </div>

                    {!joinedMember ? (
                        <div>
                            {campaignInfo && (
                                <div className="bg-[#1e293b]/50 border border-[#334155] p-5 rounded-2xl mb-6 shadow-inner relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
                                    <h3 className="m-0 mb-1 text-emerald-400 text-lg font-black relative z-10">{campaignInfo.title}</h3>
                                    <p className="m-0 mb-4 text-xs text-gray-400 relative z-10">
                                        Invited by: <strong className="text-gray-200">{campaignInfo.leaderName || 'Team Leader'}</strong>
                                    </p>
                                    <div className="flex justify-between items-center text-[11px] font-bold text-gray-500 pt-3 border-t border-[#334155] relative z-10 uppercase tracking-wider">
                                        <span>Total Contacts: <strong className="text-white text-xs">{campaignInfo.totalContactsCount}</strong></span>
                                        <span>Split Chunk: <strong className="text-white text-xs">{campaignInfo.splitSizePerPerson}/person</strong></span>
                                    </div>
                                </div>
                            )}

                            {!campaignInfo?.isCapacityFull && (
                                <form onSubmit={handleJoinSubmit} className="flex flex-col gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Your Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={memberName}
                                            onChange={(e) => setMemberName(e.target.value)}
                                            placeholder="Enter your name"
                                            className="w-full bg-[#1e293b]/50 border border-[#334155] focus:border-emerald-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors shadow-inner"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Your Mobile Number</label>
                                        <input
                                            type="tel"
                                            required
                                            value={memberPhone}
                                            onChange={(e) => setMemberPhone(e.target.value)}
                                            placeholder="Enter your mobile number"
                                            className="w-full bg-[#1e293b]/50 border border-[#334155] focus:border-emerald-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors shadow-inner"
                                        />
                                    </div>


                                    <button 
                                        type="submit" 
                                        disabled={joining} 
                                        className={`w-full py-4 mt-2 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all ${
                                            joining 
                                            ? 'bg-emerald-500/50 text-black cursor-not-allowed' 
                                            : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] cursor-pointer'
                                        }`}
                                    >
                                        {joining ? (
                                            <><FaHourglassHalf className="animate-spin" /> Joining Team...</>
                                        ) : (
                                            <>🤝 Accept & Join Team</>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20 mx-auto mb-5 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                                <FaHourglassHalf className="text-amber-500 text-4xl animate-pulse" />
                            </div>
                            <h3 className="text-white text-xl font-black mb-2">Waiting for Approval</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                You have successfully requested to join <strong className="text-gray-200">{campaignInfo.title}</strong>.<br />
                                Please inform the Campaign Leader to approve your access.
                            </p>

                            <div className="bg-[#1e293b]/80 border border-[#334155] p-3 rounded-xl text-xs font-medium text-gray-400 flex items-center justify-center gap-2 shadow-inner">
                                <FaLock className="text-gray-500" /> Leader-only credit system enabled.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
