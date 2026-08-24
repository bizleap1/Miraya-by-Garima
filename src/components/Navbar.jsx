'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, User, ShoppingCart, ShoppingBag, Heart, Settings, LogOut, Bell } from 'lucide-react';
import { useLenis } from 'lenis/react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import CheckoutModal from './CheckoutModal';
import './Navbar.css';

const Navbar = () => {
  const lenis = useLenis();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [mobileCollectionOpen, setMobileCollectionOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { wishlistCount } = useWishlist();
  const { cartCount } = useCart();

  // Lock background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      if (lenis && typeof lenis.stop === 'function') {
        lenis.stop();
      }
    } else {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      if (lenis && typeof lenis.start === 'function') {
        lenis.start();
      }
    }
    return () => {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      if (lenis && typeof lenis.start === 'function') {
        lenis.start();
      }
    };
  }, [mobileMenuOpen, lenis]);


  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setIsAdmin(false);
    navigate('/');
    setProfileDropdownOpen(false);
    window.dispatchEvent(new Event('loginStateChange'));
  };

  useEffect(() => {
    const handleLoginChange = () => {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          setUser(userObj);
          setIsAdmin(userObj.email === 'bizleap1@gmail.com' || userObj.role === 'ADMIN' || userObj.role === 'admin');
        } catch(e) {}
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    };
    
    // Initial check
    handleLoginChange();

    window.addEventListener('loginStateChange', handleLoginChange);
    return () => window.removeEventListener('loginStateChange', handleLoginChange);
  }, []);

  const fetchNotifications = async () => {
    if (!isLoggedIn) return;
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchNotifications();
  }, [isLoggedIn, location]);

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (e) {}
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHomePage = location.pathname === '/';
  const isCollectionPage = location.pathname.startsWith('/collection');
  const isAboutPage = location.pathname === '/about';


  
  // Pages with dark hero sections at the top where white text is visible
  const hasDarkHero = isHomePage;
  
  // Navbar is scrolled if we have scrolled down OR if there is no dark hero section
  const isNavbarScrolled = scrolled || !hasDarkHero;

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.trim().charAt(0).toUpperCase();
  };

  // Framer motion variants for mega menu
  const megaContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const megaItemAnim = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 200, damping: 20 } 
    }
  };

  const MotionLink = motion.create ? motion.create(Link) : motion(Link);

  return (
    <>
      <motion.nav
        className={`navbar ${isNavbarScrolled ? 'scrolled' : ''}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="navbar-container">

          <div className="navbar-logo">
            <Link to="/">
              <img src="/logoR.png" alt="Miraya" className="logo-img" />
            </Link>
          </div>

          {/* Center Links */}
          <div className="navbar-links center-links desktop-only">
            <NavLink to="/" className="nav-link" end>Home</NavLink>
            <NavLink to="/about" className="nav-link">About Us</NavLink>

            <NavLink to="/collection/all" className="nav-link" activeclassname="active">Collection</NavLink>

            <NavLink to="/lookbook" className="nav-link">Lookbook</NavLink>
            <NavLink to="/contact" className="nav-link">Contact Us</NavLink>
          </div>

          {/* Right Actions */}
          <div className="navbar-right">
            <div className="navbar-actions">
              {isAdmin && (
                <Link to="/admin" className="nav-link desktop-only" style={{ color: 'var(--primary-burgundy)', fontWeight: '600' }}>
                  Admin Panel
                </Link>
              )}
              <MotionLink to="/wishlist" className="icon-btn position-relative" aria-label="Wishlist" title="Wishlist" whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Heart size={20} strokeWidth={1.5} />
                {wishlistCount > 0 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="nav-badge">{wishlistCount}</motion.span>}
              </MotionLink>
              <motion.button
                onClick={() => setIsCartModalOpen(true)}
                className="icon-btn position-relative"
                aria-label="Cart"
                title="Shopping Bag"
                whileHover={{ scale: 1.15, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShoppingCart size={20} strokeWidth={1.5} />
                {cartCount > 0 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="nav-badge">{cartCount}</motion.span>}
              </motion.button>
              {isLoggedIn && (
                <div 
                  className="profile-dropdown-container desktop-only"
                  onMouseEnter={() => setNotificationsOpen(true)}
                  onMouseLeave={() => setNotificationsOpen(false)}
                >
                  <motion.button className="icon-btn position-relative" aria-label="Notifications" title="Notifications" whileHover={{ scale: 1.15, y: -2, rotate: [0, -10, 10, -10, 0] }} whileTap={{ scale: 0.95 }}>
                    <Bell size={20} strokeWidth={1.5} />
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="nav-badge">{notifications.filter(n => !n.isRead).length}</motion.span>
                    )}
                  </motion.button>
                  <AnimatePresence>
                    {notificationsOpen && (
                      <motion.div
                        className="profile-dropdown-menu"
                        style={{ width: '300px', padding: '1rem', right: '-50px' }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <h4 style={{ margin: '0 0 1rem 0', fontFamily: 'var(--font-heading)', color: 'var(--primary-burgundy)' }}>Notifications</h4>
                        {notifications.length === 0 ? (
                          <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>No notifications yet.</p>
                        ) : (
                          <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {notifications.map(n => (
                              <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: n.isRead ? 'transparent' : 'rgba(205, 163, 114, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                                <div>
                                  <p style={{ margin: '0 0 0.2rem 0', fontWeight: n.isRead ? 'normal' : '600', fontSize: '0.9rem' }}>{n.title}</p>
                                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{n.message}</p>
                                </div>
                                {!n.isRead && (
                                  <button onClick={() => handleMarkAsRead(n.id)} style={{ background: 'none', border: 'none', color: 'var(--primary-gold)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>
                                    Read
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {isLoggedIn ? (
                <div 
                  className="profile-dropdown-container"
                  onMouseEnter={() => setProfileDropdownOpen(true)}
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <motion.button 
                    className="icon-btn profile-photo-btn" 
                    aria-label="Profile" 
                    onClick={() => {
                      if (window.innerWidth <= 992) {
                        navigate('/account');
                      } else {
                        setProfileDropdownOpen(prev => !prev);
                      }
                    }}
                    whileHover={{ scale: 1.1 }} 
                    whileTap={{ scale: 0.95 }}
                  >
                    {user?.profilePicture ? (
                      <img 
                        src={user.profilePicture} 
                        alt="Profile" 
                        className="profile-photo" 
                      />
                    ) : (
                      <div className="profile-initials">
                        {getInitials(user?.firstName || user?.name || 'User')}
                      </div>
                    )}
                  </motion.button>
                  <AnimatePresence>
                    {profileDropdownOpen && (
                      <motion.div
                        className="profile-dropdown-menu"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="profile-dropdown-user-header" style={{ padding: '0.8rem 1rem', borderBottom: '1px solid rgba(94, 10, 11, 0.1)', marginBottom: '0.4rem' }}>
                          <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem', color: 'var(--primary-burgundy)' }}>{user?.name || user?.firstName || 'Valued Client'}</p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
                        </div>
                        {isAdmin && (
                          <Link to="/admin" className="profile-dropdown-item" onClick={() => setProfileDropdownOpen(false)} style={{ color: 'var(--primary-gold)', fontWeight: '600' }}>
                            <Settings size={16} className="profile-dropdown-icon" />
                            <span>Admin Dashboard</span>
                          </Link>
                        )}
                        <Link to="/account" className="profile-dropdown-item" onClick={() => setProfileDropdownOpen(false)}>
                          <User size={16} className="profile-dropdown-icon" />
                          <span>My Account</span>
                        </Link>
                        <Link to="/account" state={{ tab: 'orders' }} className="profile-dropdown-item" onClick={() => setProfileDropdownOpen(false)}>
                          <ShoppingBag size={16} className="profile-dropdown-icon" />
                          <span>My Orders</span>
                        </Link>
                        <button onClick={handleLogout} className="profile-dropdown-item logout-btn">
                          <LogOut size={16} className="profile-dropdown-icon" />
                          <span>Logout</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link to="/auth" className="nav-link signup-link" aria-label="Account">
                  <span>SIGN UP</span>
                </Link>
              )}
              <button
                className="icon-btn mobile-only"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={24} strokeWidth={1.5} />
              </button>
            </div>
          </div>

        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="mobile-menu-backdrop"
              data-lenis-prevent="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className="mobile-menu-drawer"
              data-lenis-prevent="true"
              initial={{ x: '100%', filter: 'blur(10px)' }}
              animate={{ x: 0, filter: 'blur(0px)' }}
              exit={{ x: '100%', filter: 'blur(10px)' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.8 }}
            >

            <div className="mobile-menu-header">
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                <img src="/logo-white.png" alt="Miraya by Garima" className="logo-img-small" />
              </Link>
              <button
                className="close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            <div className="mobile-menu-content">
              <div className="mobile-menu-links">
                <Link to="/" className="mobile-nav-item-link" onClick={() => setMobileMenuOpen(false)}>
                  <span>Home</span>
                </Link>

                <div>
                  <div
                    className="mobile-nav-item-link"
                    onClick={() => setMobileCollectionOpen(!mobileCollectionOpen)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span>Collection</span>
                    <ChevronDown
                      size={18}
                      style={{
                        color: 'var(--gold-accent)',
                        transform: mobileCollectionOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                  </div>
                  <AnimatePresence>
                    {mobileCollectionOpen && (
                      <motion.div
                        className="mobile-sub-accordion"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <Link to="/collection/all" className="mobile-sub-link" onClick={() => setMobileMenuOpen(false)}>
                          All Outfits
                        </Link>
                        <Link to="/collection/indo-western" className="mobile-sub-link" onClick={() => setMobileMenuOpen(false)}>
                          Indo-Western
                        </Link>
                        <Link to="/collection/drape-sarees" className="mobile-sub-link" onClick={() => setMobileMenuOpen(false)}>
                          Drape Sarees
                        </Link>
                        <Link to="/collection/designer-suits" className="mobile-sub-link" onClick={() => setMobileMenuOpen(false)}>
                          Designer Suits
                        </Link>
                        <Link to="/collection/premium-suit-materials" className="mobile-sub-link" onClick={() => setMobileMenuOpen(false)}>
                          Suit Materials
                        </Link>
                        <Link to="/collection/co-ord-sets" className="mobile-sub-link" onClick={() => setMobileMenuOpen(false)}>
                          Co-ord Sets
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link to="/lookbook" className="mobile-nav-item-link" onClick={() => setMobileMenuOpen(false)}>
                  <span>Lookbook</span>
                </Link>

                <Link to="/about" className="mobile-nav-item-link" onClick={() => setMobileMenuOpen(false)}>
                  <span>About Us</span>
                </Link>

                <Link to="/contact" className="mobile-nav-item-link" onClick={() => setMobileMenuOpen(false)}>
                  <span>Contact Us</span>
                </Link>

                <Link
                  to={isLoggedIn ? "/account" : "/auth"}
                  className="mobile-nav-item-link highlight"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{isLoggedIn ? 'My Account' : 'Sign In / Register'}</span>
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className="mobile-nav-item-link highlight"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>Admin Dashboard</span>
                  </Link>
                )}
              </div>
            </div>

            <motion.div
              className="mobile-menu-footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <div className="mobile-brand-script">Miraya by Garima</div>
              <div className="social-links">
                <a
                  href="https://www.instagram.com/miraya_official.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-pill"
                >
                  INSTAGRAM
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61591287333326"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-pill"
                >
                  FACEBOOK
                </a>
              </div>
            </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CheckoutModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
