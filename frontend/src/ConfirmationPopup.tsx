import { useEffect, CSSProperties } from 'react';
import './ConfirmationPopup.css';

interface ConfirmationPopupProps {
  isVisible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonStyle?: CSSProperties;
  cancelButtonStyle?: CSSProperties;
  confirmButtonClass?: string | null;
  cancelButtonClass?: string | null;
  secondaryAction?: (() => void) | null;
  secondaryActionText?: string | null;
  secondaryActionStyle?: CSSProperties;
  secondaryActionClass?: string | null;
}

const ConfirmationPopup = ({ 
  isVisible, 
  onConfirm, 
  onCancel,
  message = "Are you sure?",
  confirmText = "Yes",
  cancelText = "No",
  confirmButtonStyle,
  cancelButtonStyle,
  confirmButtonClass = null,
  cancelButtonClass = null,
  secondaryAction = null,
  secondaryActionText = null,
  secondaryActionStyle,
  secondaryActionClass = null
}: ConfirmationPopupProps) => {
  // Close popup on Escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
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

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
          {secondaryAction && secondaryActionText ? (
            <>
              <button 
                className={`confirmation-btn confirm ${confirmButtonClass || ''}`}
                style={confirmButtonStyle}
                onClick={onConfirm}
              >
                {confirmText}
              </button>
              <button 
                className={`confirmation-btn secondary ${secondaryActionClass || ''}`}
                style={secondaryActionStyle}
                onClick={secondaryAction}
              >
                {secondaryActionText}
              </button>
              <button 
                className={`confirmation-btn cancel ${cancelButtonClass || ''}`}
                style={cancelButtonStyle}
                onClick={onCancel}
              >
                {cancelText}
              </button>
            </>
          ) : (
            <>
              <button 
                className={`confirmation-btn confirm ${confirmButtonClass || ''}`}
                style={confirmButtonStyle}
                onClick={onConfirm}
              >
                {confirmText}
              </button>
              <button 
                className={`confirmation-btn cancel ${cancelButtonClass || ''}`}
                style={cancelButtonStyle}
                onClick={onCancel}
              >
                {cancelText}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPopup;
