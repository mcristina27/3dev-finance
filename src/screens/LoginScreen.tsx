import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import * as AppleAuthentication from "expo-apple-authentication";
import { Sparkles } from "lucide-react-native";
import { LabeledInput } from "../components/FormField";
import { GradientButton } from "../components/GradientButton";
import { useAuth } from "../context/AuthContext";
import { bold, boldBorder, hardShadow } from "../theme/boldTheme";

export function LoginScreen() {
  const navigation = useNavigation<any>();
  const { signInWithEmail, signInWithGoogle, signInWithApple } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmailLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Faltan datos", "Ingresa tu email y contraseña.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
    } catch (e: any) {
      Alert.alert("No se pudo iniciar sesión", e.message ?? "Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      await signInWithGoogle();
    } catch (e: any) {
      Alert.alert("No se pudo iniciar sesión con Google", e.message ?? "Intenta de nuevo.");
    }
  }

  async function handleApple() {
    try {
      await signInWithApple();
    } catch (e: any) {
      if (e.code === "ERR_REQUEST_CANCELED") return;
      Alert.alert("No se pudo iniciar sesión con Apple", e.message ?? "Intenta de nuevo.");
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <View style={[styles.logoBadge, boldBorder, hardShadow(4)]}>
              <Sparkles size={28} color={bold.black} strokeWidth={2.4} />
            </View>
            <Text style={styles.title}>Antiva</Text>
            <Text style={styles.subtitle}>Finanzas de 3Dev, en un solo lugar</Text>
          </View>

          <View style={styles.form}>
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
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
            />
            <TouchableOpacity
              onPress={() => navigation.navigate("RecuperarContrasena")}
              style={{ alignSelf: "flex-end" }}
            >
              <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <GradientButton
              label="Iniciar sesión"
              loadingLabel="Ingresando..."
              loading={loading}
              onPress={handleEmailLogin}
              colorsRange={[bold.pink, bold.pinkDark]}
            />
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o continúa con</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={{ gap: 12 }}>
            <TouchableOpacity style={[styles.oauthBtn, boldBorder]} onPress={handleGoogle} activeOpacity={0.85}>
              <Text style={styles.oauthText}>Continuar con Google</Text>
            </TouchableOpacity>

            {Platform.OS === "ios" && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={100}
                style={{ height: 52, width: "100%" }}
                onPress={handleApple}
              />
            )}
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate("Registro")}
            style={{ marginTop: 24, alignSelf: "center" }}
          >
            <Text style={styles.link}>¿No tienes cuenta? Crear una</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: bold.bg },
  content: { padding: 24, paddingTop: 48, gap: 24, flexGrow: 1 },
  logoWrap: { alignItems: "center", gap: 8, marginBottom: 8 },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: bold.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 26, fontWeight: "900", color: bold.black },
  subtitle: { fontSize: 14, color: bold.textSecondary, fontWeight: "600" },
  form: { gap: 16 },
  link: { fontSize: 13, fontWeight: "700", color: bold.pinkDark },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1.5, backgroundColor: bold.black, opacity: 0.12 },
  dividerText: { fontSize: 12, color: bold.textMuted, fontWeight: "700" },
  oauthBtn: {
    height: 52,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: bold.surface,
  },
  oauthText: { fontSize: 15, fontWeight: "800", color: bold.black },
});
