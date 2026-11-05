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
import { useConnectivity } from "../context/ConnectivityContext";
import { isNetworkError } from "../lib/net";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  Search,
  Package,
  Plus,
  Minus,
  RefreshCw,
} from "lucide-react-native";
import { useInventory } from "../context/InventoryContext";
import { getCatalog, forceRefreshCatalog } from "../services/catalogService";
import { ModalHeader } from "../components/ModalHeader";
import { GradientButton } from "../components/GradientButton";
import { FormField } from "../components/FormField";
import { bold, hardShadow } from "../theme/boldTheme";
import { formatCurrency, formatDateTime } from "../utils/formatters";
import { CatalogProduct } from "../types";

type Mode = "add" | "set";

export function AdjustStockScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const presetProductId = route.params?.productId as string | undefined;

  const { getStock, adjustStock, setStock, getLastUpdated, getHistory } =
    useInventory();
  const { showOffline } = useConnectivity();

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
        await adjustStock(
          String(selected.id),
          parsed,
          parsed > 0 ? "reposicion" : "manual",
        );
      } else {
        await setStock(String(selected.id), parsed, "manual");
      }
      navigation.goBack();
    } catch (err) {
      if (isNetworkError(err)) showOffline();
      else Alert.alert("Error", "No se pudo guardar. Intenta de nuevo.");
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
          <ModalHeader title="Ajustar stock" />

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
                        color={bold.blue}
                        strokeWidth={2.2}
                        style={refreshing ? { opacity: 0.4 } : undefined}
                      />
                      <Text style={styles.refreshBtnText}>Jalar productos</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.searchBox}>
                    <Search
                      size={15}
                      color={bold.textMuted}
                      strokeWidth={2}
                    />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Buscar producto..."
                      placeholderTextColor={bold.textMuted}
                      value={search}
                      onChangeText={setSearch}
                    />
                  </View>

                  {catalogState === "loading" && (
                    <View style={styles.catalogStatus}>
                      <ActivityIndicator color={bold.blue} />
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
                              <Package size={16} color={bold.blue} />
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
                        <Package size={22} color={bold.blue} />
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

                  {(() => {
                    const lastUpdated = getLastUpdated(String(selected.id));
                    const historyEntries = getHistory(String(selected.id)).slice(
                      0,
                      8,
                    );
                    return (
                      <View style={styles.historyBlock}>
                        <Text style={styles.lastUpdatedText}>
                          {lastUpdated
                            ? `Última actualización: ${formatDateTime(lastUpdated)}`
                            : "Sin movimientos registrados todavía"}
                        </Text>

                        {historyEntries.length > 0 && (
                          <View style={styles.historyList}>
                            {historyEntries.map((m) => {
                              const isPositive = m.delta > 0;
                              return (
                                <View key={m.id} style={styles.historyRow}>
                                  <Text style={styles.historyDate}>
                                    {formatDateTime(m.createdAt)}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.historyDelta,
                                      {
                                        color: isPositive
                                          ? bold.blue
                                          : bold.red,
                                      },
                                    ]}
                                  >
                                    {isPositive ? "+" : ""}
                                    {m.delta}
                                  </Text>
                                  <Text style={styles.historyResult}>
                                    → {m.resultingQty} u.
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })()}

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

                  <FormField
                    label={
                      mode === "add"
                        ? "Cantidad a sumar (usa negativo para restar)"
                        : "Nueva cantidad exacta"
                    }
                  >
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
                            color={bold.red}
                            strokeWidth={2.4}
                          />
                        </TouchableOpacity>
                      )}
                      <TextInput
                        style={styles.input}
                        placeholder={
                          mode === "add" ? "Ej: 5 o -2" : `Ej: ${currentQty}`
                        }
                        placeholderTextColor={bold.textMuted}
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
                            color={bold.blue}
                            strokeWidth={2.4}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </FormField>
                </>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <GradientButton
              label="Guardar ajuste"
              loading={saving}
              disabled={!selected}
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
  root: {
    flex: 1,
    backgroundColor: bold.bg,
  },
  scroll: { flex: 1 },
  form: { paddingHorizontal: 20, paddingTop: 20, gap: 16, paddingBottom: 20 },
  field: { gap: 7 },
  label: {
    fontSize: 12,
    color: bold.textSecondary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  refreshBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  refreshBtnText: { fontSize: 11, fontWeight: "700", color: bold.blue },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: bold.surface,
    borderWidth: 1.5,
    borderColor: bold.black,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: bold.black },
  catalogStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  catalogStatusText: { fontSize: 12.5, color: bold.textSecondary },
  productList: {
    backgroundColor: bold.surface,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: bold.black,
    overflow: "hidden",
    ...hardShadow(3),
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: bold.black,
  },
  productImg: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: bold.blueLight,
  },
  productImgFallback: { alignItems: "center", justifyContent: "center" },
  productRowName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: bold.black,
  },
  productRowStock: { fontSize: 12, fontWeight: "700", color: bold.textMuted },
  selectedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: bold.surface,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: bold.black,
    padding: 12,
    ...hardShadow(3),
  },
  selectedImg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: bold.blueLight,
  },
  selectedName: { fontSize: 14, fontWeight: "700", color: bold.black },
  selectedMeta: { fontSize: 12, color: bold.textSecondary, marginTop: 2 },
  changeLink: { fontSize: 12, fontWeight: "700", color: bold.blue },
  historyBlock: { gap: 8 },
  lastUpdatedText: {
    fontSize: 11.5,
    color: bold.textMuted,
    fontStyle: "italic",
  },
  historyList: {
    backgroundColor: bold.surface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: bold.black,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: bold.black,
  },
  historyDate: { flex: 1, fontSize: 11.5, color: bold.textSecondary },
  historyDelta: { fontSize: 12.5, fontWeight: "800", minWidth: 34 },
  historyResult: { fontSize: 11.5, color: bold.textMuted },
  modeToggle: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: bold.bg,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1.5,
    borderColor: bold.black,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  modeBtnActive: { backgroundColor: bold.blueLight },
  modeBtnText: { fontSize: 12.5, color: bold.textMuted, fontWeight: "600" },
  modeBtnTextActive: { color: bold.blue, fontWeight: "700" },
  qtyInputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtySignBtn: {
    width: 40,
    height: 48,
    borderRadius: 12,
    backgroundColor: bold.bg,
    borderWidth: 1.5,
    borderColor: bold.black,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    backgroundColor: bold.surface,
    borderWidth: 1.5,
    borderColor: bold.black,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: bold.black,
    fontWeight: "500",
    textAlign: "center",
  },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: bold.black },
});
