// Manager-generated pre-verified order links — the mobile counterpart of
// frontend/src/admin/AdminLinksPage.jsx. On mobile this also offers a native
// Share sheet, so a manager can send the link straight to WhatsApp or SMS.
import { useState } from 'react';
import { FlatList, Share, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Screen from '../../components/Screen';
import Notice from '../../components/Notice';
import Card from '../../components/Card';
import Button from '../../components/Button';
import FormField from '../../components/FormField';
import PickerField from '../../components/PickerField';
import { api } from '../../api/client';
import { useBusinessScope } from '../../hooks/useBusinessScope';
import { getStorefrontBaseUrl } from '../../api/config';
import { colors, spacing, typography } from '../../constants/theme';

export default function OrderLinksScreen() {
  const { isSuper, businesses, slug, setSlug } = useBusinessScope();
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [links, setLinks] = useState([]); // generated this session
  const [copiedToken, setCopiedToken] = useState(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.adminCreateOrderLink(slug, phone);
      const url = `${getStorefrontBaseUrl()}${res.path}`;
      setLinks((current) => [{ ...res, url }, ...current]);
      setPhone('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function copy(link) {
    await Clipboard.setStringAsync(link.url);
    setCopiedToken(link.token);
    setTimeout(() => setCopiedToken(null), 1500);
  }

  async function share(link) {
    try {
      await Share.share({ message: `Aquí tienes tu enlace para ordenar: ${link.url}` });
    } catch {
      // The user cancelled the share sheet — nothing to do.
    }
  }

  const businessOptions = businesses.map((b) => ({ value: b.slug, label: b.name }));

  return (
    // This screen sits directly on the Enlaces tab with no native header
    // above it, so it needs its own top safe-area padding.
    <Screen topInset>
      <Text style={typography.title}>Enlaces de pedido</Text>
      <Notice>
        Genera un enlace para un cliente por su teléfono. Al abrirlo, podrá ordenar sin
        verificar por SMS. El enlace es de un solo uso.
      </Notice>

      {isSuper && businessOptions.length > 0 && (
        <PickerField label="Negocio" value={slug} onValueChange={setSlug} options={businessOptions} />
      )}

      <FormField
        label="Teléfono del cliente"
        value={phone}
        onChangeText={setPhone}
        placeholder="+52 55 1234 5678"
        keyboardType="phone-pad"
      />
      <Button
        title={busy ? 'Generando…' : 'Generar enlace'}
        onPress={generate}
        busy={busy}
        disabled={phone.trim().length < 7}
      />

      {error ? <Notice variant="error">{error}</Notice> : null}

      <FlatList
        data={links}
        keyExtractor={(link) => link.token}
        scrollEnabled={false}
        style={styles.list}
        renderItem={({ item }) => (
          <Card>
            <Text style={typography.subtitle}>{item.phone}</Text>
            <Text style={styles.url} numberOfLines={1}>
              {item.url}
            </Text>
            <View style={styles.actionsRow}>
              <Button
                title={copiedToken === item.token ? 'Copiado' : 'Copiar'}
                variant="link"
                onPress={() => copy(item)}
              />
              <Button title="Compartir" variant="link" onPress={() => share(item)} />
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: spacing.md },
  url: { color: colors.primary, marginTop: spacing.xs, marginBottom: spacing.xs },
  actionsRow: { flexDirection: 'row', gap: spacing.md },
});
