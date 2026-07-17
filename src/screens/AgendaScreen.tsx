import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, ShoppingBag, Store } from 'lucide-react-native';
import { colors, pastel } from '../theme/colors';

type ActivityPreview = {
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  title: string;
  meta: string;
  type: string;
  color: string;
  bgColor: string;
};

const PREVIEW_ACTIVITIES: ActivityPreview[] = [
  { Icon: Store,       title: 'Feria Maker Lima',      meta: 'Sab 15 · Todo el día', type: 'Evento',  color: pastel.yellowDark, bgColor: pastel.yellowLight },
  { Icon: ShoppingBag, title: 'Pedido — Clickers x10', meta: 'Entrega Lun 18',       type: 'Pedido',  color: pastel.lilacDark,  bgColor: pastel.lilacLight },
  { Icon: Store,       title: 'Mercado artesanal',     meta: 'Dom 22 · 10am–6pm',    type: 'Evento',  color: pastel.yellowDark, bgColor: pastel.yellowLight },
];

export function AgendaScreen() {
  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          <View style={styles.header}>
            <Text style={styles.title}>Agenda</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <CalendarDays size={32} color={pastel.yellowDark} strokeWidth={1.5} />
            </View>
            <Text style={styles.infoTitle}>Eventos y pedidos</Text>
            <Text style={styles.infoText}>
              Registra ferias, eventos y pedidos. Al completarlos, el ingreso se registra automáticamente.
            </Text>
            <View style={styles.soonPill}>
              <Text style={styles.soonText}>Próximamente</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Vista previa</Text>

          <View style={styles.listCard}>
            {PREVIEW_ACTIVITIES.map((item, i) => (
              <View key={i} style={[styles.row, i < PREVIEW_ACTIVITIES.length - 1 && styles.rowBorder]}>
                <View style={[styles.rowIcon, { backgroundColor: item.bgColor }]}>
                  <item.Icon size={18} color={item.color} strokeWidth={1.8} />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowMeta}>{item.meta}</Text>
                </View>
                <View style={[styles.typePill, { backgroundColor: item.bgColor, borderColor: item.color + '44' }]}>
                  <Text style={[styles.typeText, { color: item.color }]}>{item.type}</Text>
                </View>
              </View>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 130 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  infoCard: {
    marginHorizontal: 20, marginBottom: 24,
    backgroundColor: colors.surface, borderRadius: 24, padding: 24, alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border,
    shadowColor: pastel.yellowDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12,
  },
  infoIcon: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: pastel.yellowLight, alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, borderWidth: 1.5, borderColor: colors.border,
  },
  infoTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 8, textAlign: 'center' },
  infoText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19, marginBottom: 16 },
  soonPill: {
    backgroundColor: pastel.yellowLight, borderRadius: 100,
    paddingHorizontal: 16, paddingVertical: 7, borderWidth: 1, borderColor: colors.border,
  },
  soonText: { fontSize: 12, fontWeight: '700', color: pastel.yellowDark },
  sectionTitle: {
    fontSize: 17, fontWeight: '800', color: colors.text,
    paddingHorizontal: 20, marginBottom: 12, letterSpacing: -0.3,
  },
  listCard: {
    marginHorizontal: 20, backgroundColor: colors.surface,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.border,
    overflow: 'hidden', opacity: 0.55,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  typePill: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  typeText: { fontSize: 11, fontWeight: '700' },
});
