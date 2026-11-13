import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth, RequireRole } from './features/auth/public.js';
import { Layout } from './features/shell/Layout.js';
import { PageFrame } from './features/shell/PageFrame.js';
import type { RouteMetaId } from './features/shell/meta.js';
import { LoadingState } from './shared/index.js';
import NotFoundPage from './features/shell/pages/NotFoundPage.js';
import HomePage from './features/b2b/pages/HomePage.js';

// The landing and not-found pages ship in the main bundle; every other page loads on first visit
// (Phase 4 code splitting, D22).
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage.js'));
const RegisterPage = lazy(() => import('./features/auth/pages/RegisterPage.js'));
const AccountPage = lazy(() => import('./features/auth/pages/AccountPage.js'));
const CatalogPage = lazy(() => import('./features/catalog/pages/CatalogPage.js'));
const ProductPage = lazy(() => import('./features/catalog/pages/ProductPage.js'));
const CheckoutPage = lazy(() => import('./features/catalog/pages/CheckoutPage.js'));
const OrderConfirmationPage = lazy(
  () => import('./features/catalog/pages/OrderConfirmationPage.js'),
);
const WholesalePage = lazy(() => import('./features/b2b/pages/WholesalePage.js'));
const QuoteWizardPage = lazy(() => import('./features/b2b/pages/QuoteWizardPage.js'));
const ContactPage = lazy(() => import('./features/support/pages/ContactPage.js'));
const FeedbackPage = lazy(() => import('./features/support/pages/FeedbackPage.js'));
const SamplerPage = lazy(() => import('./features/support/pages/SamplerPage.js'));
const StoryPage = lazy(() => import('./features/support/pages/StoryPage.js'));
const CarePage = lazy(() => import('./features/support/pages/CarePage.js'));

/**
 * Default title/description, error containment and usePageMeta support for every page. Suspense
 * sits inside PageFrame so a page chunk that fails to load shows the page error state.
 */
const page = (meta: RouteMetaId, element: ReactNode) => (
  <PageFrame meta={meta}>
    <Suspense fallback={<LoadingState />}>{element}</Suspense>
  </PageFrame>
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
