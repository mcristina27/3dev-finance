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
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Check, X, MapPin } from "lucide-react-native";
import { useAgendaEvents } from "../context/AgendaEventContext";
import { colors, pastel } from "../theme/colors";

export function NewAgendaEventScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const eventId = route.params?.eventId as string | undefined;
  const { getEvent, addEvent, updateEvent } = useAgendaEvents();
  const existing = eventId ? getEvent(eventId) : undefined;
  const isEditing = !!existing;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [date, setDate] = useState(
    existing?.date ?? new Date().toISOString().split("T")[0],
  );
  const [location, setLocation] = useState(existing?.location ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
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
      };
      if (isEditing && eventId) {
        await updateEvent(eventId, payload);
      } else {
        await addEvent(payload);
      }
      navigation.goBack();
    } catch {
      Alert.alert("Error", "No se pudo guardar. Intenta de nuevo.");
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
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.closeBtn}
            >
              <X size={18} color={colors.textSecondary} strokeWidth={2.2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isEditing ? "Editar evento" : "Nuevo evento"}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Título</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Feria Maker Lima"
                  placeholderTextColor={colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Fecha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  value={date}
                  onChangeText={setDate}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Lugar (opcional)</Text>
                <View style={styles.inputRow}>
                  <MapPin size={15} color={colors.textMuted} strokeWidth={2} />
                  <TextInput
                    style={styles.inputInline}
                    placeholder="Ej: Parque Kennedy, Miraflores"
                    placeholderTextColor={colors.textMuted}
                    value={location}
                    onChangeText={setLocation}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Notas (opcional)</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Horario, qué llevar, contacto del organizador..."
                  placeholderTextColor={colors.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtnWrap, saving && { opacity: 0.65 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[pastel.yellow, pastel.yellowDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtn}
              >
                {!saving && (
                  <Check size={18} color={colors.white} strokeWidth={2.5} />
                )}
                <Text style={styles.saveBtnText}>
                  {saving ? "Guardando..." : "Guardar evento"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 100,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  scroll: { flex: 1 },
  form: { paddingHorizontal: 20, paddingTop: 20, gap: 16, paddingBottom: 20 },
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
  notesInput: { height: 80, textAlignVertical: "top" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputInline: { flex: 1, fontSize: 15, color: colors.text, fontWeight: "500" },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtnWrap: {
    borderRadius: 100,
    overflow: "hidden",
    shadowColor: pastel.yellowDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 8,
  },
  saveBtn: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: "700" },
});
