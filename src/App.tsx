import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { AuthProvider } from './features/auth/AuthContext';
import { PwaProvider } from './features/pwa/PwaContext';
import { storage } from './lib/storage';

export const App: React.FC = () => {
  // Ensure default theme is applied to <html> element on startup
  useEffect(() => {
    const theme = storage.getTheme();
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <AuthProvider>
      <PwaProvider>
        <RouterProvider router={router} />
      </PwaProvider>
    </AuthProvider>
  );
};

export default App;
