import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, ShoppingBag, Package, CalendarDays } from 'lucide-react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { MovimientosScreen } from '../screens/MovimientosScreen';
import { InsumosScreen } from '../screens/InsumosScreen';
import { PedidosScreen } from '../screens/PedidosScreen';
import { AgendaScreen } from '../screens/AgendaScreen';
import { MasScreen } from '../screens/MasScreen';
import { NewTransactionScreen } from '../screens/NewTransactionScreen';
import { NewMaterialScreen } from '../screens/NewMaterialScreen';
import { NewActivityScreen } from '../screens/NewActivityScreen';
import { NewAgendaEventScreen } from '../screens/NewAgendaEventScreen';
import { AdjustStockScreen } from '../screens/AdjustStockScreen';
import { BackupScreen } from '../screens/BackupScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { useAuth } from '../context/AuthContext';
import { bold, hardShadow } from '../theme/boldTheme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

type LucideIcon = React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;

// Navbar negra — cada tab tiene su propio color fuerte para el chip activo,
// con el ícono en negro o blanco según el contraste. 4 tabs principales, sin
// Movimientos/Más (esos viven dentro de Configuración, accesible desde Inicio).
const TAB_CONFIG: Record<string, {
  Icon: LucideIcon;
  label: string;
  bgColor: string;
  onColor: string;
}> = {
  Inicio:   { Icon: Home,         label: 'Inicio',     bgColor: bold.yellow, onColor: bold.black },
  Pedidos:  { Icon: ShoppingBag,  label: 'Pedidos',    bgColor: bold.pink,   onColor: bold.white },
  Insumos:  { Icon: Package,      label: 'Inventario', bgColor: bold.blue,   onColor: bold.white },
  Agenda:   { Icon: CalendarDays, label: 'Agenda',     bgColor: bold.mint,  onColor: bold.black },
};

// ─── Pill tab bar ─────────────────────────────────────────────────────────────
// 4 tabs parejos — cada sección (Pedidos, Inventario, Agenda) ya tiene su
// propio botón "+" contextual, así que no hace falta un FAB central acá.

function PillTabBar(props: any) {
  const { state, navigation } = props;

  function renderTab(route: any, index: number) {
    const isFocused = state.index === index;
    const config    = TAB_CONFIG[route.name];
    const TabIcon   = config?.Icon;
    const iconColor = isFocused ? config?.onColor : bold.textMuted;

    function onPress() {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
    }

    return (
      <TouchableOpacity key={route.key} style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
        <View style={[
          styles.tabIconWrap,
          isFocused && { backgroundColor: config?.bgColor, borderWidth: 2, borderColor: bold.black },
        ]}>
          {TabIcon && <TabIcon size={19} color={iconColor} strokeWidth={isFocused ? 2.4 : 1.8} />}
        </View>
        <Text style={[
          styles.tabLabel,
          { color: isFocused ? bold.black : bold.textMuted,
            fontWeight: isFocused ? '800' : '500' },
        ]}>
          {config?.label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.outerWrap} pointerEvents="box-none">
      <View style={styles.pill}>
        {state.routes.map((r: any, i: number) => renderTab(r, i))}
      </View>
    </View>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function Tabs() {
  return (
    <Tab.Navigator tabBar={p => <PillTabBar {...p} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Inicio"  component={HomeScreen} />
      <Tab.Screen name="Pedidos" component={PedidosScreen} />
      <Tab.Screen name="Insumos" component={InsumosScreen} />
      <Tab.Screen name="Agenda"  component={AgendaScreen} />
    </Tab.Navigator>
  );
}

// ─── Stack de autenticación (sin sesión) ───────────────────────────────────────

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

// ─── Stack principal (con sesión) ──────────────────────────────────────────────

function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={Tabs} />

      {/* Config y Movimientos ya no son tabs — se llega desde el engranaje en Inicio */}
      <Stack.Screen name="Config"      component={MasScreen} />
      <Stack.Screen name="Movimientos" component={MovimientosScreen} />
      <Stack.Screen name="Respaldo"    component={BackupScreen} />

      <Stack.Screen
        name="NuevoMovimiento"
        component={NewTransactionScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="NuevoInsumo"
        component={NewMaterialScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="NuevaActividad"
        component={NewActivityScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="NuevoEvento"
        component={NewAgendaEventScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="AjustarStock"
        component={AdjustStockScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={bold.pink} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: bold.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerWrap: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: bold.surface,
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: bold.black,
    ...hardShadow(5),
  },
  tabItem: {
    flex: 1, alignItems: 'center',
    gap: 3, paddingVertical: 2,
  },
  tabIconWrap: {
    width: 38, height: 28,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 10,
  },
  tabLabel: { fontSize: 10 },
});
