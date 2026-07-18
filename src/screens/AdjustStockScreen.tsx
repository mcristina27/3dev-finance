import React, { useState, useEffect, useMemo } from "react";
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
  ActivityIndicator,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  Check,
  X,
  Search,
  Package,
  Plus,
  Minus,
  RefreshCw,
} from "lucide-react-native";
import { useInventory } from "../context/InventoryContext";
import { getCatalog, forceRefreshCatalog } from "../services/catalogService";
import { colors, pastel } from "../theme/colors";
import { formatCurrency } from "../utils/formatters";
import { CatalogProduct } from "../types";

type Mode = "add" | "set";

export function AdjustStockScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const presetProductId = route.params?.productId as string | undefined;

  const { getStock, adjustStock, setStock } = useInventory();

  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [catalogState, setCatalogState] = useState<
    "loading" | "ready" | "offline" | "error"
  >("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CatalogProduct | null>(null);
  const [mode, setMode] = useState<Mode>("add");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    getCatalog()
      .then(({ productos, fromCache }) => {
        if (!mounted) return;
        setCatalog(productos);
        setCatalogState(fromCache ? "offline" : "ready");
        if (presetProductId) {
          const found = productos.find((p) => String(p.id) === presetProductId);
          if (found) setSelected(found);
        }
      })
      .catch(() => {
        if (mounted) setCatalogState("error");
      });
    return () => {
      mounted = false;
    };
  }, [presetProductId]);

  async function handleRefreshCatalog() {
    setRefreshing(true);
    try {
      const { productos, fromCache } = await forceRefreshCatalog();
      setCatalog(productos);
      setCatalogState(fromCache ? "offline" : "ready");
    } catch {
      setCatalogState("error");
    } finally {
      setRefreshing(false);
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return catalog;
    const q = search.trim().toLowerCase();
    return catalog.filter((p) => p.name.toLowerCase().includes(q));
  }, [catalog, search]);

  const currentQty = selected ? getStock(String(selected.id)) : 0;

  async function handleSave() {
    if (!selected) {
      Alert.alert("Falta el producto", "Elige qué producto vas a ajustar.");
      return;
    }
    const parsed = parseFloat(value.replace(/,/g, ""));
    if (isNaN(parsed)) {
      Alert.alert("Cantidad inválida", "Ingresa un número válido.");
      return;
    }
    setSaving(true);
    try {
      if (mode === "add") {
        await adjustStock(String(selected.id), parsed);
      } else {
        await setStock(String(selected.id), parsed);
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
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.closeBtn}
            >
              <X size={18} color={colors.textSecondary} strokeWidth={2.2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ajustar stock</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.form}>
              {!selected && (
                <View style={styles.field}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Producto</Text>
                    <TouchableOpacity
                      onPress={handleRefreshCatalog}
                      disabled={refreshing}
                      style={styles.refreshBtn}
                      hitSlop={8}
                    >
                      <RefreshCw
                        size={13}
                        color={pastel.pistachioDark}
                        strokeWidth={2.2}
                        style={refreshing ? { opacity: 0.4 } : undefined}
                      />
                      <Text style={styles.refreshBtnText}>Jalar productos</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.searchBox}>
                    <Search
                      size={15}
                      color={colors.textMuted}
                      strokeWidth={2}
                    />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Buscar producto..."
                      placeholderTextColor={colors.textMuted}
                      value={search}
                      onChangeText={setSearch}
                    />
                  </View>

                  {catalogState === "loading" && (
                    <View style={styles.catalogStatus}>
                      <ActivityIndicator color={pastel.pistachioDark} />
                      <Text style={styles.catalogStatusText}>
                        Cargando catálogo...
                      </Text>
                    </View>
                  )}
                  {catalogState === "error" && (
                    <Text style={styles.catalogStatusText}>
                      No se pudo cargar el catálogo. Revisa tu conexión.
                    </Text>
                  )}

                  {(catalogState === "ready" || catalogState === "offline") && (
                    <View style={styles.productList}>
                      {filtered.map((p) => (
                        <TouchableOpacity
                          key={p.id}
                          style={styles.productRow}
                          onPress={() => setSelected(p)}
                          activeOpacity={0.75}
                        >
                          {p.image ? (
                            <Image
                              source={{ uri: p.image }}
                              style={styles.productImg}
                            />
                          ) : (
                            <View
                              style={[
                                styles.productImg,
                                styles.productImgFallback,
                              ]}
                            >
                              <Package size={16} color={pastel.pistachioDark} />
                            </View>
                          )}
                          <Text style={styles.productRowName} numberOfLines={1}>
                            {p.name}
                          </Text>
                          <Text style={styles.productRowStock}>
                            {getStock(String(p.id))} u.
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {selected && (
                <>
                  <View style={styles.selectedCard}>
                    {selected.image ? (
                      <Image
                        source={{ uri: selected.image }}
                        style={styles.selectedImg}
                      />
                    ) : (
                      <View
                        style={[styles.selectedImg, styles.productImgFallback]}
                      >
                        <Package size={22} color={pastel.pistachioDark} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedName}>{selected.name}</Text>
                      <Text style={styles.selectedMeta}>
                        Stock actual:{" "}
                        <Text style={{ fontWeight: "800" }}>{currentQty}</Text>
                        {selected.price != null
                          ? ` · ${formatCurrency(selected.price)}`
                          : ""}
                      </Text>
                    </View>
                    {!presetProductId && (
                      <TouchableOpacity onPress={() => setSelected(null)}>
                        <Text style={styles.changeLink}>Cambiar</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.modeToggle}>
                    <TouchableOpacity
                      style={[
                        styles.modeBtn,
                        mode === "add" && styles.modeBtnActive,
                      ]}
                      onPress={() => setMode("add")}
                    >
                      <Text
                        style={[
                          styles.modeBtnText,
                          mode === "add" && styles.modeBtnTextActive,
                        ]}
                      >
                        Sumar / restar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modeBtn,
                        mode === "set" && styles.modeBtnActive,
                      ]}
                      onPress={() => setMode("set")}
                    >
                      <Text
                        style={[
                          styles.modeBtnText,
                          mode === "set" && styles.modeBtnTextActive,
                        ]}
                      >
                        Fijar cantidad
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>
                      {mode === "add"
                        ? "Cantidad a sumar (usa negativo para restar)"
                        : "Nueva cantidad exacta"}
                    </Text>
                    <View style={styles.qtyInputRow}>
                      {mode === "add" && (
                        <TouchableOpacity
                          style={styles.qtySignBtn}
                          onPress={() =>
                            setValue((v) => {
                              const n = parseFloat(v.replace(/,/g, "")) || 0;
                              return String(-Math.abs(n) || -1);
                            })
                          }
                        >
                          <Minus
                            size={16}
                            color={colors.expense}
                            strokeWidth={2.4}
                          />
                        </TouchableOpacity>
                      )}
                      <TextInput
                        style={styles.input}
                        placeholder={
                          mode === "add" ? "Ej: 5 o -2" : `Ej: ${currentQty}`
                        }
                        placeholderTextColor={colors.textMuted}
                        value={value}
                        onChangeText={setValue}
                        keyboardType="numbers-and-punctuation"
                      />
                      {mode === "add" && (
                        <TouchableOpacity
                          style={styles.qtySignBtn}
                          onPress={() =>
                            setValue((v) => {
                              const n = parseFloat(v.replace(/,/g, "")) || 0;
                              return String(Math.abs(n) || 1);
                            })
                          }
                        >
                          <Plus
                            size={16}
                            color={pastel.pistachioDark}
                            strokeWidth={2.4}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.saveBtnWrap,
                (saving || !selected) && { opacity: 0.5 },
              ]}
              onPress={handleSave}
              disabled={saving || !selected}
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
                  {saving ? "Guardando..." : "Guardar ajuste"}
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
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  field: { gap: 7 },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  refreshBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  refreshBtnText: { fontSize: 11, fontWeight: "700", color: pastel.pistachioDark },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  catalogStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  catalogStatusText: { fontSize: 12.5, color: colors.textSecondary },
  productList: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: "hidden",
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  productImg: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: pastel.pistachioLight,
  },
  productImgFallback: { alignItems: "center", justifyContent: "center" },
  productRowName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  productRowStock: { fontSize: 12, fontWeight: "700", color: colors.textMuted },
  selectedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 12,
  },
  selectedImg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: pastel.pistachioLight,
  },
  selectedName: { fontSize: 14, fontWeight: "700", color: colors.text },
  selectedMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  changeLink: { fontSize: 12, fontWeight: "700", color: pastel.pistachioDark },
  modeToggle: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  modeBtnActive: { backgroundColor: pastel.pistachioLight },
  modeBtnText: { fontSize: 12.5, color: colors.textMuted, fontWeight: "600" },
  modeBtnTextActive: { color: pastel.pistachioDark, fontWeight: "700" },
  qtyInputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtySignBtn: {
    width: 40,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    fontWeight: "500",
    textAlign: "center",
  },
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
