import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Package, Plus, AlertTriangle, Trash2 } from 'lucide-react-native';
import { useMaterials } from '../context/MaterialContext';
import { colors, pastel } from '../theme/colors';
import { formatCurrency } from '../utils/formatters';
import { Material } from '../types';

function MaterialRow({ material, onPress, onDelete }: {
  material: Material;
  onPress: () => void;
  onDelete: () => void;
}) {
  const isLow = typeof material.minStock === 'number' && material.stock <= material.minStock;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.rowIcon, isLow && styles.rowIconLow]}>
        <Package size={18} color={isLow ? colors.expense : pastel.pistachioDark} strokeWidth={1.8} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{material.name}</Text>
        <Text style={styles.rowHint}>
          {material.category ? `${material.category} · ` : ''}{formatCurrency(material.costPerUnit)} / {material.unit}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <View style={[styles.stockBadge, isLow && styles.stockBadgeLow]}>
          {isLow && <AlertTriangle size={11} color={colors.expense} strokeWidth={2.4} />}
          <Text style={[styles.stockText, isLow && styles.stockTextLow]}>
            {material.stock} {material.unit}
          </Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} hitSlop={8}>
          <Trash2 size={14} color={colors.textMuted} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export function InsumosScreen() {
  const navigation = useNavigation<any>();
  const { materials, deleteMaterial, lowStockMaterials } = useMaterials();

  function handleDelete(id: string, name: string) {
    Alert.alert('Eliminar insumo', `¿Eliminar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteMaterial(id) },
    ]);
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.title}>Insumos</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{materials.length}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('NuevoInsumo')}
            activeOpacity={0.8}
          >
            <Plus size={18} color={colors.white} strokeWidth={2.6} />
          </TouchableOpacity>
        </View>

        {lowStockMaterials.length > 0 && (
          <View style={styles.lowStockBanner}>
            <AlertTriangle size={15} color={colors.expense} strokeWidth={2.2} />
            <Text style={styles.lowStockText}>
              {lowStockMaterials.length === 1
                ? `"${lowStockMaterials[0].name}" tiene stock bajo`
                : `${lowStockMaterials.length} insumos con stock bajo`}
            </Text>
          </View>
        )}

        <FlatList
          data={materials}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <MaterialRow
              material={item}
              onPress={() => navigation.navigate('NuevoInsumo', { materialId: item.id })}
              onDelete={() => handleDelete(item.id, item.name)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Package size={32} color={pastel.pistachioDark} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyText}>Sin insumos todavía</Text>
              <Text style={styles.emptySubtext}>Registra tu stock de materiales, cajas, etiquetas, etc.</Text>
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={() => navigation.navigate('NuevoInsumo')}
                activeOpacity={0.85}
              >
                <Plus size={15} color={colors.white} strokeWidth={2.6} />
                <Text style={styles.emptyCtaText}>Agregar insumo</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  badge: {
    backgroundColor: pastel.pistachioLight, borderRadius: 100,
    paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: colors.border,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: pastel.pistachioDark },
  addBtn: {
    width: 38, height: 38, borderRadius: 14,
    backgroundColor: pastel.pistachioDark,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: pastel.pistachioDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30, shadowRadius: 8, elevation: 4,
  },
  lowStockBanner: {
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: colors.expenseLight, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#FECDD3',
  },
  lowStockText: { fontSize: 12.5, fontWeight: '700', color: colors.expenseOnDark ?? colors.expense },
  list: { paddingHorizontal: 20, paddingBottom: 130 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18, borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12, gap: 12,
    marginBottom: 10,
  },
  rowIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: pastel.pistachioLight, alignItems: 'center', justifyContent: 'center',
  },
  rowIconLow: { backgroundColor: colors.expenseLight },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  stockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surfaceAlt, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.border,
  },
  stockBadgeLow: { backgroundColor: colors.expenseLight, borderColor: '#FECDD3' },
  stockText: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },
  stockTextLow: { color: colors.expense },
  deleteBtn: { padding: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: pastel.pistachioLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, borderWidth: 1.5, borderColor: colors.border,
  },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: 18 },
  emptyCta: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: pastel.pistachioDark, borderRadius: 100,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  emptyCtaText: { color: colors.white, fontSize: 14, fontWeight: '700' },
});
