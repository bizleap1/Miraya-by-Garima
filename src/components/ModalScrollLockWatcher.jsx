'use client';
import { useEffect } from 'react';
import { useLenis } from 'lenis/react';

const MODAL_SELECTORS =
  '.admin-drawer-overlay, .admin-modal-overlay, .modal-overlay, .na-modal-backdrop, .report-modal-backdrop, .pos-modal-backdrop, [data-modal="true"], [role="dialog"], .admin-modal, .admin-drawer, .na-modal-content, .drawer-content, .modal-body, .na-prod-grid, .admin-modal-box';

export default function ModalScrollLockWatcher() {
  const lenis = useLenis();

  useEffect(() => {
    let wasOpen = false;

    const applyLenisPrevent = () => {
      const modals = document.querySelectorAll(MODAL_SELECTORS);
      modals.forEach((el) => {
        if (!el.hasAttribute('data-lenis-prevent')) {
          el.setAttribute('data-lenis-prevent', 'true');
        }
      });
    };

    const checkModals = () => {
      const modalElements = document.querySelectorAll(MODAL_SELECTORS);
      const hasModal = modalElements.length > 0;

      applyLenisPrevent();

      if (hasModal === wasOpen) return;
      wasOpen = hasModal;

      if (hasModal) {
        document.body.classList.add('modal-open');
        document.documentElement.classList.add('modal-open');
        if (lenis && typeof lenis.stop === 'function') {
          lenis.stop();
        }
      } else {
        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('modal-open');
        if (lenis && typeof lenis.start === 'function') {
          lenis.start();
        }
      }
    };

    // Capture-phase wheel listener: ensures mouse roll over any modal / drawer / popup
    // scrolls smoothly and is never blocked, intercepted or hijacked by background Lenis.
    const handleWheelCapture = (e) => {
      const scrollable = e.target.closest(
        `${MODAL_SELECTORS}, [data-lenis-prevent]`
      );
      if (scrollable) {
        e.stopPropagation();
      }
    };

    window.addEventListener('wheel', handleWheelCapture, { capture: true, passive: true });

    checkModals();

    const observer = new MutationObserver(() => {
      checkModals();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    return () => {
      window.removeEventListener('wheel', handleWheelCapture, { capture: true });
      observer.disconnect();
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
      if (lenis && typeof lenis.start === 'function') {
        lenis.start();
      }
    };
  }, [lenis]);

  return null;
}
