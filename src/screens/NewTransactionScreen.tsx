import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import {
  TrendingUp,
  TrendingDown,
  Camera,
  Check,
  X,
} from "lucide-react-native";
import { useTransactions } from "../context/TransactionContext";
import { colors, primaryGradient } from "../theme/colors";
import { TransactionType } from "../types";

export function NewTransactionScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { addTransaction } = useTransactions();

  const [type, setType] = useState<TransactionType>(
    route.params?.defaultType ?? "income",
  );
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const isIncome = type === "income";

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso necesario",
        "Necesito acceso a tu galería para agregar fotos.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotos((prev) =>
        [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5),
      );
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Falta el nombre", "Por favor escribe el nombre.");
      return;
    }
    const parsedAmount = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Monto inválido", "Ingresa un monto válido mayor a 0.");
      return;
    }
    setSaving(true);
    try {
      await addTransaction({
        type,
        name: name.trim(),
        amount: parsedAmount,
        date,
        notes: notes.trim() || undefined,
        photos: photos.length > 0 ? photos : undefined,
      });
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.closeBtn}
            >
              <X size={18} color={colors.textSecondary} strokeWidth={2.2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nuevo registro</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Toggle tipo */}
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === "income" && styles.typeBtnIncome,
                ]}
                onPress={() => setType("income")}
              >
                <TrendingUp
                  size={15}
                  color={type === "income" ? colors.income : colors.textMuted}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    type === "income" && styles.typeBtnTextIncome,
                  ]}
                >
                  Ingreso
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === "expense" && styles.typeBtnExpense,
                ]}
                onPress={() => setType("expense")}
              >
                <TrendingDown
                  size={15}
                  color={type === "expense" ? colors.expense : colors.textMuted}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    type === "expense" && styles.typeBtnTextExpense,
                  ]}
                >
                  Gasto
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>
                  {isIncome ? "Nombre del evento" : "Nombre del insumo"}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={
                    isIncome ? "Ej: Feria Makerspace" : "Ej: Filamento PLA 1kg"
                  }
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>
                  {isIncome ? "Monto recibido (S/)" : "Costo (S/)"}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.amountInput,
                    { color: isIncome ? colors.income : colors.expense },
                  ]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
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
                <Text style={styles.label}>Notas (opcional)</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Agrega detalles..."
                  placeholderTextColor={colors.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Fotos (opcional)</Text>
                <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
                  <Camera size={17} color={colors.primary} strokeWidth={2} />
                  <Text style={styles.photoBtnText}>Agregar fotos</Text>
                </TouchableOpacity>
                {photos.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginTop: 10 }}
                  >
                    {photos.map((uri, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() =>
                          setPhotos((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                      >
                        <Image source={{ uri }} style={styles.photoThumb} />
                        <View style={styles.photoRemove}>
                          <X size={9} color={colors.white} strokeWidth={3} />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Botón guardar */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtnWrap, saving && { opacity: 0.65 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isIncome ? primaryGradient : ["#F43F5E", "#BE123C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtn}
              >
                {!saving && (
                  <Check size={18} color={colors.white} strokeWidth={2.5} />
                )}
                <Text style={styles.saveBtnText}>
                  {saving ? "Guardando..." : "Guardar registro"}
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
  typeToggle: {
    flexDirection: "row",
    margin: 20,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
  },
  typeBtnIncome: { backgroundColor: colors.incomeLight },
  typeBtnExpense: { backgroundColor: colors.expenseLight },
  typeBtnText: { fontSize: 14, color: colors.textMuted, fontWeight: "600" },
  typeBtnTextIncome: { color: colors.income },
  typeBtnTextExpense: { color: colors.expense },
  form: { paddingHorizontal: 20, gap: 16, paddingBottom: 20 },
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
  amountInput: { fontSize: 28, fontWeight: "800", textAlign: "center" },
  notesInput: { height: 80, textAlignVertical: "top" },
  photoBtn: {
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: "dashed",
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  photoBtnText: { fontSize: 14, color: colors.primary, fontWeight: "700" },
  photoThumb: { width: 72, height: 72, borderRadius: 12, marginRight: 8 },
  photoRemove: {
    position: "absolute",
    top: 4,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.50)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtnWrap: {
    borderRadius: 100,
    overflow: "hidden",
    shadowColor: colors.primary,
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
