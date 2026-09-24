import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { LabeledInput } from "../components/FormField";
import { GradientButton } from "../components/GradientButton";
import { BackHeader } from "../components/BackHeader";
import { useAuth } from "../context/AuthContext";
import { bold } from "../theme/boldTheme";

export function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!email.trim()) {
      Alert.alert("Falta el email", "Ingresa el email de tu cuenta.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      Alert.alert(
        "Listo",
        "Si ese email tiene una cuenta, te enviamos un enlace para restablecer tu contraseña.",
      );
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("No se pudo enviar el correo", e.message ?? "Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <BackHeader title="Recuperar contraseña" />
      <View style={styles.content}>
        <Text style={styles.hint}>
          Te enviaremos un enlace a tu correo para crear una nueva contraseña.
        </Text>
        <LabeledInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <GradientButton
          label="Enviar enlace"
          loadingLabel="Enviando..."
          loading={loading}
          onPress={handleReset}
          colorsRange={[bold.pink, bold.pinkDark]}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: bold.bg },
  content: { padding: 24, gap: 16 },
  hint: { fontSize: 14, color: bold.textSecondary, fontWeight: "600", lineHeight: 20 },
});
