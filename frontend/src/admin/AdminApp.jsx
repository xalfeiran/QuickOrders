import { Routes, Route } from 'react-router-dom';
import { AdminAuthProvider } from './AdminAuthContext.jsx';
import AdminLayout from './AdminLayout.jsx';
import AdminLoginPage from './AdminLoginPage.jsx';
import AdminOrdersPage from './AdminOrdersPage.jsx';
import AdminOrderDetailPage from './AdminOrderDetailPage.jsx';
import AdminMenuPage from './AdminMenuPage.jsx';
import AdminMenuItemPage from './AdminMenuItemPage.jsx';
import AdminRecipePage from './AdminRecipePage.jsx';
import AdminInventoryPage from './AdminInventoryPage.jsx';
import AdminLinksPage from './AdminLinksPage.jsx';

// The admin dashboard, mounted at /admin/*. Has its own auth provider and
// routes, separate from the customer app.
export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        <Route element={<AdminLayout />}>
          <Route index element={<AdminOrdersPage />} />
          <Route path="orders/:orderId" element={<AdminOrderDetailPage />} />
          <Route path="menu" element={<AdminMenuPage />} />
          <Route path="menu/new" element={<AdminMenuItemPage />} />
          <Route path="menu/:id/recipe" element={<AdminRecipePage />} />
          <Route path="menu/:id" element={<AdminMenuItemPage />} />
          <Route path="inventory" element={<AdminInventoryPage />} />
          <Route path="links" element={<AdminLinksPage />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}
