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
  X,
  Search,
  Plus,
  Minus,
  Package,
  ShoppingBag,
  Store,
  WifiOff,
  CalendarDays,
  RefreshCw,
} from "lucide-react-native";
import { useActivities } from "../context/ActivityContext";
import { useAgendaEvents } from "../context/AgendaEventContext";
import { NumberInput } from "../components/NumberInput";
import { getCatalog, forceRefreshCatalog } from "../services/catalogService";
import { DateField } from "../components/DateField";
import { ModalHeader } from "../components/ModalHeader";
import { GradientButton } from "../components/GradientButton";
import { FormField, LabeledInput } from "../components/FormField";
import { bold } from "../theme/boldTheme";
import { formatCurrency, formatDate } from "../utils/formatters";
import { ActivityType, ActivityItem, CatalogProduct } from "../types";

const TYPES: { key: ActivityType; label: string; Icon: any }[] = [
  { key: "order", label: "Pedido", Icon: ShoppingBag },
  { key: "event_sale", label: "Venta en evento", Icon: Store },
];

type ToggleKey = "confirmed" | "paid" | "delivered";

const STATUS_TOGGLES: {
  key: ToggleKey;
  label: string;
  activeBg: string;
  activeText: string;
}[] = [
  {
    key: "confirmed",
    label: "Confirmado",
    activeBg: bold.blueLight,
    activeText: bold.black,
  },
  {
    key: "paid",
    label: "Pagado",
    activeBg: bold.mintLight,
    activeText: bold.black,
  },
  {
    key: "delivered",
    label: "Entregado",
    activeBg: bold.pinkLight,
    activeText: bold.black,
  },
];

export function NewActivityScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const activityId = route.params?.activityId as string | undefined;
  const { getActivity, addActivity, updateActivity } = useActivities();
  const { showOffline } = useConnectivity();
  const { events } = useAgendaEvents();
  const existing = activityId ? getActivity(activityId) : undefined;
  const isEditing = !!existing;

  const [type, setType] = useState<ActivityType>(
    existing?.type === "event_sale" ? "event_sale" : "order",
  );
  const [title, setTitle] = useState(existing?.title ?? "");
  const [date, setDate] = useState(
    existing?.date ?? new Date().toISOString().split("T")[0],
  );
  const [confirmed, setConfirmed] = useState(existing?.confirmed ?? false);
  const [paid, setPaid] = useState(existing?.paid ?? false);
  const [delivered, setDelivered] = useState(existing?.delivered ?? false);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [channel, setChannel] = useState(existing?.channel ?? "");
  const [eventId, setEventId] = useState<string | undefined>(existing?.eventId);
  const [items, setItems] = useState<ActivityItem[]>(existing?.items ?? []);
  const [saving, setSaving] = useState(false);

  // ── Catálogo remoto ─────────────────────────────────────
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [catalogState, setCatalogState] = useState<
    "loading" | "ready" | "offline" | "error"
  >("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    getCatalog()
      .then(({ productos, fromCache }) => {
        if (!mounted) return;
        setCatalog(productos);
        setCatalogState(fromCache ? "offline" : "ready");
      })
      .catch(() => {
        if (mounted) setCatalogState("error");
      });
    return () => {
      mounted = false;
    };
  }, []);

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

  const filteredCatalog = useMemo(() => {
    if (!search.trim()) return catalog;
    const q = search.trim().toLowerCase();
    return catalog.filter((p) => p.name.toLowerCase().includes(q));
  }, [catalog, search]);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.date.localeCompare(b.date)),
    [events],
  );

  // En venta de evento lo que cuenta es lo VENDIDO (qtySold); si aún no se
  // ajustó, se asume que se vendió todo lo llevado (qty). En pedidos siempre
  // es la cantidad del pedido.
  const soldQtyOf = (it: ActivityItem) =>
    type === "event_sale" ? it.qtySold ?? it.qty : it.qty;
  const orderTotal = items.reduce(
    (sum, it) => sum + soldQtyOf(it) * it.unitPrice,
    0,
  );

  function toggleStatus(key: ToggleKey) {
    if (key === "confirmed") setConfirmed((v) => !v);
    else if (key === "paid") setPaid((v) => !v);
    else setDelivered((v) => !v);
  }

  function addProductToItems(p: CatalogProduct) {
    setItems((prev) => {
      const existingItem = prev.find((it) => it.productId === String(p.id));
      if (existingItem) {
        return prev.map((it) =>
          it.productId === String(p.id) ? { ...it, qty: it.qty + 1 } : it,
        );
      }
      return [
        ...prev,
        {
          productId: String(p.id),
          name: p.name,
          qty: 1,
          unitPrice: p.price ?? 0,
          image: p.image ?? undefined,
        },
      ];
    });
  }

  function changeQty(index: number, delta: number) {
    setItems((prev) => {
      const next = [...prev];
      const newQty = next[index].qty + delta;
      if (newQty <= 0) {
        next.splice(index, 1);
        return next;
      }
      next[index] = { ...next[index], qty: newQty };
      return next;
    });
  }

  function setQtyDirect(index: number, value: string) {
    const parsed = parseInt(value.replace(/[^0-9]/g, ""), 10);
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], qty: isNaN(parsed) ? 0 : parsed };
      return next;
    });
  }

  // Precio unitario por producto, con decimales (es dinero). Editable incluso
  // para productos del catálogo, p.ej. un pedido especial a otro precio.
  function setPrice(index: number, n: number) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], unitPrice: n };
      return next;
    });
  }

  // Venta de evento: cuántas unidades se vendieron realmente de este ítem.
  function setSoldDirect(index: number, value: string) {
    const parsed = parseInt(value.replace(/[^0-9]/g, ""), 10);
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], qtySold: isNaN(parsed) ? 0 : parsed };
      return next;
    });
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addCustomItem() {
    setItems((prev) => [...prev, { name: "", qty: 1, unitPrice: 0 }]);
  }

  function updateCustomItem(
    index: number,
    field: "name" | "unitPrice",
    value: string,
  ) {
    setItems((prev) => {
      const next = [...prev];
      if (field === "name") {
        next[index] = { ...next[index], name: value };
      } else {
        const parsed = parseFloat(value.replace(/,/g, ""));
        next[index] = { ...next[index], unitPrice: isNaN(parsed) ? 0 : parsed };
      }
      return next;
    });
  }

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert(
        "Falta el título",
        type === "order"
          ? "Escribe el nombre del cliente o pedido."
          : "Escribe un título para la venta.",
      );
      return;
    }
    if (items.length === 0) {
      Alert.alert("Sin productos", "Agrega al menos un producto.");
      return;
    }

    setSaving(true);
    try {
      // En venta de evento guardamos qtySold (lo vendido) para que el stock se
      // descuente por lo realmente vendido; en pedido no aplica.
      const finalItems =
        type === "event_sale"
          ? items.map((it) => ({ ...it, qtySold: it.qtySold ?? it.qty }))
          : items.map((it) => ({ ...it, qtySold: undefined }));

      const payload = {
        type,
        title: title.trim(),
        date,
        confirmed,
        paid,
        delivered,
        items: finalItems,
        totalAmount: orderTotal,
        notes: notes.trim() || undefined,
        channel: channel.trim() || undefined,
        eventId: type === "event_sale" ? eventId : undefined,
        relatedEntryId: existing?.relatedEntryId,
        stockDeducted: existing?.stockDeducted,
      };
      if (isEditing && activityId) {
        await updateActivity(activityId, payload);
      } else {
        await addActivity(payload);
      }
      navigation.goBack();
    } catch (err) {
      if (isNetworkError(err)) {
        showOffline();
      } else {
        const message =
          err instanceof Error
            ? err.message
            : "No se pudo guardar. Intenta de nuevo.";
        Alert.alert("Error", message);
      }
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
          <ModalHeader
            title={`${isEditing ? "Editar" : "Nuevo"} ${type === "order" ? "pedido" : "venta de evento"}`}
          />

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Tipo */}
            <View style={styles.typeToggle}>
              {TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.typeBtn,
                    type === t.key && styles.typeBtnActive,
                  ]}
                  onPress={() => setType(t.key)}
                >
                  <t.Icon
                    size={15}
                    color={type === t.key ? bold.pink : bold.textMuted}
                    strokeWidth={2}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      type === t.key && styles.typeBtnTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.form}>
              <LabeledInput
                label={type === "order" ? "Cliente / Pedido" : "Título"}
                placeholder={
                  type === "order"
                    ? "Ej: Ana — Clickers x10"
                    : "Ej: Venta feria Maker Lima"
                }
                value={title}
                onChangeText={setTitle}
              />

              <FormField label="Fecha">
                <DateField value={date} onChange={setDate} />
              </FormField>

              {/* ── Vincular a un evento de la Agenda (solo ventas de evento) ── */}
              {type === "event_sale" && (
                <FormField label="Evento (opcional)">
                  {sortedEvents.length === 0 ? (
                    <Text style={styles.catalogStatusText}>
                      No tienes eventos en tu Agenda todavía.
                    </Text>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        {sortedEvents.map((ev) => (
                          <TouchableOpacity
                            key={ev.id}
                            style={[
                              styles.eventChip,
                              eventId === ev.id && styles.eventChipActive,
                            ]}
                            onPress={() =>
                              setEventId(eventId === ev.id ? undefined : ev.id)
                            }
                          >
                            <CalendarDays
                              size={12}
                              color={
                                eventId === ev.id
                                  ? bold.pink
                                  : bold.textMuted
                              }
                              strokeWidth={2}
                            />
                            <Text
                              style={[
                                styles.eventChipText,
                                eventId === ev.id && styles.eventChipTextActive,
                              ]}
                              numberOfLines={1}
                            >
                              {ev.title} · {formatDate(ev.date)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  )}
                </FormField>
              )}

              <FormField label="Estado del pedido">
                <View style={styles.statusRow}>
                  {STATUS_TOGGLES.map((s) => {
                    const active =
                      s.key === "confirmed"
                        ? confirmed
                        : s.key === "paid"
                          ? paid
                          : delivered;
                    return (
                      <TouchableOpacity
                        key={s.key}
                        style={[
                          styles.statusChip,
                          active && {
                            backgroundColor: s.activeBg,
                            borderColor: bold.black,
                          },
                        ]}
                        onPress={() => toggleStatus(s.key)}
                      >
                        <Text
                          style={[
                            styles.statusChipText,
                            active && {
                              color: s.activeText,
                              fontWeight: "700",
                            },
                          ]}
                        >
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </FormField>

              {/* ── Selector de productos ── */}
              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Productos</Text>
                  <TouchableOpacity
                    onPress={handleRefreshCatalog}
                    disabled={refreshing}
                    style={styles.refreshBtn}
                    hitSlop={8}
                  >
                    <RefreshCw
                      size={13}
                      color={bold.pink}
                      strokeWidth={2.2}
                      style={refreshing ? { opacity: 0.4 } : undefined}
                    />
                    <Text style={styles.refreshBtnText}>Jalar productos</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.searchBox}>
                  <Search size={15} color={bold.textMuted} strokeWidth={2} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar en tu catálogo..."
                    placeholderTextColor={bold.textMuted}
                    value={search}
                    onChangeText={setSearch}
                  />
                </View>

                {catalogState === "loading" && (
                  <View style={styles.catalogStatus}>
                    <ActivityIndicator color={bold.pink} />
                    <Text style={styles.catalogStatusText}>
                      Cargando catálogo...
                    </Text>
                  </View>
                )}
                {catalogState === "error" && (
                  <View style={styles.catalogStatus}>
                    <WifiOff
                      size={16}
                      color={bold.textMuted}
                      strokeWidth={2}
                    />
                    <Text style={styles.catalogStatusText}>
                      No se pudo cargar el catálogo. Puedes agregar un ítem
                      manual abajo.
                    </Text>
                  </View>
                )}

                {(catalogState === "ready" || catalogState === "offline") && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.catalogRow}
                  >
                    {filteredCatalog.map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={styles.productCard}
                        onPress={() => addProductToItems(p)}
                        activeOpacity={0.8}
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
                            <Package size={20} color={bold.pink} />
                          </View>
                        )}
                        <Text style={styles.productName} numberOfLines={2}>
                          {p.name}
                        </Text>
                        <Text style={styles.productPrice}>
                          {p.price != null
                            ? formatCurrency(p.price)
                            : "A cotizar"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {filteredCatalog.length === 0 && (
                      <Text style={styles.catalogStatusText}>
                        Sin resultados
                      </Text>
                    )}
                  </ScrollView>
                )}

                <TouchableOpacity
                  style={styles.addCustomBtn}
                  onPress={addCustomItem}
                >
                  <Plus size={14} color={bold.pink} strokeWidth={2.4} />
                  <Text style={styles.addCustomBtnText}>
                    Agregar ítem manual
                  </Text>
                </TouchableOpacity>

                {/* Items seleccionados */}
                {items.length > 0 && (
                  <View style={styles.itemsList}>
                    {type === "event_sale" && (
                      <Text style={styles.soldHint}>
                        Pon cuánto vendiste de cada uno — solo eso se descuenta
                        de tu stock.
                      </Text>
                    )}
                    {items.map((item, i) => (
                      <View key={i} style={styles.itemRow}>
                        {item.image ? (
                          <Image
                            source={{ uri: item.image }}
                            style={styles.itemThumb}
                          />
                        ) : item.productId ? (
                          <View
                            style={[styles.itemThumb, styles.itemThumbFallback]}
                          >
                            <Package
                              size={12}
                              color={bold.pink}
                              strokeWidth={2}
                            />
                          </View>
                        ) : null}

                        {item.productId ? (
                          <Text style={styles.itemName} numberOfLines={1}>
                            {item.name}
                          </Text>
                        ) : (
                          <TextInput
                            style={[styles.itemName, styles.itemNameInput]}
                            placeholder="Nombre del ítem"
                            placeholderTextColor={bold.textMuted}
                            value={item.name}
                            onChangeText={(v) => updateCustomItem(i, "name", v)}
                          />
                        )}

                        <View style={styles.qtyStepper}>
                          <TouchableOpacity
                            onPress={() => changeQty(i, -1)}
                            style={styles.qtyBtn}
                          >
                            <Minus
                              size={12}
                              color={bold.pink}
                              strokeWidth={2.5}
                            />
                          </TouchableOpacity>
                          <TextInput
                            style={styles.qtyInput}
                            keyboardType="number-pad"
                            value={String(item.qty)}
                            onChangeText={(v) => setQtyDirect(i, v)}
                            selectTextOnFocus
                          />
                          <TouchableOpacity
                            onPress={() => changeQty(i, 1)}
                            style={styles.qtyBtn}
                          >
                            <Plus
                              size={12}
                              color={bold.pink}
                              strokeWidth={2.5}
                            />
                          </TouchableOpacity>
                        </View>

                        {type === "event_sale" && (
                          <View style={styles.soldWrap}>
                            <Text style={styles.soldLabel}>vendí</Text>
                            <TextInput
                              style={styles.soldInput}
                              keyboardType="number-pad"
                              value={String(item.qtySold ?? item.qty)}
                              onChangeText={(v) => setSoldDirect(i, v)}
                              selectTextOnFocus
                            />
                          </View>
                        )}

                        <NumberInput
                          style={styles.itemPriceInput}
                          placeholder="0.00"
                          placeholderTextColor={bold.textMuted}
                          value={item.unitPrice}
                          onChangeValue={(n) => setPrice(i, n)}
                          selectTextOnFocus
                        />

                        <Text style={styles.itemSubtotal}>
                          {formatCurrency(soldQtyOf(item) * item.unitPrice)}
                        </Text>
                        <TouchableOpacity
                          onPress={() => removeItem(i)}
                          hitSlop={8}
                        >
                          <X
                            size={14}
                            color={bold.textMuted}
                            strokeWidth={2.2}
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>
                        {type === "event_sale" ? "Total vendido" : "Total"}
                      </Text>
                      <Text style={styles.totalValue}>
                        {formatCurrency(orderTotal)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <LabeledInput
                label="Canal (opcional)"
                placeholder="Feria, online, pedido directo..."
                value={channel}
                onChangeText={setChannel}
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
              label="Guardar"
              loading={saving}
              onPress={handleSave}
              colorsRange={[bold.pink, bold.pink]}
              shadowColor={bold.pink}
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
  typeToggle: {
    flexDirection: "row",
    margin: 20,
    gap: 8,
    backgroundColor: bold.bg,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1.5,
    borderColor: bold.black,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
  },
  typeBtnActive: { backgroundColor: bold.pinkLight },
  typeBtnText: { fontSize: 13, color: bold.textMuted, fontWeight: "600" },
  typeBtnTextActive: { color: bold.pink, fontWeight: "700" },
  form: { paddingHorizontal: 20, gap: 16, paddingBottom: 20 },
  field: { gap: 7 },
  label: {
    fontSize: 12,
    color: bold.textSecondary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  refreshBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: bold.pink,
    textTransform: "none",
    letterSpacing: 0,
  },
  notesInput: { height: 80, textAlignVertical: "top" },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 100,
    backgroundColor: bold.bg,
    borderWidth: 1.5,
    borderColor: bold.black,
  },
  statusChipText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: bold.textMuted,
  },
  eventChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 100,
    backgroundColor: bold.bg,
    borderWidth: 1.5,
    borderColor: bold.black,
    maxWidth: 220,
  },
  eventChipActive: {
    backgroundColor: bold.pinkLight,
    borderColor: bold.pink,
  },
  eventChipText: { fontSize: 12, fontWeight: "600", color: bold.textMuted },
  eventChipTextActive: { color: bold.pink, fontWeight: "700" },
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
  catalogRow: { marginBottom: 12 },
  productCard: {
    width: 96,
    marginRight: 10,
    backgroundColor: bold.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: bold.black,
    padding: 8,
    gap: 4,
  },
  productImg: {
    width: "100%",
    height: 64,
    borderRadius: 10,
    backgroundColor: bold.pinkLight,
  },
  productImgFallback: { alignItems: "center", justifyContent: "center" },
  productName: {
    fontSize: 11,
    fontWeight: "700",
    color: bold.black,
    minHeight: 28,
  },
  productPrice: { fontSize: 11, fontWeight: "700", color: bold.pink },
  addCustomBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: bold.pink,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  addCustomBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: bold.pink,
  },
  itemsList: {
    backgroundColor: bold.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: bold.black,
    padding: 10,
    gap: 10,
  },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemThumb: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: bold.pinkLight,
  },
  itemThumbFallback: { alignItems: "center", justifyContent: "center" },
  itemName: { flex: 1, fontSize: 12.5, fontWeight: "600", color: bold.black },
  itemNameInput: {
    backgroundColor: bold.bg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: bold.black,
  },
  qtyStepper: { flexDirection: "row", alignItems: "center", gap: 6 },
  soldWrap: { alignItems: "center", gap: 1 },
  soldLabel: {
    fontSize: 8.5,
    fontWeight: "700",
    color: bold.textMuted,
    textTransform: "uppercase",
  },
  soldInput: {
    width: 42,
    fontSize: 12.5,
    fontWeight: "700",
    color: bold.pinkDark,
    backgroundColor: bold.pinkLight,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: bold.black,
    textAlign: "center",
  },
  soldHint: {
    fontSize: 11.5,
    color: bold.textSecondary,
    marginBottom: 8,
    lineHeight: 15,
  },
  qtyBtn: {
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor: bold.pinkLight,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyInput: {
    fontSize: 12.5,
    fontWeight: "700",
    color: bold.black,
    minWidth: 28,
    textAlign: "center",
    paddingVertical: 2,
  },
  itemPriceInput: {
    width: 64,
    fontSize: 12.5,
    color: bold.black,
    fontWeight: "600",
    backgroundColor: bold.bg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: bold.black,
    textAlign: "right",
  },
  itemSubtotal: {
    fontSize: 12.5,
    fontWeight: "700",
    color: bold.black,
    minWidth: 56,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: bold.black,
  },
  totalLabel: { fontSize: 13, fontWeight: "700", color: bold.black },
  totalValue: { fontSize: 17, fontWeight: "800", color: bold.pink },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: bold.black },
});
