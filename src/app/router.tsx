import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Shell } from '../components/layout/Shell';
import { AccountPage } from '../pages/AccountPage';
import { AdminShellPage } from '../pages/AdminShellPage';
import { AuthCallbackPage } from '../pages/AuthCallbackPage';
import {
  CartRedirectPage,
  CheckoutCancelledPage,
  CheckoutPage,
  CheckoutSuccessPage,
} from '../pages/CheckoutPages';
import { CollectionDetailPage, CollectionsPage } from '../pages/CollectionsPages';
import { DesignPage } from '../pages/DesignPage';
import { HomePage } from '../pages/HomePage';
import {
  AboutPage,
  HowItWorksPage,
  LicencePage,
  PrivacyPage,
  RefundsPage,
  SupportPage,
  TermsPage,
} from '../pages/InfoPages';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { SavedPage } from '../pages/SavedPage';
import { SearchPage } from '../pages/SearchPage';
import { ShopPage } from '../pages/ShopPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/collections/:slug" element={<CollectionDetailPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/cart-redirect" element={<CartRedirectPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
          <Route path="/checkout/cancelled" element={<CheckoutCancelledPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/licence" element={<LicencePage />} />
          <Route path="/legal/privacy" element={<PrivacyPage />} />
          <Route path="/legal/terms" element={<TermsPage />} />
          <Route path="/legal/refunds" element={<RefundsPage />} />
          <Route path="/admin/*" element={<AdminShellPage />} />
          <Route path="/design" element={<DesignPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
