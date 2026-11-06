import React, { useEffect, useState } from "react";
import { TextInput, TextInputProps } from "react-native";

/**
 * Input numérico que acepta decimales (con punto o coma) sin pelear con el
 * estado controlado: mantiene su propio texto mientras escribes, y se
 * re-sincroniza si el valor externo cambia (p.ej. al tocar +/- del stepper).
 */
export function NumberInput({
  value,
  onChangeValue,
  ...props
}: {
  value: number;
  onChangeValue: (n: number) => void;
} & Omit<TextInputProps, "value" | "onChangeText" | "keyboardType">) {
  const [text, setText] = useState(value ? String(value) : "");

  useEffect(() => {
    const parsed = parseFloat(text.replace(",", "."));
    const current = isNaN(parsed) ? 0 : parsed;
    if (current !== value) {
      setText(value ? String(value) : "");
    }
    // Solo re-sincroniza cuando cambia el valor externo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handle(t: string) {
    // dígitos + un solo separador decimal
    let clean = t.replace(/[^0-9.,]/g, "").replace(",", ".");
    const dot = clean.indexOf(".");
    if (dot !== -1) {
      clean = clean.slice(0, dot + 1) + clean.slice(dot + 1).replace(/\./g, "");
    }
    setText(clean);
    const n = parseFloat(clean);
    onChangeValue(isNaN(n) ? 0 : n);
  }

  return (
    <TextInput
      {...props}
      keyboardType="decimal-pad"
      value={text}
      onChangeText={handle}
    />
  );
}
