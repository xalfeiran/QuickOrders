// A labeled on/off toggle — the mobile counterpart of the web dashboard's
// checkbox fields (Disponible, Activo, Obligatorio, etc.).
import { StyleSheet, Switch, Text, View } from 'react-native';
import { colors, spacing } from '../constants/theme';

export default function SwitchRow({ label, value, onValueChange }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  label: { fontSize: 15, color: colors.text, flexShrink: 1, marginRight: spacing.sm },
});
