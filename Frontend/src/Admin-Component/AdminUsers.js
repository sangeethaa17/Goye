import React, { useState, useEffect } from 'react';
import { 
  Search, Bell, Check, X, Eye, Edit2, Trash2, Smartphone, Mail, 
  ChevronLeft, ChevronRight, Users, ShieldCheck, UserCheck, Activity, Calendar, Zap, MessageSquare, Building2, Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState(() => {
    const cached = sessionStorage.getItem('goye_users');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(() => !sessionStorage.getItem('goye_users'));
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editRowId, setEditRowId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", email: "", phone: "" });
  const [viewUser, setViewUser] = useState(null);
  const [viewUserStats, setViewUserStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  let isFetchingUsers = false;
  
  useEffect(() => {
    fetchUsers(); // Initial load
    const intervalId = setInterval(fetchUsers, 60000); // Poll every 60 seconds instead of 5
    return () => clearInterval(intervalId); // Cleanup
  }, []);

  const fetchUsers = async () => {
    if (isFetchingUsers) return;
    isFetchingUsers = true;
    try {
      const response = await fetch("https://goyeorg.onrender.com/api/users");
      if (!response.ok) throw new Error(`Server returned ${response.status}: Please restart your Node.js backend!`);
      const data = await response.json();
      setUsers(data); 
      sessionStorage.setItem('goye_users', JSON.stringify(data));
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      isFetchingUsers = false;
    }
  };

  const handleView = async (user) => {
    setViewUser(user);
    setViewUserStats(null);
    setStatsLoading(true);
    
    if (user.email) {
      try {
        const response = await fetch("https://goyeorg.onrender.com/api/user/credits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email })
        });
        if (response.ok) {
          const data = await response.json();
          setViewUserStats({
            credits: data.credits !== undefined ? data.credits : 30,
            totalSent: data.totalSent !== undefined ? data.totalSent : 0
          });
        }
      } catch (err) {
        console.error("Failed to fetch credits", err);
      }
    }
    setStatsLoading(false);
  };

  const handleEditClick = (user) => {
    setEditRowId(user._id);
    setEditFormData({ name: user.name, email: user.email, phone: user.phone || "" });
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = (id) => {
    const newUsers = [...users];
    const index = users.findIndex(u => u._id === id);
    if(index !== -1) {
      newUsers[index] = { ...newUsers[index], ...editFormData };
      setUsers(newUsers);
    }
    setEditRowId(null);
  };

  const handleCancelEdit = () => {
    setEditRowId(null);
  };

  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to completely delete this user? This action cannot be undone.")) {
      try {
        const response = await fetch(`https://goyeorg.onrender.com/api/users/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setUsers(users.filter(u => u._id !== id));
        } else {
          alert("Failed to delete user. Please try again.");
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("An error occurred while deleting the user.");
      }
    }
  };

  const sortedUsersAsc = [...users].reverse();
  const seqIdMap = {};
  sortedUsersAsc.forEach((u, index) => {
    if (u._id) {
      seqIdMap[u._id] = `GOYE-S${String(index + 1).padStart(3, '0')}`;
    }
  });

  const filteredUsers = users.filter(user => {
    const q = searchQuery.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(q)) ||
      (user.email && user.email.toLowerCase().includes(q)) ||
      (user.phone && user.phone.includes(q)) ||
      (user.businessName && user.businessName.toLowerCase().includes(q)) ||
      (user.businessType && user.businessType.toLowerCase().includes(q))
    );
  });

  return (
    <div className="admin-main-content min-h-screen bg-[#f4fcf7] font-sans text-gray-800 relative overflow-x-hidden">
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
          background: rgba(6, 78, 59, 0.5);
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease-out;
        }
        .modal-content {
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>

      {/* Header - Fixed Alignment */}
      <header className="w-full pl-16 pr-4 md:px-8 py-4 bg-white/80 backdrop-blur-md border-b border-[#a7f3d0]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white shadow-lg">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#064e3b]">Subscribed Users</h2>
              <p className="text-xs text-[#10B981] font-medium">View, edit, and manage subscribed members</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            {/* Notification icon removed from here per user request */}
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
        
        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 slide-up" style={{ animationDelay: '0.1s' }}>
          {[
            { label: "Total Registered", value: users.length, icon: Users, color: "#10B981", bg: "#e6f7ef" },
            { label: "Active Today", value: Math.max(1, Math.floor(users.length * 0.4)), icon: Activity, color: "#3b82f6", bg: "#eff6ff" },
            { label: "Verified Users", value: Math.max(0, users.length - 2), icon: ShieldCheck, color: "#f59e0b", bg: "#fffbeb" },
          ].map((kpi, i) => (
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

        {/* Users Table Card */}
        <div className="dash-card slide-up overflow-hidden" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 border-b border-[#e6f7ef]">
            <h2 className="text-lg font-bold text-[#064e3b]">User Directory</h2>
            <div className="flex items-center gap-2 bg-[#f4fcf7] border border-[#a7f3d0] focus-within:border-[#10B981] rounded-xl px-4 py-2.5 w-80 transition-colors">
              <Search size={16} className="text-[#059669]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, phone, business..."
                className="bg-transparent text-sm font-medium text-[#064e3b] outline-none w-full placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f4fcf7] text-gray-500 text-sm font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Business Info</th>
                  <th className="px-6 py-4">Joined On</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6f7ef]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#10B981] font-bold animate-pulse">
                      Loading users data...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                      No users match your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-[#fcfdfd] transition-colors group">
                      {editRowId === user._id ? (
                        /* Inline Edit Mode */
                        <>
                          <td className="px-6 py-4">
                            <input 
                              type="text" name="name" value={editFormData.name} onChange={handleEditChange}
                              className="w-full px-4 py-2 border border-[#a7f3d0] rounded-xl focus:border-[#10B981] outline-none text-sm font-bold text-[#064e3b]"
                              placeholder="Full Name"
                            />
                          </td>
                          <td className="px-6 py-4 space-y-2">
                            <input 
                              type="email" name="email" value={editFormData.email} onChange={handleEditChange}
                              className="w-full px-4 py-2 border border-[#a7f3d0] rounded-xl focus:border-[#10B981] outline-none text-sm"
                              placeholder="Email Address"
                            />
                            <input 
                              type="text" name="phone" value={editFormData.phone} onChange={handleEditChange}
                              className="w-full px-4 py-2 border border-[#a7f3d0] rounded-xl focus:border-[#10B981] outline-none text-sm"
                              placeholder="Phone Number"
                            />
                          </td>
                          <td className="px-6 py-4 text-xs text-[#059669] font-bold uppercase tracking-wide">
                            <p>{user.businessName || "Not provided"}</p>
                            <p className="text-gray-400 font-medium">{user.businessType || "N/A"}</p>
                          </td>
                          <td className="px-6 py-4 text-xs text-[#059669] font-bold uppercase tracking-wide">
                            Editing Mode
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleSaveEdit(user._id)} className="p-2.5 rounded-xl bg-[#10B981] text-white hover:bg-[#059669] shadow-md transition-colors" title="Save Changes">
                                <Check size={16} />
                              </button>
                              <button onClick={handleCancelEdit} className="p-2.5 rounded-xl bg-[#fef2f2] text-red-500 hover:bg-red-500 hover:text-white transition-colors" title="Cancel">
                                <X size={16} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        /* Normal View Mode */
                        <>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#6ee7b7] flex items-center justify-center text-white text-xl font-bold shadow-sm">
                                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                              </div>
                              <div>
                                <p className="font-bold text-[#064e3b] text-base">{user.name}</p>
                                <p className="text-xs text-[#059669] font-medium uppercase tracking-wider mt-0.5">ID: {seqIdMap[user._id]}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1.5">
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Mail size={14} className="text-[#10B981]" /> {user.email || "No email"}
                              </p>
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Smartphone size={14} className="text-[#10B981]" /> {user.phone || "No phone"}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1.5">
                              <p className="text-sm font-bold text-[#064e3b] flex items-center gap-2">
                                <Building2 size={14} className="text-[#10B981]" /> {user.businessName || "Not provided"}
                              </p>
                              <p className="text-xs text-[#059669] uppercase tracking-wider font-medium flex items-center gap-2">
                                <Briefcase size={14} className="text-gray-400" /> {user.businessType || "N/A"}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-700">
                              {user._id ? new Date(parseInt(user._id.substring(0,8), 16) * 1000).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'}) : "Unknown"}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleView(user)} className="p-2 rounded-lg bg-[#f4fcf7] text-[#059669] hover:bg-[#10B981] hover:text-white transition-colors" title="View Profile">
                                <Eye size={18} />
                              </button>
                              <button onClick={() => handleEditClick(user)} className="p-2 rounded-lg bg-[#fffbeb] text-amber-600 hover:bg-amber-500 hover:text-white transition-colors" title="Edit User">
                                <Edit2 size={18} />
                              </button>
                              <button onClick={() => handleDelete(user._id)} className="p-2 rounded-lg bg-[#fef2f2] text-red-500 hover:bg-red-500 hover:text-white transition-colors" title="Delete User">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between px-6 py-4 bg-[#f4fcf7] border-t border-[#e6f7ef]">
            <span className="text-sm text-gray-500 font-medium">Showing {filteredUsers.length} users</span>
            <div className="flex gap-1">
              <button className="p-1.5 rounded-lg hover:bg-[#e6f7ef] text-[#059669] transition"><ChevronLeft size={18}/></button>
              <button className="p-1.5 rounded-lg hover:bg-[#e6f7ef] text-[#059669] transition"><ChevronRight size={18}/></button>
            </div>
          </div>
        </div>
      </main>

      {/* User Profile Modal */}
      {viewUser && (
        <div className="fixed inset-0 md:left-[260px] z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 modal-overlay backdrop-blur-sm bg-black/40" onClick={() => setViewUser(null)}></div>
          <div className="relative bg-gradient-to-b from-[#eef8f1] to-[#e6f4ea] rounded-3xl shadow-2xl w-full max-w-[460px] modal-content flex flex-col pb-8">
            
            {/* Header */}
            <div className="px-6 pt-5 pb-12 bg-[#22c55e] rounded-t-3xl text-white flex items-start justify-between relative z-10">
              <div>
                <h3 className="text-xl font-bold font-['Sora'] tracking-wide">User Profile</h3>
                <p className="text-emerald-100 text-sm mt-0.5">{viewUser.name}</p>
              </div>
              <button onClick={() => setViewUser(null)} className="flex items-center gap-1 text-sm font-medium text-white/90 hover:text-white transition-colors">
                Close <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Avatar overlapping */}
            <div className="flex flex-col items-center -mt-10 relative z-20">
              <div className="w-[84px] h-[84px] rounded-full bg-[#86efac] border-4 border-[#eef8f1] flex items-center justify-center text-[#166534] text-4xl font-extrabold shadow-sm">
                {viewUser.name ? viewUser.name.charAt(0).toUpperCase() : "U"}
              </div>
              <h4 className="text-[22px] font-bold text-[#064e3b] mt-2 font-['Sora']">{viewUser.name}</h4>
              <p className="text-[11px] font-semibold text-[#166534] border border-[#166534]/40 rounded-full px-3 py-1 mt-1.5">
                Member since {viewUser._id ? new Date(parseInt(viewUser._id.substring(0,8), 16) * 1000).getFullYear() : "2026"}
              </p>
            </div>

            {/* Content Body */}
            <div className="px-7 mt-6">
              
              {/* Contact Info Card */}
              <div className="bg-white/70 backdrop-blur-md rounded-[20px] p-2 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-white mb-7">
                <div className="flex items-center gap-4 p-3.5 border-b border-gray-100/60">
                  <div className="w-8 h-8 rounded-[10px] bg-[#dcfce7] flex items-center justify-center text-[#16a34a] shadow-sm">
                    <Mail size={16} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-sm font-semibold text-gray-900">{viewUser.email || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3.5 border-b border-gray-100/60">
                  <div className="w-8 h-8 rounded-[10px] bg-[#dcfce7] flex items-center justify-center text-[#16a34a] shadow-sm">
                    <Smartphone size={16} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">Phone</p>
                    <p className="text-sm font-semibold text-gray-900">{viewUser.phone || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3.5 border-b border-gray-100/60">
                  <div className="w-8 h-8 rounded-[10px] bg-[#dcfce7] flex items-center justify-center text-[#16a34a] shadow-sm">
                    <Building2 size={16} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">Business</p>
                    <p className="text-sm font-semibold text-gray-900">{viewUser.businessName || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3.5">
                  <div className="w-8 h-8 rounded-[10px] bg-[#dcfce7] flex items-center justify-center text-[#16a34a] shadow-sm">
                    <Briefcase size={16} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">Type</p>
                    <p className="text-sm font-semibold text-gray-900">{viewUser.businessType || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Credits & Usage Section */}
              <h5 className="text-[17px] font-bold text-[#166534] mb-3.5 tracking-tight font-['Sora']">Credits & Usage</h5>
              
              {statsLoading ? (
                <div className="flex gap-3 animate-pulse">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex-1 h-32 bg-white/50 rounded-[20px]"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  
                  {/* Remaining Credits */}
                  <div className="bg-[#e2f5e8] border border-[#a7f3d0] pt-3 pb-4 px-2 rounded-[20px] flex flex-col items-center justify-center relative shadow-sm hover:shadow-md transition-all group">
                    <div className="absolute top-2.5 left-2.5 bg-white w-7 h-7 rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] group-hover:scale-110 transition-transform">
                      <Zap size={14} className="text-[#166534]" />
                    </div>
                    <p className="text-3xl font-extrabold text-[#064e3b] mt-7 tracking-tight font-['Sora']">{viewUserStats?.credits ?? '0'}</p>
                    <p className="text-[10px] text-[#4b5563] mt-1 font-medium text-center">Remaining Credits</p>
                  </div>

                  {/* Used Credits */}
                  <div className="bg-[#e2f5e8] border border-[#a7f3d0] pt-3 pb-4 px-2 rounded-[20px] flex flex-col items-center justify-center relative shadow-sm hover:shadow-md transition-all group">
                    <div className="absolute top-2.5 left-2.5 bg-white w-7 h-7 rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] group-hover:scale-110 transition-transform">
                      <Activity size={14} className="text-[#166534]" />
                    </div>
                    <p className="text-3xl font-extrabold text-[#064e3b] mt-7 tracking-tight font-['Sora']">{viewUserStats?.totalSent ?? '0'}</p>
                    <p className="text-[10px] text-[#4b5563] mt-1 font-medium text-center">Used Credits</p>
                  </div>

                  {/* Total Messages */}
                  <div className="bg-[#e2f5e8] border border-[#a7f3d0] pt-3 pb-4 px-2 rounded-[20px] flex flex-col items-center justify-center relative shadow-sm hover:shadow-md transition-all group">
                    <div className="absolute top-2.5 left-2.5 bg-white w-7 h-7 rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] group-hover:scale-110 transition-transform">
                      <MessageSquare size={14} className="text-[#166534]" />
                    </div>
                    <p className="text-3xl font-extrabold text-[#064e3b] mt-7 tracking-tight font-['Sora']">{(viewUserStats?.totalSent || 0) * 2}</p>
                    <p className="text-[10px] text-[#4b5563] mt-1 font-medium text-center">Total Messages</p>
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
