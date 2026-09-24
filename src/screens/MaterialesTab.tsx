import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Package, AlertTriangle, Trash2 } from "lucide-react-native";
import { useMaterials } from "../context/MaterialContext";
import { EmptyState } from "../components/EmptyState";
import { bold, hardShadow } from "../theme/boldTheme";
import { formatCurrency } from "../utils/formatters";
import { Material } from "../types";

function MaterialRow({
  material,
  onPress,
  onDelete,
}: {
  material: Material;
  onPress: () => void;
  onDelete: () => void;
}) {
  const isLow =
    typeof material.minStock === "number" &&
    material.stock <= material.minStock;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.rowIcon, isLow && styles.rowIconLow]}>
        <Package
          size={18}
          color={isLow ? bold.red : bold.blue}
          strokeWidth={1.8}
        />
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{material.name}</Text>
        <Text style={styles.rowHint}>
          {material.category ? `${material.category} · ` : ""}
          {formatCurrency(material.costPerUnit)} / {material.unit}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <View style={[styles.stockBadge, isLow && styles.stockBadgeLow]}>
          {isLow && (
            <AlertTriangle size={11} color={bold.red} strokeWidth={2.4} />
          )}
          <Text style={[styles.stockText, isLow && styles.stockTextLow]}>
            {material.stock} {material.unit}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={onDelete}
          hitSlop={8}
        >
          <Trash2 size={14} color={bold.textMuted} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export function MaterialesTab() {
  const navigation = useNavigation<any>();
  const { materials, deleteMaterial, lowStockMaterials } = useMaterials();

  function handleDelete(id: string, name: string) {
    Alert.alert("Eliminar insumo", `¿Eliminar "${name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => deleteMaterial(id),
      },
    ]);
  }

  return (
    <>
      {lowStockMaterials.length > 0 && (
        <View style={styles.lowStockBanner}>
          <AlertTriangle size={15} color={bold.red} strokeWidth={2.2} />
          <Text style={styles.lowStockText}>
            {lowStockMaterials.length === 1
              ? `"${lowStockMaterials[0].name}" tiene stock bajo`
              : `${lowStockMaterials.length} insumos con stock bajo`}
          </Text>
        </View>
      )}

      <FlatList
        data={materials}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <MaterialRow
            material={item}
            onPress={() =>
              navigation.navigate("NuevoInsumo", { materialId: item.id })
            }
            onDelete={() => handleDelete(item.id, item.name)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            Icon={Package}
            iconColor={bold.blue}
            iconBg={bold.blueLight}
            title="Sin insumos todavía"
            subtitle="Registra tu stock de materiales, cajas, etiquetas, etc."
            ctaLabel="Agregar insumo"
            onCtaPress={() => navigation.navigate("NuevoInsumo")}
          />
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  lowStockBanner: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: bold.redLight,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: bold.black,
  },
  lowStockText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: bold.red,
  },
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
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: bold.blueLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: bold.black,
  },
  rowIconLow: { backgroundColor: bold.redLight },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: "700", color: bold.black },
  rowHint: { fontSize: 12, color: bold.textSecondary, marginTop: 2 },
  rowRight: { alignItems: "flex-end", gap: 6 },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: bold.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: bold.black,
  },
  stockBadgeLow: {
    backgroundColor: bold.redLight,
  },
  stockText: { fontSize: 12, color: bold.textMuted, fontWeight: "700" },
  stockTextLow: { color: bold.red },
  deleteBtn: { padding: 2 },
});
