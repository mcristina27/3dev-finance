import React, { useMemo, useState } from "react";
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
import { CalendarProvider, ExpandableCalendar } from "react-native-calendars";
import { CalendarDays, MapPin, Trash2, List } from "lucide-react-native";
import { useAgendaEvents } from "../context/AgendaEventContext";
import { ScreenListHeader } from "../components/ScreenListHeader";
import { EmptyState } from "../components/EmptyState";
import { bold, hardShadow } from "../theme/boldTheme";
import { formatDate } from "../utils/formatters";
import { AgendaEvent } from "../types";
import { DEFAULT_AGENDA_COLOR } from "../constants/agendaColors";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function isPast(dateStr: string) {
  return dateStr < todayISO();
}

function formatLongDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  const label = date.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
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
  const color = event.color ?? DEFAULT_AGENDA_COLOR;

  return (
    <TouchableOpacity
      style={[styles.row, past && styles.rowPast]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: color + "22" },
          past && styles.rowIconPast,
        ]}
      >
        <CalendarDays
          size={18}
          color={past ? bold.textMuted : color}
          strokeWidth={1.8}
        />
      </View>
      <View style={styles.rowInfo}>
        <View style={styles.rowNameRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text
            style={[styles.rowName, past && styles.rowNamePast]}
            numberOfLines={1}
          >
            {event.title}
          </Text>
        </View>
        <View style={styles.rowMetaRow}>
          <Text style={styles.rowHint}>{formatDate(event.date)}</Text>
          {event.location && (
            <>
              <Text style={styles.rowDot}>·</Text>
              <MapPin size={11} color={bold.textMuted} strokeWidth={2} />
              <Text style={styles.rowHint} numberOfLines={1}>
                {event.location}
              </Text>
            </>
          )}
        </View>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} hitSlop={8}>
        <Trash2 size={14} color={bold.textMuted} strokeWidth={2} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export function AgendaScreen() {
  const navigation = useNavigation<any>();
  const { events, deleteEvent } = useAgendaEvents();

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [mode, setMode] = useState<"day" | "all">("day");

  const sorted = useMemo(
    () => [...events].sort((a, b) => a.date.localeCompare(b.date)),
    [events],
  );

  const dayEvents = useMemo(
    () => sorted.filter((e) => e.date === selectedDate),
    [sorted, selectedDate],
  );

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    for (const ev of events) {
      const color = ev.color ?? DEFAULT_AGENDA_COLOR;
      if (!marks[ev.date]) marks[ev.date] = { dots: [] };
      marks[ev.date].dots.push({ key: ev.id, color });
    }
    marks[selectedDate] = {
      ...(marks[selectedDate] ?? {}),
      selected: true,
      selectedColor: bold.mintLight,
      selectedTextColor: bold.mint,
    };
    return marks;
  }, [events, selectedDate]);

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

  const listData = mode === "day" ? dayEvents : sorted;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScreenListHeader
          title="Agenda"
          count={events.length}
          accentColor={bold.mint}
          accentBg={bold.mintLight}
          onAddPress={() =>
            navigation.navigate("NuevoEvento", {
              initialDate: mode === "day" ? selectedDate : undefined,
            })
          }
        />

        <CalendarProvider date={selectedDate} onDateChanged={setSelectedDate}>
          <ExpandableCalendar
            firstDay={1}
            markingType="multi-dot"
            markedDates={markedDates}
            onDayPress={(day) => {
              setSelectedDate(day.dateString);
              setMode("day");
            }}
            theme={{
              calendarBackground: bold.bg,
              monthTextColor: bold.black,
              textMonthFontWeight: "900",
              textMonthFontSize: 16,
              arrowColor: bold.black,
              textSectionTitleColor: bold.textSecondary,
              textDayHeaderFontWeight: "700",
              dayTextColor: bold.black,
              textDayFontWeight: "700",
              textDisabledColor: bold.textMuted,
              todayTextColor: bold.black,
              todayBackgroundColor: bold.yellow,
              selectedDayBackgroundColor: bold.mint,
              selectedDayTextColor: bold.black,
              "stylesheet.day.basic": {
                today: {
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: bold.black,
                },
                selected: {
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: bold.black,
                },
              },
            } as any}
            style={styles.calendar}
          />

          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>
              {mode === "day" ? formatLongDate(selectedDate) : "Todos los eventos"}
            </Text>
            <TouchableOpacity
              style={styles.modeBtn}
              onPress={() =>
                setMode((m) => {
                  if (m === "all") {
                    setSelectedDate(todayISO());
                    return "day";
                  }
                  return "all";
                })
              }
              hitSlop={6}
            >
              {mode === "day" ? (
                <List size={13} color={bold.mint} strokeWidth={2.2} />
              ) : (
                <CalendarDays
                  size={13}
                  color={bold.mint}
                  strokeWidth={2.2}
                />
              )}
              <Text style={styles.modeBtnText}>
                {mode === "day" ? "Ver todos" : "Ver por día"}
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={listData}
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
              <EmptyState
                Icon={CalendarDays}
                iconColor={bold.mint}
                iconBg={bold.mintLight}
                title={
                  mode === "day"
                    ? "Sin eventos este día"
                    : "Sin eventos agendados"
                }
                subtitle="Anota ferias y mercados a los que vas a ir"
                ctaLabel="Agregar evento"
                onCtaPress={() =>
                  navigation.navigate("NuevoEvento", {
                    initialDate: mode === "day" ? selectedDate : undefined,
                  })
                }
              />
            }
          />
        </CalendarProvider>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: bold.bg },
  calendar: {
    borderBottomWidth: 2.5,
    borderBottomColor: bold.black,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  listHeaderTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: bold.black,
    flexShrink: 1,
  },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: bold.mintLight,
    borderWidth: 1.5,
    borderColor: bold.black,
  },
  modeBtnText: { fontSize: 11.5, fontWeight: "700", color: bold.mint },
  list: { paddingHorizontal: 20, paddingBottom: 130 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: bold.surface,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: bold.black,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 10,
    ...hardShadow(3),
  },
  rowPast: { opacity: 0.55 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: bold.black,
  },
  rowIconPast: { backgroundColor: bold.bg },
  rowInfo: { flex: 1 },
  rowNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rowName: { fontSize: 14, fontWeight: "700", color: bold.black, flexShrink: 1 },
  rowNamePast: { color: bold.textMuted },
  rowMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  rowHint: { fontSize: 12, color: bold.textSecondary },
  rowDot: { fontSize: 12, color: bold.textMuted },
  deleteBtn: { padding: 2 },
});
