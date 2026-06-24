import { Link, useNavigate } from 'react-router-dom';
import { useBusiness } from '../business/BusinessContext.jsx';
import { useCart } from '../cart/CartContext.jsx';
import { describeOptions } from '../cart/line.js';
import { formatPrice } from '../utils/money.js';

// Review and adjust quantities before checkout. Each line is a customised
// variant, keyed by line.key.
export default function CartPage() {
  const { items, totalCents, setQuantity, removeLine } = useCart();
  const { slug } = useBusiness();
  const navigate = useNavigate();
  const base = `/b/${slug}`;

  if (items.length === 0) {
    return (
      <section>
        <h2 className="page-title">Tu carrito</h2>
        <p className="notice">Tu carrito está vacío.</p>
        <Link to={base} className="button button--block">
          Ver el menú
        </Link>
      </section>
    );
  }

  return (
    <section>
      <h2 className="page-title">Tu carrito</h2>
      <ul className="cart-list">
        {items.map((line) => (
          <li key={line.key} className="cart-line">
            <div className="cart-line__info">
              <p className="cart-line__name">{line.name}</p>
              {line.selectedOptions.length > 0 && (
                <p className="cart-line__options">
                  {describeOptions(line.selectedOptions)}
                </p>
              )}
              <p className="cart-line__price">
                {formatPrice(line.unitPriceCents)} c/u
              </p>
              <button
                className="cart-line__remove"
                onClick={() => removeLine(line.key)}
              >
                Quitar
              </button>
            </div>
            <div className="stepper">
              <button
                onClick={() => setQuantity(line.key, line.quantity - 1)}
                aria-label="Quitar uno"
              >
                −
              </button>
              <span>{line.quantity}</span>
              <button
                onClick={() => setQuantity(line.key, line.quantity + 1)}
                aria-label="Agregar uno"
              >
                +
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="cart-total">
        <span>Total</span>
        <strong>{formatPrice(totalCents)}</strong>
      </div>

      <button
        className="button button--block"
        onClick={() => navigate(`${base}/checkout`)}
      >
        Continuar al pago
      </button>
    </section>
  );
}
