import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTransactions } from "../context/TransactionContext";
import { TransactionCard } from "../components/TransactionCard";
import { colors, screenGradient } from "../theme/colors";
import { TransactionType } from "../types";

interface Props {
  type: TransactionType;
}

export function ListScreen({ type }: Props) {
  const navigation = useNavigation<any>();
  const { transactions, deleteTransaction } = useTransactions();
  const filtered = transactions.filter((t) => t.type === type);

  const isIncome = type === "income";
  const label = isIncome ? "Ingresos" : "Gastos de insumos";
  const fabColors = isIncome
    ? ([colors.income, "#16A34A"] as const)
    : ([colors.expense, "#BE185D"] as const);

  function handleLongPress(id: string, name: string) {
    Alert.alert("Eliminar registro", `¿Eliminar "${name}"?`, [
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
      <LinearGradient
        colors={screenGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>{label}</Text>
          <View
            style={[
              styles.badge,
              isIncome ? styles.badgeIncome : styles.badgeExpense,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                isIncome ? styles.badgeTextIncome : styles.badgeTextExpense,
              ]}
            >
              {filtered.length} registros
            </Text>
          </View>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TransactionCard
              transaction={item}
              onPress={() => handleLongPress(item.id, item.name)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>{isIncome ? "💰" : "💸"}</Text>
              <Text style={styles.emptyText}>
                {isIncome
                  ? "Sin ingresos registrados"
                  : "Sin gastos registrados"}
              </Text>
              <Text style={styles.emptySubtext}>
                Toca el botón para agregar
              </Text>
            </View>
          }
        />

        <TouchableOpacity
          style={styles.fabWrapper}
          onPress={() =>
            navigation.navigate("NuevoMovimiento", { defaultType: type })
          }
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={fabColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fab}
          >
            <Text style={styles.fabText}>
              + {isIncome ? "Nuevo evento" : "Nuevo gasto"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeIncome: {
    backgroundColor: colors.incomeLight,
  },
  badgeExpense: {
    backgroundColor: colors.expenseLight,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  badgeTextIncome: {
    color: colors.income,
  },
  badgeTextExpense: {
    color: colors.expense,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  fabWrapper: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  fab: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  fabText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
