import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ShoppingBag,
  Store,
  Sparkles,
  Plus,
  Trash2,
} from "lucide-react-native";
import { useActivities } from "../context/ActivityContext";
import { useAgendaEvents } from "../context/AgendaEventContext";
import { colors, pastel } from "../theme/colors";
import { formatCurrency, formatDate } from "../utils/formatters";
import { Activity } from "../types";

const TYPE_ICON: Record<Activity["type"], any> = {
  order: ShoppingBag,
  event_sale: Store,
  custom: Sparkles,
};

const STATUS_TOGGLES: {
  key: "confirmed" | "paid" | "delivered";
  label: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
}[] = [
  {
    key: "confirmed",
    label: "Confirmado",
    activeBg: pastel.blueLight,
    activeBorder: pastel.blueDark,
    activeText: pastel.blueDark,
  },
  {
    key: "paid",
    label: "Pagado",
    activeBg: pastel.pistachioLight,
    activeBorder: pastel.pistachioDark,
    activeText: pastel.pistachioDark,
  },
  {
    key: "delivered",
    label: "Entregado",
    activeBg: pastel.berryLight,
    activeBorder: pastel.berryDark,
    activeText: pastel.berryDark,
  },
];

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
  const firstImage = activity.items?.find((it) => it.image)?.image;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      {firstImage ? (
        <Image source={{ uri: firstImage }} style={styles.rowThumb} />
      ) : (
        <View style={[styles.rowThumb, styles.rowThumbFallback]}>
          <Icon size={18} color={pastel.blueDark} strokeWidth={1.8} />
        </View>
      )}

      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>
          {activity.title}
        </Text>
        <Text style={styles.rowHint} numberOfLines={1}>
          {formatDate(activity.date)}
          {activity.channel ? ` · ${activity.channel}` : ""}
          {eventTitle ? ` · ${eventTitle}` : ""}
        </Text>
        <View style={styles.badgeRow}>
          {STATUS_TOGGLES.map((s) => {
            const active = activity[s.key] === true;
            return (
              <View
                key={s.key}
                style={[
                  styles.statusBadge,
                  active && {
                    backgroundColor: s.activeBg,
                    borderColor: s.activeBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: active ? s.activeText : colors.textMuted },
                  ]}
                >
                  {s.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.rowRight}>
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

  const sorted = [...activities].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  function openActivity(activity: Activity) {
    if (activity.delivered) {
      Alert.alert(
        "Este pedido ya fue entregado",
        "¿Deseas editarlo de todas formas?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Editar igual",
            onPress: () =>
              navigation.navigate("NuevaActividad", {
                activityId: activity.id,
              }),
          },
        ],
      );
      return;
    }
    navigation.navigate("NuevaActividad", { activityId: activity.id });
  }

  function handleDelete(activity: Activity) {
    if (activity.stockDeducted) {
      Alert.alert(
        "Este pedido ya generó un ingreso",
        `"${activity.title}" ya está pagado y registrado en Movimientos. Eliminarlo NO revierte el stock descontado ni borra ese ingreso — quedaría suelto. ¿Eliminar de todas formas?`,
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
              onPress={() => openActivity(item)}
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
  rowThumb: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: pastel.blueLight,
  },
  rowThumbFallback: { alignItems: "center", justifyContent: "center" },
  rowInfo: { flex: 1, gap: 3 },
  rowName: { fontSize: 14, fontWeight: "700", color: colors.text },
  rowHint: { fontSize: 12, color: colors.textSecondary },
  rowRight: { alignItems: "flex-end", gap: 8 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 2 },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusText: { fontSize: 10, fontWeight: "700" },
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
