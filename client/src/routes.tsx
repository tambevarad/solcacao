import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth, RequireRole } from './features/auth/public.js';
import { Layout } from './features/shell/Layout.js';
import { PageFrame } from './features/shell/PageFrame.js';
import type { RouteMetaId } from './features/shell/meta.js';
import LoginPage from './features/auth/pages/LoginPage.js';
import RegisterPage from './features/auth/pages/RegisterPage.js';
import AccountPage from './features/auth/pages/AccountPage.js';
import NotFoundPage from './features/shell/pages/NotFoundPage.js';
import CatalogPage from './features/catalog/pages/CatalogPage.js';
import ProductPage from './features/catalog/pages/ProductPage.js';
import CheckoutPage from './features/catalog/pages/CheckoutPage.js';
import OrderConfirmationPage from './features/catalog/pages/OrderConfirmationPage.js';
import HomePage from './features/b2b/pages/HomePage.js';
import WholesalePage from './features/b2b/pages/WholesalePage.js';
import QuoteWizardPage from './features/b2b/pages/QuoteWizardPage.js';
import ContactPage from './features/support/pages/ContactPage.js';
import FeedbackPage from './features/support/pages/FeedbackPage.js';
import SamplerPage from './features/support/pages/SamplerPage.js';
import StoryPage from './features/support/pages/StoryPage.js';
import CarePage from './features/support/pages/CarePage.js';

/** Default title/description, error containment and usePageMeta support for every page. */
const page = (meta: RouteMetaId, element: ReactNode) => (
  <PageFrame meta={meta}>{element}</PageFrame>
);

// Source of truth for URLs (docs/contracts.md). Paths are canonical and never translated; only the
// /:locale prefix changes. Route changes go through Student 2.
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/en" replace />} />
      <Route path="/:locale" element={<Layout />}>
        <Route index element={page('home', <HomePage />)} />
        <Route path="catalog" element={page('catalog', <CatalogPage />)} />
        <Route path="products/:slug" element={page('product', <ProductPage />)} />
        <Route path="login" element={page('login', <LoginPage />)} />
        <Route path="register" element={page('register', <RegisterPage />)} />
        <Route
          path="account"
          element={page(
            'account',
            <RequireAuth>
              <AccountPage />
            </RequireAuth>,
          )}
        />
        <Route path="checkout" element={page('checkout', <CheckoutPage />)} />
        <Route
          path="order-confirmation"
          element={page('orderConfirmation', <OrderConfirmationPage />)}
        />
        <Route path="wholesale" element={page('wholesale', <WholesalePage />)} />
        <Route
          path="wholesale/request"
          element={page(
            'quoteRequest',
            <RequireRole role="b2b">
              <QuoteWizardPage />
            </RequireRole>,
          )}
        />
        <Route path="contact" element={page('contact', <ContactPage />)} />
        <Route path="feedback" element={page('feedback', <FeedbackPage />)} />
        <Route path="sampler" element={page('sampler', <SamplerPage />)} />
        <Route path="story" element={page('story', <StoryPage />)} />
        <Route path="care" element={page('care', <CarePage />)} />
        <Route path="*" element={page('notFound', <NotFoundPage />)} />
      </Route>
    </Routes>
  );
}
