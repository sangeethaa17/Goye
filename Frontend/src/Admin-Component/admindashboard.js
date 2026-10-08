import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, MessageCircle, Search, Bell, Activity, Phone, 
  TrendingUp, Filter, Server, Database, Zap, Crown, Building2
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";

export default function GoyeAdminDashboard() {
  const navigate = useNavigate();
  const [realUsers, setRealUsers] = useState(() => {
    const cached = sessionStorage.getItem('goye_users');
    return cached ? JSON.parse(cached) : [];
  });
  const [allMessages, setAllMessages] = useState(() => {
    const cached = sessionStorage.getItem('goye_messages');
    return cached ? JSON.parse(cached) : [];
  });
  
  const [kpiFilter, setKpiFilter] = useState("Today");
  const [chartFilter, setChartFilter] = useState("This Week");

  useEffect(() => {
    let isFetching = false;
    const fetchData = async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        const [userRes, msgRes] = await Promise.all([
          fetch("https://goye.onrender.com/api/users").catch(() => null),
          fetch("https://goye.onrender.com/api/messages/stats").catch(() => null)
        ]);
        
        if (userRes && userRes.ok) {
          const userData = await userRes.json();
          if (Array.isArray(userData)) {
            setRealUsers(userData);
            sessionStorage.setItem('goye_users', JSON.stringify(userData));
          }
        }

        if (msgRes && msgRes.ok) {
          const messageData = await msgRes.json();
          if (Array.isArray(messageData)) {
            setAllMessages(messageData);
            sessionStorage.setItem('goye_messages', JSON.stringify(messageData));
          }
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        isFetching = false;
      }
    };

    fetchData(); // Initial load
    const intervalId = setInterval(fetchData, 60000); // Poll every 60 seconds for real-time updates to reduce load
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  const kpiStats = useMemo(() => {
    const getLocalYYYYMMDD = (d = new Date()) => {
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().split('T')[0];
    };
    
    const now = new Date();
    let startDate = new Date(0); // default fallback
    
    if (kpiFilter === "Today") {
      startDate = new Date(now.setHours(0,0,0,0));
    } else if (kpiFilter === "This Week") {
      const dayOfWeek = now.getDay();
      const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startDate = new Date(now.setDate(diffToMonday));
      startDate.setHours(0,0,0,0);
    } else if (kpiFilter === "This Month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    // Total messages for the selected period
    const periodMessagesData = allMessages.filter(m => {
      const mDate = new Date(m.date);
      // For accurate date comparison, normalize mDate to start of day
      mDate.setHours(0,0,0,0);
      return mDate >= startDate;
    });
    
    const periodMessages = periodMessagesData.reduce((acc, curr) => acc + curr.count, 0);
    const periodSuccess = periodMessagesData.reduce((acc, curr) => acc + (curr.successCount || curr.count || 0), 0); // Fallback to count for old data
    const periodFailed = periodMessagesData.reduce((acc, curr) => acc + (curr.failedCount || 0), 0);
    
    const totalAttempted = periodSuccess + periodFailed;
    const successPercentage = totalAttempted > 0 ? Math.round((periodSuccess / totalAttempted) * 100) : 100;
    const failedPercentage = totalAttempted > 0 ? Math.round((periodFailed / totalAttempted) * 100) : 0;
    
    // New Users for the selected period
    const periodNewUsers = realUsers.filter(u => {
      if(!u._id) return false;
      const d = new Date(parseInt(u._id.substring(0,8), 16) * 1000);
      return d >= startDate;
    }).length;

    // Calculate total credits spent (based on totalSent)
    const totalCreditsSpent = realUsers.reduce((acc, u) => acc + (u.totalSent || 0), 0);

    // Calculate Active / Inactive Users for Pie Chart
    const todayString = getLocalYYYYMMDD();
    const activeUsersCount = realUsers.filter(u => u.lastDailyRewardDate === todayString).length;
    const inactiveUsersCount = realUsers.length - activeUsersCount;

    return {
      messages: periodMessages,
      newUsers: periodNewUsers,
      totalUsers: realUsers.length,
      totalCreditsSpent,
      activeUsersCount,
      inactiveUsersCount,
      successPercentage,
      failedPercentage,
      periodSuccess,
      periodFailed,
      totalAttempted,
      activeRate: Math.floor(Math.random() * 20) + 70
    };
  }, [allMessages, realUsers, kpiFilter]);

  const chartData = useMemo(() => {
    const getLocalYYYYMMDD = (d) => {
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().split('T')[0];
    };

    if (chartFilter === "This Week") {
      const now = new Date();
      // Get Monday of current week
      const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
      const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diffToMonday));
      
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      
      return days.map((day, i) => {
        const targetDate = new Date(monday);
        targetDate.setDate(monday.getDate() + i);
        const dateStr = getLocalYYYYMMDD(targetDate);
        
        // Find messages
        const msgLog = allMessages.find(m => m.date === dateStr);
        const msgCount = msgLog ? msgLog.count : 0;
        
        // Find users registered on this date
        const userCount = realUsers.filter(u => {
          if(!u._id) return false;
          const timestamp = parseInt(u._id.substring(0,8), 16) * 1000;
          return getLocalYYYYMMDD(new Date(timestamp)) === dateStr;
        }).length;
        
        return { name: day, messages: msgCount, users: userCount };
      });
    } else {
      // This Month - Group by week (1 to 5)
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth(); 
      
      const weeks = [
        { name: "Week 1", messages: 0, users: 0 },
        { name: "Week 2", messages: 0, users: 0 },
        { name: "Week 3", messages: 0, users: 0 },
        { name: "Week 4", messages: 0, users: 0 },
        { name: "Week 5", messages: 0, users: 0 }
      ];
      
      allMessages.forEach(m => {
        const date = new Date(m.date);
        if (date.getFullYear() === year && date.getMonth() === month) {
          const d = date.getDate();
          let weekIdx = Math.ceil(d / 7) - 1;
          if (weekIdx > 4) weekIdx = 4;
          weeks[weekIdx].messages += m.count;
        }
      });
      
      realUsers.forEach(u => {
        if(u._id) {
          const timestamp = parseInt(u._id.substring(0,8), 16) * 1000;
          const date = new Date(timestamp);
          if (date.getFullYear() === year && date.getMonth() === month) {
            const d = date.getDate();
            let weekIdx = Math.ceil(d / 7) - 1;
            if (weekIdx > 4) weekIdx = 4;
            weeks[weekIdx].users += 1;
          }
        }
      });
      
      return weeks;
    }
  }, [chartFilter, allMessages, realUsers]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
          <p className="text-sm font-bold text-gray-700 mb-2">{label}</p>
          <p className="text-sm text-[#10B981] mb-1">messages : <span className="font-bold">{payload[0]?.payload.messages || 0}</span></p>
          <p className="text-sm text-[#3b82f6]">users : <span className="font-bold">{payload[0]?.payload.users || 0}</span></p>
        </div>
      );
    }
    return null;
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
        .dash-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px -12px rgba(16, 185, 129, 0.25);
          border-color: rgba(16, 185, 129, 0.4);
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

      {/* Header - Fixed Alignment */}
      <header className="w-full pl-16 pr-4 md:px-8 py-4 bg-white/80 backdrop-blur-md border-b border-[#a7f3d0]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#047857] flex items-center justify-center shadow-lg shadow-[#10B981]/30">
              <Activity className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#064e3b]">Goye Analytics</h1>
              <p className="text-xs text-[#059669] font-medium">Advanced Admin Dashboard</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
        
        {/* Top Controls & KPI */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 slide-up" style={{ animationDelay: '0.1s' }}>
          <div>
            <h2 className="text-2xl font-bold text-[#064e3b]">Overview Stats</h2>
            <p className="text-sm text-gray-500 mt-1">Track your platform's performance metrics.</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select className="btn-filter" value={kpiFilter} onChange={e => setKpiFilter(e.target.value)}>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 slide-up" style={{ animationDelay: '0.2s' }}>
          {[
            { title: "Total Users", value: kpiStats.totalUsers.toLocaleString(), icon: Users, color: "#10B981", bg: "#e6f7ef" },
            { title: "Today Messages", value: kpiStats.messages.toLocaleString(), icon: MessageCircle, color: "#3b82f6", bg: "#eff6ff" },
            { title: `New Users ${kpiFilter}`, value: kpiStats.newUsers.toLocaleString(), icon: TrendingUp, color: "#f59e0b", bg: "#fffbeb" },
            { title: "Total Credits Used", value: kpiStats.totalCreditsSpent.toLocaleString(), icon: Zap, color: "#8b5cf6", bg: "#f5f3ff" }
          ].map((kpi, i) => (
            <div key={i} className="dash-card p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: kpi.bg, color: kpi.color }}>
                <kpi.icon size={28} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">{kpi.title}</p>
                <p className="text-2xl font-bold text-[#064e3b] mt-1">{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Charts */}
          <div className="lg:col-span-2 space-y-8">
            {/* Engagement Trends */}
            <div className="dash-card p-6 slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#064e3b]">Engagement Trends</h3>
                <select className="btn-filter" value={chartFilter} onChange={e => setChartFilter(e.target.value)}>
                  <option>This Week</option>
                  <option>This Month</option>
                </select>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMsg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} interval={0} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="messages" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorMsg)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Active vs Inactive Pie Chart */}
            <div className="dash-card p-6 slide-up grid grid-cols-1 md:grid-cols-2 gap-6 items-center" style={{ animationDelay: '0.5s' }}>
              <div>
                <h3 className="text-lg font-bold text-[#064e3b]">User Activity</h3>
                <p className="text-xs text-gray-500 mb-6">Daily usage statistics</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-[#f4fcf7] p-4 rounded-xl border border-[#e6f7ef]">
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Active</p>
                      <p className="text-2xl font-black text-[#10B981]">{kpiStats.activeUsersCount}</p>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Inactive</p>
                      <p className="text-2xl font-black text-gray-400">{kpiStats.inactiveUsersCount}</p>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-[#9ca3af]"></div>
                  </div>
                </div>
              </div>
              
              <div className="relative min-h-[250px] w-full flex items-center justify-center">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8 z-10">
                   <p className="text-3xl font-black text-[#064e3b]">{kpiStats.totalUsers}</p>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Total Users</p>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Active Users', value: kpiStats.activeUsersCount },
                        { name: 'Inactive Users', value: kpiStats.inactiveUsersCount }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#10B981" />
                      <Cell fill="#9ca3af" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(value) => <span style={{ color: '#064e3b', fontWeight: 'bold' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column: Recent Registrations */}
          <div className="dash-card p-6 lg:col-span-1 flex flex-col h-full max-h-[720px] slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#064e3b]">Recent Registrations</h3>
                <p className="text-xs text-gray-500">Newest users this month</p>
              </div>
            </div>
            
            <div className="overflow-y-auto pr-2 space-y-4 flex-1">
              {realUsers.slice(0, 10).map((u, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#f4fcf7] border border-transparent hover:border-[#a7f3d0] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#10B981] to-[#6ee7b7] flex items-center justify-center text-white font-bold shadow-sm">
                    {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#064e3b] truncate">{u.name}</p>
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                      <Phone size={10} /> {u.phone}
                    </p>
                  </div>
                </div>
              ))}
              {realUsers.length === 0 && (
                <div className="text-sm text-gray-400 text-center mt-10">No users found.</div>
              )}
            </div>
            <button 
              onClick={() => navigate('/goye-admin-users')}
              className="w-full mt-6 py-2.5 rounded-xl border border-[#10B981] text-[#059669] font-semibold text-sm hover:bg-[#10B981] hover:text-white transition-colors"
            >
              View All Users
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}