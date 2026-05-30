import { useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import './ProfileMenu.css';

export default function ProfileMenu({ isOpen, onClose }) {
  const { user, logout, isGuest } = useAuth();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="profile-menu animate-scale-in" ref={menuRef}>
      <div className="profile-menu__header">
        <div className="profile-menu__user-info">
          <p className="profile-menu__name">{user?.displayName || 'Guest User'}</p>
          <p className="profile-menu__email text-muted">{user?.email || 'guest@readme.so'}</p>
        </div>
      </div>
      
      <div className="profile-menu__divider"></div>
      
      <div className="profile-menu__section mobile-only-flex">
        <div className="profile-menu__item">
          <span className="profile-menu__item-label">Appearance</span>
          <ThemeToggle />
        </div>
      </div>

      <div className="profile-menu__divider mobile-only"></div>

      <div className="profile-menu__section">
        <button className="profile-menu__item profile-menu__item--danger" onClick={() => { logout(); onClose(); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>{isGuest ? 'Exit Session' : 'Logout'}</span>
        </button>
      </div>
    </div>
  );
}
