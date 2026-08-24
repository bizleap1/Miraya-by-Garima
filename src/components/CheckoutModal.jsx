'use client';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle, ShieldCheck, Truck, CreditCard, Download, ArrowRight, Tag, Lock, MapPin, Package, Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import API_URL from '../config';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useLoading } from '../context/LoadingContext';
import './CheckoutModal.css';

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

export default function CheckoutModal({ isOpen, onClose, directProduct = null }) {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { toast } = useToast();
  const { showLoading, hideLoading } = useLoading();
  const navigate = useNavigate();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Checkout Items: Either direct item from "Buy Now" or full Cart
  const itemsToBuy = directProduct
    ? [{ ...directProduct, selectedSize: directProduct.selectedSize || 'M', qty: directProduct.qty || 1 }]
    : cartItems;

  // Form State
  const [step, setStep] = useState(1); // 1: Shipping & Summary, 2: Payment, 3: Success Confirmation
  const [shippingForm, setShippingForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' or 'cod'
  const [isProcessing, setIsProcessing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Auto-fill logged in user info
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setShippingForm(prev => ({
          ...prev,
          fullName: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || '',
          email: u.email || '',
          phone: u.phone || ''
        }));
      } catch (e) {}
    }
  }, [isOpen]);


  // Subtotal Calculation
  const subtotal = itemsToBuy.reduce((acc, item) => {
    const priceNum = typeof item.price === 'number'
      ? item.price
      : parseInt(String(item.price || 0).replace(/[^\d]/g, ''), 10);
    return acc + (priceNum * (item.qty || 1));
  }, 0);

  const finalTotal = Math.max(0, subtotal - discountAmount);

  // Apply Coupon Code via backend API
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const codeUpper = couponCode.trim().toUpperCase();

    try {
      const res = await fetch(`${API_URL}/api/coupons/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeUpper, cartTotal: subtotal })
      });
      const data = await res.json();

      if (res.ok && data.discountAmount !== undefined) {
        setDiscountAmount(data.discountAmount);
        setCouponApplied(true);
        toast.coupon(`Discount Applied! You saved ${formatINR(data.discountAmount)}.`, 'PROMO APPLIED');
        return;
      } else if (data.message) {
        toast.error(data.message, 'INVALID COUPON');
        return;
      }
    } catch (err) {
      console.warn("Backend coupon validation fallback:", err);
    }

    if (codeUpper === 'MIRAYA10' || codeUpper === 'WELCOME10') {
      const discount = Math.round(subtotal * 0.10);
      setDiscountAmount(discount);
      setCouponApplied(true);
      toast.coupon(`10% Luxury Discount Applied! You saved ${formatINR(discount)}.`, 'PROMO APPLIED');
    } else if (codeUpper === 'LUXURY500') {
      setDiscountAmount(500);
      setCouponApplied(true);
      toast.coupon('₹500 Atelier Privilege Applied!', 'PROMO APPLIED');
    } else {
      toast.error('Invalid or inactive coupon code.', 'INVALID COUPON');
    }
  };

  // Download Invoice PDF directly via Blob
  const handleDownloadInvoice = async (orderId) => {
    if (!orderId) return;
    setIsDownloadingPdf(true);
    try {
      const currentToken = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/orders/${orderId}/invoice`, {
        headers: {
          ...(currentToken && { Authorization: `Bearer ${currentToken}` })
        }
      });

      if (!res.ok) {
        throw new Error('Failed to generate PDF invoice');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Miraya_Invoice_#MRY-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Tax invoice PDF downloaded successfully!', 'INVOICE READY');
    } catch (err) {
      console.error('Invoice download failed:', err);
      toast.error('Could not download PDF invoice. Please try again.', 'DOWNLOAD FAILED');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const [showCodConfirmModal, setShowCodConfirmModal] = useState(false);

  if (!isOpen) return null;

  // Trigger Razorpay Payment or COD Confirmation
  const handlePlaceOrder = async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      toast.warning('Please Sign In to place your order and track in Order History.', 'AUTHENTICATION');
      onClose();
      navigate('/auth');
      return;
    }

    if (!shippingForm.fullName || !shippingForm.phone || !shippingForm.line1 || !shippingForm.city || !shippingForm.pincode) {
      toast.warning('Please fill out all required shipping fields marked with *.', 'SHIPPING DETAILS');
      return;
    }

    if (paymentMethod === 'cod') {
      // Require explicit user confirmation before placing COD order
      setShowCodConfirmModal(true);
      return;
    }

    await executeOrderPlacement();
  };

  const executeOrderPlacement = async () => {
    setIsProcessing(true);

    try {
      const orderPayload = {
        items: itemsToBuy.map(item => ({
          product_id: typeof item.id === 'string' && item.id.includes('-') ? parseInt(item.id.split('-').pop(), 10) || 1 : (parseInt(item.id, 10) || 1),
          productId: typeof item.id === 'string' && item.id.includes('-') ? parseInt(item.id.split('-').pop(), 10) || 1 : (parseInt(item.id, 10) || 1),
          quantity: item.qty || 1,
          size: item.selectedSize || 'M',
          price: typeof item.price === 'number' ? item.price : parseInt(String(item.price).replace(/[^\d]/g, ''), 10)
        })),
        total: finalTotal,
        address: `${shippingForm.line1}, ${shippingForm.line2 || ''}, ${shippingForm.city}, ${shippingForm.state} - ${shippingForm.pincode}`,
        shippingDetails: shippingForm,
        paymentMethod: paymentMethod
      };

      if (paymentMethod === 'razorpay') {
        const loadScript = () => {
          return new Promise((resolve) => {
            if (window.Razorpay) { resolve(true); return; }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
          });
        };

        const res = await loadScript();
        if (!res) {
          toast.warning('Razorpay SDK unavailable. Proceeding with direct order.', 'GATEWAY NOTICE');
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TO10SlvSmqJqhX',
          amount: finalTotal * 100,
          currency: 'INR',
          name: 'Miraya By Garima',
          description: 'Luxury Ethnic Wear Order',
          image: '/logoR.png',
          handler: async function (response) {
            await createOrderBackend({ ...orderPayload, paymentId: response.razorpay_payment_id });
          },
          prefill: {
            name: shippingForm.fullName,
            email: shippingForm.email,
            contact: shippingForm.phone
          },
          theme: {
            color: '#5e0a0b'
          }
        };

        if (window.Razorpay) {
          const rzp = new window.Razorpay(options);
          rzp.open();
          setIsProcessing(false);
          return;
        }
      }

      await createOrderBackend(orderPayload);

    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Order placement error: ' + (err.message || 'Server error'), 'CHECKOUT ERROR');
      setIsProcessing(false);
    }
  };

  const createOrderBackend = async (payload) => {
    showLoading('Processing Your Order...');
    try {
      const currentToken = localStorage.getItem('token');

      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken && { Authorization: `Bearer ${currentToken}` })
        },
        body: JSON.stringify(payload)
      });

      const rawJson = await res.json().catch(() => ({}));

      if (res.ok && (rawJson.order || rawJson.id)) {
        const orderData = rawJson.order || rawJson;
        setPlacedOrder(orderData);

        // Backup order to localStorage so it always shows up in Account history
        try {
          const savedOrders = JSON.parse(localStorage.getItem('miraya_orders') || '[]');
          savedOrders.unshift(orderData);
          localStorage.setItem('miraya_orders', JSON.stringify(savedOrders));
        } catch (err) {}

        clearCart();
        setStep(3);
        toast.success(`Order #MRY-${orderData.id} placed successfully!`, 'ORDER CONFIRMED');
      } else {
        const errMsg = rawJson.message || rawJson.msg || 'Order creation failed. Please check your cart or login session.';
        toast.error(errMsg, 'ORDER FAILED');
      }
    } catch (e) {
      console.error('Checkout error:', e);
      toast.error('Network error while placing order. Please check your connection.', 'ORDER FAILED');
    } finally {
      setIsProcessing(false);
      hideLoading();
    }
  };

  return (
    <>
      <div className="checkout-modal-backdrop" onClick={onClose}>
        <div className="checkout-modal-card" onClick={e => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div className="checkout-modal-header">
          <div className="cm-title">
            <Lock size={18} className="gold-accent-icon" />
            <h2>{step === 3 ? 'Order Confirmed!' : 'Secure Express Checkout'}</h2>
          </div>
          <button className="cm-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* EMPTY CART VIEW */}
        {itemsToBuy.length === 0 && step !== 3 ? (
          <div className="empty-cart-modal-view" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <Package size={56} style={{ color: '#c6a46a', marginBottom: '1rem', opacity: 0.8 }} />
            <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#5e0a0b', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Your Shopping Bag is Empty
            </h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.8rem', maxWidth: '360px', margin: '0 auto 1.8rem auto' }}>
              Explore our bespoke Haute Couture, Lehengas, Sarees, and Kurtas to add items to your cart.
            </p>
            <button
              onClick={() => {
                onClose();
                navigate('/collection/all');
              }}
              style={{
                background: 'linear-gradient(135deg, #5e0a0b 0%, #3a0405 100%)',
                color: '#fff',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '30px',
                fontWeight: '700',
                fontSize: '0.85rem',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(94, 10, 11, 0.3)'
              }}
            >
              EXPLORE COLLECTION
            </button>
          </div>
        ) : (
          <>
            {/* PROGRESS STEPPER */}
            {step !== 3 && (
              <div className="checkout-stepper">
                <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
                  <span className="step-num">1</span>
                  <span>Shipping & Summary</span>
                </div>
                <div className="step-line"></div>
                <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
                  <span className="step-num">2</span>
                  <span>Payment</span>
                </div>
              </div>
            )}

            {/* STEP 1: SHIPPING DETAILS & ORDER SUMMARY */}
            {step === 1 && (
              <div className="checkout-body-grid">
            {/* LEFT: SHIPPING FORM */}
            <div className="checkout-left-form">
              <h3><MapPin size={16} /> Shipping & Delivery Address</h3>
              <div className="checkout-form-group">
                <input
                  type="text"
                  placeholder="Full Name *"
                  required
                  value={shippingForm.fullName}
                  onChange={e => setShippingForm({ ...shippingForm, fullName: e.target.value })}
                />
                <div className="form-row-2">
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    required
                    value={shippingForm.phone}
                    onChange={e => setShippingForm({ ...shippingForm, phone: e.target.value })}
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={shippingForm.email}
                    onChange={e => setShippingForm({ ...shippingForm, email: e.target.value })}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Flat, House no., Building, Apartment *"
                  required
                  value={shippingForm.line1}
                  onChange={e => setShippingForm({ ...shippingForm, line1: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Area, Street, Sector, Village (Optional)"
                  value={shippingForm.line2}
                  onChange={e => setShippingForm({ ...shippingForm, line2: e.target.value })}
                />
                <div className="form-row-3">
                  <input
                    type="text"
                    placeholder="City *"
                    required
                    value={shippingForm.city}
                    onChange={e => setShippingForm({ ...shippingForm, city: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="State *"
                    required
                    value={shippingForm.state}
                    onChange={e => setShippingForm({ ...shippingForm, state: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Pincode *"
                    required
                    value={shippingForm.pincode}
                    onChange={e => setShippingForm({ ...shippingForm, pincode: e.target.value })}
                  />
                </div>
              </div>

              <button
                className="btn-next-step"
                onClick={() => {
                  if (!shippingForm.fullName || !shippingForm.phone || !shippingForm.line1 || !shippingForm.city || !shippingForm.pincode) {
                    toast.warning('Please fill out all required shipping fields marked with *', 'SHIPPING DETAILS');
                    return;
                  }
                  setStep(2);
                }}
              >
                PROCEED TO PAYMENT <ArrowRight size={16} />
              </button>
            </div>

            {/* RIGHT: ORDER SUMMARY & PROMO BOX */}
            <div className="checkout-right-summary">
              <h3><Package size={16} /> Order Summary ({itemsToBuy.length} items)</h3>
              <div className="checkout-items-list">
                {itemsToBuy.map((item, idx) => {
                  const itemPriceNum = typeof item.price === 'number'
                    ? item.price
                    : parseInt(String(item.price || 0).replace(/[^\d]/g, ''), 10);
                  const currentQty = item.qty || 1;
                  const itemTotal = itemPriceNum * currentQty;
                  const sizeVal = item.selectedSize || item.size || 'M';

                  return (
                    <div key={item._cartId || `${item.id}-${sizeVal}-${idx}`} className="checkout-item-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
                        <img src={item.image || item.image_url} alt={item.title || item.name} />
                        <div className="item-details" style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title || item.name}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', margin: '3px 0' }}>
                            <span className="size-badge">Size: {sizeVal}</span>
                            
                            {/* QUANTITY STEPPER (- QTY +) */}
                            {!directProduct && (
                              <div className="cart-item-qty-stepper">
                                <button
                                  type="button"
                                  className="qty-btn"
                                  title="Decrease quantity"
                                  onClick={() => {
                                    if (currentQty > 1) {
                                      updateQuantity(item.id, sizeVal, currentQty - 1);
                                    } else {
                                      removeFromCart(item.id, sizeVal);
                                      toast.info('Item removed from shopping bag', 'BAG UPDATED');
                                    }
                                  }}
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="qty-val">{currentQty}</span>
                                <button
                                  type="button"
                                  className="qty-btn"
                                  title="Increase quantity"
                                  onClick={() => updateQuantity(item.id, sizeVal, currentQty + 1)}
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                          <span className="item-price">{formatINR(itemTotal)}</span>
                        </div>
                      </div>

                      {/* REMOVE TRASH BUTTON */}
                      {!directProduct && (
                        <button
                          type="button"
                          className="btn-remove-item"
                          title="Remove item"
                          onClick={() => {
                            removeFromCart(item.id, sizeVal);
                            toast.info('Item removed from shopping bag', 'BAG UPDATED');
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* COUPON DISCOUNT BOX */}
              <form onSubmit={handleApplyCoupon} className="checkout-coupon-box">
                <input
                  type="text"
                  placeholder="Promo Code (MIRAYA10)"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                />
                <button type="submit" disabled={couponApplied}>{couponApplied ? 'Applied' : 'Apply'}</button>
              </form>

              {/* PRICING BREAKDOWN */}
              <div className="price-breakdown-card">
                <div className="price-row"><span>Subtotal:</span><span>{formatINR(subtotal)}</span></div>
                {couponApplied && <div className="price-row discount"><span>Promo Discount:</span><span>- {formatINR(discountAmount)}</span></div>}
                <div className="price-row"><span>Shipping:</span><span className="free-tag">FREE</span></div>
                <div className="price-row total"><span>Total Payable:</span><span>{formatINR(finalTotal)}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PAYMENT METHOD SELECTION */}
        {step === 2 && (
          <div className="payment-selection-container">
            <h3>Select Payment Method</h3>
            <div className="payment-options-grid">
              <div
                className={`payment-card ${paymentMethod === 'razorpay' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('razorpay')}
              >
                <CreditCard size={24} className="gold-accent-icon" />
                <div className="payment-info">
                  <h4>Razorpay Secure Online Payment</h4>
                  <p>Pay via UPI (GPay, PhonePe, Paytm), Credit/Debit Card, NetBanking</p>
                </div>
                <div className="radio-circle"><div className="inner"></div></div>
              </div>

              <div
                className={`payment-card ${paymentMethod === 'cod' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('cod')}
              >
                <Truck size={24} className="gold-accent-icon" />
                <div className="payment-info">
                  <h4>Cash on Delivery (COD)</h4>
                  <p>Pay with cash upon delivery at your doorstep</p>
                </div>
                <div className="radio-circle"><div className="inner"></div></div>
              </div>
            </div>

            <div className="grand-total-banner">
              <span>Total Amount to Pay: <strong>{formatINR(finalTotal)}</strong></span>
            </div>

            <div className="payment-actions">
              <button className="btn-back" onClick={() => setStep(1)}>Back to Address</button>
              <button className="btn-place-order" onClick={handlePlaceOrder} disabled={isProcessing}>
                {isProcessing ? 'Processing Order...' : paymentMethod === 'razorpay' ? 'PAY & PLACE ORDER' : 'CONFIRM COD ORDER'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ORDER CONFIRMATION SUCCESS */}
        {step === 3 && (
          <div className="order-success-container">
            <CheckCircle size={64} className="success-check-icon" />
            <h2>Thank You For Your Order!</h2>
            <p className="order-id-text">Order Reference: <strong>#MRY-{placedOrder?.id || '1024'}</strong></p>
            <p className="success-sub">A confirmation email has been dispatched to your email address.</p>

            <div className="success-info-box">
              <div className="info-item">
                <Truck size={20} className="gold-accent-icon" />
                <div>
                  <h4>Estimated Delivery</h4>
                  <p>3 - 5 Business Days (Express Courier)</p>
                </div>
              </div>
              <div className="info-item">
                <ShieldCheck size={20} className="gold-accent-icon" />
                <div>
                  <h4>Miraya Quality Guarantee</h4>
                  <p>Inspected & Custom Hand-packed with care</p>
                </div>
              </div>
            </div>

            <div className="success-action-btns">
              <button
                type="button"
                className="btn-download-pdf"
                onClick={() => handleDownloadInvoice(placedOrder?.id)}
                disabled={isDownloadingPdf}
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                {isDownloadingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {isDownloadingPdf ? 'GENERATING PDF...' : 'DOWNLOAD INVOICE PDF'}
              </button>
              <button
                className="btn-my-orders"
                onClick={() => {
                  onClose();
                  navigate('/account', { state: { tab: 'orders' } });
                }}
              >
                VIEW MY ORDERS
              </button>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  </div>

      {/* ── COD CONFIRMATION MODAL OVERLAY ── */}
      {showCodConfirmModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 4, 5, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 2200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setShowCodConfirmModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              border: '2px solid #c6a46a',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              textAlign: 'center',
              color: '#2c2a2a'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(94, 10, 11, 0.08)',
                color: '#5e0a0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.2rem auto',
                border: '1px solid #c6a46a'
              }}
            >
              <Truck size={30} />
            </div>

            <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#5e0a0b', fontSize: '1.4rem', margin: '0 0 0.5rem 0' }}>
              Confirm Cash On Delivery
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#666', marginBottom: '1.2rem', lineHeight: '1.5' }}>
              Please confirm your order details below. You will pay <strong style={{ color: '#5e0a0b' }}>{formatINR(finalTotal)}</strong> in cash to our courier partner upon doorstep delivery.
            </p>

            <div
              style={{
                background: '#fcfaf6',
                border: '1px solid #e8dcc8',
                borderRadius: '10px',
                padding: '1rem',
                textAlign: 'left',
                marginBottom: '1.5rem',
                fontSize: '0.82rem'
              }}
            >
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#888', display: 'block', fontSize: '0.75rem', fontWeight: '600' }}>CUSTOMER & DELIVERY ADDRESS</span>
                <strong style={{ color: '#1a1a1a', display: 'block' }}>{shippingForm.fullName} ({shippingForm.phone})</strong>
                <span style={{ color: '#555' }}>{shippingForm.line1}, {shippingForm.city}, {shippingForm.state} - {shippingForm.pincode}</span>
              </div>
              <div style={{ borderTop: '1px solid #e8dcc8', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#5e0a0b', fontSize: '0.9rem' }}>
                <span>Amount Payable at Delivery:</span>
                <span>{formatINR(finalTotal)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowCodConfirmModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                  background: '#f5f5f5',
                  color: '#444',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={async () => {
                  setShowCodConfirmModal(false);
                  await executeOrderPlacement();
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #5e0a0b 0%, #3a0405 100%)',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(94, 10, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle size={16} /> YES, CONFIRM COD ORDER
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
