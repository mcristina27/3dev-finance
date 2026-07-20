import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ScreenListHeader } from "../components/ScreenListHeader";
import { colors, pastel } from "../theme/colors";
import { StockTab } from "./StockTab";
import { MaterialesTab } from "./MaterialesTab";

type SubTab = "stock" | "materiales";

export function InsumosScreen() {
  const navigation = useNavigation<any>();
  const [sub, setSub] = useState<SubTab>("stock");

  function handleAddPress() {
    if (sub === "stock") {
      navigation.navigate("AjustarStock");
    } else {
      navigation.navigate("NuevoInsumo");
    }
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScreenListHeader
          title="Inventario"
          accentColor={pastel.pistachioDark}
          accentBg={pastel.pistachioLight}
          onAddPress={handleAddPress}
        />

        <View style={styles.segmented}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              sub === "stock" && styles.segmentBtnActive,
            ]}
            onPress={() => setSub("stock")}
          >
            <Text
              style={[
                styles.segmentText,
                sub === "stock" && styles.segmentTextActive,
              ]}
            >
              Stock
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              sub === "materiales" && styles.segmentBtnActive,
            ]}
            onPress={() => setSub("materiales")}
          >
            <Text
              style={[
                styles.segmentText,
                sub === "materiales" && styles.segmentTextActive,
              ]}
            >
              Materiales
            </Text>
          </TouchableOpacity>
        </View>

        {sub === "stock" ? <StockTab /> : <MaterialesTab />}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  segmented: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },
  segmentBtnActive: { backgroundColor: pastel.pistachioLight },
  segmentText: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  segmentTextActive: { color: pastel.pistachioDark, fontWeight: "700" },
});
