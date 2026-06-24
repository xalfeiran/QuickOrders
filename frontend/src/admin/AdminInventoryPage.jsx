import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAdminBusiness } from './useAdminBusiness.js';

const UNITS = ['gr', 'ml', 'pza'];
const emptyNew = { name: '', unit: 'gr', stockQty: '0' };

export default function AdminInventoryPage() {
  const { isSuper, businesses, slug, setSlug } = useAdminBusiness();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(emptyNew);

  function reload() {
    setLoading(true);
    api
      .adminInventory(slug)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }
  useEffect(reload, [slug]);

  async function save(item) {
    const updated = await api.adminInventoryUpdate(item.id, {
      name: item.name,
      unit: item.unit,
      stockQty: Number(item.stockQty) || 0,
      active: item.active,
    });
    setItems((rows) => rows.map((i) => (i.id === item.id ? updated : i)));
  }

  function patch(id, field, value) {
    setItems((rows) =>
      rows.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    );
  }

  async function create(e) {
    e.preventDefault();
    if (draft.name.trim().length < 2) return;
    await api.adminInventoryCreate(slug, {
      name: draft.name,
      unit: draft.unit,
      stockQty: Number(draft.stockQty) || 0,
    });
    setDraft(emptyNew);
    reload();
  }

  async function remove(item) {
    if (!window.confirm(`¿Eliminar "${item.name}"?`)) return;
    await api.adminInventoryDelete(item.id);
    setItems((rows) => rows.filter((i) => i.id !== item.id));
  }

  return (
    <section>
      <h2 className="page-title">Inventario</h2>

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

      <form className="inv-new" onSubmit={create}>
        <input
          placeholder="Nuevo ingrediente"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <select
          value={draft.unit}
          onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.001"
          value={draft.stockQty}
          onChange={(e) => setDraft({ ...draft, stockQty: e.target.value })}
        />
        <button className="button" type="submit">
          Agregar
        </button>
      </form>

      {loading ? (
        <p className="notice">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="notice">Sin ingredientes.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ingrediente</th>
                <th>Unidad</th>
                <th>Stock</th>
                <th>Activo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td data-label="Ingrediente">
                    <input
                      value={item.name}
                      onChange={(e) => patch(item.id, 'name', e.target.value)}
                    />
                  </td>
                  <td data-label="Unidad">
                    <select
                      value={item.unit}
                      onChange={(e) => patch(item.id, 'unit', e.target.value)}
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td data-label="Stock">
                    <input
                      type="number"
                      step="0.001"
                      value={item.stockQty}
                      onChange={(e) =>
                        patch(item.id, 'stockQty', e.target.value)
                      }
                    />
                  </td>
                  <td data-label="Activo">
                    <input
                      type="checkbox"
                      checked={item.active}
                      onChange={(e) => patch(item.id, 'active', e.target.checked)}
                    />
                  </td>
                  <td className="admin-actions" data-label="">
                    <button className="link-button" onClick={() => save(item)}>
                      Guardar
                    </button>
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
