import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, X, RefreshCw } from 'lucide-react';
import ConfirmModal from '../ConfirmModal';

export default function AdminCategoriesSection({ categories = [], token, API_BASE_URL, onRefresh }) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    is_active: true
  });

  const categoryList = Array.isArray(categories) ? categories : [];

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ name: '', slug: '', description: '', is_active: true });
    setShowModal(true);
  };

  const handleOpenEdit = (c) => {
    setIsEditing(true);
    setEditingId(c.id);
    setFormData({
      name: c.name || '',
      slug: c.slug || '',
      description: c.description || '',
      is_active: c.is_active !== false
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const url = isEditing
      ? `${API_BASE_URL}/api/categories/${editingId}`
      : `${API_BASE_URL}/api/categories`;

    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug ? formData.slug.trim() : formData.name.toLowerCase().replace(/\s+/g, '-'),
          description: formData.description,
          is_active: formData.is_active
        })
      });

      if (res.ok) {
        setShowModal(false);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Error saving category:', err);
    }
  };

  const handleDelete = (id, name) => {
    setConfirmModalConfig({
      title: 'Delete Category',
      message: `Are you sure you want to delete "${name}"?`,
      subMessage: 'Products under this category will need to be reassigned.',
      confirmText: 'Yes, Delete Category',
      cancelText: 'Cancel',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok && onRefresh) onRefresh();
        } catch (e) {
          console.error('Delete category error:', e);
        }
      }
    });
  };

  const filteredCategories = categoryList.filter(c => (c.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-actions">
        <div>
          <h2>Categories</h2>
          <p>Organize garments into storefront collections.</p>
        </div>

        <div className="action-buttons">
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> + Add Category
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
              placeholder="Search categories..."
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
                <th>Category</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td style={{ color: 'var(--miraya-muted)', fontFamily: 'monospace' }}>{c.slug || c.name.toLowerCase().replace(/\s+/g, '-')}</td>
                  <td style={{ color: 'var(--miraya-muted)' }}>{c.description || 'Collection category'}</td>
                  <td>
                    <span className={`status-badge ${c.is_active !== false ? 'status-success' : 'status-neutral'}`}>
                      {c.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button className="btn btn-secondary" style={{ minHeight: '30px', padding: '0 8px' }} onClick={() => handleOpenEdit(c)}>
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-outline" style={{ minHeight: '30px', padding: '0 8px' }} onClick={() => handleDelete(c.id, c.name)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--miraya-muted)' }}>
                    No categories found. Click <strong>+ Add Category</strong> to create one.
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
              <h3>{isEditing ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Category Name *</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. Lehenga Collection"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>URL Slug</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="lehenga-collection"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Description</label>
                  <textarea
                    className="admin-input"
                    rows="3"
                    style={{ height: 'auto', padding: '8px 12px' }}
                    placeholder="Collection tagline..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Category</button>
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
