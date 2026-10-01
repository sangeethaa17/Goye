import React, { useState, useEffect, useMemo } from "react";
import { Search, Building2, Phone, MapPin, Calendar, Filter, Mail, Smartphone, Briefcase, Activity, UserX } from "lucide-react";



const API_BASE_URL = (process.env.REACT_APP_API_URL || "https://goyeorg.onrender.com").replace(/\/+$/, "");

export default function AdminFreeUsers() {
  const [freeUsers, setFreeUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [actionError, setActionError] = useState("");
  const [actioningId, setActioningId] = useState(null); // id currently being updated

  useEffect(() => {
    let isFetching = false;
    const fetchFreeUsers = async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/free-users`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setFreeUsers(data);
            sessionStorage.setItem("goye_free_users", JSON.stringify(data));
            setError("");
          }
        } else {
          setError("Could not load Free User details.");
        }
      } catch (err) {
        console.error("Free users fetch error:", err);
        setError("Could not reach the server.");
      } finally {
        setLoading(false);
        isFetching = false;
      }
    };

    fetchFreeUsers();
    const intervalId = setInterval(fetchFreeUsers, 60000); // matches admindashboard.js's 60s poll
    return () => clearInterval(intervalId);
  }, []);

  const filteredUsers = useMemo(() => {
    return freeUsers.filter((u) => {
      const matchesStatus = statusFilter === "All" || u.status === statusFilter.toLowerCase();
      if (!matchesStatus) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.businessName || "").toLowerCase().includes(q) ||
        (u.businessType || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q) ||
        (u.location || "").toLowerCase().includes(q)
      );
    });
  }, [freeUsers, search, statusFilter]);

  const sortedFreeUsersAsc = [...freeUsers].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  const seqIdMap = {};
  sortedFreeUsersAsc.forEach((u, index) => {
    if (u._id) {
      seqIdMap[u._id] = `GOYE-F${String(index + 1).padStart(3, '0')}`;
    }
  });

  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const changeStatus = async (user, nextStatus) => {
    if (nextStatus === user.status) return; // no-op, e.g. picking "Unblock User" on an already-active user
    setActioningId(user._id);
    setActionError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/free-users/${user._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(data.message || "Could not update user status.");
        return;
      }
      setFreeUsers((prev) => {
        const updated = prev.map((u) => (u._id === user._id ? { ...u, status: nextStatus } : u));
        sessionStorage.setItem("goye_free_users", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("Free user status update error:", err);
      setActionError("Could not reach the server.");
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="admin-main-content min-h-screen bg-[#f4fcf7] font-sans text-gray-800 relative overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }

        .slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .dash-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid rgba(16, 185, 129, 0.15);
          box-shadow: 0 4px 24px -10px rgba(16, 185, 129, 0.1);
          transition: all 0.3s ease;
        }

        .btn-filter {
          appearance: none;
          background: #e6f7ef;
          border: 1px solid #a7f3d0;
          color: #047857;
          padding: 6px 14px 6px 12px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          outline: none;
        }
      `}</style>

      {/* Header */}
      <header className="w-full pl-16 pr-4 md:px-8 py-4 bg-white/80 backdrop-blur-md border-b border-[#a7f3d0]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#047857] flex items-center justify-center shadow-lg shadow-[#10B981]/30">
              <Building2 className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#064e3b]">Free User Details</h1>
              <p className="text-xs text-[#059669] font-medium">Registered Free User accounts</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="relative w-full md:max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, business, phone..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#a7f3d0] bg-white text-sm outline-none focus:border-[#10B981] transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select className="btn-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>All</option>
              <option>Active</option>
              <option>Blocked</option>
            </select>
          </div>
        </div>

        {/* Summary card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="dash-card p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#e6f7ef", color: "#10B981" }}>
              <Building2 size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">Total Free Users</p>
              <p className="text-2xl font-bold text-[#064e3b] mt-1">{freeUsers.length}</p>
            </div>
          </div>
          <div className="dash-card p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#eff6ff", color: "#3b82f6" }}>
              <Activity size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-[#1e3a8a] mt-1">{freeUsers.filter(u => u.status === 'active' || u.status === 'Active' || !u.status).length}</p>
            </div>
          </div>
          <div className="dash-card p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#fef2f2", color: "#ef4444" }}>
              <UserX size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">Blocked Users</p>
              <p className="text-2xl font-bold text-[#7f1d1d] mt-1">{freeUsers.filter(u => u.status === 'blocked' || u.status === 'Blocked').length}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="dash-card p-4 text-sm text-red-500 border-red-200">{error}</div>
        )}

        {actionError && (
          <div className="dash-card p-4 text-sm text-red-500 border-red-200">{actionError}</div>
        )}

        {/* Table */}
        <div className="dash-card overflow-hidden slide-up" style={{ animationDelay: "0.3s" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f4fcf7] text-gray-500 text-sm font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Business Info</th>
                  <th className="px-6 py-4">Joined On</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6f7ef]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#10B981] font-bold animate-pulse">
                      Loading Free User details...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                      No Free Users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-[#fcfdfd] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#6ee7b7] flex items-center justify-center text-white text-xl font-bold shadow-sm">
                            {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <p className="font-bold text-[#064e3b] text-base">{u.name}</p>
                            <p className="text-xs text-[#059669] font-medium uppercase tracking-wider mt-0.5">ID: {seqIdMap[u._id]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Mail size={14} className="text-[#10B981]" /> {u.email || "No email"}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Smartphone size={14} className="text-[#10B981]" /> {u.phone || "No phone"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <p className="text-sm font-bold text-[#064e3b] flex items-center gap-2">
                            <Building2 size={14} className="text-[#10B981]" /> {u.businessName || "Not provided"}
                          </p>
                          <p className="text-xs text-[#059669] uppercase tracking-wider font-medium flex items-center gap-2">
                            <Briefcase size={14} className="text-gray-400" /> {u.businessType || "N/A"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-700">
                          {formatDate(u.createdAt)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          value="current"
                          disabled={actioningId === u._id}
                          onChange={(e) => {
                            const action = e.target.value;
                            if (action === "block") changeStatus(u, "blocked");
                            if (action === "unblock") changeStatus(u, "active");
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border outline-none cursor-pointer disabled:opacity-50 ${
                            u.status === "blocked"
                              ? "bg-red-50 text-red-500 border-red-200"
                              : "bg-[#e6f7ef] text-[#047857] border-[#a7f3d0]"
                          }`}
                        >
                          <option value="current">
                            {actioningId === u._id ? "Updating..." : u.status === "blocked" ? "Blocked" : "Active"}
                          </option>
                          <option value="block">Block User</option>
                          <option value="unblock">Unblock User</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}