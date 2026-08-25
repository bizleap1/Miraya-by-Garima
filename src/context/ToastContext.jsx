import React, { createContext, useContext, useState, useCallback } from 'react';
import LuxuryToastContainer from '../components/LuxuryToastContainer';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', options = {}) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    const newToast = {
      id,
      message,
      type, // 'success' | 'error' | 'warning' | 'info' | 'coupon'
      title: options.title || (
        type === 'coupon' ? 'COUPON APPLIED' :
        type === 'success' ? 'SUCCESS' :
        type === 'error' ? 'ACTION REQUIRED' :
        type === 'warning' ? 'ATTENTION' : 'NOTIFICATION'
      ),
      duration: options.duration || 4000,
      ...options
    };

    setToasts((prev) => {
      if (prev.some(t => t.message === message)) return prev;
      return [...prev.slice(-4), newToast]; // keep max 4 toasts at once
    });

    return id;
  }, []);

  const toast = React.useMemo(() => ({
    success: (msg, title, options = {}) => showToast(msg, 'success', { title, ...options }),
    error: (msg, title, options = {}) => showToast(msg, 'error', { title, ...options }),
    warning: (msg, title, options = {}) => showToast(msg, 'warning', { title, ...options }),
    info: (msg, title, options = {}) => showToast(msg, 'info', { title, ...options }),
    coupon: (msg, title = 'PROMO CODE APPLIED', options = {}) => showToast(msg, 'coupon', { title, ...options }),
    remove: removeToast
  }), [showToast, removeToast]);

  // Expose on window for convenience
  if (typeof window !== 'undefined') {
    window.toast = toast;
  }

  return (
    <ToastContext.Provider value={{ toast, showToast, removeToast }}>
      {children}
      <LuxuryToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if rendered outside provider
    if (typeof window !== 'undefined' && window.toast) {
      return { toast: window.toast, showToast: window.toast.success, removeToast: () => {} };
    }
    return {
      toast: {
        success: (m) => console.log('[Toast Success]', m),
        error: (m) => console.error('[Toast Error]', m),
        warning: (m) => console.warn('[Toast Warning]', m),
        info: (m) => console.log('[Toast Info]', m),
        coupon: (m) => console.log('[Toast Coupon]', m),
        remove: () => {}
      },
      showToast: (m) => console.log('[Toast]', m),
      removeToast: () => {}
    };
  }
  return context;
};

export default ToastContext;
