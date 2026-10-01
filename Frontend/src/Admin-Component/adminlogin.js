import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, User, Lock, ArrowRight } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Hardcoded admin credentials (change these as needed)
  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = "123";

  const handleSubmit = (e) => {
    e.preventDefault();

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      alert("✅ Login Successful! Welcome Admin.");
      localStorage.setItem("admin_isLoggedIn", "true");
      localStorage.setItem("admin_username", "Admin");
      window.dispatchEvent(new Event("loginStatusChanged"));
      setError("");
      navigate("/goye-admin-dashboard");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#e6f7ef] via-[#f4fcf7] to-[#e6f7ef] relative overflow-hidden font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        .slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gradient-to-tr from-[#10B981] to-[#34d399] rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gradient-to-br from-[#059669] to-[#047857] rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

      <div className="w-full max-w-[480px] bg-white/80 backdrop-blur-xl rounded-[28px] shadow-[0_8px_40px_rgba(16,185,129,0.12)] border border-white p-8 sm:p-12 relative z-10 slide-up">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-[#10B981] to-[#059669] rounded-[20px] flex items-center justify-center p-3 shadow-lg shadow-[#10B981]/30 mb-6 transform -rotate-3 hover:rotate-0 transition-transform">
            <img src="/Goye.png" alt="Goye Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#064e3b] font-['Sora'] tracking-tight">
            Goye Admin
          </h1>
          <p className="text-xs sm:text-sm text-[#059669] mt-3 font-bold bg-[#e6f7ef] px-4 py-1.5 rounded-full border border-[#a7f3d0] uppercase tracking-wider">
            Secure Portal Access
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#064e3b] uppercase tracking-widest ml-1">
              Username
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#10B981] transition-colors">
                <User size={20} />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl outline-none transition-all focus:bg-white focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 text-base font-semibold text-[#064e3b] placeholder:text-gray-400 placeholder:font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#064e3b] uppercase tracking-widest ml-1">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#10B981] transition-colors">
                <Lock size={20} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl outline-none transition-all focus:bg-white focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 text-base font-semibold text-[#064e3b] placeholder:text-gray-400 placeholder:font-medium"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-500 text-sm font-bold p-4 rounded-xl border border-red-100 flex items-center justify-center animate-pulse">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-4 py-4 rounded-2xl font-bold text-lg text-white transition-all bg-[#10B981] hover:bg-[#059669] hover:shadow-[0_6px_24px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
          >
            Access Dashboard
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p className="text-center text-xs font-bold text-gray-400 mt-10 uppercase tracking-[0.2em]">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
}