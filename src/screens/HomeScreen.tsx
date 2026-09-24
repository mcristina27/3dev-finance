import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
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
import { bold, boldBorder, hardShadow } from "../theme/boldTheme";
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
          color={bold.pink}
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
                <Settings size={18} color={bold.black} strokeWidth={2.4} />
              </TouchableOpacity>
              <View style={[styles.avatar, { backgroundColor: bold.pink }]}>
                <Text style={[styles.avatarText, { color: bold.white }]}>
                  CR
                </Text>
              </View>
            </View>
          </View>

          {/* ── Balance hero — amarillo sólido, borde negro, sombra dura ── */}
          <View
            style={[
              styles.balanceCard,
              { backgroundColor: isPositive ? bold.yellow : bold.black },
            ]}
          >
            <View style={styles.balanceTopRow}>
              <View style={styles.balanceBadge}>
                <Sparkles size={14} color={bold.black} strokeWidth={2.4} />
                <Text style={styles.balanceLabel}>Balance actual</Text>
              </View>
              <Text
                style={[
                  styles.balanceStatus,
                  { color: isPositive ? bold.black : bold.white },
                ]}
              >
                {isPositive ? "¡Todo bien! 🌸" : "Ojo aquí 🍂"}
              </Text>
            </View>
            <Text
              style={[
                styles.balanceAmount,
                { color: isPositive ? bold.black : bold.white },
              ]}
            >
              {formatCurrency(balance)}
            </Text>
          </View>

          {/* ── Stat chips: amarillo (ingresos) + rosa (gastos) ── */}
          <View style={styles.statsRow}>
            <View style={[styles.chip, { backgroundColor: bold.yellowLight }]}>
              <View
                style={[styles.chipIcon, { backgroundColor: bold.yellowDark }]}
              >
                <TrendingUp size={16} color={bold.white} strokeWidth={2.6} />
              </View>
              <View>
                <Text style={[styles.chipLabel, { color: bold.yellowDark }]}>
                  Ingresos
                </Text>
                <Text style={[styles.chipValue, { color: bold.black }]}>
                  {formatCurrency(totalIncome)}
                </Text>
              </View>
            </View>

            <View style={[styles.chip, { backgroundColor: bold.pinkLight }]}>
              <View style={[styles.chipIcon, { backgroundColor: bold.pink }]}>
                <TrendingDown size={16} color={bold.white} strokeWidth={2.6} />
              </View>
              <View>
                <Text style={[styles.chipLabel, { color: bold.pinkDark }]}>
                  Gastos
                </Text>
                <Text style={[styles.chipValue, { color: bold.black }]}>
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
                  <Text style={styles.seeAll}>Ver todos →</Text>
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
  root: { flex: 1, backgroundColor: bold.bg },
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
    color: bold.textSecondary,
    fontWeight: "600",
    marginBottom: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: bold.black,
    letterSpacing: -0.8,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: bold.surface,
    alignItems: "center",
    justifyContent: "center",
    ...boldBorder,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: bold.yellow,
    alignItems: "center",
    justifyContent: "center",
    ...boldBorder,
  },
  avatarText: { fontSize: 13, fontWeight: "800", color: bold.black },
  balanceCard: {
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    ...boldBorder,
    ...hardShadow(6),
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
    backgroundColor: bold.white,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: bold.black,
  },
  balanceLabel: {
    fontSize: 12,
    color: bold.black,
    fontWeight: "800",
  },
  balanceStatus: {
    fontSize: 12,
    color: bold.white,
    fontWeight: "700",
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: "900",
    color: bold.white,
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
    ...boldBorder,
    ...hardShadow(3),
  },
  chipIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: bold.black,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  chipValue: { fontSize: 15, fontWeight: "900" },
  section: { paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: bold.black,
    letterSpacing: -0.3,
  },
  seeAll: { fontSize: 13, fontWeight: "800", color: bold.pinkDark },
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyText: {
    fontSize: 16,
    fontWeight: "800",
    color: bold.black,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: bold.textSecondary,
    textAlign: "center",
  },
});
