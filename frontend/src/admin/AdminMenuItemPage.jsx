import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';

const pesos = (cents) => (cents / 100).toFixed(2);
const toCents = (str) => Math.round(parseFloat(str || '0') * 100) || 0;

function emptyForm() {
  return {
    name: '',
    description: '',
    category: '',
    price: '0.00',
    available: true,
    sortOrder: '0',
    groups: [],
  };
}

// Maps a server menu item into the editable form shape.
function toForm(item) {
  return {
    name: item.name,
    description: item.description ?? '',
    category: item.category,
    price: pesos(item.priceCents),
    available: item.available,
    sortOrder: String(item.sortOrder ?? 0),
    groups: (item.optionGroups ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      required: g.required,
      min: g.min,
      max: g.max,
      options: g.options.map((o) => ({
        id: o.id,
        name: o.name,
        delta: pesos(o.priceDeltaCents),
      })),
    })),
  };
}

export default function AdminMenuItemPage() {
  const { id } = useParams();
  const isNew = !id;
  const [searchParams] = useSearchParams();
  const businessSlug = searchParams.get('businessSlug') || undefined;
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isNew) return;
    api
      .adminMenuItem(id)
      .then((item) => setForm(toForm(item)))
      .catch(() => setError('No se pudo cargar el platillo.'))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  function updateGroup(gi, patch) {
    setForm((f) => ({
      ...f,
      groups: f.groups.map((g, i) => (i === gi ? { ...g, ...patch } : g)),
    }));
  }
  function updateOption(gi, oi, patch) {
    setForm((f) => ({
      ...f,
      groups: f.groups.map((g, i) =>
        i === gi
          ? {
              ...g,
              options: g.options.map((o, j) =>
                j === oi ? { ...o, ...patch } : o,
              ),
            }
          : g,
      ),
    }));
  }
  const addGroup = () =>
    set({
      groups: [
        ...form.groups,
        { name: '', required: false, min: 0, max: 1, options: [] },
      ],
    });
  const removeGroup = (gi) =>
    set({ groups: form.groups.filter((_, i) => i !== gi) });
  const addOption = (gi) =>
    updateGroup(gi, {
      options: [...form.groups[gi].options, { name: '', delta: '0.00' }],
    });
  const removeOption = (gi, oi) =>
    updateGroup(gi, {
      options: form.groups[gi].options.filter((_, j) => j !== oi),
    });

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      priceCents: toCents(form.price),
      available: form.available,
      sortOrder: parseInt(form.sortOrder, 10) || 0,
      optionGroups: form.groups.map((g) => ({
        ...(g.id ? { id: g.id } : {}),
        name: g.name,
        required: g.required,
        min: Number(g.min) || 0,
        max: Number(g.max) || 0,
        options: g.options.map((o) => ({
          ...(o.id ? { id: o.id } : {}),
          name: o.name,
          priceDeltaCents: toCents(o.delta),
        })),
      })),
    };
    try {
      if (isNew) await api.adminMenuCreate(businessSlug, payload);
      else await api.adminMenuUpdate(id, payload);
      navigate('/admin/menu');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) return <p className="notice">Cargando…</p>;

  return (
    <section>
      <h2 className="page-title">{isNew ? 'Nuevo platillo' : 'Editar platillo'}</h2>
      <form className="form" onSubmit={save}>
        <label className="field">
          <span>Nombre</span>
          <input value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </label>
        <label className="field">
          <span>Descripción</span>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
          />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Categoría</span>
            <input
              value={form.category}
              onChange={(e) => set({ category: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Precio (MXN)</span>
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => set({ price: e.target.value })}
            />
          </label>
        </div>
        <div className="field-row">
          <label className="field">
            <span>Orden</span>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => set({ sortOrder: e.target.value })}
            />
          </label>
          <label className="field field--check">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) => set({ available: e.target.checked })}
            />
            <span>Disponible</span>
          </label>
        </div>

        <h3 className="admin-subhead">Grupos de opciones</h3>
        {form.groups.map((g, gi) => (
          <div key={gi} className="opt-group">
            <div className="field-row">
              <label className="field">
                <span>Nombre del grupo</span>
                <input
                  value={g.name}
                  onChange={(e) => updateGroup(gi, { name: e.target.value })}
                />
              </label>
              <label className="field field--check">
                <input
                  type="checkbox"
                  checked={g.required}
                  onChange={(e) =>
                    updateGroup(gi, { required: e.target.checked })
                  }
                />
                <span>Obligatorio</span>
              </label>
            </div>
            <div className="field-row">
              <label className="field">
                <span>Mín.</span>
                <input
                  type="number"
                  value={g.min}
                  onChange={(e) => updateGroup(gi, { min: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Máx.</span>
                <input
                  type="number"
                  value={g.max}
                  onChange={(e) => updateGroup(gi, { max: e.target.value })}
                />
              </label>
            </div>

            {g.options.map((o, oi) => (
              <div key={oi} className="opt-row">
                <input
                  placeholder="Opción"
                  value={o.name}
                  onChange={(e) => updateOption(gi, oi, { name: e.target.value })}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="+MXN"
                  value={o.delta}
                  onChange={(e) =>
                    updateOption(gi, oi, { delta: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="link-button"
                  onClick={() => removeOption(gi, oi)}
                >
                  ×
                </button>
              </div>
            ))}

            <div className="opt-group__actions">
              <button
                type="button"
                className="link-button"
                onClick={() => addOption(gi)}
              >
                + Opción
              </button>
              <button
                type="button"
                className="link-button"
                onClick={() => removeGroup(gi)}
              >
                Eliminar grupo
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="link-button" onClick={addGroup}>
          + Grupo de opciones
        </button>

        {error && <p className="notice notice--error">{error}</p>}

        <div className="wizard-nav">
          <button
            type="button"
            className="link-button"
            onClick={() => navigate('/admin/menu')}
            disabled={saving}
          >
            Cancelar
          </button>
          <button className="button" type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </section>
  );
}
