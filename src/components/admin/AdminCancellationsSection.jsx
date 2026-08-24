import React, { useState } from 'react';
import { RotateCcw, Search, Check, X, Eye, RefreshCw, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

export default function AdminCancellationsSection({ orders = [], token, API_BASE_URL, onRefresh }) {
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('pending'); // 'pending' | 'cancelled' | 'all'
  const [processingId, setProcessingId] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);
  const { toast } = useToast();

  const allOrders = Array.isArray(orders) ? orders : [];

  // Filter cancellation orders
  const cancellationOrders = allOrders.filter(o => {
    const isCancelReq = o.status === 'cancellation_requested';
    const isCancelled = o.status === 'cancelled';
    const isRejected = o.status === 'cancellation_rejected';
    
    if (statusTab === 'pending') return isCancelReq;
    if (statusTab === 'cancelled') return isCancelled;
    return isCancelReq || isCancelled || isRejected;
  });

  const filteredOrders = cancellationOrders.filter(o => {
    const custName = o.user?.name || o.shipping_name || '';
    const custEmail = o.user?.email || '';
    const orderIdStr = `#ORD-${o.id}`;
    const query = search.toLowerCase();

    return orderIdStr.toLowerCase().includes(query) ||
      custName.toLowerCase().includes(query) ||
      custEmail.toLowerCase().includes(query) ||
      (o.cancel_reason || '').toLowerCase().includes(query);
  });

  const pendingCount = allOrders.filter(o => o.status === 'cancellation_requested').length;
  const cancelledCount = allOrders.filter(o => o.status === 'cancelled').length;

  const handleAction = async (orderId, newStatus, actionText) => {
    setProcessingId(orderId);
    try {
      const activeToken = token || localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken && { Authorization: `Bearer ${activeToken}` })
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success(`Order #${orderId} ${actionText} successfully!`, 'CANCELLATION SYNCED');
        if (onRefresh) onRefresh();
      } else {
        toast.error(data.message || `Failed to update order #${orderId}`, 'SYNC ERROR');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error while updating cancellation request.', 'NETWORK ERROR');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <div className="page-actions">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Cancellation Requests
            {pendingCount > 0 && (
              <span className="status-badge status-warning" style={{ fontSize: '12px', padding: '2px 8px' }}>
                {pendingCount} Pending
              </span>
            )}
          </h2>
          <p>Review and process customer order cancellation requests and stock restorations.</p>
        </div>

        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={onRefresh}>
            <RefreshCw size={15} /> Refresh Data
          </button>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="admin-toolbar" style={{ flexDirection: 'column', gap: '14px', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`btn ${statusTab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusTab('pending')}
              style={{ fontSize: '13px' }}
            >
              <AlertTriangle size={14} /> Pending Requests ({pendingCount})
            </button>
            <button
              type="button"
              className={`btn ${statusTab === 'cancelled' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusTab('cancelled')}
              style={{ fontSize: '13px' }}
            >
              <CheckCircle size={14} /> Approved Cancelled ({cancelledCount})
            </button>
            <button
              type="button"
              className={`btn ${statusTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusTab('all')}
              style={{ fontSize: '13px' }}
            >
              All Cancellation Records
            </button>
          </div>

          <div className="search-input-wrap" style={{ maxWidth: '280px', width: '100%' }}>
            <Search size={16} />
            <input
              type="text"
              className="admin-input"
              placeholder="Search request by ID or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* CANCELLATION REQUESTS TABLE */}
      <div className="panel">
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Requested Date</th>
                <th>Reason</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => {
                const custName = o.user?.name || o.shipping_name || 'Valued Customer';
                const custEmail = o.user?.email || o.shippingDetails?.email || 'N/A';
                const isPending = o.status === 'cancellation_requested';
                const isCancelled = o.status === 'cancelled';

                return (
                  <tr key={o.id}>
                    <td>
                      <strong style={{ fontFamily: 'monospace', fontSize: '14px', color: 'var(--miraya-red)' }}>
                        #ORD-{o.id}
                      </strong>
                    </td>
                    <td>
                      <strong style={{ display: 'block', fontSize: '13px' }}>{custName}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--miraya-muted)' }}>{custEmail}</span>
                    </td>
                    <td>
                      {o.updated_at || o.created_at
                        ? new Date(o.updated_at || o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Recent'}
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      <span style={{ fontSize: '12px', fontStyle: 'italic', color: '#555', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        "{o.cancel_reason || 'Customer requested cancellation'}"
                      </span>
                    </td>
                    <td><strong style={{ color: 'var(--miraya-text)' }}>{formatINR(o.total)}</strong></td>
                    <td>
                      <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>
                        {o.payment_method || o.payment_id === 'COD' ? 'COD' : 'Online'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${isPending ? 'status-warning' : isCancelled ? 'status-danger' : 'status-neutral'}`}>
                        {isPending ? 'Pending Approval' : isCancelled ? 'Cancelled & Stock Restored' : o.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ minHeight: '30px', padding: '0 8px' }}
                          onClick={() => setViewOrder(o)}
                          title="View Order Details"
                        >
                          <Eye size={14} />
                        </button>

                        {isPending && (
                          <>
                            <button
                              className="btn btn-primary"
                              style={{ minHeight: '30px', padding: '0 10px', fontSize: '12px', background: '#27ae60', borderColor: '#27ae60' }}
                              onClick={() => handleAction(o.id, 'cancelled', 'cancellation approved')}
                              disabled={processingId === o.id}
                            >
                              <Check size={14} style={{ marginRight: '4px' }} />
                              {processingId === o.id ? 'Processing...' : 'Approve Cancel'}
                            </button>
                            <button
                              className="btn btn-outline"
                              style={{ minHeight: '30px', padding: '0 10px', fontSize: '12px', color: '#c0392b', borderColor: '#c0392b' }}
                              onClick={() => handleAction(o.id, 'processing', 'cancellation rejected & order kept active')}
                              disabled={processingId === o.id}
                            >
                              <X size={14} style={{ marginRight: '4px' }} />
                              Reject Request
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--miraya-muted)' }}>
                    No cancellation requests found under <strong>{statusTab}</strong> filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW ORDER DETAILS DRAWER */}
      {viewOrder && (
        <div className="admin-drawer-overlay" onClick={() => setViewOrder(null)}>
          <div className="admin-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Order Cancellation Details: #ORD-{viewOrder.id}</h3>
              <button onClick={() => setViewOrder(null)} style={{ background: 'none', border: 'none' }}><X size={18} /></button>
            </div>
            <div className="drawer-content">
              <div style={{ background: 'var(--miraya-red-soft)', border: '1px solid var(--miraya-red)', padding: '14px', borderRadius: '8px', marginBottom: '18px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'var(--miraya-red)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} /> Cancellation Reason:
                </h4>
                <p style={{ margin: 0, fontSize: '13px', fontStyle: 'italic' }}>
                  "{viewOrder.cancel_reason || 'Customer requested order cancellation.'}"
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div><span style={{ color: 'var(--miraya-muted)', fontSize: '12px' }}>Customer Name:</span><h4 style={{ margin: '4px 0', fontSize: '14px' }}>{viewOrder.user?.name || viewOrder.shipping_name || 'Customer'}</h4></div>
                <div><span style={{ color: 'var(--miraya-muted)', fontSize: '12px' }}>Order Total:</span><h4 style={{ margin: '4px 0', fontSize: '16px', color: 'var(--miraya-red)' }}>{formatINR(viewOrder.total)}</h4></div>
                <div><span style={{ color: 'var(--miraya-muted)', fontSize: '12px' }}>Phone:</span><p style={{ margin: '4px 0' }}>{viewOrder.user?.phone || viewOrder.shipping_phone || 'N/A'}</p></div>
                <div><span style={{ color: 'var(--miraya-muted)', fontSize: '12px' }}>Shipping City:</span><p style={{ margin: '4px 0' }}>{viewOrder.shipping_city || 'N/A'}, {viewOrder.shipping_state || ''}</p></div>
              </div>

              <h4 style={{ marginBottom: '10px' }}>Ordered Outfits:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(viewOrder.items || []).map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'var(--miraya-bg)', borderRadius: '6px', border: '1px solid var(--miraya-border)' }}>
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block' }}>{it.product?.name || `Item #${it.product_id}`}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--miraya-muted)' }}>Size: {it.size} | Qty: {it.quantity}</span>
                    </div>
                    <strong style={{ fontSize: '13px' }}>{formatINR(it.price_at_purchase * it.quantity)}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="drawer-footer">
              <button className="btn btn-secondary" onClick={() => setViewOrder(null)}>Close</button>
              {viewOrder.status === 'cancellation_requested' && (
                <button
                  className="btn btn-primary"
                  style={{ background: '#27ae60', borderColor: '#27ae60' }}
                  onClick={() => {
                    handleAction(viewOrder.id, 'cancelled', 'cancellation approved');
                    setViewOrder(null);
                  }}
                >
                  Approve Cancellation & Restore Stock
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
