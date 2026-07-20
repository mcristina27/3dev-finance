import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Share2, FolderDown, ShieldCheck } from "lucide-react-native";
import {
  buildBackupString,
  parseBackupString,
  restoreFromPayload,
  summarizeBackup,
} from "../services/backupService";
import { BackHeader } from "../components/BackHeader";
import { colors, pastel } from "../theme/colors";
import { formatDateTime } from "../utils/formatters";

export function BackupScreen() {
  const navigation = useNavigation();
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [pasted, setPasted] = useState("");

  async function handleExport() {
    setExporting(true);
    try {
      const json = await buildBackupString();
      await Share.share({
        message: json,
        title: "Respaldo Antiva",
      });
    } catch {
      Alert.alert(
        "Error",
        "No se pudo generar el respaldo. Intenta de nuevo.",
      );
    } finally {
      setExporting(false);
    }
  }

  function handleRestore() {
    if (!pasted.trim()) {
      Alert.alert(
        "Falta el respaldo",
        "Pega aquí el texto que guardaste cuando compartiste tu respaldo.",
      );
      return;
    }

    let payload;
    try {
      payload = parseBackupString(pasted);
    } catch (err) {
      Alert.alert(
        "Respaldo inválido",
        err instanceof Error ? err.message : "No se pudo leer el respaldo.",
      );
      return;
    }

    const summary = summarizeBackup(payload);
    Alert.alert(
      "¿Restaurar este respaldo?",
      `Esto reemplaza TODOS tus datos actuales por:\n\n${summary}\n\nExportado: ${formatDateTime(payload.exportedAt)}\n\nEsta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          style: "destructive",
          onPress: async () => {
            setRestoring(true);
            try {
              await restoreFromPayload(payload);
              setPasted("");
              Alert.alert(
                "Listo",
                "Tus datos fueron restaurados. Cierra y vuelve a abrir la app para verlos reflejados en todas las secciones.",
              );
            } catch (err) {
              Alert.alert(
                "Error",
                err instanceof Error
                  ? err.message
                  : "No se pudo restaurar el respaldo.",
              );
            } finally {
              setRestoring(false);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            <BackHeader title="Respaldo de datos" titleSize={22} />

            <View style={styles.infoCard}>
              <ShieldCheck
                size={18}
                color={pastel.blueDark}
                strokeWidth={2}
              />
              <Text style={styles.infoText}>
                Ahora mismo tus datos viven solo en este celular. Si
                desinstalas la app o la cambias de teléfono, se pierden.
                Exporta tu respaldo de vez en cuando y guárdalo en Notas,
                Drive, iCloud o mándatelo por correo.
              </Text>
            </View>

            <Text style={styles.sectionLabel}>Exportar</Text>
            <View style={styles.card}>
              <Text style={styles.cardText}>
                Junta tus movimientos, pedidos, insumos, stock y agenda en un
                solo respaldo que puedes compartir o guardar donde quieras.
              </Text>
              <TouchableOpacity
                style={[styles.actionBtn, exporting && { opacity: 0.6 }]}
                onPress={handleExport}
                disabled={exporting}
                activeOpacity={0.85}
              >
                <Share2 size={16} color={colors.white} strokeWidth={2.2} />
                <Text style={styles.actionBtnText}>
                  {exporting ? "Preparando..." : "Compartir respaldo"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>Restaurar</Text>
            <View style={styles.card}>
              <Text style={styles.cardText}>
                Pega aquí el texto de un respaldo anterior para recuperar tus
                datos (por ejemplo, después de reinstalar la app).
              </Text>
              <TextInput
                style={styles.pasteInput}
                placeholder="Pega el respaldo aquí..."
                placeholderTextColor={colors.textMuted}
                value={pasted}
                onChangeText={setPasted}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.restoreBtn,
                  restoring && { opacity: 0.6 },
                ]}
                onPress={handleRestore}
                disabled={restoring}
                activeOpacity={0.85}
              >
                <FolderDown
                  size={16}
                  color={pastel.pistachioDark}
                  strokeWidth={2.2}
                />
                <Text style={[styles.actionBtnText, styles.restoreBtnText]}>
                  {restoring ? "Restaurando..." : "Restaurar datos"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 60 },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 14,
    borderRadius: 16,
    backgroundColor: pastel.blueLight,
    borderWidth: 1.5,
    borderColor: pastel.blueDark,
  },
  infoText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: "600",
    color: pastel.blueDark,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 16,
    gap: 14,
  },
  cardText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  pasteInput: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 12.5,
    color: colors.text,
    minHeight: 120,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: pastel.blueDark,
    borderRadius: 100,
    paddingVertical: 13,
  },
  actionBtnText: { color: colors.white, fontSize: 14, fontWeight: "700" },
  restoreBtn: {
    backgroundColor: pastel.pistachioLight,
    borderWidth: 1.5,
    borderColor: pastel.pistachioDark,
  },
  restoreBtnText: { color: pastel.pistachioDark },
});
