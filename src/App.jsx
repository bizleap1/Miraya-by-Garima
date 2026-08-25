import { useState, Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { ReactLenis, useLenis } from 'lenis/react';
import { AnimatePresence } from 'framer-motion';
import { ToastProvider } from './context/ToastContext';
import { useLoading } from './context/LoadingContext';
import GlobalLoadingOverlay, { TopProgressBar, LuxuryPageFallback } from './components/GlobalLoadingOverlay';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import WhatsAppButton from './components/WhatsAppButton';
import Preloader from './components/Preloader';
import ModalScrollLockWatcher from './components/ModalScrollLockWatcher';

// Lazy loaded pages
const Home = lazy(() => import('./pages/Home'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const LookbookPage = lazy(() => import('./pages/LookbookPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const ReturnPolicyPage = lazy(() => import('./pages/ReturnPolicyPage'));

function ScrollManager() {
  const location = useLocation();
  const lenis = useLenis();

  useEffect(() => {
    if (lenis && typeof lenis.scrollTo === 'function') {
      lenis.scrollTo(0, { immediate: true });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname, lenis]);

  return null;
}

function App() {
  const location = useLocation();
  const { navLoading, startNavLoading, stopNavLoading } = useLoading();
  const [isNavigating, setIsNavigating] = useState(false);

  const isAuthPage = location.pathname === '/auth';
  const isAdminPage = location.pathname.startsWith('/admin');
  const isStandalonePage = isAuthPage || isAdminPage;
  const [isPreloading, setIsPreloading] = useState(() => {
    const hasVisited = sessionStorage.getItem('miraya_visited');
    return !hasVisited;
  });

  // Trigger top progress bar on route change
  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  // Prevent scrolling while preloading
  useEffect(() => {
    if (isPreloading) {
      document.body.style.overflow = 'hidden';
      sessionStorage.setItem('miraya_visited', 'true');
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isPreloading]);

  return (
    <ToastProvider>
      <ReactLenis root options={{ lerp: 0.08, duration: 1.5, smoothWheel: true }}>
        <ScrollManager />
        <ModalScrollLockWatcher />
        <TopProgressBar active={isNavigating || navLoading} />
        <GlobalLoadingOverlay />
        <AnimatePresence>
          {isPreloading && (
            <Preloader key="preloader" onComplete={() => setIsPreloading(false)} />
          )}
        </AnimatePresence>
        <div className="app-container">
          {!isStandalonePage && <Navbar />}
          <main className="main-content">
            <ErrorBoundary>
              <Suspense fallback={<LuxuryPageFallback />}>
                <Routes location={location} key={location.pathname}>
                  <Route path="/" element={<Home />} />
                  <Route path="/collection/:category" element={<CategoryPage />} />
                  <Route path="/product/:category/:id" element={<ProductDetailPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/admin/*" element={<AdminDashboard />} />
                  <Route path="/lookbook" element={<LookbookPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/shipping-returns" element={<ReturnPolicyPage />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>
          {!isStandalonePage && <Footer />}
          {!isStandalonePage && <WhatsAppButton />}
        </div>
      </ReactLenis>
    </ToastProvider>
  );
}

export default App;
