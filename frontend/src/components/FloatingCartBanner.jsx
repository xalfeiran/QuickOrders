import { useLocation, useNavigate } from 'react-router-dom';
import { useBusiness } from '../business/BusinessContext.jsx';
import { useCart } from '../cart/CartContext.jsx';
import { formatPrice } from '../utils/money.js';

// Persistent bottom banner summarising the cart. Hidden when the cart is empty
// or while the customer is already on the cart/checkout screens.
export default function FloatingCartBanner() {
  const { itemCount, totalCents } = useCart();
  const { slug } = useBusiness();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const hiddenHere =
    pathname.endsWith('/cart') || pathname.endsWith('/checkout');
  if (itemCount === 0 || hiddenHere) return null;

  return (
    <button
      className="cart-banner"
      onClick={() => navigate(`/b/${slug}/cart`)}
    >
      <span className="cart-banner__count">
        {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
      </span>
      <span className="cart-banner__label">Ver carrito</span>
      <span className="cart-banner__total">{formatPrice(totalCents)}</span>
    </button>
  );
}
