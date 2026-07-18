import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  CalendarDays, ShoppingBag, Sparkles, Plus, Trash2,
} from 'lucide-react-native';
import { useActivities } from '../context/ActivityContext';
import { colors, pastel } from '../theme/colors';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Activity, ActivityStatus } from '../types';

const TYPE_ICON: Record<Activity['type'], any> = {
  order:  ShoppingBag,
  event:  CalendarDays,
  custom: Sparkles,
};

const STATUS_LABEL: Record<ActivityStatus, string> = {
  pending:     'Pendiente',
  confirmed:   'Confirmado',
  in_progress: 'En proceso',
  done:        'Listo',
  cancelled:   'Cancelado',
};

const STATUS_COLOR: Record<ActivityStatus, { bg: string; fg: string }> = {
  pending:     { bg: pastel.yellowLight,     fg: pastel.yellowDark },
  confirmed:   { bg: pastel.blueLight,       fg: pastel.blueDark },
  in_progress: { bg: pastel.lilacLight,      fg: pastel.lilacDark },
  done:        { bg: pastel.pistachioLight,  fg: pastel.pistachioDark },
  cancelled:   { bg: colors.expenseLight,     fg: colors.expense },
};

function ActivityRow({ activity, onPress, onDelete }: {
  activity: Activity;
  onPress: () => void;
  onDelete: () => void;
}) {
  const Icon = TYPE_ICON[activity.type];
  const statusStyle = STATUS_COLOR[activity.status];

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.rowIcon, { backgroundColor: statusStyle.bg }]}>
        <Icon size={18} color={statusStyle.fg} strokeWidth={1.8} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>{activity.title}</Text>
        <Text style={styles.rowHint}>
          {formatDate(activity.date)}{activity.channel ? ` · ${activity.channel}` : ''}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.fg }]}>{STATUS_LABEL[activity.status]}</Text>
        </View>
        {activity.totalAmount != null && (
          <Text style={styles.amount}>{formatCurrency(activity.totalAmount)}</Text>
        )}
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} hitSlop={8}>
          <Trash2 size={14} color={colors.textMuted} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export function AgendaScreen() {
  const navigation = useNavigation<any>();
  const { activities, deleteActivity } = useActivities();

  const sorted = [...activities].sort((a, b) => a.date.localeCompare(b.date));

  function handleDelete(id: string, title: string) {
    Alert.alert('Eliminar', `¿Eliminar "${title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteActivity(id) },
    ]);
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.title}>Agenda</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activities.length}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('NuevaActividad')}
            activeOpacity={0.8}
          >
            <Plus size={18} color={colors.white} strokeWidth={2.6} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={sorted}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ActivityRow
              activity={item}
              onPress={() => navigation.navigate('NuevaActividad', { activityId: item.id })}
              onDelete={() => handleDelete(item.id, item.title)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <CalendarDays size={32} color={pastel.yellowDark} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyText}>Sin pedidos ni eventos todavía</Text>
              <Text style={styles.emptySubtext}>Registra tus pedidos eligiendo productos de tu catálogo</Text>
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={() => navigation.navigate('NuevaActividad')}
                activeOpacity={0.85}
              >
                <Plus size={15} color={colors.white} strokeWidth={2.6} />
                <Text style={styles.emptyCtaText}>Agregar actividad</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  badge: {
    backgroundColor: pastel.yellowLight, borderRadius: 100,
    paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: colors.border,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: pastel.yellowDark },
  addBtn: {
    width: 38, height: 38, borderRadius: 14,
    backgroundColor: pastel.yellowDark,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: pastel.yellowDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30, shadowRadius: 8, elevation: 4,
  },
  list: { paddingHorizontal: 20, paddingBottom: 130 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18, borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12, gap: 12,
    marginBottom: 10,
  },
  rowIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 5 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3 },
  statusText: { fontSize: 10.5, fontWeight: '700' },
  amount: { fontSize: 13, fontWeight: '700', color: colors.text },
  deleteBtn: { padding: 2, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: pastel.yellowLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, borderWidth: 1.5, borderColor: colors.border,
  },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: 18 },
  emptyCta: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: pastel.yellowDark, borderRadius: 100,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  emptyCtaText: { color: colors.white, fontSize: 14, fontWeight: '700' },
});
