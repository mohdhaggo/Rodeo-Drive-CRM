import React, { useEffect } from 'react';
import './ErrorPopup.css';

const ErrorPopup = ({ 
  isVisible, 
  onClose, 
  message = "An error occurred. Please try again.",
}) => {
  // Close popup on Escape key press
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, onClose]);

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
      onClose();
    }
  };

  return (
    <div className="error-overlay" onClick={handleOverlayClick}>
      <div className="error-container">
        <div className="error-header">
          <h3>Error!</h3>
          <button className="error-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="error-body">
          <div className="error-icon">⚠</div>
          <p>{message}</p>
        </div>
        <div className="error-footer">
          <button className="error-confirm-btn" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPopup;
