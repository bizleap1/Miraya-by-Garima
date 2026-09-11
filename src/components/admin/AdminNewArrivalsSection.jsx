import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Upload,
  RotateCcw,
  Search,
  Sliders,
  Sparkles,
  Move,
  ZoomIn,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import './AdminNewArrivalsSection.css';

// Default initial state matching current live luxury section
const DEFAULT_CMS_DATA = {
  is_active: true,
  heading: 'Fresh Arrivals,\nTimeless Grace',
  description: 'Thoughtfully designed. Beautifully detailed.\nA celebration of you, in every thread.',
  button_text: 'DISCOVER NEW ARRIVALS',
  button_link: '/collection/all',
  items: [
    {
      product_id: 'iw-1',
      title: 'Purple Suit',
      label: 'PURPLE SUIT',
      tagline: 'Regal hues, exquisite craft.',
      price: '₹14,990',
      category: 'designer-suits',
      image: '/products/Suit-Purple/1.JPG',
      custom_image: '',
      objectPosition: 'center 15%',
      crop: { zoom: 1, x: 0, y: 0 },
    },
    {
      product_id: 'iw-2',
      title: 'Pink Blush Lehenga',
      label: 'PINK BLUSH',
      tagline: 'Dream draped in blush.',
      price: '₹16,191',
      category: 'indo-western',
      image: '/products/Lehenga-Pink Blush/1.JPG',
      custom_image: '',
      objectPosition: 'center 12%',
      crop: { zoom: 1, x: 0, y: 0 },
    },
    {
      product_id: 'iw-3',
      title: 'Mustard Suit',
      label: 'MUSTARD',
      tagline: 'Bold hues, timeless grace.',
      price: '₹13,500',
      category: 'designer-suits',
      image: '/products/Suit -Mustard/1.JPG',
      custom_image: '',
      objectPosition: 'center top',
      crop: { zoom: 1, x: 0, y: 0 },
    },
    {
      product_id: 'iw-4',
      title: 'Pink Blush Drape Saree',
      label: 'DRAPE SAREE',
      tagline: 'Elegance effortlessly worn.',
      price: '₹18,500',
      category: 'drape-sarees',
      image: '/products/Drape Saree-Pink Blush Color/1.JPG',
      custom_image: '',
      objectPosition: 'center top',
      crop: { zoom: 1, x: 0, y: 0 },
    },
  ],
};

const CMS_STORAGE_KEY = 'miraya_cms_new_arrivals_v2';

// Interactive Crop & Reposition Editor
function CardCropEditor({ item, onChange }) {
  const crop = item.crop || { zoom: 1, x: 0, y: 0 };
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ startMouseX: 0, startMouseY: 0, startCropX: 0, startCropY: 0 });

  const activeImage = item.custom_image || item.image || '/products/Lehenga-Pink Blush/1.JPG';

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startCropX: crop.x || 0,
      startCropY: crop.y || 0,
    };
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const dx = (e.clientX - dragStartRef.current.startMouseX) * 0.4;
    const dy = (e.clientY - dragStartRef.current.startMouseY) * 0.4;
    
    // Invert dy for vertical shift feel (dragging down moves image down)
    const newX = Math.round(dragStartRef.current.startCropX + dx);
    const newY = Math.round(dragStartRef.current.startCropY - dy);

    onChange({
      ...crop,
      x: Math.max(-50, Math.min(50, newX)),
      y: Math.max(-50, Math.min(50, newY)),
    });
  }, [isDragging, crop, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="na-crop-editor">
      <div className="na-crop-viewport-wrap">
        <div 
          className={`na-crop-arch-viewport ${isDragging ? 'is-dragging' : ''}`}
          onMouseDown={handleMouseDown}
          title="Click and drag to reposition the image"
        >
          <img
            src={activeImage}
            alt="Crop target"
            className="na-crop-target-img"
            style={{
              transform: `scale(${crop.zoom || 1}) translate(${crop.x || 0}%, ${-(crop.y || 0)}%)`,
            }}
            draggable={false}
          />
          <div className="na-crop-arch-overlay">
            <div className="na-crop-drag-hint">
              <Move size={14} /> Drag to adjust position
            </div>
          </div>
        </div>
      </div>

      <div className="na-crop-controls">
        <div className="na-crop-row">
          <label><ZoomIn size={14} /> Zoom: {(crop.zoom || 1).toFixed(1)}x</label>
          <input
            type="range"
            min="1"
            max="2.5"
            step="0.05"
            value={crop.zoom || 1}
            onChange={(e) => onChange({ ...crop, zoom: parseFloat(e.target.value) })}
            className="admin-range"
          />
        </div>

        <div className="na-crop-row">
          <label><Move size={14} /> Vertical Shift (Y): {crop.y || 0}%</label>
          <input
            type="range"
            min="-40"
            max="40"
            step="1"
            value={crop.y || 0}
            onChange={(e) => onChange({ ...crop, y: parseInt(e.target.value, 10) })}
            className="admin-range"
          />
        </div>

        <div className="na-crop-actions">
          <button
            type="button"
            className="na-reset-crop-btn"
            onClick={() => onChange({ zoom: 1, x: 0, y: 0 })}
          >
            <RotateCcw size={12} /> Reset Crop
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminNewArrivalsSection({ products = [], categories = [], token, API_BASE_URL }) {
  const [data, setData] = useState(DEFAULT_CMS_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // { type: 'success' | 'error', text: '' }
  
  // Product Selector Modal state
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Active editing card index for cropping
  const [activeCropIndex, setActiveCropIndex] = useState(0);

  // Tab view: 'editor' | 'preview'
  const [activeView, setActiveView] = useState('editor');

  // Load existing configuration on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        // 1. Try fetching from Backend API
        if (API_BASE_URL) {
          const res = await fetch(`${API_BASE_URL}/api/homepage-sections/new-arrivals`).catch(() => null);
          if (res && res.ok) {
            const apiData = await res.json();
            if (isMounted && apiData && apiData.section_name) {
              const formattedItems = (apiData.newArrivalItems || []).map((item) => ({
                product_id: item.product_id,
                title: item.product?.name || item.tagline || 'Designer Piece',
                label: (item.product?.name || 'DESIGNER PIECE').toUpperCase(),
                tagline: item.tagline || item.product?.category?.name || 'Handcrafted Couture',
                price: item.product?.price ? `₹${Number(item.product.price).toLocaleString('en-IN')}` : '',
                category: item.product?.category?.slug || item.product?.category?.name || 'indo-western',
                image: item.product?.image_url || (item.product?.images && item.product?.images[0]) || '/products/Lehenga-Pink Blush/1.JPG',
                custom_image: item.custom_image || '',
                crop: typeof item.crop_position === 'string' ? JSON.parse(item.crop_position) : (item.crop_position || { zoom: 1, x: 0, y: 0 }),
              }));

              setData({
                is_active: apiData.is_active ?? true,
                heading: apiData.heading || DEFAULT_CMS_DATA.heading,
                description: apiData.description || DEFAULT_CMS_DATA.description,
                button_text: apiData.button_text || DEFAULT_CMS_DATA.button_text,
                button_link: apiData.button_link || DEFAULT_CMS_DATA.button_link,
                items: formattedItems.length ? formattedItems : DEFAULT_CMS_DATA.items,
              });
              setLoading(false);
              return;
            }
          }
        }
      } catch (e) {
        console.warn('API load failed, checking localStorage fallback:', e);
      }

      // 2. Fallback to localStorage cache
      try {
        const cached = localStorage.getItem(CMS_STORAGE_KEY);
        if (cached && isMounted) {
          setData(JSON.parse(cached));
        }
      } catch (_) {}
      
      if (isMounted) setLoading(false);
    }

    loadData();
    return () => { isMounted = false; };
  }, [API_BASE_URL]);

  // Save / Publish CMS Changes
  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      // 1. Sync immediately to localStorage for instant storefront reflection
      localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(data));

      // 2. Persist to Backend API if available
      if (API_BASE_URL) {
        const activeToken = token || localStorage.getItem('adminToken') || localStorage.getItem('token');
        const payload = {
          is_active: data.is_active,
          heading: data.heading,
          description: data.description,
          button_text: data.button_text,
          button_link: data.button_link,
          items: data.items.map((item, idx) => ({
            product_id: item.product_id,
            display_order: idx,
            custom_image: item.custom_image || null,
            crop_position: item.crop,
            tagline: item.tagline || null,
          })),
        };

        const res = await fetch(`${API_BASE_URL}/api/homepage-sections/new-arrivals`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
          },
          body: JSON.stringify(payload),
        }).catch(() => null);

        if (res && !res.ok) {
          console.warn('API responded with non-200, saved locally.');
        }
      }

      setSaveStatus({ type: 'success', text: 'New Arrivals published successfully!' });
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err) {
      console.error('Error saving CMS:', err);
      setSaveStatus({ type: 'error', text: 'Failed to publish changes.' });
    } finally {
      setSaving(false);
    }
  };

  // Reorder cards
  const moveCard = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= data.items.length) return;
    const newItems = [...data.items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIdx];
    newItems[targetIdx] = temp;
    setData({ ...data, items: newItems });
    setActiveCropIndex(targetIdx);
  };

  // Remove card
  const removeCard = (index) => {
    const newItems = data.items.filter((_, idx) => idx !== index);
    setData({ ...data, items: newItems });
    if (activeCropIndex >= newItems.length) {
      setActiveCropIndex(Math.max(0, newItems.length - 1));
    }
  };

  // Select a product from Catalog Modal
  const handleSelectProduct = (prod) => {
    if (data.items.length >= 4) {
      alert('Maximum 4 products allowed for New Arrivals.');
      return;
    }

    // Duplicate check
    const isAlreadySelected = data.items.some(
      (item) => String(item.product_id) === String(prod.id)
    );
    if (isAlreadySelected) {
      alert('This product is already added to New Arrivals.');
      return;
    }

    const primaryImage = prod.image_url || (prod.images && prod.images[0]) || prod.image || '/products/Lehenga-Pink Blush/1.JPG';
    const catName = prod.category?.name || prod.category?.slug || prod.category || 'indo-western';

    const newItem = {
      product_id: prod.id,
      title: prod.name || prod.title,
      label: (prod.name || prod.title || 'NEW ARRIVAL').toUpperCase(),
      tagline: prod.tagline || catName,
      price: prod.price ? (typeof prod.price === 'number' ? `₹${prod.price.toLocaleString('en-IN')}` : prod.price) : '',
      category: catName,
      image: primaryImage,
      custom_image: '',
      crop: { zoom: 1, x: 0, y: 0 },
    };

    setData({
      ...data,
      items: [...data.items, newItem],
    });
    setSelectorOpen(false);
    setActiveCropIndex(data.items.length);
  };

  // Handle custom image upload (as Data URL / file preview)
  const handleImageUpload = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const newItems = [...data.items];
      newItems[index] = {
        ...newItems[index],
        custom_image: e.target.result,
      };
      setData({ ...data, items: newItems });
    };
    reader.readAsDataURL(file);
  };

  // Filter products for Catalog Selector Modal
  const filteredProducts = products.filter((p) => {
    const nameMatch = (p.name || p.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const catMatch =
      selectedCategory === 'all' ||
      String(p.category_id) === String(selectedCategory) ||
      (p.category?.name || '').toLowerCase() === selectedCategory.toLowerCase() ||
      (p.category || '').toLowerCase() === selectedCategory.toLowerCase();
    return nameMatch && catMatch;
  });

  if (loading) {
    return (
      <div className="na-admin-loading">
        <div className="spin-loader" />
        <p>Loading New Arrivals CMS...</p>
      </div>
    );
  }

  return (
    <div className="na-admin-container">
      {/* ── TOP BREADCRUMB & HEADER ── */}
      <div className="na-admin-header">
        <div>
          <div className="na-admin-breadcrumb">
            <span>Admin Dashboard</span>
            <span className="sep">/</span>
            <span>Website Settings</span>
            <span className="sep">/</span>
            <span>Homepage Sections</span>
            <span className="sep">/</span>
            <strong>New Arrivals</strong>
          </div>
          <h2 className="na-admin-title">New Arrivals Management</h2>
          <p className="na-admin-subtitle">
            Curate and customize the luxury editorial New Arrivals collection displayed on the homepage.
          </p>
        </div>

        <div className="na-admin-header-actions">
          <div className="na-view-toggle">
            <button
              type="button"
              className={`na-tab-btn ${activeView === 'editor' ? 'active' : ''}`}
              onClick={() => setActiveView('editor')}
            >
              <Sliders size={14} /> Section Editor
            </button>
            <button
              type="button"
              className={`na-tab-btn ${activeView === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveView('preview')}
            >
              <Eye size={14} /> Live Preview
            </button>
          </div>

          <button
            type="button"
            className="na-publish-btn"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? 'Publishing...' : 'Publish Changes'}
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className={`na-alert-banner ${saveStatus.type}`}>
          {saveStatus.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{saveStatus.text}</span>
        </div>
      )}

      {/* ── MAIN CONTENT: EDITOR OR LIVE PREVIEW ── */}
      {activeView === 'editor' ? (
        <div className="na-admin-grid">
          
          {/* ═══ LEFT COLUMN: SECTION SETTINGS & PRODUCTS ═══ */}
          <div className="na-settings-col">
            
            {/* SECTION STATUS & GENERAL SETTINGS */}
            <div className="na-card-box">
              <div className="na-box-header">
                <h3>1. Section Status & Typography</h3>
                <label className="na-switch">
                  <input
                    type="checkbox"
                    checked={data.is_active}
                    onChange={(e) => setData({ ...data, is_active: e.target.checked })}
                  />
                  <span className="na-slider" />
                  <span className="na-switch-label">
                    {data.is_active ? 'Section Enabled' : 'Section Hidden'}
                  </span>
                </label>
              </div>

              <div className="na-form-group">
                <label>Section Heading (Supports line break with Enter)</label>
                <textarea
                  rows={2}
                  className="na-input"
                  value={data.heading}
                  onChange={(e) => setData({ ...data, heading: e.target.value })}
                  placeholder="e.g. Fresh Arrivals,&#10;Timeless Grace"
                />
              </div>

              <div className="na-form-group">
                <label>Section Subtitle / Description</label>
                <textarea
                  rows={2}
                  className="na-input"
                  value={data.description}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                  placeholder="Thoughtfully designed. Beautifully detailed..."
                />
              </div>

              <div className="na-form-row">
                <div className="na-form-group">
                  <label>CTA Button Text</label>
                  <input
                    type="text"
                    className="na-input"
                    value={data.button_text}
                    onChange={(e) => setData({ ...data, button_text: e.target.value })}
                    placeholder="DISCOVER NEW ARRIVALS"
                  />
                </div>
                <div className="na-form-group">
                  <label>CTA Button Link</label>
                  <input
                    type="text"
                    className="na-input"
                    value={data.button_link}
                    onChange={(e) => setData({ ...data, button_link: e.target.value })}
                    placeholder="/collection/all"
                  />
                </div>
              </div>
            </div>

            {/* PRODUCT CARD SELECTOR & REORDERING */}
            <div className="na-card-box">
              <div className="na-box-header">
                <div>
                  <h3>2. Card Management ({data.items.length}/4 Products)</h3>
                  <p className="na-box-hint">Arrange card sequence or swap images for each luxury arch.</p>
                </div>
                {data.items.length < 4 && (
                  <button
                    type="button"
                    className="na-add-prod-btn"
                    onClick={() => setSelectorOpen(true)}
                  >
                    <Plus size={15} /> Add Product
                  </button>
                )}
              </div>

              <div className="na-cards-list">
                {data.items.map((item, index) => {
                  const isSelected = activeCropIndex === index;
                  const displayImg = item.custom_image || item.image;

                  return (
                    <div
                      key={item.product_id || index}
                      className={`na-card-item ${isSelected ? 'active-card' : ''}`}
                      onClick={() => setActiveCropIndex(index)}
                    >
                      <div className="na-card-thumb">
                        <img src={displayImg} alt={item.title} />
                        <span className="na-card-order-badge">0{index + 1}</span>
                      </div>

                      <div className="na-card-details">
                        <div className="na-card-title-row">
                          <strong>{item.title}</strong>
                          <span className="na-card-price">{item.price}</span>
                        </div>
                        <span className="na-card-cat-badge">{item.category}</span>
                        
                        <div className="na-card-inputs">
                          <input
                            type="text"
                            className="na-card-mini-input"
                            value={item.label || ''}
                            onChange={(e) => {
                              const newItems = [...data.items];
                              newItems[index] = { ...newItems[index], label: e.target.value };
                              setData({ ...data, items: newItems });
                            }}
                            placeholder="Card Label (e.g. PURPLE SUIT)"
                          />
                          <input
                            type="text"
                            className="na-card-mini-input"
                            value={item.tagline || ''}
                            onChange={(e) => {
                              const newItems = [...data.items];
                              newItems[index] = { ...newItems[index], tagline: e.target.value };
                              setData({ ...data, items: newItems });
                            }}
                            placeholder="Tagline (e.g. Regal hues...)"
                          />
                        </div>

                        {/* Image upload or reset */}
                        <div className="na-card-image-tools">
                          <label className="na-file-upload-btn">
                            <Upload size={12} /> Custom Image
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handleImageUpload(index, e.target.files[0])}
                            />
                          </label>
                          {item.custom_image && (
                            <button
                              type="button"
                              className="na-reset-img-btn"
                              onClick={() => {
                                const newItems = [...data.items];
                                newItems[index] = { ...newItems[index], custom_image: '' };
                                setData({ ...data, items: newItems });
                              }}
                            >
                              Reset Image
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="na-card-actions">
                        <button
                          type="button"
                          className="na-action-icon-btn"
                          disabled={index === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveCard(index, -1);
                          }}
                          title="Move Left"
                        >
                          <ArrowLeft size={14} />
                        </button>
                        <button
                          type="button"
                          className="na-action-icon-btn"
                          disabled={index === data.items.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveCard(index, 1);
                          }}
                          title="Move Right"
                        >
                          <ArrowRight size={14} />
                        </button>
                        <button
                          type="button"
                          className="na-action-icon-btn danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCard(index);
                          }}
                          title="Remove from New Arrivals"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {data.items.length === 0 && (
                  <div className="na-empty-cards">
                    <ImageIcon size={32} />
                    <p>No products selected for New Arrivals yet.</p>
                    <button
                      type="button"
                      className="na-add-prod-btn"
                      onClick={() => setSelectorOpen(true)}
                    >
                      <Plus size={14} /> Select Products
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ═══ RIGHT COLUMN: LIVE IMAGE CROP SYSTEM ═══ */}
          <div className="na-crop-col">
            <div className="na-card-box sticky-box">
              <div className="na-box-header">
                <div>
                  <h3>3. Luxury Arch Image Cropper</h3>
                  <p className="na-box-hint">
                    Editing Card #{activeCropIndex + 1}: {data.items[activeCropIndex]?.title || 'None selected'}
                  </p>
                </div>
                <span className="na-ratio-tag">Arch Ratio 1 : 2.2</span>
              </div>

              {data.items[activeCropIndex] ? (
                <CardCropEditor
                  item={data.items[activeCropIndex]}
                  onChange={(newCrop) => {
                    const newItems = [...data.items];
                    newItems[activeCropIndex] = {
                      ...newItems[activeCropIndex],
                      crop: newCrop,
                    };
                    setData({ ...data, items: newItems });
                  }}
                />
              ) : (
                <div className="na-empty-crop">
                  <p>Select a card on the left to adjust its crop & alignment.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* ═══ LIVE EDITORIAL PREVIEW ═══ */
        <div className="na-live-preview-wrap">
          <div className="na-preview-notice">
            <Sparkles size={16} />
            <span>Exact Storefront Preview (Typography, luxury arch masks, and crop alignment).</span>
          </div>

          <section className="ed-na-section na-admin-embed-preview">
            <div className="ed-na-container">
              {/* LEFT EDITORIAL PANEL */}
              <div className="ed-na-left">
                <div className="ed-na-eyebrow">
                  <span className="ed-na-line" />
                  <span className="ed-na-eyebrow-text">NEW ARRIVALS</span>
                  <span className="ed-na-line" />
                </div>

                <h2 className="ed-na-heading" style={{ whiteSpace: 'pre-line' }}>
                  {data.heading}
                </h2>

                <p className="ed-na-desc" style={{ whiteSpace: 'pre-line' }}>
                  {data.description}
                </p>

                <div>
                  <span className="ed-na-cta">
                    {data.button_text} <span className="arrow">→</span>
                  </span>
                </div>

                <div className="ed-na-heritage">
                  <span className="ed-na-star">❖</span>
                  <span className="ed-na-heritage-text">
                    HERITAGE<br />IN EVERY<br />WEAVE
                  </span>
                </div>
              </div>

              {/* RIGHT CARDS SHOWCASE */}
              <div className="ed-na-right">
                {data.items.map((product, index) => {
                  const crop = product.crop || { zoom: 1, x: 0, y: 0 };
                  const imageSrc = product.custom_image || product.image;

                  return (
                    <div key={product.product_id || index} className="ed-na-card">
                      <div className="ed-na-arch-wrap">
                        <div className="ed-na-img-inner">
                          <img
                            src={imageSrc}
                            alt={product.title}
                            className="ed-na-image"
                            style={{
                              transform: `scale(${crop.zoom || 1}) translate(${crop.x || 0}%, ${-(crop.y || 0)}%)`,
                              objectPosition: 'center center',
                            }}
                          />
                        </div>
                        <div className="ed-na-arch-border">
                          <div className="ed-na-arch-ornament">❖</div>
                        </div>
                      </div>

                      <div className="ed-na-info">
                        <h3 className="ed-na-label">{product.label || product.title}</h3>
                        <p className="ed-na-tagline">{product.tagline}</p>
                        <span className="ed-na-shop-link">
                          SHOP NOW <span className="arrow">→</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ═══ PRODUCT SELECTOR MODAL ═══ */}
      {selectorOpen && (
        <div className="na-modal-backdrop" data-lenis-prevent="true" onClick={() => setSelectorOpen(false)}>
          <div className="na-modal-content" data-lenis-prevent="true" onClick={(e) => e.stopPropagation()}>
            <div className="na-modal-header">
              <div>
                <h3>Select Product from Catalog</h3>
                <p>Choose up to 4 products from your live database catalog.</p>
              </div>
              <button
                type="button"
                className="na-modal-close"
                onClick={() => setSelectorOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="na-modal-toolbar">
              <div className="na-search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search products by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="na-cat-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id || c.name} value={c.id || c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="na-prod-grid" data-lenis-prevent="true">
              {filteredProducts.map((prod) => {
                const isSelected = data.items.some(
                  (item) => String(item.product_id) === String(prod.id)
                );
                const thumb = prod.image_url || (prod.images && prod.images[0]) || prod.image || '/products/Lehenga-Pink Blush/1.JPG';

                return (
                  <div
                    key={prod.id}
                    className={`na-prod-card ${isSelected ? 'already-selected' : ''}`}
                    onClick={() => !isSelected && handleSelectProduct(prod)}
                  >
                    <div className="na-prod-img-wrap">
                      <img src={thumb} alt={prod.name || prod.title} />
                      {isSelected && (
                        <div className="na-selected-overlay">
                          <Check size={20} /> Added
                        </div>
                      )}
                    </div>
                    <div className="na-prod-card-body">
                      <strong>{prod.name || prod.title}</strong>
                      <div className="na-prod-meta">
                        <span className="na-prod-price">
                          {prod.price ? (typeof prod.price === 'number' ? `₹${prod.price.toLocaleString('en-IN')}` : prod.price) : ''}
                        </span>
                        <span className="na-prod-cat">
                          {prod.category?.name || prod.category || ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="na-no-prods">
                  <p>No products match the search query or category filter.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
