import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaTimes, FaArrowRight, FaPhone, FaMapMarkerAlt, FaBuilding, FaBriefcase } from "react-icons/fa";

const BUBBLE_PATTERN = `<svg xmlns='http://www.w3.org/2000/svg' width='84' height='84'><path d='M16 12h34a7 7 0 017 7v16a7 7 0 01-7 7H30l-9 8v-8h-5a7 7 0 01-7-7V19a7 7 0 017-7z' fill='none' stroke='#25D366' stroke-opacity='0.06' stroke-width='1.4'/></svg>`;
const BUBBLE_BG = `data:image/svg+xml,${encodeURIComponent(BUBBLE_PATTERN)}`;

const C = {
  void: "#07100C",
  panel: "#0E1613",
  panelBorder: "rgba(37, 211, 102, 0.16)",
  green: "#25D366",
  greenDeep: "#128C4A",
  greenDark: "#075E54",
  text: "#F2F6F4",
  muted: "#7C8B84",
  inputBg: "#121A16",
  inputBorder: "#1E2822",
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

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    businessName: "",
    businessType: "",
    phone: "",
    location: "",
    password: "",
    confirmPassword: "",
  });
  const [countryCode, setCountryCode] = useState("+91");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const cleanValue = value.replace(/\D/g, "");
      setFormData({ ...formData, [name]: cleanValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.location.trim()) {
      alert("⚠️ Please fill in all required fields!");
      return;
    }
    if (!formData.phone.trim()) {
      alert("⚠️ Please enter your phone number!");
      return;
    }
    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const apiBaseUrl = (process.env.REACT_APP_API_URL || "https://goyeorg.onrender.com").replace(/\/+$/, "");
      const fullPhone = formData.phone.trim().startsWith("+") ? formData.phone.trim() : `${countryCode} ${formData.phone.trim()}`;
      const response = await fetch(`${apiBaseUrl}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          businessName: formData.businessName ? formData.businessName.trim() : "",
          businessType: formData.businessType ? formData.businessType.trim() : "",
          phone: fullPhone,
          location: formData.location.trim(),
          password: formData.password,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        alert("✅ Register Successful!");
        navigate("/userloginpage", { state: { registered: true, name: formData.name } });
      } else {
        alert("Registration failed: " + data.message);
      }
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fieldLabel = { display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem", color: "#B7C2BC" };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ background: C.void }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');

        .gy-reg-bg {
          position: absolute;
          inset: 0;
          background-image: url("${BUBBLE_BG}");
          background-size: 84px 84px;
        }
        .gy-reg-glow {
          position: absolute;
          border-radius: 9999px;
          filter: blur(90px);
          pointer-events: none;
        }
        .gy-reg-card {
          font-family: 'Inter', system-ui, sans-serif;
          background: ${C.panel};
          border: 1px solid ${C.panelBorder};
        }
        .gy-reg-heading {
          font-family: 'Space Grotesk', system-ui, sans-serif;
        }
        .gy-status-dot {
          animation: gy-pulse 2s ease-in-out infinite;
        }
        @keyframes gy-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37,211,102,0.55); }
          50% { box-shadow: 0 0 0 5px rgba(37,211,102,0); }
        }
        .gy-input {
          background: ${C.inputBg};
          border: 1px solid ${C.inputBorder};
          color: ${C.text};
        }
        .gy-input::placeholder { color: #57645D; }
        .gy-input:focus {
          border-color: ${C.green};
          box-shadow: 0 0 0 3px rgba(37,211,102,0.12);
        }
        .gy-dots span {
          animation: gy-bounce 1.2s infinite ease-in-out;
        }
        .gy-dots span:nth-child(2) { animation-delay: 0.15s; }
        .gy-dots span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes gy-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

      <div className="gy-reg-bg" />
      <div
        className="gy-reg-glow"
        style={{ width: 320, height: 320, background: C.greenDeep, opacity: 0.18, top: -100, right: -100 }}
      />
      <div
        className="gy-reg-glow"
        style={{ width: 360, height: 360, background: C.greenDark, opacity: 0.22, bottom: -120, left: -120 }}
      />

      <div
        className="gy-reg-card w-full max-w-2xl bg-[#0B140E]/95 border border-[#25D366]/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(37,211,102,0.15)] p-7 sm:p-10 backdrop-blur-2xl relative z-10 transition-all duration-500 ease-out my-6"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? "scale(1) translateY(0)" : "scale(0.94) translateY(16px)",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 hover:rotate-90"
          style={{ color: C.muted }}
        >
          <FaTimes size={16} />
        </button>

        <div className="text-center mb-7">
          <div className="relative w-16 h-16 mx-auto mb-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center p-2 shadow-[0_0_25px_rgba(37,211,102,0.3)] transition-transform duration-300 hover:scale-105 border border-[#25D366]/40"
              style={{ background: `linear-gradient(135deg, ${C.green}, ${C.greenDeep})` }}
            >
              <img src="/Goye.png" alt="Goye Logo" className="w-11 h-11 object-contain" />
            </div>
            <span
              className="gy-status-dot absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2"
              style={{ background: C.green, borderColor: C.panel }}
            />
          </div>

          <span className="text-[11px] uppercase tracking-widest font-extrabold text-[#25D366] bg-[#25D366]/10 px-3.5 py-1 rounded-full border border-[#25D366]/30 inline-block mb-3">
            👑 SUBSCRIBED USER
          </span>

          <h1 className="gy-reg-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Space_Grotesk',sans-serif]">
            Create Your Subscription Account
          </h1>
          <p className="text-xs sm:text-sm text-white/60 mt-1.5 font-medium">
            Enjoy premium Goye features &amp; unlimited messaging
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Full name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-white/70 uppercase tracking-wide">
                <FaUser className="text-[#25D366] text-xs" />
                <span>Full Name</span>
              </label>
              <div className="relative group">
                <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2" size={14} style={{ color: C.muted }} />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  className="gy-input w-full h-11 pl-10 pr-4 rounded-xl outline-none transition-all duration-300 text-sm font-medium"
                  style={{ caretColor: C.green }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-white/70 uppercase tracking-wide">
                <FaEnvelope className="text-[#25D366] text-xs" />
                <span>Email Address</span>
              </label>
              <div className="relative group">
                <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2" size={14} style={{ color: C.muted }} />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="gy-input w-full h-11 pl-10 pr-4 rounded-xl outline-none transition-all duration-300 text-sm font-medium"
                  style={{ caretColor: C.green }}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Business Name & Business Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-white/70 uppercase tracking-wide">
                  <FaBuilding className="text-[#25D366] text-xs" />
                  <span>Business Name</span>
                </label>
                <span className="text-[10px] text-white/40 font-normal">(Optional)</span>
              </div>
              <div className="relative group">
                <FaBuilding className="absolute left-3.5 top-1/2 -translate-y-1/2" size={14} style={{ color: C.muted }} />
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Enter business name (optional)"
                  className="gy-input w-full h-11 pl-10 pr-4 rounded-xl outline-none transition-all duration-300 text-sm font-medium"
                  style={{ caretColor: C.green }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-white/70 uppercase tracking-wide">
                  <FaBriefcase className="text-[#25D366] text-xs" />
                  <span>Business Type</span>
                </label>
                <span className="text-[10px] text-white/40 font-normal">(Optional)</span>
              </div>
              <div className="relative group">
                <FaBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2" size={14} style={{ color: C.muted }} />
                <input
                  type="text"
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  placeholder="e.g. Retail, Services, Agency (optional)"
                  className="gy-input w-full h-11 pl-10 pr-4 rounded-xl outline-none transition-all duration-300 text-sm font-medium"
                  style={{ caretColor: C.green }}
                />
              </div>
            </div>
          </div>

          {/* Row 3: Phone Number & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-white/70 uppercase tracking-wide">
                <FaPhone className="text-[#25D366] text-xs" />
                <span>Phone Number</span>
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-[98px] sm:w-[102px] h-11 px-2 bg-[#121A16] border border-[#25D366]/25 hover:border-[#25D366]/50 rounded-xl text-xs sm:text-sm font-bold text-[#25D366] outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all cursor-pointer shrink-0"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-[#0B140E] text-white">
                      {c.label}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1 min-w-0 group">
                  <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2" size={13} style={{ color: C.muted }} />
                  <input
                    type="text"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone number"
                    className="gy-input w-full h-11 pl-8 pr-3 rounded-xl outline-none transition-all duration-300 text-sm font-medium"
                    style={{ caretColor: C.green }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-white/70 uppercase tracking-wide">
                <FaMapMarkerAlt className="text-[#25D366] text-xs" />
                <span>Location</span>
              </label>
              <div className="relative group">
                <FaMapMarkerAlt className="absolute left-3.5 top-1/2 -translate-y-1/2" size={14} style={{ color: C.muted }} />
                <input
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Enter location"
                  className="gy-input w-full h-11 pl-10 pr-4 rounded-xl outline-none transition-all duration-300 text-sm font-medium"
                  style={{ caretColor: C.green }}
                />
              </div>
            </div>
          </div>

          {/* Row 4: Password & Confirm password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-white/70 uppercase tracking-wide">
                <FaLock className="text-[#25D366] text-xs" />
                <span>Password</span>
              </label>
              <div className="relative group">
                <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2" size={14} style={{ color: C.muted }} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className="gy-input w-full h-11 pl-10 pr-10 rounded-xl outline-none transition-all duration-300 text-sm font-medium"
                  style={{ caretColor: C.green }}
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                  style={{ color: C.muted }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-white/70 uppercase tracking-wide">
                <FaLock className="text-[#25D366] text-xs" />
                <span>Confirm password</span>
              </label>
              <div className="relative group">
                <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2" size={14} style={{ color: C.muted }} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className="gy-input w-full h-11 pl-10 pr-10 rounded-xl outline-none transition-all duration-300 text-sm font-medium"
                  style={{ caretColor: C.green }}
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                  style={{ color: C.muted }}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer pt-1" style={{ color: C.muted }}>
            <input type="checkbox" required className="accent-[#25D366] rounded cursor-pointer" />
            <span>I agree to the <span className="text-white/80 font-medium hover:underline">Terms &amp; Conditions</span></span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-[#25D366] via-[#20BD5A] to-[#128C7E] hover:opacity-95 text-black font-extrabold text-base rounded-xl shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_25px_rgba(37,211,102,0.6)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 mt-5 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="gy-dots flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-black inline-block" />
                <span className="w-1.5 h-1.5 rounded-full bg-black inline-block" />
                <span className="w-1.5 h-1.5 rounded-full bg-black inline-block" />
              </span>
            ) : (
              <>
                <span>Create Subscription Account</span>
                <FaArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: C.muted }}>
          Already have an account?{" "}
          <span
            onClick={() => navigate("/userloginpage")}
            style={{ color: C.green }}
            className="font-semibold hover:underline cursor-pointer"
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}