// Sign-in screen for the owner/manager dashboard — the mobile counterpart of
// frontend/src/admin/AdminLoginPage.jsx.
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import FormField from '../components/FormField';
import Notice from '../components/Notice';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, typography } from '../constants/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      // No manual navigation needed: RootNavigator swaps to the tabs as soon
      // as AuthContext's `user` becomes non-null.
    } catch (err) {
      setError(
        err.message?.includes('inválid') || err.message?.includes('Unauthorized')
          ? 'Correo o contraseña incorrectos.'
          : err.message || 'No se pudo iniciar sesión.',
      );
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>QuickOrder · Panel</Text>
          <Text style={styles.subtitle}>Acceso para dueños y encargados</Text>

          <FormField
            label="Correo"
            value={email}
            onChangeText={setEmail}
            placeholder="tucorreo@negocio.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormField
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
          />

          {error ? <Notice variant="error">{error}</Notice> : null}

          <Button
            title={busy ? 'Entrando…' : 'Entrar'}
            onPress={handleSubmit}
            disabled={!email || !password}
            busy={busy}
            style={styles.submit}
          />

          <Button
            title="Configurar dirección del servidor"
            variant="link"
            onPress={() => navigation.navigate('Settings')}
            style={styles.settingsLink}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  title: { ...typography.title, textAlign: 'center' },
  subtitle: {
    ...typography.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  submit: { marginTop: spacing.sm },
  settingsLink: { alignSelf: 'center', marginTop: spacing.md },
});
