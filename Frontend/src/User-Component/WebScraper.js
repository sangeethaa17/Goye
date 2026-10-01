import React, { useState, useEffect, useRef } from "react";
import { FiSearch, FiMapPin, FiPhone, FiCheckCircle, FiCheck, FiX, FiLayers, FiActivity, FiRefreshCw } from "react-icons/fi";
import { FaBuilding, FaStar, FaDownload, FaPlay } from "react-icons/fa";
import io from "socket.io-client";
import * as XLSX from "xlsx";

export default function WebScraper() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [hasScrapped, setHasScrapped] = useState(false);
  const [scrapeFailed, setScrapeFailed] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "", message: "" });
  const [currentPage, setCurrentPage] = useState(1);

  // Page size for client-side pagination
  const PAGE_SIZE = 16;

  const [leadsData, setLeadsData] = useState([]);

  // ── Socket.IO for progressive scraping ────────────────────────────────────
  const socketRef = useRef(null);

  useEffect(() => {
    const socketUrl = window.location.hostname === "localhost"
      ? "http://localhost:5000"
      : (process.env.REACT_APP_API_URL || "https://goyeorg.onrender.com");

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true
    });
    socketRef.current = socket;

    // A new listing arrived — append immediately
    socket.on("scrape_lead", (lead) => {
      setLeadsData((prev) => {
        if (prev.some((l) => l.id === lead.id)) return prev; // guard duplicate
        return [...prev, lead];
      });
      setSelectedIds((prev) =>
        prev.includes(lead.id) ? prev : [...prev, lead.id] // auto-select
      );
      setHasScrapped(true);
      setScrapeFailed(false);
    });

    // Phone extracted for an already-displayed listing — update its row only
    socket.on("scrape_phone_update", ({ id, phone }) => {
      setLeadsData((prev) =>
        prev.map((l) => (l.id === id ? { ...l, phone } : l))
      );
    });

    // All listings collected and phones resolved
    socket.on("scrape_complete", ({ count }) => {
      setIsScraping(false);
      setHasScrapped(true);
      setScrapeFailed(false);
      setToast({
        show: true,
        type: "success",
        message: `🎉 Found ${count} real results from Google Maps!`
      });
      setTimeout(() => setToast({ show: false, type: "", message: "" }), 4000);
    });

    // Error from backend
    socket.on("scrape_error", ({ message }) => {
      setIsScraping(false);
      setHasScrapped(true);
      setScrapeFailed(true);
      setLeadsData([]);
      setToast({ show: true, type: "error", message: `❌ ${message}` });
      setTimeout(() => setToast({ show: false, type: "", message: "" }), 5000);
    });

    return () => socket.disconnect();
  }, []); // runs once on mount

  // Derived Entity Title (e.g. "SCHOOLS NAME")
  const getEntityTitle = () => {
    const q = searchQuery.trim();
    if (!q) return "PLACES NAME";
    const words = q.split(" ");
    return words[0].toUpperCase() + " NAME";
  };

  // 1. Checkbox Selection Logic
  const isAllSelected = leadsData.length > 0 && selectedIds.length === leadsData.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leadsData.map((item) => item.id));
    }
  };

  const toggleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // 2. Dynamic Filename Generator
  const generateFileName = (query) => {
    if (!query || !query.trim()) return "goye_scraped_leads.xlsx";
    const sanitized = query
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_");
    return `${sanitized || "goye_scraped_leads"}.xlsx`;
  };

  // 3. Excel (.xlsx) Export Handler
  const handleExportExcel = () => {
    if (selectedIds.length === 0 || isExporting) return;

    setIsExporting(true);

    try {
      // Filter only selected rows
      const selectedLeads = leadsData.filter((item) => selectedIds.includes(item.id));

      // Format Excel rows with exact specified headers
      const exportRows = selectedLeads.map((item, index) => ({
        "S.No": index + 1,
        "Business / Place Name": item.name,
        "Phone Number": item.phone,
        "Address": item.address,
        "Rating": item.rating
      }));

      // Create Worksheet & Workbook
      const worksheet = XLSX.utils.json_to_sheet(exportRows);

      // Auto-fit Column Widths for readability
      worksheet["!cols"] = [
        { wch: 8 },  // S.No
        { wch: 35 }, // Name
        { wch: 22 }, // Phone
        { wch: 45 }, // Address
        { wch: 10 }  // Rating
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

      // Generate dynamic filename
      const filename = generateFileName(searchQuery);

      // Download file
      XLSX.writeFile(workbook, filename);

      // Toast feedback
      setToast({
        show: true,
        type: "success",
        message: `✅ Exported ${selectedLeads.length} leads to ${filename}`
      });
      setTimeout(() => setToast({ show: false, type: "", message: "" }), 4000);
    } catch (err) {
      console.error("Export Error:", err);
      setToast({
        show: true,
        type: "error",
        message: "❌ Failed to export Excel file. Please try again."
      });
      setTimeout(() => setToast({ show: false, type: "", message: "" }), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleStartScrape = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setToast({ show: true, type: "error", message: "⚠️ Please enter a search query!" });
      setTimeout(() => setToast({ show: false, type: "", message: "" }), 3000);
      return;
    }
    if (!socketRef.current) return;

    // Clear previous results
    setLeadsData([]);
    setSelectedIds([]);
    setHasScrapped(false);
    setScrapeFailed(false);
    setCurrentPage(1);
    setIsScraping(true);

    // Emit to backend — results stream back via scrape_lead events
    socketRef.current.emit("start_scrape", {
      query: searchQuery,
      location: locationQuery
    });
  };

  // ── Pagination computed values ──
  const totalPages = Math.max(1, Math.ceil(leadsData.length / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;          // 0-based index
  const pagedData = leadsData.slice(pageStart, pageStart + PAGE_SIZE);
  const showingFrom = leadsData.length === 0 ? 0 : pageStart + 1;
  const showingTo   = Math.min(pageStart + PAGE_SIZE, leadsData.length);

  // Build page-number array with ellipsis: always show 1, last, and current ±2
  const buildPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set([1, totalPages]);
    for (let p = Math.max(1, currentPage - 2); p <= Math.min(totalPages, currentPage + 2); p++) pages.add(p);
    const sorted = [...pages].sort((a, b) => a - b);
    const result = [];
    sorted.forEach((p, i) => {
      if (i > 0 && p - sorted[i - 1] > 1) result.push('...');
      result.push(p);
    });
    return result;
  };

  return (
    <div
      className="min-h-screen w-full bg-[#212122] py-8 sm:py-12 px-3 sm:px-6 md:px-8 pb-28 sm:pb-12 text-white relative overflow-x-hidden"
      style={{
        fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif"
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes gyFloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-14px); } }
      `}</style>

      {/* Ambient background glows */}
      <div className="absolute top-0 left-4 sm:left-20 w-48 h-48 sm:w-80 sm:h-80 bg-[#25D366] rounded-full mix-blend-screen filter blur-3xl opacity-[0.09]" style={{ animation: "gyFloat 9s ease-in-out infinite" }}></div>
      <div className="absolute bottom-20 right-4 sm:right-20 w-56 h-56 sm:w-96 sm:h-96 bg-[#128C7E] rounded-full mix-blend-screen filter blur-3xl opacity-[0.12]" style={{ animation: "gyFloat 11s ease-in-out infinite", animationDelay: "2s" }}></div>

      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-5 right-5 z-[200] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-bold border transition-all animate-bounce backdrop-blur-xl max-w-[calc(100vw-2.5rem)] ${
            toast.type === "success"
              ? "bg-[#111B21]/95 border-[#25D366] text-[#25D366] shadow-[0_0_30px_rgba(37,211,102,0.35)]"
              : "bg-[#111B21]/95 border-red-500 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.35)]"
          }`}
        >
          {toast.type === "success" ? <FiCheck size={18} className="shrink-0" /> : <FiX size={18} className="shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">

        {/* Header Title */}
        <div className="text-center mb-10 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[100px] bg-[#25D366]/20 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#25D366]/20 to-[#128C7E]/20 border border-[#25D366]/30 text-[#25D366] text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_15px_rgba(37,211,102,0.2)] animate-pulse">
            <FiLayers size={14} className="animate-bounce" /> Real-Time Lead Discovery
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#25D366] via-emerald-200 to-[#128C7E] drop-shadow-[0_0_25px_rgba(37,211,102,0.3)]">
            Google Maps Web Scraper
          </h1>
          <p className="text-white/60 mt-2 text-sm sm:text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            Instantly search local businesses, extract <span className="text-[#25D366]">verified phone numbers</span>, addresses, and export them directly to Excel with a single click.
          </p>
        </div>
        
        {/* ================= DYNAMIC SEARCH CONTROLS ================= */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <form onSubmit={handleStartScrape} className="flex flex-col lg:flex-row items-center gap-3.5">
            
            {/* Search Query Input */}
            <div className="relative flex-1 w-full">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#25D366] text-lg" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Business or Place (e.g. Hospitals, Schools, Restaurants)"
                className="w-full pl-11 pr-4 py-3.5 bg-[#121A16] border border-[#1E2822] rounded-xl sm:rounded-2xl text-sm text-white placeholder:text-white/30 outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all font-medium"
              />
            </div>

            {/* Location Input */}
            <div className="relative flex-1 w-full">
              <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#25D366] text-lg" />
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="City or Area (e.g. Chennai, Madurai, Coimbatore)"
                className="w-full pl-11 pr-4 py-3.5 bg-[#121A16] border border-[#1E2822] rounded-xl sm:rounded-2xl text-sm text-white placeholder:text-white/30 outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all font-medium"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0">
              {/* Start Scraping Button */}
              <button
                type="submit"
                disabled={isScraping}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl sm:rounded-2xl font-extrabold text-sm text-black flex items-center justify-center gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_4px_20px_rgba(37,211,102,0.35)] cursor-pointer disabled:opacity-50 whitespace-nowrap bg-gradient-to-r from-[#25D366] to-[#128C7E]"
              >
                {isScraping ? (
                  <FiRefreshCw className="animate-spin text-sm" />
                ) : (
                  <FaPlay className="text-xs" />
                )}
                <span>{isScraping ? "Scraping..." : "Start Scraping"}</span>
              </button>

              {/* Export Selected to Excel Button */}
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={leadsData.length === 0 || selectedIds.length === 0 || isExporting}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95 bg-white/5 hover:bg-white/10 border border-white/10 shadow-md cursor-pointer disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <FaDownload className={`text-xs ${isExporting ? "animate-bounce text-[#25D366]" : "text-[#25D366]"}`} />
                <span>{isExporting ? "Exporting..." : `Export Selected (${selectedIds.length})`}</span>
              </button>
            </div>

          </form>
        </div>

        {/* ================= LIVE METRIC CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          
          {/* Card 1: Places Found */}
          <div className="bg-[#121A16]/80 border border-white/5 hover:border-[#25D366]/50 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_40px_rgba(37,211,102,0.15)] backdrop-blur-xl relative overflow-hidden group transition-all duration-500 hover:-translate-y-2 cursor-default">
            <div className="absolute inset-0 bg-gradient-to-br from-[#25D366]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-bold text-white/50 mb-1 uppercase tracking-widest group-hover:text-[#25D366] transition-colors">
                  {leadsData.length} {searchQuery.trim().split(" ")[0] || "Places"} Found
                </p>
                <h3 className="text-4xl font-extrabold text-white tracking-tight group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all">{leadsData.length}</h3>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] text-2xl shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                <FaBuilding />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-transparent via-[#25D366] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* Card 2: Phones Extracted */}
          <div className="bg-[#121A16]/80 border border-white/5 hover:border-[#25D366]/50 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_40px_rgba(37,211,102,0.15)] backdrop-blur-xl relative overflow-hidden group transition-all duration-500 hover:-translate-y-2 cursor-default">
            <div className="absolute inset-0 bg-gradient-to-br from-[#25D366]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-bold text-white/50 mb-1 uppercase tracking-widest group-hover:text-[#25D366] transition-colors">
                  Phones Extracted
                </p>
                <h3 className="text-4xl font-extrabold text-white tracking-tight group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all">
                  {leadsData.filter(l => l.phone).length}
                </h3>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] text-2xl shadow-inner group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
                <FiPhone />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-transparent via-[#25D366] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* Card 3: Status */}
          <div className={`bg-white/[0.03] rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group transition-all duration-300 border ${
            scrapeFailed
              ? "border-red-500/40 hover:border-red-500"
              : isScraping
              ? "border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.15)]"
              : "border-white/10 hover:border-[#25D366]/40"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white/50 mb-2">Scraping Status</p>
                {!hasScrapped && !isScraping && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/5 text-white/60 border border-white/10">
                    ⏸ Idle
                  </span>
                )}
                {isScraping && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 animate-pulse">
                    <FiRefreshCw className="animate-spin text-xs" /> Scraping...
                  </span>
                )}
                {hasScrapped && !isScraping && !scrapeFailed && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 shadow-sm">
                    <FiCheckCircle className="text-sm" /> Complete
                  </span>
                )}
                {hasScrapped && !isScraping && scrapeFailed && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30 shadow-sm">
                    <FiX className="text-sm" /> Failed
                  </span>
                )}
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner border ${
                scrapeFailed
                  ? "bg-red-500/15 border-red-500/30 text-red-400"
                  : isScraping
                  ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-400"
                  : "bg-[#25D366]/10 border-[#25D366]/20 text-[#25D366]"
              }`}>
                {scrapeFailed ? <FiX /> : isScraping ? <FiActivity className="animate-pulse" /> : <FiCheckCircle />}
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-[#25D366]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

        </div>

        {/* ================= HIGH-CONTRAST DARK DATA TABLE ================= */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl overflow-hidden">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {/* Sticky Table Header */}
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10 text-[11px] font-extrabold text-white/50 tracking-wider uppercase backdrop-blur-md">
                  <th className="py-4 px-4 w-12 text-center">#</th>
                  <th className="py-4 px-4">{getEntityTitle()}</th>
                  <th className="py-4 px-4 whitespace-nowrap min-w-[160px]" style={{ whiteSpace: "nowrap", wordBreak: "normal", overflowWrap: "normal" }}>PHONE NUMBER</th>
                  <th className="py-4 px-4">ADDRESS</th>
                  <th className="py-4 px-4 w-28 text-center">RATING</th>
                  <th className="py-4 px-4 w-32 text-right">
                    <div
                      onClick={toggleSelectAll}
                      className="inline-flex items-center gap-2 cursor-pointer select-none group"
                    >
                      <span className="text-[11px] font-bold text-white/70 group-hover:text-white transition-colors">
                        SELECT ALL
                      </span>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                          isAllSelected
                            ? "bg-[#25D366] border-[#25D366] text-black shadow-[0_0_12px_rgba(37,211,102,0.8)]"
                            : "border-white/30 bg-transparent text-transparent hover:border-[#25D366]"
                        }`}
                      >
                        ✓
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-white/5">
                {leadsData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center text-[#25D366] text-2xl mb-1">
                          {isScraping ? <FiRefreshCw className="animate-spin" /> : scrapeFailed ? <FiX /> : <FiSearch />}
                        </div>
                        <p className="text-white font-bold text-sm sm:text-base">
                          {isScraping
                            ? "Searching Google Maps for real listings..."
                            : hasScrapped
                            ? "No listings found. Try a different search or location."
                            : "Search for a place and location to discover real Google Maps listings."}
                        </p>
                        {!isScraping && !hasScrapped && (
                          <p className="text-white/40 text-xs max-w-sm mx-auto">
                            e.g. Type "Hospitals in Chennai", "Schools in Sattur", "Hotels in Madurai"
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : pagedData.map((lead, index) => {
                  const isSelected = selectedIds.includes(lead.id);
                  const globalIndex = pageStart + index + 1; // correct row number across pages
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => toggleSelectRow(lead.id)}
                      className={`h-[62px] transition-all duration-200 cursor-pointer select-none ${
                        isSelected
                          ? "bg-[#25D366]/[0.08] hover:bg-[#25D366]/[0.12]"
                          : "hover:bg-white/[0.03]"
                      }`}
                    >
                      {/* Row Index — global position across all pages */}
                      <td className="py-3 px-4 text-xs font-semibold text-white/40 text-center">
                        {globalIndex}
                      </td>

                      {/* Business / Place Name */}
                      <td className="py-3 px-4 text-sm font-bold text-white">
                        <span className="hover:text-[#25D366] transition-colors">{lead.name}</span>
                      </td>

                      {/* Phone Number */}
                      <td className="py-3 px-4 whitespace-nowrap min-w-[160px]" style={{ whiteSpace: "nowrap", wordBreak: "normal", overflowWrap: "normal" }}>
                        {lead.phone ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20">
                            <FiPhone size={11} /> {lead.phone}
                          </span>
                        ) : (
                          <span className="text-xs text-white/30 italic">No phone found</span>
                        )}
                      </td>

                      {/* Address */}
                      <td className="py-3 px-4 text-xs text-white/70 font-medium max-w-xs truncate">
                        {lead.address || "—"}
                      </td>

                      {/* Rating */}
                      <td className="py-3 px-4 text-center">
                        {lead.rating && lead.rating !== "No reviews" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-300">
                            {lead.rating} <FaStar className="text-amber-400 text-[10px]" />
                          </span>
                        ) : (
                          <span className="text-xs text-white/30 italic">No reviews</span>
                        )}
                      </td>

                      {/* Checkbox Selection */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex justify-end pr-2">
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-bold transition-all ${
                              isSelected
                                ? "bg-[#25D366] border-[#25D366] text-black shadow-[0_0_10px_rgba(37,211,102,0.8)]"
                                : "border-white/30 bg-transparent text-transparent hover:border-[#25D366]"
                            }`}
                          >
                            ✓
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ================= PAGINATION ================= */}
          <div className="bg-white/[0.02] px-6 py-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-medium text-white/50">
              {leadsData.length === 0
                ? "No results"
                : `Showing ${showingFrom}-${showingTo} of ${leadsData.length} results`}
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                {/* Prev button */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  Prev
                </button>

                {/* Dynamic page number buttons */}
                {buildPageNumbers().map((item, i) =>
                  item === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-white/40 text-xs select-none">…</span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCurrentPage(item)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentPage === item
                          ? "bg-[#25D366] text-black shadow-[0_0_15px_rgba(37,211,102,0.5)]"
                          : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

                {/* Next button */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
