import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import { LogoIcon } from '../components/Icons';
import './LoginPage.css';

export default function LoginPage() {
  const { user, loginWithGoogle, loginAsGuest, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [googleLoading, setGoogleLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user && !googleLoading && !guestLoading) {
      navigate('/', { replace: true });
    }
  }, [user, navigate, googleLoading, guestLoading]);


  const handleGoogle = async () => {

    setGoogleLoading(true);
    clearError();
    try {
      await loginWithGoogle();
      navigate('/');
    } catch {
      // error is set in context
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGuest = async () => {
    setGuestLoading(true);
    clearError();
    try {
      await loginAsGuest();
      navigate('/');
    } catch {
      // error is set in context
    } finally {
      setGuestLoading(false);
    }
  };


  const isLoading = googleLoading || guestLoading;

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="login-bg">
        <div className="login-bg__circle login-bg__circle--1"></div>
        <div className="login-bg__circle login-bg__circle--2"></div>
        <div className="login-bg__circle login-bg__circle--3"></div>
      </div>

      {/* Theme toggle — top right */}
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>

      {/* Login card */}
      <div className="login-card animate-scale-in">
        <div className="login-card__header">
          <div className="login-card__logo">
            <LogoIcon size={32} strokeWidth={3} />
          </div>
          <h1 className="login-card__title">ReadMe</h1>
          <p className="login-card__subtitle">
            Minimalistic markdown sharing for everyone.
          </p>
        </div>


        {/* Error message */}
        {error && (
          <div className="login-error animate-slide-down">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
            <button className="login-error__close" onClick={clearError} aria-label="Dismiss error">×</button>
          </div>
        )}

        <div className="login-card__actions">
          {/* Google Sign In */}
          <button
            className="login-btn login-btn--google"
            onClick={handleGoogle}
            disabled={isLoading}
            id="google-sign-in-btn"
          >
            {googleLoading ? (
              <span className="login-spinner"></span>
            ) : (
              <svg className="login-btn__icon" width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            <span>{googleLoading ? 'Signing in...' : 'Continue with Google'}</span>
          </button>

          <div className="login-divider">
            <span>or</span>
          </div>

          {/* Guest Mode */}
          <button
            className="login-btn login-btn--guest"
            onClick={handleGuest}
            disabled={isLoading}
            id="guest-sign-in-btn"
          >
            {guestLoading ? (
              <span className="login-spinner"></span>
            ) : (
              <svg className="login-btn__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
            <span>{guestLoading ? 'Creating session...' : 'Continue as Guest'}</span>
          </button>
        </div>

        <p className="login-card__note">
          Guests can view shared notes. Sign in with Google to create & share your own.
        </p>
      </div>
    </div>
  );
}
