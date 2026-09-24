import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { LabeledInput } from "../components/FormField";
import { GradientButton } from "../components/GradientButton";
import { BackHeader } from "../components/BackHeader";
import { useAuth } from "../context/AuthContext";
import { bold } from "../theme/boldTheme";

export function SignUpScreen() {
  const navigation = useNavigation<any>();
  const { signUpWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!email.trim() || !password) {
      Alert.alert("Faltan datos", "Ingresa tu email y una contraseña.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Contraseña muy corta", "Usa al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Las contraseñas no coinciden", "Revisa el campo de confirmación.");
      return;
    }
    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password);
      Alert.alert(
        "Revisa tu correo",
        "Te enviamos un enlace para confirmar tu cuenta antes de poder ingresar.",
      );
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("No se pudo crear la cuenta", e.message ?? "Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <BackHeader title="Crear cuenta" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <LabeledInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <LabeledInput
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
          />
          <LabeledInput
            label="Confirmar contraseña"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repite tu contraseña"
            secureTextEntry
          />
          <GradientButton
            label="Crear cuenta"
            loadingLabel="Creando..."
            loading={loading}
            onPress={handleSignUp}
            colorsRange={[bold.pink, bold.pinkDark]}
          />
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ alignSelf: "center", marginTop: 8 }}>
            <Text style={styles.link}>Ya tengo cuenta</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: bold.bg },
  content: { padding: 24, gap: 16, flexGrow: 1 },
  link: { fontSize: 13, fontWeight: "700", color: bold.pinkDark },
});
