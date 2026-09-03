import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { describeOptions } from '../cart/line.js';
import { formatPrice } from '../utils/money.js';
import { ORDER_STATUSES, statusLabel } from './orderStatus.js';

function formatAddress(a) {
  if (!a) return '';
  const interior = a.interiorNumber ? ` int. ${a.interiorNumber}` : '';
  return `${a.street} ${a.exteriorNumber}${interior}, ${a.neighborhood}, ${a.city} ${a.postalCode}${
    a.references ? ` — ${a.references}` : ''
  }`;
}

export default function AdminOrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    api
      .adminOrder(orderId)
      .then((o) => {
        setOrder(o);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, [orderId]);

  async function changeStatus(status) {
    const updated = await api.adminUpdateOrderStatus(orderId, status);
    setOrder((o) => ({ ...o, status: updated.status }));
  }

  if (state === 'loading') return <p className="notice">Cargando…</p>;
  if (state === 'error') return <p className="notice">No encontrado.</p>;

  const isDelivery = order.fulfillmentType === 'delivery';

  return (
    <section>
      <Link className="link-button" to="/admin">
        ← Pedidos
      </Link>
      <h2 className="page-title">
        Pedido #{order.id.slice(0, 8).toUpperCase()}
      </h2>

      <div className="admin-filters">
        <label className="field">
          <span>Estado</span>
          <select
            value={order.status}
            onChange={(e) => changeStatus(e.target.value)}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <dl className="review">
        <div>
          <dt>Cliente</dt>
          <dd>{order.customerName}</dd>
        </div>
        <div>
          <dt>Teléfono</dt>
          <dd>{order.customerPhone}</dd>
        </div>
        <div>
          <dt>Entrega</dt>
          <dd>{isDelivery ? 'A domicilio' : 'Recoger'}</dd>
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
        {(order.items ?? []).map((line) => (
          <li key={line.id} className="cart-line">
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
    </section>
  );
}
