import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Ruler, Heart, LogOut, Headphones, ChevronRight, Plus, Trash2, User, Trash, PenTool, ShoppingCart, Settings } from 'lucide-react';
import API_URL from '../config';
import ConfirmModal from '../components/ConfirmModal';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import './AccountPage.css';

// --- MOCK DATA ---
const orderHistoryData = [
  {
    id: '#MRY12345',
    date: '15 May, 2024',
    price: '₹45,000',
    items: 3,
    status: 'Delivered',
    deliveryDate: '22 May, 2024',
    image: '/kurti_mega.png'
  },
  {
    id: '#MRY12312',
    date: '02 May, 2024',
    price: '₹28,500',
    items: 2,
    status: 'Shipped',
    deliveryDate: 'Expected Delivery 10 May, 2024',
    image: '/saree_mega.png'
  },
  {
    id: '#MRY12210',
    date: '18 Apr, 2024',
    price: '₹36,000',
    items: 1,
    status: 'Delivered',
    deliveryDate: '24 Apr, 2024',
    image: '/anarkali_mega.png'
  }
];


const wishlistData = [
  {
    id: 1,
    title: 'Red Embroidered Kurti',
    price: '₹85,000',
    size: 'M',
    stock: 'In Stock',
    image: '/kurti_mega.png'
  },
  {
    id: 2,
    title: 'Beige Silk Saree',
    price: '₹32,500',
    size: 'Free Size',
    stock: 'In Stock',
    image: '/saree_mega.png'
  },
  {
    id: 3,
    title: 'Blush Anarkali Set',
    price: '₹28,000',
    size: 'M',
    stock: 'Low Stock',
    isLowStock: true,
    image: '/anarkali_mega.png'
  },
  {
    id: 4,
    title: 'Sage Green Sharara',
    price: '₹26,000',
    size: 'M',
    stock: 'In Stock',
    image: '/sharara_mega.png'
  }
];

const AccountPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({});
  const [globalError, setGlobalError] = useState(null);
  const [globalSuccess, setGlobalSuccess] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [checkoutAddress, setCheckoutAddress] = useState('');

  const askConfirm = (message, subMessage, confirmText, danger, onConfirm, isAlert = false, isSuccess = false) =>
    setConfirmConfig({ message, subMessage, confirmText, danger, onConfirm, isAlert, isSuccess });

  // Set tab from navbar link state
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  const showError = (msg) => {
    setGlobalError(msg);
    setTimeout(() => setGlobalError(null), 5000);
  };
  const showSuccess = (msg) => {
    setGlobalSuccess(msg);
    setTimeout(() => setGlobalSuccess(null), 5000);
  };

  const [measurements, setMeasurements] = useState([]);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null); // null when not editing, {} for new, or profile for editing

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const { cartItems, setCartItems } = useCart();

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      setLoadingOrders(true);
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        showError("Failed to fetch orders from server");
      }
    } catch (err) {
      console.error("Failed to fetch orders", err);
      showError("A network error occurred while fetching orders.");
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchMeasurements = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      setLoadingMeasurements(true);
      const res = await fetch(`${API_URL}/api/measurements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMeasurements(data);
        if (data.length > 0 && !selectedProfileId) {
          setSelectedProfileId(data[0].id);
        }
      } else {
        showError("Failed to fetch measurements");
      }
    } catch (err) {
      console.error("Failed to fetch measurements", err);
      showError("A network error occurred while fetching measurements.");
    } finally {
      setLoadingMeasurements(false);
    }
  };

  const saveMeasurement = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const method = editingProfile.id ? 'PUT' : 'POST';
      const url = editingProfile.id
        ? `${API_URL}/api/measurements/${editingProfile.id}`
        : `${API_URL}/api/measurements`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingProfile)
      });
      if (res.ok) {
        const saved = await res.json();
        setEditingProfile(null);
        fetchMeasurements();
        setSelectedProfileId(saved.id);
      } else {
        showError("Failed to save measurement profile. Please try again.");
      }
    } catch (err) {
      console.error("Failed to save measurement", err);
      showError("A network error occurred while saving profile.");
    }
  };

  const deleteMeasurement = (id) => {
    askConfirm(
      'Delete Profile?',
      'Are you sure you want to delete this profile?',
      'Delete',
      true,
      async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          const res = await fetch(`${API_URL}/api/measurements/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            fetchMeasurements();
            if (selectedProfileId === id) setSelectedProfileId(null);
          } else {
            showError("Failed to delete measurement profile.");
          }
        } catch (err) {
          console.error("Failed to delete measurement", err);
          showError("A network error occurred while deleting profile.");
        }
      }
    );
  };

  const { wishlist, toggleWishlist } = useWishlist();
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/auth');
        return;
      }
      fetchOrders();
      fetchMeasurements();
      // Fetch fresh data from DB in background
      fetch(`${API_URL}/api/auth/profile`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(fresh => { if (fresh) { setUser(fresh); localStorage.setItem('user', JSON.stringify(fresh)); } })
        .catch(() => { });
    } else {
      navigate('/auth');
    }
  }, [navigate]);

  const placeCheckoutOrder = async (deliveryAddress) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const payload = {
        cartItems: cartItems.map(item => ({
          productId: item.id,
          quantity: item.qty,
          product: { price: item.price }
        })),
        address: deliveryAddress || user?.address || 'No address provided'
      };

      const res = await fetch(`${API_URL}/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchOrders();
      } else {
        const errorData = await res.json();
        showError(errorData.msg || "Failed to place order. Please try again.");
      }
    } catch (err) {
      showError("A network error occurred while placing order.");
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setCheckoutAddress(user?.address || '');
    setShowAddressModal(true);
  };

  const confirmCheckout = async (e) => {
    if (e) e.preventDefault();
    if (!checkoutAddress.trim()) {
      showError("Please enter your delivery address.");
      return;
    }
    setShowAddressModal(false);
    await placeCheckoutOrder(checkoutAddress);
    setCartItems([]);
    setActiveTab('orders');
  };

  const removeWishlistItem = async (id) => {
    toggleWishlist({ id });
  };

  const moveToCart = (product) => {
    // Check if already in cart
    if (cartItems.find(c => c.id === product.id)) {
      askConfirm('Already in Bag', 'This item is already in your shopping bag.', 'OK', false, null, true);
      return;
    }
    setCartItems([...cartItems, {
      id: product.id,
      title: product.name,
      price: product.price,
      image: product.image,
      qty: 1
    }]);
    // Optionally remove from wishlist
    removeWishlistItem(product.id);
    askConfirm('Added to Bag', `${product.name} has been successfully added to your shopping bag.`, 'Continue', false, null, true, true);
  };

  const cancelOrder = (orderId) => {
    askConfirm(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      'Yes, Cancel Order',
      true,
      async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          const res = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            fetchOrders();
          } else {
            showError("Could not cancel the order. It might already be shipped.");
          }
        } catch (err) {
          showError("A network error occurred while cancelling order.");
        }
      }
    );
  };

  // States for sub-tabs
  const [orderFilter, setOrderFilter] = useState('ALL ORDERS');

  // Render Order History Tab
  const renderOrders = () => (
    <div className="tab-content animate-fade">
      <div className="tab-header">
        <div className="tab-title-wrap">
          <h2>Order History</h2>
          <p>Track and view all your past purchases.</p>
        </div>
      </div>

      <div className="order-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {['ALL ORDERS'].map(filter => (
            <button
              key={filter}
              className={`filter-btn ${orderFilter === filter ? 'active' : ''}`}
              onClick={() => setOrderFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        <button className="card-btn-small" style={{ background: 'var(--primary-burgundy)', color: 'white' }} onClick={() => setActiveTab('cart')}>
          VIEW CART
        </button>
      </div>

      <div className="orders-list-detailed">
        {loadingOrders ? <p style={{ textAlign: 'center', padding: '2rem' }}>Loading orders...</p> :
          orders.length === 0 ? <p style={{ textAlign: 'center', padding: '2rem' }}>No orders found.</p> :
            orders.filter(o => orderFilter === 'ALL ORDERS' || o?.status === orderFilter).map((order, idx) => (
              <div className="order-row" key={idx} style={{ opacity: order.status === 'CANCELLED' ? 0.6 : 1 }}>
                <div className="order-item-img" style={{ background: '#f9f6f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '2rem' }}>🛍️</span>
                </div>

                <div className="order-item-info">
                  <p className="order-id-text">Order <span>#MRY-{order.id}</span></p>
                  <p className="order-date-text">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                  <p className="order-price-text">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                  <p className="order-items-text">1 Custom Item</p>
                </div>

                <div className="order-item-status">
                  <p className={`status-badge ${order.status?.toLowerCase()}`}>{order.status}</p>
                  <p className="delivery-date-text">
                    {order.status === 'SHIPPED' ? `Expected by ${new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}` :
                      order.status === 'DELIVERED' ? `Delivered on ${new Date(order.createdAt).toLocaleDateString()}` :
                        order.status === 'CANCELLED' ? `Cancelled` : 'In progress'}
                  </p>
                </div>

                <div className="order-item-action" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <button className="card-btn-small">
                    {order.status === 'SHIPPED' ? 'TRACK ORDER' : 'VIEW DETAILS'} ⟶
                  </button>
                  {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
                    <button
                      className="card-btn-small"
                      style={{ color: 'red', borderColor: 'red' }}
                      onClick={() => cancelOrder(order.id)}
                    >
                      CANCEL ORDER ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
      </div>

    </div>
  );

  // Render Measurements Tab
  const renderMeasurements = () => {
    const selectedProfile = measurements.find(p => p.id === selectedProfileId) || measurements[0];

    return (
      <div className="tab-content animate-fade">
        <div className="tab-header flex-between">
          <div className="tab-title-wrap">
            <h2>My Measurements</h2>
            <p>Manage your measurements for the perfect custom fit.</p>
          </div>
          {!editingProfile && (
            <button className="btn-solid-burgundy" onClick={() => setEditingProfile({
              title: '', fullName: '', height: '', bust: '', waist: '', hips: '', shoulder: '', armLength: '', neck: '', isDefault: false
            })}>
              ADD NEW PROFILE
            </button>
          )}
        </div>

        {editingProfile ? (
          <div className="measurements-form-container" style={{ background: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #ebebeb' }}>
            <h3>{editingProfile.id ? 'Edit Profile' : 'New Profile'}</h3>
            <form onSubmit={saveMeasurement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <input required placeholder="Profile Title (e.g. Wedding)" value={editingProfile.title} onChange={e => setEditingProfile({ ...editingProfile, title: e.target.value })} style={{ padding: '0.8rem', border: '1px solid #ccc' }} />
                <input required placeholder="Full Name" value={editingProfile.fullName} onChange={e => setEditingProfile({ ...editingProfile, fullName: e.target.value })} style={{ padding: '0.8rem', border: '1px solid #ccc' }} />
                <input required placeholder="Height" value={editingProfile.height} onChange={e => setEditingProfile({ ...editingProfile, height: e.target.value })} style={{ padding: '0.8rem', border: '1px solid #ccc' }} />
                <input required placeholder="Bust" value={editingProfile.bust} onChange={e => setEditingProfile({ ...editingProfile, bust: e.target.value })} style={{ padding: '0.8rem', border: '1px solid #ccc' }} />
                <input required placeholder="Waist" value={editingProfile.waist} onChange={e => setEditingProfile({ ...editingProfile, waist: e.target.value })} style={{ padding: '0.8rem', border: '1px solid #ccc' }} />
                <input required placeholder="Hips" value={editingProfile.hips} onChange={e => setEditingProfile({ ...editingProfile, hips: e.target.value })} style={{ padding: '0.8rem', border: '1px solid #ccc' }} />
                <input required placeholder="Shoulder" value={editingProfile.shoulder} onChange={e => setEditingProfile({ ...editingProfile, shoulder: e.target.value })} style={{ padding: '0.8rem', border: '1px solid #ccc' }} />
                <input required placeholder="Arm Length" value={editingProfile.armLength} onChange={e => setEditingProfile({ ...editingProfile, armLength: e.target.value })} style={{ padding: '0.8rem', border: '1px solid #ccc' }} />
                <input required placeholder="Neck" value={editingProfile.neck} onChange={e => setEditingProfile({ ...editingProfile, neck: e.target.value })} style={{ padding: '0.8rem', border: '1px solid #ccc' }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={editingProfile.isDefault} onChange={e => setEditingProfile({ ...editingProfile, isDefault: e.target.checked })} />
                Set as Default Profile
              </label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-solid-burgundy" style={{ padding: '0.8rem 2rem', border: 'none', color: 'white', cursor: 'pointer' }}>SAVE PROFILE</button>
                <button type="button" onClick={() => setEditingProfile(null)} style={{ padding: '0.8rem 2rem', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}>CANCEL</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="measurements-layout">
            <div className="profiles-list">
              {loadingMeasurements ? (
                <p>Loading profiles...</p>
              ) : measurements.length === 0 ? (
                <p style={{ padding: '1rem', color: '#666' }}>No profiles found. Add one!</p>
              ) : measurements.map(profile => (
                <div
                  key={profile.id}
                  className={`profile-card ${selectedProfileId === profile.id ? 'active' : ''}`}
                  onClick={() => setSelectedProfileId(profile.id)}
                >
                  <h3>{profile.title}</h3>
                  <p>Last updated on<br />{new Date(profile.updatedAt).toLocaleDateString()}</p>
                  {profile.isDefault && <div className="default-check">✓</div>}
                </div>
              ))}
              {!loadingMeasurements && (
                <button className="add-profile-ghost" onClick={() => setEditingProfile({
                  title: '', fullName: '', height: '', bust: '', waist: '', hips: '', shoulder: '', armLength: '', neck: '', isDefault: false
                })}>
                  + Add New Profile
                </button>
              )}
            </div>

            {selectedProfile && (
              <div className="profile-details-pane">
                <div className="pane-header">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                      <h3>{selectedProfile.title}</h3>
                      {selectedProfile.isDefault && <span className="default-badge">Default Profile</span>}
                    </div>
                    <button onClick={() => deleteMeasurement(selectedProfile.id)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }} title="Delete Profile">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="measurements-grid">
                  <div className="m-item">
                    <User className="m-icon" size={20} />
                    <div className="m-text">
                      <span className="m-label">Full Name</span>
                      <span className="m-val">{selectedProfile.fullName}</span>
                    </div>
                  </div>
                  <div className="m-item">
                    <Ruler className="m-icon" size={20} />
                    <div className="m-text">
                      <span className="m-label">Height</span>
                      <span className="m-val">{selectedProfile.height}</span>
                    </div>
                  </div>
                  <div className="m-item">
                    <img src="/logoR.png" className="m-icon-custom" alt="" style={{ width: 20, filter: 'grayscale(1) opacity(0.5)' }} />
                    <div className="m-text">
                      <span className="m-label">Bust</span>
                      <span className="m-val">{selectedProfile.bust}</span>
                    </div>
                  </div>
                  <div className="m-item">
                    <img src="/logoR.png" className="m-icon-custom" alt="" style={{ width: 20, filter: 'grayscale(1) opacity(0.5)' }} />
                    <div className="m-text">
                      <span className="m-label">Waist</span>
                      <span className="m-val">{selectedProfile.waist}</span>
                    </div>
                  </div>
                  <div className="m-item">
                    <img src="/logoR.png" className="m-icon-custom" alt="" style={{ width: 20, filter: 'grayscale(1) opacity(0.5)' }} />
                    <div className="m-text">
                      <span className="m-label">Hips</span>
                      <span className="m-val">{selectedProfile.hips}</span>
                    </div>
                  </div>
                  <div className="m-item">
                    <img src="/logoR.png" className="m-icon-custom" alt="" style={{ width: 20, filter: 'grayscale(1) opacity(0.5)' }} />
                    <div className="m-text">
                      <span className="m-label">Shoulder</span>
                      <span className="m-val">{selectedProfile.shoulder}</span>
                    </div>
                  </div>
                  <div className="m-item">
                    <img src="/logoR.png" className="m-icon-custom" alt="" style={{ width: 20, filter: 'grayscale(1) opacity(0.5)' }} />
                    <div className="m-text">
                      <span className="m-label">Arm Length</span>
                      <span className="m-val">{selectedProfile.armLength}</span>
                    </div>
                  </div>
                  <div className="m-item">
                    <img src="/logoR.png" className="m-icon-custom" alt="" style={{ width: 20, filter: 'grayscale(1) opacity(0.5)' }} />
                    <div className="m-text">
                      <span className="m-label">Neck</span>
                      <span className="m-val">{selectedProfile.neck}</span>
                    </div>
                  </div>
                </div>

                <div className="pane-footer">
                  <button className="card-btn-small" onClick={() => setEditingProfile(selectedProfile)}>
                    EDIT MEASUREMENTS ⟶
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="help-banner-row">
          <div className="help-banner-icon">
            <Headphones size={24} color="#50090aff" />
          </div>
          <div className="help-banner-text">
            <h4>Need help with measurements?</h4>
            <p>Our stylist can guide you step-by-step.</p>
          </div>
          <button className="card-btn-small" onClick={() => navigate('/contact')}>BOOK APPOINTMENT ⟶</button>
        </div>
      </div>
    );
  };

  // Render Wishlist Tab
  const renderWishlist = () => (
    <div className="tab-content animate-fade">
      <div className="tab-header flex-between">
        <div className="tab-title-wrap">
          <h2>My Wishlist</h2>
          <p>Your saved masterpieces.</p>
        </div>
      </div>

      <div className="wishlist-grid">
        {loadingWishlist ? (
          <div style={{ padding: '4rem', textAlign: 'center', width: '100%', gridColumn: '1/-1' }}>
            <p>Loading your wishlist...</p>
          </div>
        ) : wishlist.length === 0 ? (
          <div className="empty-state-wrapper" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '6rem 2rem', background: 'var(--primary-cream)', borderRadius: '12px', border: '1px solid rgba(205,163,114,0.3)' }}>
            <Heart size={48} color="var(--primary-gold)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3 style={{ color: 'var(--primary-burgundy)', marginBottom: '1rem' }}>Your wishlist is empty</h3>
            <p style={{ color: '#666', marginBottom: '2rem' }}>Save your favorite items here to view them later or add to cart.</p>
            <button className="btn-solid-burgundy" style={{ margin: '0 auto' }} onClick={() => navigate('/collection/all')}>
              EXPLORE COLLECTIONS
            </button>
          </div>
        ) : (
          wishlist.map(item => (
            <div className="wishlist-card" key={item.id}>
              <div className="w-img-wrapper">
                <img src={item.image} alt={item.name} />
                <button className="w-heart-btn" onClick={() => toggleWishlist(item)}>
                  <Heart size={16} fill="#5e0a0b" color="#5e0a0b" />
                </button>
              </div>
              <div className="w-card-body">
                <h4 className="w-title">{item.name}</h4>
                <p className="w-price">₹{item.price ? item.price.toLocaleString('en-IN') : 'N/A'}</p>
                <div className="w-meta">
                  <span>Size: Custom</span>
                </div>
                <p className="w-stock">
                  In Stock
                </p>
                <div className="w-actions">
                  <button className="w-add-btn" onClick={() => moveToCart(item)}>ADD TO BAG</button>
                  <button className="w-del-btn" onClick={() => toggleWishlist(item)}><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="wishlist-bottom-banner">
        <Heart size={20} color="#cda372" />
        <div className="wb-text">
          <p className="wb-title">Love something you see?</p>
          <p className="wb-desc">Add it to your bag before it's gone.</p>
        </div>
      </div>
    </div>
  );

  // Render Cart Tab
  const renderCart = () => {
    const total = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

    return (
      <div className="tab-content animate-fade">
        <div className="tab-header">
          <div className="tab-title-wrap">
            <h2>My Cart</h2>
            <p>Review your items and place order.</p>
          </div>
        </div>

        <div className="orders-list-detailed" style={{ marginTop: '2rem' }}>
          {cartItems.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem' }}>Your cart is empty.</p>
          ) : (
            <>
              {cartItems.map((item, idx) => (
                <div className="order-row" key={idx}>
                  <div className="order-item-img">
                    <img src={item.image} alt="Cart Item" loading="lazy" />
                  </div>

                  <div className="order-item-info">
                    <p className="order-id-text" style={{ fontSize: '1.1rem' }}>{item.title}</p>
                    <p className="order-price-text">₹{item.price.toLocaleString('en-IN')}</p>
                    <p className="order-items-text">Qty: {item.qty}</p>
                  </div>

                  <div className="order-item-action">
                    <button className="card-btn-small" onClick={() => setCartItems(cartItems.filter(i => i.id !== item.id))} style={{ background: 'none', border: '1px solid #ccc', color: '#888' }}>
                      REMOVE
                    </button>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 0', borderTop: '1px solid rgba(205, 163, 114, 0.3)', marginTop: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--primary-burgundy)' }}>Total: ₹{total.toLocaleString('en-IN')}</h3>
                </div>
                <button className="btn-solid-burgundy" onClick={handleCheckout} style={{ padding: '0.8rem 2rem' }}>
                  PLACE ORDER
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Render Overview (Already Implemented)
  const renderOverview = () => {
    let daysRemaining = null;
    if (user?.eventDate) {
      const eventD = new Date(user.eventDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      eventD.setHours(0, 0, 0, 0);
      daysRemaining = Math.ceil((eventD - now) / (1000 * 60 * 60 * 24));
    }

    return (
      <div className="main-content animate-fade">
        <div className="welcome-banner">
          <div className="welcome-text">
            <h1>Welcome back, <span>{user?.firstName || 'User'} <span className="stars">✦✧</span></span></h1>
            <p>Manage your luxury ethnic wear experience, track your custom pieces, and update your measurements.</p>
          </div>
          <div className="welcome-img-wrapper">
            <img src="/mannequin_gold.png" alt="Luxury Mannequin" className="welcome-img" loading="lazy" />
          </div>
        </div>

        {daysRemaining !== null && daysRemaining >= 0 && (
          <div style={{
            background: 'linear-gradient(135deg, var(--primary-burgundy) 0%, #4a1515 100%)',
            color: 'var(--beige-light)',
            padding: '1.5rem 2rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 10px 30px rgba(89, 28, 28, 0.15)'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '500', color: '#e8d5c4' }}>
                Your Big Day is in <span style={{ fontSize: '1.8rem', fontWeight: '700', color: '#fff' }}>{daysRemaining}</span> days! 💍
              </h3>
              <p style={{ margin: '0.5rem 0 0', opacity: 0.9 }}>
                {daysRemaining > 30 ? "Time to finalize your custom outfit measurements." : "Priority tailoring is active for your upcoming event."}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('measurements')}
              style={{
                padding: '0.8rem 1.5rem',
                background: '#e8d5c4',
                color: 'var(--primary-burgundy)',
                border: 'none',
                borderRadius: '30px',
                fontWeight: '600',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              Review Measurements
            </button>
          </div>
        )}


        <div className="dashboard-overview">
          {/* Recent Order Status */}
          <div className="dash-widget order-tracker-widget">
            <div className="widget-header">
              <h3>Recent Order Status</h3>
              {orders.length > 0 && <span className="order-id">#MRY-{orders[0]?.id}</span>}
            </div>
            {orders.length > 0 ? (
              <>
                <div className="tracker-timeline">
                  <div className="track-step completed">
                    <div className="track-dot"></div>
                    <p>Confirmed</p>
                  </div>
                  <div className={`track-step ${orders[0]?.status === 'PROCESSING' || orders[0]?.status === 'SHIPPED' || orders[0]?.status === 'DELIVERED' ? 'completed' : orders[0]?.status === 'PENDING' ? 'active' : ''}`}>
                    <div className="track-dot"></div>
                    <p>Tailoring</p>
                  </div>
                  <div className={`track-step ${orders[0]?.status === 'SHIPPED' || orders[0]?.status === 'DELIVERED' ? 'completed' : orders[0]?.status === 'PROCESSING' ? 'active' : ''}`}>
                    <div className="track-dot"></div>
                    <p>Shipped</p>
                  </div>
                  <div className={`track-step ${orders[0]?.status === 'DELIVERED' ? 'completed' : orders[0]?.status === 'SHIPPED' ? 'active' : ''}`}>
                    <div className="track-dot"></div>
                    <p>Delivered</p>
                  </div>
                </div>
                <p className="tracker-note">Your custom order is {orders[0]?.status ? orders[0]?.status.toLowerCase() : 'pending'}.</p>
              </>
            ) : (
              <p style={{ textAlign: 'center', color: '#888' }}>No recent orders. <button onClick={() => navigate('/collection/all')} style={{ background: 'none', border: 'none', color: '#cda372', cursor: 'pointer', textDecoration: 'underline' }}>Start Shopping</button></p>
            )}
          </div>

          <div className="dash-bottom-row">
            {/* Quick Stats */}
            <div className="dash-widget quick-stats-widget">
              <h3>At a Glance</h3>
              <div className="stats-grid">
                <div className="stat-box" onClick={() => setActiveTab('wishlist')}>
                  <Heart size={20} color="#cda372" />
                  <span className="stat-num">{wishlist.length}</span>
                  <span className="stat-label">Saved</span>
                </div>
                <div className="stat-box" onClick={() => setActiveTab('orders')}>
                  <ShoppingBag size={20} color="#cda372" />
                  <span className="stat-num">{orders.length}</span>
                  <span className="stat-label">Orders</span>
                </div>
                <div className="stat-box" onClick={() => setActiveTab('measurements')}>
                  <Ruler size={20} color="#cda372" />
                  <span className="stat-num">1</span>
                  <span className="stat-label">Fits</span>
                </div>
              </div>
            </div>

            {/* Style Tip */}
            <div className="dash-widget style-tip-widget">
              <div className="tip-header">
                <span className="flower-icon-small" style={{ color: '#cda372', fontSize: '1.2rem', marginRight: '0.5rem' }}>✿</span>
                <h3>Stylist's Note</h3>
              </div>
              <p className="tip-text">"Deep burgundy and gold hues are trending this wedding season. Pair your upcoming outfit with vintage polki jewelry for a timeless, regal look."</p>
            </div>
          </div>
        </div>

        <div className="support-banner">
          <div className="support-icon-wrap">
            <div className="card-icon gold medium">
              <Headphones size={22} strokeWidth={1.5} color="#fff" />
            </div>
          </div>
          <div className="support-info">
            <h3>Personal Stylist Support</h3>
            <p>Need help with styling or custom orders?<br />Our team is just a message away.</p>
          </div>
          <div className="support-action">
            <button className="card-btn wide" onClick={() => navigate('/contact')}>CHAT WITH STYLIST <span className="bubble-icon">💬</span></button>
          </div>
        </div>
      </div>
    );
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: user.firstName,
          lastName: user.lastName,
          profilePhoto: user.profilePhoto,
          address: user.address,
          eventDate: user.eventDate
        })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        showSuccess("Profile updated successfully!");
      } else {
        showError("Failed to update profile.");
      }
    } catch (err) {
      showError("A network error occurred while updating profile.");
    }
  };

  const handleDeleteAccount = () => {
    askConfirm(
      'Delete Account',
      'Are you absolutely sure you want to delete your account? This action cannot be undone and you will lose all your data.',
      'Delete Account',
      true,
      async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          const res = await fetch(`${API_URL}/api/auth/account`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            handleLogout();
          } else {
            showError("Failed to delete account.");
          }
        } catch (err) {
          showError("A network error occurred while deleting account.");
        }
      }
    );
  };

  const renderSettings = () => (
    <div className="tab-content animate-fade">
      <div className="tab-header">
        <div className="tab-title-wrap">
          <h2>Account Settings</h2>
          <p>Manage your personal details and account preferences.</p>
        </div>
      </div>

      <div className="settings-container" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: '500', color: 'var(--primary-burgundy)' }}>Profile Photo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: user.profilePhoto ? 'none' : '#f5ede8',
                backgroundImage: user.profilePhoto ? `url(${user.profilePhoto})` : 'none',
                backgroundSize: 'cover', backgroundPosition: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', border: '2px solid #e8d5c4', flexShrink: 0
              }}>
                {!user.profilePhoto && '👤'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="photo-upload" style={{
                  padding: '0.6rem 1.2rem', background: 'var(--primary-burgundy)', color: 'white',
                  borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500',
                  display: 'inline-block'
                }}>
                  📷 Upload Photo
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const reader = new FileReader();
                    reader.onloadend = (event) => {
                      const img = new Image();
                      img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 400;
                        const MAX_HEIGHT = 400;
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                          if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                          }
                        } else {
                          if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                          }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // Compress to JPEG with 0.7 quality
                        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                        setUser({ ...user, profilePhoto: compressedBase64 });
                      };
                      img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                {user.profilePhoto && (
                  <button type="button" onClick={() => setUser({ ...user, profilePhoto: '' })}
                    style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'left', padding: 0 }}>
                    ✕ Remove photo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--primary-burgundy)' }}>First Name</label>
              <input
                type="text"
                value={user.firstName || ''}
                onChange={(e) => setUser({ ...user, firstName: e.target.value })}
                required
                style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--primary-burgundy)' }}>Last Name</label>
              <input
                type="text"
                value={user.lastName || ''}
                onChange={(e) => setUser({ ...user, lastName: e.target.value })}
                required
                style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--primary-burgundy)' }}>Shipping Address</label>
            <textarea
              rows="3"
              placeholder="Enter your full shipping address"
              value={user.address || ''}
              onChange={(e) => setUser({ ...user, address: e.target.value })}
              style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--primary-burgundy)' }}>Special Event / Wedding Date</label>
            <input
              type="date"
              value={user.eventDate ? new Date(user.eventDate).toISOString().split('T')[0] : ''}
              onChange={(e) => setUser({ ...user, eventDate: e.target.value })}
              style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.4rem' }}>We will help you keep track of your outfit timeline.</p>
          </div>

          <button type="submit" className="btn-solid-burgundy" style={{ padding: '1rem', width: '200px' }}>
            SAVE CHANGES
          </button>
        </form>

        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #eee' }}>
          <h3 style={{ color: '#d32f2f', marginBottom: '0.5rem' }}>Danger Zone</h3>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>Once you delete your account, there is no going back. Please be certain.</p>
          <button
            onClick={handleDeleteAccount}
            style={{ padding: '0.8rem 1.5rem', background: 'transparent', color: '#d32f2f', border: '1px solid #d32f2f', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
          >
            DELETE ACCOUNT
          </button>
        </div>
      </div>
    </div>
  );

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('loginStateChange'));
    navigate('/');
  };

  return (
    <div className="account-page-wrapper">
      <ConfirmModal config={confirmConfig} onClose={() => setConfirmConfig(null)} />
      
      {showAddressModal && (
        <div className="modal-overlay animate-fade">
          <div className="modal-content animate-slide-up" style={{maxWidth: '500px'}}>
            <button className="modal-close" onClick={() => setShowAddressModal(false)}>✕</button>
            <h2 style={{fontFamily: 'var(--font-heading)', color: 'var(--primary-burgundy)', marginBottom: '1rem', marginTop: 0}}>Delivery Address</h2>
            <p style={{marginBottom: '1.5rem', color: '#666', lineHeight: 1.5}}>Please provide your complete delivery address before placing the order.</p>
            <form onSubmit={confirmCheckout}>
              <div className="form-group" style={{marginBottom: '1.5rem'}}>
                <textarea 
                  value={checkoutAddress}
                  onChange={(e) => setCheckoutAddress(e.target.value)}
                  placeholder="Street Address, City, State, ZIP Code"
                  required
                  rows={4}
                  style={{width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical', fontFamily: 'var(--font-body)', fontSize: '0.95rem'}}
                />
              </div>
              <div style={{display: 'flex', gap: '1rem'}}>
                <button type="button" className="btn-outline-burgundy" style={{flex: 1}} onClick={() => setShowAddressModal(false)}>CANCEL</button>
                <button type="submit" className="btn-solid-burgundy" style={{flex: 1}}>CONFIRM & BUY</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {globalError && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          background: '#ff4d4f', color: 'white', padding: '12px 24px', borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500'
        }}>
          <span>⚠️ {globalError}</span>
          <button onClick={() => setGlobalError(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>
      )}
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
              {!user?.profilePhoto && (user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U')}
            </div>
            <div className="profile-info">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '500' }}>{user?.firstName} {user?.lastName}</h3>
              <p className="profile-email">{user?.email}</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
              <Home size={18} strokeWidth={1.5} /> <span>OVERVIEW</span>
            </button>
            <button className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
              <ShoppingBag size={18} strokeWidth={1.5} /> <span>ORDER HISTORY</span>
            </button>
            <button className={`nav-item ${activeTab === 'measurements' ? 'active' : ''}`} onClick={() => setActiveTab('measurements')}>
              <Ruler size={18} strokeWidth={1.5} /> <span>MY MEASUREMENTS</span>
            </button>
            <button className={`nav-item ${activeTab === 'wishlist' ? 'active' : ''}`} onClick={() => setActiveTab('wishlist')}>
              <Heart size={18} strokeWidth={1.5} /> <span>WISHLIST</span>
            </button>
            <button className={`nav-item ${activeTab === 'cart' ? 'active' : ''}`} onClick={() => setActiveTab('cart')}>
              <ShoppingCart size={18} strokeWidth={1.5} /> <span>MY CART</span>
            </button>
            <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
              <Settings size={18} strokeWidth={1.5} /> <span>SETTINGS</span>
            </button>

            <div className="nav-divider"><span className="diamond">◈</span></div>

            <button className="nav-item logout" onClick={handleLogout}>
              <LogOut size={18} strokeWidth={1.5} /> <span>LOGOUT</span>
            </button>
          </nav>

          <div className="help-card">
            <div className="help-content">
              <h3>Need Help?</h3>
              <p>Our stylist team is here<br />to assist you.</p>
              <button className="contact-btn" onClick={() => navigate('/contact')}>CONTACT US</button>
            </div>
            <img src="/mannequin_small.png" alt="Stylist" className="help-img" loading="lazy" />
          </div>
        </aside>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'orders' && <main className="main-content-boxed">{renderOrders()}</main>}
        {activeTab === 'measurements' && <main className="main-content-boxed">{renderMeasurements()}</main>}
        {activeTab === 'wishlist' && <main className="main-content-boxed">{renderWishlist()}</main>}
        {activeTab === 'cart' && <main className="main-content-boxed">{renderCart()}</main>}
        {activeTab === 'settings' && <main className="main-content-boxed">{renderSettings()}</main>}
      </div>
    </div>
  );
};

export default AccountPage;
