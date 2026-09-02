'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  Camera,
  X,
  Sparkles,
  Upload,
  MessageSquarePlus,
  Filter,
  ChevronRight,
  ShieldCheck,
  Maximize2,
  Trash2
} from 'lucide-react';
import API_URL from '../config';
import ConfirmModal from './ConfirmModal';
import { useToast } from '../context/ToastContext';
import './ProductReviewsSection.css';

const API = API_URL || 'http://localhost:5000';

const OCCASIONS = [
  'Bridal Wear',
  'Wedding Reception',
  'Sangeet / Mehendi',
  'Cocktail & Party',
  'Festive Celebration',
  'Family Occasion',
  'Everyday Luxury'
];

export default function ProductReviewsSection({ product }) {
  const { toast } = useToast();
  const productId = product?.id;

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 5.0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    percentageDistribution: { 5: 100, 4: 0, 3: 0, 2: 0, 1: 0 },
    photoGallery: []
  });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', '5', '4', '3', 'photos'
  
  // Write Review Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ratingHover, setRatingHover] = useState(0);
  
  // Form State
  const [formData, setFormData] = useState({
    rating: 5,
    customer_name: '',
    customer_city: '',
    occasion: 'Bridal Wear',
    title: '',
    comment: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  // Lightbox State
  const [lightboxImg, setLightboxImg] = useState(null);
  const [likedMap, setLikedMap] = useState({});
  const [deleteConfirmConfig, setDeleteConfirmConfig] = useState(null);

  const currentUser = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch (_) {
      return null;
    }
  }, []);

  const [myReviewIds, setMyReviewIds] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('miraya_my_reviews') || '[]');
    } catch (_) {
      return [];
    }
  });

  // Fetch reviews for current product
  const fetchReviews = async () => {
    if (!productId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/reviews/product/${productId}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching product reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  // Lock background page scrolling when review modal or lightbox is open
  useEffect(() => {
    if (isModalOpen || lightboxImg) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('modal-open');
    };
  }, [isModalOpen, lightboxImg]);

  // Handle Photo selection with instant local preview
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 5) {
      toast.error?.('You can upload up to 5 photos.');
      return;
    }

    const newFiles = [...selectedFiles, ...files].slice(0, 5);
    setSelectedFiles(newFiles);

    // Create object URLs for preview
    const previews = newFiles.map(file => URL.createObjectURL(file));
    setFilePreviews(previews);
  };

  const removeSelectedPhoto = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = filePreviews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setFilePreviews(newPreviews);
  };

  // Submit Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!formData.comment.trim()) {
      toast.error?.('Please write a comment about your experience.');
      return;
    }

    try {
      setSubmitting(true);
      const submitData = new FormData();
      submitData.append('product_id', productId);
      submitData.append('rating', formData.rating);
      submitData.append('customer_name', formData.customer_name || 'Verified Customer');
      submitData.append('customer_city', formData.customer_city || '');
      submitData.append('occasion', formData.occasion || 'Bridal Wear');
      submitData.append('title', formData.title || '');
      submitData.append('comment', formData.comment);

      // Append files
      selectedFiles.forEach((file) => {
        submitData.append('images', file);
      });

      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('user_token')) : null;
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API}/api/reviews`, {
        method: 'POST',
        headers,
        body: submitData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success?.('Thank you! Your verified review is now live.');
        if (data.review?.id) {
          try {
            const currentMy = JSON.parse(localStorage.getItem('miraya_my_reviews') || '[]');
            if (!currentMy.includes(data.review.id)) {
              currentMy.push(data.review.id);
              localStorage.setItem('miraya_my_reviews', JSON.stringify(currentMy));
              setMyReviewIds([...currentMy]);
            }
          } catch (_) {}
        }
        setIsModalOpen(false);
        // Reset form
        setFormData({
          rating: 5,
          customer_name: '',
          customer_city: '',
          occasion: 'Bridal Wear',
          title: '',
          comment: ''
        });
        setSelectedFiles([]);
        setFilePreviews([]);
        // Refresh reviews
        fetchReviews();
      } else {
        toast.error?.(data.message || 'Failed to submit review.');
      }
    } catch (err) {
      console.error('Submit review error:', err);
      toast.error?.('Network error while submitting review.');
    } finally {
      setSubmitting(false);
    }
  };

  // Upvote / Like review
  const handleLike = async (reviewId) => {
    if (likedMap[reviewId]) return;
    try {
      setLikedMap(prev => ({ ...prev, [reviewId]: true }));
      setReviews(prev =>
        prev.map(r => (r.id === reviewId ? { ...r, likes_count: (r.likes_count || 0) + 1 } : r))
      );
      await fetch(`${API}/api/reviews/${reviewId}/like`, { method: 'POST' });
    } catch (err) {
      console.error('Error liking review:', err);
    }
  };

  // Delete User Review
  const handleDeleteUserReviewClick = (review) => {
    setDeleteConfirmConfig({
      title: 'Delete Your Review',
      message: 'Are you sure you want to permanently remove your review for this garment? This action cannot be undone.',
      confirmText: 'Delete Review',
      danger: true,
      onConfirm: async () => {
        try {
          const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('user_token')) : null;
          const headers = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const res = await fetch(`${API}/api/reviews/${review.id}`, {
            method: 'DELETE',
            headers
          });
          const data = await res.json();
          if (res.ok && data.success) {
            toast.success?.('Your review has been successfully removed.');
            setReviews(prev => prev.filter(r => r.id !== review.id));
            setDeleteConfirmConfig(null);
            try {
              const myIds = JSON.parse(localStorage.getItem('miraya_my_reviews') || '[]');
              const updated = myIds.filter(id => id !== review.id);
              localStorage.setItem('miraya_my_reviews', JSON.stringify(updated));
              setMyReviewIds(updated);
            } catch (_) {}
          } else {
            toast.error?.(data.message || 'Failed to delete review.');
          }
        } catch (err) {
          console.error('Delete user review error:', err);
          toast.error?.('Server communication error.');
        }
      }
    });
  };

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      if (activeFilter === 'photos') return Array.isArray(r.images) && r.images.length > 0;
      if (activeFilter === '5') return r.rating === 5;
      if (activeFilter === '4') return r.rating === 4;
      if (activeFilter === '3') return r.rating === 3;
      return true;
    });
  }, [reviews, activeFilter]);

  const ratingLabel = (rating) => {
    switch (rating) {
      case 5: return 'Exceptional & Luxurious';
      case 4: return 'Very Beautiful Fit';
      case 3: return 'Good Quality';
      case 2: return 'Average';
      default: return 'Needs Improvement';
    }
  };

  return (
    <div className="product-reviews-container">
      {/* Section Header */}
      <div className="reviews-section-header">
        <div className="reviews-header-left">
          <div className="reviews-badge">
            <Sparkles size={14} className="sparkle-icon" />
            <span>REAL BRIDES & CUSTOMER VOICES</span>
          </div>
          <h2 className="reviews-main-title">Customer Reviews & Experiences</h2>
          <p className="reviews-subtitle">
            Authentic feedback and handcrafted impressions from patrons of Miraya by Garima.
          </p>
        </div>

        <button
          className="write-review-luxury-btn"
          onClick={() => setIsModalOpen(true)}
        >
          <MessageSquarePlus size={18} />
          <span>WRITE A REVIEW</span>
        </button>
      </div>

      {/* Overview Card: Score + Distribution Breakdown */}
      <div className="reviews-overview-card">
        <div className="score-summary-column">
          <div className="big-rating-number">
            {stats.averageRating ? stats.averageRating.toFixed(1) : '5.0'}
          </div>
          <div className="stars-row large-stars">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= Math.round(stats.averageRating || 5);
              return (
                <Star
                  key={star}
                  size={22}
                  fill={isFilled ? '#d4af37' : 'none'}
                  color={isFilled ? '#d4af37' : '#dcd4c8'}
                  className={isFilled ? 'star-filled' : 'star-empty'}
                />
              );
            })}
          </div>
          <p className="total-reviews-count">
            Based on <strong>{stats.totalReviews || reviews.length}</strong> verified boutique reviews
          </p>
          <div className="verified-badge-pill">
            <ShieldCheck size={14} />
            <span>100% Authentic Purchases</span>
          </div>
        </div>

        <div className="distribution-bars-column">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.distribution?.[star] || 0;
            const pct = stats.percentageDistribution?.[star] || 0;
            return (
              <div
                key={star}
                className="dist-bar-row"
                onClick={() => setActiveFilter(String(star))}
                title={`Filter by ${star} stars`}
              >
                <span className="dist-star-label">{star} ★</span>
                <div className="dist-bar-track">
                  <div
                    className="dist-bar-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="dist-count-label">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real Brides Customer Photo Strip (if photos exist) */}
      {stats.photoGallery && stats.photoGallery.length > 0 && (
        <div className="customer-photo-strip-section">
          <div className="strip-header">
            <div className="strip-title">
              <Camera size={16} color="#C6A46A" />
              <span>Real Brides Photo Gallery ({stats.photoGallery.length})</span>
            </div>
            <span className="strip-hint">Click any photo to view in high resolution</span>
          </div>
          <div className="photo-strip-carousel">
            {stats.photoGallery.map((imgUrl, idx) => (
              <div
                key={idx}
                className="strip-photo-card"
                onClick={() => setLightboxImg(imgUrl)}
              >
                <img src={imgUrl} alt={`Real Bride Photo ${idx + 1}`} loading="lazy" />
                <div className="photo-overlay">
                  <Maximize2 size={18} color="#fff" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs Bar */}
      <div className="reviews-filter-bar">
        <div className="filter-pills-list">
          <button
            className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Reviews ({reviews.length})
          </button>
          {stats.photoGallery && stats.photoGallery.length > 0 && (
            <button
              className={`filter-pill ${activeFilter === 'photos' ? 'active' : ''}`}
              onClick={() => setActiveFilter('photos')}
            >
              <Camera size={14} />
              With Photos ({stats.photoGallery.length})
            </button>
          )}
          <button
            className={`filter-pill ${activeFilter === '5' ? 'active' : ''}`}
            onClick={() => setActiveFilter('5')}
          >
            5 Stars ({stats.distribution?.[5] || 0})
          </button>
          <button
            className={`filter-pill ${activeFilter === '4' ? 'active' : ''}`}
            onClick={() => setActiveFilter('4')}
          >
            4 Stars ({stats.distribution?.[4] || 0})
          </button>
          <button
            className={`filter-pill ${activeFilter === '3' ? 'active' : ''}`}
            onClick={() => setActiveFilter('3')}
          >
            3 Stars ({stats.distribution?.[3] || 0})
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="reviews-list-wrapper">
        {loading ? (
          <div className="reviews-loading-state">
            <div className="luxury-spinner" />
            <p>Loading handcrafted reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="reviews-empty-state">
            <Sparkles size={36} color="#C6A46A" />
            <h3>Be the first to review this exquisite garment</h3>
            <p>Share your fitting experience, fabric impression, and drape styling with fellow patrons.</p>
            <button
              className="write-review-luxury-btn"
              onClick={() => setIsModalOpen(true)}
            >
              <MessageSquarePlus size={16} />
              <span>WRITE THE FIRST REVIEW</span>
            </button>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const isMyReview = Boolean(
              (currentUser?.id && review.user_id && String(review.user_id) === String(currentUser.id)) ||
              myReviewIds.includes(review.id) ||
              (currentUser?.name && review.customer_name && review.customer_name.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
            );

            return (
              <div key={review.id} className="luxury-review-card">
                <div className="review-card-top">
                  <div className="reviewer-info">
                    <div className="reviewer-avatar">
                      {(review.customer_name || 'V')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="reviewer-name-row">
                        <span className="reviewer-name">
                          {review.customer_name || 'Verified Customer'}
                        </span>
                        {review.is_verified && (
                          <span className="verified-buyer-tag">
                            <CheckCircle2 size={13} />
                            Verified Buyer
                          </span>
                        )}
                      </div>
                      {review.customer_city && (
                        <span className="reviewer-city">{review.customer_city}</span>
                      )}
                    </div>
                  </div>

                  <div className="review-meta-right">
                    {review.occasion && (
                      <span className="occasion-pill">
                        ✨ {review.occasion}
                      </span>
                    )}
                    <span className="review-date">
                      {new Date(review.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                <div className="review-stars-row">
                  {[1, 2, 3, 4, 5].map((s) => {
                    const isFilled = s <= (Number(review.rating) || 0);
                    return (
                      <Star
                        key={s}
                        size={16}
                        fill={isFilled ? '#d4af37' : 'none'}
                        color={isFilled ? '#d4af37' : '#dcd4c8'}
                        className={isFilled ? 'star-filled' : 'star-empty'}
                      />
                    );
                  })}
                  <span className="rating-text-label">{ratingLabel(review.rating)}</span>
                </div>

                {review.title && (
                  <h4 className="review-card-title">{review.title}</h4>
                )}

                <p className="review-card-comment">{review.comment}</p>

                {/* Photos attached to this review */}
                {Array.isArray(review.images) && review.images.length > 0 && (
                  <div className="review-attached-photos">
                    {review.images.map((img, i) => (
                      <div
                        key={i}
                        className="review-thumb-box"
                        onClick={() => setLightboxImg(img)}
                      >
                        <img src={img} alt={`Review photo ${i + 1}`} loading="lazy" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="review-card-footer">
                  <button
                    className={`helpful-btn ${likedMap[review.id] ? 'liked' : ''}`}
                    onClick={() => handleLike(review.id)}
                    title="Mark this review as helpful"
                  >
                    <ThumbsUp size={14} />
                    <span>Helpful ({review.likes_count || 0})</span>
                  </button>

                  {isMyReview && (
                    <button
                      className="delete-user-review-btn"
                      onClick={() => handleDeleteUserReviewClick(review)}
                      title="Delete your review"
                    >
                      <Trash2 size={13} />
                      <span>Delete My Review</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── WRITE A REVIEW MODAL ─── */}
      {isModalOpen && (
        <div
          className="review-modal-overlay modal-overlay"
          data-modal="true"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="review-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setIsModalOpen(false)}
            >
              <X size={20} />
            </button>

            <div className="modal-header-section">
              <span className="modal-top-tag">MIRAYA ATELIER</span>
              <h3 className="modal-heading">Share Your Experience</h3>
              <p className="modal-subtext">
                Reviewing <strong>{product?.title || product?.name || 'Garment'}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="review-form">
              {/* Star Rating Picker */}
              <div className="form-group rating-picker-group">
                <label className="form-label">Overall Rating *</label>
                <div className="interactive-stars-picker">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      className="star-pick-btn"
                      onMouseEnter={() => setRatingHover(star)}
                      onMouseLeave={() => setRatingHover(0)}
                      onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                    >
                      <Star
                        size={32}
                        className={
                          star <= (ratingHover || formData.rating)
                            ? 'star-filled pulse'
                            : 'star-empty'
                        }
                      />
                    </button>
                  ))}
                </div>
                <span className="rating-feedback-hint">
                  {ratingLabel(ratingHover || formData.rating)}
                </span>
              </div>

              {/* Name & City */}
              <div className="form-row-2col">
                <div className="form-group">
                  <label className="form-label">Your Name *</label>
                  <input
                    type="text"
                    className="luxury-input"
                    placeholder="e.g. Ananya Sharma"
                    value={formData.customer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="luxury-input"
                    placeholder="e.g. Mumbai / Delhi / Nagpur"
                    value={formData.customer_city}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_city: e.target.value }))}
                  />
                </div>
              </div>

              {/* Occasion Selector */}
              <div className="form-group">
                <label className="form-label">Occasion / Event</label>
                <select
                  className="luxury-select"
                  value={formData.occasion}
                  onChange={(e) => setFormData(prev => ({ ...prev, occasion: e.target.value }))}
                >
                  {OCCASIONS.map((occ) => (
                    <option key={occ} value={occ}>{occ}</option>
                  ))}
                </select>
              </div>

              {/* Review Title */}
              <div className="form-group">
                <label className="form-label">Headline / Title</label>
                <input
                  type="text"
                  className="luxury-input"
                  placeholder="e.g. Absolutely stunning embroidery and royal drape!"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* Detailed Experience */}
              <div className="form-group">
                <label className="form-label">Your Review & Fitting Experience *</label>
                <textarea
                  className="luxury-textarea"
                  rows={4}
                  placeholder="Tell us about the fabric feel, craftsmanship, sizing accuracy, and compliments received..."
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  required
                />
              </div>

              {/* Photo Upload with Previews */}
              <div className="form-group photo-upload-group">
                <label className="form-label">
                  <Camera size={16} />
                  <span>Attach Real Photos (Up to 5)</span>
                </label>
                
                <div className="photo-previews-list">
                  {filePreviews.map((url, idx) => (
                    <div key={idx} className="preview-thumb-box">
                      <img src={url} alt={`Upload ${idx + 1}`} />
                      <button
                        type="button"
                        className="remove-thumb-btn"
                        onClick={() => removeSelectedPhoto(idx)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {selectedFiles.length < 5 && (
                    <label className="upload-trigger-box">
                      <Upload size={20} color="#C6A46A" />
                      <span>Add Photos</span>
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
                <span className="photo-help-text">
                  PNG, JPG, WebP supported. High resolution photos will be displayed on the boutique gallery.
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="modal-actions-row">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-review-btn"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="btn-spinner-text">
                      <div className="button-spinner" /> Uploading & Publishing...
                    </span>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>SUBMIT VERIFIED REVIEW</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── IMAGE LIGHTBOX MODAL ─── */}
      {lightboxImg && (
        <div
          className="review-lightbox-overlay modal-overlay"
          data-modal="true"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxImg(null)}
        >
          <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close-btn" onClick={() => setLightboxImg(null)}>
              <X size={24} />
            </button>
            <img src={lightboxImg} alt="Real Bride High Resolution View" className="lightbox-full-img" />
          </div>
        </div>
      )}
      {/* ─── CONFIRM DELETE USER REVIEW MODAL ─── */}
      <ConfirmModal
        config={deleteConfirmConfig}
        onClose={() => setDeleteConfirmConfig(null)}
      />
    </div>
  );
}
