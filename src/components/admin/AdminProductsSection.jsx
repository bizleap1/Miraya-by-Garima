import React, { useState } from 'react';
import {
  Plus, Search, Edit, Trash2, X, Image as ImageIcon,
  Check, AlertCircle, Eye, RefreshCw, UploadCloud,
  Link as LinkIcon, Crop as CropIcon, ImagePlus, Star, Trash,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import ImageCropperModal from './ImageCropperModal';
import ConfirmModal from '../ConfirmModal';

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

import { getProductImage } from '../../utils/imageHelper';

const getImgUrl = (raw) => {
  return getProductImage(raw);
};

const COMMON_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

const BOUTIQUE_SAMPLE_PRESETS = [
  { label: 'Red Anarkali', url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80' },
  { label: 'Gold Lehenga', url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80' },
  { label: 'Drape Saree', url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80' },
  { label: 'Silk Co-ord', url: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=800&q=80' },
  { label: 'Designer Suit', url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80' },
];

export default function AdminProductsSection({ products = [], categories = [], token, API_BASE_URL, onRefresh }) {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Luxury Confirm Modal State
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);

  // Drawer / Modal States
  const [showModal, setShowModal] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  // Multi-Image Gallery & Interactive Cropper State
  // Array of { id: string, url: string, file: File|Blob|null, isMain: boolean }
  const [galleryImages, setGalleryImages] = useState([]);
  const [cropperModal, setCropperModal] = useState({
    isOpen: false,
    sourceUrl: '',
    targetIndex: null, // null for new image, number for editing existing image
    isNew: false
  });

  const [imageMode, setImageMode] = useState('upload'); // 'upload' | 'url' | 'presets'
  const [urlInput, setUrlInput] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    sub_category: '',
    price: '',
    mrp: '',
    color: 'Default',
    fabric: '',
    embroidery: '',
    wash_care: '',
    fit_notes: '',
    dispatch_info: '',
    highlights: '',
    promo_label: '',
    image_url: '',
    is_active: true,
    whatsapp_inquiry: false
  });

  const [selectedSizes, setSelectedSizes] = useState(['S', 'M', 'L', 'XL', 'XXL']);
  const [sizeStock, setSizeStock] = useState({ S: 5, M: 5, L: 5, XL: 2, XXL: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Filter products
  const productList = Array.isArray(products) ? products : [];
  const categoryList = Array.isArray(categories) ? categories : [];

  const filteredProducts = productList.filter((p) => {
    const titleMatch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      ((p.description || '').toLowerCase().includes(search.toLowerCase())) ||
      (`#SKU-${p.id}`).toLowerCase().includes(search.toLowerCase());
    const catMatch = selectedCat === 'all' || String(p.category_id) === String(selectedCat);
    const isActive = p.is_active !== false && p.status !== 'inactive';
    const statusMatch = statusFilter === 'all' || (statusFilter === 'all' ? true : (statusFilter === 'active' ? isActive : !isActive));
    return titleMatch && catMatch && statusMatch;
  });

  // Open modal for NEW product
  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingProductId(null);
    setGalleryImages([]);
    setCropperModal({ isOpen: false, sourceUrl: '', targetIndex: null, isNew: false });
    setImageMode('upload');
    setUrlInput('');
    setFormData({
      name: '',
      description: '',
      category_id: categoryList.length > 0 ? String(categoryList[0].id) : '',
      sub_category: '',
      price: '',
      mrp: '',
      color: 'Default',
      fabric: '',
      embroidery: '',
      wash_care: '',
      fit_notes: '',
      dispatch_info: '',
      highlights: '',
      promo_label: '',
      image_url: '',
      is_active: true,
      whatsapp_inquiry: false
    });
    setSelectedSizes(['S', 'M', 'L', 'XL', 'XXL']);
    setSizeStock({ S: 5, M: 5, L: 5, XL: 2, XXL: 0 });
    setFormError('');
    setShowModal(true);
  };


  const [newCustomSize, setNewCustomSize] = useState('');

  const handleAddCustomSize = (sizeName) => {
    const trimmed = (sizeName || newCustomSize || '').trim();
    if (!trimmed) return;
    const exists = selectedSizes.some(s => s.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      setSelectedSizes(prev => [...prev, trimmed]);
      setSizeStock(prev => ({ ...prev, [trimmed]: prev[trimmed] !== undefined ? prev[trimmed] : 5 }));
    }
    setNewCustomSize('');
  };

  const handleRemoveSize = (sizeName) => {
    setSelectedSizes(prev => prev.filter(s => s.toLowerCase() !== sizeName.toLowerCase()));
    setSizeStock(prev => {
      const next = { ...prev };
      delete next[sizeName];
      return next;
    });
  };

  // Open modal for EDITING product
  const handleOpenEditModal = (p) => {
    setIsEditing(true);
    setEditingProductId(p.id);

    // Populate gallery images from product
    const existingImgs = (Array.isArray(p.images) && p.images.length > 0)
      ? p.images
      : (p.image_url ? [p.image_url] : []);

    const initialGallery = existingImgs.map((url, idx) => ({
      id: `existing-${idx}-${Date.now()}`,
      url: getImgUrl(url, API_BASE_URL),
      rawUrl: url,
      file: null,
      isMain: idx === 0
    }));

    setGalleryImages(initialGallery);
    setCropperModal({ isOpen: false, sourceUrl: '', targetIndex: null, isNew: false });
    setImageMode('upload');
    setUrlInput('');

    // Parse size stock
    const currentSizeStock = {};
    const sizesFound = [];

    if (p.variants && p.variants.length > 0) {
      p.variants.forEach(v => {
        currentSizeStock[v.size] = v.stock;
        if (!sizesFound.includes(v.size)) sizesFound.push(v.size);
      });
    } else if (p.size_stock && typeof p.size_stock === 'object') {
      Object.entries(p.size_stock).forEach(([sz, st]) => {
        currentSizeStock[sz] = Number(st);
        if (!sizesFound.includes(sz)) sizesFound.push(sz);
      });
    } else {
      sizesFound.push('S', 'M', 'L', 'XL');
      currentSizeStock['S'] = Math.floor((p.stock || 0) / 3);
      currentSizeStock['M'] = Math.floor((p.stock || 0) / 3);
      currentSizeStock['L'] = Math.floor((p.stock || 0) / 3);
      currentSizeStock['XL'] = (p.stock || 0) % 3;
    }

    const firstVariant = p.variants && p.variants[0];

    setFormData({
      name: p.name || '',
      description: p.description || '',
      category_id: p.category_id ? String(p.category_id) : '',
      sub_category: p.sub_category || '',
      price: p.price ? String(p.price) : '',
      mrp: p.mrp ? String(p.mrp) : (p.mrp_price ? String(p.mrp_price) : (p.price ? String(Math.round(Number(p.price) * 1.2)) : '')),
      color: firstVariant?.color || p.color || 'Default',
      fabric: p.fabric || '',
      embroidery: p.embroidery || '',
      wash_care: p.wash_care || '',
      fit_notes: p.fit_notes || '',
      dispatch_info: p.dispatch_info || '',
      highlights: p.highlights || '',
      promo_label: p.promo_label || '',
      image_url: p.image_url || '',
      is_active: p.is_active !== false && p.status !== 'inactive',
      whatsapp_inquiry: p.whatsapp_inquiry === true || (p.price && String(p.price).toLowerCase().includes('whatsapp'))
    });


    const activeSizesList = sizesFound.length > 0 ? sizesFound : ['S', 'M', 'L', 'XL', 'XXL'];
    setSelectedSizes(activeSizesList);
    activeSizesList.forEach(sz => {
      if (currentSizeStock[sz] === undefined) currentSizeStock[sz] = 0;
    });
    setSizeStock(currentSizeStock);
    setFormError('');
    setShowModal(true);
  };


  const handleSizeStockChange = (sz, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setSizeStock({ ...sizeStock, [sz]: num });
  };

  // Image Upload Trigger -> Immediately opens Cropper Modal
  const handleImageFileSelected = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropperModal({
        isOpen: true,
        sourceUrl: reader.result,
        targetIndex: null, // new image
        isNew: true
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Preset or URL selected -> Immediately opens Cropper Modal
  const handleOpenCropperForUrl = (url) => {
    if (!url || !url.trim()) return;
    setCropperModal({
      isOpen: true,
      sourceUrl: url.trim(),
      targetIndex: null,
      isNew: true
    });
  };

  // Recrop existing gallery image
  const handleRecropExisting = (index) => {
    const imgItem = galleryImages[index];
    if (!imgItem) return;
    setCropperModal({
      isOpen: true,
      sourceUrl: imgItem.url,
      targetIndex: index,
      isNew: false
    });
  };

  // Handle Crop Complete from Cropper Modal
  const handleCropComplete = ({ file, dataUrl }) => {
    if (cropperModal.targetIndex !== null) {
      // Re-cropped existing image
      setGalleryImages((prev) => {
        const next = [...prev];
        next[cropperModal.targetIndex] = {
          ...next[cropperModal.targetIndex],
          url: dataUrl,
          file: file,
        };
        return next;
      });
    } else {
      // New image added with crop
      const newImgObj = {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        url: dataUrl,
        file: file,
        isMain: galleryImages.length === 0
      };
      setGalleryImages((prev) => [...prev, newImgObj]);
    }
    setCropperModal({ isOpen: false, sourceUrl: '', targetIndex: null, isNew: false });
    setUrlInput('');
  };

  // Set Main Cover Image (Moves to #1 position & sets isMain: true)
  const handleSetMainCover = (index) => {
    setGalleryImages((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const target = { ...prev[index], isMain: true };
      const others = prev.filter((_, idx) => idx !== index).map(img => ({ ...img, isMain: false }));
      return [target, ...others];
    });
  };

  // Move image earlier or later in sequence (index 0 is always the Cover Image)
  const handleMoveImage = (index, direction) => {
    setGalleryImages((prev) => {
      const newIndex = direction === 'left' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[newIndex];
      next[newIndex] = temp;
      return next.map((img, idx) => ({
        ...img,
        isMain: idx === 0
      }));
    });
  };

  // Remove Image from Gallery
  const handleRemoveImage = (index) => {
    setGalleryImages((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.map((img, idx) => ({
        ...img,
        isMain: idx === 0
      }));
    });
  };

  // Save (Create / Update)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Product title is required.');
      return;
    }

    if (!formData.whatsapp_inquiry && (!formData.price || parseFloat(formData.price) <= 0)) {
      setFormError('Please enter a valid selling price or enable WhatsApp Inquiry.');
      return;
    }

    const activeToken = token || localStorage.getItem('token');
    if (!activeToken) {
      setFormError('Admin session expired. Please log in again.');
      return;
    }

    setSubmitting(true);

    try {
      const finalSizeStock = {};
      selectedSizes.forEach(sz => {
        finalSizeStock[sz] = sizeStock[sz] !== undefined ? Number(sizeStock[sz]) : 0;
      });

      const totalStock = Object.values(finalSizeStock).reduce((acc, val) => acc + Number(val || 0), 0);

      const url = isEditing
        ? `${API_BASE_URL}/api/products/${editingProductId}`
        : `${API_BASE_URL}/api/products`;

      const method = isEditing ? 'PUT' : 'POST';

      // Ensure sequence has the chosen cover image at position 0
      const sortedGallery = [...galleryImages];
      if (sortedGallery.length > 0 && !sortedGallery[0].isMain) {
        const coverIdx = sortedGallery.findIndex(g => g.isMain);
        if (coverIdx > 0) {
          const [coverItem] = sortedGallery.splice(coverIdx, 1);
          sortedGallery.unshift(coverItem);
        }
      }
      sortedGallery.forEach((g, idx) => { g.isMain = (idx === 0); });

      const hasNewFiles = sortedGallery.some(g => g.file !== null);

      let res;
      if (hasNewFiles) {
        const fd = new FormData();
        fd.append('name', formData.name.trim());
        fd.append('description', formData.description ? formData.description.trim() : '');
        fd.append('price', String(formData.price || 0));
        if (formData.mrp) fd.append('mrp', String(formData.mrp));
        fd.append('stock', String(totalStock));
        fd.append('category_id', formData.category_id ? String(formData.category_id) : '');
        fd.append('sub_category', formData.sub_category ? formData.sub_category.trim() : '');
        fd.append('color', formData.color ? formData.color.trim() : 'Default');
        fd.append('fabric', formData.fabric ? formData.fabric.trim() : '');
        fd.append('embroidery', formData.embroidery ? formData.embroidery.trim() : '');
        fd.append('wash_care', formData.wash_care ? formData.wash_care.trim() : '');
        fd.append('fit_notes', formData.fit_notes ? formData.fit_notes.trim() : '');
        fd.append('dispatch_info', formData.dispatch_info ? formData.dispatch_info.trim() : '');
        fd.append('highlights', formData.highlights ? formData.highlights.trim() : '');
        fd.append('promo_label', formData.promo_label ? formData.promo_label.trim() : '');
        fd.append('sizes', JSON.stringify(selectedSizes));
        fd.append('size_stock', JSON.stringify(finalSizeStock));
        fd.append('whatsapp_inquiry', String(Boolean(formData.whatsapp_inquiry)));

        const existingUrls = [];
        const galleryOrder = [];

        sortedGallery.forEach((g) => {
          if (g.file) {
            fd.append('images', g.file);
            galleryOrder.push('__NEW_FILE__');
          } else if (g.rawUrl || (g.url && !g.url.startsWith('data:'))) {
            const u = g.rawUrl || g.url;
            existingUrls.push(u);
            galleryOrder.push(u);
          }
        });

        if (existingUrls.length > 0) {
          fd.append('existing_images', JSON.stringify(existingUrls));
        }
        fd.append('gallery_order', JSON.stringify(galleryOrder));

        res = await fetch(url, {
          method,
          headers: { 'Authorization': `Bearer ${activeToken}` },
          body: fd
        });
      } else {
        const imageUrlList = sortedGallery.map(g => g.rawUrl || g.url);
        const mainImage = imageUrlList[0] || (formData.image_url ? formData.image_url.trim() : null);

        const payload = {
          name: formData.name.trim(),
          description: formData.description ? formData.description.trim() : '',
          price: parseFloat(formData.price || 0),
          mrp: formData.mrp ? parseFloat(formData.mrp) : undefined,
          stock: totalStock,
          size_stock: finalSizeStock,
          sizes: selectedSizes,
          color: formData.color ? formData.color.trim() : 'Default',
          sub_category: formData.sub_category ? formData.sub_category.trim() : undefined,
          fabric: formData.fabric ? formData.fabric.trim() : undefined,
          embroidery: formData.embroidery ? formData.embroidery.trim() : undefined,
          wash_care: formData.wash_care ? formData.wash_care.trim() : undefined,
          fit_notes: formData.fit_notes ? formData.fit_notes.trim() : undefined,
          dispatch_info: formData.dispatch_info ? formData.dispatch_info.trim() : undefined,
          highlights: formData.highlights ? formData.highlights.trim() : undefined,
          promo_label: formData.promo_label ? formData.promo_label.trim() : undefined,
          image_url: mainImage,
          images: imageUrlList.length > 0 ? imageUrlList : (mainImage ? [mainImage] : []),
          category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
          whatsapp_inquiry: Boolean(formData.whatsapp_inquiry)
        };


        res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success !== false) {
        setShowModal(false);
        if (onRefresh) onRefresh();
      } else {
        const detail = data.error && data.error !== data.message ? `: ${data.error}` : '';
        const errorMsg = (data.message || 'Error saving product') + detail;
        setFormError(errorMsg);
      }
    } catch (err) {
      setFormError('Network error while saving product.');
    } finally {
      setSubmitting(false);
    }
  };

  // Luxury Confirm & Delete Product
  const handleDelete = (id, name) => {
    setConfirmModalConfig({
      title: 'Delete Garment Product',
      message: `Are you sure you want to delete "${name}"?`,
      subMessage: 'This will permanently remove the garment and all its size variants from your storefront.',
      confirmText: 'Yes, Delete Product',
      cancelText: 'Cancel',
      danger: true,
      onConfirm: async () => {
        const activeToken = token || localStorage.getItem('token');
        try {
          const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
            method: 'DELETE',
            headers: { ...(activeToken && { Authorization: `Bearer ${activeToken}` }) }
          });

          const data = await res.json().catch(() => ({}));
          if (res.ok && data.success !== false) {
            if (onRefresh) onRefresh();
          } else {
            setConfirmModalConfig({
              title: 'Deletion Failed',
              message: data.message || 'Could not delete product.',
              isAlert: true,
              danger: true,
            });
          }
        } catch (err) {
          setConfirmModalConfig({
            title: 'Connection Error',
            message: 'Unable to reach backend server. Please verify your connection.',
            isAlert: true,
            danger: true,
          });
        }
      }
    });
  };

  return (
    <div>
      {/* HEADER */}
      <div className="page-actions">
        <div>
          <h2>Products</h2>
          <p>Manage product details, prices, sizes and stock.</p>
        </div>

        <div className="action-buttons">
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} /> + Add Product
          </button>
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
              placeholder="Search products by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="admin-select"
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categoryList.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            className="admin-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="panel">
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>MRP</th>
                <th>Selling Price</th>
                <th>Size-wise Stock</th>
                <th>Total Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const img = p.image_url || (p.images && p.images[0]) || '/products/Lehenga-Pink Blush/1.JPG';
                const sizeStockMap = p.size_stock || {};
                const mrpVal = p.mrp || Math.round(Number(p.price || 0) * 1.2);
                const isActive = p.is_active !== false && p.status !== 'inactive';

                return (
                  <tr key={p.id}>
                    {/* Product Cell */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={getImgUrl(img, API_BASE_URL)}
                          alt={p.name}
                          style={{ width: '38px', height: '48px', objectFit: 'cover', borderRadius: '6px', background: '#f4f4f4' }}
                        />
                        <div>
                          <strong style={{ display: 'block', fontSize: '13px', fontWeight: '600' }}>{p.name}</strong>
                          {p.color && <span style={{ fontSize: '11px', color: 'var(--miraya-muted)' }}>Color: {p.color}</span>}
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td style={{ color: 'var(--miraya-muted)', fontFamily: 'monospace' }}>#SKU-{p.id}</td>

                    {/* Category */}
                    <td>{p.category?.name || p.sub_category || 'Unassigned'}</td>

                    {/* MRP */}
                    <td style={{ color: 'var(--miraya-muted)', textDecoration: 'line-through' }}>
                      {formatINR(mrpVal)}
                    </td>

                    {/* Selling Price */}
                    <td style={{ fontWeight: '700', color: 'var(--miraya-text)' }}>
                      {p.whatsapp_inquiry || (p.price && String(p.price).toLowerCase().includes('whatsapp')) ? (
                        <span style={{ fontSize: '11px', color: '#1a7a42', background: '#e8f5e9', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          💬 WhatsApp
                        </span>
                      ) : (
                        formatINR(p.price)
                      )}
                    </td>

                    {/* Size-wise stock matrix */}
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {COMMON_SIZES.map((sz) => {
                          const qty = sizeStockMap[sz] !== undefined ? sizeStockMap[sz] : 0;
                          return (
                            <span
                              key={sz}
                              style={{
                                fontSize: '11px',
                                background: qty > 0 ? 'var(--miraya-bg)' : 'var(--miraya-red-soft)',
                                border: '1px solid var(--miraya-border)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                color: qty > 0 ? 'var(--miraya-text)' : 'var(--miraya-red)'
                              }}
                            >
                              <strong>{sz}:</strong> {qty}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Total Stock */}
                    <td>
                      <span className={`status-badge ${p.stock > 5 ? 'status-success' : p.stock > 0 ? 'status-warning' : 'status-danger'}`}>
                        {p.stock ?? 0} in stock
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`status-badge ${isActive ? 'status-success' : 'status-neutral'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ minHeight: '30px', padding: '0 8px' }}
                          onClick={() => setViewProduct(p)}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ minHeight: '30px', padding: '0 8px' }}
                          onClick={() => handleOpenEditModal(p)}
                          title="Edit Product"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ minHeight: '30px', padding: '0 8px' }}
                          onClick={() => handleDelete(p.id, p.name)}
                          title="Delete Product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--miraya-muted)' }}>
                    No products found. Click <strong>+ Add Product</strong> to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW PRODUCT DRAWER */}
      {viewProduct && (
        <div className="admin-drawer-overlay" onClick={() => setViewProduct(null)}>
          <div className="admin-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Product Details: {viewProduct.name}</h3>
              <button onClick={() => setViewProduct(null)} style={{ background: 'none', border: 'none' }}><X size={18} /></button>
            </div>
            <div className="drawer-content">
              <img
                src={getImgUrl(viewProduct.image_url || (viewProduct.images && viewProduct.images[0]), API_BASE_URL)}
                alt={viewProduct.name}
                style={{ width: '100%', height: '260px', objectFit: 'cover', borderRadius: '8px', marginBottom: '20px' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div><span style={{ color: 'var(--miraya-muted)', fontSize: '12px' }}>Selling Price:</span><h4 style={{ margin: '4px 0', fontSize: '18px', color: 'var(--miraya-red)' }}>{formatINR(viewProduct.price)}</h4></div>
                <div><span style={{ color: 'var(--miraya-muted)', fontSize: '12px' }}>Category:</span><h4 style={{ margin: '4px 0', fontSize: '14px' }}>{viewProduct.category?.name || 'Unassigned'}</h4></div>
                <div><span style={{ color: 'var(--miraya-muted)', fontSize: '12px' }}>SKU:</span><p style={{ margin: '4px 0', fontFamily: 'monospace' }}>#SKU-{viewProduct.id}</p></div>
                <div><span style={{ color: 'var(--miraya-muted)', fontSize: '12px' }}>Color:</span><p style={{ margin: '4px 0' }}>{viewProduct.color || 'Standard'}</p></div>
              </div>
              <h4>Size-wise Inventory:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginTop: '10px' }}>
                {COMMON_SIZES.map(sz => (
                  <div key={sz} style={{ background: 'var(--miraya-bg)', border: '1px solid var(--miraya-border)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', display: 'block' }}>{sz}</span>
                    <strong style={{ fontSize: '16px', color: 'var(--miraya-red)' }}>{viewProduct.size_stock?.[sz] ?? 0}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="drawer-footer">
              <button className="btn btn-secondary" onClick={() => setViewProduct(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { const p = viewProduct; setViewProduct(null); handleOpenEditModal(p); }}>Edit Product</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditing ? `Edit Product: ${formData.name || 'Item'}` : 'Add New Product'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body">
                {formError && (
                  <div style={{ background: 'var(--miraya-red-soft)', border: '1px solid var(--miraya-red)', color: 'var(--miraya-red)', padding: '10px', borderRadius: '6px', marginBottom: '14px', fontSize: '13px' }}>
                    <AlertCircle size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> {formError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Product Name *</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="e.g. Royal Silk Anarkali"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Category</label>
                    <select
                      className="admin-select"
                      style={{ width: '100%' }}
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categoryList.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* PRICE OPTIONS & QUICK OUT-OF-STOCK TOGGLES */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px', background: 'var(--miraya-bg)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--miraya-border)' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#1b7837' }}>
                    <input
                      type="checkbox"
                      checked={formData.whatsapp_inquiry}
                      onChange={(e) => setFormData({ ...formData, whatsapp_inquiry: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: '#25D366', cursor: 'pointer' }}
                    />
                    <span>💬 DM on WhatsApp for Price (Price on Request)</span>
                  </label>

                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#c0392b' }}>
                    <input
                      type="checkbox"
                      checked={COMMON_SIZES.every(sz => Number(sizeStock[sz] || 0) === 0)}
                      onChange={(e) => {
                        const isOos = e.target.checked;
                        const updated = {};
                        COMMON_SIZES.forEach(sz => {
                          updated[sz] = isOos ? 0 : 5;
                        });
                        setSizeStock(updated);
                      }}
                      style={{ width: '16px', height: '16px', accentColor: '#e74c3c', cursor: 'pointer' }}
                    />
                    <span>🚫 Out of Stock (0 Inventory)</span>
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                      Selling Price (₹) {formData.whatsapp_inquiry ? <span style={{ color: '#25D366', fontSize: '11px', fontWeight: '700' }}>(DM for Price Active)</span> : '*'}
                    </label>
                    <input
                      type="number"
                      className="admin-input"
                      placeholder={formData.whatsapp_inquiry ? "Price on Request" : "e.g. 4999"}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required={!formData.whatsapp_inquiry}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>MRP (₹)</label>
                    <input
                      type="number"
                      className="admin-input"
                      placeholder="e.g. 6999"
                      value={formData.mrp}
                      onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Color</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="e.g. Crimson Red"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>
                </div>

                {/* IMAGE SELECTOR & MULTI-IMAGE GALLERY WITH CROP STUDIO */}
                <div style={{ marginBottom: '16px', background: 'var(--miraya-bg)', border: '1px solid var(--miraya-border)', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--miraya-text)', display: 'block' }}>
                        Product Gallery & Photos
                      </label>
                      <span style={{ fontSize: '11px', color: 'var(--miraya-muted)' }}>
                        Upload automatically opens the 3:4 Luxury Couture crop studio. Add multiple angles & fabric shots.
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', background: '#fff', border: '1px solid var(--miraya-border)', padding: '3px', borderRadius: '6px' }}>
                      <button
                        type="button"
                        className={`btn ${imageMode === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '4px 10px', fontSize: '11px', minHeight: '26px' }}
                        onClick={() => setImageMode('upload')}
                      >
                        <UploadCloud size={12} /> Upload Photo
                      </button>
                      <button
                        type="button"
                        className={`btn ${imageMode === 'url' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '4px 10px', fontSize: '11px', minHeight: '26px' }}
                        onClick={() => setImageMode('url')}
                      >
                        <LinkIcon size={12} /> Image URL
                      </button>
                      <button
                        type="button"
                        className={`btn ${imageMode === 'presets' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '4px 10px', fontSize: '11px', minHeight: '26px' }}
                        onClick={() => setImageMode('presets')}
                      >
                        <ImageIcon size={12} /> Presets
                      </button>
                    </div>
                  </div>

                  {/* UPLOAD TRIGGER */}
                  {imageMode === 'upload' && (
                    <div style={{ marginBottom: '12px' }}>
                      <input
                        type="file"
                        accept="image/*"
                        id="admin-product-file-input"
                        style={{ display: 'none' }}
                        onChange={handleImageFileSelected}
                      />
                      <label
                        htmlFor="admin-product-file-input"
                        className="btn btn-secondary"
                        style={{
                          cursor: 'pointer',
                          width: '100%',
                          border: '1.5px dashed var(--miraya-red)',
                          background: '#fff',
                          padding: '12px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontWeight: 600,
                          color: 'var(--miraya-red)'
                        }}
                      >
                        <ImagePlus size={16} /> Choose Garment Photo (Auto-Opens Crop Studio)...
                      </label>
                    </div>
                  )}

                  {/* URL TRIGGER */}
                  {imageMode === 'url' && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                      <input
                        type="text"
                        className="admin-input"
                        style={{ flex: 1 }}
                        placeholder="Paste image URL (https://... or /products/...)"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ minHeight: '38px', padding: '0 14px', fontSize: '12px' }}
                        onClick={() => handleOpenCropperForUrl(urlInput)}
                        disabled={!urlInput.trim()}
                      >
                        <CropIcon size={13} /> Crop & Add
                      </button>
                    </div>
                  )}

                  {/* PRESET TRIGGER */}
                  {imageMode === 'presets' && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                        {BOUTIQUE_SAMPLE_PRESETS.map((pst, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleOpenCropperForUrl(pst.url)}
                            style={{
                              border: '1px solid var(--miraya-border)',
                              borderRadius: '6px',
                              padding: '6px',
                              cursor: 'pointer',
                              background: '#fff',
                              textAlign: 'center',
                              transition: 'transform 0.15s ease'
                            }}
                            title="Click to Crop & Add this preset"
                          >
                            <img src={pst.url} alt={pst.label} style={{ height: '44px', width: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                            <span style={{ fontSize: '10px', display: 'block', marginTop: '4px', fontWeight: '600' }}>{pst.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MULTI-IMAGE GALLERY GRID */}
                  {galleryImages.length > 0 && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0 6px', flexWrap: 'wrap', gap: '6px' }}>
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--miraya-text)' }}>
                            Attached Photos ({galleryImages.length}):
                          </span>
                          <span style={{ fontSize: '11px', color: '#666', display: 'block', marginTop: '2px' }}>
                            Photo <strong>#1</strong> is the <strong>Cover Image</strong> shown on Collection pages. Photos <strong>#2, #3...</strong> appear on the Product Details Page in this exact sequence.
                          </span>
                        </div>
                        <label
                          htmlFor="admin-product-file-input"
                          style={{ fontSize: '11px', color: 'var(--miraya-red)', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fff', border: '1px solid var(--miraya-border)', padding: '5px 10px', borderRadius: '5px' }}
                        >
                          <Plus size={12} /> Add More
                        </label>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', marginTop: '8px' }}>
                        {galleryImages.map((imgItem, idx) => (
                          <div
                            key={imgItem.id || idx}
                            style={{
                              position: 'relative',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              border: imgItem.isMain ? '2px solid #b51624' : '1px solid var(--miraya-border)',
                              background: '#ffffff',
                              boxShadow: imgItem.isMain ? '0 3px 10px rgba(181, 22, 36, 0.18)' : '0 2px 6px rgba(0,0,0,0.06)',
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                          >
                            {/* IMAGE PREVIEW WITH TOP BADGES */}
                            <div style={{ position: 'relative', width: '100%', height: '140px', background: '#f5f5f5' }}>
                              <img
                                src={imgItem.url}
                                alt={`Photo ${idx + 1}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              />

                              {/* SEQUENCE / COVER BADGE */}
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '6px',
                                  left: '6px',
                                  background: imgItem.isMain ? '#b51624' : 'rgba(0, 0, 0, 0.72)',
                                  color: '#fff',
                                  fontSize: '9px',
                                  fontWeight: 700,
                                  padding: '3px 6px',
                                  borderRadius: '4px',
                                  letterSpacing: '0.4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                              >
                                {imgItem.isMain ? '★ #1 COVER' : `#${idx + 1}`}
                              </div>

                              {/* QUICK ACTIONS (Crop & Delete) */}
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '6px',
                                  right: '6px',
                                  display: 'flex',
                                  gap: '4px'
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleRecropExisting(idx)}
                                  style={{
                                    background: 'rgba(0, 0, 0, 0.65)',
                                    border: 'none',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  title="Crop / Re-align (3:4 studio)"
                                >
                                  <CropIcon size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(idx)}
                                  style={{
                                    background: 'rgba(214, 48, 49, 0.85)',
                                    border: 'none',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  title="Delete Photo"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            {/* CARD CONTROLS & SEQUENCE ARROWS */}
                            <div style={{ padding: '8px 6px', background: imgItem.isMain ? '#fff9fa' : '#fafafa', borderTop: '1px solid var(--miraya-border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {/* COVER TOGGLE BUTTON */}
                              {imgItem.isMain ? (
                                <div
                                  style={{
                                    width: '100%',
                                    padding: '4px 6px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    background: '#e8f5e9',
                                    color: '#2e7d32',
                                    border: '1px solid #a5d6a7',
                                    borderRadius: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <Check size={11} /> Cover Photo
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetMainCover(idx)}
                                  style={{
                                    width: '100%',
                                    padding: '4px 6px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    background: '#fff',
                                    color: '#b51624',
                                    border: '1px solid #b51624',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    transition: 'all 0.15s ease'
                                  }}
                                  title="Make this photo the Cover Image (#1)"
                                >
                                  <Star size={11} /> Set as Cover
                                </button>
                              )}

                              {/* REORDER SEQUENCE BUTTONS */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveImage(idx, 'left')}
                                  style={{
                                    flex: 1,
                                    padding: '3px 4px',
                                    fontSize: '10px',
                                    background: idx === 0 ? '#f0f0f0' : '#fff',
                                    border: '1px solid var(--miraya-border)',
                                    borderRadius: '3px',
                                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                    color: idx === 0 ? '#bbb' : '#444',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '2px'
                                  }}
                                  title="Move earlier in sequence"
                                >
                                  <ChevronLeft size={12} /> Move
                                </button>

                                <button
                                  type="button"
                                  disabled={idx === galleryImages.length - 1}
                                  onClick={() => handleMoveImage(idx, 'right')}
                                  style={{
                                    flex: 1,
                                    padding: '3px 4px',
                                    fontSize: '10px',
                                    background: idx === galleryImages.length - 1 ? '#f0f0f0' : '#fff',
                                    border: '1px solid var(--miraya-border)',
                                    borderRadius: '3px',
                                    cursor: idx === galleryImages.length - 1 ? 'not-allowed' : 'pointer',
                                    color: idx === galleryImages.length - 1 ? '#bbb' : '#444',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '2px'
                                  }}
                                  title="Move later in sequence"
                                >
                                  Move <ChevronRight size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* SIZE-WISE STOCK INPUT MATRIX WITH ADD / REMOVE OPTIONS */}
                <div style={{ background: 'var(--miraya-bg)', border: '1px solid var(--miraya-border)', padding: '14px', borderRadius: '8px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--miraya-text)' }}>
                      Size-wise Stock Allocation ({selectedSizes.length} Active Sizes)
                    </label>

                    {/* Quick Add Preset Pills */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', 'Free Size'].map(preset => {
                        const isAdded = selectedSizes.some(s => s.toLowerCase() === preset.toLowerCase());
                        if (isAdded) return null;
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleAddCustomSize(preset)}
                            style={{
                              padding: '2px 7px',
                              fontSize: '10px',
                              fontWeight: '600',
                              borderRadius: '4px',
                              border: '1px solid var(--miraya-red)',
                              background: '#fff',
                              color: 'var(--miraya-red)',
                              cursor: 'pointer'
                            }}
                          >
                            + {preset}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* CUSTOM SIZE INPUT FIELD */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      className="admin-input"
                      style={{ height: '32px', fontSize: '12px', flex: 1 }}
                      placeholder="Type custom size (e.g. 3XL, 34, Custom Fit)..."
                      value={newCustomSize}
                      onChange={(e) => setNewCustomSize(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSize(); } }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0 12px', height: '32px', fontSize: '12px', minHeight: '32px' }}
                      onClick={() => handleAddCustomSize()}
                    >
                      <Plus size={14} /> Add Size
                    </button>
                  </div>

                  {/* ACTIVE SIZES GRID WITH REMOVE BUTTON */}
                  {selectedSizes.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px', width: '100%' }}>
                      {selectedSizes.map(sz => (
                        <div
                          key={sz}
                          style={{
                            background: '#ffffff',
                            border: '1px solid var(--miraya-border)',
                            borderRadius: '6px',
                            padding: '6px',
                            position: 'relative'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--miraya-text)' }}>{sz}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSize(sz)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#e74c3c',
                                cursor: 'pointer',
                                padding: '0 2px',
                                lineHeight: 1
                              }}
                              title={`Remove size ${sz}`}
                            >
                              <X size={13} />
                            </button>
                          </div>
                          <input
                            type="number"
                            className="admin-input"
                            style={{ textAlign: 'center', height: '32px', padding: '0 4px', width: '100%', fontSize: '12px', fontWeight: '700' }}
                            value={sizeStock[sz] !== undefined ? sizeStock[sz] : 0}
                            onChange={(e) => handleSizeStockChange(sz, e.target.value)}
                            min="0"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '12px', color: 'var(--miraya-muted)', textAlign: 'center', padding: '10px', margin: 0 }}>
                      No sizes selected. Click presets above or add custom size.
                    </p>
                  )}
                </div>


                {/* RICH SPECIFICATIONS & PDP ACCORDION DETAILS */}
                <div style={{ background: '#FAF8F5', border: '1px solid #e6d8c3', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--miraya-text)', marginBottom: '12px' }}>
                    ✨ Rich Product Specifications & PDP Description Details
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Fabric & Material</label>
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="e.g. Raw Silk & Organza Chiffon"
                        value={formData.fabric}
                        onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Embroidery & Handcrafted Work</label>
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="e.g. Zari, Sequin Rain & Cutdana Work"
                        value={formData.embroidery}
                        onChange={(e) => setFormData({ ...formData, embroidery: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Style / Sub-Category</label>
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="e.g. Anarkali Gown / Drape Saree / Co-ord Set"
                        value={formData.sub_category}
                        onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Wash & Care Instructions</label>
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="e.g. Dry Clean Only"
                        value={formData.wash_care}
                        onChange={(e) => setFormData({ ...formData, wash_care: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Fit & Alteration Notes</label>
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="e.g. Tailored luxury fit, 2-inch margin inside"
                        value={formData.fit_notes}
                        onChange={(e) => setFormData({ ...formData, fit_notes: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Dispatch & Shipping Time</label>
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="e.g. Ships within 3-5 business days"
                        value={formData.dispatch_info}
                        onChange={(e) => setFormData({ ...formData, dispatch_info: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Promo / Sale Badge Label</label>
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="e.g. FESTIVE SALE / 15% OFF / NEW ARRIVAL"
                        value={formData.promo_label}
                        onChange={(e) => setFormData({ ...formData, promo_label: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Key Feature Highlights</label>
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="e.g. Scalloped borders • Padded blouse • Sheer dupatta"
                        value={formData.highlights}
                        onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Main Overview Description</label>
                    <textarea
                      className="admin-input"
                      rows="3"
                      style={{ height: 'auto', padding: '8px 12px' }}
                      placeholder="A sheer, breathtaking piece with hand-scalloped borders and scattered sequin rain..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTERACTIVE IMAGE CROPPER & STUDIO MODAL */}
      {cropperModal.isOpen && (
        <ImageCropperModal
          imageSrc={cropperModal.sourceUrl}
          initialAspectRatio={3 / 4}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropperModal({ isOpen: false, sourceUrl: '', targetIndex: null, isNew: false })}
        />
      )}

      {/* LUXURY CONFIRMATION DIALOG */}
      <ConfirmModal
        config={confirmModalConfig}
        onClose={() => setConfirmModalConfig(null)}
      />
    </div>
  );
}
