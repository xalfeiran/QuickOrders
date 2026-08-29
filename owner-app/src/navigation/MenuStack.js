// Menu tab: list → item editor / recipe editor, mirroring the web
// dashboard's /admin/menu, /admin/menu/new, /admin/menu/:id and
// /admin/menu/:id/recipe routes.
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MenuListScreen from '../screens/menu/MenuListScreen';
import MenuItemFormScreen from '../screens/menu/MenuItemFormScreen';
import RecipeScreen from '../screens/menu/RecipeScreen';
import { colors } from '../constants/theme';

const Stack = createNativeStackNavigator();

export default function MenuStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="MenuList" component={MenuListScreen} options={{ title: 'Menú' }} />
      <Stack.Screen
        name="MenuItemForm"
        component={MenuItemFormScreen}
        options={({ route }) => ({
          title: route.params?.itemId ? 'Editar platillo' : 'Nuevo platillo',
        })}
      />
      <Stack.Screen name="Recipe" component={RecipeScreen} options={{ title: 'Receta' }} />
    </Stack.Navigator>
  );
}

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' },
};
