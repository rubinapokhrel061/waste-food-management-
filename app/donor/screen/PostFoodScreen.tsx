import * as ImagePicker from "expo-image-picker";
import { getAuth, signInAnonymously } from "firebase/auth";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { db } from "../../../configs/FirebaseConfig";

export default function PostFoodScreen() {
  const [foodName, setFoodName] = useState("");
  const [description, setDescription] = useState("");
  const [useTime, setUseTime] = useState<Date | null>(null);
  const [quantity, setQuantity] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({
    foodName: "",
    useTime: "",
    quantity: "",
    imageUri: "",
  });
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const auth = getAuth();

  useEffect(() => {
    const ensureAuth = async () => {
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Auth error:", error);
        }
      }
    };
    ensureAuth();
  }, []);

  // Pick image
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Upload image to Cloudinary
  const uploadImageToCloudinary = async (uri: string) => {
    const data = new FormData();
    data.append("file", {
      uri,
      type: "image/jpeg",
      name: `food_${Date.now()}.jpg`,
    } as any);
    data.append("upload_preset", "waste_food_management");
    data.append("cloud_name", "dhdutbou0");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dhdutbou0/image/upload",
      { method: "POST", body: data }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Upload failed");
    return json.secure_url;
  };

  const handleSubmit = async () => {
    const newErrors = {
      foodName: foodName ? "" : "Food name is required",
      useTime: useTime ? "" : "Use before date is required",
      quantity: quantity ? "" : "Total quantity is required",
      imageUri: imageUri ? "" : "Food image is required",
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some((e) => e)) return;

    try {
      setUploading(true);
      const imageUrl = await uploadImageToCloudinary(imageUri!);
      const user = auth.currentUser;

      await addDoc(collection(db, "foods"), {
        foodName,
        description,
        useTime: Timestamp.fromDate(useTime!),
        quantity: Number(quantity),
        imageUrl,
        createdAt: Timestamp.now(),
        createdBy: {
          uid: user?.uid || null,
          isAnonymous: user?.isAnonymous || false,
        },
      });

      Alert.alert("✅ Success", "Food shared successfully!");
      setFoodName("");
      setDescription("");
      setUseTime(null);
      setQuantity("");
      setImageUri(null);
      setErrors({ foodName: "", useTime: "", quantity: "", imageUri: "" });
    } catch (err: any) {
      console.error("Submit error:", err);
      Alert.alert("Error", err.message || "Something went wrong.");
    } finally {
      setUploading(false);
    }
  };

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirm = (date: Date) => {
    setUseTime(date);
    hideDatePicker();
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Post Food 🍽️</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image Picker */}
        <TouchableOpacity
          style={styles.heroImageContainer}
          onPress={pickImage}
          activeOpacity={0.95}
        >
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.heroImage} />
              <View style={styles.imageOverlay}>
                <View style={styles.changeBadge}>
                  <Text style={styles.changeBadgeText}>✏️ Change Photo</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.heroPlaceholder}>
              <View style={styles.cameraIcon}>
                <Text style={styles.cameraIconText}>📷</Text>
              </View>
              <Text style={styles.heroPlaceholderText}>Add Food Photo</Text>
              <Text style={styles.heroPlaceholderSubtext}>
                Show what you're sharing
              </Text>
            </View>
          )}
        </TouchableOpacity>
        {errors.imageUri && (
          <Text style={styles.errorText}>{errors.imageUri}</Text>
        )}

        {/* Inputs */}
        <View style={styles.formContainer}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🍲</Text>
            <TextInput
              placeholder="Food name"
              value={foodName}
              onChangeText={(text) => {
                setFoodName(text);
                setErrors((prev) => ({ ...prev, foodName: "" }));
              }}
              style={styles.input}
              placeholderTextColor="#94A3B8"
            />
          </View>
          {errors.foodName && (
            <Text style={styles.errorText}>{errors.foodName}</Text>
          )}

          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>📝</Text>
            <TextInput
              placeholder="Description"
              value={description}
              multiline
              numberOfLines={3}
              onChangeText={(text) => setDescription(text)}
              style={[styles.input, { textAlignVertical: "top" }]}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={showDatePicker}
          >
            <Text style={styles.inputIcon}>⏰</Text>
            <Text
              style={[styles.input, { color: useTime ? "#000" : "#94A3B8" }]}
            >
              {useTime
                ? `${useTime.toLocaleDateString()} ${useTime.toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}`
                : "Select use-before date & time"}
            </Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="datetime"
            onConfirm={handleConfirm}
            onCancel={hideDatePicker}
            minimumDate={new Date()}
          />
          {errors.useTime && (
            <Text style={styles.errorText}>{errors.useTime}</Text>
          )}

          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>📦</Text>
            <TextInput
              placeholder="Total quantity"
              value={quantity}
              onChangeText={(text) => {
                setQuantity(text);
                setErrors((prev) => ({ ...prev, quantity: "" }));
              }}
              keyboardType="numeric"
              style={styles.input}
              placeholderTextColor="#94A3B8"
            />
          </View>
          {errors.quantity && (
            <Text style={styles.errorText}>{errors.quantity}</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.postButton, uploading && styles.postButtonDisabled]}
          onPress={handleSubmit}
          disabled={uploading}
          activeOpacity={0.85}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Share Food</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    backgroundColor: "#7C3AED",
    paddingTop: Platform.OS === "ios" ? 50 : 35,
    paddingBottom: 16,
    paddingHorizontal: 16,
    elevation: 6,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#FFFFFF" },
  scrollView: { flex: 1 },
  container: { padding: 12 },
  heroImageContainer: {
    width: "100%",
    height: 280,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#F8F7FF",
  },
  heroImage: { width: "100%", height: "100%" },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    alignItems: "center",
  },
  changeBadge: {
    backgroundColor: "rgba(124, 58, 237, 0.95)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changeBadgeText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  heroPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  cameraIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  cameraIconText: { fontSize: 40 },
  heroPlaceholderText: { fontSize: 20, fontWeight: "700", color: "#7C3AED" },
  heroPlaceholderSubtext: { fontSize: 14, color: "#9333EA" },
  formContainer: { gap: 10, marginBottom: 12 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: "#E9D5FF",
  },
  inputIcon: { fontSize: 18 },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "500",
  },
  postButton: {
    backgroundColor: "#9333EA",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  postButtonDisabled: { backgroundColor: "#94A3B8" },
  postButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  errorText: { color: "#DC2626", fontSize: 13, marginTop: 1, marginLeft: 12 },
});
