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
import { CalendarDays, MapPin, Plus, Trash2 } from "lucide-react-native";
import { useAgendaEvents } from "../context/AgendaEventContext";
import { colors, pastel } from "../theme/colors";
import { formatDate } from "../utils/formatters";
import { AgendaEvent } from "../types";

function isPast(dateStr: string) {
  const today = new Date().toISOString().split("T")[0];
  return dateStr < today;
}

function EventRow({
  event,
  onPress,
  onDelete,
}: {
  event: AgendaEvent;
  onPress: () => void;
  onDelete: () => void;
}) {
  const past = isPast(event.date);

  return (
    <TouchableOpacity
      style={[styles.row, past && styles.rowPast]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.rowIcon, past && styles.rowIconPast]}>
        <CalendarDays
          size={18}
          color={past ? colors.textMuted : pastel.yellowDark}
          strokeWidth={1.8}
        />
      </View>
      <View style={styles.rowInfo}>
        <Text
          style={[styles.rowName, past && styles.rowNamePast]}
          numberOfLines={1}
        >
          {event.title}
        </Text>
        <View style={styles.rowMetaRow}>
          <Text style={styles.rowHint}>{formatDate(event.date)}</Text>
          {event.location && (
            <>
              <Text style={styles.rowDot}>·</Text>
              <MapPin size={11} color={colors.textMuted} strokeWidth={2} />
              <Text style={styles.rowHint} numberOfLines={1}>
                {event.location}
              </Text>
            </>
          )}
        </View>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} hitSlop={8}>
        <Trash2 size={14} color={colors.textMuted} strokeWidth={2} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export function AgendaScreen() {
  const navigation = useNavigation<any>();
  const { events, deleteEvent } = useAgendaEvents();

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  function handleDelete(id: string, title: string) {
    Alert.alert("Eliminar evento", `¿Eliminar "${title}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => deleteEvent(id),
      },
    ]);
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.title}>Agenda</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{events.length}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate("NuevoEvento")}
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
            <EventRow
              event={item}
              onPress={() =>
                navigation.navigate("NuevoEvento", { eventId: item.id })
              }
              onDelete={() => handleDelete(item.id, item.title)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <CalendarDays
                  size={32}
                  color={pastel.yellowDark}
                  strokeWidth={1.5}
                />
              </View>
              <Text style={styles.emptyText}>Sin eventos agendados</Text>
              <Text style={styles.emptySubtext}>
                Anota ferias y mercados a los que vas a ir
              </Text>
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={() => navigation.navigate("NuevoEvento")}
                activeOpacity={0.85}
              >
                <Plus size={15} color={colors.white} strokeWidth={2.6} />
                <Text style={styles.emptyCtaText}>Agregar evento</Text>
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
    backgroundColor: pastel.yellowLight,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: { fontSize: 12, fontWeight: "700", color: pastel.yellowDark },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: pastel.yellowDark,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: pastel.yellowDark,
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
  rowPast: { opacity: 0.55 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: pastel.yellowLight,
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconPast: { backgroundColor: colors.surfaceAlt },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: "700", color: colors.text },
  rowNamePast: { color: colors.textMuted },
  rowMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  rowHint: { fontSize: 12, color: colors.textSecondary },
  rowDot: { fontSize: 12, color: colors.textMuted },
  deleteBtn: { padding: 2 },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: pastel.yellowLight,
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
    backgroundColor: pastel.yellowDark,
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyCtaText: { color: colors.white, fontSize: 14, fontWeight: "700" },
});
