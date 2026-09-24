import React, { ReactNode } from "react";
import { View, Text, StyleSheet, TextInput, TextInputProps } from "react-native";
import { bold } from "../theme/boldTheme";

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
        placeholderTextColor={bold.textMuted}
        {...inputProps}
      />
    </FormField>
  );
}

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: {
    fontSize: 12,
    color: bold.black,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: bold.surface,
    borderWidth: 2,
    borderColor: bold.black,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: bold.black,
    fontWeight: "600",
  },
});
