'use client';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useEffect, useLayoutEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ChevronDown, ChevronUp, LayoutGrid, List, RefreshCw, ShoppingBag, Sparkles, Gem, Shirt, ArrowRight, Layers, X, Check } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import CheckoutModal from '../components/CheckoutModal';
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
    <path d="M0 20 Q 20 20 20 0 M20 40 Q 20 20 40 20" stroke="#c6a46a" strokeWidth="1" />
  </svg>
);

const formatPrice = (price) => {
  if (price === undefined || price === null || price === '') return '';
  const str = String(price).trim();
  if (str.startsWith('₹')) return str;
  const num = typeof price === 'number' ? price : parseInt(str.replace(/[^\d]/g, ''), 10);
  if (isNaN(num)) return str;
  return `₹${num.toLocaleString('en-IN')}`;
};

const CategoryPage = () => {
  const { category } = useParams();
  const location = useLocation();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  
  const [selectedCategories, setSelectedCategories] = useState(location.state?.filters || []);
  
  const displayTitle = category === 'all'
    ? 'All Collections'
    : category === 'coord-sets' ? 'Co-ord Sets' 
    : category === 'indo-western' ? 'Indo Western'
    : category === 'drape-sarees' ? 'Drape Sarees'
    : category === 'designer-suits' ? 'Designer Suits'
    : category === 'premium-suit-materials' ? 'Premium Suit Materials'
    : category === 'lehenga' ? 'Bespoke Lehengas'
    : category === 'festive-edit' ? 'Festive Edit'
    : category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');

  const [samples, setSamples] = useState(() => {
    let data = [];
    const allItems = [];
    Object.values(productsData).forEach(arr => { allItems.push(...arr); });

    if (category === 'all') {
      data = allItems;
    } else if (category === 'lehenga') {
      data = allItems.filter(p => (p.title || '').toLowerCase().includes('lehenga'));
      if (data.length === 0) data = productsData['indo-western'] || [];
    } else if (category === 'festive-edit') {
      data = allItems.filter(p => (p.title || '').toLowerCase().includes('suit') || (p.title || '').toLowerCase().includes('lehenga') || (p.title || '').toLowerCase().includes('saree'));
      if (data.length === 0) data = allItems;
    } else if (category === 'kurtis') {
      data = productsData['coord-sets'] || [];
    } else {
      data = productsData[category] || allItems;
    }
    return data.map(item => ({ ...item, id: String(item.id).includes('-') ? item.id : `${item.category}-${item.id}` }));
  });
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('grid');
  const [sizeModalProduct, setSizeModalProduct] = useState(null);
  const [selectedBuySize, setSelectedBuySize] = useState('M');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutDirectItem, setCheckoutDirectItem] = useState(null);
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(true);

  const handleBuyNowClick = (product) => {
    let availableSizes = ['S', 'M', 'L', 'XL'];
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      availableSizes = product.sizes;
    }
    setSelectedBuySize(availableSizes[0] || 'M');
    setSizeModalProduct(product);
  };

  const handleProceedToPayment = () => {
    if (!sizeModalProduct) return;
    const rawPrice = sizeModalProduct.price;
    const priceNum = typeof rawPrice === 'number'
      ? rawPrice
      : (sizeModalProduct.rawPrice || sizeModalProduct.priceValue || parseInt(String(rawPrice || 0).replace(/[^\d]/g, ''), 10) || 0);

    const directItem = {
      id: `${sizeModalProduct.category || category}-${sizeModalProduct.id}`,
      productId: sizeModalProduct.id,
      name: sizeModalProduct.title || sizeModalProduct.name,
      title: sizeModalProduct.title || sizeModalProduct.name,
      price: priceNum,
      image: getProductImage(sizeModalProduct.image || sizeModalProduct.image_url),
      selectedSize: selectedBuySize || 'M',
      size: selectedBuySize || 'M',
      qty: 1,
    };
    setSizeModalProduct(null);
    setCheckoutDirectItem(directItem);
    setCheckoutOpen(true);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const availableCategories = ['indo-western', 'drape-sarees', 'designer-suits', 'premium-suit-materials', 'coord-sets'];

  const normalizeCat = (catName) => {
    if (!catName) return 'indo-western';
    const slug = String(catName).toLowerCase().replace(/\s+/g, '-');
    if (slug === 'co-ord-sets' || slug === 'coord' || slug === 'co-ord') return 'coord-sets';
    return slug;
  };

  const handleCheckboxChange = (setState, value) => {
    setState(prev => 
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
    );
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...samples];
    if (category === 'all' && selectedCategories.length > 0) {
      result = result.filter(item => {
        const itemCat = normalizeCat(item.category);
        return selectedCategories.some(sc => normalizeCat(sc) === itemCat);
      });
    }

    const getNumericPrice = (item) => {
      if (typeof item.rawPrice === 'number' && !isNaN(item.rawPrice)) return item.rawPrice;
      if (typeof item.price === 'number' && !isNaN(item.price)) return item.price;
      const cleanStr = String(item.price || '0').replace(/[^\d]/g, '');
      return parseInt(cleanStr, 10) || 0;
    };

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
        const response = await fetch(`${API_URL}/api/products${category !== 'all' ? `?category=${category}` : ''}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        const mappedData = data.map(item => {
          const rawPrice = item.price;
          const numPrice = typeof rawPrice === 'number' ? rawPrice : parseInt(String(rawPrice || '0').replace(/[^\d]/g, ''), 10);
          const catSlug = normalizeCat(item.category?.name || item.category || 'indo-western');

          // Match with local product details for rich metadata fallback
          const allLocal = getAllProducts();
          const localMatch = allLocal.find(p => 
            String(p.id).toLowerCase() === String(item.id).toLowerCase() || 
            (p.title && item.name && p.title.toLowerCase().trim() === item.name.toLowerCase().trim())
          ) || {};

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

          return {
            ...localMatch,
            ...item,
            id: item.id,
            title: item.name || item.title || localMatch.title,
            category: catSlug,
            price: `₹${numPrice.toLocaleString('en-IN')}`,
            rawPrice: numPrice,
            fabric: item.fabric || localMatch.fabric || 'Crush Fabrics',
            color: item.color || localMatch.color || (item.name ? item.name.split(' ')[0] : 'Grey'),
            wash_care: item.wash_care || localMatch.wash_care || 'Professional Dry Clean Only. Do not flat iron on embellishments',
            craftsmanship: item.craftsmanship || localMatch.craftsmanship || 'Handcrafted Details & Designer Tailoring',
            sizes: sizesList,
            image: item.image_url || item.image || localMatch.image,
            images: item.images?.length ? item.images : (localMatch.images || [item.image_url || item.image || localMatch.image])
          };
        });
        
        if (mappedData.length > 0) {
          setSamples(mappedData);
        } else {
          let fallback = productsData[category] || [];
          if (fallback.length === 0 && (category === 'coord-sets' || category === 'kurtis')) {
            fallback = productsData['coord-sets'] || [];
          }
          setSamples(fallback.map(item => ({ ...item, id: String(item.id).includes('-') ? item.id : `${item.category}-${item.id}` })));
        }
      } catch (err) {
        console.error("Failed to fetch category products", err);
        let data = [];
        if (category === 'all') {
          Object.values(productsData).forEach(arr => {
            data = [...data, ...arr];
          });
        } else {
          data = productsData[category] || [];
        }
        const mappedData = data.map(item => ({
          ...item,
          id: `${item.category}-${item.id}`
        }));
        setSamples(mappedData);
      }
    };
    fetchProducts();

    if (!location.state?.filters) {
      setSelectedCategories([]);
    }
  }, [category, location.state]);

  useLayoutEffect(() => {
    if (location.hash && samples.length > 0) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    }
  }, [location.hash, samples]);

  const handleWishlistToggle = (item, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isCurrentlyWishlisted = isInWishlist(item.id);
    toggleWishlist(item);
    showToast(isCurrentlyWishlisted ? "Removed from wishlist" : "Added to wishlist");
  };

  const formatCategoryName = (cat) => {
    const c = normalizeCat(cat);
    if (c === 'coord-sets') return 'Co-ord Sets';
    if (c === 'indo-western') return 'Indo Western';
    if (c === 'drape-sarees') return 'Drape Sarees';
    if (c === 'designer-suits') return 'Designer Suits';
    if (c === 'premium-suit-materials') return 'Premium Suit Materials';
    return c.charAt(0).toUpperCase() + c.slice(1);
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
      <div className="category-header-banner">
        <div className="banner-content">
          <div className="pre-heading-container">
            <span className="gold-diamond">◈</span>
            <span className="pre-heading">EXCLUSIVE COLLECTION</span>
            <span className="gold-diamond">◈</span>
          </div>
          <h1>{displayTitle}</h1>
          <p>Explore our exclusive collection of handcrafted {displayTitle.toLowerCase()},<br/>where timeless tradition meets modern elegance.</p>
          <div className="ornament-container">
            <div className="line"></div>
            <div className="diamond">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="ornament-icon"><path d="M12 2L15 12L12 22L9 12Z"/></svg>
            </div>
            <div className="line"></div>
          </div>
        </div>
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
            
            {category === 'all' && (
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
            }}>
              RESET FILTERS <RefreshCw size={14} className="ml-2" />
            </button>
          </div>
        </aside>

        {/* MAIN PRODUCT GRID */}
        <main className="product-main">
          
          <div className="sort-bar-top">
            <div className="results-count">
              Showing <span className="highlight-count">{filteredAndSortedProducts.length}</span> of <span className="highlight-count">{samples.length}</span> results
            </div>
            <div className="sort-controls">
              <div className="custom-sort-dropdown">
                <select
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
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
            <motion.div layout className={viewMode === 'list' ? 'premium-list-view' : 'premium-grid'}>
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
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3 }}
                  key={item.id} 
                  id={`item-${item.id}`} 
                  className="premium-card"
                >
                  <div className="card-image-wrapper" style={{ position: 'relative' }}>
                    {isItemOutOfStock && (
                      <span style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'rgba(231, 76, 60, 0.95)',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        letterSpacing: '1px',
                        padding: '4px 10px',
                        borderRadius: '30px',
                        zIndex: 5,
                        textTransform: 'uppercase',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}>
                        OUT OF STOCK
                      </span>
                    )}
                    <button 
                      className={`wishlist-btn-card ${isWishlisted ? 'active' : ''}`}
                      onClick={(e) => handleWishlistToggle(item, e)}
                    >
                      <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
                    </button>
                    <Link 
                      to={`/product/${item.category}/${item.id}`} 
                      state={{ product: item, from: `/collection/${category}`, filters: selectedCategories }}
                      style={{ 
                        display: 'block', height: '100%', 
                        ...(item.id === 'coord-3' ? { transform: 'scale(1.18)', transformOrigin: 'top center' } : {}),
                        ...(item.id === 'iw-3' ? { transform: 'scale(1.32)', transformOrigin: 'top center' } : {}) 
                      }}
                    >
                      <img 
                        src={getProductImage(item.image || item.image_url)} 
                        alt={item.title || item.name} 
                        loading="lazy" 
                        decoding="async"
                        style={isItemOutOfStock ? { filter: 'grayscale(30%) opacity(0.85)' } : {}}
                      />
                    </Link>
                  </div>
                  <div className="card-info">
                    <div className="title-price-row">
                      <h3>{item.title || item.name}</h3>
                      <span className="product-price">{formatPrice(item.price)}</span>
                    </div>

                    {/* Desktop List View Product Information */}
                    {viewMode === 'list' && (
                      <div className="list-view-details">
                        <div className="list-spec-grid">
                          <div className="list-spec-item">
                            <span className="list-spec-label">Fabric:</span>
                            <span className="list-spec-value">{item.fabric || 'Crush Fabrics'}</span>
                          </div>
                          <div className="list-spec-item">
                            <span className="list-spec-label">Color:</span>
                            <span className="list-spec-value">{item.color || (item.title ? item.title.split(' ')[0] : 'Grey')}</span>
                          </div>
                          <div className="list-spec-item full-width">
                            <span className="list-spec-label">Wash Care:</span>
                            <span className="list-spec-value">{item.wash_care || 'Professional Dry Clean Only. Do not flat iron on embellishments'}</span>
                          </div>
                          {item.craftsmanship && (
                            <div className="list-spec-item full-width">
                              <span className="list-spec-label">Craftsmanship:</span>
                              <span className="list-spec-value">{item.craftsmanship}</span>
                            </div>
                          )}
                          <div className="list-spec-item">
                            <span className="list-spec-label">Available Sizes:</span>
                            <span className="list-spec-value sizes-pill-wrap">
                              {(Array.isArray(item.sizes) && item.sizes.length > 0
                                ? item.sizes
                                : (item.category === 'drape-sarees' || item.category === 'premium-suit-materials' ? ['Free Size'] : ['S', 'M', 'L', 'XL'])
                              ).map((s) => (
                                <span key={s} className="size-badge-pill">{s}</span>
                              ))}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="card-action-bar">
                      {isItemOutOfStock ? (
                        <span className="out-of-stock-badge">
                          OUT OF STOCK
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="buy-now-card-btn"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleBuyNowClick(item);
                            }}
                          >
                            BUY NOW <ArrowRight size={13} className="ml-1" />
                          </button>
                          <button 
                            type="button"
                            className="add-to-cart-card-btn"
                            title="Add to Cart"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addToCart(item, item.sizes ? item.sizes[0] : 'M', 1);
                              showToast('Added to cart!');
                            }}
                          >
                            <ShoppingBag size={13} /> ADD TO CART
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  </motion.div>
                );
              })}
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

      {/* QUICK SIZE SELECTOR MODAL */}
      <AnimatePresence>
        {sizeModalProduct && (
          <div
            className="quick-size-modal-backdrop"
            onClick={() => setSizeModalProduct(null)}
          >
            <motion.div
              className="quick-size-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <button
                className="quick-size-close-btn"
                onClick={() => setSizeModalProduct(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <div className="quick-size-header">
                <img
                  src={getProductImage(sizeModalProduct.image || sizeModalProduct.image_url)}
                  alt={sizeModalProduct.title || sizeModalProduct.name}
                  className="quick-size-thumb"
                />
                <div className="quick-size-title-wrap">
                  <span className="quick-size-cat">{sizeModalProduct.category?.toUpperCase() || 'MIRAYA EXCLUSIVE'}</span>
                  <h4>{sizeModalProduct.title || sizeModalProduct.name}</h4>
                  <p className="quick-size-price">{formatPrice(sizeModalProduct.price)}</p>
                </div>
              </div>

              <div className="quick-size-body">
                <div className="quick-size-label-row">
                  <span className="quick-size-label">Select Your Size:</span>
                  <span className="quick-size-active-val">Size: {selectedBuySize}</span>
                </div>

                <div className="quick-size-grid">
                  {(sizeModalProduct.sizes && sizeModalProduct.sizes.length > 0 ? sizeModalProduct.sizes : ['XS', 'S', 'M', 'L', 'XL', 'XXL']).map((size) => {
                    let sizeStock = 1;
                    if (sizeModalProduct.size_stock) {
                      try {
                        const stockObj = typeof sizeModalProduct.size_stock === 'string'
                          ? JSON.parse(sizeModalProduct.size_stock)
                          : sizeModalProduct.size_stock;
                        if (stockObj[size] !== undefined) sizeStock = Number(stockObj[size]);
                      } catch (e) {}
                    }
                    const isSoldOut = sizeStock <= 0;

                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={isSoldOut}
                        className={`quick-size-btn ${selectedBuySize === size ? 'active' : ''} ${isSoldOut ? 'disabled' : ''}`}
                        onClick={() => !isSoldOut && setSelectedBuySize(size)}
                      >
                        <span>{size}</span>
                        {selectedBuySize === size && <Check size={12} className="check-icon" />}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="quick-size-proceed-btn"
                  onClick={handleProceedToPayment}
                >
                  <span>PROCEED TO PAYMENT</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CHECKOUT MODAL */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        directProduct={checkoutDirectItem}
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
