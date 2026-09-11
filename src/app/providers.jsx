'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ReactLenis, useLenis } from 'lenis/react';
import { ToastProvider } from '../context/ToastContext';
import { LoadingProvider, useLoading } from '../context/LoadingContext';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import { StoreSettingsProvider, useStoreSettings } from '../context/StoreSettingsContext';
import GlobalLoadingOverlay, { TopProgressBar } from '../components/GlobalLoadingOverlay';
import ModalScrollLockWatcher from '../components/ModalScrollLockWatcher';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import Preloader from '../components/Preloader';
import { AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

function ScrollToTopManager() {
  const pathname = usePathname() || '/';
  const lenis = useLenis();
  const prevPathRef = useRef(pathname);
  const isPopStateRef = useRef(false);

  // Configure manual scroll restoration and expose Lenis instance globally
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    if (lenis) {
      window.lenis = lenis;
    }
  }, [lenis]);

  // Continuously record scroll position per page in sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY || document.documentElement.scrollTop || 0;
          try {
            sessionStorage.setItem('miraya_scroll_' + window.location.pathname, String(y));
          } catch (_) {}
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Detect browser Back / Forward (popstate) actions
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      isPopStateRef.current = true;
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle route changes: restore previous section on back, reset to top on new navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash;
    const isBackNav = isPopStateRef.current;
    isPopStateRef.current = false;

    let savedY = 0;
    try {
      savedY = Number(sessionStorage.getItem('miraya_scroll_' + pathname) || 0);
    } catch (_) {}

    // Priority 1: If URL has a specific section/product hash, scroll directly to that element
    if (hash) {
      const scrollToHash = () => {
        try {
          const target = document.querySelector(hash);
          if (target) {
            if (lenis && typeof lenis.scrollTo === 'function') {
              lenis.scrollTo(target, { offset: -95, duration: 0.8 });
            } else if (window.lenis && typeof window.lenis.scrollTo === 'function') {
              window.lenis.scrollTo(target, { offset: -95, duration: 0.8 });
            } else {
              target.scrollIntoView({ behavior: 'smooth' });
            }
            return true;
          }
        } catch (_) {}
        return false;
      };

      if (!scrollToHash()) {
        const t1 = setTimeout(scrollToHash, 100);
        const t2 = setTimeout(scrollToHash, 300);
        prevPathRef.current = pathname;
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
        };
      }
      prevPathRef.current = pathname;
      return;
    }

    // Priority 2: If navigating Back and we have a saved scroll position, return to previous section
    if (isBackNav && savedY > 0) {
      const restoreSaved = () => {
        if (lenis && typeof lenis.scrollTo === 'function') {
          lenis.scrollTo(savedY, { immediate: true });
        } else if (window.lenis && typeof window.lenis.scrollTo === 'function') {
          window.lenis.scrollTo(savedY, { immediate: true });
        }
        window.scrollTo({ top: savedY, behavior: 'instant' });
        document.documentElement.scrollTop = savedY;
        document.body.scrollTop = savedY;
      };

      restoreSaved();
      const r1 = requestAnimationFrame(restoreSaved);
      const t1 = setTimeout(restoreSaved, 60);
      const t2 = setTimeout(restoreSaved, 200);

      prevPathRef.current = pathname;
      return () => {
        cancelAnimationFrame(r1);
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    // Priority 3: Fresh forward navigation (clicking a category/product) -> start at top
    const resetScroll = () => {
      if (lenis && typeof lenis.scrollTo === 'function') {
        lenis.scrollTo(0, { immediate: true });
      } else if (window.lenis && typeof window.lenis.scrollTo === 'function') {
        window.lenis.scrollTo(0, { immediate: true });
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();
    const rafId = requestAnimationFrame(resetScroll);
    const timer = setTimeout(resetScroll, 60);

    prevPathRef.current = pathname;

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}

function AnnouncementBanner() {
  const { announcement_active, announcement_text } = useStoreSettings();
  const [dismissed, setDismissed] = React.useState(false);

  if (!announcement_active || !announcement_text || dismissed) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 9999,
      background: 'linear-gradient(90deg, #5e0a0b 0%, #8B1A1A 50%, #5e0a0b 100%)',
      color: '#FAF8F5',
      textAlign: 'center',
      padding: '8px 48px',
      fontSize: '13px',
      fontFamily: 'Cormorant Garamond, serif',
      letterSpacing: '1.5px',
      fontWeight: 500,
      borderBottom: '1px solid rgba(198,164,106,0.4)',
    }}>
      <span>{announcement_text}</span>
      <button
        onClick={() => setDismissed(true)}
        style={{
          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', color: 'rgba(250,248,245,0.7)',
          cursor: 'pointer', fontSize: '16px', padding: '4px 8px', lineHeight: 1,
        }}
        aria-label="Dismiss"
      >✕</button>
    </div>
  );
}

import { SocketProvider } from '../context/SocketContext';
import { IntroProvider, useIntro } from '../context/IntroContext';

function AppLayoutInner({ children }) {
  const pathname = usePathname() || '/';
  const { navLoading } = useLoading();
  const { setIntroComplete } = useIntro();
  const [isNavigating, setIsNavigating] = useState(false);

  const isAuthPage = pathname === '/auth';
  const isAdminPage = pathname.startsWith('/admin');
  const isStandalonePage = isAuthPage || isAdminPage;

  // Preloader runs on every fresh load and hard reload.
  // Skipped only on standalone routes (admin/auth).
  const [isPreloading, setIsPreloading] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p === '/auth' || p.startsWith('/admin')) return false;
    }
    return true;
  });

  // Lock body scroll while intro preloader is running
  useEffect(() => {
    if (isPreloading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isPreloading]);

  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 450);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.5, smoothWheel: true }}>
      <ScrollToTopManager />
      <ModalScrollLockWatcher />
      <AnnouncementBanner />
      <TopProgressBar active={isNavigating || navLoading} />
      <GlobalLoadingOverlay />
      <AnimatePresence>
        {isPreloading && (
          <Preloader
            key="preloader"
            onComplete={() => {
              setIsPreloading(false);
              setIntroComplete(true);
            }}
          />
        )}
      </AnimatePresence>
      <div className="app-container">
        {!isStandalonePage && <Navbar />}
        <main className="main-content">{children}</main>
        {!isStandalonePage && <Footer />}
        {!isStandalonePage && <WhatsAppButton />}
      </div>
    </ReactLenis>
  );
}

export default function Providers({ children }) {
  return (
    <SocketProvider>
      <StoreSettingsProvider>
        <LoadingProvider>
          <ToastProvider>
            <CartProvider>
              <WishlistProvider>
                <IntroProvider>
                  <AppLayoutInner>{children}</AppLayoutInner>
                </IntroProvider>
              </WishlistProvider>
            </CartProvider>
          </ToastProvider>
        </LoadingProvider>
      </StoreSettingsProvider>
    </SocketProvider>
  );
}

