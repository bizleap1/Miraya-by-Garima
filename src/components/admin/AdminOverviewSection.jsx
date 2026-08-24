import React from 'react';
import {
  DollarSign, ShoppingCart, Clock, AlertTriangle,
  Package, ArrowRight, CheckCircle, ExternalLink, AlertCircle
} from 'lucide-react';

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export default function AdminOverviewSection({ stats, products = [], orders = [], loading = false, apiError = false, onNavigateTab }) {
  if (loading) {
    return (
      <div className="overview-container" style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: '#c5a880', fontSize: '1.1rem' }}>Loading store overview...</p>
      </div>
    );
  }

  if (apiError && !stats && orders.length === 0) {
    return (
      <div className="overview-container" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#e74c3c', fontSize: '1.1rem' }}>
          <AlertCircle size={24} />
          <span>Unable to connect to server.</span>
        </div>
        <p style={{ color: '#888', marginTop: '8px', fontSize: '0.9rem' }}>Please verify that the backend API server is running.</p>
      </div>
    );
  }

  // Calculate Key Metrics
  const totalRevenue = stats?.totalRevenue ?? stats?.totalOnlineRevenue ?? orders.reduce((sum, o) => o.status !== 'cancelled' ? sum + Number(o.total || 0) : sum, 0);
  const totalOrders = stats?.totalOrders ?? orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing' || o.status === 'cancellation_requested').length;
  const lowStockCount = stats?.lowStockVariants ?? stats?.outOfStockVariants ?? 0;

  // Recent 6 Orders
  const recentOrders = orders.slice(0, 6);

  // Status badge styling helper
  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered') return { label: 'Delivered', color: '#2ecc71', bg: 'rgba(46, 204, 113, 0.15)' };
    if (s === 'shipped') return { label: 'Shipped', color: '#3498db', bg: 'rgba(52, 152, 219, 0.15)' };
    if (s === 'processing') return { label: 'Processing', color: '#f39c12', bg: 'rgba(243, 156, 18, 0.15)' };
    if (s === 'cancellation_requested') return { label: 'Cancel Requested', color: '#e74c3c', bg: 'rgba(231, 76, 60, 0.2)' };
    if (s === 'cancelled') return { label: 'Cancelled', color: '#95a5a6', bg: 'rgba(149, 165, 166, 0.15)' };
    return { label: 'Pending', color: '#e67e22', bg: 'rgba(230, 126, 34, 0.15)' };
  };

  return (
    <div className="overview-container">
      {/* ── 1. PRIMARY KPI METRIC CARDS ── */}
      <div className="kpi-cards-grid">
        {/* Total Revenue */}
        <div className="kpi-card gold-border">
          <div className="kpi-icon"><DollarSign size={22} /></div>
          <div className="kpi-info">
            <span className="kpi-label">TOTAL REVENUE</span>
            <h3 className="kpi-value">{formatINR(totalRevenue)}</h3>
            <span className="kpi-sub">Total sales collected</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="kpi-card" onClick={() => onNavigateTab && onNavigateTab('orders')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon"><ShoppingCart size={22} /></div>
          <div className="kpi-info">
            <span className="kpi-label">TOTAL ORDERS</span>
            <h3 className="kpi-value">{totalOrders}</h3>
            <span className="kpi-sub">All-time customer orders</span>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="kpi-card" onClick={() => onNavigateTab && onNavigateTab('orders')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon"><Clock size={22} color="#f39c12" /></div>
          <div className="kpi-info">
            <span className="kpi-label">PENDING ORDERS</span>
            <h3 className="kpi-value" style={{ color: pendingOrders > 0 ? '#f39c12' : '#fff' }}>{pendingOrders}</h3>
            <span className="kpi-sub">Requires fulfillment / action</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="kpi-card" onClick={() => onNavigateTab && onNavigateTab('inventory')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon"><AlertTriangle size={22} color="#e74c3c" /></div>
          <div className="kpi-info">
            <span className="kpi-label">LOW STOCK PRODUCTS</span>
            <h3 className="kpi-value" style={{ color: lowStockCount > 0 ? '#e74c3c' : '#2ecc71' }}>{lowStockCount}</h3>
            <span className="kpi-sub">Items requiring restock</span>
          </div>
        </div>
      </div>

      {/* ── 2. RECENT ORDERS TABLE ── */}
      <div className="admin-subpage" style={{ marginTop: '1.5rem', background: '#ffffff', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--admin-border-red)', boxShadow: '0 4px 15px rgba(139,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <div>
            <h3 style={{ color: 'var(--admin-red-dark)', fontSize: '1.15rem', margin: 0, fontFamily: 'Playfair Display, serif', fontWeight: '700' }}>Recent Customer Orders</h3>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>Latest orders received across the store</p>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab('orders')}
            className="btn-gold-action"
            style={{ fontSize: '0.75rem', padding: '6px 14px' }}
          >
            VIEW ALL ORDERS <ArrowRight size={14} />
          </button>
        </div>

        <div className="admin-table-container">
          <table className="miraya-table">
            <thead>
              <tr>
                <th>ORDER ID</th>
                <th>CUSTOMER</th>
                <th>DATE</th>
                <th>ITEMS</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => {
                const badge = getStatusBadge(o.status);
                const itemsCount = o.items ? o.items.reduce((sum, it) => sum + (it.quantity || 1), 0) : 1;
                return (
                  <tr key={o.id}>
                    <td style={{ fontWeight: '700', color: 'var(--admin-red-primary)', fontFamily: 'monospace' }}>#ORD-{o.id}</td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#1c1818' }}>{o.user?.name || o.shipping_name || 'Customer'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#666666' }}>{o.user?.email || o.shipping_phone || ''}</div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#555555', fontFamily: 'monospace' }}>{o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN') : 'Recent'}</td>
                    <td style={{ color: '#333333' }}>{itemsCount} item{itemsCount > 1 ? 's' : ''}</td>
                    <td style={{ fontWeight: '700', color: 'var(--admin-red-dark)' }}>{formatINR(o.total)}</td>
                    <td>
                      <span style={{
                        color: badge.color,
                        background: badge.bg,
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        display: 'inline-block'
                      }}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                    No orders placed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
