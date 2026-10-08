import React, { useState, useEffect } from "react";
import {
  Search, Check, X, Eye, Clock,
  IndianRupee, Crown, Zap, Building2, Smartphone, ChevronLeft, ChevronRight,
  FileText, ShieldCheck, Mail, Calendar, CreditCard, Phone, Image, ZoomIn
} from "lucide-react";

const getPlanMeta = (planName = '') => {
  const lower = (planName || '').toLowerCase();
  if (lower.includes('one day') || lower.includes('1 day') || lower === 'oneday' || lower === 'day') {
    return { label: 'One Day', color: "#34d399", bg: "#ecfdf5", icon: Zap, price: 49 };
  } else if (lower.includes('one week') || lower.includes('1 week') || lower.includes('week')) {
    return { label: 'One Week', color: "#38bdf8", bg: "#f0f9ff", icon: Zap, price: 249 };
  } else if (lower.includes('15') || lower.includes('fifteen')) {
    return { label: '15 Days', color: "#fb923c", bg: "#fff7ed", icon: Zap, price: 499 };
  } else if (lower.includes('3 month') || lower.includes('three')) {
    return { label: 'Three Months', color: "#06b6d4", bg: "#ecfeff", icon: Crown, price: 1999 };
  } else if (lower.includes('6 month') || lower.includes('six')) {
    return { label: 'Six Months', color: "#a855f7", bg: "#faf5ff", icon: Crown, price: 3499 };
  } else if (lower.includes('18 month') || lower.includes('eighteen')) {
    return { label: '18 Months', color: "#f43f5e", bg: "#fff1f2", icon: Crown, price: 7299 };
  } else if (lower.includes('year') || lower.includes('1 yr')) {
    return { label: 'One Year', color: "#f59e0b", bg: "#fffbeb", icon: Crown, price: 5999 };
  } else if (lower.includes('month')) {
    return { label: 'One Month', color: "#10b981", bg: "#ecfdf5", icon: Building2, price: 799 };
  } else if (lower.includes('silver')) {
    return { label: 'Silver', color: "#71717a", bg: "#f4f4f5", icon: Zap, price: 299 };
  } else if (lower.includes('gold')) {
    return { label: 'Gold', color: "#d97706", bg: "#fef3c7", icon: Building2, price: 599 };
  } else if (lower.includes('demo')) {
    return { label: 'Demo Access', color: "#00F5D4", bg: "#ecfdf5", icon: Zap, price: 0 };
  } else {
    return { label: planName || 'Custom Plan', color: "#34d399", bg: "#ecfdf5", icon: Crown, price: 49 };
  }
};

const filters = ["All", "Pending", "Approved", "Rejected"];

export default function SubscriptionRequests() {
  const [filter, setFilter] = useState("Pending");
  const [requests, setRequests] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null); // For Eye Icon Modal
  const [confirmAction, setConfirmAction] = useState(null); // For Approve/Reject Confirmation Modal
  const [previewImage, setPreviewImage] = useState(null); // For full-screen screenshot preview modal

  const fetchRequests = async () => {
    try {
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://goye.onrender.com';
      const response = await fetch(`${apiBaseUrl}/api/subscription-requests`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRequests(data.requests || []);
        }
      }
    } catch (err) {
      console.error("Error fetching subscription requests:", err);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 2000);
    const handleFocus = () => fetchRequests();
    const handleSync = () => fetchRequests();
    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleSync);
    window.addEventListener("gy:subscription-request-created", handleSync);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("gy:subscription-request-created", handleSync);
    };
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://goye.onrender.com';
      const response = await fetch(`${apiBaseUrl}/api/subscription-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRequests((prev) => prev.map((r) => r._id === id ? { ...r, status } : r));
          if (selectedRequest && selectedRequest._id === id) {
            setSelectedRequest({ ...selectedRequest, status });
          }
        }
      } else {
        alert("Failed to update status.");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Connection error.");
    }
  };

  // Create sequential IDs based on all requests ordered chronologically
  const sortedByCreatedAtAsc = [...requests].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  const seqIdMap = {};
  sortedByCreatedAtAsc.forEach((req, index) => {
      if (req._id) {
          seqIdMap[req._id] = `REQ-${String(index + 1).padStart(3, '0')}`;
      }
  });

  const filtered = requests
    .filter((r) => {
      const matchesFilter = filter === "All" || r.status === filter.toLowerCase();
      const matchesQuery = 
        (r.name || "").toLowerCase().includes(query.toLowerCase()) || 
        (r.email || "").toLowerCase().includes(query.toLowerCase()) || 
        (r.plan || "").toLowerCase().includes(query.toLowerCase()) ||
        (r.upiId || "").toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    })
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const counts = {
    All: requests.length,
    Pending: requests.filter((r) => r.status === "pending").length,
    Approved: requests.filter((r) => r.status === "approved").length,
    Rejected: requests.filter((r) => r.status === "rejected").length,
  };

  // Dynamically compute KPIs from the requests array
  const totalRevenue = requests
    .filter(r => r.status === "approved")
    .reduce((sum, r) => sum + getPlanMeta(r.plan).price, 0);

  const isToday = (dateString) => {
    const d = new Date(dateString);
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const approvedTodayCount = requests.filter(r => r.status === "approved" && isToday(r.createdAt)).length;

  const dynamicKpis = [
    { label: "Total Requests", value: requests.length.toString(), icon: FileText, color: "#10B981", bg: "#e6f7ef" },
    { label: "Pending Approval", value: counts.Pending.toString(), icon: Clock, color: "#f59e0b", bg: "#fffbeb" },
    { label: "Approved Today", value: approvedTodayCount.toString(), icon: ShieldCheck, color: "#3b82f6", bg: "#eff6ff" },
    { label: "Revenue (MTD)", value: `₹${totalRevenue.toLocaleString()}`, icon: IndianRupee, color: "#059669", bg: "#d1fae5" },
  ];

  return (
    <div className="min-h-screen bg-[#f4fcf7] font-sans text-gray-800 relative overflow-hidden admin-main-content">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        
        .slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        .dash-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid rgba(16, 185, 129, 0.15);
          box-shadow: 0 4px 24px -10px rgba(16, 185, 129, 0.1);
          transition: all 0.3s ease;
        }
        .dash-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px -12px rgba(16, 185, 129, 0.25);
          border-color: rgba(16, 185, 129, 0.4);
        }
        
        .modal-overlay {
          background: rgba(6, 78, 59, 0.4);
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease-out;
        }
        .modal-content {
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>

      {/* Header */}
      <header className="w-full pl-16 pr-4 md:px-8 py-4 bg-white/80 backdrop-blur-md border-b border-[#a7f3d0]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#047857] flex items-center justify-center shadow-lg shadow-[#10B981]/30">
              <FileText className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#064e3b]">Subscription Requests</h1>
              <p className="text-xs text-[#059669] font-medium">Manage and review user upgrades</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <a href="/messages" className="text-xs font-bold text-[#059669] hover:underline">← Go Back to App</a>
          </div>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 slide-up" style={{ animationDelay: '0.1s' }}>
          {dynamicKpis.map((kpi, i) => (
            <div key={i} className="dash-card p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: kpi.bg, color: kpi.color }}>
                <kpi.icon size={28} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-[#064e3b] mt-1">{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Requests Table Card */}
        <div className="dash-card slide-up overflow-hidden" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 p-3.5 sm:p-6 border-b border-[#e6f7ef]">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-[#f4fcf7] border border-[#a7f3d0] rounded-xl p-1 overflow-x-auto max-w-full [scrollbar-width:none]">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
                    filter === f ? "bg-[#10B981] text-white shadow-md" : "text-gray-500 hover:text-[#064e3b]"
                  }`}
                >
                  {f}
                  <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${filter === f ? "bg-white/20" : "bg-[#d1fae5] text-[#10B981]"}`}>
                    {counts[f]}
                  </span>
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 bg-[#f4fcf7] border border-[#a7f3d0] focus-within:border-[#10B981] rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 w-full sm:w-72 transition-colors">
              <Search size={16} className="text-[#059669] shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search requests..."
                className="bg-transparent text-xs sm:text-sm font-medium text-[#064e3b] outline-none w-full placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto [scrollbar-width:none]">
            <table className="w-full text-left border-collapse min-w-[680px] sm:min-w-full">
              <thead>
                <tr className="bg-[#f4fcf7] text-gray-500 text-sm font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Request ID</th>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Plan & Amount</th>
                  <th className="px-6 py-4">UPI ID</th>
                  <th className="px-6 py-4">Screenshot</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6f7ef]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      No {filter.toLowerCase()} requests match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, i) => {
                    const planMeta = getPlanMeta(r.plan);
                    const reqId = r._id && seqIdMap[r._id] ? seqIdMap[r._id] : 'REQ-NEW';
                    const requestDate = r.createdAt 
                      ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'N/A';
                    const requestTime = r.createdAt 
                      ? new Date(r.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                      : '';

                    return (
                      <tr key={r._id} className="hover:bg-[#fcfdfd] transition-colors group">
                        <td className="px-6 py-4 text-sm font-bold text-[#10B981]">{reqId}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#10B981] to-[#6ee7b7] flex items-center justify-center text-white font-bold shadow-sm">
                              {(r.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-[#064e3b]">{r.name}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Mail size={12}/> {r.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: planMeta.bg, color: planMeta.color }}>
                              <planMeta.icon size={10} /> {r.plan}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-[#064e3b]">₹{planMeta.price}</p>
                        </td>

                        {/* UPI ID Column */}
                        <td className="px-6 py-4">
                          {r.upiId ? (
                            <div className="flex items-center gap-1.5 bg-[#f4fcf7] border border-[#a7f3d0] px-2.5 py-1 rounded-lg w-fit">
                              <CreditCard size={13} className="text-[#059669]" />
                              <span className="text-xs font-bold text-[#064e3b] font-mono">{r.upiId}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium italic">N/A</span>
                          )}
                        </td>

                        {/* Payment Screenshot Thumbnail Column */}
                        <td className="px-6 py-4">
                          {r.screenshot ? (
                            <button 
                              onClick={() => setPreviewImage(r.screenshot)}
                              className="relative group/thumb block rounded-xl overflow-hidden border border-[#a7f3d0] hover:border-[#10B981] shadow-sm transition-all focus:outline-none cursor-pointer"
                              title="Click to view full screenshot"
                            >
                              <img 
                                src={r.screenshot} 
                                alt="Payment proof" 
                                className="w-12 h-12 object-cover rounded-xl group-hover/thumb:scale-105 transition-transform" 
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="hidden w-12 h-12 bg-gray-100 rounded-xl items-center justify-center text-gray-400 text-[10px] font-bold">
                                Invalid
                              </div>
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity">
                                <ZoomIn size={15} />
                              </div>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium italic flex items-center gap-1">
                              <Image size={12} className="text-gray-300" /> No image
                            </span>
                          )}
                        </td>

                        {/* Status Column */}
                        <td className="px-6 py-4">
                          <StatusBadge status={r.status} />
                          <p className="text-xs text-gray-400 mt-1">{requestDate} {requestTime && `• ${requestTime}`}</p>
                        </td>

                        {/* Actions Column */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setSelectedRequest(r)}
                              className="p-2 rounded-lg bg-[#f4fcf7] text-[#059669] hover:bg-[#10B981] hover:text-white transition-colors tooltip-trigger"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                            {r.status === "pending" && (
                              <>
                                <button
                                  onClick={() => setConfirmAction({ id: r._id, status: "approved" })}
                                  className="p-2 rounded-lg bg-[#e6f7ef] text-[#10B981] hover:bg-[#10B981] hover:text-white transition-colors"
                                  title="Approve"
                                >
                                  <Check size={18} />
                                </button>
                                <button
                                  onClick={() => setConfirmAction({ id: r._id, status: "rejected" })}
                                  className="p-2 rounded-lg bg-[#fef2f2] text-[#ef4444] hover:bg-[#ef4444] hover:text-white transition-colors"
                                  title="Reject"
                                >
                                  <X size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between px-6 py-4 bg-[#f4fcf7] border-t border-[#e6f7ef]">
            <span className="text-sm text-gray-500 font-medium">Showing {filtered.length} requests</span>
            <div className="flex gap-1">
              <button className="p-1.5 rounded-lg hover:bg-[#e6f7ef] text-[#059669] transition"><ChevronLeft size={18}/></button>
              <button className="p-1.5 rounded-lg hover:bg-[#e6f7ef] text-[#059669] transition"><ChevronRight size={18}/></button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal for Request Details */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 modal-overlay" onClick={() => setSelectedRequest(null)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden modal-content flex flex-col z-10 text-left max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-8 py-6 bg-gradient-to-br from-[#10B981] to-[#047857] text-white flex items-center justify-between relative overflow-hidden shrink-0">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white opacity-10 rounded-full blur-xl"></div>
              <div>
                <h3 className="text-2xl font-bold">Request Details</h3>
                <p className="text-sm text-[#a7f3d0] font-medium mt-1">
                  {selectedRequest._id && seqIdMap[selectedRequest._id] ? seqIdMap[selectedRequest._id] : 'REQ-NEW'}
                </p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors relative z-10 text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6 overflow-y-auto">
              
              {/* User Info & Plan Info */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#6ee7b7] flex items-center justify-center text-white text-xl font-bold shadow-md">
                    {(selectedRequest.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-[#064e3b]">{selectedRequest.name}</h4>
                    <div className="flex flex-col gap-1 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5"><Mail size={14}/> {selectedRequest.email}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={selectedRequest.status} />
                </div>
              </div>

              <div className="h-px w-full bg-gray-100"></div>

              {/* Transaction Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#f4fcf7] p-4 rounded-2xl border border-[#e6f7ef]">
                  <p className="text-xs text-gray-500 font-medium mb-1">Selected Plan</p>
                  <p className="font-bold text-[#064e3b] text-base flex items-center gap-1.5">
                    {React.createElement(getPlanMeta(selectedRequest.plan).icon, { size: 16, color: getPlanMeta(selectedRequest.plan).color })} 
                    {selectedRequest.plan}
                  </p>
                </div>
                <div className="bg-[#f4fcf7] p-4 rounded-2xl border border-[#e6f7ef]">
                  <p className="text-xs text-gray-500 font-medium mb-1">Plan Price</p>
                  <p className="font-bold text-[#064e3b] text-lg">₹{getPlanMeta(selectedRequest.plan).price}</p>
                </div>

                {/* UPI ID Section */}
                <div className="bg-[#f4fcf7] p-4 rounded-2xl border border-[#e6f7ef] col-span-2">
                  <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1.5">
                    <CreditCard size={14} className="text-[#059669]"/> UPI ID
                  </p>
                  <p className="font-bold text-[#064e3b] text-base font-mono break-all">
                    {selectedRequest.upiId || 'Not provided'}
                  </p>
                </div>

                {/* Payment Screenshot Section */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                      <Image size={14} className="text-[#059669]"/> Payment Screenshot
                    </p>
                    {selectedRequest.screenshot && (
                      <button 
                        type="button"
                        onClick={() => setPreviewImage(selectedRequest.screenshot)}
                        className="text-xs text-[#059669] hover:text-[#047857] font-bold flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        <ZoomIn size={13}/> Full View
                      </button>
                    )}
                  </div>
                  {selectedRequest.screenshot ? (
                    <div 
                      onClick={() => setPreviewImage(selectedRequest.screenshot)}
                      className="cursor-pointer group relative rounded-xl overflow-hidden border border-gray-200 bg-black/5 max-h-60 flex items-center justify-center hover:opacity-95 transition-opacity"
                    >
                      <img 
                        src={selectedRequest.screenshot} 
                        alt="Payment Receipt Screenshot" 
                        className="max-h-60 w-full object-contain rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div className="hidden p-4 text-center text-xs text-gray-400">
                        ⚠️ Image could not be loaded or is corrupted.
                      </div>
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity font-bold text-xs gap-1.5">
                        <ZoomIn size={16} /> Click to Enlarge
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic py-2">No payment screenshot attached.</p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 col-span-2">
                  <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><FileText size={12}/> User Message</p>
                  <p className="text-sm font-semibold text-gray-700 whitespace-pre-wrap">{selectedRequest.message || 'No message provided.'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 col-span-2">
                  <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><Calendar size={12}/> Date & Time Received</p>
                  <p className="font-bold text-gray-700">
                    {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            {selectedRequest.status === "pending" && (
              <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex gap-4 shrink-0">
                <button 
                  onClick={() => setConfirmAction({ id: selectedRequest._id, status: "rejected" })}
                  className="flex-1 py-3 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  Reject Request
                </button>
                <button 
                  onClick={() => setConfirmAction({ id: selectedRequest._id, status: "approved" })}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-[#10B981] hover:bg-[#059669] shadow-lg shadow-[#10B981]/30 transition-all cursor-pointer"
                >
                  Approve Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dedicated Large Image Preview Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full max-h-[90vh] bg-[#111827] border border-white/20 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center cursor-default"
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Image size={16} className="text-[#10B981]" /> Payment Screenshot Preview
              </h4>
              <button 
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-auto max-h-[75vh] w-full flex items-center justify-center rounded-2xl bg-black/50 p-2">
              <img 
                src={previewImage} 
                alt="Full Screenshot Proof" 
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="hidden text-white/60 text-sm py-12">
                ⚠️ Unable to display image preview.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Approve / Reject */}
      {confirmAction && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 modal-overlay" onClick={() => setConfirmAction(null)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 text-center modal-content z-10 border border-[#e6f7ef]">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              confirmAction.status === 'approved' ? 'bg-[#e6f7ef] text-[#10B981]' : 'bg-[#fef2f2] text-[#ef4444]'
            }`}>
              {confirmAction.status === 'approved' ? <Check size={28} /> : <X size={28} />}
            </div>
            <h3 className="text-xl font-bold text-[#064e3b] mb-2">
              {confirmAction.status === 'approved' ? 'Approve Request' : 'Reject Request'}
            </h3>
            <p className="text-sm font-semibold text-gray-600 mb-6">
              {confirmAction.status === 'approved' 
                ? "Are you sure you want to approve this request?" 
                : "Are you sure you want to reject this request?"}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  const { id, status } = confirmAction;
                  setConfirmAction(null);
                  await updateStatus(id, status);
                }}
                className={`flex-1 py-3 rounded-xl font-bold text-white transition-all text-sm shadow-md cursor-pointer ${
                  confirmAction.status === 'approved' 
                    ? 'bg-[#10B981] hover:bg-[#059669] shadow-[#10B981]/30' 
                    : 'bg-[#ef4444] hover:bg-[#dc2626] shadow-red-500/30'
                }`}
              >
                {confirmAction.status === 'approved' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { label: "Pending", bg: "#fef3c7", color: "#d97706", dot: "#f59e0b" },
    approved: { label: "Approved", bg: "#e6f7ef", color: "#10B981", dot: "#10B981" },
    rejected: { label: "Rejected", bg: "#fee2e2", color: "#ef4444", dot: "#ef4444" },
  };
  const s = map[status] || map.pending;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider" style={{ background: s.bg, color: s.color }}>
      <span className="w-2 h-2 rounded-full shadow-sm" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}