import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Save,
  Sparkles,
  ExternalLink,
  Layers,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Maximize2,
  Minimize2,
  ArrowRight,
  ArrowLeft,
  Settings,
  HelpCircle,
  RefreshCw,
  Plus
} from 'lucide-react';
import DynamicSectionRenderer from '../DynamicSectionRenderer';
import { DEFAULT_SECTION_ORDER } from '../../constants/defaultHomepageLayout';
import { useToast } from '../../context/ToastContext';
import './ThemeVisualCustomizer.css';

const STORAGE_KEY = 'miraya_homepage_layout_v1';

const SECTION_METADATA = {
  Hero: {
    name: "Hero Video & Atelier Banner",
    badge: "Cover Block",
    description: "Full-width background video reel with atelier typography & primary CTA button.",
    defaultProps: {
      tagline: "Tradition Tailored for Today",
      heading: "Haute Couture & Bridal Atelier",
      titleLine1: "The Art of",
      titleLine2: "Elegance",
      description: "Timeless ethnic wear, thoughtfully crafted for the modern wardrobe.",
      buttonText: "EXPLORE ATELIER",
      buttonLink: "/collection/all",
      videoUrl: "/0911_hero.mp4"
    },
    fields: [
      { key: "tagline", label: "Top Tagline", type: "text", placeholder: "e.g. MIRAYA BY GARIMA" },
      { key: "heading", label: "Main Heading", type: "text", placeholder: "e.g. Haute Couture & Bridal Atelier" },
      { key: "description", label: "Description Paragraph", type: "textarea", rows: 2 },
      { key: "buttonText", label: "Button Label", type: "text", placeholder: "e.g. EXPLORE ATELIER" },
      { key: "buttonLink", label: "Button Link URL", type: "text", placeholder: "e.g. /collection/all" },
      { key: "videoUrl", label: "Video Reel URL", type: "text", placeholder: "/0911_hero.mp4" }
    ]
  },
  NewArrivals: {
    name: "Fresh Arrivals Showcase",
    badge: "Product Grid",
    description: "Curated high-fashion garments grid with editorial typography & staggered reveal.",
    defaultProps: {
      heading: "Fresh Arrivals,\nTimeless Grace",
      description: "Thoughtfully designed. Beautifully detailed.\nA celebration of you, in every thread.",
      buttonText: "DISCOVER NEW ARRIVALS",
      buttonLink: "/collection/all"
    },
    fields: [
      { key: "heading", label: "Section Heading", type: "textarea", rows: 2 },
      { key: "description", label: "Editorial Blurb", type: "textarea", rows: 2 },
      { key: "buttonText", label: "CTA Button Text", type: "text" },
      { key: "buttonLink", label: "CTA Destination Route", type: "text" }
    ]
  },
  PremiumSlider: {
    name: "Editorial Reel & Collection Slider",
    badge: "Interactive Reel",
    description: "Full-height couture carousel showcasing signature lehengas, sarees, and artisan details.",
    defaultProps: {
      heading: "The Atelier Showcase",
      badge: "COUTURE 2026"
    },
    fields: [
      { key: "heading", label: "Slider Title", type: "text" },
      { key: "badge", label: "Collection Tag / Badge", type: "text" }
    ]
  },
  OurStory: {
    name: "Atelier Story & Legacy",
    badge: "Brand Story",
    description: "The craftsmanship journey, live artisan counters, and heritage narrative.",
    defaultProps: {
      title: "The Miraya Legacy",
      tagline: "OUR ESSENCE",
      description: "Where Indian heritage meets contemporary elegance. Miraya brings together timeless craftsmanship, luxurious fabrics, and modern silhouettes.",
      buttonText: "DISCOVER OUR STORY →",
      buttonLink: "/about",
      imageUrl: "/products/Lehenga-Pink Blush/1.JPG"
    },
    fields: [
      { key: "tagline", label: "Sub-heading Tagline", type: "text" },
      { key: "title", label: "Main Story Title", type: "text" },
      { key: "description", label: "Narrative Content", type: "textarea", rows: 3 },
      { key: "buttonText", label: "Link Text", type: "text" },
      { key: "buttonLink", label: "Link Route", type: "text" },
      { key: "imageUrl", label: "Featured Image URL", type: "text" }
    ]
  },
  Collections: {
    name: "Shop by Occasion & Silhouettes",
    badge: "Curated Accordion",
    description: "Interactive horizontal/vertical accordion highlighting Indo-Western, Drape Sarees, Suits.",
    defaultProps: {
      title: "Our Collections",
      subtitle: "Discover a world where heritage meets modernity. Each collection is a testament to meticulous craftsmanship.",
      tagline: "CURATED MASTERPIECES"
    },
    fields: [
      { key: "tagline", label: "Category Eyebrow", type: "text" },
      { key: "title", label: "Collections Heading", type: "text" },
      { key: "subtitle", label: "Subtitle Description", type: "textarea", rows: 2 }
    ]
  },
  RealBrides: {
    name: "Real Brides of Miraya",
    badge: "Testimonials",
    description: "Regal portrait showcase of real brides and heartfelt client diaries.",
    defaultProps: {
      title: "Real Queens",
      subtitle: "Real stories. Real style. Loved and worn by the Miraya community.",
      tagline: "CLIENT DIARIES"
    },
    fields: [
      { key: "tagline", label: "Eyebrow Label", type: "text" },
      { key: "title", label: "Gallery Heading", type: "text" },
      { key: "subtitle", label: "Community Blurb", type: "textarea", rows: 2 }
    ]
  },
  CorePillars: {
    name: "Couture Standards & Craft Pillars",
    badge: "Philosophy",
    description: "High-level craftsmanship pillars: Refined tailoring, authentic handlooms, heirloom longevity.",
    defaultProps: {
      title: "THE CORE PILLARS OF MIRAYA",
      tagline: "OUR PHILOSOPHY",
      subtitle: "Rooted in tradition. Designed for today. Created to inspire for generations."
    },
    fields: [
      { key: "tagline", label: "Philosophy Tag", type: "text" },
      { key: "title", label: "Section Title", type: "text" },
      { key: "subtitle", label: "Philosophy Subtitle", type: "textarea", rows: 2 }
    ]
  },
  Lookbook: {
    name: "Editorial Lookbook & Styling",
    badge: "Lookbook",
    description: "Magazine editorial layout highlighting signature festive and bridal edits.",
    defaultProps: {
      title: "Stories in Style",
      tagline: "THE MIRAYA EDIT"
    },
    fields: [
      { key: "tagline", label: "Edit Tag", type: "text" },
      { key: "title", label: "Lookbook Title", type: "text" }
    ]
  },
  FinalCTA: {
    name: "Consultation & Atelier Visit CTA",
    badge: "Conversion",
    description: "Nagpur flagship invitation, bridal appointments, and boutique concierge.",
    defaultProps: {
      heading: "YOUR NEXT SIGNATURE LOOK AWAITS",
      subtitle: "Discover timeless pieces crafted to become part of your story.",
      buttonText: "EXPLORE COLLECTION",
      buttonLink: "/collection/all"
    },
    fields: [
      { key: "heading", label: "CTA Banner Headline", type: "text" },
      { key: "subtitle", label: "Sub-headline Description", type: "textarea", rows: 2 },
      { key: "buttonText", label: "Button Label", type: "text" },
      { key: "buttonLink", label: "Button Route URL", type: "text" }
    ]
  }
};

export default function ThemeVisualCustomizer({
  token,
  API_BASE_URL,
  onOpenProductCurator,
  onBack
}) {
  const { toast } = useToast();
  const [sections, setSections] = useState(DEFAULT_SECTION_ORDER);
  const [initialSections, setInitialSections] = useState(DEFAULT_SECTION_ORDER);
  const [expandedSectionId, setExpandedSectionId] = useState(null);
  const [viewportMode, setViewportMode] = useState('desktop'); // desktop | tablet | mobile
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const previewScrollRef = useRef(null);

  // Load layout from server or cache
  useEffect(() => {
    let isMounted = true;
    const fetchLayout = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/homepage-sections/layout`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          if (isMounted && data && Array.isArray(data.layout) && data.layout.length > 0) {
            setSections(data.layout);
            setInitialSections(JSON.parse(JSON.stringify(data.layout)));
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.layout));
            } catch (_) {}
          }
        } else {
          // Fallback to local storage if available
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (isMounted && Array.isArray(parsed) && parsed.length > 0) {
              setSections(parsed);
              setInitialSections(JSON.parse(JSON.stringify(parsed)));
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch remote layout, using defaults', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLayout();
    return () => { isMounted = false; };
  }, [API_BASE_URL]);

  // Check if dirty (unsaved changes)
  const isDirty = useMemo(() => {
    return JSON.stringify(sections) !== JSON.stringify(initialSections);
  }, [sections, initialSections]);

  // Move section UP
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updated = [...sections];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setSections(updated);
  };

  // Move section DOWN
  const handleMoveDown = (index) => {
    if (index === sections.length - 1) return;
    const updated = [...sections];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setSections(updated);
  };

  // Toggle Visibility (Eye icon)
  const handleToggleVisibility = (sectionId, e) => {
    e.stopPropagation();
    const updated = sections.map((sec) => {
      if (sec.id === sectionId) {
        const nextState = sec.is_active === false ? true : false;
        return { ...sec, is_active: nextState };
      }
      return sec;
    });
    setSections(updated);
  };

  // Update a single prop of a section
  const handlePropChange = (sectionId, key, value) => {
    const updated = sections.map((sec) => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          props: {
            ...(sec.props || {}),
            [key]: value
          }
        };
      }
      return sec;
    });
    setSections(updated);
  };

  // Reset to original luxury defaults
  const handleResetToDefault = async () => {
    if (!window.confirm("Are you sure you want to reset the homepage to default atelier layout? Any custom ordering will be restored.")) {
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/homepage-sections/layout/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        const resetLayout = data.layout || DEFAULT_SECTION_ORDER;
        setSections(resetLayout);
        setInitialSections(JSON.parse(JSON.stringify(resetLayout)));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(resetLayout));
        toast?.success?.("Homepage layout successfully restored to atelier default!");
      } else {
        // Fallback local reset
        setSections(DEFAULT_SECTION_ORDER);
        setInitialSections(JSON.parse(JSON.stringify(DEFAULT_SECTION_ORDER)));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SECTION_ORDER));
        toast?.info?.("Restored local default layout");
      }
    } catch (err) {
      toast?.error?.("Failed to reset layout");
    } finally {
      setIsSaving(false);
    }
  };

  // Save & Publish to PostgreSQL and live storefront
  const handleSaveAndPublish = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/homepage-sections/layout`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ layout: sections })
      }).catch(() => null);

      if (res && res.ok) {
        setInitialSections(JSON.parse(JSON.stringify(sections)));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
        toast?.success?.("✨ Homepage layout published live! Storefront updated immediately.");
      } else {
        // High-availability local save fallback
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
        setInitialSections(JSON.parse(JSON.stringify(sections)));
        toast?.success?.("Saved to local browser cache (live on this device)");
      }
    } catch (err) {
      console.error(err);
      toast?.error?.("Could not publish layout to server. Saved locally.");
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered sections for search in left panel
  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return sections;
    const q = searchTerm.toLowerCase();
    return sections.filter((sec) => {
      const meta = SECTION_METADATA[sec.type] || {};
      return (
        sec.type.toLowerCase().includes(q) ||
        (sec.label && sec.label.toLowerCase().includes(q)) ||
        (meta.name && meta.name.toLowerCase().includes(q))
      );
    });
  }, [sections, searchTerm]);

  return (
    <div className={`theme-customizer-root ${isFullScreen ? 'is-fullscreen' : ''}`} data-lenis-prevent="true">
      {/* 1. STUDIO MASTER TOPBAR */}
      <header className="theme-customizer-topbar">
        <div className="topbar-left">
          {onBack && (
            <button
              type="button"
              className="studio-back-btn"
              onClick={onBack}
              title="Exit Studio & Return to Admin Dashboard"
            >
              <ArrowLeft size={16} />
              <span>Exit Studio</span>
            </button>
          )}
          <div className="studio-brand">
            <div className="studio-icon-badge">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="studio-title-row">
                <h1 className="studio-title">Storefront Visual Theme Customizer</h1>
                <span className="studio-version-tag">Level 3 Visual Engine</span>
              </div>
              <p className="studio-subtitle">
                Reorder blocks, customize copy & media, and control live storefront layout in real time.
              </p>
            </div>
          </div>
        </div>

        {/* Responsive Viewport Switcher */}
        <div className="topbar-center">
          <div className="viewport-switcher" role="group" aria-label="Device Preview Switcher">
            <button
              type="button"
              className={`viewport-btn ${viewportMode === 'desktop' ? 'active' : ''}`}
              onClick={() => setViewportMode('desktop')}
              title="Desktop View (100% Canvas)"
            >
              <Monitor size={17} />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              className={`viewport-btn ${viewportMode === 'tablet' ? 'active' : ''}`}
              onClick={() => setViewportMode('tablet')}
              title="Tablet View (768px Bezel)"
            >
              <Tablet size={17} />
              <span>Tablet (768px)</span>
            </button>
            <button
              type="button"
              className={`viewport-btn ${viewportMode === 'mobile' ? 'active' : ''}`}
              onClick={() => setViewportMode('mobile')}
              title="Mobile Device (390px iPhone Frame)"
            >
              <Smartphone size={17} />
              <span>Mobile (390px)</span>
            </button>
          </div>
        </div>

        {/* Actions & Status */}
        <div className="topbar-right">
          {/* Status Indicator */}
          <div className={`status-pill ${isDirty ? 'has-draft' : 'is-published'}`}>
            {isDirty ? (
              <>
                <span className="pulse-dot warning"></span>
                <span>Unsaved Changes</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} color="#16a34a" />
                <span>Live & Published</span>
              </>
            )}
          </div>

          {/* Reset */}
          <button
            type="button"
            className="theme-btn-subtle"
            onClick={handleResetToDefault}
            disabled={isSaving}
            title="Reset to default couture layout"
          >
            <RotateCcw size={15} />
            <span>Reset Layout</span>
          </button>

          {/* Save & Publish */}
          <button
            type="button"
            className="theme-btn-primary"
            onClick={handleSaveAndPublish}
            disabled={isSaving || !isDirty}
          >
            {isSaving ? (
              <>
                <RefreshCw size={16} className="spin-icon" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save & Publish</span>
              </>
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            className="icon-only-btn"
            onClick={() => setIsFullScreen((prev) => !prev)}
            title={isFullScreen ? "Exit Fullscreen Studio" : "Expand Studio Fullscreen"}
          >
            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          {/* Live Storefront Link */}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="icon-only-btn"
            title="Open Live Boutique Storefront"
          >
            <ExternalLink size={18} />
          </a>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE (SPLIT SCREEN) */}
      <div className="theme-customizer-workspace">
        
        {/* LEFT CONTROLLER PANEL */}
        <aside className="customizer-left-panel">
          <div className="panel-header">
            <div className="panel-header-top">
              <div className="panel-title-wrap">
                <Layers size={18} color="#5e0a0b" />
                <h2>Homepage Sections ({sections.length})</h2>
              </div>
              <span className="active-count-badge">
                {sections.filter(s => s.is_active !== false).length} Active
              </span>
            </div>
            <p className="panel-help-text">
              Use ▲ / ▼ to reorder. Click 👁️ to toggle visibility. Click any block to edit copy and media.
            </p>

            {/* Curate Products Quick Button */}
            {onOpenProductCurator && (
              <button
                type="button"
                className="curator-link-pill"
                onClick={onOpenProductCurator}
              >
                <span>📦 Deep Curate New Arrivals Catalog</span>
                <ArrowRight size={14} />
              </button>
            )}

            {/* Quick Search */}
            <div className="section-search-wrap">
              <input
                type="text"
                placeholder="Search sections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="section-search-input"
              />
            </div>
          </div>

          {/* Sections List */}
          <div className="sections-list-scrollable" data-lenis-prevent="true">
            {filteredSections.map((sec, idx) => {
              const actualIndex = sections.findIndex(s => s.id === sec.id);
              const meta = SECTION_METADATA[sec.type] || {
                name: sec.label || sec.type,
                badge: "Block",
                description: "",
                fields: []
              };
              const isExpanded = expandedSectionId === sec.id;
              const isActive = sec.is_active !== false;

              return (
                <div
                  key={sec.id || idx}
                  className={`section-block-card ${isExpanded ? 'expanded' : ''} ${!isActive ? 'is-disabled' : ''}`}
                >
                  {/* Card Main Bar */}
                  <div
                    className="section-card-bar"
                    onClick={() => setExpandedSectionId(isExpanded ? null : sec.id)}
                  >
                    {/* Reorder Buttons */}
                    <div className="reorder-handle" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="reorder-btn"
                        onClick={() => handleMoveUp(actualIndex)}
                        disabled={actualIndex === 0}
                        title="Move Up"
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button
                        type="button"
                        className="reorder-btn"
                        onClick={() => handleMoveDown(actualIndex)}
                        disabled={actualIndex === sections.length - 1}
                        title="Move Down"
                      >
                        <ChevronDown size={15} />
                      </button>
                    </div>

                    {/* Order Index */}
                    <div className="section-index-badge">{actualIndex + 1}</div>

                    {/* Info */}
                    <div className="section-info">
                      <div className="section-name-row">
                        <strong className="section-name">{meta.name}</strong>
                        <span className="section-type-badge">{meta.badge}</span>
                      </div>
                      <span className="section-identifier"><code>&lt;{sec.type} /&gt;</code></span>
                    </div>

                    {/* Visibility Toggle Eye */}
                    <button
                      type="button"
                      className={`visibility-toggle-btn ${isActive ? 'active' : 'hidden-state'}`}
                      onClick={(e) => handleToggleVisibility(sec.id, e)}
                      title={isActive ? "Visible on Storefront (Click to Hide)" : "Hidden from Storefront (Click to Show)"}
                    >
                      {isActive ? <Eye size={17} /> : <EyeOff size={17} />}
                    </button>

                    {/* Expand indicator */}
                    <div className="expand-indicator">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {/* Accordion Form: Section Content Editor */}
                  {isExpanded && (
                    <div className="section-editor-body" onClick={(e) => e.stopPropagation()}>
                      <div className="editor-info-banner">
                        <p>{meta.description}</p>
                      </div>

                      <div className="editor-fields-grid">
                        {meta.fields && meta.fields.map((field) => {
                          const currentVal = (sec.props && sec.props[field.key] !== undefined)
                            ? sec.props[field.key]
                            : (meta.defaultProps?.[field.key] || "");

                          return (
                            <div key={field.key} className="form-field-group">
                              <label className="form-field-label">
                                {field.label}
                              </label>

                              {field.type === 'textarea' ? (
                                <textarea
                                  rows={field.rows || 3}
                                  value={currentVal}
                                  placeholder={field.placeholder || ""}
                                  onChange={(e) => handlePropChange(sec.id, field.key, e.target.value)}
                                  className="form-textarea"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={currentVal}
                                  placeholder={field.placeholder || ""}
                                  onChange={(e) => handlePropChange(sec.id, field.key, e.target.value)}
                                  className="form-input"
                                />
                              )}
                            </div>
                          );
                        })}

                        {(!meta.fields || meta.fields.length === 0) && (
                          <div className="no-fields-note">
                            This section is styled with luxury boutique presets. Reorder or toggle visibility above.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* RIGHT LIVE PREVIEW VIEWPORT */}
        <main className="customizer-right-viewport">
          <div className="viewport-stage-header">
            <div className="stage-info">
              <span className="live-pulse-indicator"></span>
              <strong>Live Interactive Storefront Preview</strong>
              <span className="viewport-dim-tag">
                {viewportMode === 'desktop' && 'Full Desktop Canvas (100%)'}
                {viewportMode === 'tablet' && 'Apple iPad Pro / Tablet Frame (768px)'}
                {viewportMode === 'mobile' && 'iPhone 15 Pro / Mobile Viewport (390px)'}
              </span>
            </div>
            <div className="stage-hint">
              Typing or reordering on the left updates this preview in real time.
            </div>
          </div>

          <div className="viewport-stage-body" data-lenis-prevent="true">
            <div className={`preview-canvas-wrapper mode-${viewportMode}`}>
              {/* Responsive Device Frame Shell */}
              <div className="preview-frame-container" ref={previewScrollRef} data-lenis-prevent="true">
                {/* Mobile/Tablet Speaker Bar on top */}
                {viewportMode !== 'desktop' && (
                  <div className="device-notch-bar">
                    <span className="device-camera-dot"></span>
                    <span className="device-speaker-pill"></span>
                  </div>
                )}

                {/* LIVE DYNAMIC HOMEPAGE CONTENT */}
                <div className="preview-storefront-content">
                  <DynamicSectionRenderer sections={sections} />
                </div>
              </div>
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}
