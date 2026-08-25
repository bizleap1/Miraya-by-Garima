"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Tag, Percent, Sparkles, ArrowRight, RotateCcw,
  CheckCircle, AlertTriangle, RefreshCw, Layers,
  ShoppingBag, Search, Plus, Eye, DollarSign,
  Trash2, Edit2, Check, X
} from "lucide-react";
import API_URL from "../../config";
import { useToast } from "../../context/ToastContext";
import "./AdminPromotionsSection.css";

export default function AdminPromotionsSection({ products = [], categories = [], token, onRefresh }) {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [tabFilter, setTabFilter] = useState("all"); // 'all' | 'active' | 'history'
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  // Form State
  const [title, setTitle] = useState("Festival Luxury Edit — 15% OFF");
  const [strategy, setStrategy] = useState("markup_strikethrough"); // 'markup_strikethrough' | 'percentage' | 'flat'
  const [discountValue, setDiscountValue] = useState(15);
  const [markupValue, setMarkupValue] = useState(18);
  const [targetType, setTargetType] = useState("category"); // 'all' | 'category' | 'products'
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [promoLabel, setPromoLabel] = useState("FESTIVE 15% OFF");

  // Fetch campaigns
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/promotions`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories]);

  // Filtered Products for picker
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = productSearch.toLowerCase();
      const name = (p.name || p.title || "").toLowerCase();
      const cat = (p.category?.name || p.category || "").toLowerCase();
      return name.includes(q) || cat.includes(q);
    });
  }, [products, productSearch]);

  const toggleProductSelect = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const [simBasePrice, setSimBasePrice] = useState(15000);

  // Auto-sync simulator base price with first selected outfit
  useEffect(() => {
    if (selectedProductIds.length > 0) {
      const firstProd = products.find((p) => p.id === selectedProductIds[0]);
      if (firstProd && Number(firstProd.price)) {
        setSimBasePrice(Number(firstProd.price));
      }
    }
  }, [selectedProductIds, products]);

  // Pricing Simulator calculations for dynamic base price
  const simResult = useMemo(() => {
    const base = Number(simBasePrice) > 0 ? Number(simBasePrice) : 15000;
    let mrp = base;
    let selling = base;
    let percent = 0;

    if (strategy === "markup_strikethrough") {
      selling = base;
      const rawMrp = Number(markupValue) > 0 ? base * (1 + Number(markupValue) / 100) : base * 1.15;
      mrp = Math.round(rawMrp / 10) * 10;
      percent = Math.round(((mrp - selling) / mrp) * 100);
    } else if (strategy === "percentage") {
      mrp = base;
      selling = Math.round((base * (1 - Number(discountValue) / 100)) / 10) * 10;
      percent = Number(discountValue);
    } else if (strategy === "flat") {
      mrp = base;
      selling = Math.max(1, base - Number(discountValue));
      percent = Math.round(((mrp - selling) / mrp) * 100);
    }

    return { mrp, selling, percent, savings: mrp - selling };
  }, [strategy, discountValue, markupValue, simBasePrice]);

  // Handle Apply Campaign
  const handleApplyPromo = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.warning("Please enter a campaign title", "PROMOTION TITLE");
      return;
    }

    let targetIds = [];
    if (targetType === "category") {
      if (!selectedCategory) {
        toast.warning("Please select a target category", "CATEGORY REQUIRED");
        return;
      }
      targetIds = [selectedCategory];
    } else if (targetType === "products") {
      if (selectedProductIds.length === 0) {
        toast.warning("Please select at least 1 product", "SELECT PRODUCTS");
        return;
      }
      targetIds = selectedProductIds;
    }

    setApplying(true);
    try {
      const authToken = token || localStorage.getItem("token") || localStorage.getItem("miraya_admin_token");
      const res = await fetch(`${API_URL}/api/promotions/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title,
          discount_type: strategy,
          discount_value: discountValue,
          markup_value: markupValue,
          target_type: targetType,
          target_ids: targetIds,
          promo_label: promoLabel,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Promotion applied successfully!", "CAMPAIGN ACTIVE");
        fetchCampaigns();
        if (typeof onRefresh === "function") onRefresh();
      } else {
        toast.error(data.error || "Failed to apply promotion", "PROMO ERROR");
      }
    } catch (_) {
      toast.error("Network error while applying promotion", "NETWORK ERROR");
    } finally {
      setApplying(false);
    }
  };

  // Handle Delete Single Campaign
  const handleDeleteCampaign = async (id, cTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete campaign "${cTitle}"?`)) return;

    try {
      const authToken = token || localStorage.getItem("token") || localStorage.getItem("miraya_admin_token");
      const res = await fetch(`${API_URL}/api/promotions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message, "CAMPAIGN DELETED");
        fetchCampaigns();
        if (typeof onRefresh === "function") onRefresh();
      } else {
        toast.error(data.error || "Failed to delete campaign", "ERROR");
      }
    } catch (_) {
      toast.error("Network error deleting campaign", "NETWORK ERROR");
    }
  };

  // Handle Clear All Reverted History
  const handleClearHistory = async () => {
    if (!window.confirm("Clear all reverted campaigns from history? This will permanently remove them from the list.")) return;

    try {
      const authToken = token || localStorage.getItem("token") || localStorage.getItem("miraya_admin_token");
      const res = await fetch(`${API_URL}/api/promotions/clear-history`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message, "HISTORY CLEARED");
        fetchCampaigns();
      } else {
        toast.error(data.error || "Failed to clear history", "ERROR");
      }
    } catch (_) {
      toast.error("Network error clearing history", "NETWORK ERROR");
    }
  };

  // Handle Save Edited Title
  const handleSaveEdit = async (id) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const authToken = token || localStorage.getItem("token") || localStorage.getItem("miraya_admin_token");
      const res = await fetch(`${API_URL}/api/promotions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ title: editTitle.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Campaign updated successfully", "UPDATED");
        setEditingId(null);
        fetchCampaigns();
      } else {
        toast.error(data.error || "Failed to update campaign", "ERROR");
      }
    } catch (_) {
      toast.error("Network error updating campaign", "NETWORK ERROR");
    }
  };

  return (
    <div className="admin-promotions-section">
      {/* Top Header Card */}
      <div className="promo-header-card">
        <div className="promo-header-info">
          <h2>
            <Tag size={24} /> Promotions &amp; Dynamic Pricing Hub
          </h2>
          <p>
            Create psychological strikethrough MRP markups, seasonal percentage sales, or category-wide festive discounts.
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => {
            fetchCampaigns();
            if (onRefresh) onRefresh();
          }}
          disabled={loading}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh Data
        </button>
      </div>

      <div className="promo-grid">
        {/* LEFT: Promotion Campaign Builder */}
        <div className="promo-card">
          <h3 className="promo-card-title">
            <Sparkles size={20} color="#C6A46A" /> Launch Promotion Campaign
          </h3>

          <form onSubmit={handleApplyPromo}>
            {/* Strategy Selection */}
            <div className="promo-field-group">
              <label>1. Select Pricing &amp; Discount Strategy</label>
              <div className="strategy-selector">
                <div
                  className={`strategy-btn ${strategy === "markup_strikethrough" ? "active" : ""}`}
                  onClick={() => {
                    setStrategy("markup_strikethrough");
                    setPromoLabel("15% OFF");
                  }}
                >
                  <span className="name">Psychological MRP</span>
                  <span className="sub">Inflate MRP, Keep Selling Price (Save % Tag)</span>
                </div>

                <div
                  className={`strategy-btn ${strategy === "percentage" ? "active" : ""}`}
                  onClick={() => {
                    setStrategy("percentage");
                    setPromoLabel(`${discountValue}% OFF`);
                  }}
                >
                  <span className="name">Direct % Off</span>
                  <span className="sub">Real price cut by chosen percentage</span>
                </div>

                <div
                  className={`strategy-btn ${strategy === "flat" ? "active" : ""}`}
                  onClick={() => {
                    setStrategy("flat");
                    setPromoLabel(`₹${discountValue} OFF`);
                  }}
                >
                  <span className="name">Flat ₹ Off</span>
                  <span className="sub">Direct ₹ amount price deduction</span>
                </div>
              </div>
            </div>

            {/* Campaign Title */}
            <div className="promo-field-group">
              <label>Campaign Title (Internal Reference)</label>
              <input
                type="text"
                className="promo-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Festive Edit 15% OFF"
                required
              />
            </div>

            {/* Discount / Markup Inputs */}
            {strategy === "markup_strikethrough" && (
              <div className="promo-field-group">
                <label>Psychological Strikethrough Markup (%)</label>
                <input
                  type="number"
                  className="promo-input"
                  min="1"
                  max="200"
                  value={markupValue}
                  onChange={(e) => setMarkupValue(Number(e.target.value))}
                  placeholder="e.g. 18 for ~15% discount perception"
                  required
                />
                <small style={{ color: "#777", display: "block", marginTop: "4px" }}>
                  Garment MRP will be displayed {markupValue}% higher with a crossed-out line, while customers still pay the current base price.
                </small>
              </div>
            )}

            {strategy === "percentage" && (
              <div className="promo-field-group">
                <label>Direct Discount Percentage (% Off Selling Price)</label>
                <input
                  type="number"
                  className="promo-input"
                  min="1"
                  max="90"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  placeholder="e.g. 15 for 15% Off"
                  required
                />
              </div>
            )}

            {strategy === "flat" && (
              <div className="promo-field-group">
                <label>Flat Amount Off (₹ Off)</label>
                <input
                  type="number"
                  className="promo-input"
                  min="50"
                  step="50"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  placeholder="e.g. 2000 for ₹2,000 Off"
                  required
                />
              </div>
            )}

            {/* Promo Tag Label */}
            <div className="promo-field-group">
              <label>Promo Badge Text (Shown on Product Badge)</label>
              <input
                type="text"
                className="promo-input"
                value={promoLabel}
                onChange={(e) => setPromoLabel(e.target.value)}
                placeholder="e.g. FESTIVE 15% OFF"
              />
            </div>

            {/* Target Criteria */}
            <div className="promo-field-group">
              <label>2. Select Target Outfits</label>
              <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                {[
                  { id: "all", label: "Store-Wide (All)" },
                  { id: "category", label: "Category" },
                  { id: "products", label: "Specific Outfits" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`btn ${targetType === t.id ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setTargetType(t.id)}
                    style={{ flex: 1, padding: "8px 12px", fontSize: "0.85rem" }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Category selector */}
              {targetType === "category" && (
                <select
                  className="promo-input"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.title}
                    </option>
                  ))}
                </select>
              )}

              {/* Product Multi-Picker */}
              {targetType === "products" && (
                <div>
                  <div style={{ position: "relative", marginBottom: "8px" }}>
                    <Search
                      size={15}
                      style={{ position: "absolute", left: "10px", top: "11px", color: "#888" }}
                    />
                    <input
                      type="text"
                      className="promo-input"
                      style={{ paddingLeft: "32px" }}
                      placeholder="Search garments to select..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>

                  <div className="picker-actions-row">
                    <span style={{ color: "#666", fontWeight: 600 }}>
                      Selected: <strong>{selectedProductIds.length}</strong> of {products.length} outfits
                    </span>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        type="button"
                        className="picker-btn-link"
                        onClick={() => {
                          const ids = filteredProducts.map((p) => p.id);
                          setSelectedProductIds((prev) => Array.from(new Set([...prev, ...ids])));
                        }}
                      >
                        Select All
                      </button>
                      <span style={{ color: "#ccc" }}>|</span>
                      <button
                        type="button"
                        className="picker-btn-link"
                        onClick={() => setSelectedProductIds([])}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="product-picker-scroll">
                    {filteredProducts.map((p) => {
                      const isSel = selectedProductIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          className={`picker-item ${isSel ? "selected" : ""}`}
                          onClick={() => toggleProductSelect(p.id)}
                        >
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => {}}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleProductSelect(p.id);
                            }}
                            style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#5e0a0b" }}
                          />
                          <img
                            src={p.image_url || p.image || p.images?.[0] || "/logoR.png"}
                            alt={p.name}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                              {p.name || p.title}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#666" }}>
                              ₹{Number(p.price || 0).toLocaleString("en-IN")} • {p.category?.name || p.category || "Couture"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Live Interactive Simulator */}
            <div className="simulator-box">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                <div className="simulator-title" style={{ margin: 0 }}>
                  <Eye size={14} /> Live Customer Perception Simulator
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "0.78rem", color: "#666", fontWeight: 600 }}>Test Base Price:</span>
                  <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1px solid #c6a46a", borderRadius: "6px", padding: "2px 6px" }}>
                    <span style={{ fontSize: "0.85rem", color: "#888", fontWeight: 600 }}>₹</span>
                    <input
                      type="number"
                      value={simBasePrice}
                      onChange={(e) => setSimBasePrice(Number(e.target.value))}
                      style={{
                        width: "80px",
                        border: "none",
                        outline: "none",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "#5e0a0b",
                        padding: "2px 4px",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="simulator-row">
                <span style={{ color: "#666" }}>Customer Sees Crossed MRP:</span>
                <span style={{ textDecoration: "line-through", color: "#888", fontWeight: 600, fontSize: "1.05rem" }}>
                  ₹{simResult.mrp.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="simulator-row">
                <span style={{ color: "#666" }}>Customer Pays Final Price:</span>
                <strong style={{ color: "var(--primary-burgundy, #5e0a0b)", fontSize: "1.2rem" }}>
                  ₹{simResult.selling.toLocaleString("en-IN")}
                </strong>
              </div>
              <div className="simulator-row">
                <span style={{ color: "#666" }}>Customer Perceived Savings:</span>
                <span style={{ color: "#27ae60", fontWeight: 700 }}>
                  Save ₹{simResult.savings.toLocaleString("en-IN")} ({simResult.percent}%)
                </span>
              </div>
              <div className="simulator-row">
                <span style={{ color: "#666" }}>Storefront Sale Tag:</span>
                <span className="simulator-badge">{simResult.percent}% OFF ({promoLabel})</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn-apply-promo"
              disabled={applying}
            >
              {applying ? (
                <>
                  <RefreshCw size={18} className="spin" /> Applying Campaign...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Launch &amp; Apply Pricing Strategy
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT: Active Campaigns & History */}
        <div className="promo-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(198, 164, 106, 0.15)", paddingBottom: "12px", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <h3 className="promo-card-title" style={{ border: "none", padding: 0, margin: 0 }}>
              <Layers size={20} color="#C6A46A" /> Campaigns &amp; History ({campaigns.length})
            </h3>

            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <button
                type="button"
                className={`btn btn-sm ${tabFilter === "all" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setTabFilter("all")}
                style={{ fontSize: "0.75rem", padding: "4px 8px" }}
              >
                All ({campaigns.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${tabFilter === "active" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setTabFilter("active")}
                style={{ fontSize: "0.75rem", padding: "4px 8px" }}
              >
                Active ({campaigns.filter((c) => c.is_active).length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${tabFilter === "history" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setTabFilter("history")}
                style={{ fontSize: "0.75rem", padding: "4px 8px" }}
              >
                History ({campaigns.filter((c) => !c.is_active).length})
              </button>

              {campaigns.some((c) => !c.is_active) && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="btn btn-sm"
                  style={{
                    fontSize: "0.75rem",
                    padding: "4px 8px",
                    background: "rgba(192, 57, 43, 0.08)",
                    color: "#c0392b",
                    border: "1px solid rgba(192, 57, 43, 0.3)",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    marginLeft: "4px"
                  }}
                  title="Clear all reverted campaigns from history"
                >
                  <Trash2 size={12} /> Clear History
                </button>
              )}
            </div>
          </div>

          {campaigns.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#888" }}>
              <Tag size={36} style={{ color: "#dfd2c0", margin: "0 auto 10px" }} />
              <p style={{ margin: 0, fontSize: "0.95rem" }}>No promotional campaigns recorded.</p>
              <small style={{ color: "#aaa" }}>Create your first campaign on the left to launch pricing strategies!</small>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="campaigns-table">
                <thead>
                  <tr>
                    <th>Campaign Title</th>
                    <th>Strategy</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns
                    .filter((c) => {
                      if (tabFilter === "active") return c.is_active;
                      if (tabFilter === "history") return !c.is_active;
                      return true;
                    })
                    .map((c) => (
                      <tr key={c.id}>
                        <td>
                          {editingId === c.id ? (
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              <input
                                type="text"
                                className="promo-input"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                style={{ padding: "4px 8px", fontSize: "0.85rem", width: "160px" }}
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(c.id)}
                                style={{ background: "#27ae60", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }}
                                title="Save"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                style={{ background: "#eee", color: "#666", border: "none", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }}
                                title="Cancel"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <strong style={{ color: "#222" }}>{c.title}</strong>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(c.id);
                                  setEditTitle(c.title);
                                }}
                                style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: "2px" }}
                                title="Edit Title"
                              >
                                <Edit2 size={12} />
                              </button>
                            </div>
                          )}
                          <div style={{ fontSize: "0.75rem", color: "#777", marginTop: "2px" }}>
                            Target: {c.target_type.toUpperCase()} • {new Date(c.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#5e0a0b" }}>
                            {c.discount_type === "markup_strikethrough"
                              ? `MRP Markup (+${c.markup_value}%)`
                              : c.discount_type === "percentage"
                              ? `${c.discount_value}% Off`
                              : `₹${c.discount_value} Off`}
                          </span>
                        </td>
                        <td>
                          {c.is_active ? (
                            <span style={{ color: "#27ae60", fontWeight: 700, fontSize: "0.75rem", background: "#e8f8ef", padding: "3px 8px", borderRadius: "12px" }}>
                              ACTIVE
                            </span>
                          ) : (
                            <span style={{ color: "#999", fontSize: "0.75rem" }}>REVERTED</span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                            {c.is_active && (
                              <button
                                type="button"
                                className="btn-revert"
                                onClick={() => handleRevertPromo(c.id, c.title)}
                                title="Revert prices back to original"
                              >
                                <RotateCcw size={13} /> Revert
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteCampaign(c.id, c.title)}
                              style={{
                                background: "none",
                                border: "1px solid #e0d8cc",
                                color: "#c0392b",
                                borderRadius: "6px",
                                padding: "5px 8px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                              title="Delete from list"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
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
