// Orders tab: list → detail, mirroring the web dashboard's
// /admin (list) and /admin/orders/:id routes.
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OrdersListScreen from '../screens/orders/OrdersListScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import { colors } from '../constants/theme';

const Stack = createNativeStackNavigator();

export default function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="OrdersList" component={OrdersListScreen} options={{ title: 'Pedidos' }} />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Pedido' }}
      />
    </Stack.Navigator>
  );
}

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' },
};
