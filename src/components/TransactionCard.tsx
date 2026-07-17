import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TrendingUp, TrendingDown, Camera } from 'lucide-react-native';
import { Transaction } from '../types';
import { colors, pastel } from '../theme/colors';
import { formatCurrency, formatDate } from '../utils/formatters';

interface Props {
  transaction: Transaction;
  onPress?: () => void;
}

export function TransactionCard({ transaction, onPress }: Props) {
  const isIncome = transaction.type === 'income';

  const iconColor    = isIncome ? pastel.lilacDark   : pastel.orangeDark;
  const iconBg       = isIncome ? pastel.lilacLight  : pastel.orangeLight;
  const amountBg     = isIncome ? pastel.lilacSoft   : pastel.orangeSoft;
  const amountBorder = isIncome ? pastel.lilacLight  : pastel.orangeLight;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        {isIncome
          ? <TrendingUp  size={18} color={iconColor} strokeWidth={2.2} />
          : <TrendingDown size={18} color={iconColor} strokeWidth={2.2} />
        }
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{transaction.name}</Text>
        <View style={styles.meta}>
          <Text style={styles.date}>{formatDate(transaction.date)}</Text>
          {transaction.photos && transaction.photos.length > 0 && (
            <View style={styles.photoBadge}>
              <Camera size={9} color={colors.textMuted} strokeWidth={2} />
              <Text style={styles.photoCount}>{transaction.photos.length}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.amountChip, { backgroundColor: amountBg, borderColor: amountBorder }]}>
        <Text style={[styles.amount, { color: iconColor }]}>
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18, borderWidth: 1.5, borderColor: colors.border,
    padding: 14, marginBottom: 10, gap: 12,
    shadowColor: '#C4B5FD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 3 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  date: { fontSize: 12, color: colors.textSecondary },
  photoBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  photoCount: { fontSize: 11, color: colors.textMuted },
  amountChip: {
    borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1,
  },
  amount: { fontSize: 13, fontWeight: '800' },
});
