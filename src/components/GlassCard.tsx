import React from "react";
import { View, StyleSheet, ViewStyle, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { colors } from "../theme/colors";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: "light" | "dark" | "default";
}

export function GlassCard({
  children,
  style,
  intensity = 55,
  tint = "light",
}: Props) {
  if (Platform.OS === "ios") {
    return (
      <BlurView intensity={intensity} tint={tint} style={[styles.glass, style]}>
        <View style={styles.overlay}>{children}</View>
      </BlurView>
    );
  }
  return <View style={[styles.fallback, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  glass: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },
  overlay: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  fallback: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
});
