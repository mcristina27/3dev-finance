import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useConnectivity } from "../context/ConnectivityContext";
import { isNetworkError } from "../lib/net";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { TrendingUp, TrendingDown, Camera, X } from "lucide-react-native";
import { useTransactions } from "../context/TransactionContext";
import { ModalHeader } from "../components/ModalHeader";
import { GradientButton } from "../components/GradientButton";
import { LabeledInput, FormField } from "../components/FormField";
import { colors, pastel } from "../theme/colors";
import { TransactionType } from "../types";

// Tonos más profundos para que el texto blanco del botón sea legible
const INCOME_GRADIENT: readonly [string, string] = ["#B394B3", "#9B7A9B"];
const EXPENSE_GRADIENT: readonly [string, string] = ["#E1903E", "#C07030"];

export function NewTransactionScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { addTransaction } = useTransactions();
  const { showOffline } = useConnectivity();

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
          <ModalHeader title="Nuevo registro" />

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
                  color={type === "income" ? pastel.lilacDark : colors.textMuted}
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
                  color={type === "expense" ? pastel.orangeDark : colors.textMuted}
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
              <LabeledInput
                label={isIncome ? "Nombre del evento" : "Nombre del insumo"}
                placeholder={
                  isIncome ? "Ej: Feria Makerspace" : "Ej: Filamento PLA 1kg"
                }
                value={name}
                onChangeText={setName}
              />

              <LabeledInput
                label={isIncome ? "Monto recibido (S/)" : "Costo (S/)"}
                inputStyle={[
                  styles.amountInput,
                  { color: isIncome ? pastel.lilacDark : pastel.orangeDark },
                ]}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />

              <LabeledInput
                label="Fecha"
                placeholder="AAAA-MM-DD"
                value={date}
                onChangeText={setDate}
              />

              <LabeledInput
                label="Notas (opcional)"
                inputStyle={styles.notesInput}
                placeholder="Agrega detalles..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />

              <FormField label="Fotos (opcional)">
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
              </FormField>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <GradientButton
              label="Guardar registro"
              loading={saving}
              onPress={handleSave}
              colorsRange={isIncome ? INCOME_GRADIENT : EXPENSE_GRADIENT}
              shadowColor={isIncome ? pastel.lilacDark : pastel.orangeDark}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
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
  typeBtnTextIncome: { color: pastel.lilacDark },
  typeBtnTextExpense: { color: pastel.orangeDark },
  form: { paddingHorizontal: 20, gap: 16, paddingBottom: 20 },
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
});
