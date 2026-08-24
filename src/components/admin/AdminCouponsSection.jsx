import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, X, RefreshCw, Tag } from 'lucide-react';
import ConfirmModal from '../ConfirmModal';

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

export default function AdminCouponsSection({ coupons = [], token, API_BASE_URL, onRefresh }) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'PERCENTAGE',
    discount_value: '',
    min_order_value: '',
    usage_limit: '',
    expiry_date: '',
    is_active: true
  });

  const couponList = Array.isArray(coupons) ? coupons : [];

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      code: '',
      discount_type: 'PERCENTAGE',
      discount_value: '10',
      min_order_value: '2000',
      usage_limit: '100',
      expiry_date: '',
      is_active: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (cp) => {
    setIsEditing(true);
    setEditingId(cp.id);
    setFormData({
      code: cp.code || '',
      discount_type: cp.discount_type || 'PERCENTAGE',
      discount_value: String(cp.discount_value || cp.discount || 10),
      min_order_value: String(cp.min_order_value || cp.minOrder || 0),
      usage_limit: String(cp.usage_limit || 100),
      expiry_date: cp.expiry_date ? String(cp.expiry_date).slice(0, 10) : '',
      is_active: cp.is_active !== false
    });
    setShowModal(true);
  };

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.code.trim()) {
      setFormError('Coupon code is required.');
      return;
    }

    const activeToken = token || localStorage.getItem('token');
    const url = isEditing
      ? `${API_BASE_URL}/api/coupons/${editingId}`
      : `${API_BASE_URL}/api/coupons`;

    const method = isEditing ? 'PUT' : 'POST';
    setSubmitting(true);

    try {
      const val = parseFloat(formData.discount_value || 0);
      const isPercent = formData.discount_type === 'PERCENTAGE';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken && { Authorization: `Bearer ${activeToken}` })
        },
        body: JSON.stringify({
          code: formData.code.trim().toUpperCase(),
          discount_type: formData.discount_type,
          discount_value: val,
          discount_percent: isPercent ? val : null,
          discount_flat: !isPercent ? val : null,
          min_order_value: parseFloat(formData.min_order_value || 0),
          usage_limit: parseInt(formData.usage_limit || 100, 10),
          expiry_date: formData.expiry_date || null,
          is_active: formData.is_active
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success !== false) {
        setShowModal(false);
        if (onRefresh) onRefresh();
      } else {
        setFormError(data.message || data.error || 'Failed to save coupon code.');
      }
    } catch (err) {
      setFormError('Network error while saving coupon.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, code) => {
    setConfirmModalConfig({
      title: 'Delete Coupon Code',
      message: `Are you sure you want to delete coupon "${code}"?`,
      subMessage: 'Customers will no longer be able to apply this discount at checkout.',
      confirmText: 'Yes, Delete Coupon',
      cancelText: 'Cancel',
      danger: true,
      onConfirm: async () => {
        const activeToken = token || localStorage.getItem('token');
        try {
          const res = await fetch(`${API_BASE_URL}/api/coupons/${id}`, {
            method: 'DELETE',
            headers: { ...(activeToken && { Authorization: `Bearer ${activeToken}` }) }
          });
          if (res.ok && onRefresh) onRefresh();
        } catch (e) {
          console.error('Delete coupon error:', e);
        }
      }
    });
  };

  const filteredCoupons = couponList.filter(c => (c.code || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-actions">
        <div>
          <h2>Coupons</h2>
          <p>Create and manage customer promotional discount codes.</p>
        </div>

        <div className="action-buttons">
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> + Create Coupon
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
              placeholder="Search coupon codes..."
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
                <th>Code</th>
                <th>Discount</th>
                <th>Minimum Order</th>
                <th>Usage</th>
                <th>Expiry</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.map((c) => {
                const discLabel = c.discount_percent
                  ? `${c.discount_percent}% OFF`
                  : c.discount_flat
                  ? formatINR(c.discount_flat)
                  : (c.discount_type === 'FIXED' || c.discount_type === 'FLAT'
                    ? formatINR(c.discount_value || c.discount)
                    : `${c.discount_value || c.discount || 10}% OFF`);
                const isActive = c.is_active !== false;

                return (
                  <tr key={c.id}>
                    <td>
                      <strong style={{ fontFamily: 'monospace', fontSize: '14px', color: 'var(--miraya-red)' }}>{c.code}</strong>
                    </td>
                    <td><strong style={{ fontSize: '13px' }}>{discLabel}</strong></td>
                    <td>{formatINR(c.min_order_value || c.minOrder || 0)}</td>
                    <td>{c.used_count || 0} / {c.usage_limit || 100}</td>
                    <td style={{ color: 'var(--miraya-muted)' }}>{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString('en-IN') : 'No Expiry'}</td>
                    <td>
                      <span className={`status-badge ${isActive ? 'status-success' : 'status-neutral'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button className="btn btn-secondary" style={{ minHeight: '30px', padding: '0 8px' }} onClick={() => handleOpenEdit(c)}>
                          <Edit size={14} />
                        </button>
                        <button className="btn btn-outline" style={{ minHeight: '30px', padding: '0 8px' }} onClick={() => handleDelete(c.id, c.code)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCoupons.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--miraya-muted)' }}>
                    No promotional coupons found. Click <strong>+ Create Coupon</strong> to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Coupon' : 'Create Coupon'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {formError && (
                  <div style={{ background: 'var(--miraya-red-soft)', color: 'var(--miraya-red)', border: '1px solid var(--miraya-red)', padding: '8px 12px', borderRadius: '6px', marginBottom: '14px', fontSize: '13px' }}>
                    {formError}
                  </div>
                )}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Coupon Code *</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. MIRAYA10"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Discount Type</label>
                    <select
                      className="admin-select"
                      style={{ width: '100%' }}
                      value={formData.discount_type}
                      onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Discount Value *</label>
                    <input
                      type="number"
                      className="admin-input"
                      placeholder="e.g. 10 or 500"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Minimum Order (₹)</label>
                    <input
                      type="number"
                      className="admin-input"
                      placeholder="e.g. 2000"
                      value={formData.min_order_value}
                      onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Usage Limit</label>
                    <input
                      type="number"
                      className="admin-input"
                      placeholder="e.g. 100"
                      value={formData.usage_limit}
                      onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Expiry Date</label>
                  <input
                    type="date"
                    className="admin-input"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Coupon</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* LUXURY CONFIRMATION MODAL */}
      <ConfirmModal
        config={confirmModalConfig}
        onClose={() => setConfirmModalConfig(null)}
      />
    </div>
  );
}
