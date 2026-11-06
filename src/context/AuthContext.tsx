import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Platform } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { migrateToSupabaseOnce } from "../services/migrateToSupabase";

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Antes de exponer la sesión al resto de la app, corremos (una sola vez)
    // la migración de los datos locales hacia Supabase, para que los contextos
    // ya carguen los datos migrados. Si falla (p.ej. sin conexión) no bloquea
    // el login y se reintenta en el próximo arranque.
    async function applySession(next: Session | null) {
      if (next?.user) {
        try {
          await migrateToSupabaseOnce(next.user.id);
        } catch (e) {
          console.warn("Migración a Supabase pendiente (se reintentará):", e);
        }
      }
      setSession(next);
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      applySession(newSession);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUpWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  // Google: Supabase arma la URL de autorización (usa el Client ID/Secret
  // configurados en Supabase > Authentication > Providers > Google, la app
  // no necesita saber cuáles son), la abrimos en el navegador del sistema y
  // Supabase nos regresa a la app por el esquema "3devfinance://" con la
  // sesión ya lista — no hace falta ningún client id en el .env.
  async function signInWithGoogle() {
    const WebBrowser = await import("expo-web-browser");

    // Path explícito ("auth-callback") para que calce con el patrón
    // "3devfinance://**" de la allow-list de Supabase. Un esquema a secas
    // ("3devfinance://") no calza y Supabase cae a su Site URL (localhost).
    const redirectTo = "3devfinance://auth-callback";

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data?.url) throw new Error("No se pudo iniciar el flujo de Google");

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== "success" || !result.url) {
      if (result.type === "cancel" || result.type === "dismiss") return;
      throw new Error("No se pudo iniciar sesión con Google");
    }

    // Supabase (flujo implícito) devuelve los tokens en el fragment #... (o,
    // por si acaso, en el query ?...). Los extraemos a mano para no depender
    // del parseo de URL con esquemas personalizados como 3devfinance://.
    const returned = result.url;
    const frag = returned.includes("#")
      ? returned.slice(returned.indexOf("#") + 1)
      : returned.includes("?")
        ? returned.slice(returned.indexOf("?") + 1)
        : "";
    const params = new URLSearchParams(frag);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (!access_token || !refresh_token) {
      throw new Error("Google no devolvió la sesión esperada");
    }

    const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
    if (sessionError) throw sessionError;
  }

  // Apple: botón nativo de Sign in with Apple (solo iOS). Requiere el
  // capability "Sign in with Apple" habilitado en el Apple Developer
  // account y el mismo Services ID configurado como proveedor Apple en
  // Supabase > Authentication > Providers > Apple.
  async function signInWithApple() {
    if (Platform.OS !== "ios") {
      throw new Error("Sign in with Apple solo está disponible en iOS");
    }
    const AppleAuthentication = await import("expo-apple-authentication");

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error("Apple no devolvió un token de identidad");
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
    });
    if (error) throw error;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  const value = useMemo(
    () => ({
      session,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signInWithApple,
      resetPassword,
      signOut,
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
