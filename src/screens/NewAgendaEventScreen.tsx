import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useConnectivity } from "../context/ConnectivityContext";
import { isNetworkError } from "../lib/net";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MapPin } from "lucide-react-native";
import { useAgendaEvents } from "../context/AgendaEventContext";
import { DateField } from "../components/DateField";
import { ModalHeader } from "../components/ModalHeader";
import { GradientButton } from "../components/GradientButton";
import { FormField, LabeledInput } from "../components/FormField";
import { bold } from "../theme/boldTheme";
import { AGENDA_COLORS, DEFAULT_AGENDA_COLOR } from "../constants/agendaColors";

export function NewAgendaEventScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const eventId = route.params?.eventId as string | undefined;
  const { getEvent, addEvent, updateEvent } = useAgendaEvents();
  const { showOffline } = useConnectivity();
  const existing = eventId ? getEvent(eventId) : undefined;
  const isEditing = !!existing;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [date, setDate] = useState(
    existing?.date ??
      route.params?.initialDate ??
      new Date().toISOString().split("T")[0],
  );
  const [location, setLocation] = useState(existing?.location ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [color, setColor] = useState(existing?.color ?? DEFAULT_AGENDA_COLOR);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert("Falta el título", "Escribe el nombre del evento.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        date,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        color,
      };
      if (isEditing && eventId) {
        await updateEvent(eventId, payload);
      } else {
        await addEvent(payload);
      }
      navigation.goBack();
    } catch (err) {
      if (isNetworkError(err)) showOffline();
      else Alert.alert("Error", "No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ModalHeader title={isEditing ? "Editar evento" : "Nuevo evento"} />

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.form}>
              <LabeledInput
                label="Título"
                placeholder="Ej: Feria Maker Lima"
                value={title}
                onChangeText={setTitle}
              />

              <FormField label="Fecha">
                <DateField value={date} onChange={setDate} />
              </FormField>

              <FormField label="Colorcito">
                <View style={styles.colorRow}>
                  {AGENDA_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c.key}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c.value },
                        color === c.value && styles.colorSwatchActive,
                      ]}
                      onPress={() => setColor(c.value)}
                      hitSlop={4}
                    />
                  ))}
                </View>
              </FormField>

              <FormField label="Lugar (opcional)">
                <View style={styles.inputRow}>
                  <MapPin size={15} color={bold.textMuted} strokeWidth={2} />
                  <TextInput
                    style={styles.inputInline}
                    placeholder="Ej: Parque Kennedy, Miraflores"
                    placeholderTextColor={bold.textMuted}
                    value={location}
                    onChangeText={setLocation}
                  />
                </View>
              </FormField>

              <LabeledInput
                label="Notas (opcional)"
                inputStyle={styles.notesInput}
                placeholder="Horario, qué llevar, contacto del organizador..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <GradientButton
              label="Guardar evento"
              loading={saving}
              onPress={handleSave}
              colorsRange={[bold.mint, bold.mint]}
              shadowColor={bold.mint}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: bold.bg },
  scroll: { flex: 1 },
  form: { paddingHorizontal: 20, paddingTop: 20, gap: 16, paddingBottom: 20 },
  notesInput: { height: 80, textAlignVertical: "top" },
  colorRow: { flexDirection: "row", gap: 12 },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: bold.black,
  },
  colorSwatchActive: { borderWidth: 3 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: bold.surface,
    borderWidth: 2,
    borderColor: bold.black,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputInline: { flex: 1, fontSize: 15, color: bold.black, fontWeight: "500" },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: bold.black },
});
