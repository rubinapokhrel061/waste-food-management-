import { db } from "@/configs/FirebaseConfig";
import { useUser } from "@/contexts/UserContext";
import { getDistance } from "@/utils/dijkstra";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { addDoc, collection, getDocs, Timestamp } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import DateTimePickerModal from "react-native-modal-datetime-picker";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  expoPushToken?: string;
}

export default function PostFoodScreen() {
  const [foodName, setFoodName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [pickupGuidelines, setPickupGuidelines] = useState("");
  const [useTime, setUseTime] = useState<Date | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const { user } = useUser();

  const [address, setAddress] = useState("");
  const [region, setRegion] = useState<any>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [errors, setErrors] = useState({
    foodName: "",
    quantity: "",
    imageUri: "",
    useTime: "",
    location: "",
  });
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [NGOs, setNGOs] = useState<User[]>([]);
  const router = useRouter();
  useEffect(() => {
    fetchUsers();
    loadUserLocation();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData: User[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() } as User);
      });
      const ngoUsers = usersData.filter((user) => user.role === "ngo");
      setNGOs(ngoUsers);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const loadUserLocation = async () => {
    try {
      setLocationLoading(true);

      if (user) {
        const querySnapshot = await getDocs(collection(db, "users"));
        const userData = querySnapshot.docs
          .find((doc) => doc.data().uid === user.uid || doc.id === user.uid)
          ?.data() as User | undefined;

        if (userData?.location) {
          setLocation({
            latitude: userData.location.latitude,
            longitude: userData.location.longitude,
          });
          setAddress(userData.location.address);
          setRegion({
            latitude: userData.location.latitude,
            longitude: userData.location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          setLocationLoading(false);
          return;
        }
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required");
        setLocationLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      const [result] = await Location.reverseGeocodeAsync(coords);
      const addressText = `${result.street || ""}, ${result.city || ""}, ${
        result.region || ""
      }`.trim();

      setLocation(coords);
      setAddress(addressText || "Location obtained");
      setRegion({
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.error("Location error:", error);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSelectLocation = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLocation({ latitude, longitude });

    try {
      const [result] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const addressText = `${result.street || ""}, ${result.city || ""}, ${
        result.region || ""
      }`.trim();
      setAddress(addressText || "Location Selected");
      setErrors((prev) => ({ ...prev, location: "" }));
    } catch (error) {
      console.error("Reverse geocode error:", error);
      setAddress("Location Selected");
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setErrors((prev) => ({ ...prev, imageUri: "" }));
    }
  };

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

  const validateInputs = () => {
    const newErrors = {
      foodName: foodName ? "" : "Food name is required",
      quantity: quantity ? "" : "Quantity is required",
      imageUri: imageUri ? "" : "Image is required",
      useTime: useTime ? "" : "Use before date is required",
      location: location ? "" : "Pickup location is required",
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some((e) => e);
  };

  const getNearestNGOs = (
    users: User[],
    donorLocation: { latitude: number; longitude: number }
  ) => {
    const distances = users.map((user) => ({
      userId: user.id,
      distance: getDistance(
        donorLocation.latitude,
        donorLocation.longitude,
        user.location.latitude,
        user.location.longitude
      ),
    }));

    const sortedNGOs = distances
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
    return sortedNGOs.map((sortedNgo) =>
      users.find((user) => user.id === sortedNgo.userId)
    );
  };

  const handleSubmit = async () => {
    if (!validateInputs()) return;

    try {
      setLoading(true);
      const imageUrl = await uploadImageToCloudinary(imageUri!);

      const foodRef = await addDoc(collection(db, "foods"), {
        foodName,
        description,
        useTime: Timestamp.fromDate(useTime!),
        quantity: quantity,
        imageUrl,
        createdAt: Timestamp.now(),
        createdBy: {
          uid: user?.uid || null,
          isAnonymous: user?.isAnonymous || false,
          email: user?.email || null,
          name: user?.fullName || null,
        },
        location: {
          latitude: location?.latitude || null,
          longitude: location?.longitude || null,
          address: address || "Unknown address",
        },
        pickupGuidelines: pickupGuidelines || "",
        status: "pending",
      });
      console.log(foodRef);
      const nearestNGOs = getNearestNGOs(NGOs, location!).slice(0, 3);
      for (const ngo of nearestNGOs) {
        if (!ngo?.email) continue;
        const payload = {
          to: ngo.email,
          subject: `New Food Donation Available: ${foodName}`,
          message: `<p>Hello ${ngo.fullName},</p>
                  <p>A donor has posted food for donation: <strong>${foodName}</strong>. Please check and confirm if you can accept it.</p>
                  <p>Location: ${address}</p>`,
        };
        try {
          await fetch(
            "https://waste-food-backend-522q.onrender.com/api/email/sendEmail",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }
          );
        } catch (emailErr) {
          console.error(`Failed to send email to ${ngo.email}:`, emailErr);
        }
      }

      Alert.alert("Success", "Food shared successfully!");
      setFoodName("");
      setDescription("");
      setUseTime(null);
      setQuantity("");
      setImageUri(null);

      setPickupGuidelines("");
      setErrors({
        foodName: "",
        quantity: "",
        imageUri: "",
        useTime: "",
        location: "",
      });
      router.push("/screen/FoodsScreen");
    } catch (err: any) {
      console.error("Submit error:", err);
      Alert.alert("Error", err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirm = (date: Date) => {
    setUseTime(date);
    setErrors((prev) => ({ ...prev, useTime: "" }));
    hideDatePicker();
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="restaurant" size={24} color="#7C3AED" />
          </View>
          <Text style={styles.headerTitle}>Share Food</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={async () => {
            // Clear all form fields
            setFoodName("");
            setQuantity("");
            setDescription("");
            setPickupGuidelines("");
            setUseTime(null);
            setImageUri(null);
            setAddress("");
            setRegion(null);
            setErrors({
              foodName: "",
              quantity: "",
              imageUri: "",
              useTime: "",
              location: "",
            });
            if (user?.role === "ngo") {
              await loadUserLocation();
            }
            await fetchUsers();
          }}
        >
          <Ionicons name="refresh" size={24} color="#9333EA" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Picker */}
        <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
          {imageUri ? (
            <View style={{ flex: 1, borderRadius: 16, overflow: "hidden" }}>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <View style={styles.imageOverlay}>
                <View style={styles.changeBadge}>
                  <Ionicons name="camera" size={16} color="#FFF" />
                  <Text style={styles.changeBadgeText}>Change Photo</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <View style={styles.cameraIconWrapper}>
                <Ionicons name="camera-outline" size={40} color="#7C3AED" />
              </View>
              <Text style={styles.placeholderText}>Add Food Photo</Text>
              <Text style={styles.placeholderSubtext}>
                Show what you're sharing
              </Text>
            </View>
          )}
        </TouchableOpacity>
        {errors.imageUri && (
          <Text style={styles.errorText}>{errors.imageUri}</Text>
        )}

        {/* Form Container */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Food Details</Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconWrapper}>
                <Ionicons name="fast-food-outline" size={20} color="#7C3AED" />
              </View>
              <TextInput
                placeholder="Food name"
                value={foodName}
                onChangeText={(text) => {
                  setFoodName(text);
                  setErrors((prev) => ({ ...prev, foodName: "" }));
                }}
                style={styles.input}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {errors.foodName && (
              <Text style={styles.errorText}>{errors.foodName}</Text>
            )}
          </View>
          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconWrapper}>
                <Ionicons name="cube-outline" size={20} color="#7C3AED" />
              </View>
              <TextInput
                placeholder="Quantity"
                value={quantity}
                onChangeText={(text) => {
                  setQuantity(text);
                  setErrors((prev) => ({ ...prev, quantity: "" }));
                }}
                style={styles.input}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {errors.quantity && (
              <Text style={styles.errorText}>{errors.quantity}</Text>
            )}
          </View>
          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={showDatePicker}
            >
              <View style={styles.inputIconWrapper}>
                <Ionicons name="time-outline" size={20} color="#7C3AED" />
              </View>
              <Text style={[styles.input, !useTime && styles.placeholderStyle]}>
                {useTime
                  ? useTime.toLocaleString()
                  : "Select best before date & time"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            {errors.useTime && (
              <Text style={styles.errorText}>{errors.useTime}</Text>
            )}
          </View>
        </View>

        {/* Pickup Location */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Pickup Location</Text>

          {locationLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#7C3AED" />
              <Text style={styles.loadingText}>Loading location...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.locationBtn,
                errors.location && styles.locationBtnError,
              ]}
              onPress={() => setMapVisible(true)}
            >
              <View style={styles.locationIconWrapper}>
                <Ionicons name="location-outline" size={20} color="#EC4899" />
              </View>
              <Text style={styles.locationText}>
                {location ? address || "Location Selected" : "Select location"}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#7C3AED" />
            </TouchableOpacity>
          )}
          {errors.location && (
            <Text style={styles.errorText}>{errors.location}</Text>
          )}
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Food Description</Text>

          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Pickup Guidelines */}
        <View style={styles.formCard}>
          <View style={styles.sectionTitle}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#7C3AED"
            />
            <Text style={styles.sectionTitleText}>Pickup Guidelines</Text>
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Add any special instructions for pickup"
              value={pickupGuidelines}
              onChangeText={setPickupGuidelines}
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#FFF" />
              <Text style={styles.submitButtonText}>Share Food</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        minimumDate={new Date()}
      />

      {/* Map Modal */}
      <Modal visible={mapVisible} animationType="slide">
        <View style={{ flex: 1 }}>
          {region && (
            <MapView
              style={{ flex: 1 }}
              initialRegion={region}
              onPress={handleSelectLocation}
            >
              {location && (
                <Marker coordinate={location} title="Selected Location">
                  <View style={styles.customMarker}>
                    <Ionicons name="location" size={40} color="#7C3AED" />
                  </View>
                </Marker>
              )}
            </MapView>
          )}
          <View style={styles.mapOverlay}>
            <View style={styles.mapAddressCard}>
              <Ionicons name="location" size={20} color="#7C3AED" />
              <Text style={styles.mapAddressText}>
                {address || "Tap on map to select location"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setMapVisible(false)}
            >
              <Text style={styles.doneText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#FFF",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomColor: "#E9E7F5",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 16,
  },
  imageContainer: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#d5cfeaff",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124, 58, 237, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  changeBadgeText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#7C3AED",
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  formCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flexDirection: "row",
    marginBottom: 16,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: "#E9E7F5",
  },

  inputIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  placeholderStyle: {
    color: "#9CA3AF",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E9E7F5",
  },
  locationBtnError: {
    borderColor: "#DC2626",
  },
  locationIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  customMarker: {
    backgroundColor: "transparent",
  },
  mapOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  mapAddressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
  },
  mapAddressText: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  doneBtn: {
    backgroundColor: "#7C3AED",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  doneText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
});
