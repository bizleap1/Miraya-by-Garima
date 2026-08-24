'use client';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useLayoutEffect, useState } from 'react';
import { ArrowLeft, Star, Heart, ZoomIn, Search, Minus, Plus, ShieldCheck, Truck, Lock, Flower2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API_URL from '../config';
import { getProductImage } from '../utils/imageHelper';
import ConfirmModal from '../components/ConfirmModal';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import CheckoutModal from '../components/CheckoutModal';
import SEO from '../components/SEO';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { category, id } = useParams();
  const location = useLocation();
  const initialProduct = location.state?.product || null;

  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutDirectItem, setCheckoutDirectItem] = useState(null);
  
  const navigate = useNavigate();
  const { addToCart: contextAddToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchProduct = async () => {
      let fetched = false;
      try {
        const res = await fetch(`${API_URL}/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct({
            ...data,
            id: data.id,
            title: data.name || data.title || 'Outfit',
            price: data.price,
            category: data.category?.name || data.category || category,
            image: data.image_url || data.image || (data.images && data.images[0]) || '/products/Lehenga-Pink Blush/1.JPG',
            images: data.images?.length ? data.images : [data.image_url || data.image || '/products/Lehenga-Pink Blush/1.JPG']
          });
          fetched = true;
        }
      } catch (error) {
        console.error("Failed to fetch product from API:", error);
      }

      if (!fetched) {
        try {
          const { getProductById, getAllProducts } = await import('../data/products');
          const localProd = getProductById(`${category}-${id}`) ||
            getAllProducts().find(p => String(p.id) === String(id) || String(p.id) === `${category}-${id}` || String(id).endsWith(String(p.id)));
          if (localProd) {
            setProduct(localProd);
          }
        } catch (e) {
          console.error("Local fallback error:", e);
        }
      }
      setLoading(false);
    };
    fetchProduct();
  }, [category, id]);

  const buyNow = () => {
    if (!product) return;
    const rawPrice = product.price;
    const numPrice = typeof rawPrice === 'number'
      ? rawPrice
      : parseInt(String(rawPrice || 0).replace(/[^\d]/g, ''), 10);

    setCheckoutDirectItem({
      id: product.id,
      title: product.title || product.name || 'Outfit',
      price: isNaN(numPrice) ? 0 : numPrice,
      image: product.image || product.image_url || (product.images && product.images[0]) || '/products/Lehenga-Pink Blush/1.JPG',
      selectedSize: selectedSize || 'M',
      qty: quantity || 1
    });
    setCheckoutOpen(true);
  };

  if (loading) {
    return (
      <div className="product-detail-page not-found" style={{padding: '120px 20px', textAlign: 'center'}}>
        <h2>Loading Outfit...</h2>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page not-found">
        <h2>Outfit not found</h2>
        <Link to="/collection/all" className="back-link">Return to Collection</Link>
      </div>
    );
  }

  const formatCategoryName = (cat) => {
    if (!cat) return 'Collection';
    let catStr = typeof cat === 'object' ? (cat.name || cat.title || '') : String(cat);
    const norm = catStr.toLowerCase().replace(/[\s_]+/g, '-');
    if (norm.includes('coord') || norm.includes('co-ord')) return 'Co-ord Sets';
    if (norm.includes('drape') || norm.includes('saree')) return 'Drape Sarees';
    if (norm.includes('designer') || norm.includes('suit')) return 'Designer Suits';
    if (norm.includes('premium') || norm.includes('material')) return 'Premium Suit Materials';
    if (norm.includes('indo') || norm.includes('western')) return 'Indo Western';
    return catStr.charAt(0).toUpperCase() + catStr.slice(1);
  };

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    setQuantity(quantity + 1);
  };

  const rawList = product.images && product.images.length > 0
    ? product.images
    : (product.gallery || [product.image || product.image_url || '/products/Lehenga-Pink Blush/1.JPG']);

  const galleryImages = rawList.map(img => getProductImage(img));

  const currentImg = (galleryImages && galleryImages[activeImageIndex]) || '';
  const imgStr = typeof currentImg === 'string' ? currentImg : '';

  const sizeStockObj = typeof product.size_stock === 'string'
    ? (() => { try { return JSON.parse(product.size_stock); } catch(e) { return {}; } })()
    : (product.size_stock || {});

  const addToCart = () => {
    if (!product) return;
    const rawPrice = product.price;
    const numPrice = typeof rawPrice === 'number'
      ? rawPrice
      : parseInt(String(rawPrice || 0).replace(/[^\d]/g, ''), 10);

    contextAddToCart({
      id: product.id,
      title: product.title || product.name || 'Outfit',
      price: isNaN(numPrice) ? 0 : numPrice,
      image: product.image || product.image_url || (product.images && product.images[0]) || '/products/Lehenga-Pink Blush/1.JPG'
    }, selectedSize, quantity);

    setConfirmConfig({
      message: 'Added to Bag',
      subMessage: `${product.title || product.name || 'Outfit'} has been successfully added to your shopping bag.`,
      confirmText: 'Continue',
      isAlert: true,
      isSuccess: true
    });
  };

  const basePath = location.state?.from || '/collection/all';
  const fromPath = `${basePath}#item-${product.id}`;
  const filters = location.state?.filters || [];
  const isFromAll = basePath.includes('/all');
  const backText = isFromAll ? 'All Collections' : formatCategoryName(product.category);

  const priceNum = typeof product.price === 'number' ? product.price : parseInt(String(product.price || '0').replace(/[^\d]/g, ''), 10) || 15000;
  const primaryImg = (product.images && product.images[0]) || product.image || '/products/Lehenga-Pink Blush/1.JPG';

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title || product.name,
    image: primaryImg.startsWith('http') ? primaryImg : `https://www.mirayabygarima.com${primaryImg}`,
    description: product.description || `Handcrafted ${product.title || product.name} by Miraya by Garima. Luxury couture designer wear tailored with bespoke artistry in Nagpur.`,
    sku: `SKU-MRY-${product.id}`,
    brand: {
      '@type': 'Brand',
      name: 'Miraya by Garima'
    },
    offers: {
      '@type': 'Offer',
      url: `https://www.mirayabygarima.com/product/${id}`,
      priceCurrency: 'INR',
      price: priceNum,
      priceValidUntil: '2027-12-31',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'ClothingStore',
        name: 'Miraya by Garima',
        telephone: '+919271218156',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Shop no. UG/5, Jagat Plaza, Law College Square, Amravati Rd',
          addressLocality: 'Nagpur',
          addressRegion: 'Maharashtra',
          postalCode: '440033',
          addressCountry: 'IN'
        }
      }
    }
  };

  return (
    <div className="product-detail-page">
      <SEO
        title={`${product.title || product.name} | Designer Couture`}
        description={`Buy ${product.title || product.name} online from Miraya by Garima Nagpur. Fabric: ${product.fabric || 'Premium Luxury Silk'}. Handcrafted designer bridal & festive collection.`}
        keywords={`${product.title || product.name}, ${formatCategoryName(product.category)}, Miraya by Garima, Designer Wear Nagpur`}
        image={primaryImg}
        type="product"
        schemaJson={productSchema}
      />
      <ConfirmModal config={confirmConfig} onClose={() => setConfirmConfig(null)} />
      <div className="container product-container">
        <div className="back-nav">
          <Link to={fromPath} state={{ filters }} className="back-link">
            <ArrowLeft size={16} /> Back to {backText}
          </Link>
        </div>

        <div className="product-detail-grid">
          {/* LEFT: Image Gallery */}
          <div className="product-gallery">
            <div className="thumbnail-list">
              {galleryImages.map((img, index) => (
                <div 
                  key={index} 
                  className={`thumbnail-item ${index === activeImageIndex ? 'active' : ''}`}
                  onClick={() => setActiveImageIndex(index)}
                >
                  <img src={img} alt={`${product.title || product.name} view ${index + 1}`} />
                </div>
              ))}

            </div>
            
            <div className="product-main-img-wrapper">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={activeImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  src={imgStr || '/products/Lehenga-Pink Blush/1.JPG'} 
                  alt={product.title || product.name} 
                  className="product-main-img" 
                  style={{
                    ...(imgStr.includes('Drape Saree') && !imgStr.includes('4.JPG') && !imgStr.includes('Black Color/2.JPG') ? { objectPosition: '80% center' } : {}),
                    ...(imgStr.includes('4.JPG') ? { objectPosition: 'center 15%', transform: 'scale(1.3)' } : {}),
                    ...(imgStr.includes('Black Color/2.JPG') ? { objectPosition: '30% center', transform: 'scale(1.15)', transformOrigin: 'left center' } : {}),
                    ...(imgStr.includes('Lehenga-Golden/5.JPG') ? { transform: 'scale(1.1)', transformOrigin: '25% center' } : {}),
                    ...(imgStr.includes('Rajastani-pink/DSC05133.JPG') ? { transform: 'scale(1.18) translateX(8%)', transformOrigin: 'top center' } : {})
                  }}
                />
              </AnimatePresence>

            </div>
          </div>

          {/* RIGHT: Product Info */}
          <div className="product-info-container">
            <div className="product-meta">
              <span className="product-category-tag">{formatCategoryName(product.category)}</span>
            </div>
            
            <h1 className="product-title">{product.title || product.name}</h1>
            <div className="product-detail-price" style={{ fontSize: '1.75rem', fontFamily: 'var(--font-heading)', color: 'var(--primary-burgundy)', fontWeight: 600, margin: '0.5rem 0 1rem' }}>
              {(() => {
                if (product.price === undefined || product.price === null || product.price === '') return '';
                const str = String(product.price).trim();
                if (str.startsWith('₹')) return str;
                const num = typeof product.price === 'number' ? product.price : parseInt(str.replace(/[^\d]/g, ''), 10);
                if (isNaN(num)) return str;
                return `₹${num.toLocaleString('en-IN')}`;
              })()}
            </div>
            
            <div className="product-description">
              <p>
                {product.description || `A sheer, breathtaking piece with hand-scalloped borders and scattered sequin rain. A modern interpretation of classic romance.`}
              </p>
            </div>

            <div className="decorative-divider">
              <span className="line"></span>
              <Flower2 size={18} color="#C6A46A" />
              <span className="line"></span>
            </div>

            <div className="feature-highlights">
              <div className="feature-box">
                <Flower2 size={24} color="#C6A46A" />
                <span>Premium<br/>{product.fabric || 'Organza Silk'}</span>
              </div>
              <div className="feature-box">
                <Star size={24} color="#C6A46A" />
                <span>Handcrafted<br/>Details</span>
              </div>
              <div className="feature-box">
                <Heart size={24} color="#C6A46A" />
                <span>Lightweight<br/>& Breathable</span>
              </div>
            </div>

            <div className="product-attributes-compact">
              <div className="attr-row">
                <span className="attr-label">Fabric:</span>
                <span className="attr-value">{product.fabric || 'Crush Fabrics'}</span>
              </div>
              <div className="attr-row">
                <span className="attr-label">Color:</span>
                <span className="attr-value">{product.color || (product.title ? product.title.split(' ')[0] : 'Grey')}</span>
              </div>
              <div className="attr-row">
                <span className="attr-label">Wash Care Instructions:</span>
                <span className="attr-value">{product.wash_care || product.washCare || 'Professional Dry Clean Only. Do not flat iron on embellishments'}</span>
              </div>
            </div>
            
            <div className="purchase-actions" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="size-selector" style={{ flex: '1', minWidth: '220px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span className="qty-label">
                      Size: <span style={{ fontWeight: 600, color: 'var(--primary-burgundy)' }}>{selectedSize}</span>
                      {sizeStockObj[selectedSize] !== undefined && (
                        <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: sizeStockObj[selectedSize] > 0 ? '#27ae60' : '#e74c3c', fontWeight: 600 }}>
                          ({sizeStockObj[selectedSize] > 0 ? `${sizeStockObj[selectedSize]} left in store` : 'Sold Out'})
                        </span>
                      )}
                    </span>
                    <a href="#sizeguide" onClick={(e) => e.preventDefault()} style={{ fontSize: '0.85rem', color: '#cda372', textDecoration: 'underline' }}>Size Guide</a>
                  </div>
                  <div className="size-options" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {['S', 'M', 'L', 'XL'].map(size => {
                      const sizeStock = sizeStockObj[size] !== undefined ? sizeStockObj[size] : 1;
                      const isSoldOut = sizeStock <= 0;

                      return (
                        <button 
                          key={size}
                          type="button"
                          disabled={isSoldOut}
                          className={`size-btn ${selectedSize === size ? 'active' : ''} ${isSoldOut ? 'sold-out' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isSoldOut) setSelectedSize(size);
                          }}
                          style={{
                            padding: '8px 16px',
                            border: selectedSize === size ? '1px solid var(--primary-burgundy)' : '1px solid #ddd',
                            backgroundColor: selectedSize === size ? 'rgba(94, 10, 11, 0.05)' : (isSoldOut ? 'rgba(0,0,0,0.03)' : 'transparent'),
                            color: isSoldOut ? '#bbb' : (selectedSize === size ? 'var(--primary-burgundy)' : '#555'),
                            textDecoration: isSoldOut ? 'line-through' : 'none',
                            borderRadius: '4px',
                            cursor: isSoldOut ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.9rem',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="quantity-selector" style={{ paddingBottom: '2px' }}>
                  <span className="qty-label" style={{ display: 'block', marginBottom: '10px' }}>Quantity:</span>
                  <div className="qty-controls">
                    <button onClick={handleDecrease}><Minus size={14} /></button>
                    <span className="qty-value">{quantity}</span>
                    <button onClick={handleIncrease}><Plus size={14} /></button>
                  </div>
                </div>
              </div>

              <div style={{display: 'flex', gap: '1.2rem', flexWrap: 'wrap', alignItems: 'stretch', width: '100%'}}>
                {(sizeStockObj[selectedSize] !== undefined && sizeStockObj[selectedSize] <= 0) || (product.stock !== undefined && product.stock !== null && Number(product.stock) <= 0) ? (
                  <button className="inquire-btn-new" disabled style={{background: '#e74c3c', color: 'white', flex: 1, minWidth: '150px', cursor: 'not-allowed', whiteSpace: 'nowrap', margin: 0, fontWeight: 700, letterSpacing: '1px'}}>
                    OUT OF STOCK ({selectedSize})
                  </button>
                ) : (
                  <>
                    <button className="inquire-btn-new" onClick={addToCart} style={{background: 'var(--primary-burgundy)', color: 'white', flex: 1, minWidth: '150px', whiteSpace: 'nowrap', margin: 0}}>
                      ADD TO CART
                    </button>
                    <button className="inquire-btn-new" onClick={buyNow} style={{background: '#8a1f1f', color: 'white', flex: 1, minWidth: '150px', whiteSpace: 'nowrap', margin: 0}}>
                      BUY NOW
                    </button>
                  </>
                )}
                
                <button 
                  className="wishlist-icon-btn" 
                  onClick={() => toggleWishlist({
                    id: `${product.category || category}-${product.id}`,
                    name: product.title,
                    price: product.price,
                    image: product.image
                  })}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', 
                    background: 'transparent', border: '1px solid rgba(198, 164, 106, 0.5)', borderRadius: '4px',
                    width: '52px', padding: '0', transition: 'all 0.2s', flexShrink: 0
                  }}
                  title={isInWishlist(`${product.category || category}-${product.id}`) ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <Heart 
                    size={22} 
                    fill={isInWishlist(`${product.category || category}-${product.id}`) ? "var(--primary-burgundy)" : "none"} 
                    color={isInWishlist(`${product.category || category}-${product.id}`) ? "var(--primary-burgundy)" : "#C6A46A"} 
                  /> 
                </button>
              </div>
            </div>

            <div className="trust-badges">
              <div className="badge">
                <Lock size={16} color="#C6A46A" />
                <span>Secure Shopping</span>
              </div>
              <div className="badge">
                <ShieldCheck size={16} color="#C6A46A" />
                <span>Quality Assured</span>
              </div>
              <div className="badge">
                <Truck size={16} color="#C6A46A" />
                <span>Pan India Shipping</span>
              </div>
            </div>

          </div>
        </div>
      </div>
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        directProduct={checkoutDirectItem}
      />
    </div>
  );
};

export default ProductDetailPage;
