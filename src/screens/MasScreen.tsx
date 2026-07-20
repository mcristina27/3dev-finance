import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Tag, Store, CircleDollarSign, Cloud, Upload,
  FolderOpen, Palette, Bell, User, ChevronRight, ArrowLeftRight,
} from 'lucide-react-native';
import { BackHeader } from '../components/BackHeader';
import { colors, primaryGradient } from '../theme/colors';

type LucideIcon = React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;

interface MenuItemProps {
  Icon: LucideIcon;
  label: string;
  description: string;
  accentColor?: string;
  onPress?: () => void;
  disabled?: boolean;
}

function MenuItem({ Icon, label, description, accentColor, onPress, disabled }: MenuItemProps) {
  const bg = accentColor ? accentColor + '18' : colors.primaryLight;
  const ic = accentColor ?? colors.primary;
  return (
    <TouchableOpacity
      style={[styles.menuItem, disabled && styles.disabled]}
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <View style={[styles.menuIcon, { backgroundColor: bg }]}>
        <Icon size={17} color={ic} strokeWidth={1.9} />
      </View>
      <View style={styles.menuInfo}>
        <Text style={styles.menuLabel}>{label}</Text>
        <Text style={styles.menuDesc}>{description}</Text>
      </View>
      {disabled
        ? <View style={styles.soonPill}><Text style={styles.soonText}>Pronto</Text></View>
        : <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
      }
    </TouchableOpacity>
  );
}

export function MasScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          <BackHeader title="Configuración" />

          {/* Perfil */}
          <LinearGradient colors={primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <User size={26} color={colors.white} strokeWidth={1.8} />
            </View>
            <View>
              <Text style={styles.profileName}>Cristina Ruelas</Text>
              <Text style={styles.profileBiz}>3Dev · Impresiones 3D</Text>
            </View>
          </LinearGradient>

          <Text style={styles.sectionLabel}>Registros</Text>
          <View style={styles.menuCard}>
            <MenuItem
              Icon={ArrowLeftRight}
              label="Movimientos"
              description="Todos tus ingresos y gastos"
              accentColor={colors.income}
              onPress={() => navigation.navigate('Movimientos')}
            />
          </View>

          <Text style={styles.sectionLabel}>Mi negocio</Text>
          <View style={styles.menuCard}>
            <MenuItem Icon={Tag}              label="Categorías"       description="Personaliza tus categorías"   accentColor={colors.primary}  disabled />
            <MenuItem Icon={Store}            label="Canales de venta" description="Feria, online, pedido, etc."  accentColor={colors.agenda}   disabled />
            <MenuItem Icon={CircleDollarSign} label="Moneda y región"  description="S/ · Perú"                    accentColor={colors.income}   disabled />
          </View>

          <Text style={styles.sectionLabel}>Datos</Text>
          <View style={styles.menuCard}>
            <MenuItem Icon={Cloud}      label="Sincronización"   description="Firebase · pendiente"   accentColor="#0EA5E9" disabled />
            <MenuItem Icon={Upload}     label="Exportar reporte" description="PDF / Excel"            accentColor={colors.income} disabled />
            <MenuItem
              Icon={FolderOpen}
              label="Respaldo local"
              description="Exporta o restaura tus datos"
              accentColor={colors.agenda}
              onPress={() => navigation.navigate('Respaldo')}
            />
          </View>

          <Text style={styles.sectionLabel}>App</Text>
          <View style={styles.menuCard}>
            <MenuItem Icon={Palette} label="Apariencia"     description="Tema y colores"            accentColor={colors.expense} disabled />
            <MenuItem Icon={Bell}    label="Notificaciones" description="Alertas de stock y eventos" accentColor={colors.agenda}  disabled />
          </View>

          <Text style={styles.version}>Antiva v0.1.0 · hecho con amor en Perú 🇵🇪</Text>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 130 },
  profileCard: {
    marginHorizontal: 20, marginBottom: 28, borderRadius: 24, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30, shadowRadius: 18,
  },
  profileAvatar: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  profileName: { fontSize: 17, fontWeight: '800', color: colors.white },
  profileBiz:  { fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 20, marginBottom: 8,
  },
  menuCard: {
    marginHorizontal: 20, marginBottom: 22,
    backgroundColor: colors.surface,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  disabled: { opacity: 0.5 },
  menuIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  menuDesc:  { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  soonPill: {
    backgroundColor: colors.primaryLight, borderRadius: 100,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.border,
  },
  soonText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  version: { textAlign: 'center', fontSize: 12, color: colors.textMuted, marginTop: 4 },
});
