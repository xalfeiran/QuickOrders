// The dashboard's bottom navigation, shown once an owner/manager is logged
// in — mirrors the four nav links in frontend/src/admin/AdminLayout.jsx
// (Pedidos, Menú, Inventario, Enlaces) plus a Settings tab for server/logout.
import { StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import OrdersStack from './OrdersStack';
import MenuStack from './MenuStack';
import InventoryScreen from '../screens/inventory/InventoryScreen';
import OrderLinksScreen from '../screens/links/OrderLinksScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { colors } from '../constants/theme';

const Tab = createBottomTabNavigator();

// Plain emoji icons keep this app free of extra native icon-font
// dependencies, which matters for reliably running inside Expo Go.
const TAB_ICONS = {
  Pedidos: '🧾',
  Menú: '🍽️',
  Inventario: '📦',
  Enlaces: '🔗',
  Ajustes: '⚙️',
};

function TabIcon({ label, color }) {
  return <Text style={{ fontSize: 20, color }}>{TAB_ICONS[label]}</Text>;
}

export default function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ color }) => <TabIcon label={route.name} color={color} />,
      })}
    >
      <Tab.Screen name="Pedidos" component={OrdersStack} />
      <Tab.Screen name="Menú" component={MenuStack} />
      <Tab.Screen name="Inventario" component={InventoryScreen} />
      <Tab.Screen name="Enlaces" component={OrderLinksScreen} />
      {/* This tab has no native header (headerShown: false above), so
          SettingsScreen needs to reserve its own top safe-area inset —
          unlike when it's shown pre-login inside a Stack with a header. */}
      <Tab.Screen name="Ajustes">{(props) => <SettingsScreen {...props} topInset />}</Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
  },
});
