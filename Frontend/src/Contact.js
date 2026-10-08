import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaHeadset, FaWhatsapp, FaLinkedin, FaFacebookF, FaInstagram, FaPaperPlane, FaCheckCircle, FaTimesCircle, FaSpinner, FaBolt, FaFileCsv, FaShieldAlt } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { SOCIAL_LINKS, FACEBOOK_URL, INSTAGRAM_URL } from './config/socialLinks';
import { validateContactForm, buildContactMessage } from './utils/contactForm';

export default function Contact() {
    const navigate = useNavigate();
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validation = validateContactForm(formData);

        if (!validation.isValid) {
            setStatus('error');
            setMessage(validation.errors[0]);
            return;
        }

        setIsSubmitting(true);
        setStatus('idle');
        setMessage('');

        try {
            const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://goye.onrender.com';
            const response = await fetch(`${apiBaseUrl}/api/contact/whatsapp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    loggedInEmail: localStorage.getItem("email") || "",
                    text: buildContactMessage(formData)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || 'Unable to send your message right now.');
            }

            setStatus('success');
            setMessage('Your message has been sent successfully.');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            setStatus('error');
            setMessage(error.message || 'Unable to send your message right now.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#212122] py-12 px-4 sm:py-20 sm:px-6 overflow-x-hidden relative">

            <style>{`
                @keyframes gyFloat { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-24px) translateX(10px); } }
                @keyframes gyFloatSlow { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(20px) translateX(-14px); } }
                @keyframes gyGradientMove { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
                @keyframes gyPopIn { 0% { opacity: 0; transform: translateY(28px) scale(0.96); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes gyShine { 0% { transform: translateX(-120%) skewX(-12deg); } 100% { transform: translateX(220%) skewX(-12deg); } }
                @keyframes gyRingPulse { 0% { transform: scale(0.7); opacity: 0.8; } 100% { transform: scale(2.1); opacity: 0; } }
                .gy-gradient-text { background-size: 200% auto; animation: gyGradientMove 6s ease-in-out infinite; }
                .gy-pop { opacity: 0; animation: gyPopIn 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }
                .gy-shine-btn { position: relative; overflow: hidden; }
                .gy-shine-btn .gy-shine { position: absolute; top: 0; left: 0; width: 40%; height: 100%; background: linear-gradient(120deg, transparent, rgba(255,255,255,0.55), transparent); transform: translateX(-120%) skewX(-12deg); }
                .gy-shine-btn:hover .gy-shine { animation: gyShine 0.9s ease forwards; }
                .gy-tilt { transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease; }
                .gy-tilt:hover { transform: translateY(-10px) scale(1.02); }
                .gy-ring { position: absolute; inset: 0; border-radius: 9999px; border: 2px solid #25D366; animation: gyRingPulse 2s ease-out infinite; }
            `}</style>
            
            {/* Animated Background Blobs */}
            <div className="absolute top-0 left-4 sm:left-20 w-40 h-40 sm:w-72 sm:h-72 bg-[#25D366] rounded-full mix-blend-screen filter blur-3xl opacity-[0.12]" style={{ animation: 'gyFloat 9s ease-in-out infinite' }}></div>
            <div className="absolute bottom-20 right-4 sm:right-20 w-48 h-48 sm:w-96 sm:h-96 bg-[#128C7E] rounded-full mix-blend-screen filter blur-3xl opacity-[0.16]" style={{ animation: 'gyFloatSlow 11s ease-in-out infinite', animationDelay: '2s' }}></div>

            <div className="max-w-7xl mx-auto relative z-10">
                
                {/* Hero Section */}
                <div className="text-center mb-10 sm:mb-16 animate-fade-in-up px-2">
                    <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold text-white mb-4 sm:mb-6 tracking-tight break-words">
                        Let's <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#128C7E] via-[#25D366] to-[#128C7E] gy-gradient-text">Connect.</span>
                    </h1>
                    <p className="text-base sm:text-lg md:text-2xl text-white/60 max-w-3xl mx-auto font-medium">
                        We're here to help you scale your business. Reach out to us for support, sales, or just to say hello!
                    </p>
                </div>

                {/* Contact Info Cards (Like About Page Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 mb-12 sm:mb-20">
                    
                    {/* Email Card */}
                    <div className="gy-pop gy-tilt bg-white/[0.04] backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-lg border border-white/10 hover:shadow-[0_20px_40px_rgba(37,211,102,0.22)] transition-all duration-300 flex flex-col items-center text-center group" style={{ animationDelay: '0ms' }}>
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#25D366]/10 text-[#25D366] rounded-full flex items-center justify-center mb-4 sm:mb-6 text-3xl sm:text-4xl group-hover:bg-[#25D366] group-hover:text-white transition-colors duration-300 group-hover:rotate-6">
                            <FaEnvelope />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Email Us</h3>
                        <p className="text-white/50 mb-4">Our friendly team is here to help.</p>
                        <p className="text-lg sm:text-xl font-bold text-[#25D366] break-words">support@goye.in</p>
                    </div>

                    {/* Phone Card */}
                    <div className="gy-pop gy-tilt bg-white/[0.04] backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-lg border border-white/10 hover:shadow-[0_20px_40px_rgba(37,211,102,0.22)] transition-all duration-300 flex flex-col items-center text-center group" style={{ animationDelay: '120ms' }}>
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#25D366]/10 text-[#25D366] rounded-full flex items-center justify-center mb-4 sm:mb-6 text-3xl sm:text-4xl group-hover:bg-[#25D366] group-hover:text-white transition-colors duration-300 group-hover:rotate-6">
                            <FaPhoneAlt />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Call Us</h3>
                        <p className="text-white/50 mb-4">24×7 Customer Support</p>
                        <div className="flex flex-col gap-1">
                            <p className="text-lg sm:text-xl font-bold text-[#25D366] break-words">+91 99430 42369</p>
                            <p className="text-lg sm:text-xl font-bold text-[#25D366] break-words">+91 81480 42369</p>
                        </div>
                    </div>

                    {/* Support Card */}
                    <div className="gy-pop gy-tilt bg-white/[0.04] backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-lg border border-white/10 hover:shadow-[0_20px_40px_rgba(37,211,102,0.22)] transition-all duration-300 flex flex-col items-center text-center group" style={{ animationDelay: '240ms' }}>
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#25D366]/10 text-[#25D366] rounded-full flex items-center justify-center mb-4 sm:mb-6 text-3xl sm:text-4xl group-hover:bg-[#25D366] group-hover:text-white transition-colors duration-300 group-hover:rotate-6">
                            <FaHeadset />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Get Support</h3>
                        <p className="text-white/50 mb-4">We're here whenever you need help.</p>
                        <p className="text-lg sm:text-xl font-bold text-[#25D366] break-words">24/7 Assistance</p>
                    </div>

                </div>

                {/* Premium Contact Form Section */}
                <div className="gy-pop max-w-4xl mx-auto bg-white/[0.04] backdrop-blur-2xl rounded-[1.5rem] sm:rounded-[3rem] shadow-2xl p-5 sm:p-10 md:p-16 border border-[#25D366]/15 relative overflow-hidden" style={{ animationDelay: '150ms' }}>
                    
                    {/* Decorative element inside form */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#25D366] rounded-full mix-blend-screen filter blur-3xl opacity-[0.12]" style={{ animation: 'gyFloat 8s ease-in-out infinite' }}></div>

                    <div className="text-center mb-8 sm:mb-12">
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-3 sm:mb-4">Send us a Message</h2>
                        <p className="text-sm sm:text-base text-white/60">Fill out the form below and we'll get back to you shortly.</p>
                    </div>
                    
                    {status === 'success' ? (
                        <div className="flex flex-col items-center justify-center py-10 animate-fade-in-up text-center px-2">
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-6 flex items-center justify-center">
                                <span className="gy-ring" style={{ animationDelay: '0s' }}></span>
                                <span className="gy-ring" style={{ animationDelay: '0.5s' }}></span>
                                <span className="gy-ring" style={{ animationDelay: '1s' }}></span>
                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-[#25D366]/10 text-[#25D366] rounded-full flex items-center justify-center text-4xl sm:text-5xl shadow-inner animate-bounce">
                                    <FaCheckCircle />
                                </div>
                            </div>
                            <h4 className="text-2xl sm:text-3xl font-bold text-white">Message Sent Successfully!</h4>
                            <p className="text-white/50 mt-3 text-base sm:text-lg">Thank you for reaching out. We'll be in touch soon.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 relative z-10">
                            {message && (
                                <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${status === 'error' ? 'border-red-400/40 bg-red-500/10 text-red-200' : 'border-[#25D366]/30 bg-[#25D366]/10 text-[#d9ffe7]'}`}>
                                    {status === 'error' ? <FaTimesCircle className="mt-0.5" /> : <FaCheckCircle className="mt-0.5" />}
                                    <span>{message}</span>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                                <div>
                                    <label className="block text-sm font-bold text-white/80 mb-2 sm:mb-3 ml-1 sm:ml-2">Full Name</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" className="w-full px-4 py-3 sm:px-6 sm:py-4 rounded-2xl border-2 border-white/10 focus:outline-none focus:ring-4 focus:ring-[#25D366]/20 focus:border-[#25D366] transition-all duration-300 focus:scale-[1.01] bg-white/5 text-white placeholder-white/30 shadow-sm hover:shadow-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-white/80 mb-2 sm:mb-3 ml-1 sm:ml-2">Email Address</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="john@company.com" className="w-full px-4 py-3 sm:px-6 sm:py-4 rounded-2xl border-2 border-white/10 focus:outline-none focus:ring-4 focus:ring-[#25D366]/20 focus:border-[#25D366] transition-all duration-300 focus:scale-[1.01] bg-white/5 text-white placeholder-white/30 shadow-sm hover:shadow-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-white/80 mb-2 sm:mb-3 ml-1 sm:ml-2">From WhatsApp Number</label>
                                    <input type="text" readOnly value={localStorage.getItem("phone") || "Not Logged In"} className="w-full px-4 py-3 sm:px-6 sm:py-4 rounded-2xl border-2 border-white/10 bg-white/5 text-white/60 cursor-not-allowed shadow-sm focus:outline-none" />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-white/80 mb-2 sm:mb-3 ml-1 sm:ml-2">How can we help?</label>
                                <input type="text" name="subject" value={formData.subject} onChange={handleChange} required placeholder="Subject of your message" className="w-full px-4 py-3 sm:px-6 sm:py-4 rounded-2xl border-2 border-white/10 focus:outline-none focus:ring-4 focus:ring-[#25D366]/20 focus:border-[#25D366] transition-all duration-300 focus:scale-[1.01] bg-white/5 text-white placeholder-white/30 shadow-sm hover:shadow-md" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-white/80 mb-2 sm:mb-3 ml-1 sm:ml-2">Your Message</label>
                                <textarea name="message" value={formData.message} onChange={handleChange} required rows="5" placeholder="Tell us more about your query..." className="w-full px-4 py-3 sm:px-6 sm:py-4 rounded-2xl border-2 border-white/10 focus:outline-none focus:ring-4 focus:ring-[#25D366]/20 focus:border-[#25D366] transition-all duration-300 focus:scale-[1.01] bg-white/5 text-white placeholder-white/30 shadow-sm hover:shadow-md resize-none"></textarea>
                            </div>

                            <div className="flex justify-center pt-2 sm:pt-4">
                                <button type="submit" disabled={isSubmitting} className="gy-shine-btn flex items-center justify-center gap-3 w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 text-white font-bold text-base sm:text-lg rounded-full shadow-[0_10px_20px_rgba(37,211,102,0.3)] hover:shadow-[0_20px_40px_rgba(37,211,102,0.4)] hover:-translate-y-2 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-70" style={{ backgroundColor: "#25D366" }}>
                                    <span className="gy-shine"></span>
                                    {isSubmitting ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                                    {isSubmitting ? 'Sending...' : 'Send Message'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Social Icons at the bottom */}
                    <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-white/10 flex justify-center gap-4 sm:gap-6 flex-wrap">
                        <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp" className="w-11 h-11 sm:w-12 sm:h-12 bg-white/5 rounded-full flex items-center justify-center text-lg sm:text-xl text-white/50 hover:bg-[#25D366] hover:text-white transition-all duration-300 hover:-translate-y-2 hover:rotate-6 shadow-sm"><FaWhatsapp /></a>
                        <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" aria-label="Visit our LinkedIn profile" className="w-11 h-11 sm:w-12 sm:h-12 bg-white/5 rounded-full flex items-center justify-center text-lg sm:text-xl text-white/50 hover:bg-[#25D366] hover:text-white transition-all duration-300 hover:-translate-y-2 hover:rotate-6 shadow-sm"><FaLinkedin /></a>
                        <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" aria-label="Visit our X profile" className="w-11 h-11 sm:w-12 sm:h-12 bg-white/5 rounded-full flex items-center justify-center text-lg sm:text-xl text-white/50 hover:bg-[#25D366] hover:text-white transition-all duration-300 hover:-translate-y-2 hover:rotate-6 shadow-sm"><FaXTwitter /></a>
                        <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" aria-label="Visit our Facebook profile" className="w-11 h-11 sm:w-12 sm:h-12 bg-white/5 rounded-full flex items-center justify-center text-lg sm:text-xl text-white/50 hover:bg-[#25D366] hover:text-white transition-all duration-300 hover:-translate-y-2 hover:rotate-6 shadow-sm"><FaFacebookF /></a>
                        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Visit our Instagram profile" className="w-11 h-11 sm:w-12 sm:h-12 bg-white/5 rounded-full flex items-center justify-center text-lg sm:text-xl text-white/50 hover:bg-[#25D366] hover:text-white transition-all duration-300 hover:-translate-y-2 hover:rotate-6 shadow-sm"><FaInstagram /></a>
                    </div>

                </div>
            </div>

            {/* ================= FOOTER ================= */}
            <footer className="relative bg-[#212122] mt-20 border-t border-white/5">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#25D366]/50 to-transparent"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 sm:gap-8 mb-10 sm:mb-14">

                        {/* Brand */}
                        <div className="sm:col-span-2 md:col-span-2">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-[0_4px_14px_rgba(37,211,102,0.3)]">
                                    <FaWhatsapp className="text-white text-lg" />
                                </div>
                                <p className="gy-display text-white font-bold text-lg tracking-tight">Goye <span className="text-[#25D366]">Broadcast</span></p>
                            </div>
                            <p className="text-sm text-white/50 leading-relaxed max-w-sm mb-5">
                                Connect your WhatsApp and reach your entire audience with personalized bulk messages &mdash; no coding, no hassle.
                            </p>
                            <div className="flex items-center gap-2 text-xs font-semibold text-white/40">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse"></div>
                                Secure, encrypted sessions
                            </div>
                        </div>

                        {/* Navigate */}
                        <div>
                            <p className="text-white text-sm font-bold tracking-wide uppercase mb-4">Navigate</p>
                            <ul className="space-y-3">
                                <li><a href="/" className="text-sm text-white/50 hover:text-[#25D366] transition-colors">Home</a></li>
                                <li><a href="/about" className="text-sm text-white/50 hover:text-[#25D366] transition-colors">About</a></li>
                                <li><a href="/contact" className="text-sm text-white/50 hover:text-[#25D366] transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        {/* Capabilities */}
                        <div>
                            <p className="text-white text-sm font-bold tracking-wide uppercase mb-4">Capabilities</p>
                            <ul className="space-y-3">
                                <li className="text-sm text-white/50 flex items-center gap-2"><FaBolt className="text-[#25D366] text-xs shrink-0" /> Bulk Sending</li>
                                <li className="text-sm text-white/50 flex items-center gap-2"><FaFileCsv className="text-[#25D366] text-xs shrink-0" /> Easy Import</li>
                                <li className="text-sm text-white/50 flex items-center gap-2"><FaShieldAlt className="text-[#25D366] text-xs shrink-0" /> Secure Sessions</li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-xs text-white/35 text-center sm:text-left">&copy; {new Date().getFullYear()} Goye Broadcast. All rights reserved.</p>
                        <p className="text-xs text-white/25 text-center sm:text-right">WhatsApp is a trademark of Meta Platforms, Inc. Goye Broadcast is an independent tool and is not affiliated with WhatsApp.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}