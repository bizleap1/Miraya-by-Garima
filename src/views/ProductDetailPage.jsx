'use client';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useLayoutEffect, useState, useMemo } from 'react';
import { ArrowLeft, Star, Heart, ZoomIn, Search, Minus, Plus, ShieldCheck, Truck, Lock, Flower2, Check, Trash2, ShoppingBag, RotateCcw } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import API_URL from '../config';
import { getProductImage, getProductGallery } from '../utils/imageHelper';
import ConfirmModal from '../components/ConfirmModal';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import CheckoutModal from '../components/CheckoutModal';
import WhatsAppOrderModal from '../components/WhatsAppOrderModal';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { useSocket } from '../context/SocketContext';
import SEO from '../components/SEO';

import ProductReviewsSection from '../components/ProductReviewsSection';
import './ProductDetailPage.css';

const ProductDetailPage = ({ initialProduct: ssrProduct }) => {
  const params = useParams();
  const location = useLocation();
  const initialProduct = ssrProduct || location.state?.product || null;

  // Robust parameter extraction supporting both /product/:category/:id and /product/:id or [...slug]
  let category = params?.category;
  let id = params?.id;

  if (!id && params?.slug) {
    if (Array.isArray(params.slug)) {
      if (params.slug.length === 1) {
        id = params.slug[0];
      } else if (params.slug.length >= 2) {
        category = params.slug[0];
        id = params.slug[params.slug.length - 1];
      }
    } else if (typeof params.slug === 'string') {
      id = params.slug;
    }
  }

  // Fallback to pathname parsing if parameters are missing
  if (typeof window !== 'undefined' && (!id || !category)) {
    const parts = window.location.pathname.replace(/^\/product\/?/, '').split('/').filter(Boolean);
    if (parts.length === 1 && !id) id = decodeURIComponent(parts[0]);
    if (parts.length >= 2) {
      if (!category) category = decodeURIComponent(parts[0]);
      if (!id) id = decodeURIComponent(parts[parts.length - 1]);
    }
  }

  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('Free Size (M to XL)');
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutDirectItem, setCheckoutDirectItem] = useState(null);
  const [isCartHovered, setIsCartHovered] = useState(false);
  
  const navigate = useNavigate();
  const { cartItems, addToCart: contextAddToCart, removeFromCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const { store_online, new_orders_enabled, whatsapp_number } = useStoreSettings();

  const isStoreOffline = !store_online || !new_orders_enabled;

  const [product, setProduct] = useState(() => {
    if (initialProduct) {
      let initImgs = initialProduct.images;
      if (typeof initImgs === 'string') {
        try { initImgs = JSON.parse(initImgs); } catch (_) { initImgs = [initImgs]; }
      }
      if (!Array.isArray(initImgs) || initImgs.length === 0) {
        initImgs = [initialProduct.image_url || initialProduct.image || '/products/Lehenga-Pink Blush/1.JPG'];
      }
      return {
        ...initialProduct,
        id: initialProduct.id,
        title: initialProduct.name || initialProduct.title || 'Outfit',
        price: initialProduct.price,
        category: initialProduct.category?.slug || initialProduct.category?.name || initialProduct.category || category,
        image: initialProduct.image_url || initialProduct.image || initImgs[0],
        images: initImgs
      };
    }
    return null;
  });

  // Check if current product in selected size is in cart
  const isItemInCart = useMemo(() => {
    if (!product) return false;
    return cartItems.some(item => 
      String(item.id) === String(product.id) && 
      (item.selectedSize === selectedSize || item.size === selectedSize || product.category === 'drape-sarees' || product.category === 'premium-suit-materials')
    );
  }, [cartItems, product, selectedSize]);

  const handleCartButtonClick = () => {
    if (!product) return;
    if (isItemInCart) {
      removeFromCart(product.id, selectedSize);
      toast.info(`Removed "${product.title || product.name || 'Outfit'}" from your shopping bag.`);
    } else {
      contextAddToCart(product, selectedSize, quantity);
      toast.success(`Added "${product.title || product.name || 'Outfit'}" to your shopping bag!`);
    }
  };

  const [loading, setLoading] = useState(!initialProduct);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (initialProduct) {
      let initImgs = initialProduct.images;
      if (typeof initImgs === 'string') {
        try { initImgs = JSON.parse(initImgs); } catch (_) { initImgs = [initImgs]; }
      }
      if (!Array.isArray(initImgs) || initImgs.length === 0) {
        initImgs = [initialProduct.image_url || initialProduct.image || '/products/Lehenga-Pink Blush/1.JPG'];
      }
      setProduct({
        ...initialProduct,
        id: initialProduct.id,
        title: initialProduct.name || initialProduct.title || 'Outfit',
        price: initialProduct.price,
        category: initialProduct.category?.slug || initialProduct.category?.name || initialProduct.category || category,
        image: initialProduct.image_url || initialProduct.image || initImgs[0],
        images: initImgs
      });
      setLoading(false);
    }

    const fetchProduct = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      let fetched = false;
      try {
        const res = await fetch(`${API_URL}/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          const { getProductById } = await import('../data/products');
          const localMatch = getProductById(data.id, data.category?.name || data.category || category) || {};

          let apiImgs = data.images;
          if (typeof apiImgs === 'string') {
            try { apiImgs = JSON.parse(apiImgs); } catch (_) { apiImgs = [apiImgs]; }
          }
          if (!Array.isArray(apiImgs) || apiImgs.length === 0) {
            apiImgs = [data.image_url || data.image || localMatch.image || '/products/Lehenga-Pink%20Blush/1.JPG'];
          }

          const resolvedMainImg = getProductImage(localMatch.image || data.image_url || data.image || apiImgs[0]);
          const resolvedImgs = (localMatch.images?.length ? localMatch.images : apiImgs).map(img => getProductImage(img));

          setProduct({
            ...localMatch,
            ...data,
            id: data.id,
            title: localMatch.title || data.name || data.title || 'Outfit',
            price: data.price,
            category: data.category?.slug || data.category?.name || data.category || category,
            image: resolvedMainImg,
            images: resolvedImgs
          });
          fetched = true;
        }
      } catch (error) {
        // Silently fall back to local dataset
      }

      if (!fetched && !initialProduct) {
        try {
          const { getProductById } = await import('../data/products');
          const localProd = getProductById(id, category);
          if (localProd) {
            setProduct(localProd);
          }
        } catch (e) {
          // Silent local fallback
        }
      }
      setLoading(false);
    };
    fetchProduct();
  }, [category, id, initialProduct]);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !product?.id) return;

    const handleRealtimeUpdate = (data) => {
      if (data && String(data.productId) === String(product.id)) {
        if (data.price !== undefined) {
          setProduct(prev => prev ? { ...prev, price: data.price, mrp_price: data.mrp_price || prev.mrp_price } : prev);
        }
        // Refetch full product details safely
        fetch(`${API_URL}/api/products/${product.id}`)
          .then(r => r.json())
          .then(resData => {
            if (resData && (resData.id || resData.product?.id)) {
              const fresh = resData.product || resData;
              setProduct(prev => ({
                ...prev,
                ...fresh,
                title: fresh.name || fresh.title || prev.title,
                price: fresh.price,
                stock: fresh.stock,
                variants: fresh.variants || prev.variants
              }));
            }
          })
          .catch(() => {});
      }
    };

    socket.on('product.updated', handleRealtimeUpdate);
    socket.on('inventory.updated', handleRealtimeUpdate);

    return () => {
      socket.off('product.updated', handleRealtimeUpdate);
      socket.off('inventory.updated', handleRealtimeUpdate);
    };
  }, [socket, product?.id]);


  const buyNow = () => {
    if (!product) return;
    const rawPrice = product.price;
    const numPrice = typeof rawPrice === 'number'
      ? rawPrice
      : parseInt(String(rawPrice || 0).replace(/[^\d]/g, ''), 10);
    const rawMrp = product.mrp_price;
    const numMrp = rawMrp
      ? (typeof rawMrp === 'number' ? rawMrp : parseInt(String(rawMrp).replace(/[^\d]/g, ''), 10) || null)
      : null;

    const directItem = {
      id: product.id,
      productId: product.id,
      title: product.title || product.name || 'Outfit',
      name: product.title || product.name || 'Outfit',
      price: isNaN(numPrice) ? 0 : numPrice,
      mrp_price: numMrp,
      promo_label: product.promo_label,
      discount_percent: product.discount_percent,
      is_on_sale: product.is_on_sale || (numMrp && numMrp > numPrice),
      image: getProductImage(product.image || product.image_url || (product.images && product.images[0]) || '/products/Lehenga-Pink Blush/1.JPG'),
      selectedSize: selectedSize || (product.sizes ? product.sizes[0] : 'M'),
      size: selectedSize || (product.sizes ? product.sizes[0] : 'M'),
      qty: quantity || 1
    };

    try {
      sessionStorage.setItem('miraya_direct_checkout_item', JSON.stringify(directItem));
    } catch (_) {}

    const token = localStorage.getItem('token');
    const isLogged = localStorage.getItem('isLoggedIn') === 'true';
    if (!token || !isLogged) {
      toast.warning('Please sign in or create an account to proceed with your bespoke checkout.', 'SIGN IN REQUIRED');
      navigate('/auth', { state: { from: '/checkout', directProduct: directItem } });
      return;
    }

    navigate('/checkout', { state: { directProduct: directItem } });
  };

  const handleWhatsAppDetailsInquiry = () => {
    if (!product) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mirayabygarima.com';
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const productName = product?.title || product?.name || 'Outfit';
    const categoryName = product?.category?.name || product?.category || 'Haute Couture';
    const priceFormatted = product?.price ? `₹${typeof product.price === 'number' ? product.price.toLocaleString('en-IN') : product.price}` : '';
    const size = selectedSize || 'Free Size';
    const rawImg = product?.image || product?.image_url || (product?.images && product.images[0]) || '';
    const fullImgUrl = rawImg ? (rawImg.startsWith('http') ? rawImg : `${origin}${rawImg}`) : '';

    let text = `*PRODUCT INQUIRY — MIRAYA BY GARIMA*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `Hello! I am interested in this outfit and would like to get more details:\n\n`;
    text += `*Garment Name:* ${productName}\n`;
    if (categoryName) text += `*Category:* ${categoryName}\n`;
    if (priceFormatted) text += `*Price:* ${priceFormatted}\n`;
    if (size) text += `*Size:* ${size}\n`;
    if (quantity > 1) text += `*Quantity:* ${quantity}\n`;
    if (product?.fabric) text += `*Fabric:* ${product.fabric}\n`;
    if (product?.color) text += `*Color:* ${product.color}\n`;
    if (currentUrl) text += `*Product Link:* ${currentUrl}\n\n`;
    text += `Please share more details regarding availability, custom tailoring, and delivery timeline. Thank you!`;

    const cleanNum = (whatsapp_number || '+919271218156').replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
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
    const currentMaxStock = (selectedSize && sizeStockObj[selectedSize] !== undefined)
      ? Number(sizeStockObj[selectedSize])
      : Number(product?.stock ?? 1);
    
    if (quantity < currentMaxStock) {
      setQuantity(quantity + 1);
    } else {
      toast.warning(`Maximum available stock reached (${currentMaxStock} unit${currentMaxStock > 1 ? 's' : ''} in stock for size ${selectedSize || 'selected'}).`, 'STOCK LIMIT');
    }
  };

  const galleryImages = getProductGallery(product);

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
    const rawMrp = product.mrp_price;
    const numMrp = rawMrp
      ? (typeof rawMrp === 'number' ? rawMrp : parseInt(String(rawMrp).replace(/[^\d]/g, ''), 10) || null)
      : null;

    contextAddToCart({
      id: product.id,
      title: product.title || product.name || 'Outfit',
      price: isNaN(numPrice) ? 0 : numPrice,
      mrp_price: numMrp,
      promo_label: product.promo_label,
      discount_percent: product.discount_percent,
      is_on_sale: product.is_on_sale || (numMrp && numMrp > numPrice),
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
                    ...(imgStr.includes('4.JPG') ? { objectPosition: 'center 15%' } : {}),
                    ...(imgStr.includes('Black Color/2.JPG') ? { objectPosition: '30% center' } : {})
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
            {product.whatsapp_inquiry ? (
              <div style={{ margin: '0.5rem 0 1.2rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg, #e8f5e9, #f1fdf3)', border: '1px solid rgba(37,211,102,0.4)', borderRadius: '24px', padding: '8px 20px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.132.558 4.133 1.528 5.874L0 24l6.324-1.508A11.956 11.956 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.502-5.176-1.378l-.37-.22-3.754.895.952-3.645-.243-.381A9.959 9.959 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, color: '#1a7a42' }}>Price on Request</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#777', marginTop: '6px', fontFamily: 'var(--font-body)' }}>Contact us on WhatsApp to get the price for this piece.</p>
              </div>
            ) : (
              <>
                {product.whatsapp_inquiry || (product.price && String(product.price).toLowerCase().includes('whatsapp')) ? (
                  <div style={{ margin: '0.6rem 0 1.2rem' }}>
                    <button
                      type="button"
                      onClick={() => setWhatsAppOpen(true)}
                      style={{
                        background: '#25D366',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 24px',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
                        fontFamily: 'var(--font-body)',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.5)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 211, 102, 0.35)'; }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.132.558 4.133 1.528 5.874L0 24l6.324-1.508A11.956 11.956 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.502-5.176-1.378l-.37-.22-3.754.895.952-3.645-.243-.381A9.959 9.959 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                      DM ON WHATSAPP FOR PRICE
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', margin: '0.5rem 0 0.35rem' }}>
                      <div className="product-detail-price" style={{ fontSize: '1.85rem', fontFamily: 'var(--font-heading)', color: 'var(--primary-burgundy)', fontWeight: 700 }}>
                        {(() => {
                          if (product.price === undefined || product.price === null || product.price === '') return '';
                          const str = String(product.price).trim();
                          if (str.startsWith('₹')) return str;
                          const num = typeof product.price === 'number' ? product.price : parseInt(str.replace(/[^\d]/g, ''), 10);
                          if (isNaN(num)) return str;
                          return `₹${num.toLocaleString('en-IN')}`;
                        })()}
                      </div>

                      {product.mrp_price && Number(product.mrp_price) > Number(product.price) && (
                        <del style={{ fontSize: '1.25rem', color: '#999', textDecoration: 'line-through', fontWeight: 500 }}>
                          ₹{Number(product.mrp_price).toLocaleString('en-IN')}
                        </del>
                      )}

                      {(product.is_on_sale || (product.mrp_price && Number(product.mrp_price) > Number(product.price)) || product.discount_percent) && (
                        <span style={{
                          background: 'linear-gradient(135deg, #27ae60, #1e824c)',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                          boxShadow: '0 2px 8px rgba(39, 174, 96, 0.3)'
                        }}>
                          {product.promo_label || (product.discount_percent ? `${product.discount_percent}% OFF` : 'SPECIAL SALE')}
                        </span>
                      )}
                    </div>

                    <div className="product-tax-indicator" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#555', background: 'rgba(198, 164, 106, 0.12)', border: '1px solid rgba(198, 164, 106, 0.35)', padding: '3px 12px', borderRadius: '20px', marginBottom: '1.2rem', fontWeight: 600 }}>
                      <span>⚖️ Inclusive of 18% GST (CGST 9% + SGST 9%)</span>
                      <span style={{ color: '#1e824c', fontWeight: 700 }}>• Tax Invoice Included</span>
                    </div>
                  </>
                )}
              </>
            )}
            
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                <div className="size-selector" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px 12px', marginBottom: '10px' }}>
                    <span className="qty-label" style={{ margin: 0 }}>
                      Size: <span style={{ fontWeight: 600, color: 'var(--primary-burgundy)' }}>{selectedSize}</span>
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(231, 76, 60, 0.1)',
                      color: '#c0392b',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '12px',
                      border: '1px solid rgba(192, 57, 43, 0.25)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      ⚡ Only 1 Left in Stock
                    </span>
                  </div>
                  <div className="size-options" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {(product?.sizes && product.sizes.length > 0 ? product.sizes : ['Free Size (M to XL)']).map(size => {
                      const sizeStock = sizeStockObj[size] !== undefined ? sizeStockObj[size] : (product.stock ?? 1);
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
                            padding: '10px 20px',
                            border: selectedSize === size ? '1.5px solid var(--primary-burgundy)' : '1px solid #ddd',
                            backgroundColor: selectedSize === size ? 'rgba(94, 10, 11, 0.06)' : (isSoldOut ? 'rgba(0,0,0,0.03)' : 'white'),
                            color: isSoldOut ? '#bbb' : (selectedSize === size ? 'var(--primary-burgundy)' : '#333'),
                            textDecoration: isSoldOut ? 'line-through' : 'none',
                            borderRadius: '6px',
                            cursor: isSoldOut ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.92rem',
                            fontWeight: '700',
                            transition: 'all 0.3s ease',
                            boxShadow: selectedSize === size ? '0 2px 8px rgba(94, 10, 11, 0.15)' : 'none'
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

              <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%'}}>
                <div style={{display: 'flex', gap: '1.2rem', flexWrap: 'wrap', alignItems: 'stretch', width: '100%'}}>
                  {(sizeStockObj[selectedSize] !== undefined && sizeStockObj[selectedSize] <= 0) || (product.stock !== undefined && product.stock !== null && Number(product.stock) <= 0) ? (
                    <button className="inquire-btn-new" disabled style={{background: '#e74c3c', color: 'white', flex: 1, minWidth: '150px', cursor: 'not-allowed', whiteSpace: 'nowrap', margin: 0, fontWeight: 700, letterSpacing: '1px'}}>
                      OUT OF STOCK {selectedSize ? `(${selectedSize})` : ''}
                    </button>
                  ) : product.whatsapp_inquiry || isStoreOffline || (product.price && String(product.price).toLowerCase().includes('whatsapp')) ? (
                    <button
                      type="button"
                      onClick={() => setWhatsAppOpen(true)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        background: 'linear-gradient(135deg, #25D366, #1aab55)',
                        color: 'white', border: 'none', borderRadius: '6px',
                        padding: '14px 28px', fontSize: '0.95rem',
                        fontFamily: 'var(--font-body)', fontWeight: 700,
                        letterSpacing: '0.5px', flex: 1, minWidth: '200px',
                        cursor: 'pointer', boxShadow: '0 4px 16px rgba(37,211,102,0.35)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,211,102,0.5)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,211,102,0.35)'; }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.132.558 4.133 1.528 5.874L0 24l6.324-1.508A11.956 11.956 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.502-5.176-1.378l-.37-.22-3.754.895.952-3.645-.243-.381A9.959 9.959 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                      DM ON WHATSAPP FOR PRICE
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="inquire-btn-new"
                        onClick={handleCartButtonClick}
                        onMouseEnter={() => setIsCartHovered(true)}
                        onMouseLeave={() => setIsCartHovered(false)}
                        style={{
                          background: isItemInCart 
                            ? (isCartHovered ? '#c0392b' : '#F5EFE6') 
                            : 'var(--primary-burgundy)',
                          color: isItemInCart 
                            ? (isCartHovered ? '#ffffff' : 'var(--primary-burgundy, #5e0a0b)') 
                            : 'white',
                          border: isItemInCart
                            ? (isCartHovered ? '1.5px solid #c0392b' : '1.5px solid #c6a46a')
                            : '1.5px solid var(--primary-burgundy)',
                          fontWeight: 700,
                          flex: 1,
                          minWidth: '160px',
                          whiteSpace: 'nowrap',
                          margin: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.25s ease',
                          cursor: 'pointer',
                          boxShadow: isItemInCart 
                            ? (isCartHovered ? '0 4px 15px rgba(192, 57, 43, 0.35)' : '0 2px 8px rgba(198, 164, 106, 0.25)') 
                            : 'none'
                        }}
                        title={isItemInCart ? (isCartHovered ? "Click to remove from cart" : "In your shopping bag") : "Add to shopping bag"}
                      >
                        {isItemInCart ? (
                          isCartHovered ? (
                            <>
                              <Trash2 size={16} /> REMOVE
                            </>
                          ) : (
                            <>
                              <Check size={16} /> ADDED TO CART
                            </>
                          )
                        ) : (
                          <>
                            <ShoppingBag size={16} /> ADD TO CART
                          </>
                        )}
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

                <button
                  type="button"
                  onClick={handleWhatsAppDetailsInquiry}
                  style={{
                    width: '100%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.9rem 1.5rem',
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(37,211,102,0.3)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,211,102,0.45)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,211,102,0.3)'; }}
                  title="Get complete product details on WhatsApp"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0, display: 'block' }}>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                  <span>GET MORE DETAILS ON WHATSAPP</span>
                </button>
              </div>
            </div>

            {/* WhatsApp Inquiry Modal */}
            <WhatsAppOrderModal
              isOpen={whatsAppOpen}
              onClose={() => setWhatsAppOpen(false)}
              product={product}
              selectedSize={selectedSize}
            />

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
              <div className="badge">
                <RotateCcw size={16} color="#C6A46A" />
                <span>7-Day Size Exchange</span>
              </div>
            </div>


          </div>
        </div>
      </div>

      {/* Verified Customer Photo Reviews & Real Brides Section */}
      <ProductReviewsSection product={product} />

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        directProduct={checkoutDirectItem}
      />
    </div>
  );
};

export default ProductDetailPage;
