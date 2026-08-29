// A simple page wrapper: safe-area aware, scrollable, consistent padding.
// Most screens render <Screen><...content/></Screen> instead of repeating
// this boilerplate everywhere.
//
// `topInset`: screens hosted inside a native-stack navigator already get
// their top safe-area reserved by that stack's header, so they leave this
// false (the default). A screen mounted directly on a tab with no header of
// its own (e.g. the Ajustes/Enlaces tabs) needs `topInset` so its content
// doesn't render under the status bar/notch.
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../constants/theme';

export default function Screen({ children, scroll = true, footer = null, topInset = false }) {
  const Container = scroll ? ScrollView : View;
  const edges = topInset ? ['top', 'bottom', 'left', 'right'] : ['bottom', 'left', 'right'];
  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      <Container
        style={styles.container}
        contentContainerStyle={scroll ? styles.scrollContent : styles.flexContent}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </Container>
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xl },
  flexContent: { flex: 1, padding: spacing.md },
});
