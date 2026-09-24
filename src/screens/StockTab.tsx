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
  List,
  LayoutGrid,
} from "lucide-react-native";
import { useInventory } from "../context/InventoryContext";
import { getCatalog, forceRefreshCatalog } from "../services/catalogService";
import { EmptyState } from "../components/EmptyState";
import { bold, hardShadow } from "../theme/boldTheme";
import { formatCurrency } from "../utils/formatters";
import { CatalogProduct } from "../types";

type ViewMode = "list" | "grid";

function StockRow({
  product,
  qty,
  isFirst,
  onPress,
  onIncrement,
  onDecrement,
}: {
  product: CatalogProduct;
  qty: number;
  isFirst?: boolean;
  onPress: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const isEmpty = qty <= 0;

  return (
    <TouchableOpacity
      style={[styles.row, !isFirst && styles.rowDivider]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {product.image ? (
        <Image source={{ uri: product.image }} style={styles.rowImg} />
      ) : (
        <View style={[styles.rowImg, styles.rowImgFallback]}>
          <Package size={18} color={bold.blue} />
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
          <Minus size={13} color={bold.red} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={[styles.qtyText, isEmpty && styles.qtyTextEmpty]}>
          {qty}
        </Text>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={onIncrement}
          hitSlop={6}
        >
          <Plus size={13} color={bold.blue} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function StockGridItem({
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
    <TouchableOpacity
      style={styles.gridItem}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {product.image ? (
        <Image source={{ uri: product.image }} style={styles.gridImg} />
      ) : (
        <View style={[styles.gridImg, styles.rowImgFallback]}>
          <Package size={24} color={bold.blue} />
        </View>
      )}
      <Text style={styles.gridName} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={styles.rowHint}>
        {product.price != null ? formatCurrency(product.price) : "A cotizar"}
      </Text>
      <View style={styles.gridStepper}>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={onDecrement}
          hitSlop={6}
        >
          <Minus size={13} color={bold.red} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={[styles.qtyText, isEmpty && styles.qtyTextEmpty]}>
          {qty}
        </Text>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={onIncrement}
          hitSlop={6}
        >
          <Plus size={13} color={bold.blue} strokeWidth={2.4} />
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
  const [viewMode, setViewMode] = useState<ViewMode>("list");

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
        <ActivityIndicator color={bold.blue} />
        <Text style={styles.centerStateText}>Cargando catálogo...</Text>
      </View>
    );
  }

  if (catalogState === "error") {
    return (
      <View style={styles.centerState}>
        <WifiOff size={28} color={bold.textMuted} strokeWidth={1.6} />
        <Text style={styles.centerStateText}>
          No se pudo cargar el catálogo. Revisa tu conexión e intenta de nuevo.
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.refreshRow}>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.viewToggleBtn,
              viewMode === "list" && styles.viewToggleBtnActive,
            ]}
            onPress={() => setViewMode("list")}
            hitSlop={6}
          >
            <List
              size={15}
              color={
                viewMode === "list" ? bold.blue : bold.textMuted
              }
              strokeWidth={2.2}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleBtn,
              viewMode === "grid" && styles.viewToggleBtnActive,
            ]}
            onPress={() => setViewMode("grid")}
            hitSlop={6}
          >
            <LayoutGrid
              size={15}
              color={
                viewMode === "grid" ? bold.blue : bold.textMuted
              }
              strokeWidth={2.2}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={handleRefresh}
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
      <View style={viewMode === "list" ? styles.listCard : styles.gridWrap}>
        <FlatList
          key={viewMode}
          data={catalog}
          keyExtractor={(item) => String(item.id)}
          numColumns={viewMode === "grid" ? 2 : 1}
          columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
          contentContainerStyle={
            viewMode === "grid" ? styles.gridContent : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) =>
            viewMode === "grid" ? (
              <StockGridItem
                product={item}
                qty={getStock(String(item.id))}
                onPress={() =>
                  navigation.navigate("AjustarStock", {
                    productId: String(item.id),
                  })
                }
                onIncrement={() =>
                  adjustStock(String(item.id), 1, "reposicion")
                }
                onDecrement={() => adjustStock(String(item.id), -1, "manual")}
              />
            ) : (
              <StockRow
                product={item}
                qty={getStock(String(item.id))}
                isFirst={index === 0}
                onPress={() =>
                  navigation.navigate("AjustarStock", {
                    productId: String(item.id),
                  })
                }
                onIncrement={() =>
                  adjustStock(String(item.id), 1, "reposicion")
                }
                onDecrement={() => adjustStock(String(item.id), -1, "manual")}
              />
            )
          }
          ListEmptyComponent={
            <EmptyState
              Icon={Boxes}
              iconColor={bold.blue}
              iconBg={bold.blueLight}
              title="Tu catálogo está vacío"
              subtitle="Agrega productos en tu web para verlos acá"
            />
          }
        />
      </View>
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
    color: bold.textSecondary,
    textAlign: "center",
  },
  refreshRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  viewToggle: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: bold.bg,
    borderRadius: 10,
    padding: 3,
    borderWidth: 2,
    borderColor: bold.black,
  },
  viewToggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  viewToggleBtnActive: { backgroundColor: bold.blueLight },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  refreshBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: bold.blue,
  },
  listCard: {
    flex: 1,
    marginHorizontal: 20,
    backgroundColor: bold.surface,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: bold.black,
    overflow: "hidden",
    ...hardShadow(3),
  },
  gridWrap: { flex: 1 },
  listContent: { paddingBottom: 130 },
  gridContent: { paddingHorizontal: 20, paddingBottom: 130 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  rowDivider: {
    borderTopWidth: 1.5,
    borderTopColor: bold.black,
  },
  rowImg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: bold.blueLight,
  },
  rowImgFallback: { alignItems: "center", justifyContent: "center" },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: "700", color: bold.black },
  rowHint: { fontSize: 12, color: bold.textSecondary, marginTop: 2 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: bold.bg,
    borderWidth: 1.5,
    borderColor: bold.black,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 15,
    fontWeight: "800",
    color: bold.black,
    minWidth: 22,
    textAlign: "center",
  },
  qtyTextEmpty: { color: bold.red },
  gridRow: { gap: 12 },
  gridItem: {
    flex: 1,
    maxWidth: "48%",
    backgroundColor: bold.surface,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: bold.black,
    padding: 10,
    marginBottom: 12,
    gap: 4,
    ...hardShadow(3),
  },
  gridImg: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: bold.blueLight,
  },
  gridName: {
    fontSize: 12.5,
    fontWeight: "700",
    color: bold.black,
    minHeight: 32,
  },
  gridStepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
});
