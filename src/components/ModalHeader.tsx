import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { X } from "lucide-react-native";
import { bold } from "../theme/boldTheme";

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
        <X size={18} color={bold.black} strokeWidth={2.6} />
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
    borderBottomWidth: 2.5,
    borderBottomColor: bold.black,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 100,
    backgroundColor: bold.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: bold.black,
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: bold.black },
});
