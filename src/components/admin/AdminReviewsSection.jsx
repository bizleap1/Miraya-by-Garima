'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Camera,
  ShieldCheck,
  ThumbsUp,
  RefreshCw,
  Sparkles,
  Upload,
  X,
  AlertCircle,
  Maximize2
} from 'lucide-react';
import ConfirmModal from '../ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { getProductImage } from '../../utils/imageHelper';
import './AdminReviewsSection.css';

const OCCASIONS = [
  'Bridal Wear',
  'Wedding Reception',
  'Sangeet / Mehendi',
  'Cocktail & Party',
  'Festive Celebration',
  'Family Occasion',
  'Everyday Luxury'
];

export default function AdminReviewsSection({
  token,
  API_BASE_URL,
  products = []
}) {
  const { toast } = useToast();
  const API = API_BASE_URL || 'http://localhost:5000';

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    approvedReviews: 0,
    pendingApprovals: 0,
    photoReviews: 0,
    averageRating: 5.0
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'approved' | 'pending'

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [confirmDeleteConfig, setConfirmDeleteConfig] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Add / Edit Form State
  const [formData, setFormData] = useState({
    product_id: '',
    customer_name: '',
    customer_city: '',
    rating: 5,
    occasion: 'Bridal Wear',
    title: '',
    comment: '',
    is_verified: true,
    is_approved: true,
    likes_count: 0
  });
  const [formFiles, setFormFiles] = useState([]);
  const [formPreviews, setFormPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch all reviews
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = `${API}/api/reviews?limit=100`;
      if (selectedProduct !== 'all') url += `&product_id=${selectedProduct}`;
      if (selectedRating !== 'all') url += `&rating=${selectedRating}`;
      if (selectedStatus === 'approved') url += `&is_approved=true`;
      if (selectedStatus === 'pending') url += `&is_approved=false`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;

      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        toast.error?.(data.message || 'Failed to fetch reviews.');
      }
    } catch (err) {
      console.error('Error fetching admin reviews:', err);
      toast.error?.('Failed to load reviews from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [selectedProduct, selectedRating, selectedStatus]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormData({
      product_id: products.length > 0 ? String(products[0].id) : '',
      customer_name: '',
      customer_city: '',
      rating: 5,
      occasion: 'Bridal Wear',
      title: '',
      comment: '',
      is_verified: true,
      is_approved: true,
      likes_count: 0
    });
    setFormFiles([]);
    setFormPreviews([]);
    setExistingImages([]);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rev) => {
    setEditingReview(rev);
    setFormData({
      product_id: String(rev.product_id),
      customer_name: rev.customer_name || '',
      customer_city: rev.customer_city || '',
      rating: rev.rating || 5,
      occasion: rev.occasion || 'Bridal Wear',
      title: rev.title || '',
      comment: rev.comment || '',
      is_verified: rev.is_verified !== false,
      is_approved: rev.is_approved !== false,
      likes_count: rev.likes_count || 0
    });
    setExistingImages(Array.isArray(rev.images) ? rev.images : []);
    setFormFiles([]);
    setFormPreviews([]);
    setIsEditModalOpen(true);
  };

  // Photo Selection handler
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const totalAllowed = 5 - existingImages.length;
    if (files.length + formFiles.length > totalAllowed) {
      toast.error?.(`You can attach up to ${totalAllowed} more photos.`);
      return;
    }

    const newFiles = [...formFiles, ...files];
    setFormFiles(newFiles);

    const previews = newFiles.map(file => URL.createObjectURL(file));
    setFormPreviews(previews);
  };

  const removeNewPhoto = (index) => {
    const newFiles = formFiles.filter((_, i) => i !== index);
    const newPreviews = formPreviews.filter((_, i) => i !== index);
    setFormFiles(newFiles);
    setFormPreviews(newPreviews);
  };

  const removeExistingPhoto = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  // Submit Add Review (Admin)
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product_id || !formData.comment.trim()) {
      toast.error?.('Product and review comment are required.');
      return;
    }

    try {
      setSubmitting(true);
      const submitData = new FormData();
      submitData.append('product_id', formData.product_id);
      submitData.append('customer_name', formData.customer_name || 'Verified Bride');
      submitData.append('customer_city', formData.customer_city || '');
      submitData.append('rating', formData.rating);
      submitData.append('occasion', formData.occasion);
      submitData.append('title', formData.title || '');
      submitData.append('comment', formData.comment);
      submitData.append('is_verified', formData.is_verified);
      submitData.append('is_approved', formData.is_approved);
      submitData.append('likes_count', formData.likes_count || 0);

      formFiles.forEach((f) => {
        submitData.append('images', f);
      });

      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API}/api/reviews/admin-create`, {
        method: 'POST',
        headers,
        body: submitData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success?.('Luxury Review created successfully!');
        setIsAddModalOpen(false);
        fetchReviews();
      } else {
        toast.error?.(data.message || 'Error creating review.');
      }
    } catch (err) {
      console.error('Admin create review error:', err);
      toast.error?.('Server communication error.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Review (Admin)
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingReview) return;

    try {
      setSubmitting(true);
      const submitData = new FormData();
      submitData.append('product_id', formData.product_id);
      submitData.append('customer_name', formData.customer_name || 'Verified Bride');
      submitData.append('customer_city', formData.customer_city || '');
      submitData.append('rating', formData.rating);
      submitData.append('occasion', formData.occasion);
      submitData.append('title', formData.title || '');
      submitData.append('comment', formData.comment);
      submitData.append('is_verified', formData.is_verified);
      submitData.append('is_approved', formData.is_approved);
      submitData.append('likes_count', formData.likes_count || 0);
      submitData.append('existing_images', JSON.stringify(existingImages));

      formFiles.forEach((f) => {
        submitData.append('images', f);
      });

      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API}/api/reviews/${editingReview.id}`, {
        method: 'PUT',
        headers,
        body: submitData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success?.('Review updated successfully.');
        setIsEditModalOpen(false);
        setEditingReview(null);
        fetchReviews();
      } else {
        toast.error?.(data.message || 'Error updating review.');
      }
    } catch (err) {
      console.error('Update review error:', err);
      toast.error?.('Server communication error.');
    } finally {
      setSubmitting(false);
    }
  };

  // 1-Click Toggle Approval Status
  const handleToggleApproval = async (review) => {
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API}/api/reviews/${review.id}/toggle-approve`, {
        method: 'PATCH',
        headers
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success?.(data.message);
        setReviews(prev =>
          prev.map(r => (r.id === review.id ? { ...r, is_approved: !r.is_approved } : r))
        );
      } else {
        toast.error?.(data.message || 'Failed to update approval status.');
      }
    } catch (err) {
      console.error('Toggle approval error:', err);
    }
  };

  // Delete Review confirmation
  const handleDeleteClick = (review) => {
    setConfirmDeleteConfig({
      title: 'Delete Customer Review',
      message: `Are you sure you want to permanently delete the review by "${review.customer_name || 'Customer'}"? This action cannot be undone.`,
      confirmText: 'Delete Review',
      onConfirm: async () => {
        try {
          const headers = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const res = await fetch(`${API}/api/reviews/${review.id}`, {
            method: 'DELETE',
            headers
          });
          const data = await res.json();
          if (res.ok && data.success) {
            toast.success?.('Review deleted successfully.');
            setReviews(prev => prev.filter(r => r.id !== review.id));
            setConfirmDeleteConfig(null);
          } else {
            toast.error?.(data.message || 'Failed to delete review.');
          }
        } catch (err) {
          console.error('Delete review error:', err);
          toast.error?.('Server error deleting review.');
        }
      }
    });
  };

  // Client-side search filtering
  const filteredReviews = useMemo(() => {
    if (!search.trim()) return reviews;
    const q = search.toLowerCase();
    return reviews.filter(r =>
      (r.customer_name || '').toLowerCase().includes(q) ||
      (r.customer_city || '').toLowerCase().includes(q) ||
      (r.title || '').toLowerCase().includes(q) ||
      (r.comment || '').toLowerCase().includes(q) ||
      (r.product?.name || '').toLowerCase().includes(q)
    );
  }, [reviews, search]);

  return (
    <div className="admin-reviews-section">
      {/* ─── KPI Stats Row ─── */}
      <div className="reviews-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap gold-icon">
            <Sparkles size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">TOTAL REVIEWS</span>
            <span className="kpi-value">{stats.totalReviews || reviews.length}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap star-icon">
            <Star size={22} fill="#d4af37" color="#d4af37" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">AVERAGE RATING</span>
            <span className="kpi-value">
              {stats.averageRating ? stats.averageRating.toFixed(1) : '5.0'} ★
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap green-icon">
            <CheckCircle size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">APPROVED & LIVE</span>
            <span className="kpi-value">{stats.approvedReviews || 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap camera-icon">
            <Camera size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">WITH REAL PHOTOS</span>
            <span className="kpi-value">{stats.photoReviews || 0}</span>
          </div>
        </div>
      </div>

      {/* ─── Action Toolbar & Filters ─── */}
      <div className="reviews-toolbar-card">
        <div className="search-input-box">
          <Search size={16} color="#8a6d3b" />
          <input
            type="text"
            placeholder="Search by customer name, city, comment, or dress..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filters-row">
          {/* Product Filter */}
          <select
            className="admin-filter-select"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="all">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Rating Filter */}
          <select
            className="admin-filter-select"
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
          >
            <option value="all">All Star Ratings</option>
            <option value="5">5 Stars Only</option>
            <option value="4">4 Stars Only</option>
            <option value="3">3 Stars Only</option>
            <option value="2">2 Stars Only</option>
            <option value="1">1 Star Only</option>
          </select>

          {/* Status Filter */}
          <select
            className="admin-filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved & Live</option>
            <option value="pending">Pending / Hidden</option>
          </select>

          <button className="refresh-btn" onClick={fetchReviews} title="Refresh reviews">
            <RefreshCw size={16} />
          </button>

          <button className="add-review-admin-btn" onClick={handleOpenAddModal}>
            <Plus size={16} />
            <span>ADD NEW REVIEW</span>
          </button>
        </div>
      </div>

      {/* ─── Reviews Data Table ─── */}
      <div className="admin-reviews-table-card">
        {loading ? (
          <div className="admin-loading-box">
            <div className="luxury-spinner" />
            <p>Loading customer reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="admin-no-data-box">
            <Sparkles size={36} color="#C6A46A" />
            <h3>No Customer Reviews Found</h3>
            <p>Try clearing your filters or create a new verified review for your boutique.</p>
            <button className="add-review-admin-btn" onClick={handleOpenAddModal}>
              <Plus size={16} />
              <span>ADD FIRST REVIEW</span>
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-luxury-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Customer & Occasion</th>
                  <th>Rating</th>
                  <th>Review Experience</th>
                  <th>Photos</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((rev) => (
                  <tr key={rev.id}>
                    {/* Product */}
                    <td>
                      <div className="table-product-cell">
                        <img
                          src={getProductImage(rev.product?.image_url)}
                          alt={rev.product?.name || 'Product'}
                          className="table-product-thumb"
                        />
                        <div>
                          <span className="product-cell-name">
                            {rev.product?.name || `Product #${rev.product_id}`}
                          </span>
                          <span className="product-cell-cat">
                            {rev.product?.category?.name || 'Boutique Collection'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td>
                      <div className="customer-cell">
                        <div className="customer-name-line">
                          <strong>{rev.customer_name || 'Verified Customer'}</strong>
                          {rev.is_verified && (
                            <span className="table-verified-badge" title="Verified Purchase">
                              <ShieldCheck size={12} />
                            </span>
                          )}
                        </div>
                        {rev.customer_city && (
                          <span className="customer-city-line">{rev.customer_city}</span>
                        )}
                        {rev.occasion && (
                          <span className="table-occasion-tag">✨ {rev.occasion}</span>
                        )}
                      </div>
                    </td>

                    {/* Rating */}
                    <td>
                      <div className="table-rating-stars">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className={s <= rev.rating ? 'star-filled' : 'star-empty'}
                          />
                        ))}
                      </div>
                      <span className="table-date-str">
                        {new Date(rev.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </td>

                    {/* Comment */}
                    <td className="comment-cell">
                      {rev.title && <div className="comment-title-str">{rev.title}</div>}
                      <p className="comment-body-str">{rev.comment}</p>
                      {rev.likes_count > 0 && (
                        <span className="table-likes-tag">
                          <ThumbsUp size={11} /> {rev.likes_count} helpful
                        </span>
                      )}
                    </td>

                    {/* Attached Photos */}
                    <td>
                      {Array.isArray(rev.images) && rev.images.length > 0 ? (
                        <div className="table-photos-gallery">
                          {rev.images.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt="Customer attachment"
                              className="table-photo-thumb"
                              onClick={() => setLightboxImg(img)}
                              title="Click to zoom"
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="no-photos-text">—</span>
                      )}
                    </td>

                    {/* Approval Status Toggle */}
                    <td>
                      <button
                        className={`status-toggle-pill ${rev.is_approved ? 'approved' : 'pending'}`}
                        onClick={() => handleToggleApproval(rev)}
                        title="Click to toggle live visibility"
                      >
                        {rev.is_approved ? (
                          <>
                            <CheckCircle size={13} />
                            <span>LIVE</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={13} />
                            <span>HIDDEN</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions-row">
                        <button
                          className="action-icon-btn edit-btn"
                          onClick={() => handleOpenEditModal(rev)}
                          title="Edit Review"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="action-icon-btn delete-btn"
                          onClick={() => handleDeleteClick(rev)}
                          title="Delete Review"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── ADD REVIEW MODAL ─── */}
      {isAddModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setIsAddModalOpen(false)}>
              <X size={20} />
            </button>

            <div className="admin-modal-header">
              <span className="admin-badge-gold">CREATE REVIEW</span>
              <h3>Add Verified Customer Review</h3>
              <p>Create a showcase review with photos and bridal tags</p>
            </div>

            <form onSubmit={handleAddSubmit} className="admin-modal-form">
              {/* Product Selector */}
              <div className="admin-form-group">
                <label className="admin-form-label">Select Garment / Product *</label>
                <select
                  className="admin-luxury-input"
                  value={formData.product_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
                  required
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.price})
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Name & City */}
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Customer Name *</label>
                  <input
                    type="text"
                    className="admin-luxury-input"
                    placeholder="e.g. Radhika Singhania"
                    value={formData.customer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">City / Location</label>
                  <input
                    type="text"
                    className="admin-luxury-input"
                    placeholder="e.g. Nagpur / Mumbai"
                    value={formData.customer_city}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_city: e.target.value }))}
                  />
                </div>
              </div>

              {/* Star Rating & Occasion */}
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Star Rating *</label>
                  <select
                    className="admin-luxury-input"
                    value={formData.rating}
                    onChange={(e) => setFormData(prev => ({ ...prev, rating: parseInt(e.target.value, 10) }))}
                  >
                    <option value={5}>5 Stars (Exceptional & Luxurious)</option>
                    <option value={4}>4 Stars (Very Beautiful)</option>
                    <option value={3}>3 Stars (Good Quality)</option>
                    <option value={2}>2 Stars (Average)</option>
                    <option value={1}>1 Star (Needs Improvement)</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Occasion / Event Tag</label>
                  <select
                    className="admin-luxury-input"
                    value={formData.occasion}
                    onChange={(e) => setFormData(prev => ({ ...prev, occasion: e.target.value }))}
                  >
                    {OCCASIONS.map((occ) => (
                      <option key={occ} value={occ}>{occ}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Headline */}
              <div className="admin-form-group">
                <label className="admin-form-label">Headline / Title</label>
                <input
                  type="text"
                  className="admin-luxury-input"
                  placeholder="e.g. Regal outfit for my reception evening!"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* Comment */}
              <div className="admin-form-group">
                <label className="admin-form-label">Review Experience *</label>
                <textarea
                  className="admin-luxury-textarea"
                  rows={4}
                  placeholder="Write detailed fitting, fabric, and drape feedback..."
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  required
                />
              </div>

              {/* Photo Upload */}
              <div className="admin-form-group">
                <label className="admin-form-label">
                  <Camera size={16} /> Attach Real Photos (Up to 5)
                </label>
                <div className="admin-photo-upload-strip">
                  {formPreviews.map((url, idx) => (
                    <div key={idx} className="admin-upload-thumb">
                      <img src={url} alt={`Upload ${idx + 1}`} />
                      <button
                        type="button"
                        className="admin-remove-thumb-btn"
                        onClick={() => removeNewPhoto(idx)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {formFiles.length < 5 && (
                    <label className="admin-upload-trigger">
                      <Upload size={18} color="#C6A46A" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden-file-input"
                        onChange={handlePhotoSelect}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Checkbox Options */}
              <div className="admin-checkbox-row">
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_verified}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_verified: e.target.checked }))}
                  />
                  <span>Verified Buyer Badge</span>
                </label>

                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_approved}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_approved: e.target.checked }))}
                  />
                  <span>Approved & Live Immediately</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating & Uploading...' : 'CREATE & PUBLISH'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT REVIEW MODAL ─── */}
      {isEditModalOpen && editingReview && (
        <div className="admin-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setIsEditModalOpen(false)}>
              <X size={20} />
            </button>

            <div className="admin-modal-header">
              <span className="admin-badge-gold">EDIT REVIEW</span>
              <h3>Edit Customer Review</h3>
              <p>Modify review content, rating, or photos</p>
            </div>

            <form onSubmit={handleEditSubmit} className="admin-modal-form">
              {/* Product Selector */}
              <div className="admin-form-group">
                <label className="admin-form-label">Garment / Product *</label>
                <select
                  className="admin-luxury-input"
                  value={formData.product_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.price})
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Name & City */}
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Customer Name *</label>
                  <input
                    type="text"
                    className="admin-luxury-input"
                    value={formData.customer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">City</label>
                  <input
                    type="text"
                    className="admin-luxury-input"
                    value={formData.customer_city}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_city: e.target.value }))}
                  />
                </div>
              </div>

              {/* Star Rating & Occasion */}
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Star Rating *</label>
                  <select
                    className="admin-luxury-input"
                    value={formData.rating}
                    onChange={(e) => setFormData(prev => ({ ...prev, rating: parseInt(e.target.value, 10) }))}
                  >
                    <option value={5}>5 Stars (Exceptional & Luxurious)</option>
                    <option value={4}>4 Stars (Very Beautiful)</option>
                    <option value={3}>3 Stars (Good Quality)</option>
                    <option value={2}>2 Stars (Average)</option>
                    <option value={1}>1 Star (Needs Improvement)</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Occasion / Event Tag</label>
                  <select
                    className="admin-luxury-input"
                    value={formData.occasion}
                    onChange={(e) => setFormData(prev => ({ ...prev, occasion: e.target.value }))}
                  >
                    {OCCASIONS.map((occ) => (
                      <option key={occ} value={occ}>{occ}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Headline */}
              <div className="admin-form-group">
                <label className="admin-form-label">Headline / Title</label>
                <input
                  type="text"
                  className="admin-luxury-input"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* Comment */}
              <div className="admin-form-group">
                <label className="admin-form-label">Review Experience *</label>
                <textarea
                  className="admin-luxury-textarea"
                  rows={4}
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  required
                />
              </div>

              {/* Photos (Existing + New) */}
              <div className="admin-form-group">
                <label className="admin-form-label">
                  <Camera size={16} /> Attached Photos
                </label>
                <div className="admin-photo-upload-strip">
                  {existingImages.map((url, idx) => (
                    <div key={`exist-${idx}`} className="admin-upload-thumb">
                      <img src={url} alt={`Existing ${idx + 1}`} />
                      <button
                        type="button"
                        className="admin-remove-thumb-btn"
                        onClick={() => removeExistingPhoto(idx)}
                        title="Remove photo"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {formPreviews.map((url, idx) => (
                    <div key={`new-${idx}`} className="admin-upload-thumb">
                      <img src={url} alt={`New upload ${idx + 1}`} />
                      <button
                        type="button"
                        className="admin-remove-thumb-btn"
                        onClick={() => removeNewPhoto(idx)}
                        title="Remove photo"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {existingImages.length + formFiles.length < 5 && (
                    <label className="admin-upload-trigger">
                      <Upload size={18} color="#C6A46A" />
                      <span>Add More</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden-file-input"
                        onChange={handlePhotoSelect}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Checkbox Options */}
              <div className="admin-checkbox-row">
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_verified}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_verified: e.target.checked }))}
                  />
                  <span>Verified Buyer Badge</span>
                </label>

                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_approved}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_approved: e.target.checked }))}
                  />
                  <span>Approved & Live Visibility</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CONFIRM DELETE MODAL ─── */}
      {confirmDeleteConfig && (
        <ConfirmModal
          isOpen={true}
          title={confirmDeleteConfig.title}
          message={confirmDeleteConfig.message}
          confirmText={confirmDeleteConfig.confirmText}
          onConfirm={confirmDeleteConfig.onConfirm}
          onClose={() => setConfirmDeleteConfig(null)}
        />
      )}

      {/* ─── LIGHTBOX MODAL ─── */}
      {lightboxImg && (
        <div className="review-lightbox-overlay" onClick={() => setLightboxImg(null)}>
          <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close-btn" onClick={() => setLightboxImg(null)}>
              <X size={24} />
            </button>
            <img src={lightboxImg} alt="Enlarged review photo" className="lightbox-full-img" />
          </div>
        </div>
      )}
    </div>
  );
}
