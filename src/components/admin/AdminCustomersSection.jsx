import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, Eye, X, User, Phone, Mail, ShoppingBag, Calendar, ShieldCheck, MapPin, Sparkles, Database, Download, FileText } from 'lucide-react';
import { exportCustomersPDF } from '../../utils/pdfExportHelper';

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

export default function AdminCustomersSection({ token, API_BASE_URL }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'ONLINE' | 'REGISTERED' | 'BUYERS'
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchCustomers = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/api/customers`, { headers });
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : (data.customers || []));
    } catch (e) {
      console.error('Error fetching customers:', e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(false);
    // Real-time auto-polling every 8 seconds for live logins and active shoppers
    const interval = setInterval(() => {
      fetchCustomers(true);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const onlineCount = customers.filter(c => c.is_online).length;
  const registeredCount = customers.filter(c => c.type === 'REGISTERED' || c.type === 'ADMIN').length;
  const buyersCount = customers.filter(c => (c.total_orders ?? c.totalOrders ?? 0) > 0).length;
  const totalRevenue = customers.reduce((sum, c) => sum + Number(c.total_spend ?? c.totalSpend ?? 0), 0);

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.id && String(c.id).toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (filterType === 'ONLINE') {
      return Boolean(c.is_online);
    }
    if (filterType === 'REGISTERED') {
      return c.type === 'REGISTERED' || c.type === 'ADMIN';
    }
    if (filterType === 'BUYERS') {
      return (c.total_orders ?? c.totalOrders ?? 0) > 0;
    }
    return true;
  });

  // Export Customers to CSV
  const exportCustomersCSV = () => {
    if (!filteredCustomers || filteredCustomers.length === 0) {
      alert('No customer records available to export.');
      return;
    }

    const headers = [
      'Customer ID',
      'Full Name',
      'Email Address',
      'Phone Number',
      'Account Type',
      'Total Orders Placed',
      'Lifetime Spend (INR)',
      'Member Since'
    ];

    const rows = filteredCustomers.map(c => [
      c.id,
      `"${(c.name || 'Valued Client').replace(/"/g, '""')}"`,
      `"${(c.email || 'N/A').replace(/"/g, '""')}"`,
      `"${(c.phone || 'N/A').replace(/"/g, '""')}"`,
      `"${c.type || 'CUSTOMER'}"`,
      c.total_orders ?? c.totalOrders ?? 0,
      Number(c.total_spend ?? c.totalSpend ?? 0),
      c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Miraya_Customer_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* HEADER */}
      <div className="page-actions">
        <div>
          <h2>Customer Intelligence & Login Accounts</h2>
          <p>Real-time registered users, logins, and order histories directly synced from PostgreSQL.</p>
        </div>

        <div className="action-buttons">
          <button
            type="button"
            className="btn btn-outline"
            style={{ borderColor: '#c6a46a', color: '#5e0a0b', fontWeight: 700 }}
            onClick={() => exportCustomersPDF(filteredCustomers)}
            title="Export VIP customer directory as styled Luxury PDF document"
          >
            <FileText size={14} /> Export Directory (PDF)
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={exportCustomersCSV}
            title="Export customer directory to Excel/CSV"
          >
            <Download size={14} /> CSV
          </button>
          <button className="btn btn-secondary" onClick={fetchCustomers}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh DB
          </button>
        </div>
      </div>

      {/* QUICK STAT METRICS */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(94, 10, 11, 0.08)', color: 'var(--miraya-burgundy)' }}>
            <Database size={20} />
          </div>
          <div>
            <span className="stat-title">Neon DB Accounts</span>
            <strong className="stat-value">{customers.length}</strong>
            <span className="stat-helper">All Customer Records</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(46, 125, 50, 0.08)', color: '#2e7d32' }}>
            <User size={20} />
          </div>
          <div>
            <span className="stat-title">Registered / Logged-in</span>
            <strong className="stat-value">{registeredCount}</strong>
            <span className="stat-helper" style={{ color: '#2e7d32' }}>Auth Accounts</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(2, 136, 209, 0.08)', color: '#0288d1' }}>
            <ShoppingBag size={20} />
          </div>
          <div>
            <span className="stat-title">Active Buyers</span>
            <strong className="stat-value">{buyersCount}</strong>
            <span className="stat-helper">Placed ≥ 1 Order</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(198, 164, 106, 0.12)', color: 'var(--primary-gold)' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <span className="stat-title">Lifetime Value</span>
            <strong className="stat-value">{formatINR(totalRevenue)}</strong>
            <span className="stat-helper">Total Customer Spend</span>
          </div>
        </div>
      </div>

      {/* TOOLBAR & FILTERS */}
      <div className="admin-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className="search-input-wrap" style={{ flex: '1', minWidth: '240px', maxWidth: '400px' }}>
          <Search size={16} />
          <input
            type="text"
            className="admin-input"
            placeholder="Search by name, email, phone or user ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${filterType === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', minHeight: '34px', padding: '0 12px' }}
            onClick={() => setFilterType('ALL')}
          >
            All Accounts ({customers.length})
          </button>
          <button
            className={`btn ${filterType === 'ONLINE' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', minHeight: '34px', padding: '0 12px', borderColor: filterType === 'ONLINE' ? '#16a34a' : 'rgba(34, 197, 94, 0.4)', color: filterType === 'ONLINE' ? '#fff' : '#15803d', background: filterType === 'ONLINE' ? '#16a34a' : 'rgba(34, 197, 94, 0.08)' }}
            onClick={() => setFilterType('ONLINE')}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: filterType === 'ONLINE' ? '#fff' : '#22c55e', display: 'inline-block', marginRight: '6px' }} />
            🟢 Online Now ({onlineCount})
          </button>
          <button
            className={`btn ${filterType === 'REGISTERED' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', minHeight: '34px', padding: '0 12px' }}
            onClick={() => setFilterType('REGISTERED')}
          >
            Registered Users ({registeredCount})
          </button>
          <button
            className={`btn ${filterType === 'BUYERS' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', minHeight: '34px', padding: '0 12px' }}
            onClick={() => setFilterType('BUYERS')}
          >
            Active Buyers ({buyersCount})
          </button>
        </div>
      </div>

      {/* CUSTOMERS TABLE */}
      <div className="panel">
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Live Status</th>
                <th>Customer / Account</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th>Last Active &amp; Login</th>
                <th>Total Orders</th>
                <th>Total Spend</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => {
                const totalOrdersCount = c.total_orders ?? c.totalOrders ?? ((c.online_orders_count || 0) + (c.pos_sales_count || 0));
                const totalSpendAmount = c.total_spend ?? c.totalSpend ?? 0;
                const joinedDate = c.created_at || c.createdAt;

                return (
                  <tr key={c.id}>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: c.is_online ? 'rgba(34, 197, 94, 0.12)' : 'rgba(100, 116, 139, 0.1)',
                        color: c.is_online ? '#15803d' : '#64748b'
                      }}>
                        <span style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: c.is_online ? '#22c55e' : '#94a3b8',
                          boxShadow: c.is_online ? '0 0 6px #22c55e' : 'none'
                        }} />
                        {c.is_online ? 'Active Now' : 'Offline'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar" style={{
                          width: '36px',
                          height: '36px',
                          fontSize: '12px',
                          background: c.type === 'ADMIN' ? '#800020' : c.type === 'REGISTERED' ? '#2e7d32' : '#ed6c02'
                        }}>
                          {(c.name || c.email || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ fontSize: '13.5px', color: 'var(--miraya-text)' }}>
                            {c.name || (c.email ? c.email.split('@')[0] : 'Customer')}
                          </strong>
                          <span style={{
                            fontSize: '9.5px',
                            fontWeight: '700',
                            letterSpacing: '0.5px',
                            display: 'inline-block',
                            marginTop: '2px',
                            textTransform: 'uppercase',
                            color: c.type === 'ADMIN' ? '#800020' : c.type === 'REGISTERED' ? '#2e7d32' : '#ed6c02'
                          }}>
                            {c.type === 'REGISTERED' ? 'REGISTERED CLIENT' : (c.type || 'CUSTOMER')}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--miraya-text)', fontWeight: 500 }}>
                      {c.email && c.email !== 'N/A' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <Mail size={13} style={{ color: 'var(--miraya-muted)' }} /> {c.email}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--miraya-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--miraya-text)', fontWeight: 500 }}>
                      {c.phone && c.phone !== 'N/A' && c.phone !== '' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <Phone size={13} style={{ color: 'var(--miraya-muted)' }} /> {c.phone}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--miraya-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--miraya-text)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {c.last_active_at ? (
                        <div>
                          <strong style={{ color: c.is_online ? '#15803d' : '#555', display: 'block' }}>
                            {c.is_online ? 'Active right now' : `Last active ${new Date(c.last_active_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                          </strong>
                          <span style={{ fontSize: '11px', color: 'var(--miraya-muted)' }}>
                            {c.last_login ? `Signed in ${new Date(c.last_login).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}` : `Joined ${new Date(joinedDate || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--miraya-muted)' }}>
                          {joinedDate ? `Joined ${new Date(joinedDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}` : '—'}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${totalOrdersCount > 0 ? 'status-success' : 'status-neutral'}`}>
                        {totalOrdersCount} {totalOrdersCount === 1 ? 'Order' : 'Orders'}
                      </span>
                    </td>
                    <td style={{ fontWeight: '700', color: 'var(--miraya-burgundy)' }}>
                      {formatINR(totalSpendAmount)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ minHeight: '32px', padding: '0 12px', fontSize: '12px' }}
                        onClick={() => setSelectedCustomer(c)}
                      >
                        <Eye size={13} /> View Details
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--miraya-muted)' }}>
                    {loading ? 'Fetching customer accounts from Neon database...' : 'No customer records match your filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMER 360 DETAILS DRAWER */}
      {selectedCustomer && (
        <div className="admin-drawer-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="admin-drawer" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', width: '100%' }}>
            <div className="drawer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--miraya-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} style={{ color: 'var(--miraya-burgundy)' }} />
                <h3 style={{ margin: 0, fontSize: '16px' }}>Customer 360 Profile</h3>
              </div>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="drawer-content" style={{ padding: '20px' }}>
              {/* USER HEADER */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                <div className="avatar" style={{
                  width: '52px',
                  height: '52px',
                  fontSize: '18px',
                  background: selectedCustomer.type === 'ADMIN' ? '#800020' : selectedCustomer.type === 'REGISTERED' ? '#2e7d32' : '#ed6c02'
                }}>
                  {(selectedCustomer.name || selectedCustomer.email || 'C').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: 'var(--miraya-text)' }}>
                    {selectedCustomer.name || (selectedCustomer.email ? selectedCustomer.email.split('@')[0] : 'Client')}
                  </h3>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: selectedCustomer.type === 'ADMIN' ? '#fff0f0' : selectedCustomer.type === 'REGISTERED' ? '#e8f5e9' : '#fff3e0',
                    color: selectedCustomer.type === 'ADMIN' ? '#800020' : selectedCustomer.type === 'REGISTERED' ? '#2e7d32' : '#ed6c02'
                  }}>
                    {selectedCustomer.type === 'REGISTERED' ? 'REGISTERED CLIENT' : (selectedCustomer.type || 'CUSTOMER')}
                  </span>
                </div>
              </div>

              {/* CONTACT DETAILS */}
              <div style={{ background: 'var(--miraya-bg)', border: '1px solid var(--miraya-border)', padding: '16px', borderRadius: '10px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--miraya-muted)' }}>Account Info</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px' }}>
                  <div>
                    <strong style={{ color: 'var(--miraya-muted)', fontSize: '12px' }}>Email Address:</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontWeight: 600 }}>
                      <Mail size={14} style={{ color: 'var(--miraya-burgundy)' }} /> {selectedCustomer.email || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <strong style={{ color: 'var(--miraya-muted)', fontSize: '12px' }}>Phone Number:</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontWeight: 600 }}>
                      <Phone size={14} style={{ color: 'var(--miraya-burgundy)' }} /> {selectedCustomer.phone || 'N/A'}
                    </div>
                  </div>

                  {selectedCustomer.created_at && (
                    <div>
                      <strong style={{ color: 'var(--miraya-muted)', fontSize: '12px' }}>Registered / Joined Date:</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', color: '#444' }}>
                        <Calendar size={14} style={{ color: 'var(--miraya-burgundy)' }} />
                        {new Date(selectedCustomer.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                  )}

                  <div>
                    <strong style={{ color: 'var(--miraya-muted)', fontSize: '12px' }}>Real-Time Live Status:</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: selectedCustomer.is_online ? 'rgba(34, 197, 94, 0.12)' : 'rgba(100, 116, 139, 0.1)',
                        color: selectedCustomer.is_online ? '#15803d' : '#64748b'
                      }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: selectedCustomer.is_online ? '#22c55e' : '#94a3b8',
                          boxShadow: selectedCustomer.is_online ? '0 0 6px #22c55e' : 'none'
                        }} />
                        {selectedCustomer.is_online ? 'Active right now' : 'Currently Offline'}
                      </span>
                    </div>
                  </div>

                  {selectedCustomer.last_login && (
                    <div>
                      <strong style={{ color: 'var(--miraya-muted)', fontSize: '12px' }}>Latest Authentication / Login:</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', color: '#333', fontSize: '13px' }}>
                        📅 {new Date(selectedCustomer.last_login).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SPEND ANALYTICS */}
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--miraya-muted)' }}>
                Order & Spend Summary
              </h4>
              <div style={{ background: 'var(--miraya-white)', border: '1px solid var(--miraya-border)', padding: '16px', borderRadius: '10px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13.5px' }}>
                  <span>Online Store Orders:</span>
                  <strong>{selectedCustomer.online_orders_count ?? 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13.5px' }}>
                  <span>POS Boutique Sales:</span>
                  <strong>{selectedCustomer.pos_sales_count ?? 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13.5px' }}>
                  <span>Total Orders Placed:</span>
                  <strong>{selectedCustomer.total_orders ?? selectedCustomer.totalOrders ?? 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #eee', fontSize: '14px' }}>
                  <span style={{ fontWeight: '600' }}>Lifetime Value:</span>
                  <strong style={{ color: 'var(--miraya-burgundy)', fontSize: '15px' }}>
                    {formatINR(selectedCustomer.total_spend ?? selectedCustomer.totalSpend ?? 0)}
                  </strong>
                </div>
              </div>

              {/* SAVED ADDRESSES */}
              {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--miraya-muted)' }}>
                    Saved Delivery Addresses ({selectedCustomer.addresses.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedCustomer.addresses.map((addr) => (
                      <div key={addr.id} style={{ background: 'var(--miraya-bg)', border: '1px solid var(--miraya-border)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', marginBottom: '4px' }}>
                          <MapPin size={14} style={{ color: 'var(--miraya-burgundy)' }} />
                          <span>{addr.full_name || selectedCustomer.name}</span>
                          {addr.is_default && (
                            <span style={{ fontSize: '10px', background: '#e8f5e9', color: '#2e7d32', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, color: '#555', lineHeight: '1.4' }}>
                          {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        {addr.phone && <p style={{ margin: '4px 0 0 0', color: '#777', fontSize: '12px' }}>Phone: {addr.phone}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="drawer-footer" style={{ padding: '14px 20px', borderTop: '1px solid var(--miraya-border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedCustomer(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
