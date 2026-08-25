import React, { useState } from 'react';
import {
  Download, Search, Eye, X, RefreshCw, ShoppingBag,
  MapPin, Phone, Mail, User, AlertCircle, FileText, Printer
} from 'lucide-react';
import { exportOrdersPDF } from '../../utils/pdfExportHelper';
import { getProductImage } from '../../utils/imageHelper';

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

const checkIsPaid = (order) => {
  if (!order) return false;
  if (String(order.payment_status || '').toLowerCase() === 'paid') return true;
  if (String(order.payment_method || '').toLowerCase().includes('razorpay') || String(order.payment_method || '').toLowerCase().includes('online')) return true;
  if (order.payment_id && order.payment_id !== 'COD' && order.payment_id !== 'CASH_ON_DELIVERY') return true;
  if (order.razorpay_order_id) return true;
  if (Array.isArray(order.payments) && order.payments.some(p => p.status === 'PAID' || p.gateway === 'RAZORPAY')) return true;
  return false;
};

const getPaymentInfo = (order) => {
  const isPaid = checkIsPaid(order);
  const paymentRecord = Array.isArray(order?.payments) && order.payments.length > 0 ? order.payments[0] : null;

  const gateway = paymentRecord?.gateway || (isPaid ? 'RAZORPAY' : 'COD');
  const transactionId = order?.transaction_id || order?.payment_id || paymentRecord?.gateway_payment_id || (isPaid ? 'Prepaid Online' : `COD-${order?.id || 'PENDING'}`);
  const razorpayOrderId = order?.razorpay_order_id || paymentRecord?.gateway_order_id || 'N/A';
  const status = isPaid ? 'PAID & CONFIRMED' : (order?.status === 'cancelled' ? 'CANCELLED' : 'COD PENDING');
  const methodLabel = isPaid ? 'Online Payment (Razorpay)' : 'Cash On Delivery (COD)';

  return { isPaid, gateway, transactionId, razorpayOrderId, status, methodLabel };
};

export default function AdminOrdersSection({ orders = [], token, API_BASE_URL, onRefresh }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceModalOrder, setInvoiceModalOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const pendingCancellationCount = orders.filter(o => o.status === 'cancellation_requested').length;

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch = String(o.id).includes(q) ||
      (o.user?.name && o.user.name.toLowerCase().includes(q)) ||
      (o.user?.email && o.user.email.toLowerCase().includes(q)) ||
      (o.shipping_name && o.shipping_name.toLowerCase().includes(q)) ||
      (o.shipping_phone && o.shipping_phone.includes(q));

    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    return o.status?.toLowerCase() === filter.toLowerCase();
  });

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        if (onRefresh) onRefresh();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      }
    } catch (e) {
      console.error('Status update error:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered') return { label: 'Delivered', type: 'success' };
    if (s === 'shipped') return { label: 'Shipped', type: 'info' };
    if (s === 'processing' || s === 'confirmed') return { label: s.charAt(0).toUpperCase() + s.slice(1), type: 'info' };
    if (s === 'cancellation_requested') return { label: 'Cancel Requested', type: 'danger' };
    if (s === 'cancelled') return { label: 'Cancelled', type: 'neutral' };
    return { label: 'Pending', type: 'warning' };
  };

  const downloadInvoicePDF = (orderId) => {
    const activeToken = token || localStorage.getItem('token');
    window.open(`${API_BASE_URL}/api/orders/${orderId}/invoice?token=${activeToken}`, '_blank');
  };

  const openInvoiceModal = (order) => {
    setInvoiceModalOrder(order);
  };

  // Export filtered orders to CSV document
  const exportOrdersCSV = () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      alert('No orders available to export.');
      return;
    }

    const headers = [
      'Order ID',
      'Invoice No',
      'Date & Time',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Shipping Address',
      'City',
      'State',
      'Pincode',
      'Items Detail',
      'Total Items Qty',
      'Subtotal (INR)',
      'GST (12% INR)',
      'Total Amount (INR)',
      'Payment Mode',
      'Payment Status',
      'Fulfillment Status'
    ];

    const rows = filteredOrders.map(o => {
      const isPaid = checkIsPaid(o);
      const paymentInfo = getPaymentInfo(o);
      const itemsDetail = (o.items || []).map(it => `${it.product?.name || it.title || 'Outfit'} (Size: ${it.variant?.size || it.size || 'M'}, Qty: ${it.quantity || 1})`).join(' | ');
      const totalQty = (o.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0) || 1;
      const subtotal = Number(o.total || 0);
      const gst = Math.round((subtotal * 12) / 112);
      const net = subtotal - gst;

      return [
        `#ORD-${o.id}`,
        `INV-MRY-${String(o.id).padStart(5, '0')}`,
        o.created_at ? new Date(o.created_at).toLocaleString('en-IN') : 'N/A',
        `"${(o.user?.name || o.shipping_name || 'Customer').replace(/"/g, '""')}"`,
        `"${(o.user?.email || o.shippingDetails?.email || 'N/A').replace(/"/g, '""')}"`,
        `"${(o.shipping_phone || o.user?.phone || 'N/A').replace(/"/g, '""')}"`,
        `"${(o.shipping_address || 'N/A').replace(/"/g, '""')}"`,
        `"${(o.shipping_city || '').replace(/"/g, '""')}"`,
        `"${(o.shipping_state || '').replace(/"/g, '""')}"`,
        `"${(o.shipping_pincode || '').replace(/"/g, '""')}"`,
        `"${itemsDetail.replace(/"/g, '""')}"`,
        totalQty,
        net,
        gst,
        subtotal,
        `"${(o.payment_method || (o.payment_id ? 'Razorpay Online' : 'COD')).replace(/"/g, '""')}"`,
        isPaid ? 'Paid' : 'COD Pending',
        `"${(o.status || 'Pending').toUpperCase()}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Miraya_Orders_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* HEADER */}
      <div className="page-actions">
        <div>
          <h2>Orders</h2>
          <p>Track customer orders, luxury tax invoices, payments and fulfillment.</p>
        </div>

        <div className="action-buttons">
          <button
            type="button"
            className="btn btn-outline"
            style={{ borderColor: '#c6a46a', color: '#5e0a0b', fontWeight: 700 }}
            onClick={() => exportOrdersPDF(filteredOrders, filter)}
            title="Export full orders ledger as styled Luxury PDF document"
          >
            <FileText size={14} /> Export Orders (PDF)
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={exportOrdersCSV}
            title="Export Orders to Excel/CSV spreadsheet"
          >
            <Download size={14} /> CSV
          </button>

          {pendingCancellationCount > 0 && (
            <span className="status-badge status-danger" style={{ padding: '8px 12px', fontSize: '12px' }}>
              <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              {pendingCancellationCount} Cancellation Request(s)
            </span>
          )}
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="admin-toolbar">
        <div className="toolbar-left">
          <div className="search-input-wrap">
            <Search size={16} />
            <input
              type="text"
              className="admin-input"
              placeholder="Search by order ID, customer name, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="admin-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="toolbar-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--miraya-muted)' }}>
            Showing <strong>{filteredOrders.length}</strong> Orders
          </span>
        </div>
      </div>

      {/* ORDERS TABLE */}
      <div className="panel">
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Payment Status</th>
                <th>Order Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => {
                const badge = getStatusBadge(o.status);
                const itemsCount = o.items ? o.items.reduce((sum, it) => sum + (it.quantity || 1), 0) : 1;
                const isPaid = checkIsPaid(o);
                const paymentInfo = getPaymentInfo(o);

                return (
                  <tr key={o.id}>
                    <td><strong>#ORD-{o.id}</strong></td>
                    <td>
                      <strong style={{ display: 'block', fontSize: '13px' }}>{o.user?.name || o.shipping_name || 'Customer'}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--miraya-muted)' }}>{o.user?.email || o.shipping_phone || ''}</span>
                    </td>
                    <td>{itemsCount} item{itemsCount > 1 ? 's' : ''}</td>
                    <td style={{ fontWeight: '700' }}>{formatINR(o.total)}</td>
                    <td>
                      <span className={`status-badge ${isPaid ? 'status-success' : 'status-warning'}`}>
                        {isPaid ? 'Paid (Online)' : 'COD (Pending)'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${badge.type}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ color: 'var(--miraya-muted)' }}>
                      {o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-outline"
                          style={{ minHeight: '32px', padding: '0 10px', fontSize: '12px' }}
                          onClick={() => openInvoiceModal(o)}
                          title="Preview & Print Official Tax Invoice"
                        >
                          <FileText size={13} /> Invoice
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ minHeight: '32px', padding: '0 12px' }}
                          onClick={() => setSelectedOrder(o)}
                          title="View Full Order Details"
                        >
                          <Eye size={14} /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--miraya-muted)' }}>
                    No customer orders found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW ORDER RIGHT DRAWER */}
      {selectedOrder && (() => {
        const pInfo = getPaymentInfo(selectedOrder);
        const subtotal = Number(selectedOrder.total || 0);
        const gst = Math.round((subtotal * 12) / 112);
        const netTaxable = subtotal - gst;

        return (
          <div className="admin-drawer-overlay" data-lenis-prevent="true" onClick={() => setSelectedOrder(null)}>
            <div className="admin-drawer" data-lenis-prevent="true" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header">
                <h3>Order #ORD-{selectedOrder.id}</h3>
                <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none' }}><X size={18} /></button>
              </div>

              <div className="drawer-content" data-lenis-prevent="true">
                {/* ORDER META & STATUS UPDATE */}
                <div style={{ background: 'var(--miraya-bg)', border: '1px solid var(--miraya-border)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--miraya-muted)', display: 'block' }}>Date Placed</span>
                      <strong style={{ fontSize: '13px' }}>{selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString('en-IN') : '—'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--miraya-muted)', display: 'block' }}>Order Status</span>
                      <strong style={{ fontSize: '13px', textTransform: 'capitalize' }}>{selectedOrder.status || 'pending'}</strong>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Update Order Fulfillment Status</label>
                    <select
                      className="admin-select"
                      style={{ width: '100%' }}
                      value={selectedOrder.status || 'pending'}
                      disabled={updatingId === selectedOrder.id}
                      onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* DETAILED PAYMENT & GATEWAY INFORMATION */}
                <div style={{ marginBottom: '16px', background: pInfo.isPaid ? '#f0fdf4' : '#fffbe6', border: `1px solid ${pInfo.isPaid ? '#bbf7d0' : '#ffe58f'}`, padding: '14px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: pInfo.isPaid ? '#15803d' : '#d48806' }}>
                      💳 Payment & Gateway Details
                    </h4>
                    <span className={`status-badge ${pInfo.isPaid ? 'status-success' : 'status-warning'}`}>
                      {pInfo.isPaid ? 'PAID & CONFIRMED' : 'COD (PENDING)'}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                    <div>
                      <span style={{ color: 'var(--miraya-muted)', fontSize: '11px', display: 'block' }}>Payment Method</span>
                      <strong style={{ fontSize: '12px' }}>{pInfo.methodLabel}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--miraya-muted)', fontSize: '11px', display: 'block' }}>Gateway</span>
                      <strong style={{ fontSize: '12px' }}>{pInfo.gateway}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--miraya-muted)', fontSize: '11px', display: 'block' }}>Transaction ID / Ref</span>
                      <strong style={{ fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{pInfo.transactionId}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--miraya-muted)', fontSize: '11px', display: 'block' }}>Razorpay Order ID</span>
                      <strong style={{ fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{pInfo.razorpayOrderId}</strong>
                    </div>
                  </div>
                </div>

                {/* CUSTOMER DETAILS & SHIPPING ADDRESS */}
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600' }}>Customer & Shipping Details</h4>
                  <div style={{ background: 'var(--miraya-white)', border: '1px solid var(--miraya-border)', padding: '14px', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '600' }}><User size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> {selectedOrder.user?.name || selectedOrder.shipping_name || 'Customer'}</p>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--miraya-muted)' }}><Mail size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> {selectedOrder.user?.email || selectedOrder.shippingDetails?.email || 'N/A'}</p>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--miraya-muted)' }}><Phone size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> {selectedOrder.shipping_phone || selectedOrder.user?.phone || 'N/A'}</p>
                    <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--miraya-text)' }}>
                      <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                      {[selectedOrder.shipping_address, selectedOrder.shipping_city, selectedOrder.shipping_state, selectedOrder.shipping_pincode].filter(Boolean).join(', ') || 'Address on record'}
                    </p>
                  </div>
                </div>

                {/* ORDER ITEMS LIST */}
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600' }}>Ordered Items</h4>
                  <div style={{ border: '1px solid var(--miraya-border)', borderRadius: '8px', overflow: 'hidden' }}>
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((it, index) => {
                        const productCategory = it.product?.category || 'all';
                        const productId = it.product?.id || it.product_id || it.id || '';
                        const productRoute = `/product/${productCategory}/${productId}`;
                        const itemImage = getProductImage(it.product?.image_url || it.product?.image || (it.product?.images && it.product?.images[0]) || it.image);

                        return (
                          <div key={index} style={{ padding: '12px 14px', borderBottom: index < selectedOrder.items.length - 1 ? '1px solid var(--miraya-border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                              <a href={productRoute} target="_blank" rel="noopener noreferrer" style={{ display: 'block', flexShrink: 0, textDecoration: 'none' }} title="View Product in New Tab">
                                <img src={itemImage} alt={it.product?.name || 'Product'} style={{ width: '48px', height: '56px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--miraya-border)', background: '#FAF8F5' }} />
                              </a>
                              <div>
                                <a href={productRoute} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} title="View Product in New Tab">
                                  <strong style={{ fontSize: '13px', display: 'block' }} className="admin-product-link">
                                    {it.product?.name || it.title || 'Outfit'}
                                  </strong>
                                </a>
                                <span style={{ fontSize: '11px', color: 'var(--miraya-muted)' }}>
                                  Size: {it.variant?.size || it.size || 'M'} | SKU: {it.sku_snapshot || it.variant?.sku || 'N/A'} | Qty: {it.quantity || 1}
                                </span>
                              </div>
                            </div>
                            <strong style={{ fontSize: '13px' }}>{formatINR((it.price_at_purchase || it.price || it.product?.price || 0) * (it.quantity || 1))}</strong>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: '14px', textAlign: 'center', color: 'var(--miraya-muted)', fontSize: '12px' }}>Garment details on invoice record</div>
                    )}
                  </div>

                  {/* PRICING BREAKDOWN */}
                  <div style={{ marginTop: '14px', padding: '12px', background: 'var(--miraya-bg)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <span>Net Taxable Subtotal:</span>
                      <span>{formatINR(netTaxable)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <span>GST (12% Included):</span>
                      <span>{formatINR(gst)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <span>Atelier Shipping:</span>
                      <span style={{ color: 'var(--miraya-green)', fontWeight: '600' }}>Free</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', borderTop: '1px solid var(--miraya-border)', paddingTop: '8px', marginTop: '6px' }}>
                      <span>Total Amount Paid:</span>
                      <span style={{ color: 'var(--miraya-red)' }}>{formatINR(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="drawer-footer">
                <button className="btn btn-outline" onClick={() => openInvoiceModal(selectedOrder)}>
                  <FileText size={15} /> Open Invoice Preview
                </button>
                <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* INVOICE PREVIEW MODAL WITH PRINT & DOWNLOAD */}
      {invoiceModalOrder && (() => {
        const invPInfo = getPaymentInfo(invoiceModalOrder);
        const invSubtotal = Number(invoiceModalOrder.total || 0);
        const invGst = Math.round((invSubtotal * 12) / 112);
        const invNetTaxable = invSubtotal - invGst;
        const invDate = invoiceModalOrder.created_at
          ? new Date(invoiceModalOrder.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : new Date().toLocaleDateString('en-IN');

        return (
          <div className="admin-drawer-overlay" data-lenis-prevent="true" style={{ zIndex: 1050, background: 'rgba(0, 0, 0, 0.75)' }} onClick={() => setInvoiceModalOrder(null)}>
            <div
              data-lenis-prevent="true"
              style={{
                width: '900px',
                maxWidth: '95vw',
                maxHeight: '92vh',
                background: '#ffffff',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                margin: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* TOP ACTION BAR */}
              <div
                className="no-print"
                style={{
                  padding: '14px 20px',
                  background: '#5e0a0b',
                  color: '#ffffff',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  borderBottom: '2px solid #c6a46a'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} style={{ color: '#c6a46a' }} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                    Tax Invoice Preview (#INV-MRY-{String(invoiceModalOrder.id).padStart(5, '0')})
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn"
                    style={{ background: '#c6a46a', color: '#5e0a0b', fontWeight: 700, border: 'none', padding: '6px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    onClick={() => window.print()}
                    title="Print Tax Invoice"
                  >
                    <Printer size={15} /> Print Invoice
                  </button>

                  <button
                    type="button"
                    className="btn"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 600, padding: '6px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    onClick={() => downloadInvoicePDF(invoiceModalOrder.id)}
                    title="Download PDF File"
                  >
                    <Download size={15} /> Download PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => setInvoiceModalOrder(null)}
                    style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* PRINTABLE INVOICE BODY */}
              <div data-lenis-prevent="true" className="printable-store-report miraya-invoice-printable" style={{ padding: '24px 32px', overflowY: 'auto', flex: 1, background: '#FAF8F5' }} id="miraya-invoice-printable">
                {/* BRAND & HEADER BANNER */}
                <div style={{ borderTop: '4px solid #5e0a0b', borderBottom: '1px solid #e6d8c3', paddingTop: '12px', paddingBottom: '14px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h1 style={{ margin: 0, fontSize: '24px', fontFamily: 'serif', letterSpacing: '2px', color: '#5e0a0b' }}>
                        MIRAYA BY GARIMA
                      </h1>
                      <span style={{ fontSize: '10px', letterSpacing: '1.5px', color: '#c6a46a', fontWeight: 700, display: 'block', marginTop: '2px' }}>
                        HAUTE COUTURE & LUXURY TROUSSEAU
                      </span>
                      <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#555555', lineHeight: '1.4' }}>
                        Flagship Atelier: Shop no. UG/5, Jagat Plaza, Law College Sq., Amravati Rd, Nagpur, MH 440033<br />
                        GSTIN: <strong>27AABCM9876Q1Z5</strong> | State Code: 27 (Maharashtra) | Ph: +91 92712 18156
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ background: '#5e0a0b', color: '#ffffff', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, display: 'inline-block', marginBottom: '6px' }}>
                        OFFICIAL TAX INVOICE
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>
                        INV-MRY-{String(invoiceModalOrder.id).padStart(5, '0')}
                      </div>
                      <div style={{ fontSize: '11px', color: '#555555', marginTop: '2px' }}>
                        Date: {invDate}
                      </div>
                      <div style={{ fontSize: '11px', color: '#555555' }}>
                        Order Ref: <strong>#ORD-{invoiceModalOrder.id}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BILLED TO & SHIPPED TO DUAL CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: '#ffffff', border: '1px solid #e6d8c3', padding: '14px', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', textTransform: 'uppercase', color: '#5e0a0b', letterSpacing: '0.5px' }}>
                      Billed To (Client Details)
                    </h4>
                    <strong style={{ fontSize: '14px', color: '#1a1a1a', display: 'block' }}>
                      {invoiceModalOrder.user?.name || invoiceModalOrder.shipping_name || 'Valued Client'}
                    </strong>
                    <span style={{ fontSize: '12px', color: '#555555', display: 'block', marginTop: '3px' }}>
                      Email: {invoiceModalOrder.user?.email || invoiceModalOrder.shippingDetails?.email || 'N/A'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#555555', display: 'block', marginTop: '2px' }}>
                      Phone: {invoiceModalOrder.shipping_phone || invoiceModalOrder.user?.phone || 'N/A'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#888888', display: 'block', marginTop: '4px' }}>
                      Place of Supply: {invoiceModalOrder.shipping_state || 'Maharashtra'} (State Code 27)
                    </span>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #e6d8c3', padding: '14px', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', textTransform: 'uppercase', color: '#5e0a0b', letterSpacing: '0.5px' }}>
                      Shipped To (Delivery Address)
                    </h4>
                    <strong style={{ fontSize: '14px', color: '#1a1a1a', display: 'block' }}>
                      {invoiceModalOrder.shipping_name || invoiceModalOrder.user?.name || 'Valued Client'}
                    </strong>
                    <span style={{ fontSize: '12px', color: '#555555', display: 'block', marginTop: '3px', lineHeight: '1.4' }}>
                      {[invoiceModalOrder.shipping_address, invoiceModalOrder.shipping_city, invoiceModalOrder.shipping_state, invoiceModalOrder.shipping_pincode].filter(Boolean).join(', ') || 'Nagpur Atelier Dispatch'}
                    </span>
                  </div>
                </div>

                {/* ITEMS SPECIFICATION TABLE */}
                <div style={{ background: '#ffffff', border: '1px solid #e6d8c3', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#5e0a0b', color: '#ffffff', textAlign: 'left', fontSize: '11px' }}>
                        <th style={{ padding: '10px 12px', width: '40px' }}>#</th>
                        <th style={{ padding: '10px 12px' }}>Garment & Design Specification</th>
                        <th style={{ padding: '10px 12px' }}>HSN</th>
                        <th style={{ padding: '10px 12px' }}>Size / SKU</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Rate (₹)</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceModalOrder.items && invoiceModalOrder.items.length > 0 ? (
                        invoiceModalOrder.items.map((it, idx) => {
                          const unitPrice = Number(it.price_at_purchase || it.price || it.product?.price || 0);
                          const qty = Number(it.quantity || 1);
                          const itemTotal = unitPrice * qty;

                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #f0e6d8', background: idx % 2 === 0 ? '#ffffff' : '#faf8f5' }}>
                              <td style={{ padding: '10px 12px', color: '#888888' }}>{idx + 1}</td>
                              <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1a1a1a' }}>
                                {it.product?.name || it.title || 'Haute Couture Outfit'}
                              </td>
                              <td style={{ padding: '10px 12px', color: '#555555' }}>6204</td>
                              <td style={{ padding: '10px 12px', color: '#555555' }}>
                                {it.sku_snapshot || it.variant?.sku || it.size || 'M'}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{qty}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatINR(unitPrice)}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#5e0a0b' }}>
                                {formatINR(itemTotal)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} style={{ padding: '16px', textAlign: 'center', color: '#888888' }}>Garment specification on order record</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAYMENT STAMP & PRICING SUMMARY */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', alignItems: 'flex-start' }}>
                  {/* PAYMENT STAMP BOX */}
                  <div style={{ background: invPInfo.isPaid ? '#f0fdf4' : '#fffbe6', border: `1.5px solid ${invPInfo.isPaid ? '#22c55e' : '#f59e0b'}`, padding: '14px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: invPInfo.isPaid ? '#15803d' : '#b45309', marginBottom: '6px' }}>
                      {invPInfo.isPaid ? '✓ PAID & CONFIRMED' : '⏳ COD - PAYMENT DUE'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#555555', lineHeight: '1.5' }}>
                      <div>Payment Method: <strong>{invPInfo.methodLabel}</strong></div>
                      <div>Gateway: <strong>{invPInfo.gateway}</strong></div>
                      <div>Transaction ID: <strong style={{ fontFamily: 'monospace' }}>{invPInfo.transactionId}</strong></div>
                      <div>Fulfillment Status: <strong style={{ textTransform: 'uppercase' }}>{invoiceModalOrder.status || 'PROCESSING'}</strong></div>
                    </div>
                  </div>

                  {/* TOTALS SUMMARY TABLE */}
                  <div style={{ background: '#ffffff', border: '1px solid #e6d8c3', padding: '14px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555555', marginBottom: '6px' }}>
                      <span>Net Taxable Subtotal:</span>
                      <span>{formatINR(invNetTaxable)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555555', marginBottom: '6px' }}>
                      <span>GST (12% Included):</span>
                      <span>{formatINR(invGst)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555555', marginBottom: '8px' }}>
                      <span>Packaging & Shipping:</span>
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>Free</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700, borderTop: '2px solid #5e0a0b', paddingTop: '8px', color: '#5e0a0b' }}>
                      <span>GRAND TOTAL (INR):</span>
                      <span>{formatINR(invoiceModalOrder.total)}</span>
                    </div>
                  </div>
                </div>

                {/* AUTHORIZED SIGNATURE FOOTER */}
                <div style={{ borderTop: '1px solid #e6d8c3', marginTop: '24px', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#888888', maxWidth: '350px' }}>
                    * Professional Dry Clean Only. Computer generated tax invoice issued by Miraya By Garima Nagpur Atelier.
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#5e0a0b', display: 'block' }}>FOR MIRAYA BY GARIMA</span>
                    <span style={{ fontSize: '10px', color: '#c6a46a', fontWeight: 700 }}>Authorized Couturier Seal ◈</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
