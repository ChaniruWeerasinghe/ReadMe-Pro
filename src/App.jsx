import { BrowserRouter, Routes, Route, Navigate, Link, useParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useHeader } from './context/HeaderContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ViewerPage from './pages/ViewerPage';
import CollectionViewerPage from './pages/CollectionViewerPage';
import ThemeToggle from './components/ThemeToggle';
import { LogoIcon } from './components/Icons';
import ProfileMenu from './components/ProfileMenu';
import Footer from './components/Footer';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './config/firebase';
import brandLogo from './assets/brand-logo.png';
import './App.css';


function AppHeader() {
  const { user, logout, isGuest } = useAuth();
  const { centerContent, leftContent } = useHeader();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="app-header">
      <div className="app-header__left">
        {/* Desktop: Show leftContent if provided, otherwise Brand */}
        <div className="desktop-only">
          {leftContent ? (
            leftContent
          ) : (
            <Link to="/" className="app-logo">
              <div className="app-logo__icon-wrapper">
                <img src={brandLogo} alt="ReadMe Logo" className="app-logo__img" />
              </div>
              <span className="app-logo__text">ReadMe</span>
            </Link>
          )}
        </div>

        {/* Mobile: Always show Brand Name */}
        <div className="mobile-only">
          <Link to="/" className="app-logo">
            <div className="app-logo__icon-wrapper">
              <img src={brandLogo} alt="ReadMe Logo" className="app-logo__img" />
            </div>
            <span className="app-logo__text">ReadMe</span>
          </Link>
        </div>
      </div>

      
      <div className="app-header__center">
        {centerContent}
      </div>

      <div className="app-header__right">
        <div className="desktop-only">
          <ThemeToggle />
        </div>
        
        {user ? (
          <div className="app-user" style={{ position: 'relative' }}>
            <div 
              className="app-user__avatar-wrapper" 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              {user.photoURL ? (
                <img
                  className="app-user__avatar"
                  src={user.photoURL}
                  alt={user.displayName}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="app-user__avatar app-user__avatar--placeholder">
                  {(user.displayName || 'G')[0].toUpperCase()}
                </div>
              )}
            </div>

            <div className="desktop-only">
              <button className="btn btn-ghost btn-sm" onClick={logout}>
                {isGuest ? 'Exit' : 'Logout'}
              </button>
            </div>

            <ProfileMenu 
              isOpen={isProfileOpen} 
              onClose={() => setIsProfileOpen(false)} 
            />
          </div>
        ) : (
          <Link to="/login" className="btn btn-solid btn-sm">
            Sign In
          </Link>
        )}
      </div>

    </header>
  );
}


function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner"></div>
        <p className="text-secondary text-sm">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}

function ShareRedirect() {
  const { shareId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [type, setType] = useState(null);
  const [id, setId] = useState(null);

  useEffect(() => {
    if (!shareId) return;
    const unsubscribe = onSnapshot(doc(db, 'shares', shareId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setType(data.itemType);
        setId(data.itemId);
      } else {
        setError('Link doesn\'t exist or has been revoked.');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [shareId]);

  if (loading) return <div className="app-loading"><div className="app-loading__spinner"></div></div>;
  if (error) return <Navigate to="/" state={{ error }} />;

  if (type === 'collection') {
    return <Navigate to={`/collection/${id}`} state={{ shareId }} replace />;
  }
  return <Navigate to={`/share/${id}`} state={{ shareId }} replace />;
}

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        <main className="app-main-content">
          <Routes>
            <Route
              path="/login"
              element={<LoginPage />}
            />
            <Route
              path="/"
              element={
                <>
                  <AppHeader />
                  <DashboardPage />
                </>
              }
            />
            <Route 
              path="/share/:noteId" 
              element={
                <>
                  <AppHeader />
                  <ViewerPage />
                </>
              } 
            />
            <Route 
              path="/collection/:collectionId" 
              element={
                <>
                  <AppHeader />
                  <CollectionViewerPage />
                </>
              } 
            />
            <Route 
              path="/s/:shareId" 
              element={<ShareRedirect />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}


export default App;
