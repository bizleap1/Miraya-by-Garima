import React, { useState, useEffect } from 'react';
import {
  Truck, Plus, Search, Filter, RefreshCw, CheckCircle, AlertTriangle,
  ChevronLeft, ChevronRight, X, Eye, FileText, ArrowRight, Package
} from 'lucide-react';
import './AdminPurchasesSection.css';

export default function AdminPurchasesSection({ token, API_BASE_URL }) {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Create / Edit Purchase Modal
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [modalSupplierId, setModalSupplierId] = useState('');
  const [modalInvoiceNumber, setModalInvoiceNumber] = useState('');
  const [modalPurchaseDate, setModalPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [modalTax, setModalTax] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [modalItems, setModalItems] = useState([]);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Item selector helpers inside create modal
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemCostPrice, setItemCostPrice] = useState('');

  // Receive Confirmation Modal
  const [receiveTargetPurchase, setReceiveTargetPurchase] = useState(null);
  const [receiving, setReceiving] = useState(false);

  // View Details Modal
  const [viewPurchase, setViewPurchase] = useState(null);

  // Fetch Suppliers and Products for selectors
  useEffect(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API_BASE_URL}/api/suppliers`, { headers })
      .then(r => r.json())
      .then(d => setSuppliers(d.suppliers || []))
      .catch(() => setSuppliers([]));

    fetch(`${API_BASE_URL}/api/products`)
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : []))
      .catch(() => setProducts([]));
  }, [API_BASE_URL, token]);

  const fetchPurchases = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 15,
      });

      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (supplierFilter) params.append('supplier_id', supplierFilter);

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/api/purchases?${params.toString()}`, { headers });
      const data = await res.json();

      if (data.success) {
        setPurchases(data.purchases || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      } else {
        setError(data.message || 'Error fetching purchase orders.');
      }
    } catch (err) {
      setError('Network error while loading purchases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [currentPage, statusFilter, supplierFilter]);

  // Handle Add Item to Purchase Draft
  const handleAddItemToDraft = () => {
    if (!selectedVariantId) {
      alert('Please select a product variant.');
      return;
    }
    const qty = parseInt(itemQuantity, 10);
    const cost = parseFloat(itemCostPrice);

    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid positive quantity.');
      return;
    }
    if (isNaN(cost) || cost < 0) {
      alert('Please enter a valid cost price.');
      return;
    }

    const prod = products.find(p => p.id === parseInt(selectedProductId, 10));
    const variant = prod?.variants?.find(v => v.id === parseInt(selectedVariantId, 10));

    if (!variant) {
      alert('Selected variant not found.');
      return;
    }

    const existingIdx = modalItems.findIndex(it => it.variant_id === variant.id);
    if (existingIdx > -1) {
      const updated = [...modalItems];
      updated[existingIdx].quantity += qty;
      updated[existingIdx].cost_price = cost;
      updated[existingIdx].total = updated[existingIdx].quantity * cost;
      setModalItems(updated);
    } else {
      setModalItems([
        ...modalItems,
        {
          variant_id: variant.id,
          product_id: prod.id,
          product_name: prod.name,
          sku: variant.sku,
          size: variant.size,
          quantity: qty,
          cost_price: cost,
          total: qty * cost,
        },
      ]);
    }

    setSelectedVariantId('');
    setItemQuantity('1');
    setItemCostPrice('');
  };

  const handleRemoveDraftItem = (idx) => {
    setModalItems(prev => prev.filter((_, i) => i !== idx));
  };

  const draftSubtotal = modalItems.reduce((sum, it) => sum + it.total, 0);
  const draftTax = parseFloat(modalTax) || 0;
  const draftGrandTotal = draftSubtotal + draftTax;

  // Submit Purchase Create
  const handleCreatePurchaseSubmit = async (e) => {
    e.preventDefault();
    if (modalItems.length === 0) {
      setModalError('Please add at least one line item to inward.');
      return;
    }

    setModalSubmitting(true);
    setModalError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          supplier_id: modalSupplierId ? parseInt(modalSupplierId, 10) : null,
          invoice_number: modalInvoiceNumber.trim() || null,
          purchase_date: modalPurchaseDate,
          tax: draftTax,
          notes: modalNotes.trim() || null,
          items: modalItems.map(it => ({
            variant_id: it.variant_id,
            quantity: it.quantity,
            cost_price: it.cost_price,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPurchaseModalOpen(false);
        setModalItems([]);
        setModalSupplierId('');
        setModalInvoiceNumber('');
        setModalNotes('');
        setModalTax('');
        fetchPurchases();
      } else {
        setModalError(data.message || 'Error creating purchase order.');
      }
    } catch (err) {
      setModalError('Network error while saving purchase order.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Confirm Inward Stock Action
  const handleConfirmReceive = async () => {
    if (!receiveTargetPurchase) return;
    setReceiving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/purchases/${receiveTargetPurchase.id}/receive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setReceiveTargetPurchase(null);
        fetchPurchases();
      } else {
        alert(data.message || 'Error receiving stock inward.');
      }
    } catch (err) {
      alert('Network error while receiving purchase.');
    } finally {
      setReceiving(false);
    }
  };

  // Cancel Purchase Action
  const handleCancelPurchase = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this draft purchase order?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/purchases/${id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Purchase order cancelled.');
        fetchPurchases();
      } else {
        alert(data.message || 'Error cancelling purchase.');
      }
    } catch (err) {
      alert('Network error while cancelling purchase.');
    }
  };

  const selectedProduct = products.find(p => p.id === parseInt(selectedProductId, 10));

  return (
    <div className="admin-purchases-section">
      {/* HEADER */}
      <div className="purchases-header-block">
        <div>
          <h2 className="section-title">
            <Truck className="title-icon" size={22} /> PURCHASES & STOCK INWARD
          </h2>
          <p className="section-desc">
            Supplier purchase orders, artisan shipments, and atomic inventory inwarding.
          </p>
        </div>

        <div className="header-actions">
          <button
            className="btn-gold-action"
            onClick={() => {
              setPurchaseModalOpen(true);
              setModalError(null);
            }}
          >
            <Plus size={16} /> NEW PURCHASE ORDER
          </button>
          <button className="btn-icon-refresh" onClick={fetchPurchases} title="Refresh">
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="purchases-toolbar">
        <div className="search-form">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search PO #, Invoice #, or Supplier..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
          <button onClick={() => { setCurrentPage(1); fetchPurchases(); }} className="btn-search">SEARCH</button>
        </div>

        <div className="filters-group">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ORDERED">Ordered</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={supplierFilter}
            onChange={e => { setSupplierFilter(e.target.value); setCurrentPage(1); }}
            className="filter-select"
          >
            <option value="">All Suppliers</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="inventory-error-banner"><AlertTriangle size={16} /> {error}</div>}

      {/* PURCHASES TABLE */}
      <div className="purchases-table-wrapper">
        <table className="purchases-table">
          <thead>
            <tr>
              <th>PO NUMBER</th>
              <th>SUPPLIER</th>
              <th>INVOICE #</th>
              <th>PURCHASE DATE</th>
              <th>ITEMS</th>
              <th>TOTAL AMOUNT</th>
              <th>STATUS</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>Loading purchases...</td></tr>
            ) : purchases.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>No purchase orders found.</td></tr>
            ) : (
              purchases.map(p => {
                const totalItemsCount = (p.items || []).reduce((sum, it) => sum + it.quantity, 0);
                return (
                  <tr key={p.id}>
                    <td><strong className="po-number">{p.purchase_number}</strong></td>
                    <td>{p.supplier?.name || <span className="text-muted">Unassigned</span>}</td>
                    <td>{p.invoice_number || <span className="text-muted">N/A</span>}</td>
                    <td>{new Date(p.purchase_date).toLocaleDateString('en-IN')}</td>
                    <td>{totalItemsCount} units ({p.items?.length || 0} variants)</td>
                    <td><strong>₹{Number(p.total).toLocaleString('en-IN')}</strong></td>
                    <td>
                      <span className={`status-badge status-${p.status.toLowerCase()}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-btns-group">
                        <button
                          className="btn-table-action"
                          onClick={() => setViewPurchase(p)}
                          title="View Details"
                        >
                          <Eye size={14} /> View
                        </button>

                        {p.status === 'DRAFT' || p.status === 'ORDERED' ? (
                          <>
                            <button
                              className="btn-table-action receive"
                              onClick={() => setReceiveTargetPurchase(p)}
                              title="Receive Stock Inward"
                            >
                              <CheckCircle size={14} /> Inward Stock
                            </button>
                            <button
                              className="btn-table-action cancel"
                              onClick={() => handleCancelPurchase(p.id)}
                              title="Cancel PO"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="inventory-pagination">
        <div className="page-info">
          Showing <strong>{purchases.length}</strong> of <strong>{totalCount}</strong> purchase orders
        </div>
        <div className="page-buttons">
          <button
            className="btn-page"
            disabled={currentPage <= 1 || loading}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} /> PREV
          </button>
          <span className="current-page-tag">Page {currentPage} of {totalPages}</span>
          <button
            className="btn-page"
            disabled={currentPage >= totalPages || loading}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            NEXT <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* MODAL 1: CREATE NEW PURCHASE ORDER */}
      {purchaseModalOpen && (
        <div className="modal-overlay" data-lenis-prevent="true" onClick={() => setPurchaseModalOpen(false)}>
          <div className="modal-card purchase-create-modal" data-lenis-prevent="true" style={{ overscrollBehavior: 'contain' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Truck size={18} color="#c6a46a" />
                <span>CREATE PURCHASE / STOCK INWARD ORDER</span>
              </div>
              <button className="btn-close-modal" onClick={() => setPurchaseModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {modalError && (
                <div className="modal-error-alert"><AlertTriangle size={16} /> {modalError}</div>
              )}

              <form onSubmit={handleCreatePurchaseSubmit} className="modal-form">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Supplier / Weaver</label>
                    <select
                      value={modalSupplierId}
                      onChange={e => setModalSupplierId(e.target.value)}
                      className="modal-input"
                    >
                      <option value="">Select Supplier (Optional)</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.contact_person || s.phone || 'Supplier'})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Supplier's Invoice / Challan #</label>
                    <input
                      type="text"
                      placeholder="e.g. INV-2026-890"
                      value={modalInvoiceNumber}
                      onChange={e => setModalInvoiceNumber(e.target.value)}
                      className="modal-input"
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Purchase Date</label>
                    <input
                      type="date"
                      value={modalPurchaseDate}
                      onChange={e => setModalPurchaseDate(e.target.value)}
                      className="modal-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Applicable Tax / GST (₹)</label>
                    <input
                      type="number"
                      placeholder="₹ 0"
                      value={modalTax}
                      onChange={e => setModalTax(e.target.value)}
                      className="modal-input"
                    />
                  </div>
                </div>

                {/* LINE ITEMS SELECTOR */}
                <div className="draft-items-box">
                  <span className="items-box-title">Add Garments & Variants to Inward</span>
                  <div className="item-selector-grid">
                    <select
                      value={selectedProductId}
                      onChange={e => {
                        setSelectedProductId(e.target.value);
                        setSelectedVariantId('');
                      }}
                      className="modal-input"
                    >
                      <option value="">Select Product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>

                    <select
                      value={selectedVariantId}
                      onChange={e => setSelectedVariantId(e.target.value)}
                      className="modal-input"
                      disabled={!selectedProductId}
                    >
                      <option value="">Select Size / Variant...</option>
                      {selectedProduct?.variants?.map(v => (
                        <option key={v.id} value={v.id}>
                          Size: {v.size} ({v.sku}) - Physical: {v.stock}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={itemQuantity}
                      onChange={e => setItemQuantity(e.target.value)}
                      className="modal-input-sm"
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Cost Price (₹)"
                      value={itemCostPrice}
                      onChange={e => setItemCostPrice(e.target.value)}
                      className="modal-input-sm"
                    />

                    <button
                      type="button"
                      className="btn-add-item"
                      onClick={handleAddItemToDraft}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>

                  {/* DRAFT ITEMS TABLE */}
                  {modalItems.length > 0 && (
                    <table className="draft-items-table">
                      <thead>
                        <tr>
                          <th>ITEM</th>
                          <th>SIZE</th>
                          <th>QTY</th>
                          <th>COST (₹)</th>
                          <th>LINE TOTAL (₹)</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalItems.map((it, idx) => (
                          <tr key={idx}>
                            <td>{it.product_name} ({it.sku})</td>
                            <td>{it.size}</td>
                            <td>{it.quantity}</td>
                            <td>₹{it.cost_price.toFixed(2)}</td>
                            <td>₹{it.total.toFixed(2)}</td>
                            <td>
                              <button
                                type="button"
                                className="btn-remove-draft"
                                onClick={() => handleRemoveDraftItem(idx)}
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {modalItems.length > 0 && (
                    <div className="draft-totals-row">
                      <span>Subtotal: ₹{draftSubtotal.toFixed(2)}</span>
                      <span>Total with Tax: <strong>₹{draftGrandTotal.toFixed(2)}</strong></span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Notes / Logistics Reference</label>
                  <textarea
                    placeholder="Courier tracking #, consignment info, or artisan terms..."
                    value={modalNotes}
                    onChange={e => setModalNotes(e.target.value)}
                    className="modal-textarea"
                    rows="2"
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setPurchaseModalOpen(false)}>
                    CANCEL
                  </button>
                  <button type="submit" className="btn-submit-adjust" disabled={modalSubmitting}>
                    {modalSubmitting ? 'SAVING DRAFT...' : 'SAVE PURCHASE ORDER (DRAFT)'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM STOCK INWARD */}
      {receiveTargetPurchase && (
        <div className="modal-overlay" data-lenis-prevent="true" onClick={() => setReceiveTargetPurchase(null)}>
          <div className="modal-card receive-confirm-modal" data-lenis-prevent="true" style={{ overscrollBehavior: 'contain' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <CheckCircle size={18} color="#2ecc71" />
                <span>CONFIRM STOCK INWARD — {receiveTargetPurchase.purchase_number}</span>
              </div>
              <button className="btn-close-modal" onClick={() => setReceiveTargetPurchase(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                You are about to inward stock into live boutique inventory for <strong>{receiveTargetPurchase.purchase_number}</strong> from <strong>{receiveTargetPurchase.supplier?.name || 'Supplier'}</strong>.
              </p>

              <div className="inward-preview-box">
                <span className="ip-title">Inventory Mutation Preview:</span>
                <ul className="inward-items-list">
                  {receiveTargetPurchase.items?.map(it => (
                    <li key={it.id}>
                      <span>{it.variant?.product?.name || 'Product'} (Size: {it.variant?.size})</span>
                      <strong className="text-green">+{it.quantity} Units (Cost: ₹{Number(it.cost_price)})</strong>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setReceiveTargetPurchase(null)}>
                  CANCEL
                </button>
                <button
                  type="button"
                  className="btn-gold-action"
                  onClick={handleConfirmReceive}
                  disabled={receiving}
                >
                  {receiving ? 'INWARDING STOCK...' : 'CONFIRM & MUTATE INVENTORY'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW PURCHASE ORDER DETAILS */}
      {viewPurchase && (
        <div className="modal-overlay" data-lenis-prevent="true" onClick={() => setViewPurchase(null)}>
          <div className="modal-card po-detail-modal" data-lenis-prevent="true" style={{ overscrollBehavior: 'contain' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <FileText size={18} color="#c6a46a" />
                <span>PURCHASE ORDER: {viewPurchase.purchase_number}</span>
              </div>
              <button className="btn-close-modal" onClick={() => setViewPurchase(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="po-details-grid">
                <div><span>Supplier:</span> <strong>{viewPurchase.supplier?.name || 'Unassigned'}</strong></div>
                <div><span>Supplier Invoice #:</span> <strong>{viewPurchase.invoice_number || 'N/A'}</strong></div>
                <div><span>Purchase Date:</span> <strong>{new Date(viewPurchase.purchase_date).toLocaleDateString()}</strong></div>
                <div><span>Status:</span> <strong className={`status-badge status-${viewPurchase.status.toLowerCase()}`}>{viewPurchase.status}</strong></div>
                <div><span>Subtotal:</span> <strong>₹{Number(viewPurchase.subtotal).toFixed(2)}</strong></div>
                <div><span>Total with Tax:</span> <strong>₹{Number(viewPurchase.total).toFixed(2)}</strong></div>
              </div>

              <span className="items-title">Line Items</span>
              <table className="po-view-items-table">
                <thead>
                  <tr>
                    <th>ITEM</th>
                    <th>SIZE</th>
                    <th>QTY</th>
                    <th>COST (₹)</th>
                    <th>LINE TOTAL (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {viewPurchase.items?.map(it => (
                    <tr key={it.id}>
                      <td>{it.variant?.product?.name || 'Product'} ({it.variant?.sku})</td>
                      <td>{it.variant?.size || 'N/A'}</td>
                      <td>{it.quantity}</td>
                      <td>₹{Number(it.cost_price).toFixed(2)}</td>
                      <td>₹{Number(it.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {viewPurchase.notes && (
                <div className="po-notes-box">
                  <span>Notes:</span> {viewPurchase.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
