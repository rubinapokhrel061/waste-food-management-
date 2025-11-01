import LogoutButton from "@/components/LogoutButton";
import { auth } from "@/configs/FirebaseConfig";
import { hashPassword } from "@/utils/hash";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useNavigation, useRouter } from "expo-router";
import { doc, getDoc, getFirestore, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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
import Toast from "react-native-toast-message";

const db = getFirestore();
const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const navigation = useNavigation();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<any>({});
  const [location, setLocation] = useState<any>(null);
  const [region, setRegion] = useState<any>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    loadUserData();
    requestLocationPermission();
  }, []);

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace("/auth/sign-in");
        return;
      }
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setFullName(userData.fullName || "");
        setEmail(userData.email || "");
        if (userData.location) {
          setLocation({
            latitude: userData.location.latitude,
            longitude: userData.location.longitude,
          });
          setAddress(userData.location.address || "");
          setRegion({
            latitude: userData.location.latitude,
            longitude: userData.location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      Toast.show({
        type: "error",
        text1: "Failed to load profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: "error",
        text1: "Location permission denied",
      });
      return;
    }

    if (!region) {
      let loc = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!fullName.trim()) newErrors.fullName = "Full Name is required";
    if (!location) newErrors.location = "Please select a location";

    // Password validation (only if user is trying to change password)
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) {
        newErrors.currentPassword = "Current password is required";
      }
      if (!newPassword) {
        newErrors.newPassword = "New password is required";
      } else if (newPassword.length < 6) {
        newErrors.newPassword = "Password must be at least 6 characters";
      }
      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSelectLocation = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setLocation({ latitude, longitude });

    const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (geocode.length > 0) {
      const { city, region, country } = geocode[0];
      setAddress(`${city || ""}, ${region || ""}, ${country || ""}`);
    }
  };

  const handleSaveClick = () => {
    if (!validateForm()) return;
    setConfirmModalVisible(true);
  };

  const handleUpdateProfile = async () => {
    setConfirmModalVisible(false);
    setUpdating(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace("/auth/sign-in");
        return;
      }

      // Get current user data to verify password
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        throw new Error("User data not found");
      }

      const userData = userDoc.data();
      const updateData: any = {
        fullName,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: address || "Unknown",
        },
        updatedAt: new Date(),
      };

      // Handle password change
      if (currentPassword && newPassword) {
        const enteredHash = hashPassword(currentPassword);

        if (enteredHash !== userData.password) {
          Toast.show({
            type: "error",
            text1: "Incorrect Password",
            text2: "Current password is incorrect",
          });
          setUpdating(false);
          return;
        }

        updateData.password = hashPassword(newPassword);
      }

      await updateDoc(doc(db, "users", user.uid), updateData);

      Toast.show({
        type: "success",
        text1: "Profile updated successfully",
        text2: newPassword
          ? "Password changed successfully"
          : "Your changes have been saved",
      });

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      router.back();
    } catch (error: any) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Update failed",
        text2: error.message,
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Gradient Header Background */}
          <View style={styles.headerGradient}>
            <View style={styles.gradientCircle1} />
            <View style={styles.gradientCircle2} />
          </View>

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            style={styles.backBtnContainer}
          >
            <Ionicons name="arrow-back" size={24} color="#7C3AED" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.iconWrapper}>
              <Ionicons name="person" size={32} color="#7C3AED" />
            </View>
            <Text style={styles.mainTitle}>Update Profile</Text>
            <Text style={styles.subTitle}>
              Keep your information up to date
            </Text>
          </View>

          {/* Form Container */}
          <View style={styles.formCard}>
            {/* Full Name */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Full Name</Text>
              <View
                style={[styles.inputBox, errors.fullName && styles.inputError]}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="person-outline" size={20} color="#7C3AED" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="#A78BFA"
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    if (errors.fullName && text.trim()) {
                      setErrors((prev: any) => ({
                        ...prev,
                        fullName: undefined,
                      }));
                    }
                  }}
                />
              </View>
              {errors.fullName && (
                <Text style={styles.errorText}>{errors.fullName}</Text>
              )}
            </View>

            {/* Email (Read-only) */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputBox, styles.disabledInput]}>
                <View style={styles.iconContainer}>
                  <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                </View>
                <TextInput
                  style={[styles.input, styles.disabledText]}
                  value={email}
                  editable={false}
                />
                <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
              </View>
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>

            {/* Location */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Location</Text>
              <TouchableOpacity
                style={[
                  styles.locationBtn,
                  errors.location && styles.inputError,
                ]}
                onPress={() => setMapVisible(true)}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="location-outline" size={20} color="#3B82F6" />
                </View>
                <Text style={styles.locationText}>
                  {location
                    ? address || "Location Selected"
                    : "Select location"}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#3B82F6" />
              </TouchableOpacity>
              {errors.location && (
                <Text style={styles.errorText}>{errors.location}</Text>
              )}
            </View>

            {/* Password Section Header */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLine} />
              <Text style={styles.sectionHeaderText}>
                Change Password (Optional)
              </Text>
              <View style={styles.sectionHeaderLine} />
            </View>

            {/* Current Password */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Current Password</Text>
              <View
                style={[
                  styles.inputBox,
                  errors.currentPassword && styles.inputError,
                ]}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#7C3AED"
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter current password"
                  placeholderTextColor="#A78BFA"
                  secureTextEntry={!showCurrentPassword}
                  value={currentPassword}
                  onChangeText={(text) => {
                    setCurrentPassword(text);
                    if (errors.currentPassword && text) {
                      setErrors((prev: any) => ({
                        ...prev,
                        currentPassword: undefined,
                      }));
                    }
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Ionicons
                    name={showCurrentPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#A78BFA"
                  />
                </TouchableOpacity>
              </View>
              {errors.currentPassword && (
                <Text style={styles.errorText}>{errors.currentPassword}</Text>
              )}
            </View>

            {/* New Password */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>New Password</Text>
              <View
                style={[
                  styles.inputBox,
                  errors.newPassword && styles.inputError,
                ]}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="key-outline" size={20} color="#7C3AED" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="#A78BFA"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (errors.newPassword && text.length >= 6) {
                      setErrors((prev: any) => ({
                        ...prev,
                        newPassword: undefined,
                      }));
                    }
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#A78BFA"
                  />
                </TouchableOpacity>
              </View>
              {errors.newPassword && (
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View
                style={[
                  styles.inputBox,
                  errors.confirmPassword && styles.inputError,
                ]}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#7C3AED"
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor="#A78BFA"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword && text === newPassword) {
                      setErrors((prev: any) => ({
                        ...prev,
                        confirmPassword: undefined,
                      }));
                    }
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#A78BFA"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            {/* Update Button */}
            <TouchableOpacity
              style={[styles.updateButton, updating && styles.disabledButton]}
              onPress={handleSaveClick}
              activeOpacity={0.85}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.updateButtonText}>Save Changes</Text>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
            <LogoutButton />
            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setMapVisible(false)}
            >
              <Text style={styles.doneText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.confirmIconWrapper}>
              <Ionicons name="warning-outline" size={48} color="#F59E0B" />
            </View>
            <Text style={styles.confirmTitle}>Confirm Changes</Text>
            <Text style={styles.confirmMessage}>
              {currentPassword && newPassword
                ? "Are you sure you want to update your profile and change your password?"
                : "Are you sure you want to update your profile?"}
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmSaveBtn}
                onPress={handleUpdateProfile}
              >
                <Text style={styles.confirmSaveText}>Yes, Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  loadingText: {
    marginTop: 12,
    fontFamily: "outfit",
    fontSize: 16,
    color: "#6B7280",
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    overflow: "hidden",
  },
  gradientCircle1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#F3E8FF",
    top: -100,
    right: -50,
    opacity: 0.5,
  },
  gradientCircle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#DBEAFE",
    top: 50,
    left: -50,
    opacity: 0.3,
  },
  backBtnContainer: {
    position: "absolute",
    top: 40,
    left: 16,
    zIndex: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  headerContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
    zIndex: 1,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  mainTitle: {
    fontFamily: "outfit-bold",
    fontSize: width > 380 ? 30 : 26,
    color: "#1F2937",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subTitle: {
    fontFamily: "outfit",
    fontSize: width > 380 ? 14 : 13,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  inputWrapper: {
    marginBottom: 14,
  },
  label: {
    fontFamily: "outfit",
    fontSize: 13,
    marginBottom: 6,
    color: "#374151",
    fontWeight: "600",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: "outfit",
    fontSize: 15,
    color: "#1F2937",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  disabledInput: {
    backgroundColor: "#F3F4F6",
    borderColor: "#D1D5DB",
  },
  disabledText: {
    color: "#9CA3AF",
  },
  helperText: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 4,
    fontFamily: "outfit",
    marginLeft: 2,
    fontStyle: "italic",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
    fontFamily: "outfit",
    marginLeft: 2,
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    color: "#6B7280",
    fontFamily: "outfit",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 12,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  sectionHeaderText: {
    fontSize: 13,
    fontFamily: "outfit",
    color: "#6B7280",
    fontWeight: "600",
  },
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 6,
    gap: 8,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: "#A78BFA",
    opacity: 0.7,
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontFamily: "outfit-bold",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontFamily: "outfit",
    fontSize: 16,
    fontWeight: "600",
  },
  mapOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  customMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtn: {
    backgroundColor: "#7C3AED",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  doneText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  confirmModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmIconWrapper: {
    alignSelf: "center",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 22,
    fontFamily: "outfit-bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 15,
    fontFamily: "outfit",
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 12,
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  confirmCancelText: {
    fontSize: 15,
    fontFamily: "outfit",
    color: "#6B7280",
    fontWeight: "600",
  },
  confirmSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmSaveText: {
    fontSize: 15,
    fontFamily: "outfit-bold",
    color: "#FFFFFF",
  },
});
