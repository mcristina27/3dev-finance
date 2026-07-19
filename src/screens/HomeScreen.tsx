import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Settings,
} from "lucide-react-native";
import { useTransactions } from "../context/TransactionContext";
import { TransactionCard } from "../components/TransactionCard";
import {
  colors,
  pastel,
  primaryGradient,
  negativeGradient,
} from "../theme/colors";
import { formatCurrency } from "../utils/formatters";

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { transactions, totalIncome, totalExpense, balance, loading } =
    useTransactions();
  const recent = transactions.slice(0, 5);
  const isPositive = balance >= 0;

  if (loading) {
    return (
      <View style={styles.root}>
        <ActivityIndicator
          size="large"
          color={pastel.berry}
          style={{ marginTop: 80 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>¡Hola, Cristina! 👋</Text>
              <Text style={styles.title}>Antiva</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={() => navigation.navigate("Config")}
                activeOpacity={0.75}
              >
                <Settings
                  size={18}
                  color={colors.textSecondary}
                  strokeWidth={2}
                />
              </TouchableOpacity>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>CR</Text>
              </View>
            </View>
          </View>

          {/* ── Balance hero — pink pastel ── */}
          <LinearGradient
            colors={isPositive ? primaryGradient : negativeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceTopRow}>
              <View style={styles.balanceBadge}>
                <Sparkles size={14} color={colors.textSecondary} strokeWidth={2} />
                <Text style={styles.balanceLabel}>Balance actual</Text>
              </View>
              <Text style={styles.balanceStatus}>
                {isPositive ? "¡Todo bien! 🌸" : "Ojo aquí 🍂"} 
              </Text>
            </View>
            <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
          </LinearGradient>

          {/* ── Stat chips: mint (ingresos) + peach (gastos) ── */}
          <View style={styles.statsRow}>
            <View
              style={[
                styles.chip,
                {
                  backgroundColor: pastel.lilacSoft,
                  borderColor: pastel.lilacLight,
                },
              ]}
            >
              <View
                style={[
                  styles.chipIcon,
                  { backgroundColor: pastel.lilacLight },
                ]}
              >
                <TrendingUp
                  size={16}
                  color={pastel.lilacDark}
                  strokeWidth={2.2}
                />
              </View>
              <View>
                <Text style={[styles.chipLabel, { color: pastel.lilacDark }]}>
                  Ingresos
                </Text>
                <Text style={[styles.chipValue, { color: pastel.lilacDark }]}>
                  {formatCurrency(totalIncome)}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.chip,
                {
                  backgroundColor: pastel.orangeSoft,
                  borderColor: pastel.orangeLight,
                },
              ]}
            >
              <View
                style={[
                  styles.chipIcon,
                  { backgroundColor: pastel.orangeLight },
                ]}
              >
                <TrendingDown
                  size={16}
                  color={pastel.orangeDark}
                  strokeWidth={2.2}
                />
              </View>
              <View>
                <Text style={[styles.chipLabel, { color: pastel.orangeDark }]}>
                  Gastos
                </Text>
                <Text style={[styles.chipValue, { color: pastel.orangeDark }]}>
                  {formatCurrency(totalExpense)}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Movimientos recientes ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recientes</Text>
              {transactions.length > 5 && (
                <TouchableOpacity
                  onPress={() => navigation.navigate("Movimientos")}
                >
                  <Text style={[styles.seeAll, { color: pastel.blue }]}>
                    Ver todos →
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {recent.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>¡Todo listo para empezar!</Text>
                <Text style={styles.emptySubtext}>
                  Toca + para registrar tu primer movimiento
                </Text>
              </View>
            ) : (
              recent.map((t) => <TransactionCard key={t.id} transaction={t} />)
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 130 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
    marginBottom: 2,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.8,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: pastel.berryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: pastel.berry + "55",
  },
  avatarText: { fontSize: 13, fontWeight: "800", color: pastel.berry },
  balanceCard: {
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 24,
    marginBottom: 16,
    shadowColor: pastel.lilacDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
  },
  balanceTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  balanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.28)",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  balanceStatus: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: "800",
    color: colors.textSecondary,
    letterSpacing: -1.5,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 28,
  },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
  },
  chipIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  chipValue: { fontSize: 15, fontWeight: "800" },
  section: { paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.3,
  },
  seeAll: { fontSize: 13, fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyEmoji: { fontSize: 32 },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
