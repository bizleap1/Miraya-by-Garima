'use client';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, ArrowRight, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getProductImage } from '../utils/imageHelper';
import './CheckoutModal.css';

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

export default function CheckoutModal({ isOpen, onClose }) {
  const { cartItems, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  // Subtotal Calculation
  const subtotal = cartItems.reduce((acc, item) => {
    const priceNum = typeof item.price === 'number'
      ? item.price
      : parseInt(String(item.price || 0).replace(/[^\d]/g, ''), 10);
    return acc + (priceNum * (item.qty || 1));
  }, 0);

  const handleProceedToCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div className={`checkout-modal-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div 
        className="cart-drawer-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="cart-drawer-header">
          <div className="cart-drawer-title">
            <ShoppingBag className="gold-accent-icon" size={22} />
            <h2>Shopping Bag ({cartItems.length})</h2>
          </div>
          <button className="cm-close-btn" onClick={onClose} title="Close Bag">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="cart-drawer-body">
          {cartItems.length === 0 ? (
            <div className="cart-empty-state">
              <ShoppingBag size={48} color="#e0d4c3" />
              <h3>Your shopping bag is empty</h3>
              <button className="cd-continue-btn" onClick={onClose}>
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item, index) => {
              const priceNum = typeof item.price === 'number'
                ? item.price
                : parseInt(String(item.price || 0).replace(/[^\d]/g, ''), 10);

              const itemImage = getProductImage(item.image || item.image_url || (item.images && item.images[0]));

              return (
                <div key={index} className="cart-drawer-item">
                  <img src={itemImage} alt={item.title || item.name || 'Product'} className="cd-item-img" />
                  
                  <div className="cd-item-details">
                    <h4 className="cd-item-title" title={item.title || item.name || 'Product'}>
                      {(() => {
                        const t = item.title || item.name || 'Product';
                        return t.length > 22 ? t.substring(0, 22) + '...' : t;
                      })()}
                    </h4>
                    
                    <p className="cd-item-meta">
                      Size: {item.selectedSize || item.size || 'Free Size (M to XL)'}
                    </p>
                    
                    <div className="cd-item-price" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{formatINR(priceNum)}</span>
                      {item.mrp_price && Number(item.mrp_price) > priceNum && (
                        <del style={{ fontSize: '0.78rem', color: '#999', textDecoration: 'line-through', fontWeight: 400 }}>
                          {formatINR(item.mrp_price)}
                        </del>
                      )}
                    </div>
                    
                    <div className="cd-qty-controls">
                      <button
                        className="cd-qty-btn"
                        onClick={() => updateQuantity(item.id, item.selectedSize || item.size, Math.max(1, (item.qty || 1) - 1))}
                        disabled={(item.qty || 1) <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="cd-qty-display">{item.qty || 1}</span>
                      <button
                        className="cd-qty-btn"
                        onClick={() => updateQuantity(item.id, item.selectedSize || item.size, (item.qty || 1) + 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <button 
                    className="cd-remove-btn" 
                    onClick={() => removeFromCart(item.id, item.selectedSize || item.size)}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        {cartItems.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cd-subtotal">
              <span>Subtotal</span>
              <span className="cd-subtotal-val">{formatINR(subtotal)}</span>
            </div>
            
            <button className="cd-checkout-btn" onClick={handleProceedToCheckout}>
              PROCEED TO CHECKOUT <ArrowRight size={18} />
            </button>
            
            <button className="cd-continue-btn" onClick={onClose}>
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
