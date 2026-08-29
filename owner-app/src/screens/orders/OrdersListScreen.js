// Orders list — the mobile counterpart of frontend/src/admin/AdminOrdersPage.jsx.
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Notice from '../../components/Notice';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import PickerField from '../../components/PickerField';
import { api } from '../../api/client';
import { useBusinessScope } from '../../hooks/useBusinessScope';
import { ORDER_STATUSES, statusLabel } from '../../constants/orderStatus';
import { formatPrice } from '../../utils/money';
import { colors, spacing, typography } from '../../constants/theme';

function formatTime(iso) {
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrdersListScreen({ navigation }) {
  const { isSuper, businesses, slug, setSlug } = useBusinessScope();
  const [statusFilter, setStatusFilter] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      try {
        const rows = await api.adminOrders(slug, statusFilter);
        setOrders(rows);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [slug, statusFilter],
  );

  // Reload every time the tab regains focus, e.g. after changing a status
  // from the detail screen and coming back.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function changeStatus(id, status) {
    await api.adminUpdateOrderStatus(id, status);
    setOrders((rows) => rows.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  const statusOptions = [{ value: '', label: 'Todos' }, ...ORDER_STATUSES.map((s) => ({ value: s, label: statusLabel(s) }))];
  const businessOptions = businesses.map((b) => ({ value: b.slug, label: b.name }));

  return (
    <View style={styles.flex}>
      <View style={styles.filters}>
        {isSuper && businessOptions.length > 0 && (
          <PickerField label="Negocio" value={slug} onValueChange={setSlug} options={businessOptions} style={styles.filterField} />
        )}
        <PickerField label="Estado" value={statusFilter} onValueChange={setStatusFilter} options={statusOptions} style={styles.filterField} />
      </View>

      {loading ? (
        <Notice>Cargando pedidos…</Notice>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          ListEmptyComponent={<Notice>No hay pedidos.</Notice>}
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
              <Card>
                <View style={styles.rowBetween}>
                  <Text style={styles.customerName}>{item.customerName}</Text>
                  <Text style={styles.total}>{formatPrice(item.totalCents)}</Text>
                </View>
                <Text style={typography.muted}>{item.customerPhone}</Text>
                <View style={[styles.rowBetween, styles.metaRow]}>
                  <Text style={typography.muted}>
                    {item.fulfillmentType === 'delivery' ? 'Domicilio' : 'Recoger'} · {item.itemCount} art. · {formatTime(item.createdAt)}
                  </Text>
                  <StatusBadge status={item.status} />
                </View>
                <PickerField
                  value={item.status}
                  onValueChange={(value) => changeStatus(item.id, value)}
                  options={ORDER_STATUSES.map((s) => ({ value: s, label: statusLabel(s) }))}
                  style={styles.statusPicker}
                />
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  filters: { padding: spacing.md, paddingBottom: 0 },
  filterField: { marginBottom: spacing.sm },
  listContent: { padding: spacing.md, paddingTop: 0 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaRow: { marginTop: spacing.xs, marginBottom: spacing.xs },
  customerName: { ...typography.subtitle },
  total: { ...typography.subtitle, color: colors.primary },
  statusPicker: { marginBottom: 0, marginTop: spacing.xs },
});
