import { Routes, Route, Navigate } from 'react-router-dom';
import { DEFAULT_BUSINESS_SLUG } from './business/BusinessContext.jsx';
import AdminApp from './admin/AdminApp.jsx';
import BusinessLayout from './components/BusinessLayout.jsx';
import SessionEntry from './components/SessionEntry.jsx';
import LandingPage from './pages/LandingPage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import ConfirmationPage from './pages/ConfirmationPage.jsx';

// The customer app is scoped to a business under /b/:slug (the QR/menu link).
// The root URL shows a landing page introducing the restaurant; unknown
// paths fall back to the default business's menu.
export default function App() {
  const home = `/b/${DEFAULT_BUSINESS_SLUG}`;
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="/b/:slug" element={<BusinessLayout />}>
        <Route index element={<MenuPage />} />
        <Route path="s/:token" element={<SessionEntry />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="orders/:orderId" element={<ConfirmationPage />} />
      </Route>
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
}
