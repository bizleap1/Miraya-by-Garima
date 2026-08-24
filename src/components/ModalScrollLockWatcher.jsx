'use client';
import { useEffect } from 'react';
import { useLenis } from 'lenis/react';

export default function ModalScrollLockWatcher() {
  const lenis = useLenis();

  useEffect(() => {
    let wasOpen = false;

    const checkModals = () => {
      const hasModal = !!document.querySelector(
        '.admin-modal-overlay, .modal-overlay, [data-modal="true"], [role="dialog"]'
      );

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

    checkModals();

    const observer = new MutationObserver(() => {
      checkModals();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
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
