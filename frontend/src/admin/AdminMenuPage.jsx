import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { formatPrice } from '../utils/money.js';
import { useAdminBusiness } from './useAdminBusiness.js';

export default function AdminMenuPage() {
  const { isSuper, businesses, slug, setSlug } = useAdminBusiness();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    api
      .adminMenu(slug)
      .then((rows) => setItems(rows))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(reload, [slug]);

  async function toggle(item) {
    const updated = await api.adminMenuSetAvailability(item.id, !item.available);
    setItems((rows) =>
      rows.map((i) => (i.id === item.id ? { ...i, available: updated.available } : i)),
    );
  }

  async function remove(item) {
    if (!window.confirm(`¿Eliminar "${item.name}"?`)) return;
    await api.adminMenuDelete(item.id);
    setItems((rows) => rows.filter((i) => i.id !== item.id));
  }

  const newHref = `/admin/menu/new${slug ? `?businessSlug=${slug}` : ''}`;

  return (
    <section>
      <div className="admin-pagehead">
        <h2 className="page-title">Menú</h2>
        <Link className="button" to={newHref}>
          Nuevo platillo
        </Link>
      </div>

      {isSuper && (
        <div className="admin-filters">
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
        </div>
      )}

      {loading ? (
        <p className="notice">Cargando menú…</p>
      ) : items.length === 0 ? (
        <p className="notice">Sin platillos. Crea el primero.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Platillo</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Disponible</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td data-label="Platillo">
                    {item.name}
                    {item.optionGroups.length > 0 && (
                      <>
                        <br />
                        <span className="admin-muted">
                          {item.optionGroups.length} grupo(s) de opciones
                        </span>
                      </>
                    )}
                  </td>
                  <td data-label="Categoría">{item.category}</td>
                  <td data-label="Precio">{formatPrice(item.priceCents)}</td>
                  <td data-label="Disponible">
                    <input
                      type="checkbox"
                      checked={item.available}
                      onChange={() => toggle(item)}
                    />
                  </td>
                  <td className="admin-actions" data-label="">
                    <Link className="link-button" to={`/admin/menu/${item.id}`}>
                      Editar
                    </Link>
                    <Link
                      className="link-button"
                      to={`/admin/menu/${item.id}/recipe`}
                    >
                      Receta
                    </Link>
                    <button className="link-button" onClick={() => remove(item)}>
                      Eliminar
                    </button>
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
