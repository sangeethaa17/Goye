import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { FiSearch, FiUsers, FiUser, FiDownload, FiRefreshCw, FiWifiOff, FiPhone, FiUpload, FiX, FiExternalLink, FiCheckCircle } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import * as XLSX from "xlsx";
import { socket as whatsappSocket } from "./WhatsAppAuth";

const API_BASE = (process.env.REACT_APP_API_URL || "https://goyeorg.onrender.com").replace(/\/+$/, "");

function splitCombinedPhoneNumbers(rawVal) {
  if (!rawVal) return [];
  const rawParts = String(rawVal).split(/[/,;:\n\r|&]+|\s{2,}|(?<=\d)\s*[\/|\\]\s*(?=\d)|(?<=\d)\+(?=\d)/);
  const results = [];
  for (const part of rawParts) {
    if (!part) continue;
    let digits = String(part).replace(/\D/g, "");
    if (!digits) continue;
    if (digits.startsWith("0") && digits.length > 10) digits = digits.replace(/^0+/, "");
    
    // If two 10-digit mobile numbers are stuck together (20 digits, e.g. 63691472726385285298)
    if (digits.length === 20 && /^[6-9]/.test(digits)) {
      results.push(digits.slice(0, 10), digits.slice(10));
    } 
    // If two 12-digit Indian numbers with 91 prefix are stuck together (24 digits: 91XXXXXXXXXX91XXXXXXXXXX)
    else if (digits.length === 24 && digits.startsWith("91") && digits.slice(12).startsWith("91")) {
      results.push(digits.slice(0, 12), digits.slice(12));
    } 
    // If 10-digit and 12-digit numbers are stuck together (22 digits, e.g. 9566664533 + 919566664533)
    else if (digits.length === 22) {
      if (digits.slice(10).startsWith("91")) {
        results.push(digits.slice(0, 10), digits.slice(10));
      } else if (digits.startsWith("91")) {
        results.push(digits.slice(0, 12), digits.slice(12));
      } else {
        results.push(digits);
      }
    } 
    else if (digits.length >= 7 && digits.length <= 15) {
      results.push(digits);
    }
  }
  return Array.from(new Set(results));
}

function cleanAndNormalizeContactList(list) {
  const map = new Map();
  (list || []).forEach((c) => {
    if (!c) return;
    const rawNumber = c.number || (c.id ? c.id.split('@')[0] : "");
    const splitNums = splitCombinedPhoneNumbers(rawNumber);

    if (splitNums.length > 0) {
      splitNums.forEach((num) => {
        if (!map.has(num)) {
          let cleanName = (c.name && c.name !== rawNumber) ? c.name : `+${num}`;
          if (cleanName.includes("+") && cleanName.length > 18) {
            cleanName = `+${num}`;
          }
          map.set(num, {
            id: `${num}@s.whatsapp.net`,
            name: cleanName,
            notify: c.notify || "",
            number: num,
            isBusiness: !!c.isBusiness,
            isSavedContact: !!c.isSavedContact
          });
        }
      });
    } else if (rawNumber && rawNumber.length >= 7 && rawNumber.length <= 15) {
      if (!map.has(rawNumber)) {
        map.set(rawNumber, {
          ...c,
          id: `${rawNumber}@s.whatsapp.net`,
          number: rawNumber
        });
      }
    }
  });
  return Array.from(map.values());
}

export default function GroupManagement() {
  const socketRef = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const contactTimeoutRef = useRef(null);

  const [activeTab, setActiveTab] = useState("groups"); // "groups" | "contacts"
  const [connected, setConnected] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Groups state
  const [groups, setGroups] = useState([]);
  const [groupsFetched, setGroupsFetched] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState(new Set());
  const [searchGroup, setSearchGroup] = useState("");

  // Contacts state
  const [contacts, setContacts] = useState([]);
  const [contactsFetched, setContactsFetched] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState(new Set());
  const [searchContact, setSearchContact] = useState("");

  // Global actions
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const clearGroupWatchdog = () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  };

  const clearContactWatchdog = () => {
    if (contactTimeoutRef.current) {
      clearTimeout(contactTimeoutRef.current);
      contactTimeoutRef.current = null;
    }
  };

  const fetchGroups = useCallback(() => {
    if (!socketRef.current) return;
    clearGroupWatchdog();
    setGroupsFetched(false);
    setLoadingGroups(true);
    setError("");
    setSuccessMsg("");
    const email = localStorage.getItem("email") || localStorage.getItem("userEmail") || localStorage.getItem("freeUserEmail");
    console.log("Fetching WhatsApp groups for:", email);
    socketRef.current.emit("get_groups", { email });
    loadingTimeoutRef.current = setTimeout(() => {
      setLoadingGroups(false);
      setGroupsFetched(true);
      setError("Unable to fetch WhatsApp groups.");
    }, 30000);
  }, []);

  const fetchContacts = useCallback((force = false) => {
    if (!socketRef.current) return;
    clearContactWatchdog();
    setContactsFetched(false);
    setLoadingContacts(true);
    setError("");
    setSuccessMsg("");
    const email = localStorage.getItem("email") || localStorage.getItem("userEmail") || localStorage.getItem("freeUserEmail");
    console.log("Fetching WhatsApp contacts for:", email, "forceRefresh:", force);
    socketRef.current.emit("get_contacts", { email, forceRefresh: force });

    // Fallback REST call if socket doesn't respond
    contactTimeoutRef.current = setTimeout(async () => {
      try {
        if (email) {
          const res = await fetch(`${API_BASE}/api/contacts?email=${encodeURIComponent(email)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.contacts)) {
              setContacts(data.contacts);
              setContactsFetched(true);
              setLoadingContacts(false);
              return;
            }
          }
        }
      } catch (_) {}
      setLoadingContacts(false);
      setContactsFetched(true);
    }, 12000);
  }, []);

  const fileInputRef = useRef(null);
  const [importingContacts, setImportingContacts] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleModalTab, setGoogleModalTab] = useState("quick"); // "quick" | "api"
  const [googleSyncLoading, setGoogleSyncLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(process.env.REACT_APP_GOOGLE_CLIENT_ID || "");
  const [manualGoogleToken, setManualGoogleToken] = useState("");

  const fetchGoogleContactsWithToken = async (accessToken) => {
    if (!accessToken) return;
    setGoogleSyncLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const email = localStorage.getItem("email") || localStorage.getItem("userEmail") || localStorage.getItem("freeUserEmail");
      const res = await fetch(`${API_BASE}/api/google-contacts/fetch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, accessToken })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`🎉 Successfully fetched & imported ${data.importedCount} contacts from Google Contacts!`);
        if (Array.isArray(data.contacts)) {
          setContacts(data.contacts);
          setContactsFetched(true);
        }
        setShowGoogleModal(false);
      } else {
        setError(data.message || "Failed to fetch Google contacts.");
      }
    } catch (err) {
      console.error("Google Contacts fetch error:", err);
      setError("Error syncing Google contacts: " + err.message);
    } finally {
      setGoogleSyncLoading(false);
    }
  };

  const handleGoogle1ClickAuth = () => {
    setError("");
    setSuccessMsg("");
    
    const launchOAuth = () => {
      try {
        if (!window.google?.accounts?.oauth2) {
          setError("Google Identity Services script is still loading. Please try again in 2 seconds.");
          return;
        }

        const clientId = googleClientId.trim() || process.env.REACT_APP_GOOGLE_CLIENT_ID;
        if (!clientId) {
          setError("Google Client ID is required for direct browser popup. Enter your Client ID or use the 1-click Quick Google Cloud Export below!");
          return;
        }

        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "https://www.googleapis.com/auth/contacts.readonly",
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              setError("Google authentication failed: " + tokenResponse.error);
              return;
            }
            if (tokenResponse.access_token) {
              await fetchGoogleContactsWithToken(tokenResponse.access_token);
            }
          }
        });

        tokenClient.requestAccessToken({ prompt: "consent" });
      } catch (authErr) {
        console.error("Google Auth error:", authErr);
        setError("Google Auth initialization error: " + authErr.message);
      }
    };

    if (window.google?.accounts?.oauth2) {
      launchOAuth();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = launchOAuth;
      script.onerror = () => setError("Failed to load Google Identity Services library. Please check your internet connection.");
      document.body.appendChild(script);
    }
  };

  const handleImportPhoneContacts = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingContacts(true);
    setError("");
    setSuccessMsg("");

    try {
      const fileName = file.name.toLowerCase();
      let parsedContacts = [];

      if (fileName.endsWith(".vcf")) {
        const text = await file.text();
        const vcards = text.split(/BEGIN:VCARD/i).slice(1);
        for (const card of vcards) {
          const fnMatch = card.match(/FN[^\n\r:]*:(.+)/i);
          const name = fnMatch ? fnMatch[1].trim() : "";
          const telMatches = [...card.matchAll(/TEL[^\n\r:]*:(.+)/gi)];
          for (const tm of telMatches) {
            const raw = tm[1].replace(/[^\d+]/g, "").trim();
            if (raw && raw.length >= 7) {
              parsedContacts.push({ name: name || raw, number: raw });
            }
          }
        }
      } else {
        // Universal Excel / CSV parser (handles Google Contacts CSV, Outlook CSV, standard phone CSV)
        let rows = [];
        if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
          const arrayBuffer = await file.arrayBuffer();
          const wb = XLSX.read(arrayBuffer, { type: "array" });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        } else {
          const text = await file.text();
          // Use XLSX to parse CSV/TSV correctly handling commas and quotes in names
          const wb = XLSX.read(text, { type: "string" });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        }

        if (rows && rows.length > 1) {
          const headers = rows[0].map(h => String(h || "").toLowerCase().trim());
          
          // Detect all phone columns (Google CSV has 'Phone 1 - Value', 'Phone 2 - Value', etc.)
          const phoneIndices = [];
          let nameIdx = -1;
          let firstNameIdx = -1;
          let lastNameIdx = -1;

          headers.forEach((col, idx) => {
            if (col.includes("phone") || col.includes("mobile") || col.includes("cell") || col.includes("contact") || col.includes("tel")) {
              phoneIndices.push(idx);
            }
            if (col === "name" || col.includes("full name") || col.includes("display name")) {
              nameIdx = idx;
            }
            if (col.includes("given name") || col.includes("first name")) {
              firstNameIdx = idx;
            }
            if (col.includes("family name") || col.includes("last name")) {
              lastNameIdx = idx;
            }
          });

          // Fallback if no specific phone column detected
          if (phoneIndices.length === 0) {
            phoneIndices.push(1 < headers.length ? 1 : 0);
          }

          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !Array.isArray(row)) continue;

            let contactName = "";
            if (nameIdx !== -1 && row[nameIdx]) {
              contactName = String(row[nameIdx]).trim();
            } else {
              const fn = firstNameIdx !== -1 && row[firstNameIdx] ? String(row[firstNameIdx]).trim() : "";
              const ln = lastNameIdx !== -1 && row[lastNameIdx] ? String(row[lastNameIdx]).trim() : "";
              contactName = `${fn} ${ln}`.trim();
            }

            // Extract each phone number found in this contact row
            for (const pIdx of phoneIndices) {
              const rawVal = row[pIdx];
              if (rawVal) {
                const cleanNum = String(rawVal).replace(/[^\d+]/g, "").trim();
                if (cleanNum && cleanNum.length >= 7) {
                  parsedContacts.push({
                    name: contactName || cleanNum,
                    number: cleanNum
                  });
                }
              }
            }
          }
        }
      }

      if (parsedContacts.length === 0) {
        setError("Could not find any phone numbers in the uploaded file. Please make sure it is a valid Google Contacts CSV or vCard (.vcf) file.");
        setImportingContacts(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const email = localStorage.getItem("email") || localStorage.getItem("userEmail") || localStorage.getItem("freeUserEmail") || "user";

      // 1. Instantly format, clean and split any joined numbers directly into UI
      const formattedContacts = cleanAndNormalizeContactList(parsedContacts);

      setContacts((prev) => {
        const merged = cleanAndNormalizeContactList([...(prev || []), ...formattedContacts]);
        return merged;
      });
      setContactsFetched(true);
      setSuccessMsg(`🎉 Successfully imported ${formattedContacts.length} contacts from your phone!`);
      setShowGoogleModal(false);

      // 2. Persist to localStorage so contacts remain loaded even after refresh
      try {
        const storageKey = `goye_imported_contacts_${email}`;
        const existingRaw = localStorage.getItem(storageKey);
        const existingList = existingRaw ? JSON.parse(existingRaw) : [];
        const merged = cleanAndNormalizeContactList([...existingList, ...formattedContacts]);
        localStorage.setItem(storageKey, JSON.stringify(merged));
      } catch (_) {}

      // 3. Sync to backend via Socket.IO if available
      try {
        if (socketRef.current) {
          socketRef.current.emit("import_contacts", { email, contacts: parsedContacts });
        }
      } catch (_) {}

      // 4. Safely sync to backend via REST API (handles non-JSON / HTML responses gracefully)
      try {
        const res = await fetch(`${API_BASE}/api/contacts/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, contacts: parsedContacts })
        });
        if (res.ok) {
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const data = await res.json();
            if (data.success && Array.isArray(data.contacts)) {
              setContacts(data.contacts);
            }
          }
        }
      } catch (apiErr) {
        console.warn("Backend REST sync skipped (contacts active locally):", apiErr.message);
      }
    } catch (err) {
      console.error("Import error:", err);
      setError("Failed to parse or import contacts file: " + err.message);
    } finally {
      setImportingContacts(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Contacts are only restored when WhatsApp session is verified as connected

  useEffect(() => {
    const socket = whatsappSocket;
    socketRef.current = socket;

    const registerAndCheck = () => {
      const email = localStorage.getItem("email") || localStorage.getItem("userEmail") || localStorage.getItem("freeUserEmail");
      if (email) {
        socket.emit("register_email", email);
        socket.emit("check_status");
      } else {
        setCheckingStatus(false);
      }
    };

    const handleReady = (payload) => {
      setConnected(true);
      setCheckingStatus(false);
      const newPhone = payload?.user?.id || "";
      if (newPhone) {
        const savedPhone = localStorage.getItem("connected_wa_phone");
        if (savedPhone && savedPhone !== newPhone) {
          console.log("Phone changed:", savedPhone, "->", newPhone, "clearing UI cache");
          setContacts([]);
          setContactsFetched(false);
          setSelectedContacts(new Set());
          setGroups([]);
          setGroupsFetched(false);
          setSelectedGroups(new Set());
        }
        localStorage.setItem("connected_wa_phone", newPhone);
      }
    };

    const handleLogout = () => {
      setConnected(false);
      setCheckingStatus(false);
      localStorage.removeItem("connected_wa_phone");
      setGroups([]);
      setGroupsFetched(false);
      setSelectedGroups(new Set());
      setContacts([]);
      setContactsFetched(false);
      setSelectedContacts(new Set());
    };

    const handleStatus = (data) => {
      const isReady = !!(data && (data.connected || data.status === "ready" || data.status === "connected"));
      setConnected(isReady);
      setCheckingStatus(false);
      if (!isReady) {
        setContacts([]);
        setContactsFetched(false);
        setSelectedContacts(new Set());
        setGroups([]);
        setGroupsFetched(false);
        setSelectedGroups(new Set());
      }
    };

    socket.on("connect", registerAndCheck);
    socket.on("ready", handleReady);
    socket.on("logout", handleLogout);
    socket.on("status", handleStatus);

    if (socket.connected) registerAndCheck();

    return () => {
      socket.off("connect", registerAndCheck);
      socket.off("ready", handleReady);
      socket.off("logout", handleLogout);
      socket.off("status", handleStatus);
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleGroupsList = (data) => {
      clearGroupWatchdog();
      setLoadingGroups(false);
      const list = Array.isArray(data) ? data : data?.groups || [];
      setGroups(list);
      setGroupsFetched(true);
      setError("");
    };

    const handleGroupsError = (data) => {
      clearGroupWatchdog();
      setLoadingGroups(false);
      setGroupsFetched(true);
      setError((data && data.message) || "Couldn't load groups. Please try refreshing.");
    };

    const handleContactsList = (data) => {
      clearContactWatchdog();
      setLoadingContacts(false);
      const list = Array.isArray(data) ? data : data?.contacts || [];

      // Merge with locally imported phone contacts so user's 200+ contacts are never lost
      const email = localStorage.getItem("email") || localStorage.getItem("userEmail") || localStorage.getItem("freeUserEmail") || "user";
      let localList = [];
      try {
        const stored = localStorage.getItem(`goye_imported_contacts_${email}`);
        if (stored) localList = JSON.parse(stored);
      } catch (_) {}

      const map = new Map();
      (localList || []).forEach((c) => { if (c.number) map.set(c.number, c); });
      (list || []).forEach((c) => { if (c.number) map.set(c.number, c); });

      const cleaned = cleanAndNormalizeContactList(Array.from(map.values()));
      setContacts(cleaned);
      setContactsFetched(true);
      setError("");

      try {
        localStorage.setItem(`goye_imported_contacts_${email}`, JSON.stringify(cleaned));
      } catch (_) {}
    };

    const handleContactsError = (data) => {
      clearContactWatchdog();
      setLoadingContacts(false);
      setContactsFetched(true);
      setError((data && data.message) || "Couldn't load contacts. Please try refreshing.");
    };

    socket.on("groups_list", handleGroupsList);
    socket.on("groups_error", handleGroupsError);
    socket.on("contacts_list", handleContactsList);
    socket.on("contacts_error", handleContactsError);

    if (connected) {
      fetchGroups();
      fetchContacts();
    }

    return () => {
      socket.off("groups_list", handleGroupsList);
      socket.off("groups_error", handleGroupsError);
      socket.off("contacts_list", handleContactsList);
      socket.off("contacts_error", handleContactsError);
      clearGroupWatchdog();
      clearContactWatchdog();
    };
  }, [connected, fetchGroups, fetchContacts]);

  // Filtered Groups
  const filteredGroups = useMemo(() => {
    const q = searchGroup.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.name?.toLowerCase().includes(q) ||
        g.id?.toLowerCase().includes(q)
    );
  }, [groups, searchGroup]);

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    const q = searchContact.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.number?.toLowerCase().includes(q) ||
        c.id?.toLowerCase().includes(q) ||
        c.notify?.toLowerCase().includes(q)
    );
  }, [contacts, searchContact]);

  // Toggle Selection Groups
  const toggleGroup = (id) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllGroups = () => {
    if (selectedGroups.size === filteredGroups.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(filteredGroups.map((g) => g.id)));
    }
  };

  // Toggle Selection Contacts
  const toggleContact = (id) => {
    setSelectedContacts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllContacts = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map((c) => c.id)));
    }
  };

  // Export handler (supports both Groups and Contacts)
  const handleExport = async () => {
    const isGroups = activeTab === "groups";
    const selectedSet = isGroups ? selectedGroups : selectedContacts;

    if (selectedSet.size === 0) return;
    setExporting(true);
    setError("");
    setSuccessMsg("");

    try {
      const email = localStorage.getItem("email");
      if (!email) {
        setError("You're not logged in. Please log in again and retry.");
        return;
      }

      const endpoint = isGroups ? `${API_BASE}/api/groups/export` : `${API_BASE}/api/contacts/export`;
      const payload = isGroups
        ? { email, groupIds: Array.from(selectedGroups) }
        : { email, contactIds: Array.from(selectedContacts) };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let message = "Export failed. Please try again.";
        try {
          const data = await res.json();
          message = data.message || message;
        } catch (_) {}
        setError(message);
        return;
      }

      const blob = await res.blob();
      if (!blob || blob.size === 0) {
        setError("Export failed: the generated file was empty. Please try again.");
        return;
      }

      let filename = isGroups ? "WhatsApp_Group_Members.xlsx" : "WhatsApp_Contacts.xlsx";
      const disposition = res.headers.get("Content-Disposition");
      if (disposition) {
        const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
        const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
        if (utf8Match) filename = decodeURIComponent(utf8Match[1]);
        else if (asciiMatch) filename = asciiMatch[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      const count = res.headers.get("X-Export-Count");
      if (isGroups) {
        const hiddenCount = res.headers.get("X-Export-Hidden-Count");
        const groupNameHeader = res.headers.get("X-Export-Group-Name");
        const groupLabel = groupNameHeader ? decodeURIComponent(groupNameHeader) : "the selected group(s)";
        let msg = count
          ? `Successfully exported ${count} member${count === "1" ? "" : "s"} from ${groupLabel}.`
          : `Export complete: ${filename}`;
        if (hiddenCount && Number(hiddenCount) > 0) {
          msg += ` ${hiddenCount} member${hiddenCount === "1" ? "" : "s"} had a hidden phone number.`;
        }
        setSuccessMsg(msg);
      } else {
        setSuccessMsg(`Successfully exported ${count || selectedSet.size} contact${count === "1" ? "" : "s"} to ${filename}.`);
      }
    } catch (err) {
      console.error(err);
      setError("Export failed. Please check your connection and try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#212122] py-12 px-4 sm:py-20 sm:px-6 overflow-x-hidden relative">
      <style>{`
        @keyframes gyFloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-14px); } }
      `}</style>

      <div className="absolute top-0 left-4 sm:left-20 w-40 h-40 sm:w-72 sm:h-72 bg-[#25D366] rounded-full mix-blend-screen filter blur-3xl opacity-[0.12]" style={{ animation: "gyFloat 9s ease-in-out infinite" }}></div>
      <div className="absolute bottom-20 right-4 sm:right-20 w-48 h-48 sm:w-96 sm:h-96 bg-[#128C7E] rounded-full mix-blend-screen filter blur-3xl opacity-[0.16]" style={{ animation: "gyFloat 11s ease-in-out infinite", animationDelay: "2s" }}></div>

      <div className="max-w-5xl mx-auto relative" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="text-center mb-10 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[100px] bg-[#25D366]/20 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#25D366]/20 to-[#128C7E]/20 border border-[#25D366]/30 text-[#25D366] text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_15px_rgba(37,211,102,0.2)] animate-pulse">
            <FiUsers size={14} className="animate-bounce" /> WhatsApp Data Hub
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3 sm:mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#25D366] via-emerald-200 to-[#128C7E] drop-shadow-[0_0_25px_rgba(37,211,102,0.3)]">
            Group & Contact Management
          </h1>
          <p className="text-white/60 mt-2 text-xs sm:text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed px-2">
            Instantly view, search, and <span className="text-[#25D366]">export your connected WhatsApp groups</span> and individual contacts with a single click.
          </p>
        </div>

        {/* Tab Switcher: Groups & Contacts */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 mb-6 sm:mb-8">
          <button
            onClick={() => {
              setActiveTab("groups");
              setError("");
              setSuccessMsg("");
            }}
            className={`flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-300 ${
              activeTab === "groups"
                ? "bg-[#25D366] text-black shadow-[0_4px_20px_rgba(37,211,102,0.35)] scale-105"
                : "bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white border border-white/10"
            }`}
          >
            <FiUsers size={16} className="shrink-0" />
            <span>Groups</span>
            {connected && groups.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold ${
                activeTab === "groups" ? "bg-black/20 text-black" : "bg-white/10 text-white/80"
              }`}>
                {groups.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("contacts");
              setError("");
              setSuccessMsg("");
              if (contacts.length === 0 && connected) {
                fetchContacts();
              }
            }}
            className={`flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-300 ${
              activeTab === "contacts"
                ? "bg-[#25D366] text-black shadow-[0_4px_20px_rgba(37,211,102,0.35)] scale-105"
                : "bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white border border-white/10"
            }`}
          >
            <FiUser size={16} className="shrink-0" />
            <span>Contacts</span>
            {connected && contacts.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold ${
                activeTab === "contacts" ? "bg-black/20 text-black" : "bg-white/10 text-white/80"
              }`}>
                {contacts.length}
              </span>
            )}
          </button>
        </div>

        {checkingStatus ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 sm:p-10 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#25D366]/10 text-[#25D366] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <FiUsers size={24} />
            </div>
            <p className="text-white/50 text-xs sm:text-sm">Checking WhatsApp session...</p>
          </div>
        ) : !connected ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 sm:p-10 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#25D366]/10 text-[#25D366] rounded-full flex items-center justify-center mx-auto mb-4">
              <FiWifiOff size={24} />
            </div>
            <h3 className="text-white font-bold text-base sm:text-lg font-['Space_Grotesk']">
              No WhatsApp session connected
            </h3>
            <p className="text-white/50 text-xs sm:text-sm mt-2 max-w-md mx-auto">
              Connect WhatsApp by scanning the QR code first. Once connected,
              your groups and individual contacts will appear here automatically.
            </p>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 sm:mb-8 bg-white/[0.02] p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
              <div className="relative flex-1 min-w-0">
                <FiSearch className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-[#25D366] text-base sm:text-lg pointer-events-none" />
                <input
                  type="text"
                  value={activeTab === "groups" ? searchGroup : searchContact}
                  onChange={(e) => {
                    if (activeTab === "groups") setSearchGroup(e.target.value);
                    else setSearchContact(e.target.value);
                  }}
                  placeholder={
                    activeTab === "groups"
                      ? "Search groups by name or ID..."
                      : "Search contacts by name or phone..."
                  }
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 bg-[#121A16]/80 border border-[#1E2822] rounded-xl sm:rounded-2xl text-xs sm:text-sm text-white placeholder:text-white/40 outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all font-medium"
                />
              </div>

              {activeTab === "contacts" && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportPhoneContacts}
                    accept=".vcf,.csv,.xlsx,.xls,.txt"
                    className="hidden"
                  />
                  <button
                    onClick={() => setShowGoogleModal(true)}
                    className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs sm:text-sm font-bold rounded-xl sm:rounded-2xl transition-all duration-300 shrink-0 border border-white/20 hover:border-[#25D366] active:scale-[0.98] cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.2)] w-full sm:w-auto"
                    title="Fetch all 200+ contacts directly from your Google / Phone account!"
                  >
                    <FcGoogle size={18} className="shrink-0" />
                    <span>Sync Google Contacts</span>
                  </button>
                </>
              )}

              <button
                onClick={handleExport}
                disabled={
                  (activeTab === "groups" ? selectedGroups.size === 0 : selectedContacts.size === 0) || exporting
                }
                className="flex items-center justify-center gap-2 px-5 sm:px-7 py-3 sm:py-3.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#22db91] hover:to-[#0f7a6d] disabled:opacity-40 text-black font-extrabold text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-[0_4px_20px_rgba(37,211,102,0.35)] transition-all duration-300 shrink-0 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {exporting ? <FiRefreshCw className="animate-spin text-black" /> : <FiDownload className="text-black" />}
                {exporting
                  ? "Exporting..."
                  : activeTab === "groups"
                  ? selectedGroups.size === 1
                    ? "Extract to Excel"
                    : `Export Selected (${selectedGroups.size})`
                  : selectedContacts.size === 1
                  ? "Export Contact"
                  : `Export Selected (${selectedContacts.size})`}
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 text-red-200 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366] px-4 py-3 text-sm">
                {successMsg}
              </div>
            )}

            {/* TAB 1: GROUPS LIST */}
            {activeTab === "groups" && (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
                  <label className="flex items-center gap-2 text-xs text-white/60 font-semibold uppercase tracking-wide cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={filteredGroups.length > 0 && selectedGroups.size === filteredGroups.length}
                      onChange={toggleSelectAllGroups}
                      className="accent-[#25D366] w-4 h-4 cursor-pointer"
                    />
                    Select All Groups
                  </label>
                  <span className="text-xs text-white/40 font-medium">
                    {filteredGroups.length} group${filteredGroups.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {loadingGroups ? (
                  <div className="py-20 text-center text-white/40 text-sm flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#25D366] border-t-transparent rounded-full animate-spin"></div>
                    Fetching WhatsApp groups...
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <div className="py-20 text-center text-white/40 text-sm">
                    {groups.length === 0
                      ? (groupsFetched ? "No groups found in this WhatsApp account." : "No groups found on this account yet.")
                      : "No groups match your search."}
                  </div>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {filteredGroups.map((g) => (
                      <li
                        key={g.id}
                        onClick={() => toggleGroup(g.id)}
                        className="flex items-center gap-3 sm:gap-4 px-3.5 sm:px-5 py-3 sm:py-4 hover:bg-white/[0.03] transition-colors cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={selectedGroups.has(g.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleGroup(g.id);
                          }}
                          className="accent-[#25D366] w-4 h-4 shrink-0 cursor-pointer"
                        />
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0 border border-[#25D366]/20">
                          <FiUsers size={16} className="sm:text-lg" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-xs sm:text-sm font-bold truncate">{g.name || "Unnamed group"}</p>
                          <p className="text-white/40 text-[11px] sm:text-xs truncate">{g.id || "—"}</p>
                        </div>
                        <div className="text-[#25D366] text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1 bg-[#25D366]/10 rounded-full border border-[#25D366]/20 shrink-0 whitespace-nowrap">
                          {g.memberCount ?? "—"} members
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* TAB 2: CONTACTS LIST */}
            {activeTab === "contacts" && (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
                <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-3.5 border-b border-white/10 bg-white/[0.02]">
                  <label className="flex items-center gap-2 text-xs text-white/60 font-semibold uppercase tracking-wide cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={filteredContacts.length > 0 && selectedContacts.size === filteredContacts.length}
                      onChange={toggleSelectAllContacts}
                      className="accent-[#25D366] w-4 h-4 cursor-pointer"
                    />
                    Select All Contacts
                  </label>
                  <span className="text-xs text-white/40 font-medium">
                    {filteredContacts.length} contact{filteredContacts.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {loadingContacts ? (
                  <div className="py-20 text-center text-white/40 text-sm flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#25D366] border-t-transparent rounded-full animate-spin"></div>
                    Fetching individual WhatsApp contacts...
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="py-20 text-center text-white/40 text-sm">
                    {contacts.length === 0
                      ? (contactsFetched ? "No contacts found in this WhatsApp account." : "Loading contacts, please wait...")
                      : "No contacts match your search."}
                  </div>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {filteredContacts.map((c) => (
                      <li
                        key={c.id}
                        onClick={() => toggleContact(c.id)}
                        className="flex items-center gap-3 sm:gap-4 px-3.5 sm:px-5 py-3 sm:py-4 hover:bg-white/[0.03] transition-colors cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={selectedContacts.has(c.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleContact(c.id);
                          }}
                          className="accent-[#25D366] w-4 h-4 shrink-0 cursor-pointer"
                        />
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#005C4B]/40 text-[#25D366] flex items-center justify-center shrink-0 border border-[#25D366]/20 font-bold text-xs sm:text-base">
                          {c.name && c.name !== "Unknown Contact" ? (
                            c.name.charAt(0).toUpperCase()
                          ) : (
                            <FiUser size={16} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-xs sm:text-sm font-bold truncate">
                            {c.name || "Unknown Contact"}
                          </p>
                          <div className="flex items-center gap-2 text-white/40 text-[11px] sm:text-xs truncate mt-0.5">
                            <span className="flex items-center gap-1 text-[#25D366]">
                              <FiPhone size={10} className="sm:text-xs shrink-0" />
                              +{c.number}
                            </span>
                            {c.notify && c.notify !== c.name && (
                              <span className="text-white/30 truncate">({c.notify})</span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {c.isBusiness ? (
                            <span className="text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20 whitespace-nowrap">
                              Business
                            </span>
                          ) : (
                            <span className="text-[10px] sm:text-xs font-medium px-2 sm:px-2.5 py-0.5 bg-white/5 text-white/50 rounded-md border border-white/10 whitespace-nowrap">
                              Contact
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
        {/* Google / Phone Contacts Sync Modal */}
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
            <div className="bg-[#161B18] border border-[#25D366]/40 rounded-3xl p-5 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-white relative">
              <button
                onClick={() => setShowGoogleModal(false)}
                className="absolute top-4 sm:top-5 right-4 sm:right-5 text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
              >
                <FiX size={20} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                  <FcGoogle size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">Import All Phone Contacts</h3>
                  <p className="text-xs text-[#25D366] font-medium">Simple 2-Step Sync (Takes 10 Seconds!)</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                    <span className="w-6 h-6 rounded-full bg-[#25D366] text-black text-xs flex items-center justify-center font-extrabold">1</span>
                    <span>Download Contacts from Google Cloud</span>
                  </div>
                  <p className="text-xs text-white/60 mb-3 leading-relaxed">
                    Click the button below to open Google Contacts (where all your Android phone contacts are stored). Click <strong className="text-white">Export</strong> to download your contacts file.
                  </p>
                  <a
                    href="https://contacts.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 bg-white hover:bg-gray-100 text-gray-900 font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    <FcGoogle size={20} />
                    <span>Open Google Contacts (contacts.google.com)</span>
                    <FiExternalLink size={15} className="text-gray-600" />
                  </a>
                </div>

                {/* Step 2 */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                    <span className="w-6 h-6 rounded-full bg-[#25D366] text-black text-xs flex items-center justify-center font-extrabold">2</span>
                    <span>Select or Drop the Downloaded File</span>
                  </div>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#25D366]/50 hover:border-[#25D366] bg-[#25D366]/5 hover:bg-[#25D366]/15 rounded-2xl p-6 text-center cursor-pointer transition-all duration-300"
                  >
                    <FiUpload className="mx-auto text-3xl text-[#25D366] mb-2 animate-bounce" />
                    <p className="text-sm font-bold text-white">Click Here to Upload Contacts File</p>
                    <p className="text-xs text-[#25D366] mt-1 font-medium">All 200+ phone contacts will appear immediately!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
