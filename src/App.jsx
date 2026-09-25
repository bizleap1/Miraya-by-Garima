import { useState, Suspense, lazy, useEffect } from 'react';
import { IntroProvider, useIntro } from './context/IntroContext';
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
const PrimeCollectionPage = lazy(() => import('./views/PrimeCollectionPage'));
const ClassicCollectionPage = lazy(() => import('./views/ClassicCollectionPage'));
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
    if (typeof window === 'undefined') return;
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    if (lenis) {
      window.lenis = lenis;
    }
  }, [lenis]);

  useEffect(() => {
    const isAdmin = location.pathname.startsWith('/admin');
    if (lenis) {
      if (isAdmin) {
        if (typeof lenis.stop === 'function') lenis.stop();
      } else {
        if (typeof lenis.start === 'function') lenis.start();
      }
    }
    if (lenis && typeof lenis.scrollTo === 'function') {
      lenis.scrollTo(0, { immediate: true });
    } else if (typeof window !== 'undefined' && window.lenis && typeof window.lenis.scrollTo === 'function') {
      window.lenis.scrollTo(0, { immediate: true });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname, lenis]);

  return null;
}

// Resets on every hard reload — intro plays every time site is opened fresh
let introShownThisLoad = false;

function AppInner() {
  const location = useLocation();
  const { navLoading, startNavLoading, stopNavLoading } = useLoading();
  const { setIntroComplete } = useIntro();
  const [isNavigating, setIsNavigating] = useState(false);

  const isAuthPage = location.pathname === '/auth';
  const isAdminPage = location.pathname.startsWith('/admin');
  const isStandalonePage = isAuthPage || isAdminPage;

  // Show intro on every fresh page load; skip only on SPA navigations
  const [isPreloading, setIsPreloading] = useState(() => {
    if (introShownThisLoad) return false;
    introShownThisLoad = true;
    return true;
  });

  // Trigger top progress bar on route change
  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  // Lock scroll while preloader is active
  useEffect(() => {
    if (isPreloading) {
      document.body.style.overflow = 'hidden';
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
            <Preloader key="preloader" onComplete={() => { setIsPreloading(false); setIntroComplete(true); }} />
          )}
        </AnimatePresence>
        <div className="app-container">
          {!isStandalonePage && <Navbar />}
          <main className="main-content">
            <ErrorBoundary>
              <Suspense fallback={<LuxuryPageFallback />}>
                <Routes location={location} key={location.pathname}>
                  <Route path="/" element={<Home />} />
                  <Route path="/collection/prime" element={<PrimeCollectionPage />} />
                  <Route path="/collection/classic" element={<ClassicCollectionPage />} />
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

function App() {
  return (
    <IntroProvider>
      <AppInner />
    </IntroProvider>
  );
}

export default App;
