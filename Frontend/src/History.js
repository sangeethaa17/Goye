import React, { useState, useEffect, useCallback } from "react";
import { FaSearch, FaSyncAlt, FaHistory } from "react-icons/fa";
import { API_BASE_URL } from "./config";

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
  rowBorder: "#182019",
  fail: "#F87171",
};

// Backend base URL — keep in sync with the rest of the app
const API_BASE = API_BASE_URL || "https://goye.onrender.com";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const RETENTION_LABEL = "7 days"; // PRODUCTION mode

export default function History() {
  const email = typeof window !== "undefined"
    ? localStorage.getItem("email") ||
      localStorage.getItem("userEmail") ||
      (localStorage.getItem("user") && (() => { try { return JSON.parse(localStorage.getItem("user"))?.email; } catch(e) { return ""; } })()) ||
      ""
    : "";

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [overallCount, setOverallCount] = useState(null);

  const fetchHistory = useCallback(async () => {
    if (!email) {
      setError("No logged-in user found.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ email });
      if (search.trim()) params.set("search", search.trim());
      if (status !== "All") params.set("status", status);

      const res = await fetch(`${API_BASE}/api/history?${params.toString()}`);
      if (!res.ok) {
        setRecords([]);
        return;
      }
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setRecords(data.records || []);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.warn("History fetch notice:", err.message);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [email, search, status]);

  const fetchOverallCount = useCallback(async () => {
    if (!email) return;
    try {
      const res = await fetch(`${API_BASE}/api/user/total-sent?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setOverallCount(data.totalSent || 0);
        }
      }
    } catch (err) {
      console.error("Failed to load overall message count:", err);
    }
  }, [email]);

  const refreshAll = useCallback(() => {
    fetchHistory();
    fetchOverallCount();
  }, [fetchHistory, fetchOverallCount]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    fetchOverallCount();
  }, [fetchOverallCount]);

  const AUTO_REFRESH_INTERVAL_MS = 30 * 1000;
  useEffect(() => {
    const id = setInterval(() => {
      refreshAll();
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refreshAll]);

  const fieldLabel = { fontSize: "0.8rem", color: C.muted };

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: C.void }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${C.green}, ${C.greenDeep})` }}
            >
              <FaHistory color="#fff" size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: C.text }}>
                Message History
              </h1>
              <p className="text-xs" style={{ color: C.muted }}>
                Records are kept for {RETENTION_LABEL}, then removed automatically
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex flex-col items-end px-3 py-2 rounded-lg"
              style={{ background: C.panel, border: `1px solid ${C.panelBorder}` }}
              title="Permanent cumulative count — not affected by the 7-day history cleanup"
            >
              <span className="text-[0.65rem] uppercase tracking-wide" style={{ color: C.muted }}>
                Overall Message Count
              </span>
              <span className="text-lg font-semibold leading-tight" style={{ color: C.green }}>
                {overallCount === null ? "0" : overallCount.toLocaleString()}
              </span>
            </div>

            <button
              onClick={refreshAll}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-transform hover:scale-105"
              style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, color: C.text }}
            >
              <FaSyncAlt size={12} /> Refresh
            </button>
          </div>
        </div>

        <div
          className="rounded-2xl p-4 mb-4 flex flex-wrap gap-3 items-end"
          style={{ background: C.panel, border: `1px solid ${C.panelBorder}` }}
        >
          <div className="flex-1 min-w-[200px]">
            <label style={fieldLabel}>Search (phone or message)</label>
            <div className="relative mt-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2" size={13} style={{ color: C.muted }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full pl-9 pr-3 py-2 rounded-lg outline-none text-sm"
                style={{ background: C.inputBg, border: `1px solid ${C.inputBorder}`, color: C.text }}
              />
            </div>
          </div>

          <div>
            <label style={fieldLabel}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg outline-none text-sm"
              style={{ background: C.inputBg, border: `1px solid ${C.inputBorder}`, color: C.text }}
            >
              <option value="All">All</option>
              <option value="Sent">Sent</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <div className="text-sm px-3 py-2 rounded-lg" style={{ color: C.muted }}>
            {records.length} record{records.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: C.panel, border: `1px solid ${C.panelBorder}` }}>
          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: C.muted }}>
              Loading history…
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm" style={{ color: C.fail }}>
              {error}
            </div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: C.muted }}>
              No message history in the last {RETENTION_LABEL}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.rowBorder}` }}>
                    {["Phone Number", "Message", "Date", "Time", "Status", "Device"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: C.muted }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r._id || r.id} style={{ borderBottom: `1px solid ${C.rowBorder}` }}>
                      <td className="px-4 py-3" style={{ color: C.text }}>{r.phone}</td>
                      <td className="px-4 py-3 max-w-xs truncate" style={{ color: C.text }} title={r.message}>
                        {r.message || "—"}
                      </td>
                      <td className="px-4 py-3" style={{ color: C.muted }}>{formatDate(r.sentAt || r.createdAt)}</td>
                      <td className="px-4 py-3" style={{ color: C.muted }}>{formatTime(r.sentAt || r.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background: r.status === "Sent" ? "rgba(37,211,102,0.14)" : "rgba(248,113,113,0.14)",
                            color: r.status === "Sent" ? C.green : C.fail,
                          }}
                        >
                          {r.status || "Sent"}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: C.muted }}>{r.deviceName || "Goye Web"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
