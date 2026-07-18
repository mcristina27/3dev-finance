import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { colors, pastel } from "../theme/colors";
import { formatDate } from "../utils/formatters";

const WEEKDAYS = ["D", "L", "M", "M", "J", "V", "S"];
const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

/**
 * Selector de fecha con calendario propio — sin librerías nativas nuevas,
 * para no romper el build standalone (Xcode) ni depender de un rebuild.
 */
export function DateField({
  value,
  onChange,
  label = "Fecha",
}: {
  value: string;
  onChange: (isoDate: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => parseISODate(value || toISODate(new Date())).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parseISODate(value || toISODate(new Date())).getMonth());

  function openPicker() {
    const d = value ? parseISODate(value) : new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setOpen(true);
  }

  function changeMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  }

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const todayISO = toISODate(new Date());

  return (
    <>
      <TouchableOpacity
        style={styles.field}
        onPress={openPicker}
        activeOpacity={0.75}
      >
        <CalendarDays size={16} color={pastel.blueDark} strokeWidth={2} />
        <Text style={styles.fieldText}>
          {value ? formatDate(value) : "Selecciona una fecha"}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <TouchableOpacity
                onPress={() => changeMonth(-1)}
                style={styles.navBtn}
                hitSlop={8}
              >
                <ChevronLeft
                  size={18}
                  color={colors.textSecondary}
                  strokeWidth={2.2}
                />
              </TouchableOpacity>
              <Text style={styles.monthLabel}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>
              <TouchableOpacity
                onPress={() => changeMonth(1)}
                style={styles.navBtn}
                hitSlop={8}
              >
                <ChevronRight
                  size={18}
                  color={colors.textSecondary}
                  strokeWidth={2.2}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={styles.closeBtn}
                hitSlop={8}
              >
                <X size={15} color={colors.textMuted} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((w, i) => (
                <Text key={i} style={styles.weekLabel}>
                  {w}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((day, i) => {
                if (day === null) {
                  return <View key={i} style={styles.cell} />;
                }
                const iso = toISODate(new Date(viewYear, viewMonth, day));
                const isSelected = iso === value;
                const isToday = iso === todayISO;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.cell,
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                    ]}
                    onPress={() => {
                      onChange(iso);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isToday && !isSelected && styles.dayTextToday,
                        isSelected && styles.dayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldText: { fontSize: 15, color: colors.text, fontWeight: "500" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(30,16,48,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  navBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
  },
  monthLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
    marginLeft: 8,
  },
  weekRow: { flexDirection: "row", marginBottom: 6 },
  weekLabel: {
    width: CELL_SIZE,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCell: { borderRadius: 12 },
  dayCellSelected: { backgroundColor: pastel.blueDark },
  dayText: { fontSize: 14, fontWeight: "600", color: colors.text },
  dayTextToday: { color: pastel.blueDark, fontWeight: "800" },
  dayTextSelected: { color: colors.white, fontWeight: "800" },
});
