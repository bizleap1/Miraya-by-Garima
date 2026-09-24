'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, User, ShoppingCart, ShoppingBag, Heart, Settings, LogOut, Bell, Search } from 'lucide-react';
import { useLenis } from 'lenis/react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import API_URL from '../config';
import CheckoutModal from './CheckoutModal';
import './Navbar.css';

const Navbar = () => {
  const lenis = useLenis();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [womenswearDropdownOpen, setWomenswearDropdownOpen] = useState(false);
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

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {});
      } catch (_) {}
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUser(null);
    setProfileDropdownOpen(false);
    window.dispatchEvent(new Event('loginStateChange'));
    navigate('/');
  };

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

  useEffect(() => {
    const handleLoginChange = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const isLogged = Boolean(token && localStorage.getItem('isLoggedIn') === 'true');
      setIsLoggedIn(isLogged);

      if (isLogged && userStr) {
        try {
          const userObj = JSON.parse(userStr);
          setUser(userObj);
          setIsAdmin(userObj.email === 'bizleap1@gmail.com' || userObj.role === 'ADMIN' || userObj.role === 'admin' || userObj.role === 'super_admin' || userObj.role === 'store_manager');
        } catch(e) {
          setUser(null);
          setIsAdmin(false);
        }
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

  // Real-time Heartbeat: Send periodic activity ping while user is active on the website
  useEffect(() => {
    if (!isLoggedIn) return;

    const pingHeartbeat = () => {
      const token = localStorage.getItem('token');
      if (token) {
        fetch(`${API_URL}/api/auth/heartbeat`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {});
      }
    };

    // Send immediate ping on load/route change
    pingHeartbeat();

    // Periodic heartbeat every 45 seconds
    const interval = setInterval(pingHeartbeat, 45000);
    return () => clearInterval(interval);
  }, [isLoggedIn, location]);

  const fetchNotifications = async () => {
    if (!isLoggedIn) return;
    try {
      const token = localStorage.getItem('token');
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
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (e) {}
  };

  useEffect(() => {
    const handleScroll = () => {
      const threshold = window.location.pathname === '/new-arrivals' ? 500 : 50;
      setScrolled(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const [dynamicLightHero, setDynamicLightHero] = useState(false);

  useEffect(() => {
    const handleSlideChange = (e) => {
      if (window.location.pathname === '/') {
        setDynamicLightHero(e.detail?.isLight || false);
      }
    };
    window.addEventListener('hero-slide-change', handleSlideChange);
    return () => window.removeEventListener('hero-slide-change', handleSlideChange);
  }, [location.pathname]);

  const isHomePage = location.pathname === '/';
  const isCollectionPage = location.pathname.startsWith('/collection');
  const isAboutPage = location.pathname === '/about';
  const isNewArrivalsPage = location.pathname === '/new-arrivals';

  // Navbar is always solid if we don't have a dark/transparent hero
  const hasDarkHero = isHomePage && !dynamicLightHero; 
  const hasLightHero = isHomePage && dynamicLightHero;
  
  const isNavbarScrolled = scrolled || (!hasDarkHero && !hasLightHero);

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

  const navbarClasses = [
    'navbar',
    isNavbarScrolled ? 'scrolled' : '',
    (!scrolled && hasLightHero) ? 'navbar-light-hero' : ''
  ].filter(Boolean).join(' ');

  return (
    <>
      <motion.nav
        className={navbarClasses}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="navbar-container">

          {/* Left Logo */}
          <div className="navbar-logo-left">
            <Link to="/">
              <img src="/logoR.png" alt="Miraya" className="logo-img" />
            </Link>
          </div>

          {/* Center Links */}
          <div className="navbar-center-links desktop-only">
            <NavLink to="/" className="nav-link" end>HOME</NavLink>
            <NavLink to="/collection/prime" className="nav-link">PRIME</NavLink>
            <NavLink to="/collection/classic" className="nav-link">CLASSIC</NavLink>
            <NavLink to="/about" className="nav-link">ABOUT</NavLink>
            <NavLink to="/contact" className="nav-link">CONTACT</NavLink>
          </div>

          {/* Right Actions */}
          <div className="navbar-right">
            <div className="navbar-actions">
              <motion.button className="icon-btn position-relative" aria-label="Search" title="Search" whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Search size={20} strokeWidth={1.5} />
              </motion.button>
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

                <Link to="/new-arrivals" className="mobile-nav-item-link" onClick={() => setMobileMenuOpen(false)}>
                  <span>New Arrivals</span>
                </Link>

                <Link to="/collection/prime" className="mobile-nav-item-link" onClick={() => setMobileMenuOpen(false)}>
                  <span>Prime</span>
                </Link>
                <Link to="/collection/classic" className="mobile-nav-item-link" onClick={() => setMobileMenuOpen(false)}>
                  <span>Classic</span>
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
