import './SystemAlert.css';
import { WarningIcon } from './Icons';

export default function SystemAlert({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'OK', 
  cancelText = 'Cancel', 
  type = 'warning',
  isLoading = false 
}) {
  if (!isOpen) return null;

  return (
    <div 
      className="system-alert-overlay animate-fade-in" 
      onClick={(e) => e.target === e.currentTarget && !isLoading && onClose()}
    >
      <div className="system-alert animate-scale-in">
        <div className={`system-alert__icon-box system-alert__icon-box--${type}`}>
          {type === 'warning' && <WarningIcon size={32} />}
          {type === 'danger' && (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )}
          {type === 'info' && (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          )}
        </div>

        <div className="system-alert__content">
          <h3 className="system-alert__title">{title}</h3>
          <p className="system-alert__message">{message}</p>
        </div>

        <div className="system-alert__actions">
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-solid'}`} 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="login-spinner" style={{ width: 14, height: 14 }}></span>
                Processing...
              </>
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
