import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { FileText } from "lucide-react-native";
import { useTransactions } from "../context/TransactionContext";
import { TransactionCard } from "../components/TransactionCard";
import { BackHeader } from "../components/BackHeader";
import { colors } from "../theme/colors";
import { EntryType } from "../types";

type Filter = "all" | EntryType;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "income", label: "Ingresos" },
  { key: "expense", label: "Gastos" },
];

export function MovimientosScreen() {
  const navigation = useNavigation();
  const { transactions, deleteTransaction } = useTransactions();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all"
      ? transactions
      : transactions.filter((t) => t.type === filter);

  function handleDelete(id: string, name: string) {
    Alert.alert("Eliminar", `¿Eliminar "${name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => deleteTransaction(id),
      },
    ]);
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <BackHeader
          title="Movimientos"
          style={styles.header}
          right={
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{filtered.length}</Text>
            </View>
          }
        />

        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.chip,
                filter === f.key &&
                  (f.key === "income"
                    ? styles.chipIncome
                    : f.key === "expense"
                      ? styles.chipExpense
                      : styles.chipActive),
              ]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  filter === f.key &&
                    (f.key === "income"
                      ? styles.chipTextIncome
                      : f.key === "expense"
                        ? styles.chipTextExpense
                        : styles.chipTextActive),
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TransactionCard
              transaction={item}
              onPress={() => handleDelete(item.id, item.name)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <FileText size={32} color={colors.primary} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyText}>Sin movimientos</Text>
              <Text style={styles.emptySubtext}>
                Usa el botón + para registrar
              </Text>
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
    paddingBottom: 8,
    gap: 10,
  },
  badge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: { fontSize: 12, fontWeight: "700", color: colors.primary },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipIncome: { backgroundColor: colors.incomeLight, borderColor: "#A7F3D0" },
  chipExpense: { backgroundColor: colors.expenseLight, borderColor: "#FECDD3" },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  chipTextIncome: { color: colors.income },
  chipTextExpense: { color: colors.expense },
  list: { paddingHorizontal: 20, paddingBottom: 130 },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  emptySubtext: { fontSize: 13, color: colors.textSecondary },
});
