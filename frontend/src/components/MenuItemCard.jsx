import { formatPrice } from '../utils/money.js';

// One tappable menu item. Tapping opens the customiser (via onSelect) so the
// customer can set quantity and options before adding to the cart.
export default function MenuItemCard({ item, onSelect }) {
  return (
    <article className="card">
      <div className="card__body">
        <h3 className="card__title">{item.name}</h3>
        <p className="card__desc">{item.description}</p>
        <span className="card__price">{formatPrice(item.priceCents)}</span>
      </div>
      <button
        className="button"
        onClick={() => onSelect(item)}
        disabled={!item.available}
      >
        {item.available ? 'Agregar' : 'Agotado'}
      </button>
    </article>
  );
}
