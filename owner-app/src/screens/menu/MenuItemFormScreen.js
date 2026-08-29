// Create/edit a menu item, including its option groups — the mobile
// counterpart of frontend/src/admin/AdminMenuItemPage.jsx.
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import Notice from '../../components/Notice';
import Card from '../../components/Card';
import Button from '../../components/Button';
import FormField from '../../components/FormField';
import SwitchRow from '../../components/SwitchRow';
import { api } from '../../api/client';
import { centsToPesos, pesosToCents } from '../../utils/money';
import { colors, spacing, typography } from '../../constants/theme';

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
    price: centsToPesos(item.priceCents),
    available: item.available,
    sortOrder: String(item.sortOrder ?? 0),
    groups: (item.optionGroups ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      required: g.required,
      min: String(g.min),
      max: String(g.max),
      options: g.options.map((o) => ({
        id: o.id,
        name: o.name,
        delta: centsToPesos(o.priceDeltaCents),
      })),
    })),
  };
}

export default function MenuItemFormScreen({ route, navigation }) {
  const itemId = route.params?.itemId;
  const businessSlug = route.params?.businessSlug;
  const isNew = !itemId;

  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isNew) return;
    api
      .adminMenuItem(itemId)
      .then((item) => setForm(toForm(item)))
      .catch(() => setError('No se pudo cargar el platillo.'))
      .finally(() => setLoading(false));
  }, [itemId, isNew]);

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
        i === gi ? { ...g, options: g.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) } : g,
      ),
    }));
  }
  const addGroup = () =>
    set({ groups: [...form.groups, { name: '', required: false, min: '0', max: '1', options: [] }] });
  const removeGroup = (gi) => set({ groups: form.groups.filter((_, i) => i !== gi) });
  const addOption = (gi) =>
    updateGroup(gi, { options: [...form.groups[gi].options, { name: '', delta: '0.00' }] });
  const removeOption = (gi, oi) =>
    updateGroup(gi, { options: form.groups[gi].options.filter((_, j) => j !== oi) });

  async function save() {
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      priceCents: pesosToCents(form.price),
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
          priceDeltaCents: pesosToCents(o.delta),
        })),
      })),
    };
    try {
      if (isNew) await api.adminMenuCreate(businessSlug, payload);
      else await api.adminMenuUpdate(itemId, payload);
      navigation.goBack();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) return <Screen><Notice>Cargando…</Notice></Screen>;

  return (
    <Screen>
      <FormField label="Nombre" value={form.name} onChangeText={(v) => set({ name: v })} />
      <FormField
        label="Descripción"
        value={form.description}
        onChangeText={(v) => set({ description: v })}
        multiline
      />
      <FormField label="Categoría" value={form.category} onChangeText={(v) => set({ category: v })} />
      <FormField
        label="Precio (MXN)"
        value={form.price}
        onChangeText={(v) => set({ price: v })}
        keyboardType="decimal-pad"
      />
      <FormField
        label="Orden"
        value={form.sortOrder}
        onChangeText={(v) => set({ sortOrder: v })}
        keyboardType="number-pad"
      />
      <SwitchRow label="Disponible" value={form.available} onValueChange={(v) => set({ available: v })} />

      <Text style={styles.sectionTitle}>Grupos de opciones</Text>
      {form.groups.map((group, gi) => (
        <Card key={gi} style={styles.groupCard}>
          <FormField label="Nombre del grupo" value={group.name} onChangeText={(v) => updateGroup(gi, { name: v })} />
          <SwitchRow
            label="Obligatorio"
            value={group.required}
            onValueChange={(v) => updateGroup(gi, { required: v })}
          />
          <View style={styles.minMaxRow}>
            <FormField
              label="Mín."
              value={group.min}
              onChangeText={(v) => updateGroup(gi, { min: v })}
              keyboardType="number-pad"
              style={styles.minMaxField}
            />
            <FormField
              label="Máx."
              value={group.max}
              onChangeText={(v) => updateGroup(gi, { max: v })}
              keyboardType="number-pad"
              style={styles.minMaxField}
            />
          </View>

          {group.options.map((option, oi) => (
            <View key={oi} style={styles.optionRow}>
              <FormField
                value={option.name}
                onChangeText={(v) => updateOption(gi, oi, { name: v })}
                placeholder="Opción"
                style={styles.optionNameField}
              />
              <FormField
                value={option.delta}
                onChangeText={(v) => updateOption(gi, oi, { delta: v })}
                placeholder="+MXN"
                keyboardType="decimal-pad"
                style={styles.optionDeltaField}
              />
              <Button title="×" variant="link" onPress={() => removeOption(gi, oi)} />
            </View>
          ))}

          <View style={styles.groupActions}>
            <Button title="+ Opción" variant="link" onPress={() => addOption(gi)} />
            <Button title="Eliminar grupo" variant="link" onPress={() => removeGroup(gi)} />
          </View>
        </Card>
      ))}
      <Button title="+ Grupo de opciones" variant="link" onPress={addGroup} style={styles.addGroupButton} />

      {error ? <Notice variant="error">{error}</Notice> : null}

      <View style={styles.saveRow}>
        <Button title="Cancelar" variant="link" onPress={() => navigation.goBack()} disabled={saving} />
        <Button title={saving ? 'Guardando…' : 'Guardar'} onPress={save} busy={saving} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...typography.subtitle, marginTop: spacing.sm, marginBottom: spacing.sm },
  groupCard: { backgroundColor: colors.background },
  minMaxRow: { flexDirection: 'row', gap: spacing.md },
  minMaxField: { flex: 1 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  optionNameField: { flex: 2 },
  optionDeltaField: { flex: 1 },
  groupActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  addGroupButton: { marginBottom: spacing.md },
  saveRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.md },
});
