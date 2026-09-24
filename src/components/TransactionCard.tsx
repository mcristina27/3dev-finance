import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { TrendingUp, TrendingDown, Camera } from "lucide-react-native";
import { Transaction } from "../types";
import { bold, boldBorder, hardShadow } from "../theme/boldTheme";
import { formatCurrency, formatDate } from "../utils/formatters";

interface Props {
  transaction: Transaction;
  onPress?: () => void;
}

export function TransactionCard({ transaction, onPress }: Props) {
  const isIncome = transaction.type === "income";

  const accent = isIncome ? bold.pink : bold.yellowDark;
  const accentBg = isIncome ? bold.pinkLight : bold.yellowLight;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconBox, { backgroundColor: accent }]}>
        {isIncome ? (
          <TrendingUp size={18} color={bold.white} strokeWidth={2.6} />
        ) : (
          <TrendingDown size={18} color={bold.white} strokeWidth={2.6} />
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {transaction.name}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.date}>{formatDate(transaction.date)}</Text>
          {transaction.photos && transaction.photos.length > 0 && (
            <View style={styles.photoBadge}>
              <Camera size={9} color={bold.textMuted} strokeWidth={2} />
              <Text style={styles.photoCount}>{transaction.photos.length}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.amountChip, { backgroundColor: accentBg }]}>
        <Text style={[styles.amount, { color: bold.black }]}>
          {isIncome ? "+" : "-"}
          {formatCurrency(transaction.amount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: bold.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    ...boldBorder,
    ...hardShadow(3),
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: bold.black,
  },
  info: { flex: 1 },
  name: {
    fontSize: 14,
    fontWeight: "800",
    color: bold.black,
    marginBottom: 3,
  },
  meta: { flexDirection: "row", alignItems: "center", gap: 6 },
  date: { fontSize: 12, color: bold.textSecondary, fontWeight: "600" },
  photoBadge: { flexDirection: "row", alignItems: "center", gap: 2 },
  photoCount: { fontSize: 11, color: bold.textMuted },
  amountChip: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: bold.black,
  },
  amount: { fontSize: 13, fontWeight: "900" },
});
