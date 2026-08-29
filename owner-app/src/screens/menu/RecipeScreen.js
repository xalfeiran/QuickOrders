// Recipe editor for one menu item: which ingredients its base and each
// option consume — the mobile counterpart of
// frontend/src/admin/AdminRecipePage.jsx.
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Screen from '../../components/Screen';
import Notice from '../../components/Notice';
import Card from '../../components/Card';
import Button from '../../components/Button';
import FormField from '../../components/FormField';
import PickerField from '../../components/PickerField';
import { api } from '../../api/client';
import { colors, radius, spacing, typography } from '../../constants/theme';

// Same fixed unit choices as Inventario (owner-app/src/screens/inventory/InventoryScreen.js).
const UNITS = ['gr', 'ml', 'pza'];
const UNIT_OPTIONS = UNITS.map((u) => ({ value: u, label: u }));

// One section of a recipe (the dish's base, or one option): the ingredients
// already added show as tappable chips, and a small form underneath adds a
// new one or edits whichever chip was tapped. Typing in the box filters a
// list of matching ingredients — tap one (or just finish typing its exact
// name) and enter a quantity. If the name doesn't match anything in
// Inventario, a unit picker appears so a brand-new ingredient can be created
// right here — it's added to Inventario too, so it shows up next time.
function RecipeRows({ rows, ingredients, onChange, onCreateIngredient }) {
  const [text, setText] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState(UNITS[0]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [focused, setFocused] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const findIngredient = (id) => ingredients.find((ing) => ing.id === id);

  // The ingredient the typed text currently refers to, if any — matched by
  // exact name so both "tapped a suggestion" and "typed the full name"
  // resolve the same way. No match means this is a new ingredient.
  const matchedIngredient =
    ingredients.find((ing) => ing.name.trim().toLowerCase() === text.trim().toLowerCase()) ??
    null;

  const suggestions =
    focused && text.trim()
      ? ingredients
          .filter((ing) => ing.name.toLowerCase().includes(text.trim().toLowerCase()))
          .slice(0, 6)
      : [];

  const resetForm = () => {
    setText('');
    setQuantity('');
    setUnit(UNITS[0]);
    setEditingIndex(null);
    setCreateError(null);
  };

  const pickSuggestion = (ing) => {
    setText(ing.name);
    setFocused(false);
  };

  const editRow = (i) => {
    const row = rows[i];
    const ing = findIngredient(row.ingredientId);
    setText(ing ? ing.name : '');
    setQuantity(row.quantity);
    setUnit(ing ? ing.unit : UNITS[0]);
    setEditingIndex(i);
    setCreateError(null);
  };

  const removeRow = (i) => {
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
    // Editing the chip that was tapped, or landing on an ingredient that's
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

  const isNew = text.trim().length > 0 && !matchedIngredient;

  return (
    <View>
      {rows.length > 0 && (
        <View style={styles.chipList}>
          {rows.map((r, i) => {
            const ing = findIngredient(r.ingredientId);
            return (
              <View key={r.ingredientId || i} style={styles.chipRow}>
                <Pressable
                  style={[styles.chip, editingIndex === i && styles.chipActive]}
                  onPress={() => editRow(i)}
                >
                  <Text style={styles.chipText}>
                    {ing ? `${ing.name} — ${r.quantity} ${ing.unit}` : '(ingrediente eliminado)'}
                  </Text>
                </Pressable>
                <Pressable style={styles.chipRemove} onPress={() => removeRow(i)}>
                  <Text style={styles.chipRemoveText}>×</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.addField}>
        <TextInput
          value={text}
          onChangeText={(v) => {
            setText(v);
            setFocused(true);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Buscar o crear ingrediente…"
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          style={styles.input}
        />
        {suggestions.length > 0 && (
          <View style={styles.suggestions}>
            {suggestions.map((ing) => (
              <Pressable
                key={ing.id}
                onPress={() => pickSuggestion(ing)}
                style={styles.suggestionItem}
              >
                <Text style={styles.suggestionText}>
                  {ing.name} <Text style={styles.suggestionUnit}>({ing.unit})</Text>
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.addRow}>
        <FormField
          value={quantity}
          onChangeText={setQuantity}
          placeholder={matchedIngredient ? `cant. (${matchedIngredient.unit})` : 'cant.'}
          keyboardType="decimal-pad"
          style={styles.addQty}
        />
        {isNew && (
          <PickerField
            value={unit}
            onValueChange={setUnit}
            options={UNIT_OPTIONS}
            style={styles.addUnit}
          />
        )}
      </View>
      {isNew && <Text style={styles.newHint}>Ingrediente nuevo — se agregará a Inventario.</Text>}
      {createError ? <Notice variant="error">{createError}</Notice> : null}

      <View style={styles.saveActionsRow}>
        <Button
          title={creating ? 'Creando…' : editingIndex !== null ? 'Actualizar' : 'Agregar'}
          onPress={save}
          disabled={!text.trim() || !(Number(quantity) > 0) || creating}
          busy={creating}
        />
        {editingIndex !== null && (
          <Button title="Cancelar" variant="link" onPress={resetForm} disabled={creating} />
        )}
      </View>
    </View>
  );
}

export default function RecipeScreen({ route, navigation }) {
  const { itemId } = route.params;
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
        const loadedItem = await api.adminMenuItem(itemId);
        setItem(loadedItem);
        const [ings, recipe] = await Promise.all([
          api.adminInventory(loadedItem.businessSlug),
          api.adminRecipe(itemId),
        ]);
        setIngredients(ings);
        setBase((recipe.base ?? []).map((c) => ({ ingredientId: c.ingredientId, quantity: String(c.quantity) })));
        const opts = {};
        for (const [key, comps] of Object.entries(recipe.options ?? {})) {
          opts[key] = comps.map((c) => ({ ingredientId: c.ingredientId, quantity: String(c.quantity) }));
        }
        setOptions(opts);
      } catch {
        setError('No se pudo cargar la receta.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [itemId]);

  // Creates a new ingredient in Inventario and adds it to the ingredients
  // list shared by every RecipeRows section, so it's available immediately
  // (in the base, and in every option group) without leaving this screen.
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
      .map((r) => ({ ingredientId: r.ingredientId, quantity: Number(r.quantity) }));

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
      await api.adminRecipeSave(itemId, payload);
      navigation.goBack();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) return <Screen><Notice>Cargando…</Notice></Screen>;
  if (!item) return <Screen><Notice variant="error">{error || 'No encontrado.'}</Notice></Screen>;

  return (
    <Screen>
      {ingredients.length === 0 && (
        <Notice>Aún no tienes ingredientes. Escribe el nombre abajo para crear el primero.</Notice>
      )}

      <Text style={styles.sectionTitle}>Base del platillo</Text>
      <Card>
        <RecipeRows rows={base} ingredients={ingredients} onChange={setBase} onCreateIngredient={createIngredient} />
      </Card>

      {item.optionGroups.map((group) => (
        <View key={group.id}>
          <Text style={styles.sectionTitle}>Opciones · {group.name}</Text>
          {group.options.map((option) => {
            const key = `${group.id}:${option.id}`;
            return (
              <Card key={key}>
                <Text style={styles.optionName}>{option.name}</Text>
                <RecipeRows
                  rows={options[key] ?? []}
                  ingredients={ingredients}
                  onChange={(rows) => setOptions((o) => ({ ...o, [key]: rows }))}
                  onCreateIngredient={createIngredient}
                />
              </Card>
            );
          })}
        </View>
      ))}

      {error ? <Notice variant="error">{error}</Notice> : null}

      <View style={styles.saveRow}>
        <Button title="Cancelar" variant="link" onPress={() => navigation.goBack()} disabled={saving} />
        <Button title={saving ? 'Guardando…' : 'Guardar receta'} onPress={save} busy={saving} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...typography.subtitle, marginTop: spacing.sm, marginBottom: spacing.sm },
  optionName: { ...typography.body, fontWeight: '700', marginBottom: spacing.xs },
  saveRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.md },

  // Chips for ingredients already added to this section.
  chipList: { marginBottom: spacing.sm, gap: spacing.xs },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: '#fbeceb' },
  chipText: { ...typography.body, fontSize: 14 },
  chipRemove: { padding: spacing.xs },
  chipRemoveText: { color: colors.muted, fontWeight: '700', fontSize: 16 },

  // Ingredient name field with its autocomplete dropdown.
  addField: { position: 'relative', zIndex: 1, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    maxHeight: 220,
    overflow: 'hidden',
    zIndex: 10,
    elevation: 6,
  },
  suggestionItem: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
  suggestionText: { ...typography.body, fontSize: 14 },
  suggestionUnit: { color: colors.muted, fontSize: 13 },

  // Quantity + unit (only shown for a new ingredient), next to each other.
  addRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  addQty: { flex: 1, marginBottom: 0 },
  addUnit: { flex: 1, marginBottom: 0 },
  newHint: { ...typography.muted, marginBottom: spacing.sm },

  saveActionsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
