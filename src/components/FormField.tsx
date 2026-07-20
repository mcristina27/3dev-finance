import React, { ReactNode } from "react";
import { View, Text, StyleSheet, TextInput, TextInputProps } from "react-native";
import { colors } from "../theme/colors";

/**
 * Wrapper de "etiqueta + contenido" usado en casi todos los formularios
 * de la app (label en mayúsculas arriba, el input/control debajo).
 */
export function FormField({
  label,
  children,
  style,
}: {
  label: string;
  children: ReactNode;
  style?: object;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

/** Caso más común: FormField con un único TextInput dentro, con el estilo estándar de la app. */
export function LabeledInput({
  label,
  style,
  inputStyle,
  ...inputProps
}: {
  label: string;
  style?: object;
  inputStyle?: object;
} & TextInputProps) {
  return (
    <FormField label={label} style={style}>
      <TextInput
        style={[styles.input, inputStyle]}
        placeholderTextColor={colors.textMuted}
        {...inputProps}
      />
    </FormField>
  );
}

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    fontWeight: "500",
  },
});
