import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Search, Eye, X, CheckCircle, AlertCircle, Truck, Package, PackageCheck, Ban } from 'lucide-react';

export default function AdminReturnsSection({ token, API_BASE_URL }) {
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [staffNotes, setStaffNotes] = useState('');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [actionError, setActionError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchExchanges = useCallback(async () => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/api/returns?type=EXCHANGE`, { headers });
      const data = await res.json();
      setExchanges(Array.isArray(data) ? data : (data.returns || []));
    } catch (e) {
      console.error('Error fetching exchanges:', e);
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL]);

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges]);

  const handleUpdateStatus = async (id, status) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/returns/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          staff_notes: staffNotes,
          courier_name: courierName,
          tracking_number: trackingNumber
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedExchange(null);
        setStaffNotes('');
        setCourierName('');
        setTrackingNumber('');
        fetchExchanges();
      } else {
        setActionError(data.message || 'Failed to update exchange status.');
      }
    } catch (e) {
      setActionError('Network error updating exchange status.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredExchanges = exchanges.filter((ex) => {
    const q = search.toLowerCase();
    const matchesSearch = String(ex.id).includes(q) ||
      (ex.customer_name && ex.customer_name.toLowerCase().includes(q)) ||
      (ex.order_id && String(ex.order_id).includes(q)) ||
      (ex.product?.name && ex.product.name.toLowerCase().includes(q)) ||
      (ex.reason && ex.reason.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'ALL' || (ex.status || '').toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'SHIPPED') return 'status-success';
    if (s === 'REJECTED' || s === 'CANCELLED') return 'status-danger';
    if (s === 'APPROVED' || s === 'ITEM_RECEIVED') return 'status-info';
    return 'status-warning';
  };

  return (
    <div className="admin-exchanges-section">
      <div className="page-actions" style={{ marginBottom: '20px' }}>
        <div>
          <h2>Exchanges</h2>
          <p>Review, approve, receive, and ship customer size exchange requests.</p>
        </div>

        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={fetchExchanges}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="admin-toolbar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div className="search-input-wrap" style={{ flex: '1', minWidth: '260px' }}>
          <Search size={16} />
          <input
            type="text"
            className="admin-input"
            placeholder="Search by Exchange ID, customer, order #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {['ALL', 'REQUESTED', 'APPROVED', 'ITEM_RECEIVED', 'SHIPPED', 'COMPLETED', 'REJECTED'].map((st) => (
            <button
              key={st}
              className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Exchange ID</th>
                <th>Customer</th>
                <th>Order ID</th>
                <th>Product</th>
                <th>Old Size</th>
                <th>New Size</th>
                <th>Qty</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredExchanges.map((ex) => (
                <tr key={ex.id}>
                  <td><strong>#EX-{ex.id}</strong></td>
                  <td>
                    <div><strong>{ex.customer_name || 'Customer'}</strong></div>
                    {ex.customer_phone && <div style={{ fontSize: '11px', color: 'var(--miraya-muted)' }}>{ex.customer_phone}</div>}
                  </td>
                  <td>#ORD-{ex.order_id}</td>
                  <td>{ex.product?.name || 'Outfit'}</td>
                  <td><span className="badge-size-old" style={{ background: '#f5f0eb', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>{ex.variant?.size || 'Default'}</span></td>
                  <td><span className="badge-size-new" style={{ background: '#eef8f2', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: '700' }}>{ex.exchange_variant?.size || 'Replacement'}</span></td>
                  <td>{ex.exchange_quantity || ex.quantity || 1}</td>
                  <td>{ex.reason || 'Size issue'}</td>
                  <td><span className={`status-badge ${getStatusBadgeClass(ex.status)}`}>{ex.status || 'REQUESTED'}</span></td>
                  <td style={{ color: 'var(--miraya-muted)', fontSize: '12px' }}>{ex.created_at ? new Date(ex.created_at).toLocaleDateString('en-IN') : '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-secondary" style={{ minHeight: '32px', padding: '0 12px' }} onClick={() => { setSelectedExchange(ex); setStaffNotes(ex.staff_notes || ''); }}>
                      <Eye size={14} /> View Details
                    </button>
                  </td>
                </tr>
              ))}

              {filteredExchanges.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '30px', color: 'var(--miraya-muted)' }}>
                    {loading ? 'Loading exchange requests...' : 'No exchange requests found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADMIN EXCHANGE DETAIL DRAWER */}
      {selectedExchange && (
        <div className="admin-drawer-overlay" onClick={() => setSelectedExchange(null)}>
          <div className="admin-drawer" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="drawer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>Exchange Request #EX-{selectedExchange.id}</h3>
                <span className={`status-badge ${getStatusBadgeClass(selectedExchange.status)}`}>{selectedExchange.status}</span>
              </div>
              <button onClick={() => setSelectedExchange(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div className="drawer-content" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {actionError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  {actionError}
                </div>
              )}

              {/* Customer & Order Box */}
              <div style={{ background: 'var(--miraya-bg)', border: '1px solid var(--miraya-border)', padding: '14px', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--miraya-muted)' }}>Customer &amp; Order</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  <div><span>Customer:</span> <strong>{selectedExchange.customer_name || 'Customer'}</strong></div>
                  <div><span>Phone:</span> <strong>{selectedExchange.customer_phone || 'N/A'}</strong></div>
                  <div><span>Order ID:</span> <strong>#ORD-{selectedExchange.order_id}</strong></div>
                  <div><span>Requested Date:</span> <strong>{selectedExchange.created_at ? new Date(selectedExchange.created_at).toLocaleDateString('en-IN') : 'N/A'}</strong></div>
                </div>
              </div>

              {/* Exchange Item Details */}
              <div style={{ background: '#fff', border: '1px solid var(--miraya-border)', padding: '14px', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--miraya-muted)' }}>Exchange Outfit</h4>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                  {selectedExchange.product?.image_url && <img src={selectedExchange.product.image_url} alt="" style={{ width: '50px', height: '65px', objectFit: 'cover', borderRadius: '4px' }} />}
                  <div>
                    <strong style={{ fontSize: '14px' }}>{selectedExchange.product?.name || 'Garment'}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--miraya-muted)', marginTop: '2px' }}>Reason: <strong>{selectedExchange.reason}</strong></div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: '#f9f8f6', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#666', display: 'block' }}>Purchased Size</span>
                    <strong style={{ color: '#5e0a0b' }}>{selectedExchange.variant?.size || 'N/A'}</strong>
                  </div>
                  <div style={{ alignSelf: 'center', fontSize: '16px', color: '#c6a46a' }}>➔</div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#666', display: 'block' }}>Requested Size</span>
                    <strong style={{ color: '#15803d' }}>{selectedExchange.exchange_variant?.size || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Staff Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Staff Internal Notes</label>
                <textarea
                  className="admin-input"
                  style={{ height: 'auto', padding: '8px 12px', width: '100%' }}
                  rows="2"
                  placeholder="Notes on garment condition or courier details..."
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                />
              </div>

              {/* Courier Fields if Shipped */}
              {(selectedExchange.status === 'ITEM_RECEIVED' || selectedExchange.status === 'PROCESSING' || selectedExchange.status === 'SHIPPED') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Courier Partner</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="E.g., BlueDart / Delhivery"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Tracking Number</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="E.g., AWB987654321"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Actions based on Lifecycle */}
            <div className="drawer-footer" style={{ padding: '16px 20px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end', borderTop: '1px solid var(--miraya-border)' }}>
              {selectedExchange.status === 'REQUESTED' && (
                <>
                  <button className="btn btn-outline" disabled={actionLoading} onClick={() => handleUpdateStatus(selectedExchange.id, 'REJECTED')}>
                    <Ban size={14} /> Reject Request
                  </button>
                  <button className="btn btn-primary" disabled={actionLoading} onClick={() => handleUpdateStatus(selectedExchange.id, 'APPROVED')}>
                    <CheckCircle size={14} /> Approve &amp; Reserve Size
                  </button>
                </>
              )}

              {(selectedExchange.status === 'APPROVED' || selectedExchange.status === 'AWAITING_ITEM') && (
                <>
                  <button className="btn btn-outline" disabled={actionLoading} onClick={() => handleUpdateStatus(selectedExchange.id, 'REJECTED')}>
                    Reject
                  </button>
                  <button className="btn btn-primary" disabled={actionLoading} onClick={() => handleUpdateStatus(selectedExchange.id, 'ITEM_RECEIVED')}>
                    <PackageCheck size={14} /> Mark Garment Received
                  </button>
                </>
              )}

              {(selectedExchange.status === 'ITEM_RECEIVED' || selectedExchange.status === 'PROCESSING') && (
                <button className="btn btn-primary" disabled={actionLoading} onClick={() => handleUpdateStatus(selectedExchange.id, 'SHIPPED')}>
                  <Truck size={14} /> Mark Replacement Shipped
                </button>
              )}

              {selectedExchange.status === 'SHIPPED' && (
                <button className="btn btn-primary" disabled={actionLoading} onClick={() => handleUpdateStatus(selectedExchange.id, 'COMPLETED')}>
                  <CheckCircle size={14} /> Mark Exchange Completed
                </button>
              )}

              {selectedExchange.status === 'COMPLETED' && (
                <span style={{ fontSize: '13px', color: '#15803d', fontWeight: '600' }}>✅ Exchange Completed &amp; Closed</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

