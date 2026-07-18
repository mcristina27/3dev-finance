import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Check, X } from "lucide-react-native";
import { useMaterials } from "../context/MaterialContext";
import { colors, pastel } from "../theme/colors";
import { MaterialUnit } from "../types";

const UNITS: MaterialUnit[] = ["g", "kg", "ml", "l", "unidad", "metro", "cm"];

export function NewMaterialScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const materialId = route.params?.materialId as string | undefined;
  const { getMaterial, addMaterial, updateMaterial } = useMaterials();
  const existing = materialId ? getMaterial(materialId) : undefined;
  const isEditing = !!existing;

  const [name, setName] = useState(existing?.name ?? "");
  const [unit, setUnit] = useState<MaterialUnit>(existing?.unit ?? "g");
  const [stock, setStock] = useState(existing ? String(existing.stock) : "");
  const [minStock, setMinStock] = useState(
    existing?.minStock != null ? String(existing.minStock) : "",
  );
  const [costPerUnit, setCostPerUnit] = useState(
    existing ? String(existing.costPerUnit) : "",
  );
  const [category, setCategory] = useState(existing?.category ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Falta el nombre", "Por favor escribe el nombre del insumo.");
      return;
    }
    const parsedStock = parseFloat(stock.replace(/,/g, ""));
    if (isNaN(parsedStock) || parsedStock < 0) {
      Alert.alert("Stock inválido", "Ingresa una cantidad de stock válida.");
      return;
    }
    const parsedCost = parseFloat(costPerUnit.replace(/,/g, ""));
    if (isNaN(parsedCost) || parsedCost < 0) {
      Alert.alert("Costo inválido", "Ingresa un costo por unidad válido.");
      return;
    }
    const parsedMinStock =
      minStock.trim() === ""
        ? undefined
        : parseFloat(minStock.replace(/,/g, ""));
    if (
      parsedMinStock !== undefined &&
      (isNaN(parsedMinStock) || parsedMinStock < 0)
    ) {
      Alert.alert(
        "Stock mínimo inválido",
        "Ingresa un stock mínimo válido o déjalo vacío.",
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        unit,
        stock: parsedStock,
        minStock: parsedMinStock,
        costPerUnit: parsedCost,
        category: category.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      if (isEditing && materialId) {
        await updateMaterial(materialId, payload);
      } else {
        await addMaterial(payload);
      }
      navigation.goBack();
    } catch {
      Alert.alert("Error", "No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.closeBtn}
            >
              <X size={18} color={colors.textSecondary} strokeWidth={2.2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isEditing ? "Editar insumo" : "Nuevo insumo"}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Filamento PLA"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Unidad</Text>
                <View style={styles.unitRow}>
                  {UNITS.map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[
                        styles.unitChip,
                        unit === u && styles.unitChipActive,
                      ]}
                      onPress={() => setUnit(u)}
                    >
                      <Text
                        style={[
                          styles.unitChipText,
                          unit === u && styles.unitChipTextActive,
                        ]}
                      >
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.row2}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Stock actual</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    value={stock}
                    onChangeText={setStock}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Stock mínimo</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Opcional"
                    placeholderTextColor={colors.textMuted}
                    value={minStock}
                    onChangeText={setMinStock}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Costo por unidad (S/)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  value={costPerUnit}
                  onChangeText={setCostPerUnit}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Categoría (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Filamentos, Empaque..."
                  placeholderTextColor={colors.textMuted}
                  value={category}
                  onChangeText={setCategory}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Notas (opcional)</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Agrega detalles..."
                  placeholderTextColor={colors.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </ScrollView>

          {/* Botón guardar */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtnWrap, saving && { opacity: 0.65 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[pastel.pistachio, pastel.pistachioDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtn}
              >
                {!saving && (
                  <Check size={18} color={colors.white} strokeWidth={2.5} />
                )}
                <Text style={styles.saveBtnText}>
                  {saving ? "Guardando..." : "Guardar insumo"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
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
  scroll: { flex: 1 },
  form: { paddingHorizontal: 20, paddingTop: 20, gap: 16, paddingBottom: 20 },
  row2: { flexDirection: "row", gap: 12 },
  field: { gap: 7 },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    fontWeight: "500",
  },
  notesInput: { height: 80, textAlignVertical: "top" },
  unitRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  unitChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 100,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  unitChipActive: {
    backgroundColor: pastel.pistachioLight,
    borderColor: pastel.pistachioDark,
  },
  unitChipText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  unitChipTextActive: { color: pastel.pistachioDark, fontWeight: "700" },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtnWrap: {
    borderRadius: 100,
    overflow: "hidden",
    shadowColor: pastel.pistachioDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 8,
  },
  saveBtn: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: "700" },
});
