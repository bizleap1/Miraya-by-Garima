import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, AlertCircle, AlertTriangle, Info, X, Tag, Gift } from 'lucide-react';
import './LuxuryToast.css';

const ToastItem = ({ toast, onRemove }) => {
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 4000;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        onRemove(toast.id);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [toast.id, duration, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case 'coupon':
        return <Tag size={20} className="animate-pulse" />;
      case 'success':
        return <Sparkles size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'info':
      default:
        return <CheckCircle2 size={20} />;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.85, y: -15, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      className={`luxury-toast-card toast-${toast.type}`}
      onClick={() => onRemove(toast.id)}
      role="alert"
    >
      <div className="luxury-toast-icon-wrap">
        {getIcon()}
      </div>

      <div className="luxury-toast-body">
        {toast.title && (
          <div className="luxury-toast-header">
            <span className="luxury-toast-badge">
              {toast.title}
            </span>
          </div>
        )}
        <div className="luxury-toast-message">
          {toast.message}
        </div>
      </div>

      <button
        type="button"
        className="luxury-toast-close"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(toast.id);
        }}
        aria-label="Close notification"
      >
        <X size={16} />
      </button>

      {/* Countdown line */}
      <div
        className="luxury-toast-progress"
        style={{ width: `${progress}%`, transition: 'width 20ms linear' }}
      />
    </motion.div>
  );
};

export default function LuxuryToastContainer({ toasts, onRemove }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="luxury-toast-viewport" aria-live="polite">
      <AnimatePresence mode="sync">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}
