import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { X } from "lucide-react-native";
import { colors } from "../theme/colors";

/**
 * Header estándar de las pantallas modal (Nuevo pedido, Nuevo insumo, etc.):
 * botón de cerrar (X) a la izquierda + título centrado + espaciador a la derecha.
 */
export function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose?: () => void;
}) {
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onClose ?? (() => navigation.goBack())}
        style={styles.closeBtn}
      >
        <X size={18} color={colors.textSecondary} strokeWidth={2.2} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 36 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 100,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
});
