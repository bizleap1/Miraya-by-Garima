'use client';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { useEffect, useLayoutEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLenis } from 'lenis/react';
import { Heart, ChevronDown, ChevronUp, LayoutGrid, List, RefreshCw, ShoppingBag, Sparkles, Gem, Shirt, ArrowRight, Layers, X, Check, Trash2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import CheckoutModal from '../components/CheckoutModal';
import WhatsAppOrderModal from '../components/WhatsAppOrderModal';
import { useStoreSettings } from '../context/StoreSettingsContext';
import SEO from '../components/SEO';
import API_URL from '../config';
import { getProductImage } from '../utils/imageHelper';
import { productsData, getAllProducts, getProductById } from '../data/products';
import './CategoryPage.css';

const Ornament = () => (
  <div className="ornament-container">
    <div className="line"></div>
    <div className="diamond">
       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="ornament-icon"><path d="M12 2L15 12L12 22L9 12Z"/></svg>
    </div>
    <div className="line"></div>
  </div>
);

const CornerOrnament = ({ className }) => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className={className}>
    <path d="M0 0 H40 V4 H4 V40 H0 Z" fill="#C6A46A" fillOpacity="0.4" />
    <path d="M6 6 H34 V8 H8 V34 H6 Z" fill="#C6A46A" fillOpacity="0.2" />
  </svg>
);

const formatPrice = (price) => {
  if (price === undefined || price === null || price === '') return '';
  const str = String(price).trim();
  if (str.toLowerCase().includes('whatsapp') || str.toLowerCase().includes('dm') || str.toLowerCase().includes('request')) {
    return str;
  }
  if (str.startsWith('₹')) return str;
  const num = typeof price === 'number' ? price : parseInt(str.replace(/[^\d]/g, ''), 10);
  if (isNaN(num)) return str;
  return `₹${num.toLocaleString('en-IN')}`;
};

const CategoryPage = () => {
  const { category } = useParams();
  const location = useLocation();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { cartItems, addToCart, removeFromCart } = useCart();
  const lenis = useLenis();
  
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState(location.state?.filters || []);
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(true);
  const [hoveredCartCardId, setHoveredCartCardId] = useState(null);
  
  const displayTitle = category === 'all'
    ? 'All Collections'
    : category === 'dresses' ? 'Haute Couture Dresses'
    : category === 'coord-sets' ? 'Co-ord Sets' 
    : category === 'indo-western' ? 'Indo Western'
    : category === 'drape-sarees' ? 'Drape Sarees'
    : category === 'designer-suits' ? 'Designer Suits'
    : category === 'premium-suit-materials' ? 'Premium Suit Materials'
    : category === 'lehenga' ? 'Bespoke Lehengas'
    : category === 'festive-edit' ? 'Festive Edit'
    : category === 'prime' ? 'Prime Collection'
    : category === 'classic' ? 'Classic Collection'
    : category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');

  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toastMessage, setToastMessage] = useState(null);
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('grid');
  const [expandedCartCardId, setExpandedCartCardId] = useState(null);
  const [selectedBuySize, setSelectedBuySize] = useState('Free Size (M to XL)');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutDirectItem, setCheckoutDirectItem] = useState(null);
  const [whatsAppModalItem, setWhatsAppModalItem] = useState(null);
  const { store_online, new_orders_enabled } = useStoreSettings();

  const isStoreOffline = !store_online || !new_orders_enabled;

  const handleToggleCartItem = (item) => {
    const inCart = cartItems.some(ci => String(ci.id) === String(item.id) || ci.productId === item.id);
    if (inCart) {
      const chosenSize = item.sizes && item.sizes.length > 0 ? item.sizes[0] : 'Free Size (M to XL)';
      removeFromCart(item.id, chosenSize);
      showToast(`Removed from cart`);
      return;
    }

    // For items with Free Size, don't ask for size, add directly
    if (item.category === 'drape-sarees' || item.category === 'premium-suit-materials' || (item.sizes && item.sizes.length === 1 && item.sizes[0] === 'Free Size')) {
      addToCart(item, 'Free Size', 1);
      showToast(`Added to cart!`);
      return;
    }

    // Expand card for size selection
    if (expandedCartCardId === item.id) {
      setExpandedCartCardId(null);
    } else {
      setExpandedCartCardId(item.id);
    }
  };

  const handleBuyNowClick = (product) => {
    const prodCat = product.category || category || 'indo-western';
    navigate(`/product/${prodCat}/${product.id}`, {
      state: { product, from: `/collection/${category}`, filters: selectedCategories }
    });
  };

  const handleModalAddToCart = () => {
    if (!sizeModalProduct) return;
    addToCart(sizeModalProduct, selectedBuySize || 'M', 1);
    showToast(`Added ${selectedBuySize || 'M'} to cart!`);
    setSizeModalProduct(null);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [dbCategories, setDbCategories] = useState([]);

  const normalizeCat = (catName) => {
    if (!catName) return 'indo-western';
    const slug = String(catName).toLowerCase().replace(/\s+/g, '-');
    if (slug === 'co-ord-sets' || slug === 'coord' || slug === 'co-ord') return 'coord-sets';
    return slug;
  };

  useEffect(() => {
    const fetchDynamicCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/api/categories`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setDbCategories(data);
        }
      } catch (_) {}
    };
    fetchDynamicCategories();
  }, []);

  const availableCategories = useMemo(() => {
    const defaults = ['indo-western', 'drape-sarees', 'designer-suits', 'premium-suit-materials', 'coord-sets'];
    const dbSlugs = dbCategories.map(c => normalizeCat(c.name));
    const sampleSlugs = samples.map(s => normalizeCat(s.category?.name || s.category));
    return Array.from(new Set([...defaults, ...dbSlugs, ...sampleSlugs])).filter(Boolean);
  }, [dbCategories, samples]);

  const scrollToProductsTop = () => {
    if (typeof window === 'undefined') return;
    const target = document.querySelector('.sort-bar-top') || document.querySelector('.category-layout');
    const targetY = target
      ? Math.max(0, target.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop) - 95)
      : 0;

    if (lenis && typeof lenis.scrollTo === 'function') {
      lenis.scrollTo(targetY, { duration: 0.8 });
    } else if (typeof window !== 'undefined' && window.lenis && typeof window.lenis.scrollTo === 'function') {
      window.lenis.scrollTo(targetY, { duration: 0.8 });
    } else {
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  };

  const handleProductCardClick = () => {
    if (lenis && typeof lenis.scrollTo === 'function') {
      lenis.scrollTo(0, { immediate: true });
    } else if (typeof window !== 'undefined' && window.lenis && typeof window.lenis.scrollTo === 'function') {
      window.lenis.scrollTo(0, { immediate: true });
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  };

  const handleCheckboxChange = (setState, value) => {
    setState(prev => 
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
    );
    scrollToProductsTop();
  };


  const filteredAndSortedProducts = useMemo(() => {
    let result = [...samples];
    
    const getNumericPrice = (item) => {
      if (typeof item.rawPrice === 'number' && !isNaN(item.rawPrice)) return item.rawPrice;
      if (typeof item.price === 'number' && !isNaN(item.price)) return item.price;
      const cleanStr = String(item.price || '0').replace(/[^\d]/g, '');
      return parseInt(cleanStr, 10) || 0;
    };
    
    // 1. Apply base collection logic (price filtering for prime/classic)
    if (category === 'prime') {
      result = result.filter(item => getNumericPrice(item) >= 6000);
    } else if (category === 'classic') {
      result = result.filter(item => getNumericPrice(item) > 0 && getNumericPrice(item) < 6000);
    }

    // 2. Apply category filters from sidebar (if user selected any)
    if (['all', 'prime', 'classic'].includes(category) && selectedCategories.length > 0) {
      result = result.filter(item => {
        const itemCat = normalizeCat(item.category);
        return selectedCategories.some(sc => normalizeCat(sc) === itemCat);
      });
    }

    if (sortBy === 'price-low') {
      result.sort((a, b) => getNumericPrice(a) - getNumericPrice(b));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => getNumericPrice(b) - getNumericPrice(a));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0));
    }

    return result;
  }, [samples, category, selectedCategories, sortBy]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const fetchUrl = (category === 'prime' || category === 'classic' || category === 'all') 
          ? `${API_URL}/api/products` 
          : `${API_URL}/api/products?category=${category}`;
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        const mappedData = data.map(item => {
          const rawPrice = item.price;
          const numPrice = typeof rawPrice === 'number' ? rawPrice : parseInt(String(rawPrice || '0').replace(/[^\d]/g, ''), 10);
          
          // Distribute into the 6 specific categories based on title
          let catSlug = normalizeCat(item.category?.name || item.category);
          const titleLower = String(item.name || item.title || '').toLowerCase();
          
          if (titleLower.includes('suit material') || titleLower.includes('unstitched')) {
            catSlug = 'premium-suit-materials';
          } else if (titleLower.includes('suit') || titleLower.includes('kurta') || titleLower.includes('kurti') || titleLower.includes('anarkali')) {
            catSlug = 'designer-suits';
          } else if (titleLower.includes('co-ord') || titleLower.includes('coord') || titleLower.includes('set')) {
            catSlug = 'coord-sets';
          } else if (titleLower.includes('saree') || titleLower.includes('drape') || titleLower.includes('sari')) {
            catSlug = 'drape-sarees';
          } else if (titleLower.includes('dress') || titleLower.includes('gown') || titleLower.includes('midi')) {
            catSlug = 'dresses';
          } else if (titleLower.includes('lehenga') || titleLower.includes('jacket') || titleLower.includes('vest') || titleLower.includes('western') || titleLower.includes('indo')) {
            catSlug = 'indo-western';
          } else if (!catSlug || catSlug === 'undefined' || catSlug === 'null') {
            catSlug = 'indo-western';
          }

          // Match with local product details for rich metadata fallback
          const allLocal = getAllProducts();
          let localMatch = allLocal.find(p => 
            String(p.id).toLowerCase() === String(item.id).toLowerCase() || 
            (p.title && item.name && p.title.toLowerCase().trim() === item.name.toLowerCase().trim())
          );

          // Handle Haute Couture Dress 1-16 matching to rich local catalog
          if (!localMatch && item.name) {
            const dressMatch = String(item.name).match(/Haute Couture Dress\s*(\d+)/i);
            if (dressMatch && dressMatch[1]) {
              const dressIndex = parseInt(dressMatch[1], 10) - 1;
              if (productsData['dresses'] && productsData['dresses'][dressIndex]) {
                localMatch = productsData['dresses'][dressIndex];
              }
            }
          }
          if (!localMatch && (catSlug === 'dresses' || item.category_id === 6) && typeof item.id === 'number' && item.id >= 26 && item.id <= 41) {
            const dressIndex = item.id - 26;
            if (productsData['dresses'] && productsData['dresses'][dressIndex]) {
              localMatch = productsData['dresses'][dressIndex];
            }
          }
          localMatch = localMatch || {};

          let sizesList = [];
          if (Array.isArray(item.sizes) && item.sizes.length > 0) {
            sizesList = item.sizes;
          } else if (Array.isArray(localMatch.sizes) && localMatch.sizes.length > 0) {
            sizesList = localMatch.sizes;
          } else if (catSlug === 'drape-sarees' || catSlug === 'premium-suit-materials') {
            sizesList = ['Free Size'];
          } else {
            sizesList = ['S', 'M', 'L', 'XL'];
          }

          const rawImg = item.image_url || (Array.isArray(item.images) && item.images[0]) || localMatch.image || item.image;
          const resolvedMainImg = getProductImage(rawImg);
          const rawImgs = (Array.isArray(item.images) && item.images.length > 0)
            ? item.images
            : (localMatch.images?.length ? localMatch.images : [rawImg]);
          const resolvedImgs = rawImgs.map(img => getProductImage(img));

          return {
            ...localMatch,
            ...item,
            id: item.id,
            title: localMatch.title || item.name || item.title,
            category: catSlug,
            price: `₹${numPrice.toLocaleString('en-IN')}`,
            rawPrice: numPrice,
            fabric: item.fabric || localMatch.fabric || 'Crush Fabrics',
            color: item.color || localMatch.color || (item.name ? item.name.split(' ')[0] : 'Grey'),
            wash_care: item.wash_care || localMatch.wash_care || 'Professional Dry Clean Only. Do not flat iron on embellishments',
            craftsmanship: item.craftsmanship || localMatch.craftsmanship || 'Handcrafted Details & Designer Tailoring',
            sizes: sizesList,
            image: resolvedMainImg,
            images: resolvedImgs
          };
        });
        
        setSamples(mappedData);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();

    const onFocus = () => fetchProducts();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    if (!location.state?.filters) {
      setSelectedCategories([]);
    }

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [category, location.state]);

  const isInitialMount = useRef(true);
  const prevCategoryRef = useRef(category);

  useLayoutEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        if (lenis && typeof lenis.scrollTo === 'function') {
          lenis.scrollTo(element, { offset: -95, duration: 0.8 });
        } else {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
    }

    // If user returned via back navigation, restore their previous scroll position
    let savedY = 0;
    try {
      savedY = Number(sessionStorage.getItem('miraya_scroll_' + window.location.pathname) || 0);
    } catch (_) {}

    if (savedY > 0 && isInitialMount.current) {
      isInitialMount.current = false;
      prevCategoryRef.current = category;
      if (lenis && typeof lenis.scrollTo === 'function') {
        lenis.scrollTo(savedY, { immediate: true });
      } else if (typeof window !== 'undefined' && window.lenis) {
        window.lenis.scrollTo(savedY, { immediate: true });
      }
      window.scrollTo({ top: savedY, behavior: 'instant' });
      document.documentElement.scrollTop = savedY;
      document.body.scrollTop = savedY;
      return;
    }

    // Only scroll to top on initial page mount or when the category parameter changes!
    if (isInitialMount.current || (prevCategoryRef.current && prevCategoryRef.current !== category)) {
      isInitialMount.current = false;
      prevCategoryRef.current = category;
      if (lenis && typeof lenis.scrollTo === 'function') {
        lenis.scrollTo(0, { immediate: true });
      } else if (typeof window !== 'undefined' && window.lenis && typeof window.lenis.scrollTo === 'function') {
        window.lenis.scrollTo(0, { immediate: true });
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [category, location.hash, lenis]);

  // When products are fetched and rendered, if URL had a hash, scroll to that card
  useEffect(() => {
    if (location.hash && samples.length > 0) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        if (lenis && typeof lenis.scrollTo === 'function') {
          lenis.scrollTo(element, { offset: -95, duration: 0.8 });
        } else {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [samples, location.hash, lenis]);

  const handleWishlistToggle = (item, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isCurrentlyWishlisted = isInWishlist(item.id);
    toggleWishlist(item);
    showToast(isCurrentlyWishlisted ? "Removed from wishlist" : "Added to wishlist");
  };

  const formatCategoryName = (cat) => {
    const c = normalizeCat(cat);
    if (c === 'dresses') return 'Dresses';
    if (c === 'coord-sets') return 'Co-ord Sets';
    if (c === 'indo-western') return 'Indo Western';
    if (c === 'drape-sarees') return 'Drape Sarees';
    if (c === 'designer-suits') return 'Designer Suits';
    if (c === 'premium-suit-materials') return 'Premium Suit Materials';
    return c.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };


  const getCategoryIcon = (cat) => {
    switch(cat) {
      case 'drape-sarees': return <Gem size={16} />;
      case 'coord-sets': return <LayoutGrid size={16} />;
      case 'designer-suits': return <Shirt size={16} />;
      case 'indo-western': return <Layers size={16} />;
      case 'premium-suit-materials': return <Sparkles size={16} />;
      default: return <Sparkles size={16} />;
    }
  };



  const categorySchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${displayTitle} Collection - Miraya by Garima`,
    description: `Shop luxury ${displayTitle.toLowerCase()} handcrafted by Miraya by Garima in Nagpur.`,
    url: `https://www.mirayabygarima.com/category/${category || 'all'}`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.mirayabygarima.com/'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: displayTitle,
          item: `https://www.mirayabygarima.com/category/${category || 'all'}`
        }
      ]
    }
  };

  return (
    <div className="category-page">
      <SEO
        title={`${displayTitle} - Designer Collection`}
        description={`Explore handcrafted designer ${displayTitle.toLowerCase()} at Miraya by Garima Nagpur. Timeless bridal, festive, and contemporary luxury silhouettes.`}
        keywords={`${displayTitle}, Designer ${displayTitle} Nagpur, Miraya by Garima ${displayTitle}, Luxury Ethnic Wear`}
        schemaJson={categorySchema}
      />
      <div 
        className="category-header-banner" 
        role="banner" 
        aria-label={displayTitle}
        style={{
          ...(category === 'prime' ? { backgroundImage: 'url("/prime_hero.jpg")' } : {}),
          ...(category === 'classic' ? { backgroundImage: 'url("/classic_hero.jpg")' } : {})
        }}
      >
        <h1 className="sr-only">{displayTitle}</h1>
      </div>
      <div className="floral-bg-category"></div>
      <div className="container category-layout">
        
        {/* SIDEBAR FILTERS */}
        <aside className="filter-sidebar">
          <div className="sidebar-sticky">
            <h2 className="sidebar-title">FILTERS</h2>
            <div className="sidebar-ornament">
              <svg width="32" height="12" viewBox="0 0 32 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 1C16 1 19 6 16 11C13 6 16 1 16 1Z" stroke="#cda372" strokeWidth="1"/>
                <path d="M16 11C16 11 20 8 24 5C19 5 16 11 16 11Z" stroke="#cda372" strokeWidth="1"/>
                <path d="M16 11C16 11 12 8 8 5C13 5 16 11 16 11Z" stroke="#cda372" strokeWidth="1"/>
                <line x1="0" y1="5.5" x2="10" y2="5.5" stroke="#cda372" strokeWidth="1" />
                <line x1="22" y1="5.5" x2="32" y2="5.5" stroke="#cda372" strokeWidth="1" />
              </svg>
            </div>
            
            {['all', 'prime', 'classic'].includes(category) && (
              <div className="filter-section">
                <div 
                  className="filter-heading-wrap"
                  onClick={() => setCategoryFilterOpen(prev => !prev)}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title={categoryFilterOpen ? "Collapse category filters" : "Expand category filters"}
                >
                  <h3 className="filter-heading">CATEGORY</h3>
                  {categoryFilterOpen ? (
                    <ChevronUp size={16} className="filter-chevron" />
                  ) : (
                    <ChevronDown size={16} className="filter-chevron" />
                  )}
                </div>
                
                <AnimatePresence>
                  {categoryFilterOpen && (
                    <motion.div 
                      className="checkbox-list"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      {availableCategories.map(cat => (
                        <label key={cat} className={`custom-checkbox ${selectedCategories.includes(cat) ? 'active' : ''}`}>
                          <input 
                            type="checkbox" 
                            checked={selectedCategories.includes(cat)}
                            onChange={() => handleCheckboxChange(setSelectedCategories, cat)}
                          />
                          <span className="checkmark"></span>
                          <span className="cat-icon">{getCategoryIcon(cat)}</span>
                          <span className="cat-label">{formatCategoryName(cat)}</span>
                        </label>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            


            <button className="clear-filters-btn" onClick={() => {
              setSelectedCategories([]);
              if (category !== 'all') {
                navigate('/collection/all');
              } else {
                scrollToProductsTop();
              }
            }}>
              RESET FILTERS <RefreshCw size={14} className="ml-2" />
            </button>
          </div>
        </aside>

        {/* MAIN PRODUCT GRID */}
        <main className="product-main">
          
          <div className="sort-bar-top">
            <div className="results-count">
              Explore <span className="highlight-count">{filteredAndSortedProducts.length}</span> curated pieces
            </div>
            <div className="sort-controls">
              <div className="custom-sort-dropdown">
                <select
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    scrollToProductsTop();
                  }}
                  aria-label="Sort products"
                >
                  <option value="featured">Sort by: Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
                <ChevronDown size={14} className="sort-chevron-icon" />
              </div>
              <div className="view-toggles">
                <button
                  className={`grid-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid View"
                  title="Grid View"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  className={`list-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="List View"
                  title="List View"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {loading ? null : filteredAndSortedProducts.length > 0 ? (
            <motion.div className={viewMode === 'list' ? 'premium-list-view' : 'premium-grid'}>
              <AnimatePresence>
              {filteredAndSortedProducts.map((item, index) => {
                const isWishlisted = isInWishlist(item.id);
                
                const isItemOutOfStock = (() => {
                  if (item.stock !== undefined && item.stock !== null && Number(item.stock) <= 0) return true;
                  if (item.size_stock) {
                    const stockObj = typeof item.size_stock === 'string'
                      ? (() => { try { return JSON.parse(item.size_stock); } catch(e) { return {}; } })()
                      : item.size_stock;
                    const values = Object.values(stockObj);
                    if (values.length > 0 && values.every(val => Number(val) <= 0)) return true;
                  }
                  return false;
                })();
                
                return (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  key={item.id} 
                  id={`item-${item.id}`} 
                  className="premium-card"
                >
                  <div className="card-image-wrapper">
                    {isItemOutOfStock && (
                      <span className="card-badge-stock">
                        OUT OF STOCK
                      </span>
                    )}
                    {/* Sale / Discount Badge */}
                    {!isItemOutOfStock && (item.is_on_sale || (item.mrp_price && Number(item.mrp_price) > Number(item.price)) || item.discount_percent) && (
                      <span className="card-badge-sale">
                        {item.promo_label || (item.discount_percent ? `${item.discount_percent}% OFF` : 'SPECIAL SALE')}
                      </span>
                    )}

                    {/* Wishlist moved to action bar */}
                    <Link 
                      to={`/product/${item.category}/${item.id}`} 
                      state={{ product: item, from: `/collection/${category}`, filters: selectedCategories }}
                      className="card-image-link"
                      onClick={handleProductCardClick}
                    >
                      <img 
                        src={getProductImage(item.image || item.image_url)} 
                        alt={item.title || item.name} 
                        loading="lazy" 
                        decoding="async"
                        className={`card-product-img ${isItemOutOfStock ? 'out-of-stock-img' : ''}`}
                      />
                    </Link>
                  </div>
                  <div className="card-info">
                    <div className="card-info-main-row">
                      <div className="card-text-col">
                        <Link 
                          to={`/product/${item.category || category}/${item.id}`}
                          state={{ product: item, from: `/collection/${category}`, filters: selectedCategories }}
                          className="card-title-link"
                          onClick={handleProductCardClick}
                        >
                          <h3 className="card-product-title">{item.title || item.name}</h3>
                        </Link>
                        
                        <span className="card-category-kicker">
                          {formatCategoryName(item.category || category).toUpperCase()}
                        </span>

                        <div className="card-pricing-row">
                          <span className="product-price">{formatPrice(item.price)}</span>
                          {item.mrp_price && Number(item.mrp_price) > Number(item.price) && (
                            <del className="product-mrp-price">
                              {formatPrice(item.mrp_price)}
                            </del>
                          )}
                          {item.discount_percent && (
                            <span className="product-discount-pill">
                              {item.discount_percent}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="premium-action-icons">
                        <button 
                          type="button"
                          className={`icon-naked-btn ${isWishlisted ? 'active' : ''}`}
                          onClick={(e) => handleWishlistToggle(item, e)}
                          title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          <Heart size={22} strokeWidth={1} fill={isWishlisted ? "currentColor" : "none"} />
                        </button>
                        
                        {(() => {
                          const inCart = cartItems.some(ci => String(ci.id) === String(item.id) || ci.productId === item.id);
                          const isHovered = hoveredCartCardId === item.id;
                          return (
                            <button 
                              type="button"
                              className={`icon-naked-btn ${inCart ? 'added' : ''}`}
                              title={inCart ? (isHovered ? "Remove from cart" : "In cart") : "Add to Cart"}
                              onMouseEnter={() => setHoveredCartCardId(item.id)}
                              onMouseLeave={() => setHoveredCartCardId(null)}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleToggleCartItem(item);
                              }}
                            >
                              {inCart ? (
                                isHovered ? <Trash2 size={22} strokeWidth={1} /> : <Check size={22} strokeWidth={1} />
                              ) : (
                                <ShoppingBag size={22} strokeWidth={1} />
                              )}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {expandedCartCardId === item.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          style={{ overflow: 'hidden', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '10px' }}
                        >
                          <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.6)', marginBottom: '8px', letterSpacing: '0.5px' }}>SELECT SIZE:</div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {(item.sizes && item.sizes.length > 0 ? item.sizes : ['S', 'M', 'L', 'XL', 'XXL']).map(size => (
                              <button 
                                key={size}
                                type="button"
                                style={{
                                  background: 'transparent',
                                  border: '1px solid rgba(0,0,0,0.15)',
                                  borderRadius: '4px',
                                  padding: '5px 8px',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  color: '#000',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.target.style.borderColor = '#c6a46a'; e.target.style.color = '#c6a46a'; }}
                                onMouseLeave={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.15)'; e.target.style.color = '#000'; }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  addToCart(item, size, 1);
                                  showToast('Added to cart!');
                                  setExpandedCartCardId(null);
                                }}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                  </div>
                  </motion.div>
                );
              })}
              </AnimatePresence>
            </motion.div>
          ) : samples.length > 0 ? (
            <div className="no-items">
              <h2>No items match your filters.</h2>
            </div>
          ) : (
            <div className="no-items">
              <h2>No items found.</h2>
              <p>Try adjusting your filters to discover more.</p>
            </div>
          )}
        </main>
      </div>

      

      {/* CHECKOUT MODAL */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        directProduct={checkoutDirectItem}
      />

      {/* WHATSAPP ORDER MODAL */}
      <WhatsAppOrderModal
        isOpen={!!whatsAppModalItem}
        onClose={() => setWhatsAppModalItem(null)}
        product={whatsAppModalItem}
        selectedSize={whatsAppModalItem?.sizes?.[0] || 'M'}
      />

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            style={{
              position: 'fixed',
              bottom: '30px',
              left: '50%',
              background: 'var(--primary-burgundy)',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '30px',
              zIndex: 9999,
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.95rem',
              letterSpacing: '1px'
            }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryPage;
