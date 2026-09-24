import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ScreenListHeader } from "../components/ScreenListHeader";
import { bold } from "../theme/boldTheme";
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
          accentColor={bold.blue}
          accentBg={bold.blueLight}
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
  root: { flex: 1, backgroundColor: bold.bg },
  segmented: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: bold.bg,
    borderRadius: 14,
    padding: 4,
    borderWidth: 2,
    borderColor: bold.black,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },
  segmentBtnActive: {
    backgroundColor: bold.blueLight,
    borderWidth: 1.5,
    borderColor: bold.black,
  },
  segmentText: { fontSize: 13, color: bold.textMuted, fontWeight: "600" },
  segmentTextActive: { color: bold.blue, fontWeight: "700" },
});
