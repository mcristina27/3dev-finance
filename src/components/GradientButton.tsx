import React, { ReactNode } from "react";
import { Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Check } from "lucide-react-native";
import { colors } from "../theme/colors";

/**
 * Botón de acción principal con gradiente — usado como "Guardar" en el pie
 * de las pantallas modal. Mismo look en todas: pill con sombra, ícono +
 * texto, estado de carga.
 */
export function GradientButton({
  label,
  loadingLabel = "Guardando...",
  loading = false,
  disabled = false,
  onPress,
  colorsRange,
  shadowColor,
  icon,
}: {
  label: string;
  loadingLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  colorsRange: readonly [string, string, ...string[]];
  shadowColor: string;
  icon?: ReactNode;
}) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.btnWrap,
        { shadowColor },
        isDisabled && { opacity: 0.65 },
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={colorsRange}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.btn}
      >
        {!loading &&
          (icon ?? <Check size={18} color={colors.white} strokeWidth={2.5} />)}
        <Text style={styles.btnText}>{loading ? loadingLabel : label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btnWrap: {
    borderRadius: 100,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 8,
  },
  btn: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnText: { color: colors.white, fontSize: 16, fontWeight: "700" },
});
