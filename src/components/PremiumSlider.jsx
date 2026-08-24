'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, ShoppingBag, Eye, Heart, MessageCircle, Crown, ShieldCheck } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import './PremiumSlider.css';

const PREMIUM_PIECES = [
  {
    id: 'iw-1',
    category: 'indo-western',
    title: 'Pink Blush Lehenga',
    tagline: 'Handcrafted Zari & Fine Sequin Embroidery',
    craftStory: 'Intricately spun over 120 artisan hours with blush rose georgette and crushed metallic panels.',
    price: '₹16,191',
    originalPrice: '₹19,999',
    image: '/products/Lehenga-Pink Blush/1.JPG',
    angles: [
      '/products/Lehenga-Pink Blush/1.JPG',
      '/products/Lehenga-Pink Blush/2.JPG',
      '/products/Lehenga-Pink Blush/3.JPG'
    ],
    fabric: 'Crush Fabrics & Georgette',
    color: 'Blush Rose & Antique Gold',
    artisanHours: '120+ Artisan Hours',
    badge: 'ROYAL SIGNATURE'
  },
  {
    id: 'iw-3',
    category: 'indo-western',
    title: 'Golden Mukaish Lehenga',
    tagline: 'Tissue Silk & Imperial Metallic Brocade',
    craftStory: 'Woven with pure metallic threads and hand-finished Mukaish motifs fit for royal nuptials.',
    price: '₹18,891',
    originalPrice: '₹22,500',
    image: '/products/Lehenga-Golden/1.JPG',
    angles: [
      '/products/Lehenga-Golden/1.JPG',
      '/products/Lehenga-Golden/2.JPG',
      '/products/Lehenga-Golden/3.JPG'
    ],
    fabric: 'Tissue Silk & Brocade',
    color: 'Imperial Gold',
    artisanHours: '140+ Artisan Hours',
    badge: 'IMPERIAL BRIDAL'
  },
  {
    id: 'iw-2',
    category: 'indo-western',
    title: 'Light Purple Lehenga',
    tagline: 'Organza Silk & Fine Threadwork Embroidery',
    craftStory: 'Delicately handcrafted with soft lilac organza panels, intricate resham threads and subtle crystal highlights.',
    price: '₹15,831',
    originalPrice: '₹18,999',
    image: '/products/Lehenga-Light Purple/1.JPG',
    angles: [
      '/products/Lehenga-Light Purple/1.JPG',
      '/products/Lehenga-Light Purple/2.JPG',
      '/products/Lehenga-Light Purple/3.JPG'
    ],
    fabric: 'Crush Fabrics & Organza Silk',
    color: 'Lavender Mist & Lilac',
    artisanHours: '105+ Artisan Hours',
    badge: 'ROYAL PASTEL'
  },
  {
    id: 'ds-1',
    category: 'drape-sarees',
    title: 'Grey Drape Saree',
    tagline: 'Pre-stitched Pleats & Embroidered Crystal Belt',
    craftStory: 'Sculptural contemporary drape combining easy pre-stitched flow with shimmering zardozi belt.',
    price: '₹22,681',
    originalPrice: '₹26,500',
    image: '/products/Drape Saree-Grey Color/1.JPG',
    angles: [
      '/products/Drape Saree-Grey Color/1.JPG',
      '/products/Drape Saree-Grey Color/2.JPG',
      '/products/Drape Saree-Grey Color/3.JPG'
    ],
    fabric: 'Crush Fabrics & Silk Sheen',
    color: 'Slate Grey & Silver Wire',
    artisanHours: '80+ Artisan Hours',
    badge: 'CELEBRITY EDIT'
  }
];

const PremiumSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeAngleIdx, setActiveAngleIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { toast } = useToast();
  const navigate = useNavigate();
  const slideTimerRef = useRef(null);

  const total = PREMIUM_PIECES.length;
  const currentItem = PREMIUM_PIECES[currentIndex];

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  const nextSlide = () => {
    setDirection(1);
    setActiveAngleIdx(0);
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const prevSlide = () => {
    setDirection(-1);
    setActiveAngleIdx(0);
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const goToSlide = (idx) => {
    setDirection(idx > currentIndex ? 1 : -1);
    setActiveAngleIdx(0);
    setCurrentIndex(idx);
  };

  // Touch Swipe Gesture Detection for Mobile
  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;
    
    // Only trigger horizontal swipe if horizontal movement is greater than vertical movement
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0) {
        // Swiped Left -> Next Slide
        nextSlide();
      } else {
        // Swiped Right -> Previous Slide
        prevSlide();
      }
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Auto-play interval
  useEffect(() => {
    if (isPaused) return;
    slideTimerRef.current = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(slideTimerRef.current);
  }, [isPaused, currentIndex]);

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
      scale: 0.97
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
    },
    exit: (dir) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
      scale: 0.97,
      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
    })
  };

  const currentActiveImg = currentItem.angles?.[activeAngleIdx] || currentItem.image;

  return (
    <section 
      className="premium-slider-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Seamless Royal Background */}
      <div className="slider-gold-aura-left" />
      <div className="slider-gold-aura-center" />
      <div className="slider-gold-aura-right" />

      <div className="container premium-slider-container">
        
        {/* Royal Section Header */}
        <div className="premium-slider-header">
          <div className="premium-header-badge">
            <Crown size={14} className="gold-crown-icon" />
            <span>THE ATELIER SPOTLIGHT • 4 MASTERPIECES</span>
          </div>
          
          <h2 className="premium-slider-title">
            Curated Royal <span className="script-font">Couture</span>
          </h2>

          <div className="royal-filigree-divider">
            <span className="filigree-line"></span>
            <span className="filigree-diamond">❖</span>
            <span className="filigree-line"></span>
          </div>

          <p className="premium-slider-subtitle">
            An exclusive runway showcase of hand-embroidered silhouettes, imperial brocades, and bespoke couture crafted in Nagpur Atelier.
          </p>
        </div>

        {/* Main Sliding Stage */}
        <div className="premium-slider-stage">
          
          {/* Navigation Arrow Left */}
          <button 
            type="button" 
            className="slider-nav-btn prev-btn" 
            onClick={prevSlide}
            aria-label="Previous Luxury Garment"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Active Featured Slide Card with Mobile Touch Gestures & Drag */}
          <div 
            className="slider-card-wrapper"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div 
                key={currentItem.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipeThreshold = 40;
                  if (offset.x < -swipeThreshold || velocity.x < -300) {
                    nextSlide();
                  } else if (offset.x > swipeThreshold || velocity.x > 300) {
                    prevSlide();
                  }
                }}
                className="premium-slide-card"
              >
                {/* Visual Royal Arch Column */}
                <div className="slide-image-col">
                  <div className="slide-arch-frame">
                    <img 
                      src={currentActiveImg} 
                      alt={currentItem.title}
                      className="slide-main-img" 
                    />
                    <div className="slide-royal-sheen" />
                    
                    {/* Gold Label Ribbon */}
                    <div className="slide-badge-ribbon">
                      <Sparkles size={11} />
                      <span>{currentItem.badge}</span>
                    </div>

                    {/* Interactive Angle Switcher Thumbnails on Image */}
                    {currentItem.angles && currentItem.angles.length > 1 && (
                      <div className="slide-angles-selector">
                        {currentItem.angles.map((ang, aIdx) => (
                          <button
                            key={aIdx}
                            type="button"
                            className={`angle-dot-btn ${aIdx === activeAngleIdx ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveAngleIdx(aIdx);
                            }}
                            title={`View Angle ${aIdx + 1}`}
                          >
                            <img src={ang} alt={`Angle ${aIdx + 1}`} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Column */}
                <div className="slide-info-col">
                  
                  {/* Top Category & Artisan Tag */}
                  <div className="slide-meta-row">
                    <span className="slide-category-tag">
                      {currentItem.category.replace('-', ' ').toUpperCase()} • ATELIER PIECE
                    </span>
                    <span className="slide-artisan-tag">
                      <ShieldCheck size={13} color="#C6A46A" /> {currentItem.artisanHours}
                    </span>
                  </div>
                  
                  <h3 className="slide-title">{currentItem.title}</h3>
                  
                  <p className="slide-tagline">{currentItem.tagline}</p>

                  <div className="slide-price-bar">
                    <div className="price-group">
                      <span className="slide-price-current">{currentItem.price}</span>
                      <span className="slide-price-original">{currentItem.originalPrice}</span>
                    </div>
                    <span className="slide-save-tag">EXCLUSIVE PRICE</span>
                  </div>

                  {/* Craft Story Quote */}
                  <div className="slide-craft-quote">
                    <p>"{currentItem.craftStory}"</p>
                  </div>

                  {/* Specifications Grid */}
                  <div className="slide-specs-grid">
                    <div className="slide-spec-item">
                      <span className="spec-label">FABRIC</span>
                      <span className="spec-val">{currentItem.fabric}</span>
                    </div>
                    <div className="slide-spec-item">
                      <span className="spec-label">PALETTE</span>
                      <span className="spec-val">{currentItem.color}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="slide-actions-bar">
                    <button
                      type="button"
                      className="slide-buy-now-btn"
                      onClick={() => navigate(`/product/${currentItem.category}/${currentItem.id}`)}
                    >
                      <ShoppingBag size={16} /> BUY NOW
                    </button>

                    <Link
                      to={`/product/${currentItem.category}/${currentItem.id}`}
                      className="slide-view-btn"
                    >
                      <Eye size={16} /> VIEW DETAILS
                    </Link>

                    {/* Wishlist Button in Actions Bar (Clean & Never Cut Off) */}
                    <button
                      type="button"
                      className={`slide-wishlist-action-btn ${isInWishlist(currentItem.id) ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(currentItem);
                        toast.success(
                          isInWishlist(currentItem.id) ? 'Removed from Wishlist' : 'Saved to Wishlist',
                          currentItem.title
                        );
                      }}
                      title={isInWishlist(currentItem.id) ? "Remove from Wishlist" : "Save to Wishlist"}
                      aria-label="Wishlist"
                    >
                      <Heart size={18} fill={isInWishlist(currentItem.id) ? '#5e0a0b' : 'none'} color={isInWishlist(currentItem.id) ? '#5e0a0b' : '#5e0a0b'} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Arrow Right */}
          <button 
            type="button" 
            className="slider-nav-btn next-btn" 
            onClick={nextSlide}
            aria-label="Next Luxury Garment"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Bottom Thumbnail Selector & Dots */}
        <div className="premium-slider-footer">
          <div className="slider-thumbs-row">
            {PREMIUM_PIECES.map((piece, idx) => (
              <button
                key={piece.id}
                type="button"
                className={`slider-thumb-card ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(idx)}
              >
                <div className="thumb-img-wrapper">
                  <img src={piece.image} alt={piece.title} className="thumb-img" />
                </div>
                <div className="thumb-info">
                  <div className="thumb-header">
                    <span className="thumb-num">NO. 0{idx + 1}</span>
                    <span className="thumb-price">{piece.price}</span>
                  </div>
                  <span className="thumb-title">{piece.title}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Mobile Swipe Navigation Controls & Progress Dots */}
          <div className="mobile-slider-controls">
            <button 
              type="button" 
              className="mobile-swipe-arrow-btn" 
              onClick={prevSlide}
              aria-label="Previous Garment"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="slider-dots-mobile">
              {PREMIUM_PIECES.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  className={`slider-dot-item ${dotIdx === currentIndex ? 'active' : ''}`}
                  onClick={() => goToSlide(dotIdx)}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                >
                  <span className="dot-fill"></span>
                </button>
              ))}
            </div>

            <button 
              type="button" 
              className="mobile-swipe-arrow-btn" 
              onClick={nextSlide}
              aria-label="Next Garment"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="mobile-swipe-hint">
            <span>⟵ Swipe left or right to explore ⟶</span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default PremiumSlider;
