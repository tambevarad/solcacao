import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './features/auth/public.js';
import { CartProvider, CartDrawer } from './features/catalog/public.js';
import { LocaleProvider } from './features/shell/public.js';
import { AppRoutes } from './routes.js';
import './styles.css';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LocaleProvider>
        <AuthProvider>
          <CartProvider>
            <AppRoutes />
            <CartDrawer />
          </CartProvider>
        </AuthProvider>
      </LocaleProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
