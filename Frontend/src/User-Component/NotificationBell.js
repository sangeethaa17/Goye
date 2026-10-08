import React, { useState, useRef, useEffect } from 'react';
import { FiBell, FiCheckCircle, FiXCircle, FiCheck, FiX } from 'react-icons/fi';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationBell({ isMobileMenu, onMobileClose }) {
  const { notifications, unreadCount, markAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && unreadCount > 0) {
      markAsRead();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + 
      ' • ' + 
      d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={isMobileMenu ? "w-full" : "relative"} ref={dropdownRef}>
      {/* Bell Button with Unread Badge */}
      {isMobileMenu ? (
        <button
          onClick={handleToggle}
          type="button"
          className="gy-link-in relative flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full font-semibold transition-all duration-300 active:scale-95 cursor-pointer"
          style={{
            border: "2px solid rgba(52,227,138,0.3)",
            backgroundColor: "rgba(52,227,138,0.14)",
            color: "#6CFFB0",
          }}
          title="Notifications"
        >
          <FiBell size={18} />
          <span>Notification</span>
          {unreadCount > 0 && (
            <span className="ml-1.5 bg-[#25D366] text-black text-[10px] font-black px-2 py-0.5 rounded-full border border-[#07100C] animate-bounce shadow-sm">
              {unreadCount}
            </span>
          )}
        </button>
      ) : (
        <button
          onClick={handleToggle}
          type="button"
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110 relative group cursor-pointer"
          style={{
            backgroundColor: "rgba(52,227,138,0.14)",
            color: "#6CFFB0",
            border: "1px solid rgba(52,227,138,0.3)",
          }}
          title="Notifications"
        >
          <FiBell size={18} className="transition-transform group-hover:rotate-12" />
          
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#25D366] text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#07100C] animate-bounce shadow-[0_0_10px_rgba(37,211,102,0.8)]">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Notification Dropdown Menu */}
      {isOpen && (
        <div 
          className={`mt-2 sm:mt-3 bg-[#0E1613] border border-[#25D366]/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden z-50 text-left backdrop-blur-xl animate-scaleUp ${
            isMobileMenu
              ? 'w-full relative'
              : 'fixed sm:absolute left-2.5 right-2.5 sm:left-auto sm:right-0 top-16 sm:top-auto sm:w-96 max-w-sm sm:max-w-none mx-auto sm:mx-0'
          }`}
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          {/* Header */}
          <div className="px-5 py-3.5 bg-[#121A16] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
              <span className="text-xs font-bold text-white uppercase tracking-wider font-['Space_Grotesk']">NOTIFICATIONS</span>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAsRead}
                className="text-[11px] font-bold text-[#6CFFB0] hover:text-white transition-colors flex items-center gap-1"
              >
                <FiCheck size={12} /> Mark all as read
              </button>
            )}
          </div>

          {/* List Content with hidden scrollbar */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-white/40 font-medium">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => {
                const isRejected = n.type === 'request_rejected';
                return (
                  <div
                    key={n._id}
                    className={`p-4 transition-all duration-200 relative group ${
                      !n.read ? 'bg-[#25D366]/10 border-l-4 border-l-[#25D366]' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isRejected ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30'
                        }`}>
                          {isRejected ? <FiXCircle size={16} /> : <FiCheckCircle size={16} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          {n.title && (
                            <p className={`text-xs font-bold mb-0.5 ${isRejected ? 'text-red-400' : 'text-[#6CFFB0]'}`}>
                              {n.title}
                            </p>
                          )}
                          <p className="text-xs font-medium text-white/90 leading-relaxed">
                            {n.message}
                          </p>
                          <p className="text-[10px] font-mono text-white/40 mt-1.5 flex items-center gap-1">
                            {formatDate(n.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Small X Close Button Aligned to Far Right */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(n._id);
                        }}
                        className="text-white/30 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all shrink-0 cursor-pointer ml-2"
                        title="Dismiss notification"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
