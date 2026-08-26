'use client';
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  RotateCcw,
  Users,
  Layers3,
  Tag,
  RefreshCw,
  Download,
  FileText,
  Printer,
  ExternalLink,
  Bell,
  LogOut,
  IndianRupee,
  Clock3,
  AlertTriangle,
  Eye,
  EyeOff,
  TrendingUp,
  CheckCheck,
  ChevronDown,
  Menu,
  X,
  Mail,
  Lock,
  ShieldCheck,
  Loader2,
  Crown,
  ArrowRight,
  SlidersHorizontal,
  Percent,
} from "lucide-react";

import API_URL from "../config";
import AdminProductsSection from "../components/admin/AdminProductsSection";
import AdminInventorySection from "../components/admin/AdminInventorySection";
import AdminOrdersSection from "../components/admin/AdminOrdersSection";
import AdminReturnsSection from "../components/admin/AdminReturnsSection";
import AdminCustomersSection from "../components/admin/AdminCustomersSection";
import AdminCategoriesSection from "../components/admin/AdminCategoriesSection";
import AdminCouponsSection from "../components/admin/AdminCouponsSection";
import AdminCancellationsSection from "../components/admin/AdminCancellationsSection";
import AdminStoreSettingsSection from "../components/admin/AdminStoreSettingsSection";
import AdminPromotionsSection from "../components/admin/AdminPromotionsSection";
import { exportStoreAuditPDF } from "../utils/pdfExportHelper";
import "./AdminDashboard.css";

const API = API_URL || "http://localhost:5000";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "cancellations", label: "Cancellation Requests", icon: RotateCcw },
  { id: "customers", label: "Customers", icon: Users },
  { id: "categories", label: "Categories", icon: Layers3 },
  { id: "coupons", label: "Coupons", icon: Tag },
  { id: "promotions", label: "Promotions & Pricing", icon: Percent },
  { id: "settings", label: "Store Settings", icon: SlidersHorizontal },
];

const money = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

function StatusBadge({ children, type = "neutral" }) {
  return <span className={`status-badge status-${type}`}>{children}</span>;
}

function StatCard({ icon: Icon, title, value, helper, danger = false }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon size={23} />
      </div>

      <div>
        <span className="stat-title">{title}</span>
        <strong className="stat-value">{value}</strong>

        {helper && (
          <span className={danger ? "stat-helper danger" : "stat-helper"}>
            {helper}
          </span>
        )}
      </div>
    </div>
  );
}

// Generates a smooth cubic bezier SVG path from a series of points
function getCurvedPath(points) {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

function getAreaPath(points, bottomY) {
  if (!points || points.length === 0) return "";
  const curvedLine = getCurvedPath(points);
  const first = points[0];
  const last = points[points.length - 1];
  return `${curvedLine} L ${last.x.toFixed(1)} ${bottomY} L ${first.x.toFixed(1)} ${bottomY} Z`;
}

function SalesChart({ data = [], orders = [] }) {
  const [timeframe, setTimeframe] = useState("7d");
  const [metric, setMetric] = useState("revenue");
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const numDays = timeframe === "30d" ? 30 : timeframe === "14d" ? 14 : 7;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const chartData = useMemo(() => {
    return Array.from({ length: numDays }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (numDays - 1 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = numDays <= 7 ? days[d.getDay()] : `${d.getDate()} ${months[d.getMonth()]}`;
      const fullDate = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;

      // Calculate from orders prop if available
      const matchingOrders = (orders || []).filter((o) => {
        const oDate = o.created_at ? String(o.created_at).slice(0, 10) : "";
        return oDate === dateStr && o.status !== "cancelled";
      });

      let dayRev = matchingOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      let dayCount = matchingOrders.length;

      // Fallback to data prop if no matching orders in array
      if (!orders.length && data.length && numDays === 7 && data[i]) {
        dayRev = Number(data[i].value || 0);
        dayCount = dayRev > 0 ? 1 : 0;
      }

      return {
        label: dayLabel,
        fullDate,
        dateStr,
        revenue: dayRev,
        ordersCount: dayCount,
        aov: dayCount > 0 ? Math.round(dayRev / dayCount) : 0,
        value: metric === "revenue" ? dayRev : dayCount,
      };
    });
  }, [orders, data, numDays, metric]);

  const totalRevenue = chartData.reduce((acc, d) => acc + d.revenue, 0);
  const totalOrdersCount = chartData.reduce((acc, d) => acc + d.ordersCount, 0);
  const maxVal = Math.max(...chartData.map((d) => d.value), metric === "revenue" ? 1000 : 1);
  const peakItem = chartData.reduce(
    (prev, curr) => (curr.value > prev.value ? curr : prev),
    chartData[0] || { value: 0, label: "None", revenue: 0, ordersCount: 0 }
  );
  const avgDaily = chartData.length
    ? Math.round((metric === "revenue" ? totalRevenue : totalOrdersCount) / chartData.length)
    : 0;

  // Chart dimensions
  const width = 760;
  const height = 240;
  const left = 55;
  const right = 20;
  const top = 25;
  const bottom = 35;

  const chartW = width - left - right;
  const chartH = height - top - bottom;

  const points = chartData.map((item, index) => {
    const x =
      left +
      (chartData.length === 1
        ? chartW / 2
        : (index / (chartData.length - 1)) * chartW);

    const y = top + chartH - (item.value / maxVal) * chartH;

    return { ...item, x, y, index };
  });

  const linePath = getCurvedPath(points);
  const areaPath = getAreaPath(points, top + chartH);

  // Y-axis grid ticks (4 levels)
  const yTicks = [0, 0.33, 0.66, 1].map((pct) => {
    const val = Math.round(pct * maxVal);
    const yPos = top + chartH - pct * chartH;
    let label = String(val);
    if (metric === "revenue") {
      if (val >= 100000) label = `₹${(val / 100000).toFixed(1)}L`;
      else if (val >= 1000) label = `₹${(val / 1000).toFixed(0)}k`;
      else label = `₹${val}`;
    }
    return { value: val, yPos, label };
  });

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="luxury-chart-container">
      {/* Interactive Controls Bar */}
      <div className="chart-controls-bar">
        {/* Metric Switcher */}
        <div className="chart-pill-group">
          <button
            type="button"
            className={`chart-pill-btn ${metric === "revenue" ? "active" : ""}`}
            onClick={() => setMetric("revenue")}
          >
            ₹ Revenue
          </button>
          <button
            type="button"
            className={`chart-pill-btn ${metric === "orders" ? "active" : ""}`}
            onClick={() => setMetric("orders")}
          >
            📦 Orders
          </button>
        </div>

        {/* Timeframe Switcher */}
        <div className="chart-pill-group timeframe-group">
          <button
            type="button"
            className={`chart-pill-btn ${timeframe === "7d" ? "active" : ""}`}
            onClick={() => setTimeframe("7d")}
          >
            7 Days
          </button>
          <button
            type="button"
            className={`chart-pill-btn ${timeframe === "14d" ? "active" : ""}`}
            onClick={() => setTimeframe("14d")}
          >
            14 Days
          </button>
          <button
            type="button"
            className={`chart-pill-btn ${timeframe === "30d" ? "active" : ""}`}
            onClick={() => setTimeframe("30d")}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Mini KPI Highlights */}
      <div className="chart-metrics-summary">
        <div className="chart-stat-item">
          <span className="stat-label">
            {metric === "revenue" ? "Period Revenue" : "Period Orders"}
          </span>
          <strong className="stat-value">
            {metric === "revenue" ? `₹${totalRevenue.toLocaleString("en-IN")}` : `${totalOrdersCount} Orders`}
          </strong>
        </div>
        <div className="chart-stat-item">
          <span className="stat-label">Daily Average</span>
          <strong className="stat-value">
            {metric === "revenue" ? `₹${avgDaily.toLocaleString("en-IN")}/day` : `${avgDaily} Orders/day`}
          </strong>
        </div>
        <div className="chart-stat-item highlight-peak">
          <span className="stat-label">Peak Day</span>
          <strong className="stat-value">
            {metric === "revenue"
              ? `₹${peakItem.revenue.toLocaleString("en-IN")}`
              : `${peakItem.ordersCount} Orders`}
            <span className="peak-sub">({peakItem.label})</span>
          </strong>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div className="chart-wrap">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="sales-chart-svg"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            {/* Smooth Royal Wine & Gold Area Gradient */}
            <linearGradient id="mirayaAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5e0a0b" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#c6a46a" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#c6a46a" stopOpacity="0.00" />
            </linearGradient>

            {/* Glowing Stroke Gradient */}
            <linearGradient id="mirayaStrokeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5e0a0b" />
              <stop offset="50%" stopColor="#871a1c" />
              <stop offset="100%" stopColor="#b0824b" />
            </linearGradient>

            {/* Drop Shadow for Line */}
            <filter id="lineGlow" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#5e0a0b" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Grid lines & Y-axis labels */}
          {yTicks.map((tick, idx) => (
            <g key={`ytick-${idx}`}>
              <line
                x1={left}
                y1={tick.yPos}
                x2={width - right}
                y2={tick.yPos}
                className="chart-grid-line"
              />
              <text
                x={left - 8}
                y={tick.yPos + 4}
                textAnchor="end"
                className="chart-y-axis-label"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#mirayaAreaGradient)" />

          {/* Spline Curved Line */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#mirayaStrokeGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#lineGlow)"
          />

          {/* Active Hover Indicator Line */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={top}
              x2={activePoint.x}
              y2={top + chartH}
              className="chart-active-guideline"
            />
          )}

          {/* Data Points */}
          {points.map((point) => {
            const isHovered = hoveredIdx === point.index;
            return (
              <g
                key={`point-${point.index}`}
                className="chart-interactive-point"
                onMouseEnter={() => setHoveredIdx(point.index)}
              >
                {/* Invisible large hit area for easy hover/touch */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="16"
                  fill="transparent"
                  cursor="pointer"
                />

                {/* Outer pulsing ring when hovered */}
                {isHovered && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="8"
                    className="chart-dot-pulse"
                  />
                )}

                {/* Main dot */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? "5.5" : "3.5"}
                  className={`chart-data-dot ${isHovered ? "hovered" : ""}`}
                />

                {/* X-axis label */}
                {(numDays <= 14 || point.index % 3 === 0 || point.index === points.length - 1) && (
                  <text
                    x={point.x}
                    y={height - 8}
                    textAnchor="middle"
                    className={`chart-x-axis-label ${isHovered ? "active" : ""}`}
                  >
                    {point.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Box */}
        {activePoint && (
          <div
            className="chart-floating-tooltip"
            style={{
              left: `${(activePoint.x / width) * 100}%`,
              top: `${Math.max(10, (activePoint.y / height) * 100 - 25)}%`,
            }}
          >
            <div className="tooltip-date-header">
              <span>📅 {activePoint.fullDate}</span>
            </div>
            <div className="tooltip-metrics-body">
              <div className="tooltip-row">
                <span className="tooltip-dim">Revenue:</span>
                <strong className="tooltip-bright gold-txt">
                  ₹{activePoint.revenue.toLocaleString("en-IN")}
                </strong>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-dim">Orders:</span>
                <strong>{activePoint.ordersCount} {activePoint.ordersCount === 1 ? "Order" : "Orders"}</strong>
              </div>
              {activePoint.ordersCount > 0 && (
                <div className="tooltip-row">
                  <span className="tooltip-dim">Avg Order:</span>
                  <span>₹{activePoint.aov.toLocaleString("en-IN")}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);

  const [dashboard, setDashboard] = useState({
    revenue: null,
    orders: null,
    pendingOrders: null,
    lowStock: null,
    salesTrend: [],
    topProducts: [],
    recentOrders: [],
    lowStockProducts: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const knownOrdersRef = useRef(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Mobile Sidebar Toggle State
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Executive Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);

  // Notifications State & Logic
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotifications, setReadNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("admin_read_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Calculate live system notifications from products and orders
  const systemNotifications = useMemo(() => {
    const list = [];

    // 1. Low stock products
    products.forEach((p) => {
      const isLow = (p.stock || 0) <= (p.low_stock_alert || 2);
      if (isLow) {
        list.push({
          id: `low-stock-${p.id}`,
          type: "warning",
          icon: AlertTriangle,
          title: "Low Stock Warning",
          message: `"${p.name}" has only ${p.stock || 0} unit(s) remaining.`,
          tab: "inventory",
          time: "Action required",
        });
      }
    });

    // 2. Pending Orders & Cancellation requests
    orders.forEach((o) => {
      if (o.status === "cancellation_requested") {
        list.push({
          id: `cancel-req-${o.id}`,
          type: "warning",
          icon: RotateCcw,
          title: "Cancellation Requested",
          message: `Order #${o.id} customer requested cancellation.`,
          tab: "orders",
          time: "Pending approval",
        });
      } else if (o.status === "pending" || o.status === "processing") {
        list.push({
          id: `order-pending-${o.id}`,
          type: "info",
          icon: ShoppingBag,
          title: "Pending Fulfillment",
          message: `Order #${o.id} (${money(o.total)}) awaiting dispatch.`,
          tab: "orders",
          time: o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Recent",
        });
      }
    });

    return list;
  }, [products, orders]);

  const unreadNotifications = useMemo(() => {
    return systemNotifications.filter((n) => !readNotifications.includes(n.id));
  }, [systemNotifications, readNotifications]);

  const markAllAsRead = () => {
    const allIds = systemNotifications.map((n) => n.id);
    setReadNotifications(allIds);
    localStorage.setItem("admin_read_notifications", JSON.stringify(allIds));
  };

  const handleNotificationClick = (n) => {
    if (!readNotifications.includes(n.id)) {
      const updated = [...readNotifications, n.id];
      setReadNotifications(updated);
      localStorage.setItem("admin_read_notifications", JSON.stringify(updated));
    }
    if (n.tab) {
      setActiveTab(n.tab);
    }
    setShowNotifications(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".notification-wrapper")) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  // Single Unified Admin Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminAuthChecking, setAdminAuthChecking] = useState(true);
  const [adminEmail, setAdminEmail] = useState("admin@mirayaofficial.in");
  const [adminPassword, setAdminPassword] = useState("adminpassword");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState("");

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    setAdminLoginError("");
    if (!adminEmail.trim() || !adminPassword) {
      setAdminLoginError("Please enter both administrator email and password.");
      return;
    }
    setAdminLoginLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail.trim().toLowerCase(), password: adminPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.msg || "Invalid admin credentials");

      const userRole = data.user?.role;
      const adminRoles = ["admin", "ADMIN", "super_admin", "store_manager"];
      if (!adminRoles.includes(userRole)) {
        throw new Error("Access Denied: This account does not possess administrator privileges.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("isLoggedIn", "true");
      window.dispatchEvent(new Event("loginStateChange"));
      setIsAdminLoggedIn(true);
      toast.success("Welcome to Miraya Executive Suite", "AUTHENTICATION SUCCESSFUL");
      loadDashboard(false, data.token);
    } catch (err) {
      setAdminLoginError(err.message || "Failed to authenticate administrator");
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.setItem("isLoggedIn", "false");
    window.dispatchEvent(new Event("loginStateChange"));
    setIsAdminLoggedIn(false);
    toast.info("Logged out from Atelier Suite", "SESSION TERMINATED");
  };

  useEffect(() => {
    const currentToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (currentToken && storedUser) {
      try {
        const u = JSON.parse(storedUser);
        const adminRoles = ["admin", "ADMIN", "super_admin", "store_manager"];
        if (adminRoles.includes(u.role)) {
          setIsAdminLoggedIn(true);
          loadDashboard(false, currentToken);
        } else {
          setIsAdminLoggedIn(false);
        }
      } catch {
        setIsAdminLoggedIn(false);
      }
    } else {
      setIsAdminLoggedIn(false);
    }
    setAdminAuthChecking(false);
  }, []);

  // Derive current page title from active tab
  const pageTitle = useMemo(() => {
    const item = menuItems.find((m) => m.id === activeTab);
    return item ? item.label : "Dashboard";
  }, [activeTab]);

  const loadDashboard = async (isSilent = false, overrideToken = null) => {
    try {
      if (!isSilent) setLoading(true);
      setError("");

      const activeToken = overrideToken || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
      const headers = activeToken ? { Authorization: `Bearer ${activeToken}` } : {};

      const [resStats, resProds, resOrders, resCats, resCoupons] = await Promise.all([
        fetch(`${API}/api/stats`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API}/api/products`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API}/api/orders/all`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API}/api/categories`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API}/api/coupons`, { headers }).then(r => r.ok ? r.json() : []).catch(() => [])
      ]);

      const prodsList = Array.isArray(resProds) ? resProds : [];
      const ordersList = Array.isArray(resOrders) ? resOrders : [];

      // Detect new incoming orders live
      if (knownOrdersRef.current !== null) {
        const newOrders = ordersList.filter(o => !knownOrdersRef.current.has(o.id));
        if (newOrders.length > 0) {
          newOrders.forEach(newOrd => {
            const custName = newOrd.user?.name || newOrd.shipping_name || 'Customer';
            toast.info(
              `Order #${newOrd.id} (${money(newOrd.total)}) placed by ${custName}. Click to view!`,
              "🛍️ NEW ORDER RECEIVED",
              {
                duration: 7000,
                onClick: () => setActiveTab("orders")
              }
            );
          });
        }
      }
      knownOrdersRef.current = new Set(ordersList.map(o => o.id));

      setProducts(prodsList);
      setOrders(ordersList);
      setCategories(Array.isArray(resCats) ? resCats : []);
      setCoupons(Array.isArray(resCoupons) ? resCoupons : []);

      const revenueVal = resStats?.totalRevenue ?? ordersList.reduce((sum, o) => o.status !== 'cancelled' ? sum + Number(o.total || 0) : sum, 0);
      const ordersVal = resStats?.totalOrders ?? ordersList.length;
      const pendingVal = ordersList.filter(o => o.status === 'pending' || o.status === 'processing' || o.status === 'cancellation_requested').length;
      const lowStockVal = resStats?.lowStockVariants ?? prodsList.filter(p => (p.stock || 0) <= (p.low_stock_alert || 2)).length;

      // Generate Sales Trend for last 7 days from live backend stats or orders
      let last7Days = [];
      if (resStats?.last7DaysSales && Array.isArray(resStats.last7DaysSales)) {
        last7Days = resStats.last7DaysSales.map(d => ({
          label: d.label,
          value: d.totalSales || 0,
        }));
      } else {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const dayLabel = days[d.getDay()];
          const dateStr = d.toISOString().slice(0, 10);
          const dayTotal = ordersList
            .filter(o => o.created_at && String(o.created_at).slice(0, 10) === dateStr && o.status !== 'cancelled')
            .reduce((sum, o) => sum + Number(o.total || 0), 0);
          return { label: dayLabel, value: dayTotal };
        });
      }

      // Top Products — Authoritative live sales data only (no mock data)
      const topProds = (resStats?.topProducts && Array.isArray(resStats.topProducts) && resStats.topProducts.length > 0)
        ? resStats.topProducts.map(p => ({
            id: p.id,
            name: p.name || p.title,
            price: p.price,
            image: p.image_url || p.image || p.images?.[0] || '/products/Lehenga-Pink Blush/1.JPG',
            sold: p.unitsSold || 0
          }))
        : [];

      // Low Stock Products
      const lowStockProds = prodsList
        .filter(p => (p.stock || 0) <= 5)
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          name: p.name || p.title,
          image: p.image_url || p.image || p.images?.[0] || '/products/Lehenga-Pink Blush/1.JPG',
          stock: p.stock ?? 0,
          color: p.color || 'Standard',
          size: p.sizes?.[0] || 'M'
        }));

      setDashboard({
        revenue: revenueVal,
        orders: ordersVal,
        pendingOrders: pendingVal,
        lowStock: lowStockVal,
        salesTrend: last7Days,
        topProducts: topProds,
        recentOrders: ordersList,
        lowStockProducts: lowStockProds
      });
    } catch (err) {
      console.error(err);
      if (!isSilent) setError("Unable to load dashboard data.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(false);
    // Auto-poll every 30 seconds for real-time order notifications
    const pollTimer = setInterval(() => {
      loadDashboard(true);
    }, 30000);
    return () => clearInterval(pollTimer);
  }, []);

  const initials = useMemo(() => "MA", []);

  const display = (value, formatter) => {
    if (loading) return "—";
    if (value === null || value === undefined) return "—";
    return formatter ? formatter(value) : value;
  };

  const exportPDF = () => {
    exportStoreAuditPDF({ dashboard, orders, products });
  };

  if (adminAuthChecking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF8F8" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={36} className="spin-animate" style={{ color: "#B51624", margin: "0 auto 14px" }} />
          <p style={{ fontFamily: "Georgia, serif", color: "#555", fontSize: "14px", letterSpacing: "1px" }}>Verifying Atelier Access...</p>
        </div>
      </div>
    );
  }

  if (!isAdminLoggedIn) {
    return (
      <div className="admin-login-portal-wrapper">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="admin-badge-crest">
              <Crown size={28} className="crest-icon" />
            </div>
            <img src="/logoR.png" alt="Miraya by Garima" className="admin-login-brand-logo" />
            <h2>Atelier Management Suite</h2>
            <p>Executive Administration & POS Control Portal</p>
          </div>

          <form onSubmit={handleAdminLoginSubmit} className="admin-login-form">
            {adminLoginError && (
              <div className="admin-login-error-alert">
                <AlertTriangle size={18} />
                <span>{adminLoginError}</span>
              </div>
            )}

            <div className="admin-input-group">
              <label>Administrator Email</label>
              <div className="admin-input-box">
                <Mail size={18} className="admin-input-icon" />
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@mirayaofficial.in"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="admin-input-group">
              <label>Password</label>
              <div className="admin-input-box">
                <Lock size={18} className="admin-input-icon" />
                <input
                  type={showAdminPassword ? "text" : "password"}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="adminpassword"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="admin-pw-toggle-btn"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  tabIndex="-1"
                  aria-label="Toggle password visibility"
                >
                  {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="admin-login-submit-btn"
              disabled={adminLoginLoading}
            >
              {adminLoginLoading ? (
                <>
                  <Loader2 size={18} className="spin-animate" />
                  <span>Authenticating Atelier...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>SIGN IN TO ATELIER</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="admin-login-footer">
            <Link to="/" className="admin-return-store-link">
              ← Return to Boutique Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 998,
          }}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${mobileSidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand-area" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <img src="/logoR.png" alt="Miraya by Garima" className="brand-logo" />
          <button
            type="button"
            className="mobile-close-btn mobile-only"
            onClick={() => setMobileSidebarOpen(false)}
            style={{ background: "none", border: "none", color: "var(--miraya-muted)", cursor: "pointer", padding: 4 }}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`nav-item ${activeTab === id ? "active" : ""}`}
              onClick={() => {
                setActiveTab(id);
                setMobileSidebarOpen(false);
              }}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="storefront-link"
          >
            <span>View Storefront</span>
            <ExternalLink size={17} />
          </Link>

          <div className="admin-profile">
            <div className="avatar">{initials}</div>
            <div>
              <strong>Miraya Admin</strong>
              <span>Administrator</span>
            </div>
          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={handleAdminLogout}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="admin-main">
        {/* TOPBAR */}
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="button"
              className="admin-mobile-toggle"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <h1>{pageTitle}</h1>
          </div>

          <div className="topbar-right">
            <div className="notification-wrapper">
              <button
                className="icon-notification"
                title="Notifications"
                onClick={() => setShowNotifications((prev) => !prev)}
              >
                <Bell size={20} />
                {unreadNotifications.length > 0 && (
                  <span>{unreadNotifications.length}</span>
                )}
              </button>

              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h3>Notifications</h3>
                    {unreadNotifications.length > 0 && (
                      <button className="mark-read-btn" onClick={markAllAsRead}>
                        <CheckCheck size={14} />
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="notification-list">
                    {systemNotifications.length === 0 ? (
                      <div className="notification-empty">
                        <p style={{ margin: 0 }}>🎉 No system alerts at this time.</p>
                      </div>
                    ) : (
                      systemNotifications.map((n) => {
                        const IconComp = n.icon;
                        const isUnread = !readNotifications.includes(n.id);
                        return (
                          <div
                            key={n.id}
                            className={`notification-item ${isUnread ? "unread" : ""}`}
                            onClick={() => handleNotificationClick(n)}
                          >
                            <div className={`notification-icon ${n.type}`}>
                              <IconComp size={16} />
                            </div>

                            <div className="notification-content">
                              <div className="notification-title-row">
                                <span className="notification-title">{n.title}</span>
                                <span className="notification-time">{n.time}</span>
                              </div>
                              <p className="notification-desc">{n.message}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="top-admin">
              <span>Miraya Admin</span>
              <div className="top-avatar">{initials}</div>
            </div>
          </div>
        </header>

        <section className="page-content">
          <div className="page-actions">
            <div>
              <h2>
                Welcome back, <span>Miraya Admin</span>
              </h2>
              <p>Here’s what’s happening with your store today.</p>
            </div>

            <div className="action-buttons">
              <button className="btn btn-secondary" onClick={loadDashboard}>
                <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>

              <button className="btn btn-outline" onClick={exportPDF} title="Download Full Store PDF Report">
                <FileText size={17} />
                Export PDF
              </button>

              <Link
                to="/"
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                View Storefront
                <ExternalLink size={16} />
              </Link>
            </div>
          </div>

          {error && <div className="dashboard-error">{error}</div>}

          {/* DYNAMIC TAB RENDERING */}
          {activeTab === "dashboard" && (
            <>
              {/* STAT CARDS */}
              <div className="stats-grid">
                <StatCard
                  icon={IndianRupee}
                  title="Total Revenue"
                  value={display(dashboard.revenue, money)}
                  helper={!error ? "Store revenue" : ""}
                />

                <StatCard
                  icon={ShoppingBag}
                  title="Total Orders"
                  value={display(dashboard.orders)}
                  helper={!error ? "All customer orders" : ""}
                />

                <StatCard
                  icon={Clock3}
                  title="Pending Orders"
                  value={display(dashboard.pendingOrders)}
                  helper={!error ? "Needs attention" : ""}
                  danger
                />

                <StatCard
                  icon={AlertTriangle}
                  title="Low Stock Products"
                  value={display(dashboard.lowStock)}
                  helper={!error ? "Restock required" : ""}
                  danger
                />
              </div>

              {/* CHART + TOP PRODUCTS */}
              <div className="dashboard-grid dashboard-grid-top">
                <div className="panel sales-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Sales Overview</h3>
                      <p>Revenue performance</p>
                    </div>

                    <div className="trend-pill">
                      <TrendingUp size={15} />
                      This Week
                    </div>
                  </div>

                  <SalesChart data={dashboard.salesTrend} orders={orders} />
                </div>

                <div className="panel">
                  <div className="panel-heading">
                    <h3>Top Selling Products</h3>
                    <button onClick={() => setActiveTab("products")}>View All</button>
                  </div>

                  <div className="product-list">
                    {dashboard.topProducts.length === 0 && (
                      <div className="empty-state">
                        {loading ? "Loading..." : "No sales data available."}
                      </div>
                    )}

                    {dashboard.topProducts.slice(0, 5).map((product) => (
                      <div className="product-row" key={product.id}>
                        <div className="product-left">
                          <img
                            src={
                              product.image ||
                              product.images?.[0] ||
                              "/products/Lehenga-Pink Blush/1.JPG"
                            }
                            alt={product.name}
                          />

                          <div>
                            <strong>{product.name}</strong>
                            <span>{money(product.price)}</span>
                          </div>
                        </div>

                        <div className="sold-count">
                          <strong>{product.sold ?? 0}</strong>
                          <span>Sold</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ORDERS + LOW STOCK */}
              <div className="dashboard-grid dashboard-grid-bottom">
                <div className="panel orders-panel">
                  <div className="panel-heading">
                    <h3>Recent Orders</h3>
                    <button onClick={() => setActiveTab("orders")}>
                      View All Orders
                    </button>
                  </div>

                  <div className="table-scroll">
                    <table className="orders-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Amount</th>
                          <th>Payment</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th></th>
                        </tr>
                      </thead>

                      <tbody>
                        {dashboard.recentOrders.length === 0 && (
                          <tr>
                            <td colSpan="7" className="empty-table">
                              {loading ? "Loading orders..." : "No recent orders."}
                            </td>
                          </tr>
                        )}

                        {dashboard.recentOrders.slice(0, 6).map((order) => {
                          const status = String(order.status || "").toLowerCase();
                          const payment = String(
                            order.payment_method || order.payment_status || order.paymentStatus || "COD"
                          ).toLowerCase();

                          return (
                            <tr key={order.id}>
                              <td>
                                <strong>
                                  {order.order_number || `#ORD-${order.id}`}
                                </strong>
                              </td>

                              <td>
                                {order.customer_name ||
                                  order.user?.name ||
                                  order.shipping_name ||
                                  "Customer"}
                              </td>

                              <td>{money(order.total || order.total_amount)}</td>

                              <td>
                                <StatusBadge
                                  type={payment.includes("paid") || payment.includes("razorpay") ? "success" : "warning"}
                                >
                                  {payment.includes("razorpay") ? "Online (Paid)" : "COD"}
                                </StatusBadge>
                              </td>

                              <td>
                                <StatusBadge
                                  type={
                                    status === "delivered"
                                      ? "success"
                                      : status === "cancelled"
                                      ? "neutral"
                                      : status === "shipped"
                                      ? "info"
                                      : "warning"
                                  }
                                >
                                  {status || "pending"}
                                </StatusBadge>
                              </td>

                              <td>
                                {order.created_at
                                  ? new Date(order.created_at).toLocaleDateString(
                                      "en-IN"
                                    )
                                  : "—"}
                              </td>

                              <td>
                                <button className="eye-btn" title="View details" onClick={() => setActiveTab("orders")}>
                                  <Eye size={17} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="panel low-stock-panel">
                  <div className="panel-heading">
                    <h3>Low Stock Alert</h3>
                    <button onClick={() => setActiveTab("inventory")}>
                      View All
                    </button>
                  </div>

                  <div className="low-stock-list">
                    {dashboard.lowStockProducts.length === 0 && (
                      <div className="empty-state">
                        {loading ? "Loading..." : "No low stock products 🎉"}
                      </div>
                    )}

                    {dashboard.lowStockProducts.slice(0, 5).map((item) => (
                      <div className="low-stock-row" key={item.id}>
                        <div className="product-left">
                          <img
                            src={
                              item.image ||
                              item.product?.images?.[0] ||
                              "/products/Lehenga-Pink Blush/1.JPG"
                            }
                            alt={item.name || item.product?.name}
                          />

                          <div>
                            <strong>{item.name || item.product?.name}</strong>
                            <span>
                              {[item.color, item.size].filter(Boolean).join(" / ")}
                            </span>
                          </div>
                        </div>

                        <strong
                          className={
                            Number(item.stock) === 0
                              ? "stock-count out"
                              : "stock-count"
                          }
                        >
                          {item.stock ?? 0} Left
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* OTHER SECTIONS */}
          {activeTab === "products" && (
            <AdminProductsSection
              products={products}
              categories={categories}
              token={token}
              API_BASE_URL={API}
              onRefresh={loadDashboard}
            />
          )}

          {activeTab === "inventory" && (
            <AdminInventorySection
              token={token}
              API_BASE_URL={API}
            />
          )}

          {activeTab === "orders" && (
            <AdminOrdersSection
              orders={orders}
              token={token}
              API_BASE_URL={API}
              onRefresh={loadDashboard}
            />
          )}

          {activeTab === "cancellations" && (
            <AdminCancellationsSection
              orders={orders}
              token={token}
              API_BASE_URL={API}
              onRefresh={loadDashboard}
            />
          )}

          {activeTab === "customers" && (
            <AdminCustomersSection
              token={token}
              API_BASE_URL={API}
            />
          )}

          {activeTab === "categories" && (
            <AdminCategoriesSection
              categories={categories}
              token={token}
              API_BASE_URL={API}
              onRefresh={loadDashboard}
            />
          )}

          {activeTab === "coupons" && (
            <AdminCouponsSection
              coupons={coupons}
              token={token}
              API_BASE_URL={API}
              onRefresh={loadDashboard}
            />
          )}

          {activeTab === "promotions" && (
            <AdminPromotionsSection
              products={products}
              categories={categories}
              token={token}
              onRefresh={loadDashboard}
            />
          )}

          {activeTab === "settings" && (
            <AdminStoreSettingsSection />
          )}
        </section>
      </main>

      {/* EXECUTIVE STORE REPORT MODAL */}
      {showReportModal && (
        <div className="report-modal-backdrop" onClick={() => setShowReportModal(false)}>
          <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal Actions Bar (hidden during printing) */}
            <div className="report-modal-actions no-print">
              <div className="report-modal-title">
                <FileText size={18} color="#5e0a0b" />
                <span>Executive Store Audit Report Preview</span>
              </div>
              <div className="report-modal-btns">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => exportStoreAuditPDF({ dashboard, orders, products })}
                  style={{ background: "#5e0a0b", color: "#fff", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: "700" }}
                  title="Directly download formatted PDF document"
                >
                  <Download size={16} /> Download PDF
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => window.print()}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#fdfbf7", borderColor: "#cda372", color: "#5e0a0b", fontWeight: "600" }}
                  title="Print Preview / Quick Print"
                >
                  <Printer size={16} /> Print
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowReportModal(false)}
                >
                  <X size={16} /> Close
                </button>
              </div>
            </div>

            {/* Printable Report Document */}
            <div className="printable-store-report" id="miraya-store-audit-report-body">
              <div className="report-header-banner">
                <div className="report-brand-col">
                  <h1 className="report-brand-name">MIRAYA</h1>
                  <div className="report-brand-tagline">BY GARIMA • EXECUTIVE STORE AUDIT REPORT</div>
                  <div className="report-brand-address">
                    Shop no. UG/5, Jagat Plaza, Law College Sq., Amravati Rd, Nagpur, Maharashtra 440033
                  </div>
                </div>
                <div className="report-meta-col">
                  <div className="report-meta-item">
                    <strong>Generated:</strong> {new Date().toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="report-meta-item"><strong>Generated By:</strong> Miraya Administration</div>
                  <div className="report-meta-status">● System Status: Verified Active</div>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="report-kpi-grid">
                <div className="report-kpi-box">
                  <div className="report-kpi-label">TOTAL STORE REVENUE</div>
                  <div className="report-kpi-val">₹{Number(dashboard.revenue || 0).toLocaleString("en-IN")}</div>
                </div>
                <div className="report-kpi-box">
                  <div className="report-kpi-label">TOTAL STORE ORDERS</div>
                  <div className="report-kpi-val">{orders.length || dashboard.orders || 0}</div>
                </div>
                <div className="report-kpi-box">
                  <div className="report-kpi-label">CATALOG GARMENTS</div>
                  <div className="report-kpi-val">{products.length || dashboard.products || 0}</div>
                </div>
                <div className="report-kpi-box">
                  <div className="report-kpi-label">LOW STOCK ALERTS</div>
                  <div className="report-kpi-val" style={{ color: (dashboard.lowStock || 0) > 0 ? "#c5221f" : "#137333" }}>
                    {dashboard.lowStock || 0}
                  </div>
                </div>
              </div>

              {/* Store Orders Ledger Table */}
              <div className="report-section-heading">
                STORE ORDERS LEDGER ({orders.length} Records)
              </div>
              <div className="report-table-responsive">
                <table className="report-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: "12%" }}>Order ID</th>
                      <th style={{ width: "22%" }}>Customer & City</th>
                      <th style={{ width: "26%" }}>Items & Sizes</th>
                      <th style={{ width: "12%", textAlign: "center" }}>Status</th>
                      <th style={{ width: "10%", textAlign: "center" }}>Payment</th>
                      <th style={{ width: "10%", textAlign: "right" }}>Total</th>
                      <th style={{ width: "8%", textAlign: "right" }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(orders) && orders.length > 0 ? (
                      orders.map((o, idx) => {
                        const custName = o?.user?.name || o?.shipping_name || o?.customer_name || "Valued Client";
                        const phone = o?.user?.phone || o?.shipping_phone || o?.phone || "N/A";
                        const city = o?.shipping_city || o?.shipping_state || "—";
                        
                        let itemsSummary = "Garment Piece";
                        try {
                          let parsed = o?.items;
                          if (typeof parsed === "string") parsed = JSON.parse(parsed);
                          if (Array.isArray(parsed) && parsed.length > 0) {
                            itemsSummary = parsed.map((it) => `${it?.product?.title || it?.product_name || it?.title || it?.name || it?.sku_snapshot || "Item"} (${it?.size || "M"}) × ${it?.quantity || it?.qty || 1}`).join(", ");
                          }
                        } catch (_) {
                          itemsSummary = "Garment Piece";
                        }

                        const statusText = String(o?.status || "Pending").toUpperCase();
                        const paymentText = o?.payment_method ? String(o.payment_method).toUpperCase() : (String(o?.payment_id || "").startsWith("pay_") ? "RAZORPAY" : "COD");
                        const totalAmount = Number(o?.total || o?.total_amount || 0).toLocaleString("en-IN");
                        const orderDate = o?.created_at || o?.createdAt ? new Date(o.created_at || o.createdAt).toLocaleDateString("en-IN") : "Recent";

                        return (
                          <tr key={o?.id || idx}>
                            <td style={{ fontWeight: 700, color: "#5e0a0b" }}>#MRY-{o?.id || idx + 1}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{custName}</div>
                              <div style={{ fontSize: "11px", color: "#666" }}>{phone} • {city}</div>
                            </td>
                            <td style={{ color: "#333", fontSize: "11px" }}>{itemsSummary}</td>
                            <td style={{ textAlign: "center" }}>
                              <span className={`report-status-badge badge-${statusText.toLowerCase()}`}>
                                {statusText}
                              </span>
                            </td>
                            <td style={{ textAlign: "center", fontSize: "11px", color: "#555" }}>{paymentText}</td>
                            <td style={{ textAlign: "right", fontWeight: 700, color: "#5e0a0b" }}>
                              ₹{totalAmount}
                            </td>
                            <td style={{ textAlign: "right", color: "#666", fontSize: "11px" }}>
                              {orderDate}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center", padding: "20px", color: "#888" }}>
                          No orders recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Garment Catalog & Live Inventory Table */}
              {Array.isArray(products) && products.length > 0 && (
                <>
                  <div className="report-section-heading" style={{ marginTop: "24px" }}>
                    CATALOG & INVENTORY SUMMARY (Top {Math.min(products.length, 50)} Garments)
                  </div>
                  <div className="report-table-responsive">
                    <table className="report-data-table">
                      <thead>
                        <tr>
                          <th style={{ width: "45%" }}>Garment Name</th>
                          <th style={{ width: "25%" }}>Category</th>
                          <th style={{ width: "15%", textAlign: "right" }}>Price</th>
                          <th style={{ width: "15%", textAlign: "center" }}>Stock Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.slice(0, 50).map((p, pIdx) => {
                          const stock = p?.stock !== undefined ? p.stock : (Array.isArray(p?.variants) ? p.variants.reduce((acc, v) => acc + (Number(v?.stock) || 0), 0) : "Available");
                          const price = Number(p?.price || 0).toLocaleString("en-IN");
                          return (
                            <tr key={p?.id || pIdx}>
                              <td style={{ fontWeight: 600, color: "#222" }}>{p?.title || p?.name || "Garment"}</td>
                              <td style={{ color: "#666" }}>{String(p?.category || "General").toUpperCase()}</td>
                              <td style={{ textAlign: "right", fontWeight: 600, color: "#5e0a0b" }}>
                                ₹{price}
                              </td>
                              <td style={{ textAlign: "center", fontWeight: 700, color: Number(stock) < 5 ? "#c5221f" : "#137333" }}>
                                {stock}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <div className="report-footer-note">
                Confidential Report — Generated exclusively for Miraya by Garima Management. Contact: mirayaofficial.in@gmail.com | +91 92712 18156
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
