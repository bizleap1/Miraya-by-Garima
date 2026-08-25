'use client';
import React, { useState, useEffect } from 'react';
import { ReactLenis, useLenis } from 'lenis/react';
import { ToastProvider } from '../context/ToastContext';
import { LoadingProvider, useLoading } from '../context/LoadingContext';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
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

  useEffect(() => {
    const handleScrollReset = () => {
      if (typeof window === 'undefined') return;

      const hash = window.location.hash;
      if (hash) {
        try {
          const target = document.querySelector(hash);
          if (target) {
            if (lenis && typeof lenis.scrollTo === 'function') {
              lenis.scrollTo(target, { offset: -80, duration: 1.2 });
            } else {
              target.scrollIntoView({ behavior: 'smooth' });
            }
            return;
          }
        } catch (_) {}
      }

      // Reset scroll to top
      if (lenis && typeof lenis.scrollTo === 'function') {
        lenis.scrollTo(0, { immediate: true });
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    handleScrollReset();

    const rafId = requestAnimationFrame(() => {
      handleScrollReset();
    });

    const timer = setTimeout(() => {
      handleScrollReset();
    }, 60);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [pathname, lenis]);

  return null;
}

function AppLayoutInner({ children }) {
  const pathname = usePathname() || '/';
  const { navLoading } = useLoading();
  const [isNavigating, setIsNavigating] = useState(false);

  const isAuthPage = pathname === '/auth';
  const isAdminPage = pathname.startsWith('/admin');
  const isStandalonePage = isAuthPage || isAdminPage;

  const [isPreloading, setIsPreloading] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const hasVisited = sessionStorage.getItem('miraya_visited');
        if (!hasVisited) {
          setIsPreloading(true);
        }
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 450);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.5, smoothWheel: true }}>
      <ScrollToTopManager />
      <ModalScrollLockWatcher />
      <TopProgressBar active={isNavigating || navLoading} />
      <GlobalLoadingOverlay />
      <AnimatePresence>
        {isPreloading && (
          <Preloader
            key="preloader"
            onComplete={() => {
              setIsPreloading(false);
              try {
                sessionStorage.setItem('miraya_visited', 'true');
              } catch (_) {}
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
    <LoadingProvider>
      <ToastProvider>
        <CartProvider>
          <WishlistProvider>
            <AppLayoutInner>{children}</AppLayoutInner>
          </WishlistProvider>
        </CartProvider>
      </ToastProvider>
    </LoadingProvider>
  );
}
