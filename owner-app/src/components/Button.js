// Three button styles used throughout the dashboard:
//   variant="primary" — the solid call-to-action button ("button" in the web CSS)
//   variant="danger"  — a solid destructive action (logout, permanent deletes)
//   variant="link"    — a plain text action ("link-button" in the web CSS)
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  busy = false,
  style,
}) {
  const isLink = variant === 'link';
  const isDanger = variant === 'danger';
  const spinnerColor = isLink ? colors.primary : '#fff';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        isLink ? styles.linkBase : styles.solidBase,
        isDanger && styles.dangerSolid,
        (disabled || busy) && styles.disabled,
        pressed && !isLink && styles.pressed,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <Text style={isLink ? styles.linkText : styles.solidText}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  solidBase: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerSolid: { backgroundColor: colors.danger },
  solidText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  linkBase: { paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
  linkText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
