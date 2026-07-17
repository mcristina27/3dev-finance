import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { useTransactions } from '../context/TransactionContext';
import { colors, pastel, primaryGradient, negativeGradient } from '../theme/colors';
import { formatCurrency, getMonthLabel, getCurrentMonthKey } from '../utils/formatters';

export function ReportsScreen() {
  const { transactions, totalIncome, totalExpense, balance } = useTransactions();
  const currentMonth     = getCurrentMonthKey();
  const thisMonth        = transactions.filter(t => t.date.startsWith(currentMonth));
  const thisMonthIncome  = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const thisMonthExpense = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const topExpenses      = transactions.filter(t => t.type === 'expense').sort((a, b) => b.amount - a.amount).slice(0, 5);
  const topIncome        = transactions.filter(t => t.type === 'income').sort((a, b) => b.amount - a.amount).slice(0, 5);
  const isPositive       = balance >= 0;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          <View style={styles.header}>
            <Text style={styles.title}>Reportes</Text>
          </View>

          {/* Hero balance */}
          <LinearGradient
            colors={isPositive ? primaryGradient : negativeGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <Text style={styles.heroLabel}>Balance total</Text>
            <Text style={styles.heroAmount}>{formatCurrency(balance)}</Text>
            <Text style={styles.heroStatus}>{isPositive ? '¡Vas muy bien! 🎉' : 'Cuidado con los gastos 📉'}</Text>
          </LinearGradient>

          {/* Mes actual */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{getMonthLabel(currentMonth)}</Text>
            <View style={styles.row}>
              <View style={[styles.miniCard, { borderColor: pastel.lilacLight, backgroundColor: pastel.lilacSoft }]}>
                <View style={[styles.miniIcon, { backgroundColor: colors.white }]}>
                  <TrendingUp size={16} color={pastel.lilacDark} strokeWidth={2.2} />
                </View>
                <Text style={[styles.miniLabel, { color: pastel.lilacDark }]}>Ingresos</Text>
                <Text style={[styles.miniAmount, { color: pastel.lilacDark }]}>{formatCurrency(thisMonthIncome)}</Text>
              </View>
              <View style={[styles.miniCard, { borderColor: pastel.orangeLight, backgroundColor: pastel.orangeSoft }]}>
                <View style={[styles.miniIcon, { backgroundColor: colors.white }]}>
                  <TrendingDown size={16} color={pastel.orangeDark} strokeWidth={2.2} />
                </View>
                <Text style={[styles.miniLabel, { color: pastel.orangeDark }]}>Gastos</Text>
                <Text style={[styles.miniAmount, { color: pastel.orangeDark }]}>{formatCurrency(thisMonthExpense)}</Text>
              </View>
            </View>
          </View>

          {/* Listas */}
          {topIncome.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mayores ingresos</Text>
              <View style={styles.listCard}>
                {topIncome.map((t, i) => (
                  <View key={t.id} style={[styles.listRow, i < topIncome.length - 1 && styles.listRowBorder]}>
                    <Text style={styles.listName} numberOfLines={1}>{t.name}</Text>
                    <View style={[styles.amountPill, { backgroundColor: pastel.lilacLight }]}>
                      <Text style={[styles.listAmount, { color: pastel.lilacDark }]}>{formatCurrency(t.amount)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {topExpenses.length > 0 && (
            <View style={[styles.section, { paddingBottom: 0 }]}>
              <Text style={styles.sectionTitle}>Mayores gastos</Text>
              <View style={styles.listCard}>
                {topExpenses.map((t, i) => (
                  <View key={t.id} style={[styles.listRow, i < topExpenses.length - 1 && styles.listRowBorder]}>
                    <Text style={styles.listName} numberOfLines={1}>{t.name}</Text>
                    <View style={[styles.amountPill, { backgroundColor: pastel.orangeLight }]}>
                      <Text style={[styles.listAmount, { color: pastel.orangeDark }]}>{formatCurrency(t.amount)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

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
  heroCard: {
    marginHorizontal: 20, marginBottom: 24,
    borderRadius: 28, padding: 24,
    shadowColor: pastel.lilacDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.30, shadowRadius: 24, elevation: 10,
  },
  heroLabel: { fontSize: 12, color: 'rgba(255,255,255,0.70)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  heroAmount: { fontSize: 36, fontWeight: '800', color: colors.white, letterSpacing: -1, marginBottom: 4 },
  heroStatus: { fontSize: 13, color: 'rgba(255,255,255,0.70)', fontWeight: '500' },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 12, letterSpacing: -0.3 },
  row: { flexDirection: 'row', gap: 12 },
  miniCard: {
    flex: 1, borderRadius: 18, padding: 14,
    borderWidth: 1.5,
  },
  miniIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  miniLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 },
  miniAmount: { fontSize: 18, fontWeight: '800' },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.border,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
  },
  listRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  listName: { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1, marginRight: 8 },
  amountPill: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  listAmount: { fontSize: 13, fontWeight: '700' },
});
