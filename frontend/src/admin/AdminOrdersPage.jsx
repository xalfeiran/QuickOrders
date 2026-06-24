import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { formatPrice } from '../utils/money.js';
import { useAdminAuth } from './AdminAuthContext.jsx';
import { ORDER_STATUSES, statusLabel } from './orderStatus.js';

function formatTime(iso) {
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminOrdersPage() {
  const { user } = useAdminAuth();
  const isSuper = user.role === 'superadmin';

  const [businesses, setBusinesses] = useState([]);
  const [slug, setSlug] = useState(isSuper ? '' : user.businessSlug);
  const [statusFilter, setStatusFilter] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Superadmin: load the business switcher and default to the first one.
  useEffect(() => {
    if (!isSuper) return;
    api.adminBusinesses().then((list) => {
      setBusinesses(list);
      if (list.length > 0) setSlug((s) => s || list[0].slug);
    });
  }, [isSuper]);

  useEffect(() => {
    setLoading(true);
    api
      .adminOrders(slug, statusFilter)
      .then((rows) => setOrders(rows))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [slug, statusFilter]);

  async function changeStatus(id, status) {
    await api.adminUpdateOrderStatus(id, status);
    setOrders((rows) =>
      rows.map((o) => (o.id === id ? { ...o, status } : o)),
    );
  }

  return (
    <section>
      <h2 className="page-title">Pedidos</h2>

      <div className="admin-filters">
        {isSuper && (
          <label className="field">
            <span>Negocio</span>
            <select value={slug} onChange={(e) => setSlug(e.target.value)}>
              {businesses.map((b) => (
                <option key={b.id} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="field">
          <span>Estado</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="notice">Cargando pedidos…</p>
      ) : orders.length === 0 ? (
        <p className="notice">No hay pedidos.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Entrega</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td data-label="Fecha">{formatTime(o.createdAt)}</td>
                  <td data-label="Cliente">
                    {o.customerName}
                    <br />
                    <span className="admin-muted">{o.customerPhone}</span>
                  </td>
                  <td data-label="Entrega">
                    {o.fulfillmentType === 'delivery' ? 'Domicilio' : 'Recoger'}
                  </td>
                  <td data-label="Total">{formatPrice(o.totalCents)}</td>
                  <td data-label="Estado">
                    <select
                      value={o.status}
                      onChange={(e) => changeStatus(o.id, e.target.value)}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {statusLabel(s)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td data-label="">
                    <Link className="link-button" to={`/admin/orders/${o.id}`}>
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
