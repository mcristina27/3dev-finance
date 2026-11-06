import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Plus, X, Package, Boxes } from "lucide-react-native";
import { useMaterials } from "../context/MaterialContext";
import { useRecipes } from "../context/RecipeContext";
import { useConnectivity } from "../context/ConnectivityContext";
import { isNetworkError } from "../lib/net";
import { recipeCost } from "../lib/recipeCost";
import { ModalHeader } from "../components/ModalHeader";
import { GradientButton } from "../components/GradientButton";
import { formatCurrency } from "../utils/formatters";
import { bold, boldBorder, hardShadow } from "../theme/boldTheme";
import { RecipeIngredient } from "../types";

export function RecipeScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const productId = String(route.params?.productId ?? "");
  const productName = (route.params?.productName as string) ?? "Producto";
  const productPrice = (route.params?.productPrice ?? null) as number | null;

  const { materials } = useMaterials();
  const { getRecipe, saveRecipe } = useRecipes();
  const { showOffline } = useConnectivity();

  const existing = getRecipe(productId);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(
    existing?.ingredients ?? [],
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const cost = useMemo(
    () => recipeCost(ingredients, materials),
    [ingredients, materials],
  );
  const price = productPrice ?? 0;
  const margin = price - cost;
  const marginPct = price > 0 ? (margin / price) * 100 : null;

  const available = materials.filter(
    (m) => !ingredients.some((ing) => ing.materialId === m.id),
  );

  function addMaterial(materialId: string) {
    setIngredients((prev) =>
      prev.some((i) => i.materialId === materialId)
        ? prev
        : [...prev, { materialId, qty: 1 }],
    );
    setPickerOpen(false);
  }

  function setQty(materialId: string, value: string) {
    const parsed = parseFloat(value.replace(/,/g, "."));
    setIngredients((prev) =>
      prev.map((i) =>
        i.materialId === materialId
          ? { ...i, qty: isNaN(parsed) ? 0 : parsed }
          : i,
      ),
    );
  }

  function removeIngredient(materialId: string) {
    setIngredients((prev) => prev.filter((i) => i.materialId !== materialId));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveRecipe(productId, ingredients);
      navigation.goBack();
    } catch (err) {
      if (isNetworkError(err)) showOffline();
      else Alert.alert("Error", "No se pudo guardar la receta. Intenta de nuevo.");
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
          <ModalHeader title="Receta y costo" />

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              {/* Producto */}
              <View style={[styles.productCard, boldBorder, hardShadow(4)]}>
                <Text style={styles.productName}>{productName}</Text>
                <Text style={styles.productPrice}>
                  Precio de venta:{" "}
                  {productPrice != null ? formatCurrency(productPrice) : "A cotizar"}
                </Text>
              </View>

              {/* Insumos de la receta */}
              <Text style={styles.sectionLabel}>INSUMOS DE LA RECETA</Text>
              <Text style={styles.hint}>
                Pon cuánto de cada insumo se usa para hacer 1 unidad de este
                producto.
              </Text>

              {ingredients.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Package size={20} color={bold.textMuted} strokeWidth={1.8} />
                  <Text style={styles.emptyText}>
                    Aún no agregaste insumos a este producto.
                  </Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {ingredients.map((ing) => {
                    const mat = materials.find((m) => m.id === ing.materialId);
                    const lineCost = (mat?.costPerUnit ?? 0) * ing.qty;
                    return (
                      <View key={ing.materialId} style={styles.row}>
                        <View style={styles.rowInfo}>
                          <Text style={styles.rowName} numberOfLines={1}>
                            {mat?.name ?? "Insumo eliminado"}
                          </Text>
                          <Text style={styles.rowMeta}>
                            {formatCurrency(mat?.costPerUnit ?? 0)} / {mat?.unit ?? "u"}
                          </Text>
                        </View>
                        <TextInput
                          style={styles.qtyInput}
                          keyboardType="decimal-pad"
                          value={ing.qty ? String(ing.qty) : ""}
                          placeholder="0"
                          placeholderTextColor={bold.textMuted}
                          onChangeText={(v) => setQty(ing.materialId, v)}
                          selectTextOnFocus
                        />
                        <Text style={styles.rowUnit}>{mat?.unit ?? "u"}</Text>
                        <Text style={styles.lineCost}>{formatCurrency(lineCost)}</Text>
                        <TouchableOpacity
                          onPress={() => removeIngredient(ing.materialId)}
                          hitSlop={8}
                        >
                          <X size={15} color={bold.textMuted} strokeWidth={2.2} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Agregar insumo */}
              {materials.length === 0 ? (
                <Text style={styles.noMaterials}>
                  Primero registra tus insumos en la pestaña Insumos para poder
                  armar la receta.
                </Text>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => setPickerOpen((v) => !v)}
                    activeOpacity={0.8}
                  >
                    <Plus size={15} color={bold.pink} strokeWidth={2.6} />
                    <Text style={styles.addBtnText}>Agregar insumo</Text>
                  </TouchableOpacity>

                  {pickerOpen && (
                    <View style={[styles.picker, boldBorder]}>
                      {available.length === 0 ? (
                        <Text style={styles.pickerEmpty}>
                          Ya agregaste todos tus insumos.
                        </Text>
                      ) : (
                        available.map((m) => (
                          <TouchableOpacity
                            key={m.id}
                            style={styles.pickerRow}
                            onPress={() => addMaterial(m.id)}
                          >
                            <Boxes size={14} color={bold.blue} strokeWidth={2} />
                            <Text style={styles.pickerName} numberOfLines={1}>
                              {m.name}
                            </Text>
                            <Text style={styles.pickerMeta}>
                              {formatCurrency(m.costPerUnit)} / {m.unit}
                            </Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  )}
                </>
              )}

              {/* Resumen de costo / margen */}
              <View style={[styles.summary, boldBorder, hardShadow(5)]}>
                <SummaryRow label="Costo de producir 1 u." value={formatCurrency(cost)} />
                <SummaryRow
                  label="Precio de venta"
                  value={productPrice != null ? formatCurrency(productPrice) : "—"}
                />
                <View style={styles.divider} />
                <SummaryRow
                  label="Margen"
                  value={productPrice != null ? formatCurrency(margin) : "—"}
                  strong
                  positive={margin >= 0}
                />
                <SummaryRow
                  label="Margen %"
                  value={marginPct == null ? "—" : marginPct.toFixed(0) + "%"}
                  strong
                  positive={margin >= 0}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <GradientButton
              label="Guardar receta"
              loading={saving}
              onPress={handleSave}
              colorsRange={[bold.mint, bold.mint]}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  strong,
  positive,
}: {
  label: string;
  value: string;
  strong?: boolean;
  positive?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, strong && styles.summaryLabelStrong]}>
        {label}
      </Text>
      <Text
        style={[
          styles.summaryValue,
          strong && styles.summaryValueStrong,
          strong && { color: positive ? bold.black : bold.red },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: bold.bg },
  scroll: { flex: 1 },
  form: { padding: 20, gap: 14 },
  productCard: {
    backgroundColor: bold.surface,
    borderRadius: 18,
    padding: 16,
  },
  productName: { fontSize: 17, fontWeight: "800", color: bold.black },
  productPrice: { fontSize: 13, color: bold.textSecondary, marginTop: 4 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: bold.black,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 4,
  },
  hint: { fontSize: 12.5, color: bold.textSecondary, lineHeight: 17, marginTop: -6 },
  emptyBox: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 20,
  },
  emptyText: { fontSize: 13, color: bold.textMuted, textAlign: "center" },
  list: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: bold.surface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: bold.black,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 13.5, fontWeight: "700", color: bold.black },
  rowMeta: { fontSize: 11, color: bold.textMuted, marginTop: 1 },
  qtyInput: {
    width: 52,
    fontSize: 13.5,
    fontWeight: "700",
    color: bold.black,
    backgroundColor: bold.bg,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: bold.black,
    textAlign: "center",
  },
  rowUnit: { fontSize: 11, color: bold.textSecondary, width: 34 },
  lineCost: {
    fontSize: 13,
    fontWeight: "800",
    color: bold.black,
    minWidth: 60,
    textAlign: "right",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: bold.pink,
    borderStyle: "dashed",
  },
  addBtnText: { fontSize: 13.5, fontWeight: "800", color: bold.pink },
  picker: {
    backgroundColor: bold.surface,
    borderRadius: 14,
    overflow: "hidden",
  },
  pickerEmpty: { fontSize: 12.5, color: bold.textMuted, padding: 14, textAlign: "center" },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: bold.bg,
  },
  pickerName: { flex: 1, fontSize: 13.5, fontWeight: "600", color: bold.black },
  pickerMeta: { fontSize: 11.5, color: bold.textMuted },
  noMaterials: {
    fontSize: 12.5,
    color: bold.textSecondary,
    lineHeight: 17,
    fontStyle: "italic",
  },
  summary: {
    backgroundColor: bold.yellowLight,
    borderRadius: 18,
    padding: 16,
    gap: 8,
    marginTop: 6,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: { fontSize: 13, color: bold.textSecondary },
  summaryLabelStrong: { fontSize: 14, fontWeight: "800", color: bold.black },
  summaryValue: { fontSize: 13, fontWeight: "700", color: bold.black },
  summaryValueStrong: { fontSize: 16, fontWeight: "900" },
  divider: { height: 2, backgroundColor: bold.black, opacity: 0.12, marginVertical: 2 },
  footer: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: bold.black,
    backgroundColor: bold.surface,
  },
});
