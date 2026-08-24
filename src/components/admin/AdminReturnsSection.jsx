import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, Eye, X, RotateCcw, Check, AlertCircle } from 'lucide-react';

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

export default function AdminReturnsSection({ token, API_BASE_URL }) {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [actionNotes, setActionNotes] = useState('');

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/api/returns`, { headers });
      const data = await res.json();
      setReturns(Array.isArray(data) ? data : (data.returns || []));
    } catch (e) {
      console.error('Error fetching returns:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/returns/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, admin_notes: actionNotes })
      });
      if (res.ok) {
        setSelectedReturn(null);
        fetchReturns();
      }
    } catch (e) {
      console.error('Update return status error:', e);
    }
  };

  const filteredReturns = returns.filter((r) => {
    const q = search.toLowerCase();
    return String(r.id).includes(q) ||
      (r.user?.name && r.user.name.toLowerCase().includes(q)) ||
      (r.reason && r.reason.toLowerCase().includes(q));
  });

  return (
    <div>
      <div className="page-actions">
        <div>
          <h2>Returns & Exchanges</h2>
          <p>Review customer return and exchange requests.</p>
        </div>

        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={fetchReturns}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="toolbar-left">
          <div className="search-input-wrap">
            <Search size={16} />
            <input
              type="text"
              className="admin-input"
              placeholder="Search return requests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Customer</th>
                <th>Order</th>
                <th>Product</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.map((r) => {
                const type = r.type || (r.exchange_size ? 'Exchange' : 'Return');
                const s = (r.status || 'Requested').toLowerCase();
                const statusType = s === 'approved' || s === 'completed' ? 'success' : s === 'rejected' ? 'danger' : 'warning';

                return (
                  <tr key={r.id}>
                    <td><strong>#RET-{r.id}</strong></td>
                    <td>{r.user?.name || r.customer_name || 'Customer'}</td>
                    <td>#ORD-{r.order_id}</td>
                    <td>{r.product?.name || r.product_title || 'Outfit'}</td>
                    <td><span className="status-badge status-info">{type}</span></td>
                    <td>{r.reason || 'Sizing issue'}</td>
                    <td><span className={`status-badge status-${statusType}`}>{r.status || 'Requested'}</span></td>
                    <td style={{ color: 'var(--miraya-muted)' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary" style={{ minHeight: '32px', padding: '0 12px' }} onClick={() => setSelectedReturn(r)}>
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredReturns.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--miraya-muted)' }}>
                    {loading ? 'Loading requests...' : 'No return/exchange requests found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL DRAWER */}
      {selectedReturn && (
        <div className="admin-drawer-overlay" onClick={() => setSelectedReturn(null)}>
          <div className="admin-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Return Request #RET-{selectedReturn.id}</h3>
              <button onClick={() => setSelectedReturn(null)} style={{ background: 'none', border: 'none' }}><X size={18} /></button>
            </div>
            <div className="drawer-content">
              <div style={{ background: 'var(--miraya-bg)', border: '1px solid var(--miraya-border)', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: 'var(--miraya-muted)' }}>Reason given:</span>
                <p style={{ margin: '4px 0 0 0', fontWeight: '600', fontSize: '13px' }}>{selectedReturn.reason || 'No reason provided.'}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div><span style={{ color: 'var(--miraya-muted)', fontSize: '12px' }}>Order:</span><strong style={{ display: 'block' }}>#ORD-{selectedReturn.order_id}</strong></div>
                <div><span style={{ color: 'var(--miraya-muted)', fontSize: '12px' }}>Customer:</span><strong style={{ display: 'block' }}>{selectedReturn.user?.name || 'Customer'}</strong></div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Admin Decision Notes</label>
                <textarea
                  className="admin-input"
                  style={{ height: 'auto', padding: '8px 12px' }}
                  rows="3"
                  placeholder="Optional response note to customer..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="drawer-footer">
              <button className="btn btn-outline" onClick={() => handleUpdateStatus(selectedReturn.id, 'Rejected')}>Reject Request</button>
              <button className="btn btn-primary" onClick={() => handleUpdateStatus(selectedReturn.id, 'Approved')}>Approve Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
