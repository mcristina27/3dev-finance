import React, { ReactNode } from "react";
import { Text, StyleSheet, TouchableOpacity } from "react-native";
import { Check } from "lucide-react-native";
import { bold, hardShadow } from "../theme/boldTheme";

/**
 * Botón de acción principal — usado como "Guardar" en el pie de las
 * pantallas modal. Estilo bold: color plano (el primero de colorsRange),
 * borde negro y sombra dura, con ícono + texto y estado de carga.
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
  shadowColor?: string;
  icon?: ReactNode;
}) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { backgroundColor: colorsRange[0] },
        isDisabled && { opacity: 0.65 },
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {!loading && (icon ?? <Check size={18} color={bold.black} strokeWidth={2.8} />)}
      <Text style={styles.btnText}>{loading ? loadingLabel : label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 56,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2.5,
    borderColor: bold.black,
    ...hardShadow(4),
  },
  btnText: { color: bold.black, fontSize: 16, fontWeight: "800" },
});
