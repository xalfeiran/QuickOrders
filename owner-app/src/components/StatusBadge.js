// A small colored pill showing an order's status.
import { StyleSheet, Text, View } from 'react-native';
import { STATUS_COLORS, statusLabel } from '../constants/orderStatus';

export default function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] ?? '#6b7280';
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{statusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  text: { fontSize: 12, fontWeight: '700' },
});
