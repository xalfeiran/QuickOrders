import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useBusiness } from '../business/BusinessContext.jsx';
import { describeOptions } from '../cart/line.js';
import { formatPrice } from '../utils/money.js';

const STATUS_LABELS = {
  received: 'Recibido',
  preparing: 'En preparación',
  ready: 'Listo',
  completed: 'Entregado',
};

function formatAddress(a) {
  if (!a) return '';
  const interior = a.interiorNumber ? ` int. ${a.interiorNumber}` : '';
  return `${a.street} ${a.exteriorNumber}${interior}, ${a.neighborhood}, ${a.city} ${a.postalCode}`;
}

// Muestra el pedido realizado, buscado por id desde la URL.
export default function ConfirmationPage() {
  const { orderId } = useParams();
  const { slug } = useBusiness();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    api
      .getOrder(orderId)
      .then((data) => {
        setOrder(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [orderId]);

  if (status === 'loading') return <p className="notice">Cargando pedido…</p>;
  if (status === 'error')
    return <p className="notice">No encontramos el pedido.</p>;

  const isDelivery = order.fulfillmentType === 'delivery';

  return (
    <section>
      <h2 className="page-title">¡Pedido confirmado!</h2>
      <p className="notice notice--success">
        ¡Gracias, {order.customerName}! Recibimos tu pedido.
      </p>

      <dl className="review">
        <div>
          <dt>Pedido</dt>
          <dd>#{order.id.slice(0, 8).toUpperCase()}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>{STATUS_LABELS[order.status] ?? order.status}</dd>
        </div>
        <div>
          <dt>Entrega</dt>
          <dd>{isDelivery ? 'A domicilio' : 'Recoger en sucursal'}</dd>
        </div>
        {isDelivery && order.deliveryAddress && (
          <div>
            <dt>Dirección</dt>
            <dd>{formatAddress(order.deliveryAddress)}</dd>
          </div>
        )}
        <div>
          <dt>Pago</dt>
          <dd>{order.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}</dd>
        </div>
      </dl>

      <ul className="cart-list">
        {order.items.map((line) => (
          <li key={line.id ?? line.menuItemId} className="cart-line">
            <div className="cart-line__info">
              <p className="cart-line__name">
                {line.quantity}× {line.name}
              </p>
              {line.selectedOptions && line.selectedOptions.length > 0 && (
                <p className="cart-line__options">
                  {describeOptions(line.selectedOptions)}
                </p>
              )}
            </div>
            <span>{formatPrice(line.lineTotalCents)}</span>
          </li>
        ))}
      </ul>

      <div className="cart-total">
        <span>Total</span>
        <strong>{formatPrice(order.totalCents)}</strong>
      </div>

      <Link to={`/b/${slug}`} className="button button--block">
        Volver al menú
      </Link>
    </section>
  );
}
