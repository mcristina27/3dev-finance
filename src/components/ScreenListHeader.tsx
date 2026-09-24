import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Plus } from "lucide-react-native";
import { bold, hardShadow } from "../theme/boldTheme";

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
            <Text style={[styles.badgeText, { color: bold.black }]}>
              {count}
            </Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[styles.addBtn, { backgroundColor: accentColor }]}
        onPress={onAddPress}
        activeOpacity={0.8}
      >
        <Plus size={18} color={bold.black} strokeWidth={2.8} />
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
    fontWeight: "900",
    color: bold.black,
    letterSpacing: -0.5,
  },
  badge: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 2,
    borderColor: bold.black,
  },
  badgeText: { fontSize: 12, fontWeight: "800" },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: bold.black,
    ...hardShadow(3),
  },
});
