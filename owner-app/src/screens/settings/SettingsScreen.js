// Server address + session settings. Reachable two ways: as its own screen
// before logging in (so the API URL can be set up on first run — there it
// sits inside a Stack with its own native header) and as the "Ajustes" tab
// once logged in (mounted directly on the tab bar with no native header,
// hence `topInset`; it also shows the account and a logout button,
// replacing the user/logout block from frontend/src/admin/AdminLayout.jsx).
//
// The server address fields are for whoever sets up the app, not for a
// regular restaurant owner — they're hidden once logged in unless the
// account is a superadmin.
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import Notice from '../../components/Notice';
import Card from '../../components/Card';
import Button from '../../components/Button';
import FormField from '../../components/FormField';
import { useAuth } from '../../context/AuthContext';
import {
  getApiBaseUrl,
  getStorefrontBaseUrl,
  setApiBaseUrl,
  setStorefrontBaseUrl,
} from '../../api/config';
import { colors, spacing, typography } from '../../constants/theme';

const APP_NAME = 'QuickOrder · Panel';

const ROLE_LABELS = {
  superadmin: 'Superadministrador',
  business_admin: 'Administrador de negocio',
};

export default function SettingsScreen({ navigation, topInset = false }) {
  const { user, logout, recheckSession } = useAuth();
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [storefrontUrl, setStorefrontUrl] = useState(getStorefrontBaseUrl());
  const [saved, setSaved] = useState(false);

  // Before login there's no account yet, so the server has to be
  // configurable to even reach one. Once logged in, only a superadmin
  // (the person who sets the app up) should be able to change it.
  const canEditServer = !user || user.role === 'superadmin';

  // Keep the fields in sync if they were changed elsewhere in the app.
  useEffect(() => {
    setApiUrl(getApiBaseUrl());
    setStorefrontUrl(getStorefrontBaseUrl());
  }, []);

  async function save() {
    await setApiBaseUrl(apiUrl);
    await setStorefrontBaseUrl(storefrontUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    // If we're not logged in yet, immediately check whether the new server
    // already has a valid session for us (unlikely, but harmless) and let
    // the login screen retry against the new address either way.
    if (!user) recheckSession();
  }

  function confirmLogout() {
    Alert.alert('Cerrar sesión', '¿Quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <Screen topInset={topInset}>
      <Text style={styles.appName}>{APP_NAME}</Text>
      <Text style={typography.title}>Ajustes</Text>

      {user && (
        <Card>
          <Text style={typography.subtitle}>{user.name}</Text>
          <Text style={typography.muted}>{ROLE_LABELS[user.role] ?? user.role}</Text>
          {user.businessSlug ? <Text style={typography.muted}>Negocio: {user.businessSlug}</Text> : null}
          <Button title="Cerrar sesión" variant="danger" onPress={confirmLogout} style={styles.logoutButton} />
        </Card>
      )}

      {canEditServer && (
        <Card>
          <Text style={styles.sectionTitle}>Dirección del servidor</Text>
          <Notice>
            El teléfono no puede usar "localhost" — necesita la dirección de red local (Wi‑Fi)
            de la computadora donde corre el backend, por ejemplo http://192.168.1.42:3000/api.
            En Mac/Linux revisa con `ifconfig` (o `ipconfig` en Windows), o el menú de Wi‑Fi.
          </Notice>
          <FormField
            label="URL de la API"
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="http://192.168.1.42:3000/api"
            autoCapitalize="none"
            keyboardType="url"
          />
          <FormField
            label="URL de la tienda (para enlaces de pedido)"
            value={storefrontUrl}
            onChangeText={setStorefrontUrl}
            placeholder="http://192.168.1.42:8080"
            autoCapitalize="none"
            keyboardType="url"
          />
          <Button title={saved ? 'Guardado ✓' : 'Guardar'} onPress={save} />
        </Card>
      )}

      {!user && navigation?.canGoBack?.() && (
        <Button title="← Volver a iniciar sesión" variant="link" onPress={() => navigation.goBack()} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  appName: { ...typography.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitle: { ...typography.subtitle, marginBottom: spacing.sm },
  logoutButton: { marginTop: spacing.sm, alignSelf: 'flex-start' },
});
