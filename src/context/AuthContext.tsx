import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Platform } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

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
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
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

  // Google: flujo OAuth vía navegador (expo-auth-session), pide el id_token
  // y se lo pasa a Supabase con signInWithIdToken — no requiere el SDK nativo.
  // Necesita EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (OAuth client tipo "Web" de
  // Google Cloud Console, el mismo que se registra como proveedor en
  // Supabase > Authentication > Providers > Google).
  async function signInWithGoogle() {
    const AuthSession = await import("expo-auth-session");
    const WebBrowser = await import("expo-web-browser");
    WebBrowser.maybeCompleteAuthSession();

    const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (!clientId) {
      throw new Error("Falta EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID en el .env");
    }

    const redirectUri = AuthSession.makeRedirectUri({ scheme: "antiva" });
    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: ["openid", "email", "profile"],
      redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      extraParams: { nonce: Math.random().toString(36).slice(2) },
    });

    const result = await request.promptAsync({
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    });

    if (result.type !== "success" || !result.params.id_token) {
      if (result.type === "cancel" || result.type === "dismiss") return;
      throw new Error("No se pudo iniciar sesión con Google");
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: result.params.id_token,
    });
    if (error) throw error;
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
