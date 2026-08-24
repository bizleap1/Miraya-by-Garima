import React from 'react';
import { AlertTriangle, Trash2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import './ConfirmModal.css';

/**
 * MIRAYA HAUTE COUTURE LUXURY CONFIRMATION & ALERT MODAL
 * Usage: <ConfirmModal config={config} onClose={() => setConfig(null)} />
 * config = {
 *   title?: string,
 *   message: string,
 *   subMessage?: string,
 *   confirmText?: string,
 *   cancelText?: string,
 *   danger?: boolean,
 *   isAlert?: boolean,
 *   isSuccess?: boolean,
 *   onConfirm?: () => void
 * }
 */
const ConfirmModal = ({ config, onClose }) => {
  if (!config) return null;

  const {
    title,
    message,
    subMessage,
    confirmText = 'Confirm Action',
    cancelText = 'Cancel',
    danger = false,
    isAlert = false,
    isSuccess = false,
    onConfirm
  } = config;

  const handleConfirm = () => {
    onClose();
    if (onConfirm) onConfirm();
  };

  return (
    <div className="miraya-confirm-backdrop" onClick={onClose}>
      <div className="miraya-confirm-modal" onClick={(e) => e.stopPropagation()}>
        {/* CLOSE BUTTON */}
        <button
          className="miraya-confirm-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {/* ICON BADGE */}
        <div className={`miraya-confirm-icon-wrapper ${isSuccess ? 'success' : danger ? 'danger' : 'warning'}`}>
          {isSuccess ? (
            <CheckCircle2 size={28} className="miraya-confirm-icon" />
          ) : danger ? (
            <Trash2 size={28} className="miraya-confirm-icon" />
          ) : (
            <AlertTriangle size={28} className="miraya-confirm-icon" />
          )}
        </div>

        {/* CONTENT */}
        <div className="miraya-confirm-content">
          <h3 className="miraya-confirm-title">
            {title || (danger ? 'Confirm Deletion' : isSuccess ? 'Success' : 'Confirmation')}
          </h3>
          <p className="miraya-confirm-message">{message}</p>
          {subMessage && <p className="miraya-confirm-submessage">{subMessage}</p>}
        </div>

        {/* ACTIONS */}
        <div className="miraya-confirm-actions">
          {!isAlert && (
            <button
              type="button"
              className="miraya-confirm-btn-cancel"
              onClick={onClose}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            className={`miraya-confirm-btn-action ${danger ? 'danger' : isSuccess ? 'success' : 'primary'}`}
            onClick={handleConfirm}
            autoFocus
          >
            {isAlert && confirmText === 'Confirm Action' ? 'Acknowledge' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
