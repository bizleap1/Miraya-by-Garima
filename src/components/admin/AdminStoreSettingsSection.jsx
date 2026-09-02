"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Globe, CreditCard, Truck, ShoppingBag, MessageCircle,
  Megaphone, Save, RefreshCw, CheckCircle, AlertTriangle,
  Power, Wifi, WifiOff, Bell, Phone, Mail, MapPin, Share2, Star, Trash2
} from "lucide-react";
import API_URL from "../../config";
import ConfirmModal from "../ConfirmModal";
import { useStoreSettings } from "../../context/StoreSettingsContext";
import "./AdminStoreSettingsSection.css";

export default function AdminStoreSettingsSection() {
  const { updateSettings: updateCtx } = useStoreSettings();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const handleResetAllOrders = async () => {
    setResetting(true);
    setError(null);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("miraya_admin_token") || localStorage.getItem("miraya_token");
      const res = await fetch(`${API_URL}/api/orders/reset-all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resetCustomers: false }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        try {
          localStorage.removeItem('miraya_orders');
          localStorage.removeItem('admin_read_notifications');
        } catch (_) {}

        setConfirmConfig({
          title: 'Database Reset Complete',
          message: 'All test orders, POS sales, payments, and revenue metrics have been reset to 0.',
          subMessage: 'Live store is clean and ready for real customer sales.',
          confirmText: 'Great, Reload Data',
          isAlert: true,
          isSuccess: true,
          onConfirm: () => {
            window.location.reload();
          }
        });
      } else {
        setError(data.message || 'Failed to reset orders.');
      }
    } catch (e) {
      setError('Network error while resetting orders.');
    } finally {
      setResetting(false);
    }
  };

  const fetchSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("miraya_admin_token") || localStorage.getItem("miraya_token");
      const res = await fetch(`${API_URL}/api/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSettings(await res.json());
    } catch (e) {
      setError("Failed to load settings");
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("miraya_admin_token") || localStorage.getItem("miraya_token");
      const res = await fetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        updateCtx(data.settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError("Failed to save settings. Please try again.");
      }
    } catch (e) {
      setError("Network error. Please check your connection.");
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <div className="admin-store-settings">
        <div className="store-settings-loading">
          <RefreshCw size={24} className="spin" />
          <span>Loading Store Settings...</span>
        </div>
      </div>
    );
  }

  const controls = [
    {
      key: "store_online",
      icon: settings.store_online ? <Wifi size={22} /> : <WifiOff size={22} />,
      label: "Store Online",
      desc: "Turn OFF to redirect all customers to WhatsApp. No cart/checkout visible.",
      color: "#25D366",
      danger: !settings.store_online,
    },
    {
      key: "new_orders_enabled",
      icon: <ShoppingBag size={22} />,
      label: "Accept New Orders",
      desc: "Turn OFF to temporarily stop accepting new online orders.",
      color: "#c6a46a",
      danger: !settings.new_orders_enabled,
    },
    {
      key: "online_payments",
      icon: <CreditCard size={22} />,
      label: "Online Payments (Razorpay)",
      desc: "Turn OFF to disable credit/debit card, UPI, netbanking checkout.",
      color: "#6772e5",
      danger: !settings.online_payments,
    },
    {
      key: "cod_enabled",
      icon: <Truck size={22} />,
      label: "Cash on Delivery (COD)",
      desc: "Turn OFF to remove COD option from checkout.",
      color: "#FF6B35",
      danger: !settings.cod_enabled,
    },
  ];

  const isAnyOff = !settings.store_online || !settings.new_orders_enabled;

  return (
    <div className="admin-store-settings">
      {/* Header */}
      <div className="store-settings-header">
        <div className="store-settings-title-row">
          <div className="store-settings-icon">
            <Power size={28} />
          </div>
          <div>
            <h2>Store Control Panel</h2>
            <p>Manage store status, checkout methods, and notifications</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`store-status-badge ${settings.store_online && settings.new_orders_enabled ? "status-live" : "status-offline"}`}>
          <span className="status-dot" />
          {settings.store_online && settings.new_orders_enabled ? "Store Live" : "Store Offline Mode"}
        </div>
      </div>

      {/* Warning if store is down */}
      {isAnyOff && (
        <div className="store-offline-warning">
          <AlertTriangle size={18} />
          <div>
            <strong>Store is in offline mode!</strong> Customers will be redirected to WhatsApp when attempting to order.
          </div>
        </div>
      )}

      {/* Toggle Controls */}
      <div className="store-control-grid">
        {controls.map(({ key, icon, label, desc, color, danger }) => (
          <div key={key} className={`store-control-card ${danger ? "danger-card" : ""}`}>
            <div className="control-card-left">
              <div className="control-icon" style={{ background: danger ? "rgba(220,53,69,0.12)" : `${color}20`, color: danger ? "#dc3545" : color }}>
                {icon}
              </div>
              <div className="control-text">
                <span className="control-label">{label}</span>
                <span className="control-desc">{desc}</span>
              </div>
            </div>
            <button
              className={`store-toggle ${settings[key] ? "toggle-on" : "toggle-off"}`}
              onClick={() => handleToggle(key)}
              aria-label={`Toggle ${label}`}
            >
              <span className="toggle-knob" />
            </button>
          </div>
        ))}
      </div>

      {/* Support Contact Details */}
      <div className="store-settings-card">
        <div className="settings-card-header">
          <Phone size={20} color="#c6a46a" />
          <h3>Support Contact &amp; Atelier Details</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "14px" }}>
          <div>
            <label className="settings-field-label">Customer Support Phone</label>
            <input
              type="text"
              className="settings-input"
              value={settings.support_phone || ""}
              onChange={(e) => handleChange("support_phone", e.target.value)}
              placeholder="+919271218156"
            />
          </div>
          <div>
            <label className="settings-field-label">Official Support Email</label>
            <input
              type="email"
              className="settings-input"
              value={settings.support_email || ""}
              onChange={(e) => handleChange("support_email", e.target.value)}
              placeholder="mirayaofficial.in@gmail.com"
            />
          </div>
        </div>
        <label className="settings-field-label">Nagpur Flagship Atelier Physical Address</label>
        <textarea
          className="settings-input settings-textarea"
          value={settings.atelier_address || ""}
          onChange={(e) => handleChange("atelier_address", e.target.value)}
          placeholder="Shop no. UG/5, Jagat Plaza, Mouze Pandharabodi, Law College Square, Amravati Rd, Nagpur, Maharashtra 440033"
          rows={2}
        />
        <p className="settings-field-hint">
          Displayed dynamically across the storefront footer, contact page, and official customer receipts.
        </p>
      </div>

      {/* Social Media & Reviews Links */}
      <div className="store-settings-card">
        <div className="settings-card-header">
          <Share2 size={20} color="#6772e5" />
          <h3>Social Media &amp; Reviews Links</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "14px" }}>
          <div>
            <label className="settings-field-label">Instagram Profile URL</label>
            <input
              type="url"
              className="settings-input"
              value={settings.instagram_url || ""}
              onChange={(e) => handleChange("instagram_url", e.target.value)}
              placeholder="https://www.instagram.com/miraya_official.in/"
            />
          </div>
          <div>
            <label className="settings-field-label">Facebook Page URL</label>
            <input
              type="url"
              className="settings-input"
              value={settings.facebook_url || ""}
              onChange={(e) => handleChange("facebook_url", e.target.value)}
              placeholder="https://www.facebook.com/profile.php?id=61591287333326"
            />
          </div>
        </div>
        <label className="settings-field-label">Google Reviews / Maps URL</label>
        <input
          type="url"
          className="settings-input"
          value={settings.google_review_url || ""}
          onChange={(e) => handleChange("google_review_url", e.target.value)}
          placeholder="https://g.page/r/miraya-nagpur"
        />
        <p className="settings-field-hint">
          Links in the footer and contact page will immediately connect to these verified accounts.
        </p>
      </div>

      {/* WhatsApp Configuration */}
      <div className="store-settings-card">
        <div className="settings-card-header">
          <MessageCircle size={20} color="#25D366" />
          <h3>WhatsApp Ordering &amp; Consultation</h3>
        </div>
        <label className="settings-field-label">WhatsApp Number (with country code)</label>
        <input
          type="text"
          className="settings-input"
          value={settings.whatsapp_number || ""}
          onChange={(e) => handleChange("whatsapp_number", e.target.value)}
          placeholder="+919271218156"
        />
        <p className="settings-field-hint">
          Customers redirected to WhatsApp will message this number. Format: +91XXXXXXXXXX
        </p>
      </div>

      {/* Announcement Banner */}
      <div className="store-settings-card">
        <div className="settings-card-header">
          <Bell size={20} color="#c6a46a" />
          <h3>Announcement Banner</h3>
          <button
            className={`store-toggle ml-auto ${settings.announcement_active ? "toggle-on" : "toggle-off"}`}
            onClick={() => handleToggle("announcement_active")}
            style={{ transform: "scale(0.8)" }}
          >
            <span className="toggle-knob" />
          </button>
        </div>
        <label className="settings-field-label">Banner Message</label>
        <textarea
          className="settings-input settings-textarea"
          value={settings.announcement_text || ""}
          onChange={(e) => handleChange("announcement_text", e.target.value)}
          placeholder="E.g., Currently accepting orders via WhatsApp only. Festival sale — limited stock!"
          rows={3}
        />
        <p className="settings-field-hint">
          {settings.announcement_active
            ? "✅ Banner is ACTIVE — displaying at the top of the storefront"
            : "⬜ Banner is currently hidden — toggle ON above to activate"}
        </p>
      </div>

      {/* Exchange Requests Configuration */}
      <div className="store-settings-card">
        <div className="settings-card-header">
          <RefreshCw size={20} color="#c6a46a" />
          <h3>EXCHANGE REQUESTS</h3>
          <button
            className={`store-toggle ml-auto ${settings.exchange_enabled ? "toggle-on" : "toggle-off"}`}
            onClick={() => handleToggle("exchange_enabled")}
            style={{ transform: "scale(0.8)" }}
          >
            <span className="toggle-knob" />
          </button>
        </div>
        <div style={{ marginTop: "12px" }}>
          <label className="settings-field-label">Exchange Window (Days after Delivery)</label>
          <input
            type="number"
            min="1"
            max="60"
            className="settings-input"
            style={{ maxWidth: "200px" }}
            value={settings.exchange_window_days !== undefined ? settings.exchange_window_days : 7}
            onChange={(e) => handleChange("exchange_window_days", parseInt(e.target.value, 10) || 7)}
          />
          <p className="settings-field-hint">
            {settings.exchange_enabled
              ? `✅ Customers can request size/color exchanges within ${settings.exchange_window_days || 7} days of delivery.`
              : "⛔ Exchange Requests are currently OFF — customers cannot request exchanges."}
          </p>
        </div>
      </div>


      {/* Data Management & Testing Reset */}
      <div className="store-settings-card" style={{ borderColor: '#e0b8b8', background: '#fff9f9' }}>
        <div className="settings-card-header">
          <Trash2 size={20} color="#b51624" />
          <h3 style={{ color: '#b51624' }}>Testing Data Reset &amp; Zero Metrics</h3>
        </div>
        <p className="settings-field-hint" style={{ color: '#555', marginBottom: '14px' }}>
          Wipe all test online orders, POS counter sales, payments, cancellation requests, and reset total revenue, today sales, and order counters back to 0. <strong>Catalog products, categories, coupons, and admin accounts will be safely preserved.</strong>
        </p>
        <button
          type="button"
          className="btn"
          style={{
            background: '#b51624',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onClick={() => {
            setConfirmConfig({
              title: 'Reset All Test Orders & Revenue to 0?',
              message: 'Are you sure you want to completely wipe all test orders, POS sales, payments, and return requests? Total revenue, order count, and sales trends will be reset to 0 for a fresh live launch.',
              subMessage: 'Your products, inventory catalog, categories, coupons, and admin accounts will remain completely safe.',
              confirmText: 'Yes, Reset All to 0',
              cancelText: 'Cancel',
              danger: true,
              onConfirm: handleResetAllOrders,
            });
          }}
          disabled={resetting}
        >
          {resetting ? (
            <><RefreshCw size={16} className="spin" /> Resetting Database...</>
          ) : (
            <><Trash2 size={16} /> Reset All Test Orders &amp; Revenue to 0</>
          )}
        </button>
      </div>

      {/* Save Button */}
      <div className="store-settings-footer">
        {error && <div className="settings-error"><AlertTriangle size={16} />{error}</div>}
        {saved && <div className="settings-success"><CheckCircle size={16} />Settings saved successfully!</div>}
        <button
          className={`settings-save-btn ${saving ? "saving" : ""}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <><RefreshCw size={18} className="spin" />Saving...</>
          ) : (
            <><Save size={18} />Save Settings</>
          )}
        </button>
      </div>

      {confirmConfig && (
        <ConfirmModal
          config={confirmConfig}
          onClose={() => setConfirmConfig(null)}
        />
      )}
    </div>
  );
}
