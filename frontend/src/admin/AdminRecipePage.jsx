import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';

// A list of {ingredientId, quantity} rows used for the base and each option.
function RecipeRows({ rows, ingredients, onChange }) {
  const update = (i, patch) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const add = () => onChange([...rows, { ingredientId: '', quantity: '' }]);
  const remove = (i) => onChange(rows.filter((_, j) => j !== i));

  return (
    <div className="recipe-rows">
      {rows.map((r, i) => (
        <div key={i} className="opt-row">
          <select
            value={r.ingredientId}
            onChange={(e) => update(i, { ingredientId: e.target.value })}
          >
            <option value="">— ingrediente —</option>
            {ingredients.map((ing) => (
              <option key={ing.id} value={ing.id}>
                {ing.name} ({ing.unit})
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.001"
            placeholder="cant."
            value={r.quantity}
            onChange={(e) => update(i, { quantity: e.target.value })}
          />
          <button type="button" className="link-button" onClick={() => remove(i)}>
            ×
          </button>
        </div>
      ))}
      <button type="button" className="link-button" onClick={add}>
        + ingrediente
      </button>
    </div>
  );
}

export default function AdminRecipePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [base, setBase] = useState([]);
  const [options, setOptions] = useState({}); // "groupId:optionId" -> rows
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const it = await api.adminMenuItem(id);
        setItem(it);
        const [ings, recipe] = await Promise.all([
          api.adminInventory(it.businessSlug),
          api.adminRecipe(id),
        ]);
        setIngredients(ings);
        setBase(
          (recipe.base ?? []).map((c) => ({
            ingredientId: c.ingredientId,
            quantity: String(c.quantity),
          })),
        );
        const opts = {};
        for (const [key, comps] of Object.entries(recipe.options ?? {})) {
          opts[key] = comps.map((c) => ({
            ingredientId: c.ingredientId,
            quantity: String(c.quantity),
          }));
        }
        setOptions(opts);
      } catch {
        setError('No se pudo cargar la receta.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const cleanRows = (rows) =>
    rows
      .filter((r) => r.ingredientId && Number(r.quantity) > 0)
      .map((r) => ({
        ingredientId: r.ingredientId,
        quantity: Number(r.quantity),
      }));

  async function save() {
    setSaving(true);
    setError(null);
    const payload = {
      base: cleanRows(base),
      options: Object.entries(options)
        .map(([key, rows]) => {
          const [groupId, optionId] = key.split(':');
          return { groupId, optionId, components: cleanRows(rows) };
        })
        .filter((o) => o.components.length > 0),
    };
    try {
      await api.adminRecipeSave(id, payload);
      navigate('/admin/menu');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) return <p className="notice">Cargando…</p>;
  if (!item) return <p className="notice">{error || 'No encontrado.'}</p>;

  return (
    <section>
      <h2 className="page-title">Receta · {item.name}</h2>

      {ingredients.length === 0 && (
        <p className="notice">
          No hay ingredientes. Crea ingredientes en Inventario primero.
        </p>
      )}

      <h3 className="admin-subhead">Base del platillo</h3>
      <RecipeRows rows={base} ingredients={ingredients} onChange={setBase} />

      {item.optionGroups.map((group) => (
        <div key={group.id} className="recipe-group">
          <h3 className="admin-subhead">Opciones · {group.name}</h3>
          {group.options.map((option) => {
            const key = `${group.id}:${option.id}`;
            return (
              <div key={key} className="recipe-opt">
                <span className="recipe-opt__name">{option.name}</span>
                <RecipeRows
                  rows={options[key] ?? []}
                  ingredients={ingredients}
                  onChange={(rows) =>
                    setOptions((o) => ({ ...o, [key]: rows }))
                  }
                />
              </div>
            );
          })}
        </div>
      ))}

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
        <button className="button" onClick={save} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar receta'}
        </button>
      </div>
    </section>
  );
}
