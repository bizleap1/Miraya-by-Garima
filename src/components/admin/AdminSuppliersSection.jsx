import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, RefreshCw, AlertTriangle, Phone, Mail,
  MapPin, FileText, Eye, Edit2, Trash2, X, CheckCircle
} from 'lucide-react';
import './AdminSuppliersSection.css';

export default function AdminSuppliersSection({ token, API_BASE_URL }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Modals
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    gstin: '',
    address: '',
    notes: '',
    is_active: true,
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Detail Modal
  const [selectedSupplierDetail, setSelectedSupplierDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`${API_BASE_URL}/api/suppliers${params}`, { headers });
      const data = await res.json();

      if (data.success) {
        setSuppliers(data.suppliers || []);
      } else {
        setError(data.message || 'Error fetching suppliers.');
      }
    } catch (err) {
      setError('Network error while loading suppliers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      gstin: '',
      address: '',
      notes: '',
      is_active: true,
    });
    setModalError(null);
    setSupplierModalOpen(true);
  };

  const handleOpenEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      gstin: supplier.gstin || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
      is_active: supplier.is_active !== undefined ? supplier.is_active : true,
    });
    setModalError(null);
    setSupplierModalOpen(true);
  };

  const handleSubmitSupplier = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError('Supplier name is required.');
      return;
    }

    setModalSubmitting(true);
    setModalError(null);

    try {
      const url = editingSupplier
        ? `${API_BASE_URL}/api/suppliers/${editingSupplier.id}`
        : `${API_BASE_URL}/api/suppliers`;
      const method = editingSupplier ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSupplierModalOpen(false);
        fetchSuppliers();
      } else {
        setModalError(data.message || 'Error saving supplier.');
      }
    } catch (err) {
      setModalError('Network error while saving supplier.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleViewSupplierDetail = async (id) => {
    setDetailLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/api/suppliers/${id}`, { headers });
      const data = await res.json();
      if (data.success) {
        setSelectedSupplierDetail(data.supplier);
      } else {
        alert(data.message || 'Error fetching supplier details.');
      }
    } catch (err) {
      alert('Network error while fetching supplier details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate or remove this supplier?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/suppliers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchSuppliers();
      } else {
        alert(data.message || 'Error removing supplier.');
      }
    } catch (err) {
      alert('Network error while removing supplier.');
    }
  };

  return (
    <div className="admin-suppliers-section">
      {/* HEADER */}
      <div className="suppliers-header-block">
        <div>
          <h2 className="section-title">
            <Users className="title-icon" size={22} /> SUPPLIERS & ARTISANS DIRECTORY
          </h2>
          <p className="section-desc">
            Manage fabric mills, master weavers, karigars, and wholesale vendor accounts.
          </p>
        </div>

        <div className="header-actions">
          <button className="btn-gold-action" onClick={handleOpenCreateModal}>
            <Plus size={16} /> ADD NEW SUPPLIER
          </button>
          <button className="btn-icon-refresh" onClick={fetchSuppliers} title="Refresh">
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* SEARCH TOOLBAR */}
      <div className="suppliers-toolbar">
        <form onSubmit={(e) => { e.preventDefault(); fetchSuppliers(); }} className="search-form">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search Supplier Name, Contact Person, Phone, GSTIN..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-search">SEARCH</button>
        </form>
      </div>

      {error && <div className="inventory-error-banner"><AlertTriangle size={16} /> {error}</div>}

      {/* SUPPLIERS TABLE */}
      <div className="suppliers-table-wrapper">
        <table className="suppliers-table">
          <thead>
            <tr>
              <th>SUPPLIER NAME</th>
              <th>CONTACT PERSON</th>
              <th>PHONE / EMAIL</th>
              <th>GSTIN</th>
              <th>TOTAL PURCHASES</th>
              <th>LAST PURCHASE</th>
              <th>STATUS</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>Loading suppliers directory...</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>No suppliers found.</td></tr>
            ) : (
              suppliers.map(s => (
                <tr key={s.id}>
                  <td><strong className="supplier-name">{s.name}</strong></td>
                  <td>{s.contact_person || <span className="text-muted">N/A</span>}</td>
                  <td>
                    <div className="contact-col">
                      {s.phone && <span><Phone size={12} /> {s.phone}</span>}
                      {s.email && <span><Mail size={12} /> {s.email}</span>}
                    </div>
                  </td>
                  <td><span className="gstin-badge">{s.gstin || 'Unregistered'}</span></td>
                  <td>
                    <div className="purchases-meta">
                      <strong>₹{Number(s.total_purchases_amount || 0).toLocaleString('en-IN')}</strong>
                      <span>{s.received_purchases_count || 0} Inwarded POs</span>
                    </div>
                  </td>
                  <td>
                    {s.last_purchase_date ? (
                      new Date(s.last_purchase_date).toLocaleDateString('en-IN')
                    ) : (
                      <span className="text-muted">No purchases</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-pill ${s.is_active ? 'status-in-stock' : 'status-out-of-stock'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-btns-group">
                      <button
                        className="btn-table-action"
                        onClick={() => handleViewSupplierDetail(s.id)}
                        title="View Purchase History"
                      >
                        <Eye size={14} /> History
                      </button>
                      <button
                        className="btn-table-action"
                        onClick={() => handleOpenEditModal(s)}
                        title="Edit Supplier"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn-table-action cancel"
                        onClick={() => handleDeleteSupplier(s.id)}
                        title="Deactivate / Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: CREATE / EDIT SUPPLIER */}
      {supplierModalOpen && (
        <div className="modal-overlay" data-lenis-prevent="true" onClick={() => setSupplierModalOpen(false)}>
          <div className="modal-card supplier-modal" data-lenis-prevent="true" style={{ overscrollBehavior: 'contain' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Users size={18} color="#c6a46a" />
                <span>{editingSupplier ? 'EDIT SUPPLIER ACCOUNT' : 'CREATE NEW SUPPLIER'}</span>
              </div>
              <button className="btn-close-modal" onClick={() => setSupplierModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {modalError && (
                <div className="modal-error-alert"><AlertTriangle size={16} /> {modalError}</div>
              )}

              <form onSubmit={handleSubmitSupplier} className="modal-form">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Supplier / Company Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Royal Banaras Weaves Ltd"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="modal-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Contact Person Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.contact_person}
                      onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                      className="modal-input"
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="modal-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. orders@banarasweaves.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="modal-input"
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>GSTIN (Tax Identifier)</label>
                    <input
                      type="text"
                      placeholder="e.g. 07AAAAA0000A1Z5"
                      value={formData.gstin}
                      onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                      className="modal-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={formData.is_active ? 'active' : 'inactive'}
                      onChange={e => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                      className="modal-input"
                    >
                      <option value="active">Active Vendor</option>
                      <option value="inactive">Inactive / Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Business Address / Workshop</label>
                  <textarea
                    placeholder="Weaving cluster, plot number, city, pin code..."
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="modal-textarea"
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <label>Internal Notes / Terms</label>
                  <textarea
                    placeholder="Payment credit period (e.g. Net 30), fabric specializations..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="modal-textarea"
                    rows="2"
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setSupplierModalOpen(false)}>
                    CANCEL
                  </button>
                  <button type="submit" className="btn-submit-adjust" disabled={modalSubmitting}>
                    {modalSubmitting ? 'SAVING...' : (editingSupplier ? 'UPDATE SUPPLIER' : 'CREATE SUPPLIER')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SUPPLIER DETAIL & PURCHASE HISTORY */}
      {selectedSupplierDetail && (
        <div className="modal-overlay" data-lenis-prevent="true" onClick={() => setSelectedSupplierDetail(null)}>
          <div className="modal-card supplier-history-modal" data-lenis-prevent="true" style={{ overscrollBehavior: 'contain' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <FileText size={18} color="#c6a46a" />
                <span>SUPPLIER 360: {selectedSupplierDetail.name}</span>
              </div>
              <button className="btn-close-modal" onClick={() => setSelectedSupplierDetail(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="supplier-profile-summary">
                <div><span>Contact:</span> <strong>{selectedSupplierDetail.contact_person || 'N/A'}</strong></div>
                <div><span>Phone:</span> <strong>{selectedSupplierDetail.phone || 'N/A'}</strong></div>
                <div><span>Email:</span> <strong>{selectedSupplierDetail.email || 'N/A'}</strong></div>
                <div><span>GSTIN:</span> <strong>{selectedSupplierDetail.gstin || 'N/A'}</strong></div>
                <div><span>Total Volume:</span> <strong className="text-green">₹{Number(selectedSupplierDetail.totalPurchasesAmount || 0).toLocaleString('en-IN')}</strong></div>
                <div><span>Total Orders:</span> <strong>{selectedSupplierDetail.totalPurchasesCount || 0} POs</strong></div>
              </div>

              <span className="items-title" style={{ marginTop: '1rem', display: 'block' }}>Purchase History</span>
              <div className="history-table-wrapper">
                <table className="po-view-items-table">
                  <thead>
                    <tr>
                      <th>PO NUMBER</th>
                      <th>DATE</th>
                      <th>INVOICE #</th>
                      <th>TOTAL</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedSupplierDetail.purchases || []).length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem' }}>No purchase history recorded yet.</td></tr>
                    ) : (
                      selectedSupplierDetail.purchases.map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.purchase_number}</strong></td>
                          <td>{new Date(p.purchase_date).toLocaleDateString('en-IN')}</td>
                          <td>{p.invoice_number || 'N/A'}</td>
                          <td><strong>₹{Number(p.total).toLocaleString('en-IN')}</strong></td>
                          <td><span className={`status-badge status-${p.status.toLowerCase()}`}>{p.status}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
