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

  // The row being edited, if any — its editable copy lives in `edit` so
  // "Cancelar" can just drop it without touching `items`.
  const [editingId, setEditingId] = useState(null);
  const [edit, setEdit] = useState(null);

  // The "Nuevo ingrediente" form is collapsed behind a button instead of
  // always showing.
  const [showNewForm, setShowNewForm] = useState(false);

  function reload() {
    setLoading(true);
    api
      .adminInventory(slug)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }
  useEffect(reload, [slug]);

  function startEdit(item) {
    setEditingId(item.id);
    setEdit({ name: item.name, unit: item.unit, stockQty: String(item.stockQty), active: item.active });
  }

  function cancelEdit() {
    setEditingId(null);
    setEdit(null);
  }

  function patchEdit(field, value) {
    setEdit((e) => ({ ...e, [field]: value }));
  }

  async function saveEdit(id) {
    const updated = await api.adminInventoryUpdate(id, {
      name: edit.name,
      unit: edit.unit,
      stockQty: Number(edit.stockQty) || 0,
      active: edit.active,
    });
    setItems((rows) => rows.map((i) => (i.id === id ? updated : i)));
    cancelEdit();
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

  function closeNewForm() {
    setShowNewForm(false);
    setDraft(emptyNew);
  }

  async function remove(item) {
    if (!window.confirm(`¿Eliminar "${item.name}"?`)) return;
    await api.adminInventoryDelete(item.id);
    if (editingId === item.id) cancelEdit();
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

      {showNewForm ? (
        <form className="inv-new" onSubmit={create}>
          <input
            placeholder="Nuevo ingrediente"
            autoFocus
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
          <button type="button" className="link-button" onClick={closeNewForm}>
            Cancelar
          </button>
        </form>
      ) : (
        <div className="inv-new">
          <button type="button" className="button" onClick={() => setShowNewForm(true)}>
            + Nuevo ingrediente
          </button>
        </div>
      )}

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
                <th>Cantidad</th>
                <th>Activo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <tr
                    key={item.id}
                    className={isEditing ? 'admin-table__row--editing' : 'admin-table__row--clickable'}
                    onClick={() => {
                      if (!isEditing) startEdit(item);
                    }}
                  >
                    <td data-label="Ingrediente">
                      {isEditing ? (
                        <input
                          value={edit.name}
                          onChange={(e) => patchEdit('name', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        item.name
                      )}
                    </td>
                    <td data-label="Unidad">
                      {isEditing ? (
                        <select
                          value={edit.unit}
                          onChange={(e) => patchEdit('unit', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      ) : (
                        item.unit
                      )}
                    </td>
                    <td data-label="Cantidad">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.001"
                          value={edit.stockQty}
                          onChange={(e) => patchEdit('stockQty', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        `${item.stockQty} ${item.unit}`
                      )}
                    </td>
                    <td data-label="Activo">
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={edit.active}
                          onChange={(e) => patchEdit('active', e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        item.active ? 'Sí' : 'No'
                      )}
                    </td>
                    <td className="admin-actions" data-label="" onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <>
                          <button className="link-button" onClick={() => saveEdit(item.id)}>
                            Guardar
                          </button>
                          <button className="link-button" onClick={cancelEdit}>
                            Cancelar
                          </button>
                          <button className="link-button" onClick={() => remove(item)}>
                            Eliminar
                          </button>
                        </>
                      ) : (
                        <span className="admin-table__hint">Editar</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
