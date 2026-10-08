import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  FaUser, FaEnvelope, FaLock, FaBuilding, FaTag, FaPhone, 
  FaMapMarkerAlt, FaEye, FaEyeSlash, FaUserPlus, FaArrowRight, FaSpinner 
} from "react-icons/fa";

const API_BASE_URL = (process.env.REACT_APP_API_URL || "https://goye.onrender.com").replace(/\/+$/, "");

const initialForm = {
  name: "",
  email: "",
  password: "",
  businessName: "",
  businessType: "",
  phone: "",
  location: "",
};

const COUNTRY_CODES = [
  { code: "+91", label: "+91 (IN)" },
  { code: "+1", label: "+1 (US/CA)" },
  { code: "+44", label: "+44 (UK)" },
  { code: "+971", label: "+971 (UAE)" },
  { code: "+966", label: "+966 (SA)" },
  { code: "+65", label: "+65 (SG)" },
  { code: "+60", label: "+60 (MY)" },
  { code: "+61", label: "+61 (AU)" },
  { code: "+49", label: "+49 (DE)" },
  { code: "+33", label: "+33 (FR)" },
  { code: "+81", label: "+81 (JP)" },
  { code: "+880", label: "+880 (BD)" },
  { code: "+94", label: "+94 (LK)" },
  { code: "+977", label: "+977 (NP)" },
  { code: "+92", label: "+92 (PK)" },
  { code: "+20", label: "+20 (EG)" },
  { code: "+234", label: "+234 (NG)" },
  { code: "+27", label: "+27 (ZA)" },
  { code: "+7", label: "+7 (RU)" },
  { code: "+86", label: "+86 (CN)" },
];

export default function FreeUserRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [countryCode, setCountryCode] = useState("+91");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.phone.trim() || !form.location.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== confirmPassword) {
      setError("Passwords do not match. Please recheck your password.");
      return;
    }

    setSubmitting(true);
    try {
      const fullPhone = form.phone.trim().startsWith("+") ? form.phone.trim() : `${countryCode} ${form.phone.trim()}`;
      const payload = {
        ...form,
        phone: fullPhone,
        businessName: form.businessName ? form.businessName.trim() : "",
        businessType: form.businessType ? form.businessType.trim() : "",
      };

      const res = await fetch(`${API_BASE_URL}/api/free-user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "Registration failed. Please try again.");
        return;
      }

      navigate("/free-user/login", {
        state: { registered: true, prefillEmail: form.email.trim().toLowerCase(), name: form.name },
      });
    } catch (err) {
      console.error("Free user registration error:", err);
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at top, #0d281a 0%, #050f0a 60%, #030805 100%)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-[#25D366]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Registration Card */}
      <div className="w-full max-w-2xl bg-[#0B140E]/95 border border-[#25D366]/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(37,211,102,0.15)] p-7 sm:p-10 backdrop-blur-2xl relative z-10 animate-fade-in my-6">
        
        {/* Card Header */}
        <div className="text-center mb-7">
          <div className="relative w-16 h-16 mx-auto mb-3">
            <div className="w-16 h-16 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/40 flex items-center justify-center p-2 shadow-[0_0_25px_rgba(37,211,102,0.25)] transition-transform duration-300 hover:scale-105">
              <img src="/Goye.png" alt="Goye Logo" className="w-11 h-11 object-contain" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#25D366] border-2 border-[#0B140E]" />
          </div>

          <span className="text-[11px] uppercase tracking-widest font-extrabold text-[#25D366] bg-[#25D366]/10 px-3.5 py-1 rounded-full border border-[#25D366]/30 inline-block mb-3">
            ✨ FREE USER
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Space_Grotesk',sans-serif]">
            Create Your Free Account
          </h1>
          <p className="text-xs sm:text-sm text-white/60 mt-1.5 font-medium">
            Start with free credits and explore Goye
          </p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-white/70 uppercase tracking-wide">
                <FaUser className="text-[#25D366] text-xs" />
                <span>Full Name</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none">
                  <FaUser />
                </div>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#121A16] border border-[#25D366]/20 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-white/70 uppercase tracking-wide">
                <FaEnvelope className="text-[#25D366] text-xs" />
                <span>Email ID</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none">
                  <FaEnvelope />
                </div>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@gmail.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#121A16] border border-[#25D366]/20 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-white/70 uppercase tracking-wide">
                <FaLock className="text-[#25D366] text-xs" />
                <span>Password</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none">
                  <FaLock />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 6 chars"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-[#121A16] border border-[#25D366]/20 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#25D366] transition-colors p-1"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-white/70 uppercase tracking-wide">
                <FaLock className="text-[#25D366] text-xs" />
                <span>Confirm Password</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none">
                  <FaLock />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-[#121A16] border border-[#25D366]/20 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#25D366] transition-colors p-1"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
                </button>
              </div>
            </div>
          </div>

          {/* Row 3: Business Name & Business Type (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-bold text-white/70 uppercase tracking-wide">
                <span className="flex items-center gap-1.5">
                  <FaBuilding className="text-[#25D366] text-xs" />
                  <span>Business Name</span>
                </span>
                <span className="text-[10px] text-white/40 normal-case font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none">
                  <FaBuilding />
                </div>
                <input
                  type="text"
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  placeholder="Your business name (optional)"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#121A16] border border-[#25D366]/20 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-bold text-white/70 uppercase tracking-wide">
                <span className="flex items-center gap-1.5">
                  <FaTag className="text-[#25D366] text-xs" />
                  <span>Business Type</span>
                </span>
                <span className="text-[10px] text-white/40 normal-case font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none">
                  <FaTag />
                </div>
                <input
                  type="text"
                  name="businessType"
                  value={form.businessType}
                  onChange={handleChange}
                  placeholder="e.g. Retail, Services (optional)"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#121A16] border border-[#25D366]/20 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Phone & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone Number with Country Code */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-white/70 uppercase tracking-wide">
                <FaPhone className="text-[#25D366] text-xs" />
                <span>Phone Number</span>
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-[98px] sm:w-[102px] h-11 px-2 bg-[#121A16] border border-[#25D366]/25 hover:border-[#25D366]/50 rounded-xl text-xs sm:text-sm text-[#25D366] font-bold outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all cursor-pointer shrink-0"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-[#0B140E] text-white font-medium">
                      {c.label}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1 min-w-0">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs pointer-events-none">
                    <FaPhone />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Phone number"
                    required
                    autoComplete="tel"
                    className="w-full h-11 pl-8 pr-3 bg-[#121A16] border border-[#25D366]/25 hover:border-[#25D366]/50 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* City / Location */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-white/70 uppercase tracking-wide">
                <FaMapMarkerAlt className="text-[#25D366] text-xs" />
                <span>City / Location</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none">
                  <FaMapMarkerAlt />
                </div>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Tirunelveli"
                  required
                  autoComplete="address-level2"
                  className="w-full h-11 pl-10 pr-4 bg-[#121A16] border border-[#25D366]/25 hover:border-[#25D366]/50 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {/* Submit CTA Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-gradient-to-r from-[#25D366] via-[#20BD5A] to-[#128C7E] hover:opacity-95 text-black font-extrabold text-base rounded-xl shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_25px_rgba(37,211,102,0.6)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 mt-5 flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <FaSpinner className="animate-spin text-sm" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create Free Account</span>
                <FaArrowRight className="text-xs" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs sm:text-sm text-white/60 mt-6 font-medium">
          Already have a free account?{" "}
          <Link to="/free-user/login" className="text-[#25D366] font-bold hover:underline inline-flex items-center gap-1">
            Log in →
          </Link>
        </p>
      </div>
    </div>
  );
}