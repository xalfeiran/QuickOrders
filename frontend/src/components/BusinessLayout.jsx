import { Outlet, useParams } from 'react-router-dom';
import { BusinessProvider } from '../business/BusinessContext.jsx';
import { ManagedSessionProvider } from '../business/ManagedSessionContext.jsx';
import { CartProvider } from '../cart/CartContext.jsx';
import Header from './Header.jsx';
import FloatingCartBanner from './FloatingCartBanner.jsx';

// Layout for everything under /b/:slug. Provides the active business, the
// manager-link pre-verification, and a per-business cart (keyed by slug, so
// switching business starts a fresh cart).
export default function BusinessLayout() {
  const { slug } = useParams();

  return (
    <BusinessProvider slug={slug}>
      <ManagedSessionProvider>
        <CartProvider key={slug}>
          <div className="app">
            <Header />
            <main className="app__main">
              <Outlet />
            </main>
            <FloatingCartBanner />
          </div>
        </CartProvider>
      </ManagedSessionProvider>
    </BusinessProvider>
  );
}
