import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiSend, FiPaperclip, FiBot, FiUser, FiMessageSquare } from 'react-icons/fi';
import { FaRobot, FaWhatsapp, FaUsers, FaCoins, FaClock, FaTags, FaBolt, FaSearch } from 'react-icons/fa';

export default function GoyeAiChatbot({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const chatAreaRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      if (messages.length > 0) {
        scrollToBottom();
      } else if (chatAreaRef.current) {
        chatAreaRef.current.scrollTop = 0;
      }
    }
  }, [messages, isTyping, isOpen]);

  // Suggestion Cards Data
  const suggestions = [
    { label: 'Connect WhatsApp', icon: <FaWhatsapp className="text-[#25D366]" />, prompt: 'How do I connect my WhatsApp account to Goye?' },
    { label: 'Social Leads', icon: <FaSearch className="text-[#25D366]" />, prompt: 'How does Social Leads extraction work?' },
    { label: 'Bulk Messaging', icon: <FaBolt className="text-[#25D366]" />, prompt: 'How does bulk messaging work and how to upload contacts?' },
    { label: 'Team Campaign', icon: <FaUsers className="text-[#25D366]" />, prompt: 'What is a Team Campaign and how to split work?' },
    { label: 'Credits System', icon: <FaCoins className="text-[#25D366]" />, prompt: 'How do daily free credits work in Goye?' },
    { label: 'Scheduled Messages', icon: <FaClock className="text-[#25D366]" />, prompt: 'Will scheduled messages work if my PC is powered off?' },
    { label: 'Plans & Pricing', icon: <FaTags className="text-[#25D366]" />, prompt: 'What are the plans, limits, and pricing details?' }
  ];

  // Mock AI Engine (Easily replaceable with an API call in the future)
  const getAiResponse = async (userPrompt) => {
    const p = userPrompt.toLowerCase();

    if (p.includes('connect') || p.includes('qr') || p.includes('whatsapp') || p.includes('link')) {
      return "To connect your WhatsApp:\n1. Click **Connect Device Now** or the top **Connect** button.\n2. Open WhatsApp on your phone → **Linked Devices** → **Link a Device**.\n3. Scan the QR code displayed on screen. Once authenticated, your session is encrypted & ready for bulk broadcasts!";
    }

    if (p.includes('social') || p.includes('soical') || p.includes('lead') || p.includes('extract') || p.includes('scrape') || p.includes('scraper') || p.includes('b2b')) {
      return "Goye Social Leads Extractor & Web Scraper:\n1. **Select Platform**: Choose Facebook, Instagram, LinkedIn, YouTube, TikTok, or Google Maps.\n2. **Target Keywords**: Enter your search keyword (e.g. 'Gym Owners', 'Real Estate') and target location/country.\n3. **Extract Real-Time**: Click **Search / Extract Leads** to find public phone numbers & business leads.\n4. **Instant Action**: Export numbers as Excel/CSV or transfer them directly into the Bulk Messaging panel to start broadcasting immediately!";
    }

    if (p.includes('bulk') || p.includes('csv') || p.includes('excel') || p.includes('upload') || p.includes('contact')) {
      return "For Bulk Messaging in Goye:\n1. Upload your CSV or Excel file containing contact numbers, or enter numbers manually separated by commas.\n2. Add your text message, record voice, or attach media (up to 3 Images, 2 Docs, 1 Video).\n3. Click **Send Messages**! Goye automatically maintains a 2-second anti-spam delay between sends.";
    }

    if (p.includes('team') || p.includes('split') || p.includes('lobby') || p.includes('join')) {
      return "Team Campaign allows you to split large contact lists among team members:\n1. Click **Split with Team** on the Messages panel.\n2. Set batch size per member & generate a join link.\n3. Share the link with teammates so everyone sends a fraction of the list, preventing single-number rate limits!";
    }

    if (p.includes('credit') || p.includes('free') || p.includes('limit') || p.includes('cost')) {
      return "Goye Credits Information:\n• 1 Credit = 2 Bulk Messages sent.\n• Free tier accounts receive 30 daily credits automatically.\n• You can check your remaining credits directly in your Profile top bar!";
    }

    if (p.includes('schedule') || p.includes('time') || p.includes('off') || p.includes('sleep') || p.includes('later')) {
      return "Scheduled Messages in Goye:\n• Schedules are safely stored in **MongoDB Database**.\n• If your PC is ON, the message fires at the exact minute set.\n• If your PC is OFF/sleeping, Goye reloads pending jobs from MongoDB as soon as you turn your PC ON and sends them immediately!\n• For 24/7 exact-time execution while PC is off, deploy Goye to a cloud server like Render.";
    }

    if (p.includes('plan') || p.includes('price') || p.includes('pricing') || p.includes('pro') || p.includes('cost')) {
      return "Goye Pricing & Capabilities:\n• **Free Starter Plan**: 30 Daily Credits, Multi-file Uploads, Voice-to-Text, and Scheduled Messages.\n• **Enterprise / Custom Plan**: Unlimited Credits, Multi-Account Switching, Cloud 24/7 Scheduling & Dedicated API Support.\nFeel free to contact admin: +91 99430 42369 for enterprise inquiries!";
    }

    if (p.includes('voice') || p.includes('mic') || p.includes('speech') || p.includes('audio') || p.includes('ptt')) {
      return "Goye Voice Features:\n1. **Voice-to-Text**: Click the green 'Voice to Text' button next to the text box and speak into your mic to auto-type.\n2. **Blue Mic Voice Note (PTT)**: Upload any audio file (.mp3/.ogg) and Goye sends it as a genuine WhatsApp Push-To-Talk Voice Note!";
    }

    if (p.includes('hi') || p.includes('hello') || p.includes('hey') || p.includes('greetings')) {
      return "Hello! 👋 I'm Goye AI. How can I assist your WhatsApp broadcasting today?";
    }

    return "Thank you for reaching out! I'm Goye AI Assistant. I can help with connecting WhatsApp, bulk sending, multi-file limits, scheduling, and credits. If you need dedicated human support, feel free to contact admin: +91 99430 42369!";
  };

  const handleSend = async (customPrompt) => {
    const text = customPrompt || input;
    if (!text.trim()) return;

    const userMessage = { id: Date.now(), sender: 'user', text };
    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInput('');

    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(async () => {
      const botReplyText = await getAiResponse(text);
      const botMessage = { id: Date.now() + 1, sender: 'bot', text: botReplyText };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 700);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-28 sm:bottom-[138px] right-3 sm:right-6 left-3 sm:left-auto z-[150] w-[calc(100vw-1.5rem)] sm:w-[400px] max-w-[calc(100vw-1.5rem)] sm:max-w-[400px] bg-[#0D1117] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-fade-in-up text-white"
      style={{
        height: "min(460px, calc(100vh - 225px))",
        maxHeight: "calc(100vh - 225px)",
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* Scrollbar-hide utility style */}
      <style>{`
        .gy-no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .gy-no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>

      {/* ================= TOP HEADER ================= */}
      <div 
        className="bg-[#161B22] border-b border-white/[0.08] px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between shrink-0 relative z-[100] shadow-md select-none"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 pr-2 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center text-[#25D366] shrink-0 overflow-hidden p-1">
            <img
              src="/bot.gif"
              alt="Goye AI"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'block';
              }}
              className="w-full h-full object-contain select-none pointer-events-none"
            />
            <FaRobot style={{ display: 'none' }} className="text-base sm:text-lg" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-bold text-white leading-tight truncate">AI Assistant</h3>
            <p className="text-[10px] sm:text-[11px] text-[#9AA4AF] font-medium truncate">Powered by Goye AI</p>
          </div>
        </div>

        <button
          onClick={onClose}
          type="button"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/15 text-[#9AA4AF] hover:text-white flex items-center justify-center transition-all duration-200 shrink-0 cursor-pointer border border-white/10 relative z-[9999]"
          style={{ borderRadius: '50%', zIndex: 9999 }}
          title="Close AI Chat"
          aria-label="Close AI Chat"
        >
          <FiX size={16} className="sm:hidden" />
          <FiX size={18} className="hidden sm:block" />
        </button>
      </div>

      {/* ================= CHAT AREA ================= */}
      <div ref={chatAreaRef} className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-4 space-y-3 sm:space-y-4 bg-[#0D1117] gy-no-scrollbar overflow-x-hidden relative z-10">
        {messages.length === 0 ? (
          /* ================= WELCOME SCREEN ================= */
          <div className="flex flex-col items-center justify-start text-center p-1 sm:p-2 w-full pt-1 pb-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-b from-[#1b2733] to-[#0e1620] border-2 border-[#25D366]/40 flex items-center justify-center text-[#25D366] mb-2 sm:mb-3 shadow-[0_8px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(37,211,102,0.25)] shrink-0 overflow-hidden p-1">
              <img
                src="/bot.gif"
                alt="Goye AI"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'block';
                }}
                className="w-full h-full object-contain select-none pointer-events-none drop-shadow"
              />
              <FaRobot style={{ display: 'none' }} className="text-3xl sm:text-4xl text-[#25D366]" />
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-white mb-0.5 sm:mb-1">Hi, I'm Goye AI 👋</h2>
            <p className="text-[11px] sm:text-xs text-[#9AA4AF] max-w-[280px] mb-2.5 sm:mb-4 leading-relaxed">
              I can help you with everything related to Goye WhatsApp Bulk Messaging.
            </p>

            {/* Suggestion Cards */}
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5 w-full text-left">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(item.prompt)}
                  type="button"
                  className="bg-[#1C2128] border border-white/[0.08] hover:border-[#25D366]/40 hover:bg-[#161B22] p-2 sm:p-3 rounded-xl transition-all duration-200 group flex flex-col gap-0.5 sm:gap-1 hover:-translate-y-0.5 cursor-pointer min-w-0"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className="shrink-0 text-xs sm:text-sm">{item.icon}</span>
                    <span className="text-[11px] sm:text-xs font-semibold text-white group-hover:text-[#25D366] transition-colors truncate">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-[#9AA4AF] truncate">Click to ask</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ================= CONVERSATION MESSAGES ================= */
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] flex items-center justify-center text-xs shrink-0 mt-0.5">
                    <FaRobot />
                  </div>
                )}
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] whitespace-pre-line shadow-sm break-words [word-break:break-word] ${
                    msg.sender === 'user'
                      ? 'bg-[#25D366] text-white font-medium rounded-tr-none'
                      : 'bg-[#1C2128] border border-white/[0.08] text-white/90 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing Animation */}
            {isTyping && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] flex items-center justify-center text-xs shrink-0">
                  <FaRobot />
                </div>
                <div className="bg-[#1C2128] border border-white/[0.08] px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#25D366] animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-[#25D366] animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-[#25D366] animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ================= INPUT AREA ================= */}
      <div className="bg-[#161B22] border-t border-white/[0.08] p-2.5 sm:p-3 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-1.5 sm:gap-2 bg-[#0D1117] border border-white/[0.08] rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 focus-within:border-[#25D366] focus-within:ring-1 focus-within:ring-[#25D366]/30 transition-all"
        >
          <button
            type="button"
            className="text-[#9AA4AF] hover:text-white transition-colors p-1"
            title="Attach file (coming soon)"
          >
            <FiPaperclip size={16} />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about Goye..."
            className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder:text-[#9AA4AF]"
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="w-8 h-8 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] disabled:opacity-30 text-white flex items-center justify-center shrink-0 transition-all duration-200 shadow-sm cursor-pointer"
            title="Send message"
          >
            <FiSend size={14} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
