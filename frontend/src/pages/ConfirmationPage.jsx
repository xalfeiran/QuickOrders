import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { ORDER_STATUSES, statusLabel } from '../admin/orderStatus.js';
import { useBusiness } from '../business/BusinessContext.jsx';
import { describeOptions } from '../cart/line.js';
import { formatPrice } from '../utils/money.js';

const POLL_INTERVAL_MS = 5000;

const STATUS_MESSAGES = {
  received: 'Tu pedido ya fue recibido.',
  preparing: 'Estamos preparando tu pedido.',
  ready: 'Tu pedido está listo.',
  completed: 'Pedido entregado.',
};

function formatAddress(a) {
  if (!a) return '';
  const interior = a.interiorNumber ? ` int. ${a.interiorNumber}` : '';
  return `${a.street} ${a.exteriorNumber}${interior}, ${a.neighborhood}, ${a.city} ${a.postalCode}`;
}

function normalizeLine(line) {
  return {
    id: line.id,
    menuItemId: line.menuItemId ?? line.menu_item_id,
    name: line.name,
    quantity: line.quantity,
    lineTotalCents: line.lineTotalCents ?? line.line_total_cents,
    selectedOptions: line.selectedOptions ?? line.selected_options ?? [],
  };
}

function normalizeOrder(raw) {
  const lines = raw.items ?? raw.lines ?? [];

  return {
    id: raw.id,
    customerName: raw.customerName ?? raw.customer_name,
    customerPhone: raw.customerPhone ?? raw.customer_phone,
    fulfillmentType: raw.fulfillmentType ?? raw.fulfillment_type,
    paymentMethod: raw.paymentMethod ?? raw.payment_method,
    status: raw.status,
    totalCents: raw.totalCents ?? raw.total_cents,
    deliveryAddress: raw.deliveryAddress ?? raw.delivery_address,
    createdAt: raw.createdAt ?? raw.created_at,
    items: lines.map(normalizeLine),
  };
}

function formatRefreshTime(date) {
  if (!date) return '';
  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Muestra el pedido realizado y mantiene su estado actualizado.
export default function ConfirmationPage() {
  const { orderId } = useParams();
  const { slug } = useBusiness();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('loading');
  const [refreshStatus, setRefreshStatus] = useState('idle');
  const [lastRefreshAt, setLastRefreshAt] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrder({ initial = false } = {}) {
      try {
        if (!initial) setRefreshStatus('refreshing');
        const data = await api.getOrder(orderId);
        if (cancelled) return;

        setOrder(normalizeOrder(data));
        setStatus('ready');
        setLastRefreshAt(new Date());
        setRefreshStatus('idle');
      } catch {
        if (cancelled) return;
        if (initial) {
          setStatus('error');
        } else {
          setRefreshStatus('error');
        }
      }
    }

    loadOrder({ initial: true });
    const intervalId = window.setInterval(() => {
      loadOrder();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [orderId]);

  if (status === 'loading') return <p className="notice">Cargando pedido…</p>;
  if (status === 'error')
    return <p className="notice">No encontramos el pedido.</p>;

  const isDelivery = order.fulfillmentType === 'delivery';
  const visibleStatuses = ORDER_STATUSES.includes(order.status)
    ? ORDER_STATUSES
    : [...ORDER_STATUSES, order.status];
  const currentStep = Math.max(visibleStatuses.indexOf(order.status), 0);
  const refreshLabel =
    refreshStatus === 'refreshing'
      ? 'Actualizando'
      : refreshStatus === 'error'
        ? 'Sin conexión'
        : `Actualizado ${formatRefreshTime(lastRefreshAt)}`;

  return (
    <section className="order-status-screen">
      <div className="order-status">
        <div className="order-status__head">
          <span className="order-status__eyebrow">
            Pedido #{order.id.slice(0, 8).toUpperCase()}
          </span>
          <h2 className="order-status__title">{statusLabel(order.status)}</h2>
          <p className="order-status__message">
            {STATUS_MESSAGES[order.status] ?? 'Estamos revisando tu pedido.'}
          </p>
        </div>
        <span
          className={`order-status__refresh order-status__refresh--${refreshStatus}`}
        >
          {refreshLabel}
        </span>

        <ol className="status-timeline" aria-label="Estado del pedido">
          {visibleStatuses.map((stepStatus, index) => {
            const state =
              index < currentStep
                ? 'done'
                : index === currentStep
                  ? 'active'
                  : 'upcoming';

            return (
              <li
                key={stepStatus}
                className={`status-timeline__item status-timeline__item--${state}`}
                aria-current={state === 'active' ? 'step' : undefined}
              >
                <span className="status-timeline__dot">{index + 1}</span>
                <span className="status-timeline__label">
                  {statusLabel(stepStatus)}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <dl className="review">
        <div>
          <dt>Cliente</dt>
          <dd>{order.customerName}</dd>
        </div>
        <div>
          <dt>Pedido</dt>
          <dd>#{order.id.slice(0, 8).toUpperCase()}</dd>
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
