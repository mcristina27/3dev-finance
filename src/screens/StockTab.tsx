import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  Boxes,
  Plus,
  Minus,
  WifiOff,
  Package,
  RefreshCw,
} from "lucide-react-native";
import { useInventory } from "../context/InventoryContext";
import { getCatalog, forceRefreshCatalog } from "../services/catalogService";
import { colors, pastel } from "../theme/colors";
import { formatCurrency } from "../utils/formatters";
import { CatalogProduct } from "../types";

function StockRow({
  product,
  qty,
  onPress,
  onIncrement,
  onDecrement,
}: {
  product: CatalogProduct;
  qty: number;
  onPress: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const isEmpty = qty <= 0;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      {product.image ? (
        <Image source={{ uri: product.image }} style={styles.rowImg} />
      ) : (
        <View style={[styles.rowImg, styles.rowImgFallback]}>
          <Package size={18} color={pastel.pistachioDark} />
        </View>
      )}
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.rowHint}>
          {product.price != null ? formatCurrency(product.price) : "A cotizar"}
        </Text>
      </View>
      <View style={styles.stepper}>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={onDecrement}
          hitSlop={6}
        >
          <Minus size={13} color={colors.expense} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={[styles.qtyText, isEmpty && styles.qtyTextEmpty]}>
          {qty}
        </Text>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={onIncrement}
          hitSlop={6}
        >
          <Plus size={13} color={pastel.pistachioDark} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export function StockTab() {
  const navigation = useNavigation<any>();
  const { getStock, adjustStock } = useInventory();

  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [catalogState, setCatalogState] = useState<
    "loading" | "ready" | "offline" | "error"
  >("loading");
  const [refreshing, setRefreshing] = useState(false);

  const loadCatalog = useCallback(() => {
    getCatalog()
      .then(({ productos, fromCache }) => {
        setCatalog(productos);
        setCatalogState(fromCache ? "offline" : "ready");
      })
      .catch(() => setCatalogState("error"));
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);
  useFocusEffect(
    useCallback(() => {
      loadCatalog();
    }, [loadCatalog]),
  );

  async function handleRefresh() {
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

  if (catalogState === "loading") {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={pastel.pistachioDark} />
        <Text style={styles.centerStateText}>Cargando catálogo...</Text>
      </View>
    );
  }

  if (catalogState === "error") {
    return (
      <View style={styles.centerState}>
        <WifiOff size={28} color={colors.textMuted} strokeWidth={1.6} />
        <Text style={styles.centerStateText}>
          No se pudo cargar el catálogo. Revisa tu conexión e intenta de nuevo.
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.refreshRow}>
        {catalogState === "offline" ? (
          <Text style={styles.offlineHint}>
            Mostrando catálogo guardado (sin conexión)
          </Text>
        ) : (
          <View />
        )}
        <TouchableOpacity
          onPress={handleRefresh}
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
          <Text style={styles.refreshBtnText}>Actualizar</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={catalog}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <StockRow
            product={item}
            qty={getStock(String(item.id))}
            onPress={() =>
              navigation.navigate("AjustarStock", {
                productId: String(item.id),
              })
            }
            onIncrement={() => adjustStock(String(item.id), 1)}
            onDecrement={() => adjustStock(String(item.id), -1)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Boxes size={32} color={pastel.pistachioDark} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyText}>Tu catálogo está vacío</Text>
            <Text style={styles.emptySubtext}>
              Agrega productos en tu web para verlos acá
            </Text>
          </View>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 40,
  },
  centerStateText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  offlineHint: { fontSize: 11.5, color: colors.textMuted, fontStyle: "italic" },
  refreshRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginLeft: "auto",
  },
  refreshBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: pastel.pistachioDark,
  },
  list: { paddingHorizontal: 20, paddingBottom: 130 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
    marginBottom: 10,
  },
  rowImg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: pastel.pistachioLight,
  },
  rowImgFallback: { alignItems: "center", justifyContent: "center" },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: "700", color: colors.text },
  rowHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
    minWidth: 22,
    textAlign: "center",
  },
  qtyTextEmpty: { color: colors.expense },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: pastel.pistachioLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
