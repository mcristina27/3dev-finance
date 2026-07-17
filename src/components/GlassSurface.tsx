import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView, BlurTint } from 'expo-blur';

interface GlassSurfaceProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Intensidad del blur 1–100 (iOS). Default: 55 */
  intensity?: number;
  /** Tint de BlurView (iOS). Default: 'systemUltraThinMaterialLight' */
  tint?: BlurTint;
  /** Color semitransparente que se superpone al blur para el tinte glass */
  overlayColor?: string;
  /** Color de fondo sólido para Android / fallback */
  fallbackColor?: string;
}

/**
 * Superficie glassmorphism.
 * – iOS: BlurView nativo con overlay semitransparente.
 * – Android/Web: View con backgroundColor semitransparente.
 *
 * Requiere overflow: 'hidden' en el padre para que el borderRadius funcione.
 */
export function GlassSurface({
  children,
  style,
  intensity = 55,
  tint = 'systemUltraThinMaterialLight',
  overlayColor = 'rgba(255, 252, 248, 0.45)',
  fallbackColor = 'rgba(240, 235, 227, 0.90)',
}: GlassSurfaceProps) {
  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={intensity} tint={tint} style={[styles.base, style]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]} />
        {children}
      </BlurView>
    );
  }

  return (
    <View style={[styles.base, style, { backgroundColor: fallbackColor }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
