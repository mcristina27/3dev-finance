import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft } from "lucide-react-native";
import { colors } from "../theme/colors";

export function BackHeader({
  title,
  onBack,
  titleSize = 26,
  right,
  style,
}: {
  title: string;
  onBack?: () => void;
  titleSize?: number;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const navigation = useNavigation();

  return (
    <View style={[styles.header, style]}>
      <TouchableOpacity
        onPress={onBack ?? (() => navigation.goBack())}
        style={styles.backBtn}
        hitSlop={8}
      >
        <ArrowLeft size={18} color={colors.textSecondary} strokeWidth={2.2} />
      </TouchableOpacity>
      <Text style={[styles.title, { fontSize: titleSize }]}>{title}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
});
