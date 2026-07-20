import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
import { colors, pastel } from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

type LucideIcon = React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;

// Cada tab tiene su propio color pastel — 4 tabs principales, sin Movimientos/Más
// (esos viven dentro de Configuración, accesible desde Inicio).
const TAB_CONFIG: Record<string, {
  Icon: LucideIcon;
  label: string;
  color: string;
  bgColor: string;
}> = {
  Inicio:   { Icon: Home,         label: 'Inicio',     color: pastel.lilac,         bgColor: pastel.lilacLight },
  Pedidos:  { Icon: ShoppingBag,  label: 'Pedidos',    color: pastel.blueDark,      bgColor: pastel.blueLight },
  Insumos:  { Icon: Package,      label: 'Inventario', color: pastel.pistachioDark, bgColor: pastel.pistachioLight },
  Agenda:   { Icon: CalendarDays, label: 'Agenda',     color: pastel.yellowDark,    bgColor: pastel.yellowLight },
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
    const iconColor = isFocused ? config?.color : colors.textMuted;

    function onPress() {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
    }

    return (
      <TouchableOpacity key={route.key} style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
        <View style={[
          styles.tabIconWrap,
          isFocused && { backgroundColor: config?.bgColor },
        ]}>
          {TabIcon && <TabIcon size={19} color={iconColor} strokeWidth={isFocused ? 2.4 : 1.8} />}
        </View>
        <Text style={[
          styles.tabLabel,
          { color: isFocused ? config?.color : colors.textMuted,
            fontWeight: isFocused ? '700' : '500' },
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

export function AppNavigator() {
  return (
    <NavigationContainer>
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
    </NavigationContainer>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outerWrap: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#C4B5FD',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
    elevation: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
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
