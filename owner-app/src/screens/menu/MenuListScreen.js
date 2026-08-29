// Menu list — the mobile counterpart of frontend/src/admin/AdminMenuPage.jsx.
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, FlatList, StyleSheet, Switch, Text, View } from 'react-native';
import Notice from '../../components/Notice';
import Card from '../../components/Card';
import Button from '../../components/Button';
import PickerField from '../../components/PickerField';
import { api } from '../../api/client';
import { useBusinessScope } from '../../hooks/useBusinessScope';
import { formatPrice } from '../../utils/money';
import { colors, spacing, typography } from '../../constants/theme';

export default function MenuListScreen({ navigation }) {
  const { isSuper, businesses, slug, setSlug } = useBusinessScope();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    api
      .adminMenu(slug)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [slug]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  async function toggleAvailable(item) {
    const updated = await api.adminMenuSetAvailability(item.id, !item.available);
    setItems((rows) => rows.map((i) => (i.id === item.id ? { ...i, available: updated.available } : i)));
  }

  function confirmRemove(item) {
    Alert.alert('Eliminar platillo', `¿Eliminar "${item.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await api.adminMenuDelete(item.id);
          setItems((rows) => rows.filter((i) => i.id !== item.id));
        },
      },
    ]);
  }

  const businessOptions = businesses.map((b) => ({ value: b.slug, label: b.name }));

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        {isSuper && businessOptions.length > 0 && (
          <PickerField label="Negocio" value={slug} onValueChange={setSlug} options={businessOptions} />
        )}
        <Button
          title="+ Nuevo platillo"
          onPress={() => navigation.navigate('MenuItemForm', { businessSlug: slug })}
        />
      </View>

      {loading ? (
        <Notice>Cargando menú…</Notice>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Notice>Sin platillos. Crea el primero.</Notice>}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.rowBetween}>
                <View style={styles.grow}>
                  <Text style={typography.subtitle}>{item.name}</Text>
                  <Text style={typography.muted}>{item.category}</Text>
                  {item.optionGroups.length > 0 && (
                    <Text style={typography.muted}>{item.optionGroups.length} grupo(s) de opciones</Text>
                  )}
                </View>
                <View style={styles.priceCol}>
                  <Text style={[typography.subtitle, { color: colors.primary }]}>
                    {formatPrice(item.priceCents)}
                  </Text>
                  <Switch
                    value={item.available}
                    onValueChange={() => toggleAvailable(item)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#fff"
                  />
                </View>
              </View>
              <View style={styles.actionsRow}>
                <Button
                  title="Editar"
                  variant="link"
                  onPress={() => navigation.navigate('MenuItemForm', { itemId: item.id })}
                />
                <Button
                  title="Receta"
                  variant="link"
                  onPress={() => navigation.navigate('Recipe', { itemId: item.id })}
                />
                <Button title="Eliminar" variant="link" onPress={() => confirmRemove(item)} />
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.md, paddingBottom: 0 },
  listContent: { padding: spacing.md, paddingTop: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  grow: { flexShrink: 1, paddingRight: spacing.sm },
  priceCol: { alignItems: 'flex-end' },
  actionsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
});
