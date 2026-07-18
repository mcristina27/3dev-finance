import React from "react";
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
import {
  ShoppingBag,
  Store,
  Sparkles,
  Plus,
  Trash2,
  CalendarDays,
  Lock,
} from "lucide-react-native";
import { useActivities } from "../context/ActivityContext";
import { useAgendaEvents } from "../context/AgendaEventContext";
import { colors, pastel } from "../theme/colors";
import { formatCurrency, formatDate } from "../utils/formatters";
import { Activity, ActivityStatus, PaymentStatus } from "../types";

const TYPE_ICON: Record<Activity["type"], any> = {
  order: ShoppingBag,
  event_sale: Store,
  custom: Sparkles,
};

const STATUS_LABEL: Record<ActivityStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  in_progress: "En proceso",
  done: "Listo",
  cancelled: "Cancelado",
};

const STATUS_COLOR: Record<ActivityStatus, { bg: string; fg: string }> = {
  pending: { bg: pastel.blueLight, fg: pastel.blueDark },
  confirmed: { bg: pastel.blueLight, fg: pastel.blueDark },
  in_progress: { bg: pastel.lilacLight, fg: pastel.lilacDark },
  done: { bg: pastel.pistachioLight, fg: pastel.pistachioDark },
  cancelled: { bg: colors.expenseLight, fg: colors.expense },
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  paid: "Pagado",
  pending: "Pendiente de cobro",
};

function ActivityRow({
  activity,
  eventTitle,
  onPress,
  onDelete,
}: {
  activity: Activity;
  eventTitle?: string;
  onPress: () => void;
  onDelete: () => void;
}) {
  const Icon = TYPE_ICON[activity.type];
  const statusStyle = STATUS_COLOR[activity.status];
  const paymentStatus = activity.paymentStatus ?? "paid";

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.rowIcon, { backgroundColor: statusStyle.bg }]}>
        <Icon size={18} color={statusStyle.fg} strokeWidth={1.8} />
      </View>
      <View style={styles.rowInfo}>
        <View style={styles.rowNameRow}>
          <Text style={styles.rowName} numberOfLines={1}>
            {activity.title}
          </Text>
          {activity.stockDeducted && (
            <Lock size={12} color={pastel.pistachioDark} strokeWidth={2.4} />
          )}
        </View>
        <Text style={styles.rowHint} numberOfLines={1}>
          {formatDate(activity.date)}
          {activity.channel ? ` · ${activity.channel}` : ""}
          {eventTitle ? ` · ${eventTitle}` : ""}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <View style={styles.badgeRow}>
          <View
            style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
          >
            <Text style={[styles.statusText, { color: statusStyle.fg }]}>
              {STATUS_LABEL[activity.status]}
            </Text>
          </View>
          <View
            style={[
              styles.payBadge,
              paymentStatus === "pending" && styles.payBadgePending,
            ]}
          >
            <Text
              style={[
                styles.payText,
                paymentStatus === "pending" && styles.payTextPending,
              ]}
            >
              {PAYMENT_LABEL[paymentStatus]}
            </Text>
          </View>
        </View>
        {activity.totalAmount != null && (
          <Text style={styles.amount}>
            {formatCurrency(activity.totalAmount)}
          </Text>
        )}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={onDelete}
          hitSlop={8}
        >
          <Trash2 size={14} color={colors.textMuted} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export function PedidosScreen() {
  const navigation = useNavigation<any>();
  const { activities, deleteActivity } = useActivities();
  const { events } = useAgendaEvents();

  const sorted = [...activities].sort((a, b) => b.date.localeCompare(a.date));

  function handleDelete(activity: Activity) {
    if (activity.stockDeducted) {
      Alert.alert(
        "Este pedido ya generó un ingreso",
        `"${activity.title}" ya está confirmado, pagado y registrado en Movimientos. Eliminarlo NO revierte el stock descontado ni borra ese ingreso — quedaría suelto. ¿Eliminar de todas formas?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar de todas formas",
            style: "destructive",
            onPress: () => deleteActivity(activity.id),
          },
        ],
      );
      return;
    }
    Alert.alert("Eliminar", `¿Eliminar "${activity.title}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => deleteActivity(activity.id),
      },
    ]);
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.title}>Pedidos</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activities.length}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate("NuevaActividad")}
            activeOpacity={0.8}
          >
            <Plus size={18} color={colors.white} strokeWidth={2.6} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ActivityRow
              activity={item}
              eventTitle={
                item.eventId
                  ? events.find((e) => e.id === item.eventId)?.title
                  : undefined
              }
              onPress={() =>
                navigation.navigate("NuevaActividad", { activityId: item.id })
              }
              onDelete={() => handleDelete(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <ShoppingBag
                  size={32}
                  color={pastel.blueDark}
                  strokeWidth={1.5}
                />
              </View>
              <Text style={styles.emptyText}>Sin pedidos todavía</Text>
              <Text style={styles.emptySubtext}>
                Registra pedidos individuales o ventas de un evento, eligiendo
                productos de tu catálogo
              </Text>
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={() => navigation.navigate("NuevaActividad")}
                activeOpacity={0.85}
              >
                <Plus size={15} color={colors.white} strokeWidth={2.6} />
                <Text style={styles.emptyCtaText}>Agregar pedido</Text>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: pastel.blueLight,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: { fontSize: 12, fontWeight: "700", color: pastel.blueDark },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: pastel.blueDark,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: pastel.blueDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  list: { paddingHorizontal: 20, paddingBottom: 130 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 10,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowInfo: { flex: 1 },
  rowNameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  rowName: { fontSize: 14, fontWeight: "700", color: colors.text },
  rowHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  rowRight: { alignItems: "flex-end", gap: 5 },
  badgeRow: { flexDirection: "row", gap: 5 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3 },
  statusText: { fontSize: 10.5, fontWeight: "700" },
  payBadge: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
    backgroundColor: pastel.pistachioLight,
  },
  payBadgePending: { backgroundColor: colors.expenseLight },
  payText: { fontSize: 10.5, fontWeight: "700", color: pastel.pistachioDark },
  payTextPending: { color: colors.expense },
  amount: { fontSize: 13, fontWeight: "700", color: colors.text },
  deleteBtn: { padding: 2, marginTop: 2 },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: pastel.blueLight,
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
  emptySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 18,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: pastel.blueDark,
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyCtaText: { color: colors.white, fontSize: 14, fontWeight: "700" },
});
