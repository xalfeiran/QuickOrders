import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';

// Same fixed unit choices as Inventario (frontend/src/admin/AdminInventoryPage.jsx).
const UNITS = ['gr', 'ml', 'pza'];

// One section of a recipe (the dish's base, or one option): the ingredients
// already added show as clickable chips, and a small form underneath adds a
// new one or edits whichever chip was clicked. Typing in the box filters a
// dropdown of matching ingredients — pick one (or just finish typing its
// exact name) and enter a quantity. If the name doesn't match anything in
// Inventario, a unit picker appears so a brand-new ingredient can be created
// right here — it's added to Inventario too, so it shows up next time.
function RecipeRows({ rows, ingredients, onChange, onCreateIngredient }) {
  const [text, setText] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState(UNITS[0]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const inputRef = useRef(null);

  const findIngredient = (id) => ingredients.find((ing) => ing.id === id);

  // The ingredient the typed text currently refers to, if any — matched by
  // exact name so both "clicked a suggestion" and "typed the full name"
  // resolve the same way. No match means this is a new ingredient.
  const matchedIngredient =
    ingredients.find((ing) => ing.name.trim().toLowerCase() === text.trim().toLowerCase()) ??
    null;

  const suggestions =
    showSuggestions && text.trim()
      ? ingredients
          .filter((ing) => ing.name.toLowerCase().includes(text.trim().toLowerCase()))
          .slice(0, 6)
      : [];

  const resetForm = () => {
    setText('');
    setQuantity('');
    setUnit(UNITS[0]);
    setEditingIndex(null);
    setShowSuggestions(false);
    setCreateError(null);
  };

  const pickSuggestion = (ing) => {
    setText(ing.name);
    setShowSuggestions(false);
  };

  const editRow = (i) => {
    const row = rows[i];
    const ing = findIngredient(row.ingredientId);
    setText(ing ? ing.name : '');
    setQuantity(row.quantity);
    setUnit(ing ? ing.unit : UNITS[0]);
    setEditingIndex(i);
    setShowSuggestions(false);
    setCreateError(null);
    inputRef.current?.focus();
  };

  const removeRow = (i, e) => {
    e.stopPropagation();
    onChange(rows.filter((_, j) => j !== i));
    if (editingIndex === i) resetForm();
  };

  const save = async () => {
    if (!text.trim() || !(Number(quantity) > 0) || creating) return;
    setCreateError(null);

    let ingredientId = matchedIngredient?.id ?? null;
    if (!ingredientId) {
      setCreating(true);
      try {
        const created = await onCreateIngredient(text.trim(), unit);
        ingredientId = created.id;
      } catch (err) {
        setCreateError(err.message || 'No se pudo crear el ingrediente.');
        setCreating(false);
        return;
      }
      setCreating(false);
    }

    const newRow = { ingredientId, quantity };
    // Editing the chip that was clicked, or landing on an ingredient that's
    // already in the list some other way: either way, update that row
    // instead of creating a duplicate.
    const targetIndex = editingIndex ?? rows.findIndex((r) => r.ingredientId === ingredientId);
    onChange(
      targetIndex === -1
        ? [...rows, newRow]
        : rows.map((r, j) => (j === targetIndex ? newRow : r)),
    );
    resetForm();
  };

  return (
    <div className="recipe-rows">
      {rows.length > 0 && (
        <div className="recipe-chips">
          {rows.map((r, i) => {
            const ing = findIngredient(r.ingredientId);
            return (
              <button
                type="button"
                key={r.ingredientId || i}
                className={`recipe-chip${editingIndex === i ? ' recipe-chip--active' : ''}`}
                onClick={() => editRow(i)}
              >
                {ing ? `${ing.name} — ${r.quantity} ${ing.unit}` : '(ingrediente eliminado)'}
                <span className="recipe-chip__remove" onClick={(e) => removeRow(i, e)}>
                  ×
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="recipe-add">
        <div className="recipe-add__field">
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar o crear ingrediente…"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />
          {suggestions.length > 0 && (
            <ul className="recipe-suggestions">
              {suggestions.map((ing) => (
                <li key={ing.id}>
                  <button type="button" onMouseDown={() => pickSuggestion(ing)}>
                    {ing.name} <span className="recipe-suggestion__unit">({ing.unit})</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <input
          type="number"
          step="0.001"
          placeholder={matchedIngredient ? `cant. (${matchedIngredient.unit})` : 'cant.'}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        {text.trim() && !matchedIngredient && (
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            title="Unidad del ingrediente nuevo"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          className="button"
          disabled={!text.trim() || !(Number(quantity) > 0) || creating}
          onClick={save}
        >
          {creating ? 'Creando…' : editingIndex !== null ? 'Actualizar' : 'Agregar'}
        </button>
        {editingIndex !== null && (
          <button type="button" className="link-button" onClick={resetForm} disabled={creating}>
            Cancelar
          </button>
        )}
      </div>
      {text.trim() && !matchedIngredient && (
        <p className="recipe-add__hint">Ingrediente nuevo — se agregará a Inventario.</p>
      )}
      {createError && <p className="notice notice--error">{createError}</p>}
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

  // Creates a new ingredient in Inventario and adds it to the ingredients
  // list shared by every RecipeRows section, so it's available immediately
  // (in the base, and in every option group) without a page reload.
  async function createIngredient(name, unit) {
    const created = await api.adminInventoryCreate(item.businessSlug, {
      name,
      unit,
      stockQty: 0,
    });
    setIngredients((prev) => [...prev, created]);
    return created;
  }

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
          Aún no tienes ingredientes. Escribe el nombre en el campo de abajo para crear el
          primero.
        </p>
      )}

      <h3 className="admin-subhead">Base del platillo</h3>
      <RecipeRows
        rows={base}
        ingredients={ingredients}
        onChange={setBase}
        onCreateIngredient={createIngredient}
      />

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
                  onCreateIngredient={createIngredient}
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
