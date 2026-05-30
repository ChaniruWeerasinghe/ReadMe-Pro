import { createContext, useContext, useState } from 'react';

const HeaderContext = createContext();

export function HeaderProvider({ children }) {
  const [centerContent, setCenterContent] = useState(null);
  const [leftContent, setLeftContent] = useState(null);

  return (
    <HeaderContext.Provider value={{ centerContent, setCenterContent, leftContent, setLeftContent }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
}
