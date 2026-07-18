import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
  ActivityIndicator, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Check, X, Search, Plus, Minus, Package, ShoppingBag,
  CalendarDays, Sparkles, WifiOff,
} from 'lucide-react-native';
import { useActivities } from '../context/ActivityContext';
import { getCatalog } from '../services/catalogService';
import { colors, pastel } from '../theme/colors';
import { formatCurrency } from '../utils/formatters';
import { ActivityType, ActivityStatus, ActivityItem, CatalogProduct } from '../types';

const TYPES: { key: ActivityType; label: string; Icon: any }[] = [
  { key: 'order',  label: 'Pedido',  Icon: ShoppingBag },
  { key: 'event',  label: 'Evento',  Icon: CalendarDays },
  { key: 'custom', label: 'Otro',    Icon: Sparkles },
];

const STATUSES: { key: ActivityStatus; label: string }[] = [
  { key: 'pending',     label: 'Pendiente' },
  { key: 'confirmed',   label: 'Confirmado' },
  { key: 'in_progress', label: 'En proceso' },
  { key: 'done',        label: 'Listo' },
  { key: 'cancelled',   label: 'Cancelado' },
];

export function NewActivityScreen() {
  const navigation = useNavigation();
  const route       = useRoute<any>();
  const activityId  = route.params?.activityId as string | undefined;
  const { getActivity, addActivity, updateActivity } = useActivities();
  const existing  = activityId ? getActivity(activityId) : undefined;
  const isEditing = !!existing;

  const [type,    setType]    = useState<ActivityType>(existing?.type ?? 'order');
  const [title,   setTitle]   = useState(existing?.title ?? '');
  const [date,    setDate]    = useState(existing?.date ?? new Date().toISOString().split('T')[0]);
  const [status,  setStatus]  = useState<ActivityStatus>(existing?.status ?? 'pending');
  const [notes,   setNotes]   = useState(existing?.notes ?? '');
  const [channel, setChannel] = useState(existing?.channel ?? '');
  const [items,   setItems]   = useState<ActivityItem[]>(existing?.items ?? []);
  const [manualTotal, setManualTotal] = useState(
    existing && existing.type !== 'order' && existing.totalAmount != null ? String(existing.totalAmount) : ''
  );
  const [saving,  setSaving]  = useState(false);

  // ── Catálogo remoto ─────────────────────────────────────
  const [catalog,     setCatalog]     = useState<CatalogProduct[]>([]);
  const [catalogState, setCatalogState] = useState<'loading' | 'ready' | 'offline' | 'error'>('loading');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (type !== 'order') return;
    let mounted = true;
    getCatalog()
      .then(({ productos, fromCache }) => {
        if (!mounted) return;
        setCatalog(productos);
        setCatalogState(fromCache ? 'offline' : 'ready');
      })
      .catch(() => { if (mounted) setCatalogState('error'); });
    return () => { mounted = false; };
  }, [type]);

  const filteredCatalog = useMemo(() => {
    if (!search.trim()) return catalog;
    const q = search.trim().toLowerCase();
    return catalog.filter(p => p.name.toLowerCase().includes(q));
  }, [catalog, search]);

  const orderTotal = items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0);

  function addProductToItems(p: CatalogProduct) {
    setItems(prev => {
      const existingItem = prev.find(it => it.productId === String(p.id));
      if (existingItem) {
        return prev.map(it =>
          it.productId === String(p.id) ? { ...it, qty: it.qty + 1 } : it
        );
      }
      return [...prev, { productId: String(p.id), name: p.name, qty: 1, unitPrice: p.price ?? 0 }];
    });
  }

  function changeQty(index: number, delta: number) {
    setItems(prev => {
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

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index));
  }

  function addCustomItem() {
    setItems(prev => [...prev, { name: '', qty: 1, unitPrice: 0 }]);
  }

  function updateCustomItem(index: number, field: 'name' | 'unitPrice', value: string) {
    setItems(prev => {
      const next = [...prev];
      if (field === 'name') {
        next[index] = { ...next[index], name: value };
      } else {
        const parsed = parseFloat(value.replace(/,/g, ''));
        next[index] = { ...next[index], unitPrice: isNaN(parsed) ? 0 : parsed };
      }
      return next;
    });
  }

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Falta el título', type === 'order' ? 'Escribe el nombre del cliente o pedido.' : 'Escribe un título.');
      return;
    }
    if (type === 'order' && items.length === 0) {
      Alert.alert('Sin productos', 'Agrega al menos un producto al pedido.');
      return;
    }

    let totalAmount: number | undefined;
    if (type === 'order') {
      totalAmount = orderTotal;
    } else if (manualTotal.trim() !== '') {
      const parsed = parseFloat(manualTotal.replace(/,/g, ''));
      totalAmount = isNaN(parsed) ? undefined : parsed;
    }

    setSaving(true);
    try {
      const payload = {
        type,
        title: title.trim(),
        date,
        status,
        items: type === 'order' ? items : undefined,
        totalAmount,
        notes: notes.trim() || undefined,
        channel: channel.trim() || undefined,
        relatedEntryId: existing?.relatedEntryId,
      };
      if (isEditing && activityId) {
        await updateActivity(activityId, payload);
      } else {
        await addActivity(payload);
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'No se pudo guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
              <X size={18} color={colors.textSecondary} strokeWidth={2.2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEditing ? 'Editar actividad' : 'Nueva actividad'}</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* Tipo */}
            <View style={styles.typeToggle}>
              {TYPES.map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeBtn, type === t.key && styles.typeBtnActive]}
                  onPress={() => setType(t.key)}
                >
                  <t.Icon size={15} color={type === t.key ? pastel.yellowDark : colors.textMuted} strokeWidth={2} />
                  <Text style={[styles.typeBtnText, type === t.key && styles.typeBtnTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>{type === 'order' ? 'Cliente / Pedido' : 'Título'}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={type === 'order' ? 'Ej: Ana — Clickers x10' : 'Ej: Feria Maker Lima'}
                  placeholderTextColor={colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Fecha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  value={date}
                  onChangeText={setDate}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Estado</Text>
                <View style={styles.statusRow}>
                  {STATUSES.map(s => (
                    <TouchableOpacity
                      key={s.key}
                      style={[styles.statusChip, status === s.key && styles.statusChipActive]}
                      onPress={() => setStatus(s.key)}
                    >
                      <Text style={[styles.statusChipText, status === s.key && styles.statusChipTextActive]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* ── Selector de productos (solo pedidos) ── */}
              {type === 'order' && (
                <View style={styles.field}>
                  <Text style={styles.label}>Productos</Text>

                  <View style={styles.searchBox}>
                    <Search size={15} color={colors.textMuted} strokeWidth={2} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Buscar en tu catálogo..."
                      placeholderTextColor={colors.textMuted}
                      value={search}
                      onChangeText={setSearch}
                    />
                  </View>

                  {catalogState === 'loading' && (
                    <View style={styles.catalogStatus}>
                      <ActivityIndicator color={pastel.yellowDark} />
                      <Text style={styles.catalogStatusText}>Cargando catálogo...</Text>
                    </View>
                  )}
                  {catalogState === 'error' && (
                    <View style={styles.catalogStatus}>
                      <WifiOff size={16} color={colors.textMuted} strokeWidth={2} />
                      <Text style={styles.catalogStatusText}>No se pudo cargar el catálogo. Puedes agregar un ítem manual abajo.</Text>
                    </View>
                  )}
                  {catalogState === 'offline' && (
                    <Text style={styles.offlineHint}>Mostrando catálogo guardado (sin conexión)</Text>
                  )}

                  {(catalogState === 'ready' || catalogState === 'offline') && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catalogRow}>
                      {filteredCatalog.map(p => (
                        <TouchableOpacity key={p.id} style={styles.productCard} onPress={() => addProductToItems(p)} activeOpacity={0.8}>
                          {p.image
                            ? <Image source={{ uri: p.image }} style={styles.productImg} />
                            : <View style={[styles.productImg, styles.productImgFallback]}><Package size={20} color={pastel.yellowDark} /></View>
                          }
                          <Text style={styles.productName} numberOfLines={2}>{p.name}</Text>
                          <Text style={styles.productPrice}>{p.price != null ? formatCurrency(p.price) : 'A cotizar'}</Text>
                        </TouchableOpacity>
                      ))}
                      {filteredCatalog.length === 0 && (
                        <Text style={styles.catalogStatusText}>Sin resultados</Text>
                      )}
                    </ScrollView>
                  )}

                  <TouchableOpacity style={styles.addCustomBtn} onPress={addCustomItem}>
                    <Plus size={14} color={pastel.yellowDark} strokeWidth={2.4} />
                    <Text style={styles.addCustomBtnText}>Agregar ítem manual</Text>
                  </TouchableOpacity>

                  {/* Items seleccionados */}
                  {items.length > 0 && (
                    <View style={styles.itemsList}>
                      {items.map((item, i) => (
                        <View key={i} style={styles.itemRow}>
                          {item.productId ? (
                            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                          ) : (
                            <TextInput
                              style={[styles.itemName, styles.itemNameInput]}
                              placeholder="Nombre del ítem"
                              placeholderTextColor={colors.textMuted}
                              value={item.name}
                              onChangeText={(v) => updateCustomItem(i, 'name', v)}
                            />
                          )}

                          {item.productId ? (
                            <View style={styles.qtyStepper}>
                              <TouchableOpacity onPress={() => changeQty(i, -1)} style={styles.qtyBtn}>
                                <Minus size={12} color={pastel.yellowDark} strokeWidth={2.5} />
                              </TouchableOpacity>
                              <Text style={styles.qtyText}>{item.qty}</Text>
                              <TouchableOpacity onPress={() => changeQty(i, 1)} style={styles.qtyBtn}>
                                <Plus size={12} color={pastel.yellowDark} strokeWidth={2.5} />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TextInput
                              style={styles.itemPriceInput}
                              placeholder="0.00"
                              placeholderTextColor={colors.textMuted}
                              keyboardType="decimal-pad"
                              value={item.unitPrice ? String(item.unitPrice) : ''}
                              onChangeText={(v) => updateCustomItem(i, 'unitPrice', v)}
                            />
                          )}

                          <Text style={styles.itemSubtotal}>{formatCurrency(item.qty * item.unitPrice)}</Text>
                          <TouchableOpacity onPress={() => removeItem(i)} hitSlop={8}>
                            <X size={14} color={colors.textMuted} strokeWidth={2.2} />
                          </TouchableOpacity>
                        </View>
                      ))}
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{formatCurrency(orderTotal)}</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Total manual para evento / otro */}
              {type !== 'order' && (
                <View style={styles.field}>
                  <Text style={styles.label}>Monto (opcional, S/)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    value={manualTotal}
                    onChangeText={setManualTotal}
                    keyboardType="decimal-pad"
                  />
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.label}>Canal (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Feria, online, pedido directo..."
                  placeholderTextColor={colors.textMuted}
                  value={channel}
                  onChangeText={setChannel}
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

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtnWrap, saving && { opacity: 0.65 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[pastel.yellow, pastel.yellowDark]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.saveBtn}
              >
                {!saving && <Check size={18} color={colors.white} strokeWidth={2.5} />}
                <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Guardar actividad'}</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 100,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  scroll: { flex: 1 },
  typeToggle: {
    flexDirection: 'row', margin: 20, gap: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16, padding: 4,
    borderWidth: 1.5, borderColor: colors.border,
  },
  typeBtn: {
    flex: 1, paddingVertical: 11,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 12,
  },
  typeBtnActive: { backgroundColor: pastel.yellowLight },
  typeBtnText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  typeBtnTextActive: { color: pastel.yellowDark, fontWeight: '700' },
  form: { paddingHorizontal: 20, gap: 16, paddingBottom: 20 },
  field: { gap: 7 },
  label: { fontSize: 12, color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: colors.text, fontWeight: '500',
  },
  notesInput: { height: 80, textAlignVertical: 'top' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100,
    backgroundColor: colors.surfaceAlt, borderWidth: 1.5, borderColor: colors.border,
  },
  statusChipActive: { backgroundColor: pastel.yellowLight, borderColor: pastel.yellowDark },
  statusChipText: { fontSize: 12.5, fontWeight: '600', color: colors.textMuted },
  statusChipTextActive: { color: pastel.yellowDark, fontWeight: '700' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  catalogStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  catalogStatusText: { fontSize: 12.5, color: colors.textSecondary },
  offlineHint: { fontSize: 11.5, color: colors.textMuted, marginBottom: 8, fontStyle: 'italic' },
  catalogRow: { marginBottom: 12 },
  productCard: {
    width: 96, marginRight: 10, backgroundColor: colors.surface,
    borderRadius: 14, borderWidth: 1.5, borderColor: colors.border,
    padding: 8, gap: 4,
  },
  productImg: { width: '100%', height: 64, borderRadius: 10, backgroundColor: pastel.yellowLight },
  productImgFallback: { alignItems: 'center', justifyContent: 'center' },
  productName: { fontSize: 11, fontWeight: '700', color: colors.text, minHeight: 28 },
  productPrice: { fontSize: 11, fontWeight: '700', color: pastel.yellowDark },
  addCustomBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: pastel.yellowDark, borderStyle: 'dashed',
    borderRadius: 12, paddingVertical: 10, marginBottom: 10,
  },
  addCustomBtnText: { fontSize: 12.5, fontWeight: '700', color: pastel.yellowDark },
  itemsList: {
    backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border,
    padding: 10, gap: 10,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemName: { flex: 1, fontSize: 12.5, fontWeight: '600', color: colors.text },
  itemNameInput: {
    backgroundColor: colors.surfaceAlt, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  qtyStepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 22, height: 22, borderRadius: 8, backgroundColor: pastel.yellowLight,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyText: { fontSize: 12.5, fontWeight: '700', color: colors.text, minWidth: 16, textAlign: 'center' },
  itemPriceInput: {
    width: 64, fontSize: 12.5, color: colors.text, fontWeight: '600',
    backgroundColor: colors.surfaceAlt, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.border, textAlign: 'right',
  },
  itemSubtotal: { fontSize: 12.5, fontWeight: '700', color: colors.text, minWidth: 56, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  totalLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 17, fontWeight: '800', color: pastel.yellowDark },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtnWrap: {
    borderRadius: 100, overflow: 'hidden',
    shadowColor: pastel.yellowDark, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32, shadowRadius: 14, elevation: 8,
  },
  saveBtn: {
    height: 56, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
