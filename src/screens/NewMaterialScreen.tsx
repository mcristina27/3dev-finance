import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMaterials } from "../context/MaterialContext";
import { ModalHeader } from "../components/ModalHeader";
import { GradientButton } from "../components/GradientButton";
import { FormField, LabeledInput } from "../components/FormField";
import { bold } from "../theme/boldTheme";
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
          <ModalHeader title={isEditing ? "Editar insumo" : "Nuevo insumo"} />

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.form}>
              <LabeledInput
                label="Nombre"
                placeholder="Ej: Filamento PLA"
                value={name}
                onChangeText={setName}
              />

              <FormField label="Unidad">
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
              </FormField>

              <View style={styles.row2}>
                <LabeledInput
                  label="Stock actual"
                  style={{ flex: 1 }}
                  placeholder="0"
                  value={stock}
                  onChangeText={setStock}
                  keyboardType="decimal-pad"
                />
                <LabeledInput
                  label="Stock mínimo"
                  style={{ flex: 1 }}
                  placeholder="Opcional"
                  value={minStock}
                  onChangeText={setMinStock}
                  keyboardType="decimal-pad"
                />
              </View>

              <LabeledInput
                label="Costo por unidad (S/)"
                placeholder="0.00"
                value={costPerUnit}
                onChangeText={setCostPerUnit}
                keyboardType="decimal-pad"
              />

              <LabeledInput
                label="Categoría (opcional)"
                placeholder="Ej: Filamentos, Empaque..."
                value={category}
                onChangeText={setCategory}
              />

              <LabeledInput
                label="Notas (opcional)"
                inputStyle={styles.notesInput}
                placeholder="Agrega detalles..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <GradientButton
              label="Guardar insumo"
              loading={saving}
              onPress={handleSave}
              colorsRange={[bold.blue, bold.blue]}
              shadowColor={bold.blue}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: bold.bg },
  scroll: { flex: 1 },
  form: { paddingHorizontal: 20, paddingTop: 20, gap: 16, paddingBottom: 20 },
  row2: { flexDirection: "row", gap: 12 },
  notesInput: { height: 80, textAlignVertical: "top" },
  unitRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  unitChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 100,
    backgroundColor: bold.bg,
    borderWidth: 1.5,
    borderColor: bold.black,
  },
  unitChipActive: {
    backgroundColor: bold.blueLight,
    borderColor: bold.black,
  },
  unitChipText: { fontSize: 13, fontWeight: "600", color: bold.textMuted },
  unitChipTextActive: { color: bold.blue, fontWeight: "700" },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: bold.black },
});
