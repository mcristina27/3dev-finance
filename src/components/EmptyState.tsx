import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Plus } from "lucide-react-native";
import { bold, hardShadow } from "../theme/boldTheme";

type LucideIcon = React.ComponentType<{
  size: number;
  color: string;
  strokeWidth?: number;
}>;

/**
 * Estado vacío estándar de las listas: ícono en círculo + título + subtexto
 * + botón para agregar el primer registro. Mismo look en Pedidos, Agenda,
 * Stock y Materiales — solo cambian el ícono, los colores y los textos.
 */
export function EmptyState({
  Icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  ctaLabel,
  ctaColor,
  onCtaPress,
}: {
  Icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaColor?: string;
  onCtaPress?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconWrap, { backgroundColor: iconBg }]}>
        <Icon size={32} color={bold.black} strokeWidth={1.8} />
      </View>
      <Text style={styles.emptyText}>{title}</Text>
      <Text style={styles.emptySubtext}>{subtitle}</Text>
      {ctaLabel && onCtaPress && (
        <TouchableOpacity
          style={[styles.emptyCta, { backgroundColor: ctaColor ?? iconColor }]}
          onPress={onCtaPress}
          activeOpacity={0.85}
        >
          <Plus size={15} color={bold.black} strokeWidth={2.8} />
          <Text style={styles.emptyCtaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 2.5,
    borderColor: bold.black,
  },
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
    marginBottom: 18,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 2.5,
    borderColor: bold.black,
    ...hardShadow(3),
  },
  emptyCtaText: { color: bold.black, fontSize: 14, fontWeight: "800" },
});
