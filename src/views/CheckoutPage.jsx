'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Truck,
  Lock,
  Check,
  CheckCircle2,
  Tag,
  ShoppingBag,
  MapPin,
  CreditCard,
  Plus,
  Download,
  Minus,
  Sparkles,
  Phone,
  Mail,
  User,
  Home,
  Briefcase,
  Clock,
  HelpCircle,
  Package,
  Building,
  MessageCircle,
  X
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useLoading } from '../context/LoadingContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import API_URL from '../config';
import { getProductImage } from '../utils/imageHelper';
import './CheckoutPage.css';

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh'
];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, clearCart } = useCart();
  const { toast } = useToast();
  const { showLoading, hideLoading } = useLoading();
  const { store_online, online_payments, cod_enabled, new_orders_enabled, whatsapp_number } = useStoreSettings();

  const isStoreOffline = !store_online || !new_orders_enabled;

  // Determine if direct product from Buy Now or full Cart
  const [directItem, setDirectItem] = useState(() => {
    if (location.state?.directProduct) return location.state.directProduct;
    try {
      if (typeof window !== 'undefined') {
        const saved = sessionStorage.getItem('miraya_direct_checkout_item');
        if (saved) return JSON.parse(saved);
      }
    } catch (_) {}
    return null;
  });

  const [useDirectMode, setUseDirectMode] = useState(!!directItem);

  // Active items being checked out
  const checkoutItems = useMemo(() => {
    if (useDirectMode && directItem) {
      const price = typeof directItem.price === 'number'
        ? directItem.price
        : parseInt(String(directItem.price || 0).replace(/[^\d]/g, ''), 10) || 0;
      const rawMrp = directItem.mrp_price;
      const mrp = rawMrp
        ? (typeof rawMrp === 'number' ? rawMrp : parseInt(String(rawMrp).replace(/[^\d]/g, ''), 10) || null)
        : null;

      return [{
        ...directItem,
        qty: directItem.qty || 1,
        selectedSize: directItem.selectedSize || directItem.size || 'M',
        price,
        mrp_price: mrp,
        promo_label: directItem.promo_label,
        discount_percent: directItem.discount_percent,
        is_on_sale: directItem.is_on_sale || (mrp && mrp > price),
      }];
    }
    return cartItems.map(item => {
      const price = typeof item.price === 'number'
        ? item.price
        : (item.product?.priceValue || parseInt(String(item.price || 0).replace(/[^\d]/g, ''), 10) || 0);
      const rawMrp = item.mrp_price || item.product?.mrp_price;
      const mrp = rawMrp
        ? (typeof rawMrp === 'number' ? rawMrp : parseInt(String(rawMrp).replace(/[^\d]/g, ''), 10) || null)
        : null;

      return {
        ...item,
        qty: item.qty || item.quantity || 1,
        selectedSize: item.selectedSize || item.size || 'M',
        price,
        mrp_price: mrp,
        promo_label: item.promo_label || item.product?.promo_label,
        discount_percent: item.discount_percent || item.product?.discount_percent,
        is_on_sale: item.is_on_sale || item.product?.is_on_sale || (mrp && mrp > price),
      };
    });
  }, [useDirectMode, directItem, cartItems]);

  // Subtotal & Promotional MRP Calculations
  const subtotal = checkoutItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const totalMrp = checkoutItems.reduce((acc, item) => {
    const itemMrp = item.mrp_price && Number(item.mrp_price) > Number(item.price)
      ? Number(item.mrp_price)
      : item.price;
    return acc + (itemMrp * item.qty);
  }, 0);
  const totalPromoSavings = Math.max(0, totalMrp - subtotal);

  // User & Address State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  // Delivery Destination Form
  const [shippingForm, setShippingForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    line1: '',
    line2: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
    label: 'Home',
    saveToAccount: true
  });

  // Coupon & Payment State
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(() => {
    if (online_payments) return 'razorpay';
    if (cod_enabled) return 'cod';
    return 'whatsapp';
  });
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCodModal, setShowCodModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    if (!online_payments && !cod_enabled) {
      setPaymentMethod('whatsapp');
    } else if (!online_payments && paymentMethod === 'razorpay') {
      setPaymentMethod('cod');
    } else if (!cod_enabled && paymentMethod === 'cod') {
      setPaymentMethod('razorpay');
    }
  }, [online_payments, cod_enabled, paymentMethod]);

  // Initial Data Load & Mandatory Authentication Gate
  useEffect(() => {
    const token = localStorage.getItem('token');
    const isLogged = localStorage.getItem('isLoggedIn') === 'true';
    const userStr = localStorage.getItem('user');

    if (!token || !isLogged) {
      toast.warning('Please sign in or create an account to proceed with your bespoke checkout.', 'SIGN IN REQUIRED');
      navigate('/auth', { state: { from: '/checkout', directProduct: directItem } });
      return;
    }

    setIsLoggedIn(true);
    if (userStr && userStr !== 'undefined' && userStr !== 'null') {
      try {
        const u = JSON.parse(userStr);
        if (u && typeof u === 'object') {
          setUser(u);
          setShippingForm(prev => ({
            ...prev,
            fullName: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || prev.fullName,
            email: u.email || prev.email,
            phone: u.phone || prev.phone
          }));
        }
      } catch (_) {}
    }

    // Fetch live user profile to ensure fresh details & validate token
    fetch(`${API_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('isLoggedIn');
          setIsLoggedIn(false);
          toast.warning('Your session has expired. Please sign in to proceed.', 'AUTHENTICATION REQUIRED');
          navigate('/auth', { state: { from: '/checkout', directProduct: directItem } });
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then(profData => {
        if (!profData) return;
        const u = profData?.user || profData;
        if (u && typeof u === 'object') {
          setUser(u);
          setShippingForm(prev => ({
            ...prev,
            fullName: prev.fullName || u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || '',
            email: prev.email || u.email || '',
            phone: prev.phone || u.phone || ''
          }));
          try {
            localStorage.setItem('user', JSON.stringify(u));
          } catch (_) {}
        }
      })
      .catch(() => {});

    // Fetch saved addresses
    fetch(`${API_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAddresses(data);
          const def = data.find(a => a.isDefault) || data[0];
          setSelectedAddressId(def.id);
          // Pre-fill form from selected address
          setShippingForm(prev => ({
            ...prev,
            fullName: def.fullName || prev.fullName,
            phone: def.phone || prev.phone,
            line1: def.line1 || '',
            line2: def.line2 || '',
            city: def.city || '',
            state: def.state || 'Maharashtra',
            pincode: def.pincode || '',
            label: def.label || 'Home'
          }));
        } else {
          setShowNewAddressForm(true);
        }
      })
      .catch(() => {
        setShowNewAddressForm(true);
      });
  }, []);

  // Sync selected address change
  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setShowNewAddressForm(false);
    setShippingForm(prev => ({
      ...prev,
      fullName: addr.fullName || prev.fullName,
      phone: addr.phone || prev.phone,
      line1: addr.line1 || '',
      line2: addr.line2 || '',
      city: addr.city || '',
      state: addr.state || 'Maharashtra',
      pincode: addr.pincode || '',
      label: addr.label || 'Home'
    }));
  };

  // Calculations (18% Inclusive GST Standard)
  const packagingCharge = 0; // Complimentary Luxury Silk Box
  const shippingCharge = 0; // Free Insured Express Courier
  const finalTotal = Math.max(0, subtotal - couponDiscount + packagingCharge + shippingCharge);
  
  // 18% GST Breakdown (Inclusive)
  const gstInclusiveAmount = Math.round((finalTotal * 18) / 118);
  const netTaxableAmount = finalTotal - gstInclusiveAmount;
  const isInterstate = (shippingForm.state || '').toLowerCase().trim() !== 'maharashtra' && (shippingForm.state || '').toLowerCase().trim() !== 'mh' && Boolean(shippingForm.state);

  // Apply Coupon (Strict Database Validation)
  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) return;
    setCouponError('');
    showLoading('Validating Privilege Code...');

    try {
      const res = await fetch(`${API_URL}/api/coupons/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, cartTotal: subtotal })
      });
      const data = await res.json();

      if (res.ok && data.discountAmount !== undefined) {
        setCouponDiscount(data.discountAmount);
        setCouponApplied(true);
        setCouponCode(code);
        toast.coupon(`Privilege Applied! Saved ${formatINR(data.discountAmount)}`, 'CODE APPLIED');
      } else {
        const msg = data.error || data.message || 'Invalid or expired coupon code.';
        setCouponError(msg);
        toast.error(msg, 'COUPON ERROR');
      }
    } catch (_) {
      setCouponError('Unable to validate coupon.');
      toast.error('Unable to validate coupon.', 'NETWORK ERROR');
    }

    hideLoading();
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setCouponApplied(false);
    setCouponError('');
    toast.info('Coupon code removed', 'COUPON');
  };

  // Direct Item Quantity Change
  const handleDirectQuantityChange = (delta) => {
    if (!directItem) return;
    const newQty = Math.max(1, (directItem.qty || 1) + delta);
    const updated = { ...directItem, qty: newQty };
    setDirectItem(updated);
    try {
      sessionStorage.setItem('miraya_direct_checkout_item', JSON.stringify(updated));
    } catch (_) {}
  };

  // Direct Item Size Change
  const handleDirectSizeChange = (newSize) => {
    if (!directItem) return;
    const updated = { ...directItem, selectedSize: newSize, size: newSize };
    setDirectItem(updated);
    try {
      sessionStorage.setItem('miraya_direct_checkout_item', JSON.stringify(updated));
    } catch (_) {}
  };

  // Trigger Order
  const handlePlaceOrderClick = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.warning('Please sign in or create an account to complete your luxury purchase.', 'AUTHENTICATION REQUIRED');
      navigate('/auth', { state: { from: '/checkout', directProduct: directItem } });
      return;
    }

    if (!shippingForm.fullName?.trim() || !shippingForm.phone?.trim() || !shippingForm.line1?.trim() || !shippingForm.city?.trim() || !shippingForm.pincode?.trim()) {
      toast.warning('Please complete all mandatory delivery destination details marked with *', 'SHIPPING ADDRESS');
      window.scrollTo({ top: 180, behavior: 'smooth' });
      return;
    }

    if (shippingForm.phone.replace(/[^\d]/g, '').length < 10) {
      toast.warning('Please enter a valid 10-digit mobile number for order delivery.', 'INVALID PHONE');
      return;
    }

    if (isStoreOffline || paymentMethod === 'whatsapp' || (!online_payments && !cod_enabled)) {
      handleWhatsAppCheckout();
      return;
    }

    if (paymentMethod === 'cod') {
      if (!cod_enabled) {
        toast.warning('Cash on Delivery is currently disabled.', 'COD UNAVAILABLE');
        handleWhatsAppCheckout();
        return;
      }
      setShowCodModal(true);
      return;
    }

    executeOrderPlacement();
  };

  const handleWhatsAppCheckout = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mirayabygarima.com';
    
    const itemsFormatted = checkoutItems.map((item, idx) => {
      const imgPath = item.image || item.image_url || (item.images && item.images[0]) || '';
      const fullImgUrl = imgPath ? (imgPath.startsWith('http') ? imgPath : `${origin}${imgPath}`) : '';
      const itemMrpStr = item.mrp_price && Number(item.mrp_price) > Number(item.price)
        ? ` (MRP: ${formatINR(item.mrp_price)}, Save ${item.discount_percent || Math.round(((item.mrp_price - item.price) / item.mrp_price) * 100)}%)`
        : '';

      return `${idx + 1}. 👗 *${item.title || item.name}*\n   • *Size:* ${item.selectedSize || item.size || 'M'}\n   • *Quantity:* ${item.qty || 1}\n   • *Price:* ${formatINR(item.price * (item.qty || 1))}${itemMrpStr}${fullImgUrl ? `\n   • 🖼️ *Image:* ${fullImgUrl}` : ''}`;
    }).join('\n\n');

    const addressFormatted = `• *Name:* ${shippingForm.fullName}\n• *Phone:* ${shippingForm.phone}\n• *Email:* ${shippingForm.email || 'N/A'}\n• *Address:* ${shippingForm.line1}${shippingForm.line2 ? ', ' + shippingForm.line2 : ''}\n• *City/State/PIN:* ${shippingForm.city}, ${shippingForm.state} - ${shippingForm.pincode} (${shippingForm.label || 'Home'})`;

    const savingsText = totalPromoSavings > 0 ? `\n• 🎉 *Promotional Discount:* −${formatINR(totalPromoSavings)}` : '';
    const couponText = couponApplied ? `\n• 🏷️ *Privilege Coupon (${couponCode}):* −${formatINR(couponDiscount)}` : '';

    const message = `👑 *NEW ORDER INQUIRY — MIRAYA BY GARIMA ATELIER*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📦 *ORDERED OUTFITS:*\n\n${itemsFormatted}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *BILLING SUMMARY:*\n` +
      (totalPromoSavings > 0 ? `• Total Catalog MRP: ${formatINR(totalMrp)}\n` : '') +
      `• Subtotal: ${formatINR(subtotal)}` +
      savingsText +
      couponText +
      `\n• 🌟 *Total Payable Amount:* ${formatINR(finalTotal)}\n` +
      `• Payment Mode: ${paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Direct Atelier Confirmation'}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📍 *DELIVERY DESTINATION:*\n${addressFormatted}\n` +
      (notes ? `\n📝 *Atelier Customization Notes:* ${notes}\n` : '') +
      `\nPlease confirm stock reservation and dispatch schedule! 🙏`;

    const encodedMsg = encodeURIComponent(message);
    const waNum = (whatsapp_number || '+919271218156').replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${waNum}?text=${encodedMsg}`, '_blank');
  };

  // Execute Order Placement & Razorpay Payment
  const executeOrderPlacement = async () => {
    setIsProcessing(true);
    showLoading('Securing Your Luxury Order...');

    const fullShippingAddressString = `${shippingForm.line1}${shippingForm.line2 ? ', ' + shippingForm.line2 : ''}, ${shippingForm.city}, ${shippingForm.state} - ${shippingForm.pincode} (${shippingForm.label || 'Home'})`;

    const orderPayload = {
      items: checkoutItems.map(item => ({
        product_id: typeof item.id === 'string' && item.id.includes('-') ? parseInt(item.id.split('-').pop(), 10) || 1 : (parseInt(item.id, 10) || 1),
        productId: typeof item.id === 'string' && item.id.includes('-') ? parseInt(item.id.split('-').pop(), 10) || 1 : (parseInt(item.id, 10) || 1),
        title: item.title || item.name || 'Bespoke Outfit',
        name: item.title || item.name || 'Bespoke Outfit',
        quantity: item.qty || 1,
        size: item.selectedSize || item.size || 'M',
        price: item.price
      })),
      total: finalTotal,
      subtotal,
      discount: couponDiscount,
      couponCode: couponApplied ? couponCode : null,
      address: fullShippingAddressString,
      shipping_name: shippingForm.fullName,
      shipping_phone: shippingForm.phone,
      shipping_address: fullShippingAddressString,
      shipping_city: shippingForm.city,
      shipping_state: shippingForm.state,
      shipping_pincode: shippingForm.pincode,
      shippingDetails: {
        ...shippingForm,
        addressString: fullShippingAddressString
      },
      paymentMethod,
      notes
    };

    try {
      if (paymentMethod === 'razorpay') {
        // Step 1: Load Razorpay Checkout SDK script dynamically
        const loadScript = () => {
          return new Promise((resolve) => {
            if (typeof window !== 'undefined' && window.Razorpay) {
              resolve(true);
              return;
            }
            const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
            if (existingScript) {
              existingScript.onload = () => resolve(true);
              existingScript.onerror = () => resolve(false);
              return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
          });
        };

        const scriptLoaded = await loadScript();
        if (!scriptLoaded || typeof window === 'undefined' || !window.Razorpay) {
          throw new Error('Unable to initialize Razorpay payment modal. Please check your network connection.');
        }

        const token = localStorage.getItem('token');

        // Step 2: Call backend to create Razorpay Order (POST /api/payments/create-order or /api/create-order)
        const createOrderRes = await fetch(`${API_URL}/api/payments/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            amount: Math.round(finalTotal * 100), // amount in paise (minimum 100 paise)
            currency: 'INR',
            items: orderPayload.items,
            shippingDetails: orderPayload.shippingDetails,
            notes: {
              customer_name: shippingForm.fullName,
              customer_phone: shippingForm.phone,
              customer_email: shippingForm.email || ''
            }
          })
        });

        const orderData = await createOrderRes.json();
        if (!createOrderRes.ok || (!orderData.order_id && !orderData.id)) {
          throw new Error(orderData.message || orderData.error || 'Failed to initialize payment gateway order');
        }

        const razorpayOrderId = orderData.order_id || orderData.id;
        const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TUJwjLBb7chIpr';

        // Step 3: Configure Razorpay Standard Modal options
        const options = {
          key: razorpayKey,
          amount: orderData.amount || Math.round(finalTotal * 100),
          currency: orderData.currency || 'INR',
          name: 'Miraya by Garima',
          description: `Haute Couture Order (${checkoutItems.length} ${checkoutItems.length === 1 ? 'item' : 'items'})`,
          image: '/logoR.png',
          order_id: razorpayOrderId,
          handler: async function (response) {
            showLoading('Verifying Payment Signature & Confirming Order...');
            try {
              // Step 4: Verify HMAC-SHA256 signature on backend
              const verifyRes = await fetch(`${API_URL}/api/payments/verify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token && { Authorization: `Bearer ${token}` })
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  shippingDetails: orderPayload.shippingDetails,
                  orderData: orderPayload
                })
              });

              const verifyData = await verifyRes.json();
              if (!verifyRes.ok || !verifyData.verified) {
                throw new Error(verifyData.message || 'Payment signature verification failed');
              }

              // Cleanup on success
              try {
                sessionStorage.removeItem('miraya_direct_checkout_item');
              } catch (_) {}

              if (!useDirectMode) {
                clearCart();
              }

              setOrderSuccess(verifyData.order || { id: razorpayOrderId, total: finalTotal, payment_id: response.razorpay_payment_id });
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              toast.success('Congratulations! Your luxury payment was verified and order is confirmed.', 'PAYMENT SUCCESSFUL');

            } catch (vErr) {
              console.error('Payment signature verification error:', vErr);
              toast.error(vErr.message || 'Payment verification failed. Please contact atelier support.', 'VERIFICATION ERROR');
            } finally {
              setIsProcessing(false);
              hideLoading();
            }
          },
          prefill: {
            name: shippingForm.fullName,
            email: shippingForm.email || '',
            contact: shippingForm.phone
          },
          theme: {
            color: '#5e0a0b'
          },
          modal: {
            ondismiss: async function () {
              setIsProcessing(false);
              hideLoading();
              toast.info('Payment window was closed. Your selection remains saved in your cart.', 'PAYMENT CANCELLED');
              // Release reservation hold
              try {
                await fetch(`${API_URL}/api/payments/release-hold`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` })
                  },
                  body: JSON.stringify({ razorpay_order_id: razorpayOrderId })
                });
              } catch (_) {}
            }
          }
        };

        const rzp = new window.Razorpay(options);

        // Handle payment failure event
        rzp.on('payment.failed', function (resp) {
          setIsProcessing(false);
          hideLoading();
          const reason = resp.error?.description || resp.error?.reason || 'Payment was declined or failed';
          toast.error(`Payment failed: ${reason}`, 'TRANSACTION DECLINED');
        });

        rzp.open();
        hideLoading();
        return;
      }

      // COD or Direct Flow
      await submitOrderToBackend(orderPayload);

    } catch (err) {
      console.error('Checkout error:', err);
      toast.error(err.message || 'Failed to process order', 'CHECKOUT ERROR');
      setIsProcessing(false);
      hideLoading();
    }
  };

  const submitOrderToBackend = async (payload) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.msg || data.message || 'Failed to register order');
      }

      // Cleanup
      try {
        sessionStorage.removeItem('miraya_direct_checkout_item');
      } catch (_) {}

      if (!useDirectMode) {
        clearCart();
      }

      setOrderSuccess(data.order || data);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      toast.success('Congratulations! Your luxury order has been confirmed.', 'ORDER CONFIRMED');

    } catch (err) {
      console.error('Backend order submission error:', err);
      toast.error(err.message || 'Server error while placing order', 'ORDER ERROR');
    } finally {
      setIsProcessing(false);
      hideLoading();
      setShowCodModal(false);
    }
  };

  // Download Invoice PDF directly via Blob
  const handleDownloadInvoice = async (orderId) => {
    if (!orderId) return;
    setIsDownloadingPdf(true);
    showLoading('Generating Tax Invoice PDF...');

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

      toast.success('Tax Invoice PDF downloaded successfully!', 'INVOICE READY');
    } catch (err) {
      console.error('Invoice download failed:', err);
      toast.error('Could not download invoice. You can download it anytime from My Orders.', 'DOWNLOAD FAILED');
    } finally {
      setIsDownloadingPdf(false);
      hideLoading();
    }
  };

  // ==========================================
  // SUCCESS CONFIRMATION VIEW
  // ==========================================
  if (orderSuccess) {
    const orderIdNum = orderSuccess.id || orderSuccess.orderId || Math.floor(100000 + Math.random() * 900000);

    return (
      <div className="checkout-page success-theme">
        <div className="checkout-success-container">
          <div className="success-royal-badge">
            <div className="royal-icon-wrap">
              <Check className="check-svg" size={38} />
            </div>
            <span className="royal-tagline">👑 MIRAYA HAUTE COUTURE CONFIRMATION</span>
          </div>

          <h1 className="success-main-title">Thank You For Your Patronage</h1>
          <p className="success-subtitle">
            Your bespoke ensemble order has been placed with our flagship atelier. Garima &amp; our master artisans are preparing your outfit with meticulous craftsmanship.
          </p>

          <div className="order-receipt-card">
            <div className="receipt-header-row">
              <div>
                <span className="receipt-label">ORDER REFERENCE</span>
                <h3 className="receipt-order-id">#MRY-{orderIdNum}</h3>
              </div>
              <div className="receipt-payment-status">
                <span className="status-pill verified">
                  <ShieldCheck size={14} /> {paymentMethod === 'cod' ? 'CASH ON DELIVERY' : 'PAID SECURELY'}
                </span>
              </div>
            </div>

            <div className="receipt-divider"></div>

            <div className="receipt-info-grid">
              <div className="receipt-info-block">
                <span className="block-title"><MapPin size={15} /> Delivery Destination</span>
                <p className="block-text"><strong>{shippingForm.fullName}</strong></p>
                <p className="block-text">{shippingForm.line1}{shippingForm.line2 ? `, ${shippingForm.line2}` : ''}</p>
                <p className="block-text">{shippingForm.city}, {shippingForm.state} - {shippingForm.pincode}</p>
                <p className="block-text muted">Contact: {shippingForm.phone}</p>
              </div>

              <div className="receipt-info-block">
                <span className="block-title"><Clock size={15} /> Estimated Delivery</span>
                <p className="block-text highlight-gold">4 — 7 Business Days</p>
                <p className="block-text muted">Insured Express Courier with GPS Tracking</p>
                <p className="block-text muted" style={{ marginTop: '0.4rem' }}>
                  Signature Miraya Silk Box &amp; Scented Trousseau Wrap
                </p>
              </div>
            </div>

            <div className="receipt-divider"></div>

            <div className="receipt-items-list">
              <span className="block-title"><ShoppingBag size={15} /> Purchased Outfits</span>
              {checkoutItems.map((item, idx) => (
                <div key={idx} className="receipt-item-row">
                  <img
                    src={getProductImage(item.image || item.image_url)}
                    alt={item.title || item.name}
                    className="receipt-item-thumb"
                  />
                  <div className="receipt-item-meta">
                    <h4>{item.title || item.name}</h4>
                    <div className="receipt-item-tags">
                      <span className="meta-pill">Size: {item.selectedSize || item.size || 'M'}</span>
                      <span className="meta-pill">Qty: {item.qty || 1}</span>
                    </div>
                  </div>
                  <span className="receipt-item-price">{formatINR(item.price * (item.qty || 1))}</span>
                </div>
              ))}
            </div>

            <div className="receipt-tax-summary-box">
              <div className="receipt-tax-line">
                <span>Taxable Base Value (Net):</span>
                <span>{formatINR(netTaxableAmount)}</span>
              </div>
              <div className="receipt-tax-line">
                <span>{isInterstate ? 'IGST @ 18% (Integrated GST):' : 'CGST (9%) + SGST (9%) [18% Total GST]:'}</span>
                <span className="gst-highlight">{formatINR(gstInclusiveAmount)}</span>
              </div>
              <div className="receipt-tax-line official-gstin">
                <span>Official GSTIN: <strong>27AABCM9876Q1Z5</strong></span>
                <span>HSN Code: <strong>6204</strong></span>
              </div>
            </div>

            <div className="receipt-total-bar">
              <span>Grand Total Paid (Tax Inclusive):</span>
              <span className="grand-amount">{formatINR(finalTotal)}</span>
            </div>
          </div>

          <div className="success-action-buttons">
            <a
              href={`https://wa.me/${(whatsapp_number || '+919271218156').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                `Hi Miraya by Garima Atelier! 👑\n\nI just placed Order *#MRY-${orderIdNum}* on the website.\n\n💰 *Total Paid/Payable:* ${formatINR(finalTotal)}\n📍 *Delivery To:* ${shippingForm.fullName}, ${shippingForm.city}\n\nPlease share dispatch tracking updates. 🙏`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-view-orders"
              style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: '#fff', textDecoration: 'none' }}
            >
              <MessageCircle size={18} /> CONFIRM / TRACK ON WHATSAPP
            </a>

            <button
              type="button"
              className="btn-download-invoice"
              onClick={() => handleDownloadInvoice(orderSuccess.id || orderIdNum)}
              disabled={isDownloadingPdf}
            >
              <Download size={18} /> {isDownloadingPdf ? 'Generating PDF...' : 'DOWNLOAD TAX INVOICE (PDF)'}
            </button>

            {isLoggedIn ? (
              <Link to="/account" state={{ tab: 'orders' }} className="btn-view-orders">
                <ShoppingBag size={18} /> VIEW ORDER IN MY ACCOUNT
              </Link>
            ) : (
              <Link to="/auth" className="btn-view-orders">
                <User size={18} /> CREATE ACCOUNT TO TRACK ORDER
              </Link>
            )}

            <Link to="/collection/all" className="btn-continue-shopping">
              CONTINUE SHOPPING <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // EMPTY CHECKOUT VIEW
  // ==========================================
  if (checkoutItems.length === 0) {
    return (
      <div className="checkout-page empty-theme">
        <div className="checkout-empty-box">
          <div className="empty-icon-ring">
            <ShoppingBag size={48} />
          </div>
          <h2>Your Selection is Empty</h2>
          <p>You currently do not have any bespoke outfits ready for checkout.</p>
          <Link to="/collection/all" className="btn-browse-couture">
            EXPLORE COUTURE COLLECTIONS <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN LUXURY CHECKOUT PAGE VIEW
  // ==========================================
  return (
    <div className="checkout-page">
      {/* Background Ambience Ornaments */}
      <div className="checkout-bg-glow glow-1"></div>
      <div className="checkout-bg-glow glow-2"></div>

      {/* Header Bar */}
      <header className="checkout-top-header">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="checkout-back-link"
          aria-label="Go Back"
        >
          <ArrowLeft size={18} />
          <span>Back to Boutique</span>
        </button>

        <div className="checkout-header-center">
          <span className="couture-eyebrow">👑 HAUTE COUTURE ATELIER</span>
          <h1 className="checkout-page-title">Secure Bespoke Checkout</h1>
        </div>

        <div className="checkout-trust-badge-top">
          <Lock size={14} />
          <span>256-Bit SSL Encrypted</span>
        </div>
      </header>

      {/* Step Progress Tracker */}
      <div className="checkout-stepper-bar">
        <div className="step-node active">
          <span className="step-number">1</span>
          <span className="step-label">Shipping &amp; Address</span>
        </div>
        <div className="step-connector active"></div>
        <div className="step-node active">
          <span className="step-number">2</span>
          <span className="step-label">Payment Method</span>
        </div>
        <div className="step-connector"></div>
        <div className="step-node">
          <span className="step-number">3</span>
          <span className="step-label">Order Confirmation</span>
        </div>
      </div>

      {/* Mode Switcher Banner (if cart also has items during Buy Now) */}
      {directItem && cartItems.length > 0 && (
        <div className="direct-buy-banner">
          <div className="banner-left">
            <Sparkles size={18} className="sparkle-gold" />
            <span>
              {useDirectMode
                ? `Instant Single-Outfit Checkout: "${directItem.title || directItem.name}"`
                : `Full Shopping Bag Checkout (${cartItems.length} items)`}
            </span>
          </div>
          <button
            type="button"
            className="btn-switch-mode"
            onClick={() => setUseDirectMode(!useDirectMode)}
          >
            {useDirectMode
              ? `Switch to Full Cart (${cartItems.length} items) →`
              : `Switch to Single Item ("${directItem.title || directItem.name}") →`}
          </button>
        </div>
      )}

      {/* Main Two-Column Grid */}
      <div className="checkout-content-grid">
        {/* ============================================================ */}
        {/* LEFT COLUMN: Shipping Address, Payment Method, Delivery Info */}
        {/* ============================================================ */}
        <div className="checkout-left-col">
          {/* SECTION 1: SHIPPING ADDRESS (BOUTIQUE DISPATCH ORIGIN) */}
          <section className="checkout-luxury-card origin-dispatch-card">
            <div className="card-section-header">
              <div className="header-title-wrap">
                <span className="section-idx">01</span>
                <h3><Building size={20} /> Shipping Address (Boutique Dispatch Origin)</h3>
              </div>
              <span className="origin-badge">👑 Flagship Atelier</span>
            </div>

            <div className="shipping-origin-box">
              <div className="origin-top-info">
                <h4 className="origin-brand-title">MIRAYA BY GARIMA ATELIER</h4>
                <span className="origin-gstin-tag">GSTIN: 27AABCM9876Q1Z5</span>
              </div>
              <p className="origin-address-text">
                <strong>Shop no. UG/5, Jagat Plaza</strong>, Law College Square, Amravati Road, Nagpur, Maharashtra — 440033
              </p>
              <div className="origin-meta-row">
                <span><Phone size={13} /> +91 92712 18156</span>
                <span><Mail size={13} /> mirayabygarima@gmail.com</span>
                <span><Clock size={13} /> 11:00 AM – 9:00 PM (Daily)</span>
              </div>
            </div>
          </section>

          {/* SECTION 2: DELIVERY DESTINATION ADDRESS */}
          <section className="checkout-luxury-card">
            <div className="card-section-header">
              <div className="header-title-wrap">
                <span className="section-idx">02</span>
                <h3><Truck size={20} /> Delivery Destination Address (Client Delivery Details)</h3>
              </div>
              {isLoggedIn && addresses.length > 0 && (
                <button
                  type="button"
                  className="btn-text-gold"
                  onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                >
                  {showNewAddressForm ? 'Use Saved Address' : '+ Add New Address'}
                </button>
              )}
            </div>

            {/* Logged in User Bar */}
            {isLoggedIn && user && (
              <div className="checkout-user-auth-status">
                <div className="auth-status-left">
                  <span className="auth-status-icon"><User size={14} /></span>
                  <span className="auth-status-text">
                    Signed in as: <strong>{user?.name || user?.email || 'Client'}</strong> ({user?.email})
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-switch-user"
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('isLoggedIn');
                    window.dispatchEvent(new Event('loginStateChange'));
                    toast.info('Logged out. Please sign in with your desired account.', 'LOGGED OUT');
                    navigate('/auth', { state: { from: '/checkout', directProduct: directItem } });
                  }}
                >
                  Log Out / Switch Account →
                </button>
              </div>
            )}

            {/* Saved Address Cards (if logged in and has addresses) */}
            {isLoggedIn && addresses.length > 0 && !showNewAddressForm && (
              <div className="saved-addresses-grid">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      className={`saved-address-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectSavedAddress(addr)}
                    >
                      <div className="card-radio-row">
                        <div className={`custom-radio ${isSelected ? 'checked' : ''}`}>
                          {isSelected && <div className="radio-inner" />}
                        </div>
                        <span className="address-label-badge">
                          {addr.label === 'Office' ? <Briefcase size={12} /> : <Home size={12} />}
                          {addr.label || 'Home'}
                        </span>
                        {addr.isDefault && <span className="default-pill">Default</span>}
                      </div>

                      <h4 className="addr-recipient-name">{addr.fullName}</h4>
                      <p className="addr-line">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                      <p className="addr-city">{addr.city}, {addr.state} — {addr.pincode}</p>
                      <p className="addr-phone"><Phone size={12} /> +91 {addr.phone}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Manual / New Delivery Address Form */}
            {(showNewAddressForm || !isLoggedIn || addresses.length === 0) && (
              <div className="address-entry-form">
                {!isLoggedIn && (
                  <div className="guest-login-nudge">
                    <span>Already a registered client?</span>
                    <Link to="/auth" className="nudge-link">Sign In for saved addresses</Link>
                  </div>
                )}

                <div className="form-grid-2">
                  <div className="floating-group">
                    <label>Recipient Full Name *</label>
                    <div className="input-with-icon">
                      <User size={16} className="input-icon" />
                      <input
                        type="text"
                        placeholder="e.g. Garima Sharma"
                        value={shippingForm.fullName}
                        onChange={e => setShippingForm({ ...shippingForm, fullName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="floating-group">
                    <label>Contact Mobile Number *</label>
                    <div className="input-with-icon">
                      <Phone size={16} className="input-icon" />
                      <input
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={shippingForm.phone}
                        onChange={e => setShippingForm({ ...shippingForm, phone: e.target.value.replace(/[^\d]/g, '').slice(0, 10) })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="floating-group">
                  <label>Email Address (For Tax Invoice &amp; GPS Tracking) *</label>
                  <div className="input-with-icon">
                    <Mail size={16} className="input-icon" />
                    <input
                      type="email"
                      placeholder="e.g. client@domain.com"
                      value={shippingForm.email}
                      onChange={e => setShippingForm({ ...shippingForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="floating-group">
                  <label>Delivery Street Address / Flat No. / Building / Floor *</label>
                  <div className="input-with-icon">
                    <MapPin size={16} className="input-icon" />
                    <input
                      type="text"
                      placeholder="e.g. Flat 402, Royal Palms, Law College Square"
                      value={shippingForm.line1}
                      onChange={e => setShippingForm({ ...shippingForm, line1: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="floating-group">
                  <label>Landmark / Colony / Area (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Near Law College Square"
                    value={shippingForm.line2}
                    onChange={e => setShippingForm({ ...shippingForm, line2: e.target.value })}
                  />
                </div>

                <div className="form-grid-3">
                  <div className="floating-group">
                    <label>City *</label>
                    <input
                      type="text"
                      placeholder="e.g. Nagpur"
                      value={shippingForm.city}
                      onChange={e => setShippingForm({ ...shippingForm, city: e.target.value })}
                      required
                    />
                  </div>

                  <div className="floating-group">
                    <label>State *</label>
                    <select
                      value={shippingForm.state}
                      onChange={e => setShippingForm({ ...shippingForm, state: e.target.value })}
                    >
                      {INDIAN_STATES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="floating-group">
                    <label>PIN Code *</label>
                    <input
                      type="text"
                      placeholder="6 digits"
                      value={shippingForm.pincode}
                      onChange={e => setShippingForm({ ...shippingForm, pincode: e.target.value.replace(/[^\d]/g, '').slice(0, 6) })}
                      required
                    />
                  </div>
                </div>

                <div className="address-type-selector">
                  <span className="selector-label">Address Tag:</span>
                  <div className="type-pills">
                    {['Home', 'Office', 'Other'].map(t => (
                      <button
                        key={t}
                        type="button"
                        className={`type-pill ${shippingForm.label === t ? 'active' : ''}`}
                        onClick={() => setShippingForm({ ...shippingForm, label: t })}
                      >
                        {t === 'Office' ? <Briefcase size={13} /> : <Home size={13} />}
                        <span>{t}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* SECTION 3: PAYMENT METHOD */}
          <section className="checkout-luxury-card">
            <div className="card-section-header">
              <div className="header-title-wrap">
                <span className="section-idx">03</span>
                <h3><CreditCard size={20} /> Select Payment Method</h3>
              </div>
              <span className="secure-badge-pill">
                <ShieldCheck size={14} /> 100% Encrypted &amp; Insured
              </span>
            </div>

            <div className="payment-cards-container">
              {/* Razorpay Online Payment */}
              {online_payments && (
                <div
                  className={`payment-method-card ${paymentMethod === 'razorpay' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('razorpay')}
                >
                  <div className="pm-top-row">
                    <div className="pm-title-wrap">
                      <div className={`custom-radio ${paymentMethod === 'razorpay' ? 'checked' : ''}`}>
                        {paymentMethod === 'razorpay' && <div className="radio-inner" />}
                      </div>
                      <div>
                        <h4 className="pm-title">Online Payment (UPI, Cards, NetBanking)</h4>
                        <p className="pm-desc">Google Pay, PhonePe, Paytm, Visa, MasterCard, RuPay, All Major Banks</p>
                      </div>
                    </div>
                    <span className="pm-recom-badge">
                      <Sparkles size={12} /> RECOMMENDED
                    </span>
                  </div>

                  <div className="pm-perks-row">
                    <span className="perk-pill">⚡ Instant Dispatch Priority</span>
                    <span className="perk-pill">🔒 Zero Transaction Surcharge</span>
                    <span className="perk-pill">🛡️ Razorpay Buyer Protection</span>
                  </div>
                </div>
              )}

              {/* Cash On Delivery */}
              {cod_enabled && (
                <div
                  className={`payment-method-card ${paymentMethod === 'cod' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('cod')}
                >
                  <div className="pm-top-row">
                    <div className="pm-title-wrap">
                      <div className={`custom-radio ${paymentMethod === 'cod' ? 'checked' : ''}`}>
                        {paymentMethod === 'cod' && <div className="radio-inner" />}
                      </div>
                      <div>
                        <h4 className="pm-title">Cash on Delivery (COD)</h4>
                        <p className="pm-desc">Pay in cash or via UPI to the delivery executive upon arrival at your doorstep.</p>
                      </div>
                    </div>
                  </div>

                  <div className="pm-perks-row">
                    <span className="perk-pill">📦 Doorstep Verification</span>
                    <span className="perk-pill">📱 OTP Confirmation on Delivery</span>
                  </div>
                </div>
              )}

              {/* WhatsApp Direct Order Option if either store is offline or payments disabled */}
              {(!online_payments || !cod_enabled || isStoreOffline) && (
                <div
                  className={`payment-method-card ${paymentMethod === 'whatsapp' || isStoreOffline ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('whatsapp')}
                  style={{ border: '1.5px solid #25D366', background: 'rgba(37,211,102,0.05)' }}
                >
                  <div className="pm-top-row">
                    <div className="pm-title-wrap">
                      <div className={`custom-radio ${paymentMethod === 'whatsapp' || isStoreOffline ? 'checked' : ''}`} style={{ borderColor: '#25D366' }}>
                        <div className="radio-inner" style={{ background: '#25D366' }} />
                      </div>
                      <div>
                        <h4 className="pm-title" style={{ color: '#128C7E' }}>Order &amp; Inquire via WhatsApp</h4>
                        <p className="pm-desc">Complete order via direct consultation with our atelier team on WhatsApp.</p>
                      </div>
                    </div>
                    <span className="pm-recom-badge" style={{ background: '#25D366', color: 'white' }}>
                      WHATSAPP
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 4: BESPOKE ALTERATION & ORDER NOTES */}
          <section className="checkout-luxury-card">
            <div className="card-section-header">
              <div className="header-title-wrap">
                <span className="section-idx">04</span>
                <h3><Sparkles size={20} /> Atelier Customization Notes (Optional)</h3>
              </div>
            </div>
            <p className="section-instruction">
              Need custom sleeve attachment, specific blouse length, or special gift wrapping with a personalized note?
            </p>
            <textarea
              className="atelier-notes-textarea"
              rows={3}
              placeholder="e.g. Please attach short sleeves / Deliver in discreet gift packaging / Need by Friday for wedding ceremony..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </section>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Sticky Luxury Order Summary, Promo, Totals     */}
        {/* ============================================================ */}
        <div className="checkout-right-col">
          <div className="sticky-order-summary-card">
            <div className="summary-card-header">
              <h3>Bespoke Order Summary</h3>
              <span className="item-count-pill">{checkoutItems.length} {checkoutItems.length === 1 ? 'Outfit' : 'Outfits'}</span>
            </div>

            {/* Item List */}
            <div className="summary-items-scrollable">
              {checkoutItems.map((item, idx) => (
                <div key={idx} className="summary-product-item">
                  <div className="product-thumb-box">
                    <img
                      src={getProductImage(item.image || item.image_url)}
                      alt={item.title || item.name}
                      className="summary-thumb-img"
                    />
                    <span className="thumb-qty-badge">{item.qty || 1}</span>
                  </div>

                  <div className="product-details-box">
                    <h4 className="summary-item-name">{item.title || item.name}</h4>
                    <div className="summary-item-specs">
                      {/* If Direct Mode, allow size & qty adjustments right on the page! */}
                      {useDirectMode ? (
                        <div className="direct-edit-controls">
                          <div className="size-select-wrap">
                            <span className="spec-label">Size:</span>
                            <select
                              value={item.selectedSize || item.size || 'M'}
                              onChange={e => handleDirectSizeChange(e.target.value)}
                              className="size-inline-select"
                            >
                              {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          <div className="qty-stepper-wrap">
                            <button
                              type="button"
                              onClick={() => handleDirectQuantityChange(-1)}
                              disabled={(item.qty || 1) <= 1}
                              aria-label="Decrease"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="qty-number">{item.qty || 1}</span>
                            <button
                              type="button"
                              onClick={() => handleDirectQuantityChange(1)}
                              aria-label="Increase"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="static-item-specs">
                          <span className="spec-pill">Size: {item.selectedSize || item.size || 'M'}</span>
                          <span className="spec-pill">Qty: {item.qty || 1}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="product-price-box" style={{ textAlign: 'right' }}>
                    {item.mrp_price && Number(item.mrp_price) > Number(item.price) && (
                      <del style={{ fontSize: '0.8rem', color: '#999', textDecoration: 'line-through', display: 'block' }}>
                        {formatINR(item.mrp_price * (item.qty || 1))}
                      </del>
                    )}
                    <span className="item-calculated-price">{formatINR(item.price * (item.qty || 1))}</span>
                    {(item.promo_label || (item.discount_percent && item.discount_percent > 0)) && (
                      <span style={{ display: 'inline-block', fontSize: '0.65rem', color: '#27ae60', fontWeight: 700, background: 'rgba(39, 174, 96, 0.1)', padding: '2px 6px', borderRadius: '4px', marginTop: '2px' }}>
                        {item.promo_label || `${item.discount_percent}% OFF`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Promotional Offer Automatically Claimed Banner */}
            {totalPromoSavings > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(39, 174, 96, 0.12), rgba(46, 204, 113, 0.08))',
                border: '1.5px solid rgba(39, 174, 96, 0.35)',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.3rem' }}>🎉</span>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e824c' }}>
                      Promotional Offer Automatically Claimed!
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#555' }}>
                      You saved <strong>{formatINR(totalPromoSavings)}</strong> across your selected items.
                    </div>
                  </div>
                </div>
                <span style={{
                  background: '#27ae60',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '12px',
                  whiteSpace: 'nowrap'
                }}>
                  OFFER APPLIED
                </span>
              </div>
            )}

            {/* Privilege Coupon / Promo Section */}
            <div className="privilege-coupon-wrap">
              <div className="coupon-title-row">
                <span className="coupon-label"><Tag size={14} /> Atelier Privilege Promo Code</span>
              </div>

              {couponApplied ? (
                <div className="active-coupon-chip">
                  <div className="chip-left">
                    <CheckCircle2 size={16} className="check-gold" />
                    <div>
                      <span className="applied-code-name">{couponCode}</span>
                      <span className="applied-discount-val">−{formatINR(couponDiscount)} SAVED</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-remove-coupon"
                    onClick={handleRemoveCoupon}
                    aria-label="Remove coupon"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="coupon-input-group">
                    <input
                      type="text"
                      placeholder="Enter promo code (e.g. MIRAYA10)"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleApplyCoupon(couponCode)}
                    />
                    <button
                      type="button"
                      className="btn-apply-coupon"
                      onClick={() => handleApplyCoupon(couponCode)}
                    >
                      APPLY
                    </button>
                  </div>
                  {couponError && <p className="coupon-err-msg">{couponError}</p>}
                </>
              )}
            </div>

            {/* Price Calculations */}
            <div className="price-breakdown-card">
              {totalPromoSavings > 0 && (
                <div className="breakdown-row">
                  <span className="row-label">Total Catalog Value (MRP)</span>
                  <span className="row-val" style={{ textDecoration: 'line-through', color: '#999' }}>
                    {formatINR(totalMrp)}
                  </span>
                </div>
              )}

              {totalPromoSavings > 0 && (
                <div className="breakdown-row discount" style={{ color: '#27ae60' }}>
                  <span className="row-label">✨ Promotional Offer Discount</span>
                  <span className="row-val discount-val" style={{ color: '#27ae60', fontWeight: 700 }}>
                    −{formatINR(totalPromoSavings)}
                  </span>
                </div>
              )}

              <div className="breakdown-row">
                <span className="row-label">Ensemble Subtotal</span>
                <span className="row-val">{formatINR(subtotal)}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="breakdown-row discount">
                  <span className="row-label">Privilege Discount ({couponCode})</span>
                  <span className="row-val discount-val">−{formatINR(couponDiscount)}</span>
                </div>
              )}

              <div className="breakdown-row">
                <span className="row-label">Couture Silk Box Packaging</span>
                <span className="row-val free-highlight">
                  <del className="strike-val">₹500</del> FREE
                </span>
              </div>

              <div className="breakdown-row">
                <span className="row-label">Insured Express Courier</span>
                <span className="row-val free-highlight">
                  <del className="strike-val">₹250</del> FREE
                </span>
              </div>

              {/* Explicit 18% GST Summary Breakdown */}
              <div className="gst-tax-breakdown-box">
                <div className="gst-box-header">
                  <span className="gst-box-title">⚖️ 18% GST Summary (Included)</span>
                  <span className="gst-compliant-tag">GSTIN: 27AABCM9876Q1Z5</span>
                </div>
                <div className="gst-micro-row">
                  <span>Taxable Base Value (Net):</span>
                  <span>{formatINR(netTaxableAmount)}</span>
                </div>
                <div className="gst-micro-row">
                  <span>{isInterstate ? 'IGST @ 18% (Integrated Tax):' : 'CGST @ 9% + SGST @ 9% (18% Total):'}</span>
                  <span className="gst-amount-bold">{formatINR(gstInclusiveAmount)}</span>
                </div>
                <div className="gst-micro-row hsn-row">
                  <span>HSN Chapter Code:</span>
                  <span>6204 (Handcrafted Apparel)</span>
                </div>
              </div>

              <div className="breakdown-divider"></div>

              <div className="breakdown-row grand-total-row">
                <div>
                  <span className="grand-label">Grand Total Payable</span>
                  <span className="tax-inclusive-note">(Inclusive of 18% GST • Official Invoice Generated)</span>
                </div>
                <span className="grand-total-amount">{formatINR(finalTotal)}</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              className="btn-place-luxury-order"
              onClick={handlePlaceOrderClick}
              disabled={isProcessing}
              style={isStoreOffline || paymentMethod === 'whatsapp' || (!online_payments && !cod_enabled) ? { background: 'linear-gradient(135deg, #25D366, #128C7E)' } : {}}
            >
              <div className="btn-content">
                <Lock size={18} />
                <span>
                  {isProcessing
                    ? 'SECURING YOUR ORDER...'
                    : isStoreOffline || paymentMethod === 'whatsapp' || (!online_payments && !cod_enabled)
                    ? `ORDER VIA WHATSAPP (${formatINR(finalTotal)})`
                    : paymentMethod === 'cod'
                    ? `CONFIRM CASH ON DELIVERY (${formatINR(finalTotal)})`
                    : `PROCEED TO SECURE PAYMENT (${formatINR(finalTotal)})`}
                </span>
                <ArrowRight size={18} />
              </div>
              <div className="btn-shimmer"></div>
            </button>

            {/* Assurance Seals */}
            <div className="checkout-assurances-grid">
              <div className="assurance-item">
                <ShieldCheck size={16} className="assurance-icon" />
                <span>100% Authentic Handloom</span>
              </div>
              <div className="assurance-item">
                <Package size={16} className="assurance-icon" />
                <span>Signature Silk Box</span>
              </div>
              <div className="assurance-item">
                <Truck size={16} className="assurance-icon" />
                <span>Insured Transit</span>
              </div>
              <div className="assurance-item">
                <HelpCircle size={16} className="assurance-icon" />
                <span>Bespoke Concierge</span>
              </div>
            </div>

            <p className="checkout-terms-note">
              By placing this order, you agree to Miraya by Garima&apos;s{' '}
              <Link to="/terms" target="_blank">Terms of Service</Link> and{' '}
              <Link to="/shipping-returns" target="_blank">Alteration Policy</Link>.
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* COD CONFIRMATION MODAL                                       */}
      {/* ============================================================ */}
      {showCodModal && (
        <div className="cod-confirm-overlay" onClick={() => setShowCodModal(false)}>
          <div className="cod-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="cod-modal-header">
              <div className="cod-header-icon">
                <Truck size={28} />
              </div>
              <h3>Confirm Cash on Delivery</h3>
              <p>Please review your delivery details before placing your order.</p>
            </div>

            <div className="cod-summary-box">
              <div className="cod-row">
                <span>Recipient:</span>
                <strong>{shippingForm.fullName}</strong>
              </div>
              <div className="cod-row">
                <span>Phone:</span>
                <strong>+91 {shippingForm.phone}</strong>
              </div>
              <div className="cod-row">
                <span>Destination:</span>
                <span>{shippingForm.line1}, {shippingForm.city}, {shippingForm.state} - {shippingForm.pincode}</span>
              </div>
              <div className="cod-row total">
                <span>Cash Payable on Delivery:</span>
                <span className="gold-amt">{formatINR(finalTotal)}</span>
              </div>
            </div>

            <div className="cod-modal-actions">
              <button
                type="button"
                className="btn-cod-cancel"
                onClick={() => setShowCodModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-cod-confirm"
                onClick={executeOrderPlacement}
                disabled={isProcessing}
              >
                {isProcessing ? 'Placing Order...' : 'YES, PLACE ORDER'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
