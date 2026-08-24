'use client';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Plus, Tag, CreditCard, Truck, Check, Download } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLoading } from '../context/LoadingContext';
import API_URL from '../config';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { showLoading, hideLoading } = useLoading();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({ label: 'Home', fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const subtotal = cartItems.reduce((sum, item) => {
    const itemPrice = typeof item.price === 'number'
      ? item.price
      : (item.product?.priceValue || parseInt(String(item.price || 0).replace(/[^\d]/g, ''), 10) || 0);
    const itemQty = item.qty || item.quantity || 1;
    return sum + itemPrice * itemQty;
  }, 0);
  const shipping = subtotal >= 2000 ? 0 : 99;
  const total = subtotal - couponDiscount + shipping;

  useEffect(() => {
    if (!token) { navigate('/auth'); return; }
    fetch(`${API_URL}/api/addresses`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => {
        setAddresses(data);
        const def = data.find(a => a.isDefault);
        if (def) setSelectedAddress(def.id);
        else if (data.length) setSelectedAddress(data[0].id);
      }).catch(() => {});
  }, [token, navigate]);

  const applyCoupon = async () => {
    setCouponError('');
    showLoading('Validating Coupon...');
    try {
      const res = await fetch(`${API_URL}/api/orders/validate-coupon`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: couponCode, subtotal })
      });
      const data = await res.json();
      if (!res.ok) { setCouponError(data.msg); return; }
      setCouponDiscount(data.discount);
      setCouponApplied(true);
    } catch { setCouponError('Failed to validate coupon'); }
    finally { hideLoading(); }
  };

  const removeCoupon = () => { setCouponCode(''); setCouponDiscount(0); setCouponApplied(false); setCouponError(''); };

  const saveAddress = async () => {
    showLoading('Saving Address...');
    try {
      const res = await fetch(`${API_URL}/api/addresses`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(addressForm)
      });
      const addr = await res.json();
      setAddresses([...addresses, addr]);
      setSelectedAddress(addr.id);
      setShowAddAddress(false);
      setAddressForm({ label: 'Home', fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false });
    } catch { alert('Failed to save address'); }
    finally { hideLoading(); }
  };

  const placeOrder = async () => {
    if (!selectedAddress && addresses.length) return alert('Please select a delivery address');
    setLoading(true);
    showLoading('Placing Your Luxury Order...');
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ addressId: selectedAddress, paymentMethod, couponCode: couponApplied ? couponCode : null, notes })
      });
      if (!res.ok) { const err = await res.json(); alert(err.msg); setLoading(false); return; }
      const order = await res.json();
      setOrderSuccess(order);
      clearCart();
    } catch { alert('Failed to place order'); }
    finally {
      setLoading(false);
      hideLoading();
    }
  };

  if (orderSuccess) {
    return (
      <div className="checkout-success" style={{ padding: '120px 20px', textAlign: 'center' }}>
        <div className="success-card" style={{ maxWidth: '600px', margin: '0 auto', background: '#ffffff', padding: '3rem 2rem', borderRadius: '16px', border: '1px solid #c6a46a', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
          <div className="success-icon" style={{ background: 'rgba(39, 174, 96, 0.1)', color: '#27ae60', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <Check size={40} />
          </div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', color: '#5e0a0b', marginBottom: '0.5rem' }}>Thank You For Ordering!</h2>
          <p className="order-id" style={{ fontSize: '1.1rem', fontWeight: '700', color: '#5e0a0b', marginBottom: '0.8rem' }}>Order Reference: #MRY-{orderSuccess.id}</p>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '2rem' }}>A confirmation email with your order summary has been sent to your email address.</p>
          <div className="success-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href={`${API_URL}/api/orders/${orderSuccess.id}/invoice`}
              target="_blank"
              rel="noreferrer"
              className="btn-primary-checkout"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#c6a46a', color: '#5e0a0b', fontWeight: '700', padding: '0.9rem 1.6rem', borderRadius: '8px', textDecoration: 'none' }}
            >
              <Download size={18} /> DOWNLOAD TAX INVOICE (PDF)
            </a>
            <Link to="/account" state={{ tab: 'orders' }} className="btn-secondary-checkout" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#5e0a0b', color: '#ffffff', fontWeight: '700', padding: '0.9rem 1.6rem', borderRadius: '8px', textDecoration: 'none' }}>
              VIEW MY ORDERS
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!cartItems.length) {
    return (
      <div className="checkout-empty">
        <h2>Your cart is empty</h2>
        <Link to="/" className="btn-primary-checkout">Browse Collections</Link>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft size={18} /> Back</button>
        <h1>Checkout</h1>
      </div>

      <div className="checkout-grid">
        {/* LEFT — Forms */}
        <div className="checkout-left">
          {/* Delivery Address */}
          <div className="checkout-section">
            <h3><MapPin size={18} /> Delivery Address</h3>
            <div className="address-list">
              {addresses.map(a => (
                <label key={a.id} className={`address-option ${selectedAddress === a.id ? 'selected' : ''}`}>
                  <input type="radio" name="address" checked={selectedAddress === a.id} onChange={() => setSelectedAddress(a.id)} />
                  <div>
                    <strong>{a.fullName}</strong> <span className="address-label-tag">{a.label}</span>
                    <p>{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} - {a.pincode}</p>
                    <p className="address-phone">{a.phone}</p>
                  </div>
                </label>
              ))}
            </div>
            <button className="btn-add-address" onClick={() => setShowAddAddress(!showAddAddress)}><Plus size={16} /> {showAddAddress ? 'Cancel' : 'Add New Address'}</button>
            {showAddAddress && (
              <div className="address-form">
                <div className="form-row">
                  <select value={addressForm.label} onChange={e => setAddressForm({ ...addressForm, label: e.target.value })}><option>Home</option><option>Office</option><option>Other</option></select>
                  <input placeholder="Full Name *" value={addressForm.fullName} onChange={e => setAddressForm({ ...addressForm, fullName: e.target.value })} />
                </div>
                <input placeholder="Phone Number *" value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} />
                <input placeholder="Address Line 1 *" value={addressForm.line1} onChange={e => setAddressForm({ ...addressForm, line1: e.target.value })} />
                <input placeholder="Address Line 2" value={addressForm.line2} onChange={e => setAddressForm({ ...addressForm, line2: e.target.value })} />
                <div className="form-row">
                  <input placeholder="City *" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} />
                  <input placeholder="State *" value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} />
                  <input placeholder="Pincode *" value={addressForm.pincode} onChange={e => setAddressForm({ ...addressForm, pincode: e.target.value })} />
                </div>
                <button className="btn-primary-checkout" onClick={saveAddress}>Save Address</button>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="checkout-section">
            <h3><CreditCard size={18} /> Payment Method</h3>
            <div className="payment-options">
              {[{ key: 'COD', label: 'Cash on Delivery' }, { key: 'ONLINE', label: 'Online Payment (UPI/Card)' }].map(pm => (
                <label key={pm.key} className={`payment-option ${paymentMethod === pm.key ? 'selected' : ''}`}>
                  <input type="radio" name="payment" checked={paymentMethod === pm.key} onChange={() => setPaymentMethod(pm.key)} />
                  <span>{pm.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="checkout-section">
            <h3>Order Notes (Optional)</h3>
            <textarea placeholder="Any special instructions..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          </div>
        </div>

        {/* RIGHT — Summary */}
        <div className="checkout-right">
          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="summary-items">
              {cartItems.map(item => (
                <div key={item.id} className="summary-item">
                  <img src={item.product.image} alt="" />
                  <div>
                    <p className="si-name">{item.product.name}</p>
                    {item.size && <span className="si-size">{item.size}</span>}
                    <span className="si-qty">×{item.quantity}</span>
                  </div>
                  <span className="si-price">₹{(item.product.priceValue * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="coupon-section">
              {couponApplied ? (
                <div className="coupon-applied">
                  <Tag size={14} /> <span>{couponCode} applied (−₹{couponDiscount.toLocaleString('en-IN')})</span>
                  <button onClick={removeCoupon}>✕</button>
                </div>
              ) : (
                <div className="coupon-input-row">
                  <input placeholder="Coupon code" value={couponCode} onChange={e => setCouponCode(e.target.value)} />
                  <button onClick={applyCoupon}>Apply</button>
                </div>
              )}
              {couponError && <p className="coupon-error">{couponError}</p>}
            </div>

            {/* Totals */}
            <div className="summary-totals">
              <div className="total-row"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              {couponDiscount > 0 && <div className="total-row discount"><span>Discount</span><span>−₹{couponDiscount.toLocaleString('en-IN')}</span></div>}
              <div className="total-row"><span>Shipping</span><span>{shipping === 0 ? <span className="free-shipping"><Truck size={14} /> Free</span> : `₹${shipping}`}</span></div>
              <div className="total-row grand"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
            </div>

            <button className="btn-place-order" onClick={placeOrder} disabled={loading}>
              {loading ? 'Placing Order...' : `Place Order — ₹${total.toLocaleString('en-IN')}`}
            </button>

            <p className="checkout-note">By placing this order, you agree to our Terms & Conditions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
