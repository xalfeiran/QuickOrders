// A tappable field that opens a modal listing the given options — the
// mobile counterpart of the web dashboard's <select>. Used for business
// selectors, status filters, and the ingredient unit picker.
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';

export default function PickerField({ label, value, onValueChange, options, style }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  const choose = (option) => {
    onValueChange(option.value);
    setOpen(false);
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={styles.fieldText} numberOfLines={1}>
          {selected ? selected.label : 'Seleccionar…'}
        </Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* An inner Pressable with no-op onPress swallows taps inside the
              sheet so they don't fall through to the backdrop and close it. */}
          <Pressable style={styles.sheet} onPress={() => {}}>
            {label ? <Text style={styles.sheetTitle}>{label}</Text> : null}
            <ScrollView style={styles.optionList} keyboardShouldPersistTaps="handled">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => choose(option)}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {option.label}
                    </Text>
                    {isSelected && <Text style={styles.check}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable style={styles.cancelButton} onPress={() => setOpen(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { ...typography.muted, marginBottom: spacing.xs, fontWeight: '600' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  fieldText: { fontSize: 15, color: colors.text, flex: 1 },
  chevron: { color: colors.muted, fontSize: 14, marginLeft: spacing.xs },

  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    maxHeight: '70%',
  },
  sheetTitle: { ...typography.subtitle, marginBottom: spacing.sm },
  optionList: { flexGrow: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionSelected: { backgroundColor: colors.background },
  optionText: { ...typography.body },
  optionTextSelected: { fontWeight: '700', color: colors.primary },
  check: { color: colors.primary, fontWeight: '700' },
  cancelButton: { paddingVertical: spacing.sm + 2, alignItems: 'center', marginTop: spacing.xs },
  cancelText: { color: colors.muted, fontWeight: '600', fontSize: 15 },
});
