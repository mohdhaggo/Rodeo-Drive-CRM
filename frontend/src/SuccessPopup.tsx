import React, { useEffect, ReactNode } from 'react';
import './SuccessPopup.css';

interface SuccessPopupProps {
  isVisible: boolean;
  onClose: () => void;
  message?: ReactNode;
  userName?: string;
}

const SuccessPopup = ({ 
  isVisible, 
  onClose, 
  message = "User has been added successfully!",
  userName 
}: SuccessPopupProps) => {
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
    <div className="popup-overlay" onClick={handleOverlayClick}>
      <div className="popup-container">
        <div className="popup-header">
          <h3>Success!</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="popup-body">
          <div className="success-icon">✓</div>
          <p>{userName ? `User "${userName}" has been added successfully!` : message}</p>
        </div>
        <div className="popup-footer">
          <button className="confirm-btn" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessPopup;
