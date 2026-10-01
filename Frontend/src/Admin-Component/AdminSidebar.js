import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, LogOut, Menu, X, ChevronLeft, ChevronRight, FileText, UserCheck
} from 'lucide-react';

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("admin_isLoggedIn");
    localStorage.removeItem("admin_username");
    window.dispatchEvent(new Event("loginStatusChanged"));
    navigate("/goye-admin-login");
  };

  const navLinks = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/goye-admin-dashboard" },
    { name: "Subscribed Users", icon: Users, path: "/goye-admin-users" },
    { name: "Free Users", icon: UserCheck, path: "/goye-admin-free-users" },
    { name: "Requests", icon: FileText, path: "/adminrequest" },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full text-white">
      {/* Logo Area */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-6'} h-20 border-b border-white/10`}>
        <div 
          onClick={() => navigate("/goye-admin-dashboard")}
          className={`flex items-center gap-3 cursor-pointer ${collapsed ? 'hidden' : 'flex'}`}
        >
          <img
            src="/Goye.png"
            alt="Goye Logo"
            className="w-10 h-10 object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
          />
          <span className="text-xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #6CFFB0, #34E38A)" }}>
            Goye
          </span>
        </div>
        {collapsed && (
          <div 
            onClick={() => navigate("/goye-admin-dashboard")}
            className="cursor-pointer flex items-center justify-center"
          >
            <img
              src="/Goye.png"
              alt="Goye Logo"
              className="w-10 h-10 object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
            />
          </div>
        )}
      </div>

      {/* Nav Links */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <button
              key={link.name}
              onClick={() => navigate(link.path)}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-start'} px-3 py-3 rounded-xl transition-all duration-300 group`}
              style={{
                backgroundColor: isActive ? 'rgba(52,227,138,0.15)' : 'transparent',
                color: isActive ? '#6CFFB0' : '#A7F3D0',
                borderLeft: isActive ? '3px solid #34E38A' : '3px solid transparent',
              }}
              title={collapsed ? link.name : ""}
            >
              <link.icon size={22} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'} group-hover:text-white`} />
              {!collapsed && (
                <span className={`ml-3 font-semibold transition-colors duration-300 ${isActive ? 'text-white' : 'group-hover:text-white'}`}>
                  {link.name}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-start px-4'} py-3 rounded-xl transition-all duration-300 text-red-400 hover:bg-red-500/10 hover:text-red-300`}
          title={collapsed ? "Logout" : ""}
        >
          <LogOut size={22} />
          {!collapsed && <span className="ml-3 font-semibold">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button 
        onClick={() => setMobileOpen(true)}
        className="md:hidden absolute top-4 left-4 z-50 p-2 rounded-lg bg-[#064e3b] text-white shadow-lg"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 left-0 h-screen z-50 transition-all duration-300 ease-in-out flex flex-col shadow-2xl`}
        style={{
          width: collapsed ? '80px' : '260px',
          background: "linear-gradient(180deg, #022c22 0%, #064e3b 100%)",
          transform: `translateX(${mobileOpen ? '0' : '-100%'})`,
        }}
        // Add a media query style to override transform on desktop
        ref={(node) => {
          if (node) {
            node.style.setProperty('@media (min-width: 768px)', '{ transform: translateX(0) !important; }');
          }
        }}
      >
        <style>{`
          @media (min-width: 768px) {
            aside { transform: translateX(0) !important; }
          }
        `}</style>
        
        {/* Mobile Close Button */}
        {mobileOpen && (
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden absolute top-6 right-4 text-white/70 hover:text-white"
          >
            <X size={24} />
          </button>
        )}

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-3 top-24 w-6 h-6 bg-[#34E38A] rounded-full items-center justify-center text-[#022c22] shadow-lg hover:scale-110 transition-transform"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <SidebarContent />
      </aside>

      {/* Global CSS to push the main content depending on sidebar state (for desktop only) */}
      <style>{`
        @media (min-width: 768px) {
          .admin-main-content {
            margin-left: ${collapsed ? '80px' : '260px'};
            transition: margin-left 0.3s ease-in-out;
          }
        }
      `}</style>
    </>
  );
}
