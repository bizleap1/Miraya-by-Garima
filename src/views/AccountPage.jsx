'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  User, ShoppingBag, MapPin, Ruler, RotateCcw,
  Settings, LogOut, ChevronRight, Plus, Trash2, Check, Star, Edit2, Download, Heart, FileText, Loader2
} from 'lucide-react';
import API_URL from '../config';
import ConfirmModal from '../components/ConfirmModal';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import './AccountPage.css';


const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'orders', label: 'Order History', icon: ShoppingBag },
  { id: 'exchanges', label: 'Exchange Requests', icon: RotateCcw },
  { id: 'reviews', label: 'My Reviews', icon: Star },
  { id: 'addresses', label: 'Addresses', icon: MapPin }
];

const AccountPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storeSettings, setStoreSettings] = useState({ exchange_enabled: true, exchange_window_days: 7 });
  
  // Data states
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [measurements, setMeasurements] = useState([
    { id: 1, name: 'My Standard Fit', bust: 34, waist: 28, hips: 38, height: "5'5\"" }
  ]);
  const [measurementModal, setMeasurementModal] = useState(false);
  const [addresses, setAddresses] = useState([]);

  // Modals & Forms
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Ordered by mistake');
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [addressModal, setAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({ label: 'Home', fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false });
  
  // Exchange Modal State
  const [exchangeModal, setExchangeModal] = useState(false);
  const [exchangeOrder, setExchangeOrder] = useState(null);
  const [exchangeItem, setExchangeItem] = useState(null);
  const [exchangeReason, setExchangeReason] = useState('Size issue');
  const [exchangeNote, setExchangeNote] = useState('');
  const [selectedReplacementVariant, setSelectedReplacementVariant] = useState(null);
  const [exchangeQty, setExchangeQty] = useState(1);
  const [productVariants, setProductVariants] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [submittingExchange, setSubmittingExchange] = useState(false);

  const [settingsForm, setSettingsForm] = useState({ firstName: '', lastName: '', phone: '', currentPassword: '', newPassword: '' });


  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const { wishlist } = useWishlist();

  const api = useCallback(async (path, options = {}) => {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers }
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).msg || 'Error');
    return res.json();
  }, [token]);

  useEffect(() => {
    const savedUserStr = localStorage.getItem('user');
    let localUser = null;
    if (savedUserStr) {
      try {
        localUser = JSON.parse(savedUserStr);
        setUser(localUser);
        const nameParts = (localUser.name || '').split(' ');
        setSettingsForm({
          firstName: localUser.firstName || nameParts[0] || '',
          lastName: localUser.lastName || nameParts.slice(1).join(' ') || '',
          phone: localUser.phone || '',
          currentPassword: '',
          newPassword: ''
        });
      } catch (e) {}
    }

    if (!token && !localUser) {
      navigate('/auth');
      return;
    }

    if (location.state?.tab) setActiveTab(location.state.tab);

    const loadData = async () => {
      setLoading(true);
      try {
        const [profile, ordersData, returnsData, addrs, meas, setts] = await Promise.all([
          api('/api/auth/profile').catch(() => null),
          api('/api/orders').catch(() => []),
          api('/api/returns/my').catch(() => []),
          api('/api/addresses').catch(() => []),
          api('/api/measurements').catch(() => []),
          fetch(`${API_URL}/api/settings`).then(r => r.json()).catch(() => ({ exchange_enabled: true, exchange_window_days: 7 }))
        ]);

        if (setts) {
          setStoreSettings({
            exchange_enabled: setts.exchange_enabled !== undefined ? setts.exchange_enabled : true,
            exchange_window_days: setts.exchange_window_days || 7
          });
        }

        if (profile) {
          const nameParts = (profile.name || '').split(' ');
          const formatted = {
            ...profile,
            firstName: profile.firstName || nameParts[0] || 'User',
            lastName: profile.lastName || nameParts.slice(1).join(' ') || ''
          };
          setUser(formatted);
          setSettingsForm({
            firstName: formatted.firstName,
            lastName: formatted.lastName,
            phone: formatted.phone || '',
            currentPassword: '',
            newPassword: ''
          });
        }
        // Combine backend API orders with local storage orders (deduplicated by order ID)
        let backendOrders = Array.isArray(ordersData) ? ordersData : (ordersData?.orders || []);
        try {
          const localOrders = JSON.parse(localStorage.getItem('miraya_orders') || '[]');
          localOrders.forEach(lo => {
            if (!backendOrders.some(bo => String(bo.id) === String(lo.id))) {
              backendOrders.push(lo);
            }
          });
        } catch (e) {}
        setOrders(backendOrders);

        if (Array.isArray(returnsData)) setReturns(returnsData);
        if (Array.isArray(addrs)) setAddresses(addrs);
        if (Array.isArray(meas)) setMeasurements(meas);
      } catch (err) {
        console.error('Account data load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []); // Removed token, navigate, location.state, api to prevent infinite re-renders

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleOrderRealtime = (data) => {
      if (!data) return;
      api('/api/orders').then(ordersData => {
        let backendOrders = Array.isArray(ordersData) ? ordersData : (ordersData?.orders || []);
        setOrders(backendOrders);
      }).catch(() => {});
    };

    const handleExchangeRealtime = (data) => {
      if (!data) return;
      api('/api/returns/my').then(returnsData => {
        if (Array.isArray(returnsData)) setReturns(returnsData);
      }).catch(() => {});
    };

    socket.on('order.created', handleOrderRealtime);
    socket.on('order.updated', handleOrderRealtime);
    socket.on('exchange.created', handleExchangeRealtime);
    socket.on('exchange.updated', handleExchangeRealtime);

    return () => {
      socket.off('order.created', handleOrderRealtime);
      socket.off('order.updated', handleOrderRealtime);
      socket.off('exchange.created', handleExchangeRealtime);
      socket.off('exchange.updated', handleExchangeRealtime);
    };
  }, [socket, api]);


  const fetchUserReviews = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingReviews(true);
      const res = await fetch(`${API_URL}/api/reviews/user/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUserReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Error fetching user reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchUserReviews();
    }
  }, [activeTab, fetchUserReviews]);

  const handleDeleteMyReview = (review) => {
    setConfirmConfig({
      title: 'Delete Customer Review',
      message: `Are you sure you want to permanently delete your review for "${review.product?.name || 'this garment'}"?`,
      confirmText: 'Delete Review',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_URL}/api/reviews/${review.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.success) {
            toast?.success?.('Your review has been successfully removed.');
            setUserReviews(prev => prev.filter(r => r.id !== review.id));
            setConfirmConfig(null);
          } else {
            toast?.error?.(data.message || 'Failed to delete review.');
          }
        } catch (err) {
          console.error('Delete review error:', err);
          toast?.error?.('Server communication error.');
        }
      }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const askConfirm = (title, message, btnText, danger, onConfirm) => {
    setConfirmConfig({ message: title, subMessage: message, confirmText: btnText, danger, onConfirm: () => { onConfirm(); setConfirmConfig(null); } });
  };

  const { toast } = useToast();
  const [downloadingOrderId, setDownloadingOrderId] = useState(null);

  const handleDownloadInvoice = async (orderId) => {
    if (!orderId) return;
    setDownloadingOrderId(orderId);
    try {
      const currentToken = token || localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/orders/${orderId}/invoice`, {
        headers: {
          ...(currentToken && { Authorization: `Bearer ${currentToken}` })
        }
      });

      if (!res.ok) {
        throw new Error('Failed to generate invoice PDF');
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

      toast.success(`Tax invoice PDF #MRY-${orderId} downloaded!`, 'INVOICE READY');
    } catch (err) {
      console.error('Invoice download failed:', err);
      toast.error('Could not download PDF invoice. Please try again.', 'DOWNLOAD FAILED');
    } finally {
      setDownloadingOrderId(null);
    }
  };

  const handleOpenExchangeModal = async (order) => {
    if (!order || !order.items || order.items.length === 0) return;
    const targetItem = order.items[0];
    setExchangeOrder(order);
    setExchangeItem(targetItem);
    setExchangeReason('Size issue');
    setExchangeNote('');
    setExchangeQty(1);
    setLoadingVariants(true);
    try {
      const res = await fetch(`${API_URL}/api/products/${targetItem.product_id}`);
      const data = await res.json();
      const vars = data.variants || data.product?.variants || [];
      setProductVariants(vars);
      const firstAvailable = vars.find(v => (v.stock - (v.reserved_stock || 0)) > 0 && String(v.size).toUpperCase() !== String(targetItem.size).toUpperCase());
      setSelectedReplacementVariant(firstAvailable || vars[0] || null);
    } catch (e) {
      toast.error('Failed to load size options for this product.', 'EXCHANGE ERROR');
    } finally {
      setLoadingVariants(false);
      setExchangeModal(true);
    }
  };

  const submitExchangeRequest = async (e) => {
    e.preventDefault();
    if (!selectedReplacementVariant) {
      toast.error('Please select a replacement size for exchange.', 'SELECT SIZE');
      return;
    }
    setSubmittingExchange(true);
    try {
      const res = await fetch(`${API_URL}/api/returns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: exchangeOrder.id,
          product_id: exchangeItem.product_id,
          variant_id: exchangeItem.variant_id,
          exchange_variant_id: selectedReplacementVariant.id,
          exchange_quantity: exchangeQty,
          quantity: exchangeQty,
          reason: exchangeReason,
          type: 'EXCHANGE',
          customer_note: exchangeNote
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Exchange request #EX-${data.returnRequest.id} submitted!`, 'EXCHANGE REQUESTED');
        setExchangeModal(false);
        api('/api/returns/my').then(rData => { if (Array.isArray(rData)) setReturns(rData); }).catch(() => {});
      } else {
        toast.error(data.message || 'Failed to submit exchange request.', 'EXCHANGE ERROR');
      }
    } catch (err) {
      toast.error('Network error submitting exchange request.', 'NETWORK ERROR');
    } finally {
      setSubmittingExchange(false);
    }
  };

  // --- ADDRESSES ---

  const saveAddress = async (e) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await api(`/api/addresses/${editingAddress.id}`, { method: 'PUT', body: JSON.stringify(addressForm) });
      } else {
        await api('/api/addresses', { method: 'POST', body: JSON.stringify(addressForm) });
      }
      setAddresses(await api('/api/addresses'));
      setAddressModal(false);
      toast.success('Address saved successfully!', 'ADDRESS UPDATED');
    } catch (err) { toast.error(err.message || 'Failed to save address', 'ADDRESS ERROR'); }
  };

  const deleteAddress = (id) => {
    askConfirm('Delete Address?', 'This action cannot be undone.', 'Delete', true, async () => {
      await api(`/api/addresses/${id}`, { method: 'DELETE' });
      setAddresses(await api('/api/addresses'));
      toast.success('Address removed', 'ADDRESS REMOVED');
    });
  };

  const setDefaultAddress = async (id) => {
    await api(`/api/addresses/${id}`, { method: 'PUT', body: JSON.stringify({ isDefault: true }) });
    setAddresses(await api('/api/addresses'));
    toast.success('Default delivery address updated', 'PREFERENCE SAVED');
  };

  // --- RETURNS ---
  const submitReturn = async (e) => {
    e.preventDefault();
    try {
      await api('/api/returns', { method: 'POST', body: JSON.stringify({ orderId: returnOrder.id, reason: returnReason }) });
      setReturns(await api('/api/returns'));
      setOrders(await api('/api/orders')); // Refresh orders to show updated status
      setReturnModal(false);
      toast.success('Return request submitted successfully!', 'RETURN FILED');
    } catch (err) { toast.error(err.message || 'Return request failed', 'RETURN ERROR'); }
  };

  const submitCancelOrder = async (e) => {
    e.preventDefault();
    if (!cancellingOrder) return;
    try {
      await api(`/api/orders/${cancellingOrder.id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ cancel_reason: cancelReason || 'Cancelled by customer' })
      });
      setOrders(await api('/api/orders').catch(() => []));
      setCancelModal(false);
      toast.success(`Order #MRY-${cancellingOrder.id} has been cancelled.`, 'ORDER CANCELLED');
    } catch (err) {
      toast.error(err.message || 'Failed to cancel order.', 'CANCELLATION ERROR');
    }
  };

  // --- SETTINGS ---
  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ firstName: settingsForm.firstName, lastName: settingsForm.lastName, phone: settingsForm.phone })
      });
      if (res.ok) {
        const u = await res.json();
        setUser(u);
        localStorage.setItem('user', JSON.stringify(u));
        window.dispatchEvent(new Event('loginStateChange'));
        setEditProfileModal(false);
        toast.success('Profile details updated successfully!', 'PROFILE SAVED');
      }
    } catch (err) { toast.error('Failed to update profile', 'UPDATE ERROR'); }
  };

  if (loading && !user) return <div className="account-loading"><div className="spinner"></div></div>;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="account-overview">
            <div className="overview-header-card">
              <div className="ohc-avatar">
                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : (user?.name ? user.name.charAt(0).toUpperCase() : 'U')}
                {user?.lastName ? user.lastName.charAt(0).toUpperCase() : ''}
              </div>
              <div className="ohc-info">
                <h2>{user?.firstName || user?.name || 'User'} {user?.lastName || ''}</h2>
                <p>{user?.email}</p>
                {user?.phone ? (
                  <p>{user?.phone}</p>
                ) : (
                  <p className="add-phone" onClick={() => setEditProfileModal(true)}>
                    + Add Phone Number
                  </p>
                )}
              </div>
              <button className="ohc-edit-btn" onClick={() => setEditProfileModal(true)}>
                <Edit2 size={14} /> Edit Profile
              </button>
              <div className="ohc-bg-pattern"></div>
            </div>
            
            <div className="overview-stats-grid">
              <div className="stat-card">
                <div className="stat-card-header">
                  <Star className="stat-icon" size={20} strokeWidth={1.5} />
                  <span>Loyalty Points</span>
                </div>
                <h3>{user?.loyaltyPoints || 0}</h3>
                <p>Earn points on every purchase</p>
              </div>
              <div className="stat-card" onClick={() => setActiveTab('orders')}>
                <div className="stat-card-header">
                  <ShoppingBag className="stat-icon" size={20} strokeWidth={1.5} />
                  <span>Total Orders</span>
                </div>
                <h3>{orders.length || 0}</h3>
                <p>View your order history</p>
              </div>
              <div className="stat-card" onClick={() => setActiveTab('addresses')}>
                <div className="stat-card-header">
                  <MapPin className="stat-icon" size={20} strokeWidth={1.5} />
                  <span>Saved Addresses</span>
                </div>
                <h3>{addresses.length || 0}</h3>
                <p>Manage your addresses</p>
              </div>
              <div className="stat-card" onClick={() => navigate('/wishlist')}>
                <div className="stat-card-header">
                  <Heart className="stat-icon" size={20} strokeWidth={1.5} />
                  <span>Wishlist</span>
                </div>
                <h3>{wishlist?.length || 0}</h3>
                <p>View your wishlist</p>
              </div>
            </div>

            <div className="recent-orders-section">
              <div className="ro-header">
                <h3>Recent Orders</h3>
                <button className="view-all-link" onClick={() => setActiveTab('orders')}>View All Orders <ChevronRight size={16} /></button>
              </div>
              
              {orders.length > 0 ? (
                <div className="recent-orders-grid">
                  {orders.slice(0, 3).map(order => {
                    const dateStr = order.created_at || order.createdAt;
                    const orderDate = dateStr ? new Date(dateStr).toLocaleDateString('en-IN') : 'Recently';
                    const totalAmt = typeof order.total === 'number' ? order.total : parseInt(String(order.total || 0).replace(/[^\d]/g, ''), 10);
                    const statusStr = order.status ? String(order.status) : 'Processing';

                    return (
                      <div key={order.id} className="mini-order-card">
                        <div className="mo-header">
                          <span className="mo-id">#MRY-{order.id}</span>
                          <span className={`mo-status status-${statusStr.toLowerCase()}`}>{statusStr}</span>
                        </div>
                        <div className="mo-body">
                          <span>{orderDate}</span>
                          <span>₹{totalAmt.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-orders-state">
                  <div className="empty-icon-wrap"><ShoppingBag size={24} strokeWidth={1.5} /></div>
                  <h4>No recent orders found.</h4>
                  <p>When you place an order, it will appear here.</p>
                  <button className="btn-solid-burgundy" onClick={() => navigate('/')}>Start Shopping</button>
                </div>
              )}
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="account-orders">
            <h3 className="section-title">Order History</h3>
            <div className="orders-list">
              {orders.map(order => {
                const dateStr = order.created_at || order.createdAt;
                const orderDate = dateStr ? new Date(dateStr).toLocaleDateString('en-IN') : 'Recently';
                const totalAmt = typeof order.total === 'number' ? order.total : (typeof order.totalAmount === 'number' ? order.totalAmount : parseInt(String(order.total || 0).replace(/[^\d]/g, ''), 10));
                const statusStr = order.status ? String(order.status) : 'Processing';

                return (
                  <div key={order.id} className="order-history-card">
                    <div className="order-history-header">
                      <div>
                        <span className="oh-id">Order #MRY-{order.id}</span>
                        <span className="oh-date">Placed on {orderDate}</span>
                      </div>
                      <div className="oh-status-wrap">
                        <span className={`oh-status status-${statusStr.toLowerCase()}`}>{statusStr}</span>
                        <span className="oh-total">₹{totalAmt.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="order-history-items">
                      {order.items?.map((item, iIdx) => (
                        <div key={item.id || iIdx} className="oh-item">
                          <img src={item.product?.image_url || item.product?.image || '/products/Lehenga-Pink Blush/1.JPG'} alt={item.product?.name || 'Product'} />
                          <div className="oh-item-details">
                            <p className="oh-item-name">{item.product?.name || item.product?.title || 'Luxury Ethnic Wear'}</p>
                            <p className="oh-item-meta">Qty: {item.quantity || 1} {item.size ? `| Size: ${item.size}` : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="order-history-footer" style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', alignItems: 'center', marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px solid #eee' }}>
                      {storeSettings.exchange_enabled && ['DELIVERED', 'SHIPPED', 'COMPLETED', 'PROCESSING'].includes(statusStr.toUpperCase()) && (() => {
                        const deliveryDate = order.updated_at || order.created_at;
                        const diffDays = Math.floor((Date.now() - new Date(deliveryDate).getTime()) / (1000 * 3600 * 24));
                        const windowDays = storeSettings.exchange_window_days || 7;
                        if (diffDays <= windowDays) {
                          return (
                            <button
                              type="button"
                              className="btn-secondary btn-sm"
                              style={{
                                background: 'rgba(198, 164, 106, 0.12)',
                                color: '#7a5a22',
                                border: '1px solid #c6a46a',
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontWeight: '600',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                              onClick={() => handleOpenExchangeModal(order)}
                            >
                              <RotateCcw size={14} /> Request Exchange
                            </button>
                          );
                        }
                        return null;
                      })()}

                      {!['CANCELLED', 'SHIPPED', 'DELIVERED', 'REFUNDED'].includes(statusStr.toUpperCase()) && (
                        <button 
                          className="btn-danger btn-sm"
                          style={{
                            background: 'rgba(231, 76, 60, 0.08)',
                            color: '#e74c3c',
                            border: '1px solid #e74c3c',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setCancellingOrder(order);
                            setCancelReason('Ordered by mistake');
                            setCancelModal(true);
                          }}
                        >
                          Cancel Order
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(order.id)}
                        disabled={downloadingOrderId === order.id}
                        style={{
                          background: 'rgba(94, 10, 11, 0.05)',
                          color: 'var(--primary-burgundy)',
                          border: '1px solid var(--primary-burgundy)',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontWeight: '600',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {downloadingOrderId === order.id ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Generating PDF...
                          </>
                        ) : (
                          <>
                            <FileText size={14} /> Download Invoice
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
              {!orders.length && <p className="empty-state">You haven't placed any orders yet.</p>}
            </div>
          </div>
        );

      case 'exchanges':
        return (
          <div className="account-returns">
            <h3 className="section-title">Exchange Requests</h3>
            <p style={{ fontSize: '0.88rem', color: '#666', marginBottom: '1.2rem' }}>
              View and track size exchange requests for your delivered couture orders.
            </p>
            <div className="returns-list">
              {returns.map(ex => (
                <div key={ex.id} className="return-card" style={{ borderLeft: '4px solid var(--primary-burgundy)' }}>
                  <div className="ret-header">
                    <span>Exchange #EX-{ex.id} <span style={{ color: '#888', fontSize: '0.85rem' }}>(Order #MRY-{ex.order_id || ex.orderId})</span></span>
                    <span className={`status-badge ${String(ex.status).toLowerCase()}`}>{ex.status}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px', background: '#fcfaf7', padding: '10px', borderRadius: '6px' }}>
                    <div><span style={{ fontSize: '11px', color: '#888' }}>Purchased Size:</span> <strong style={{ color: '#5e0a0b' }}>{ex.variant?.size || 'N/A'}</strong></div>
                    <div><span style={{ fontSize: '11px', color: '#888' }}>Requested Size:</span> <strong style={{ color: '#15803d' }}>{ex.exchange_variant?.size || 'N/A'}</strong></div>
                  </div>
                  <p className="ret-reason" style={{ marginTop: '8px' }}><strong>Reason:</strong> {ex.reason}</p>
                  <p className="ret-date" style={{ fontSize: '0.78rem', color: '#888', marginTop: '4px' }}>Requested on {new Date(ex.created_at || ex.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
              ))}
              {!returns.length && <p className="empty-state">No size exchange requests submitted yet.</p>}
            </div>
          </div>
        );


      case 'reviews':
        return (
          <div className="account-reviews">
            <h3 className="section-title">My Product Reviews</h3>
            <p style={{ fontSize: '0.88rem', color: '#666', marginBottom: '1.2rem' }}>
              View and manage the feedback and star ratings you have shared for Miraya garments.
            </p>
            {loadingReviews ? (
              <p style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>Loading your reviews...</p>
            ) : userReviews.length > 0 ? (
              <div className="user-reviews-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {userReviews.map((rev) => (
                  <div key={rev.id} style={{
                    background: '#fff',
                    border: '1px solid rgba(198, 164, 106, 0.3)',
                    borderRadius: '8px',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {rev.product?.image_url && (
                          <img
                            src={rev.product.image_url}
                            alt={rev.product.name}
                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e0d8cc' }}
                          />
                        )}
                        <div>
                          <h4 style={{ margin: 0, color: '#5e0a0b', fontSize: '1rem', fontFamily: 'var(--font-heading)' }}>
                            {rev.product?.name || `Product #${rev.product_id}`}
                          </h4>
                          <span style={{ fontSize: '0.75rem', color: '#888' }}>
                            {new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteMyReview(rev)}
                        style={{
                          background: '#fff5f5',
                          border: '1px solid rgba(220, 53, 69, 0.35)',
                          color: '#c0392b',
                          padding: '6px 14px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Trash2 size={13} /> Delete Review
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={15}
                          fill={s <= (Number(rev.rating) || 0) ? '#d4af37' : 'none'}
                          color={s <= (Number(rev.rating) || 0) ? '#d4af37' : '#dcd4c8'}
                        />
                      ))}
                    </div>

                    {rev.title && <strong style={{ fontSize: '0.92rem', color: '#222' }}>{rev.title}</strong>}
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#555', lineHeight: 1.5 }}>{rev.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 0', background: '#fff', borderRadius: '12px', border: '1px dashed #ccc' }}>
                <Star size={36} color="#c6a46a" style={{ margin: '0 auto 12px auto' }} />
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>No Reviews Submitted Yet</h4>
                <p style={{ margin: '0 0 1.5rem 0', color: '#777', fontSize: '0.9rem' }}>
                  Share your fitting and styling experience on any couture garment.
                </p>
                <Link to="/collection" className="btn-solid-burgundy" style={{ display: 'inline-block', padding: '0.6rem 1.4rem', textDecoration: 'none', color: '#fff', borderRadius: '4px' }}>
                  Explore Collection
                </Link>
              </div>
            )}
          </div>
        );

      case 'addresses':
        return (
          <div className="account-addresses">
            <div className="section-header-flex">
              <h3 className="section-title">Saved Addresses</h3>
              <button className="btn-primary btn-sm" onClick={() => {
                setEditingAddress(null);
                setAddressForm({ label: 'Home', fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false });
                setAddressModal(true);
              }}><Plus size={16} /> Add New Address</button>
            </div>
            <div className="address-grid">
              {addresses.map(addr => (
                <div key={addr.id} className={`address-card ${addr.isDefault ? 'default' : ''}`}>
                  {addr.isDefault && <span className="default-badge">Default</span>}
                  <div className="addr-label">{addr.label}</div>
                  <h4>{addr.fullName}</h4>
                  <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                  <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                  <p className="addr-phone">Phone: {addr.phone}</p>
                  <div className="addr-actions">
                    <button className="btn-icon" onClick={() => { setEditingAddress(addr); setAddressForm(addr); setAddressModal(true); }}><Edit2 size={16} /></button>
                    <button className="btn-icon danger" onClick={() => deleteAddress(addr.id)}><Trash2 size={16} /></button>
                    {!addr.isDefault && <button className="btn-secondary btn-sm" onClick={() => setDefaultAddress(addr.id)}>Set as Default</button>}
                  </div>
                </div>
              ))}
              {!addresses.length && <p className="empty-state">No addresses saved.</p>}
            </div>
          </div>
        );

      case 'measurements':
        return (
          <div className="account-measurements">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 className="section-title" style={{ margin: 0 }}>Measurement Profiles</h3>
              <button className="btn-solid-burgundy btn-sm" onClick={() => setMeasurementModal(true)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                <Plus size={14} style={{ marginRight: '0.3rem' }} /> Add New Profile
              </button>
            </div>
            
            {measurements.length > 0 ? (
              <div className="measurements-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {measurements.map(profile => (
                  <div key={profile.id} className="measurement-card" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '1.5rem', transition: 'box-shadow 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '1rem' }}>
                      <h4 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: '#5e0a0b', fontSize: '1.1rem' }}>{profile.name}</h4>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-icon" style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}><Edit2 size={14} /></button>
                        <button className="btn-icon" style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer' }} onClick={() => setMeasurements(m => m.filter(x => x.id !== profile.id))}><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', color: '#555' }}>
                      <div><strong>Bust:</strong> {profile.bust} in</div>
                      <div><strong>Waist:</strong> {profile.waist} in</div>
                      <div><strong>Hips:</strong> {profile.hips} in</div>
                      <div><strong>Height:</strong> {profile.height}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 0', background: '#fff', borderRadius: '12px', border: '1px dashed #ccc' }}>
                <div style={{ width: '60px', height: '60px', background: '#fdf8f5', color: '#cda372', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
                </div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>No Profiles Saved</h4>
                <p style={{ margin: '0 0 1.5rem 0', color: '#777', fontSize: '0.9rem' }}>Save your measurements for a faster checkout experience.</p>
                <button className="btn-solid-burgundy" onClick={() => setMeasurementModal(true)}>Create Profile</button>
              </div>
            )}
            
            {measurementModal && (
              <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="modal-content" style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                  <h3 style={{ marginTop: 0, fontFamily: 'var(--font-heading)', color: '#5e0a0b', marginBottom: '1.5rem' }}>Add Measurement Profile</h3>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Profile Name</label>
                    <input type="text" placeholder="e.g., My Regular Fit" style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Bust (in)</label>
                      <input type="number" placeholder="34" style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Waist (in)</label>
                      <input type="number" placeholder="28" style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Hips (in)</label>
                      <input type="number" placeholder="38" style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Height</label>
                      <input type="text" placeholder="5'5&quot;" style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => setMeasurementModal(false)} style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', color: '#555' }}>Cancel</button>
                    <button className="btn-solid-burgundy" onClick={() => {
                      setMeasurements([...measurements, { id: Date.now(), name: 'New Profile', bust: 34, waist: 28, hips: 38, height: "5'5\"" }]);
                      setMeasurementModal(false);
                    }} style={{ padding: '0.6rem 1.2rem', border: 'none' }}>Save Profile</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'settings':
        return (
          <div className="account-settings">
            <h3 className="section-title">Profile Settings</h3>
            <div className="settings-card">
              <form onSubmit={saveProfile} className="settings-form">
                <div className="form-group-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input value={settingsForm.firstName} onChange={e => setSettingsForm({ ...settingsForm, firstName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input value={settingsForm.lastName} onChange={e => setSettingsForm({ ...settingsForm, lastName: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input value={settingsForm.phone} onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input value={user.email} disabled className="input-disabled" />
                </div>
                <button type="submit" className="btn-primary">Save Changes</button>
              </form>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="account-page-wrapper">
      <ConfirmModal config={confirmConfig} onClose={() => setConfirmConfig(null)} />
      
      <div className="account-layout">
        <aside className="sidebar">


          <div className="sidebar-profile">
            <div className="profile-avatar" style={{
              backgroundImage: user?.profilePhoto ? `url(${user.profilePhoto})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: user?.profilePhoto ? 'transparent' : 'inherit'
            }}>
              {!user?.profilePhoto && (user?.firstName ? user.firstName.charAt(0).toUpperCase() : (user?.name ? user.name.charAt(0).toUpperCase() : 'U'))}
              {!user?.profilePhoto && (user?.lastName ? user.lastName.charAt(0).toUpperCase() : '')}
            </div>
            <div className="profile-info">
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '400' }}>{user?.firstName || 'User'} {user?.lastName || ''}</h3>
              <p className="profile-email">{user?.email}</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
              <User size={18} strokeWidth={1.5} /> <span>Overview</span>
            </button>
            <button className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
              <ShoppingBag size={18} strokeWidth={1.5} /> <span>Order History</span>
            </button>
            <button className={`nav-item ${activeTab === 'addresses' ? 'active' : ''}`} onClick={() => setActiveTab('addresses')}>
              <MapPin size={18} strokeWidth={1.5} /> <span>Addresses</span>
            </button>

            <div className="nav-divider"></div>

            <button className="nav-item logout" onClick={handleLogout}>
              <LogOut size={18} strokeWidth={1.5} /> <span>Logout</span>
            </button>
          </nav>
        </aside>

        {activeTab === 'overview' ? <main className="main-content-boxed">{renderTabContent()}</main> : <main className="main-content-boxed">{renderTabContent()}</main>}
      </div>

      {/* MODALS */}
      {addressModal && (
        <div className="modal-overlay" data-lenis-prevent="true" onClick={() => setAddressModal(false)}>
          <div className="modal-content" data-lenis-prevent="true" style={{ overscrollBehavior: 'contain' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
              <button className="btn-close" onClick={() => setAddressModal(false)}>✕</button>
            </div>
            <form onSubmit={saveAddress} className="modal-form">
              <div className="form-group">
                <label>Label</label>
                <select value={addressForm.label} onChange={e => setAddressForm({ ...addressForm, label: e.target.value })}>
                  <option>Home</option><option>Office</option><option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input required value={addressForm.fullName} onChange={e => setAddressForm({ ...addressForm, fullName: e.target.value })} placeholder="Full Name" />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input required type="tel" value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} placeholder="10-digit mobile number" />
              </div>
              <div className="form-group">
                <label>Address Line 1</label>
                <input required value={addressForm.line1} onChange={e => setAddressForm({ ...addressForm, line1: e.target.value })} placeholder="Flat, House no., Building, Street" />
              </div>
              <div className="form-group">
                <label>Address Line 2 (Optional)</label>
                <input value={addressForm.line2} onChange={e => setAddressForm({ ...addressForm, line2: e.target.value })} placeholder="Apartment, Landmark, Area" />
              </div>
              <div className="form-group-row">
                <div className="form-group">
                  <label>City</label>
                  <input required value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} placeholder="City" />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input required value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} placeholder="State" />
                </div>
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input required value={addressForm.pincode} onChange={e => setAddressForm({ ...addressForm, pincode: e.target.value })} placeholder="6-digit Pincode" />
              </div>
              <button type="submit" className="btn-primary w-full">Save Address</button>
            </form>
          </div>
        </div>
      )}

      {/* EXCHANGE REQUEST MODAL */}
      {exchangeModal && exchangeItem && (
        <div className="modal-overlay" data-lenis-prevent="true" onClick={() => setExchangeModal(false)}>
          <div className="modal-content" data-lenis-prevent="true" style={{ overscrollBehavior: 'contain', maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request Size Exchange</h3>
              <button className="btn-close" onClick={() => setExchangeModal(false)}>✕</button>
            </div>
            <form onSubmit={submitExchangeRequest} className="modal-form">
              {/* Product Info Card */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', background: '#fdfbf7', border: '1px solid #e8ded1', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                <img
                  src={exchangeItem.product?.image_url || exchangeItem.product?.image || '/products/Lehenga-Pink Blush/1.JPG'}
                  alt=""
                  style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '6px' }}
                />
                <div>
                  <strong style={{ fontSize: '15px', color: '#5e0a0b', display: 'block' }}>{exchangeItem.product?.name || exchangeItem.product?.title || 'Garment'}</strong>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                    Purchased Size: <strong>{exchangeItem.size || 'M'}</strong> | Qty: <strong>{exchangeItem.quantity || 1}</strong>
                  </div>
                </div>
              </div>

              {/* Reason for Exchange */}
              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#444' }}>Reason for Exchange</label>
                <select
                  value={exchangeReason}
                  onChange={e => setExchangeReason(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                >
                  <option value="Size issue">Size issue</option>
                  <option value="Fit issue">Fit issue</option>
                  <option value="Received wrong size">Received wrong size</option>
                  <option value="Received wrong item">Received wrong item</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Replacement Size Selector */}
              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#444' }}>Exchange To Size</label>
                {loadingVariants ? (
                  <div style={{ fontSize: '13px', color: '#888', padding: '10px' }}><Loader2 size={16} className="animate-spin" /> Loading sizes...</div>
                ) : (
                  <select
                    value={selectedReplacementVariant?.id || ''}
                    onChange={e => {
                      const sel = productVariants.find(v => String(v.id) === String(e.target.value));
                      setSelectedReplacementVariant(sel || null);
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                  >
                    {productVariants.map(v => {
                      const availStock = Math.max(0, (v.stock || 0) - (v.reserved_stock || 0));
                      const isSameSize = String(v.size).toUpperCase() === String(exchangeItem.size).toUpperCase();
                      const isOos = availStock <= 0;

                      return (
                        <option key={v.id} value={v.id} disabled={isOos}>
                          Size {v.size} {isSameSize ? '(Current Size)' : ''} {isOos ? '— Out of Stock' : `(${availStock} available)`}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Quantity Selector */}
              {(exchangeItem.quantity || 1) > 1 && (
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#444' }}>Exchange Quantity</label>
                  <select
                    value={exchangeQty}
                    onChange={e => setExchangeQty(parseInt(e.target.value, 10))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                  >
                    {Array.from({ length: exchangeItem.quantity || 1 }, (_, idx) => idx + 1).map(n => (
                      <option key={n} value={n}>{n} unit{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Customer Note */}
              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#444' }}>Additional Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={exchangeNote}
                  onChange={e => setExchangeNote(e.target.value)}
                  placeholder="E.g., Need 2 inches looser around hips..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px' }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingExchange || !selectedReplacementVariant}
                className="btn-primary w-full"
                style={{ background: 'var(--primary-burgundy)', color: '#fff', padding: '12px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
              >
                {submittingExchange ? 'Submitting Request...' : 'Submit Exchange Request'}
              </button>
            </form>
          </div>
        </div>
      )}


      {editProfileModal && (
        <div className="modal-overlay" data-lenis-prevent="true" onClick={() => setEditProfileModal(false)}>
          <div className="modal-content" data-lenis-prevent="true" style={{ overscrollBehavior: 'contain' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Profile & Contact Details</h3>
              <button className="btn-close" onClick={() => setEditProfileModal(false)}>✕</button>
            </div>
            <form onSubmit={saveProfile} className="modal-form">
              <div className="form-group-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    required
                    value={settingsForm.firstName}
                    onChange={e => setSettingsForm({ ...settingsForm, firstName: e.target.value })}
                    placeholder="First Name"
                  />
                </div>
                <div className="form-group">
                  <label>Surname / Last Name</label>
                  <input
                    required
                    value={settingsForm.lastName}
                    onChange={e => setSettingsForm({ ...settingsForm, lastName: e.target.value })}
                    placeholder="Surname / Last Name"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Phone / Mobile Number</label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={settingsForm.phone}
                  onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email Address (Account ID)</label>
                <input value={user?.email || ''} disabled className="input-disabled" />
              </div>
              <button type="submit" className="btn-primary w-full">Save Profile Changes</button>
            </form>
          </div>
        </div>
      )}

      {cancelModal && (
        <div className="modal-overlay" data-lenis-prevent="true" onClick={() => setCancelModal(false)}>
          <div className="modal-content" data-lenis-prevent="true" style={{ overscrollBehavior: 'contain' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cancel Order #MRY-{cancellingOrder?.id}</h3>
              <button className="btn-close" onClick={() => setCancelModal(false)}>✕</button>
            </div>
            <form onSubmit={submitCancelOrder} className="modal-form">
              <div className="form-group">
                <label>Reason for Cancellation</label>
                <select 
                  value={cancelReason} 
                  onChange={e => setCancelReason(e.target.value)}
                  style={{ padding: '0.7rem', borderRadius: '6px', border: '1px solid #ccc', width: '100%', marginBottom: '0.8rem' }}
                >
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Want to change size or color">Want to change size or color</option>
                  <option value="Delivery time is too long">Delivery time is too long</option>
                  <option value="Found better alternative">Found better alternative</option>
                  <option value="Other reason">Other reason</option>
                </select>
                {cancelReason === 'Other reason' && (
                  <textarea
                    rows={3}
                    placeholder="Please specify your reason..."
                    onChange={e => setCancelReason(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                )}
              </div>
              <button type="submit" className="btn-primary w-full" style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '0.85rem', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>
                Confirm Order Cancellation
              </button>
            </form>
          </div>
        </div>
      )}

      {confirmConfig && (
        <ConfirmModal
          config={confirmConfig}
          onClose={() => setConfirmConfig(null)}
        />
      )}
    </div>
  );
};

export default AccountPage;
