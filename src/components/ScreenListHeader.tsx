import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Plus } from "lucide-react-native";
import { colors } from "../theme/colors";

/**
 * Header estándar de las pantallas de lista (Pedidos, Agenda, Inventario):
 * título grande + badge opcional con el conteo + botón "+" para agregar.
 */
export function ScreenListHeader({
  title,
  count,
  accentColor,
  accentBg,
  onAddPress,
}: {
  title: string;
  count?: number;
  accentColor: string;
  accentBg: string;
  onAddPress: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {count != null && (
          <View style={[styles.badge, { backgroundColor: accentBg }]}>
            <Text style={[styles.badgeText, { color: accentColor }]}>
              {count}
            </Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[
          styles.addBtn,
          { backgroundColor: accentColor, shadowColor: accentColor },
        ]}
        onPress={onAddPress}
        activeOpacity={0.8}
      >
        <Plus size={18} color={colors.white} strokeWidth={2.6} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  badge: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
