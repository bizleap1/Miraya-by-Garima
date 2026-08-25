'use client';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Eye, Trash2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import './WishlistPage.css';
import './CategoryPage.css';

const resolveProductLink = (item) => {
  if (!item) return '/collection/all';
  
  let cat = item.category || 'indo-western';
  let id = item.id;

  if (typeof id === 'string' && id.includes('-')) {
    const parts = id.split('-');
    const prefix = parts[0].toLowerCase();
    if (prefix === 'iw') cat = 'indo-western';
    else if (prefix === 'ds') cat = 'drape-sarees';
    else if (prefix === 'suit') cat = 'designer-suits';
    else if (prefix === 'psm') cat = 'premium-suit-materials';
    else if (prefix === 'cs' || prefix === 'coord') cat = 'coord-sets';
  } else if (!item.category && item.sub_category) {
    cat = item.sub_category.toLowerCase().replace(/\s+/g, '-');
  }

  return `/product/${cat}/${id}`;
};

const formatCurrency = (price) => {
  if (!price) return '';
  const str = String(price).trim();
  if (str.startsWith('₹')) return str;
  const num = typeof price === 'number' ? price : parseInt(str.replace(/[^\d]/g, ''), 10);
  if (isNaN(num)) return str;
  return `₹${num.toLocaleString('en-IN')}`;
};

const WishlistPage = () => {
  const { wishlist, toggleWishlist } = useWishlist();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [savedProducts, setSavedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSavedProducts(wishlist);
    setLoading(false);
  }, [wishlist]);

  const handleBuyNow = (item) => {
    navigate(resolveProductLink(item), { state: { product: item } });
  };

  const handleRemove = (item) => {
    toggleWishlist(item);
    toast.success('Removed from Wishlist', item.name || item.title);
  };

  return (
    <div className="wishlist-page">
      <div className="wishlist-header">
        <span className="wishlist-sub-badge">👑 PRIVATE ATELIER SELECTION</span>
        <h1>Your Wishlist</h1>
        <p>Curated selections for your unique style.</p>
        <div className="wishlist-filigree-divider">
          <span className="filigree-line"></span>
          <span className="filigree-diamond">◈</span>
          <span className="filigree-line"></span>
        </div>
      </div>

      <div className="container">
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <h2>Loading your wishlist...</h2>
          </div>
        ) : savedProducts.length > 0 ? (
          <>
            {/* Wishlist Top Toolbar */}
            <div className="wishlist-toolbar">
              <span className="wishlist-count-label">
                Saved Items: <strong>{savedProducts.length}</strong>
              </span>

              {savedProducts.length > 1 && (
                <button
                  type="button"
                  className="wishlist-clear-all-btn"
                  onClick={() => {
                    [...savedProducts].forEach((it) => toggleWishlist(it));
                    toast.success('Wishlist cleared', 'All items removed');
                  }}
                  title="Clear all saved items"
                >
                  <Trash2 size={13} /> Remove All
                </button>
              )}
            </div>

            <div className="premium-grid wishlist-grid">
              {savedProducts.map((item) => {
                const productUrl = resolveProductLink(item);
                const displayImg =
                  item.image || item.image_url || item.images?.[0] || '/products/Lehenga-Pink Blush/1.JPG';
                const displayTitle = item.name || item.title || 'Haute Couture Piece';

                return (
                  <div className="premium-card wishlist-card" key={item.id}>
                    <div className="card-image-wrapper">
                      <Link to={productUrl} state={{ product: item }} className="wishlist-img-link">
                        <img src={displayImg} alt={displayTitle} loading="lazy" />
                        <div className="card-overlay">
                          <span className="wishlist-view-badge">
                            <Eye size={14} /> View Piece
                          </span>
                        </div>
                      </Link>

                      {/* Top Corner Remove Heart Button */}
                      <button
                        type="button"
                        className="wishlist-btn active"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemove(item);
                        }}
                        aria-label="Remove from wishlist"
                        title="Remove from Wishlist"
                      >
                        <Heart size={16} fill="#5e0a0b" color="#5e0a0b" />
                      </button>
                    </div>

                    <div className="card-info wishlist-card-info">
                      <Link to={productUrl} state={{ product: item }} className="wishlist-title-link">
                        <h3>{displayTitle}</h3>
                      </Link>

                      {item.price && (
                        <div className="wishlist-price-wrap">
                          <span className="product-price">{formatCurrency(item.price)}</span>
                        </div>
                      )}

                      {/* Action Buttons: BUY NOW + REMOVE TRASH BUTTON */}
                      <div className="wishlist-actions-row">
                        <button
                          type="button"
                          className="wishlist-buy-now-btn"
                          onClick={() => handleBuyNow(item)}
                          title={`Buy ${displayTitle} now`}
                        >
                          <ShoppingBag size={14} /> BUY NOW
                        </button>

                        <button
                          type="button"
                          className="wishlist-remove-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemove(item);
                          }}
                          title="Remove from Wishlist"
                          aria-label="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="empty-wishlist">
            <h2>Your wishlist is empty</h2>
            <p>Looks like you haven't added any items yet.</p>
            <Link to="/collection/all" className="premium-link">
              Explore Collections <span className="arrow">⟶</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
