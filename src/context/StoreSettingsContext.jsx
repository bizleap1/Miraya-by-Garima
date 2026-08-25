"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import API_URL from "../config";

const defaultSettings = {
  store_online: true,
  online_payments: true,
  cod_enabled: true,
  new_orders_enabled: true,
  whatsapp_number: "+919271218156",
  support_phone: "+919271218156",
  support_email: "mirayaofficial.in@gmail.com",
  atelier_address: "Shop no. UG/5, Jagat Plaza, Mouze Pandharabodi, Law College Square, Amravati Rd, Nagpur, Maharashtra 440033",
  instagram_url: "https://www.instagram.com/miraya_official.in/",
  facebook_url: "https://www.facebook.com/profile.php?id=61591287333326",
  google_review_url: "https://g.page/r/miraya-nagpur",
  announcement_text: null,
  announcement_active: false,
};

const StoreSettingsContext = createContext(defaultSettings);

export function StoreSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("miraya_store_settings");
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return defaultSettings;
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("miraya_store_settings", JSON.stringify(data));
          } catch (_) {}
        }
      }
    } catch (e) {
      // Fallback to defaults if API unreachable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSettings, 30000);
    const handleStorageOrEvent = () => fetchSettings();
    window.addEventListener("storeSettingsChange", handleStorageOrEvent);
    window.addEventListener("storage", handleStorageOrEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storeSettingsChange", handleStorageOrEvent);
      window.removeEventListener("storage", handleStorageOrEvent);
    };
  }, [fetchSettings]);

  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("miraya_store_settings", JSON.stringify(updated));
        } catch (_) {}
      }
      return updated;
    });
    window.dispatchEvent(new Event("storeSettingsChange"));
  }, []);

  return (
    <StoreSettingsContext.Provider value={{ ...settings, loading, refetch: fetchSettings, updateSettings }}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}
