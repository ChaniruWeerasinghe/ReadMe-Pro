import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { HeaderProvider } from './context/HeaderContext';
import { ToastProvider } from './components/Toast';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <HeaderProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </HeaderProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
