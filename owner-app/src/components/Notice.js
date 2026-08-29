// A one-line status message — the mobile counterpart of the web dashboard's
// <p className="notice">. Use variant="error" for problems.
import { StyleSheet, Text } from 'react-native';
import { colors, spacing } from '../constants/theme';

export default function Notice({ children, variant = 'default' }) {
  return (
    <Text style={[styles.base, variant === 'error' && styles.error]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.muted,
    fontSize: 14,
    paddingVertical: spacing.sm,
  },
  error: {
    color: colors.danger,
    fontWeight: '600',
  },
});
