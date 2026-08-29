// Order detail — the mobile counterpart of
// frontend/src/admin/AdminOrderDetailPage.jsx.
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import Notice from '../../components/Notice';
import Card from '../../components/Card';
import PickerField from '../../components/PickerField';
import { api } from '../../api/client';
import { describeOptions } from '../../utils/cartLine';
import { formatPrice } from '../../utils/money';
import { ORDER_STATUSES, statusLabel } from '../../constants/orderStatus';
import { colors, spacing, typography } from '../../constants/theme';

function formatAddress(address) {
  if (!address) return '';
  const interior = address.interiorNumber ? ` int. ${address.interiorNumber}` : '';
  const references = address.references ? ` — ${address.references}` : '';
  return `${address.street} ${address.exteriorNumber}${interior}, ${address.neighborhood}, ${address.city} ${address.postalCode}${references}`;
}

export default function OrderDetailScreen({ route }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    api
      .adminOrder(orderId)
      .then((o) => {
        setOrder(o);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, [orderId]);

  async function changeStatus(status) {
    const updated = await api.adminUpdateOrderStatus(orderId, status);
    setOrder((o) => ({ ...o, status: updated.status }));
  }

  if (state === 'loading') return <Screen><Notice>Cargando…</Notice></Screen>;
  if (state === 'error') return <Screen><Notice variant="error">No encontrado.</Notice></Screen>;

  const isDelivery = order.fulfillmentType === 'delivery';

  return (
    <Screen>
      <PickerField
        label="Estado"
        value={order.status}
        onValueChange={changeStatus}
        options={ORDER_STATUSES.map((s) => ({ value: s, label: statusLabel(s) }))}
      />

      <Card>
        <Row label="Cliente" value={order.customerName} />
        <Row label="Teléfono" value={order.customerPhone} />
        <Row label="Entrega" value={isDelivery ? 'A domicilio' : 'Recoger'} />
        {isDelivery && order.deliveryAddress && (
          <Row label="Dirección" value={formatAddress(order.deliveryAddress)} />
        )}
        <Row label="Pago" value={order.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'} />
      </Card>

      <Card>
        {order.items.map((line) => (
          <View key={line.id} style={styles.lineRow}>
            <View style={styles.lineInfo}>
              <Text style={typography.body}>
                {line.quantity}× {line.name}
              </Text>
              {line.selectedOptions && line.selectedOptions.length > 0 && (
                <Text style={typography.muted}>{describeOptions(line.selectedOptions)}</Text>
              )}
            </View>
            <Text style={typography.body}>{formatPrice(line.lineTotalCents)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={typography.subtitle}>Total</Text>
          <Text style={[typography.subtitle, { color: colors.primary }]}>
            {formatPrice(order.totalCents)}
          </Text>
        </View>
      </Card>
    </Screen>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={typography.muted}>{label}</Text>
      <Text style={[typography.body, styles.rowValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: spacing.sm },
  rowValue: { marginTop: 2 },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  lineInfo: { flexShrink: 1, paddingRight: spacing.sm },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
});
