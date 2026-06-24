import { Link } from 'react-router-dom';
import { useBusiness } from '../business/BusinessContext.jsx';
import { useCart } from '../cart/CartContext.jsx';

// Sticky top bar with the business name and a link to the cart.
export default function Header() {
  const { itemCount } = useCart();
  const { slug, name } = useBusiness();
  const base = `/b/${slug}`;

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
