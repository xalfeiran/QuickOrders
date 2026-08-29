// Inventory — the mobile counterpart of
// frontend/src/admin/AdminInventoryPage.jsx. Ingredients show as a plain
// read-only list; tapping one opens it for editing with its own
// Guardar/Cancelar/Eliminar actions.
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Notice from '../../components/Notice';
import Card from '../../components/Card';
import Button from '../../components/Button';
import FormField from '../../components/FormField';
import PickerField from '../../components/PickerField';
import SwitchRow from '../../components/SwitchRow';
import { api } from '../../api/client';
import { useBusinessScope } from '../../hooks/useBusinessScope';
import { colors, spacing, typography } from '../../constants/theme';

const UNITS = ['gr', 'ml', 'pza'];
const UNIT_OPTIONS = UNITS.map((u) => ({ value: u, label: u }));
const emptyDraft = { name: '', unit: 'gr', stockQty: '0' };

export default function InventoryScreen() {
  const { isSuper, businesses, slug, setSlug } = useBusinessScope();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(emptyDraft);

  // The item being edited, if any — its editable copy lives in `edit` so
  // "Cancelar" can just drop it without touching `items`.
  const [editingId, setEditingId] = useState(null);
  const [edit, setEdit] = useState(null);

  // The "Nuevo ingrediente" form is collapsed behind a button instead of
  // always showing.
  const [showNewForm, setShowNewForm] = useState(false);

  const reload = useCallback(() => {
    setLoading(true);
    api
      .adminInventory(slug)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [slug]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

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

  async function create() {
    if (draft.name.trim().length < 2) return;
    await api.adminInventoryCreate(slug, {
      name: draft.name,
      unit: draft.unit,
      stockQty: Number(draft.stockQty) || 0,
    });
    setDraft(emptyDraft);
    reload();
  }

  function closeNewForm() {
    setShowNewForm(false);
    setDraft(emptyDraft);
  }

  function confirmRemove(item) {
    Alert.alert('Eliminar ingrediente', `¿Eliminar "${item.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await api.adminInventoryDelete(item.id);
          if (editingId === item.id) cancelEdit();
          setItems((rows) => rows.filter((i) => i.id !== item.id));
        },
      },
    ]);
  }

  const businessOptions = businesses.map((b) => ({ value: b.slug, label: b.name }));

  const listHeader = (
    <View style={styles.header}>
      <Text style={typography.title}>Inventario</Text>
      {isSuper && businessOptions.length > 0 && (
        <PickerField label="Negocio" value={slug} onValueChange={setSlug} options={businessOptions} />
      )}

      {showNewForm ? (
        <Card>
          <Text style={styles.newTitle}>Nuevo ingrediente</Text>
          <FormField label="Nombre" value={draft.name} onChangeText={(v) => setDraft({ ...draft, name: v })} />
          <View style={styles.newRow}>
            <PickerField
              label="Unidad"
              value={draft.unit}
              onValueChange={(v) => setDraft({ ...draft, unit: v })}
              options={UNIT_OPTIONS}
              style={styles.newUnitField}
            />
            <FormField
              label="Stock inicial"
              value={draft.stockQty}
              onChangeText={(v) => setDraft({ ...draft, stockQty: v })}
              keyboardType="decimal-pad"
              style={styles.newStockField}
            />
          </View>
          <View style={styles.actionsRow}>
            <Button title="Agregar" onPress={create} disabled={draft.name.trim().length < 2} />
            <Button title="Cancelar" variant="link" onPress={closeNewForm} />
          </View>
        </Card>
      ) : (
        <Button
          title="+ Nuevo ingrediente"
          onPress={() => setShowNewForm(true)}
          style={styles.newFormButton}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
      {loading ? (
        <>
          {listHeader}
          <Notice>Cargando…</Notice>
        </>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={<Notice>Sin ingredientes.</Notice>}
          renderItem={({ item }) => {
            if (editingId !== item.id) {
              return (
                <Pressable onPress={() => startEdit(item)}>
                  <Card style={styles.rowCard}>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowName}>{item.name}</Text>
                      <Text style={styles.rowMeta}>
                        {item.stockQty} {item.unit} · {item.active ? 'Activo' : 'Inactivo'}
                      </Text>
                    </View>
                    <Text style={styles.rowHint}>Editar</Text>
                  </Card>
                </Pressable>
              );
            }
            return (
              <Card style={styles.editingCard}>
                <FormField label="Ingrediente" value={edit.name} onChangeText={(v) => patchEdit('name', v)} />
                <View style={styles.newRow}>
                  <PickerField
                    label="Unidad"
                    value={edit.unit}
                    onValueChange={(v) => patchEdit('unit', v)}
                    options={UNIT_OPTIONS}
                    style={styles.newUnitField}
                  />
                  <FormField
                    label="Stock"
                    value={edit.stockQty}
                    onChangeText={(v) => patchEdit('stockQty', v)}
                    keyboardType="decimal-pad"
                    style={styles.newStockField}
                  />
                </View>
                <SwitchRow label="Activo" value={edit.active} onValueChange={(v) => patchEdit('active', v)} />
                <View style={styles.actionsRow}>
                  <Button title="Guardar" onPress={() => saveEdit(item.id)} />
                  <Button title="Cancelar" variant="link" onPress={cancelEdit} />
                  <Button title="Eliminar" variant="link" onPress={() => confirmRemove(item)} />
                </View>
              </Card>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.md, paddingBottom: 0 },
  newTitle: { ...typography.muted, fontWeight: '700', marginBottom: spacing.xs },
  newRow: { flexDirection: 'row', gap: spacing.md },
  newUnitField: { flex: 1 },
  newStockField: { flex: 1 },
  listContent: { padding: spacing.md, paddingTop: 0 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  newFormButton: { marginBottom: spacing.md },

  // Read-only row.
  rowCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowInfo: { flex: 1 },
  rowName: { ...typography.body, fontWeight: '600' },
  rowMeta: { ...typography.muted, marginTop: 2 },
  rowHint: { color: colors.primary, fontWeight: '600', fontSize: 13 },

  editingCard: { borderColor: colors.primary },
});
