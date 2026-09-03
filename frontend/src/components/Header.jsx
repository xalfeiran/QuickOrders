import { Link } from 'react-router-dom';
import { useBusiness } from '../business/BusinessContext.jsx';
import { useCart } from '../cart/CartContext.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

// Sticky top bar with the business name and a link to the cart.
export default function Header() {
  const { itemCount } = useCart();
  const { slug, name } = useBusiness();
  const base = `/b/${slug}`;

  // Once we know which business this is, the tab should say so (e.g.
  // "Alita Mía · Quick Order") instead of staying on whatever title the
  // landing page or a previous business left behind.
  useDocumentTitle(name ? `${name} · Quick Order` : 'Quick Order');

  return (
    <header className="header">
      <Link to={base} className="header__brand">
        {name || 'Alita Mía'}
      </Link>
      <Link to={`${base}/cart`} className="header__cart" aria-label="Ver carrito">
        Carrito
        {itemCount > 0 && <span className="header__badge">{itemCount}</span>}
      </Link>
    </header>
  );
}
