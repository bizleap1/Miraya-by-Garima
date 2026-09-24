'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './Collections.css';
import '../views/CategoryPage.css';

import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { Heart, ShoppingBag, Check, Trash2 } from 'lucide-react';
import { productsData } from '../data/products';

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

const collectionsData = [pinkBlush, greyDrape, purpleSuit, greyCoord];

const Collections = ({
  title = "New Arrivals",
  tagline = "THE LATEST FROM MIRAYA"
} = {}) => {

  const { cartItems, addToCart, removeFromCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { showToast } = useToast();
  const [hoveredCartCardId, setHoveredCartCardId] = useState(null);

  const formatPrice = (priceStr) => {
    if (!priceStr) return '';
    return priceStr.toString().startsWith('₹') ? priceStr : `₹${priceStr}`;
  };

  const handleToggleCartItem = (item) => {
    const existingItem = cartItems.find(ci => String(ci.id) === String(item.id));
    if (existingItem) {
      removeFromCart(existingItem.id, existingItem.selectedSize);
    } else {
      addToCart({ ...item, size: item.sizes?.[0] || 'Free Size', quantity: 1 });
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
