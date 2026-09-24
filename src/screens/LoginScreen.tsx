import React, { useState } from "react";
import { View, Text, StyleSheet, Image, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as AppleAuthentication from "expo-apple-authentication";
import { TouchableOpacity } from "react-native";
import { useAuth } from "../context/AuthContext";
import { bold, boldBorder, hardShadow } from "../theme/boldTheme";

/**
 * Login simple: solo Google y Apple. La ilustración es un placeholder en
 * assets/login-illustration.png — reemplázala por la tuya (misma ruta y
 * proporción ~1:1, se ve mejor cuadrada o vertical) y se actualiza sola.
 */
export function LoginScreen() {
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  async function handleGoogle() {
    setLoadingGoogle(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      Alert.alert("No se pudo iniciar sesión con Google", e.message ?? "Intenta de nuevo.");
    } finally {
      setLoadingGoogle(false);
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
      <View style={styles.content}>
        <View style={styles.illustrationWrap}>
          <Image
            source={require("../../assets/login-illustration.png")}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textWrap}>
          <Text style={styles.title}>Antiva</Text>
          <Text style={styles.subtitle}>Finanzas de 3Dev, en un solo lugar</Text>
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.oauthBtn, boldBorder, hardShadow(4), loadingGoogle && { opacity: 0.65 }]}
            onPress={handleGoogle}
            activeOpacity={0.85}
            disabled={loadingGoogle}
          >
            <Text style={styles.oauthText}>
              {loadingGoogle ? "Ingresando..." : "Continuar con Google"}
            </Text>
          </TouchableOpacity>

          {Platform.OS === "ios" && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={100}
              style={styles.appleBtn}
              onPress={handleApple}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: bold.bg },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 48,
    paddingBottom: 32,
  },
  illustrationWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  illustration: {
    width: 220,
    height: 220,
  },
  textWrap: { alignItems: "center", gap: 6, marginTop: 28 },
  title: { fontSize: 28, fontWeight: "900", color: bold.black },
  subtitle: { fontSize: 14, color: bold.textSecondary, fontWeight: "600", textAlign: "center" },
  buttons: { gap: 12 },
  oauthBtn: {
    height: 56,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: bold.surface,
  },
  oauthText: { fontSize: 16, fontWeight: "800", color: bold.black },
  appleBtn: { height: 56, width: "100%" },
});
