import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth, RequireRole } from './features/auth/public.js';
import { Layout } from './features/shell/Layout.js';
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
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/en" replace />} />
      <Route path="/:locale" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="products/:slug" element={<ProductPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="account"
          element={
            <RequireAuth>
              <AccountPage />
            </RequireAuth>
          }
        />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="order-confirmation" element={<OrderConfirmationPage />} />
        <Route path="wholesale" element={<WholesalePage />} />
        <Route
          path="wholesale/request"
          element={
            <RequireRole role="b2b">
              <QuoteWizardPage />
            </RequireRole>
          }
        />
        <Route path="contact" element={<ContactPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="sampler" element={<SamplerPage />} />
        <Route path="story" element={<StoryPage />} />
        <Route path="care" element={<CarePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
