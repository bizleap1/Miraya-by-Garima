'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './Collections.css';
import '../views/CategoryPage.css';

import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { Heart, ShoppingBag, Check, Trash2 } from 'lucide-react';
import { productsData } from '../data/products';
import API_URL from '../config';

// Extract the 4 specific products requested by the user
const getProduct = (category, idNum) => {
  const catProducts = productsData[category] || [];
  // Try to match the numeric ID (e.g., '1' from 'iw-1' or just find by index if needed)
  // Actually, we know the exact IDs: iw-1, ds-1, suit-2, coord-1 based on data structure
  return catProducts.find(p => p.id === `${category === 'indo-western' ? 'iw' : category === 'drape-sarees' ? 'ds' : category === 'designer-suits' ? 'suit' : 'coord'}-${idNum}`) || catProducts[0];
};

// Based on requested URLs:
// /product/indo-western/1 -> iw-1 (Pink Blush Lehenga)
// /product/drape-sarees/5 -> ds-5 ? Wait, is it ds-5? In products.js, ds-1 is Grey Drape Saree. Let's use ds-1.
// /product/designer-suits/9 -> suit-9? Purple suit is suit-2 in products.js.
// /product/coord-sets/14 -> coord-14? Grey Co-ord Set is coord-1 in products.js.
// I will just fetch them by the exact title or fallback to the first in category just in case.

const pinkBlush = productsData['indo-western'].find(p => p.title === 'Pink Blush Lehenga') || productsData['indo-western'][0];
const greyDrape = productsData['drape-sarees'].find(p => p.title === 'Grey Drape Saree') || productsData['drape-sarees'][0];
const purpleSuit = productsData['designer-suits'].find(p => p.title === 'Purple Suit') || productsData['designer-suits'][1];
const greyCoord = productsData['coord-sets'].find(p => p.title === 'Grey Co-ord Set') || productsData['coord-sets'][0];

const defaultCollectionsData = [pinkBlush, greyDrape, purpleSuit, greyCoord].filter(Boolean);

const Collections = ({
  title = "New Arrivals",
  tagline = "THE LATEST FROM MIRAYA"
} = {}) => {

  const { cartItems, addToCart, removeFromCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { showToast } = useToast();
  
  const [collectionsData, setCollectionsData] = useState(defaultCollectionsData);

  useEffect(() => {
    if (title === "New Arrivals") {
      fetch(`${API_URL}/api/page-customizer/new-arrivals`)
        .then(res => res.json())
        .then(data => {
          if (data && data.products && data.products.length > 0) {
            // Map the API products to match frontend structure if needed, or just use them
            // The API returns full product rows from the database.
            // We should ensure they have the same format as local products (id, title, price, category, images)
            const apiProducts = data.products.map(p => ({
              ...p,
              id: p.id, // String ID
              title: p.name || p.title,
              price: p.base_price || p.price,
              images: p.images ? (typeof p.images === 'string' ? JSON.parse(p.images) : p.images) : [p.image_url],
              image: p.image_url || (p.images && p.images.length > 0 ? (typeof p.images === 'string' ? JSON.parse(p.images)[0] : p.images[0]) : ''),
              category: (p.category && p.category.name) ? p.category.name.toLowerCase().replace(/\s+/g, '-') : (typeof p.category === 'string' ? p.category : 'all'),
            }));
            setCollectionsData(apiProducts);
          }
        })
        .catch(err => console.error("Failed to fetch custom collections:", err));
    }
  }, [title]);

  const [hoveredCartCardId, setHoveredCartCardId] = useState(null);
  const [expandedCartCardId, setExpandedCartCardId] = useState(null);

  const formatPrice = (priceStr) => {
    if (!priceStr) return '';
    return priceStr.toString().startsWith('₹') ? priceStr : `₹${priceStr}`;
  };

  const handleToggleCartItem = (item) => {
    const existingItem = cartItems.find(ci => String(ci.id) === String(item.id) || ci.productId === item.id);
    if (existingItem) {
      const chosenSize = item.sizes && item.sizes.length > 0 ? item.sizes[0] : 'Free Size (M to XL)';
      removeFromCart(item.id, chosenSize);
      showToast('Removed from cart');
      return;
    }

    // For items with Free Size, don't ask for size, add directly
    if (item.category === 'drape-sarees' || item.category === 'premium-suit-materials' || (item.sizes && item.sizes.length === 1 && item.sizes[0] === 'Free Size')) {
      addToCart({ ...item, size: 'Free Size', quantity: 1 });
      showToast('Added to cart!');
      return;
    }

    // Expand card for size selection
    if (expandedCartCardId === item.id) {
      setExpandedCartCardId(null);
    } else {
      setExpandedCartCardId(item.id);
    }
  };

  const handleWishlistToggle = (item, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isCurrentlyWishlisted = isInWishlist(item.id);
    toggleWishlist(item);
    if (showToast) {
      showToast(isCurrentlyWishlisted ? "Removed from wishlist" : "Added to wishlist");
    }
  };

  return (
    <section id="collections" className="section collections-section">
      <div className="collections-bg-ornament" />
      
      <div className="container">
        
        <div className="collection-header-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="style-guide-label">
              <span className="line" />
              {tagline}
              <span className="line" />
            </div>
            <h2 className="collection-main-title">
              {title === "New Arrivals" ? (
                <>New <i>Arrivals</i></>
              ) : title === "Our Collections" ? (
                <>Our <i>Collections</i></>
              ) : (
                <>{title}</>
              )}
            </h2>
          </motion.div>
        </div>

        <div className="collections-compact-grid">
          {collectionsData.map((item, index) => {
            if (!item) return null;
            const isHovered = hoveredCartCardId === item.id;
            const existingItem = cartItems.find(ci => String(ci.id) === String(item.id));
            const inCart = !!existingItem;
            const isWishlisted = isInWishlist(item.id);
            
            return (
              <motion.div 
                key={item.id}
                className="premium-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
              >
                <div className="card-image-wrapper">
                  <Link to={`/product/${item.category}/${item.id}`} className="card-image-link" onClick={() => window.scrollTo(0, 0)}>
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      loading="lazy" 
                      className="card-product-img"
                    />
                  </Link>
                </div>
                <div className="card-info">
                  <div className="card-info-main-row">
                    <div className="card-text-col">
                      <Link to={`/product/${item.category}/${item.id}`} className="card-title-link" onClick={() => window.scrollTo(0, 0)}>
                        <h3 className="card-product-title">{item.title}</h3>
                      </Link>
                      <span className="card-category-kicker">
                        {item.category.replace('-', ' ').toUpperCase()}
                      </span>
                      <div className="card-pricing-row">
                        <span className="product-price">{formatPrice(item.price)}</span>
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
                                addToCart({ ...item, size, quantity: 1 });
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
        </div>

      </div>
    </section>
  );
};

export default Collections;
