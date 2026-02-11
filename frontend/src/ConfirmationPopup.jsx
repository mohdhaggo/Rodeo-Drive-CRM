import React, { useEffect } from 'react';
import './ConfirmationPopup.css';

const ConfirmationPopup = ({ 
  isVisible, 
  onConfirm, 
  onCancel,
  message = "Are you sure?",
  confirmText = "Yes",
  cancelText = "No"
}) => {
  // Close popup on Escape key press
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isVisible) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, onCancel]);

  // Prevent body scrolling when popup is open
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="confirmation-overlay" onClick={handleOverlayClick}>
      <div className="confirmation-container">
        <div className="confirmation-header">
          <h3>Confirm</h3>
          <button className="confirmation-close-btn" onClick={onCancel}>
            ×
          </button>
        </div>
        <div className="confirmation-body">
          <p>{message}</p>
        </div>
        <div className="confirmation-footer">
          <button className="confirmation-btn confirm" onClick={onConfirm}>
            {confirmText}
          </button>
          <button className="confirmation-btn cancel" onClick={onCancel}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPopup;
