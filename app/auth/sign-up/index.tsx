import AuthGuard from "@/components/AuthGuard";
import { hashPassword } from "@/utils/hash";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useNavigation, useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
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
import { auth } from "../../../configs/FirebaseConfig";

const db = getFirestore();
const { width } = Dimensions.get("window");

const roles: string[] = ["admin", "ngo", "donor"];

export default function SignUp() {
  const navigation = useNavigation();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("donor");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [location, setLocation] = useState<any>(null);
  const [region, setRegion] = useState<any>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [address, setAddress] = useState("");

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Location permission denied",
        });
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);
  const validateForm = () => {
    const newErrors: any = {};
    if (!fullName.trim()) newErrors.fullName = "Full Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "Enter a valid email";
    if (!password.trim()) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!role || !["admin", "ngo", "donor"].includes(role))
      newErrors.role = "Please select a valid role";
    if (!location || !location.latitude || !location.longitude)
      newErrors.location = "Please select your location on the map";
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
  const OnCreateAccount = async () => {
    if (!validateForm()) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        fullName,
        email,
        role,
        uid: user.uid,
        password: hashPassword(password),
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: address || "Unknown",
        },
        createdAt: new Date(),
      });

      Toast.show({
        type: "success",
        text1: "Account created",
        text2: `Welcome ${role.toUpperCase()}!`,
      });

      if (role === "admin") {
        router.replace("/admin/dashboard");
      } else if (role === "ngo") {
        router.replace("/ngo/home");
      } else {
        router.replace("/donor/home");
      }
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        Toast.show({
          type: "error",
          text1: "Email already in use",
          text2: "Please use a different email address.",
        });
      } else {
        console.log(error);
        Toast.show({ type: "error", text1: error.message });
      }
    }
  };

  return (
    <AuthGuard>
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
                <Ionicons name="restaurant" size={32} color="#7C3AED" />
              </View>
              <Text style={styles.mainTitle}>Create Account</Text>
              <Text style={styles.subTitle}>
                Help us reduce food waste together
              </Text>
            </View>

            {/* Form Container */}
            <View style={styles.formCard}>
              {/* Full Name */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>
                  Full Name <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputBox,
                    errors.fullName && styles.inputError,
                  ]}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name="person-outline" size={20} color="#7C3AED" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
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

              {/* Email */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>
                  Email <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[styles.inputBox, errors.email && styles.inputError]}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name="mail-outline" size={20} color="#10B981" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    keyboardType="email-address"
                    value={email}
                    autoCapitalize="none"
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) {
                        if (/\S+@\S+\.\S+/.test(text)) {
                          setErrors((prev: any) => ({
                            ...prev,
                            email: undefined,
                          }));
                        }
                      }
                    }}
                  />
                </View>
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              {/* Password */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>
                  Password <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputBox,
                    errors.password && styles.inputError,
                  ]}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#F59E0B"
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Min 6 characters"
                    value={password}
                    secureTextEntry={!showPassword}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) {
                        if (text.length >= 6) {
                          setErrors((prev: any) => ({
                            ...prev,
                            password: undefined,
                          }));
                        }
                      }
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={22}
                      color="#F59E0B"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {/* Location */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>
                  Location <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.locationBtn,
                    errors.location && styles.inputError,
                  ]}
                  onPress={() => setMapVisible(true)}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color="#3B82F6"
                    />
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

              {/* Role Selection */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>
                  Select Role <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.roleRow}>
                  {roles.map((r, index) => {
                    const colors = [
                      {
                        bg: "#FEF3C7",
                        border: "#F59E0B",
                        text: "#92400E",
                        active: "#F59E0B",
                      },
                      {
                        bg: "#DBEAFE",
                        border: "#3B82F6",
                        text: "#1E40AF",
                        active: "#3B82F6",
                      },
                      {
                        bg: "#FCE7F3",
                        border: "#EC4899",
                        text: "#9F1239",
                        active: "#EC4899",
                      },
                    ];
                    return (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.roleBtn,
                          { borderColor: colors[index].border },
                          role === r && {
                            backgroundColor: colors[index].active,
                            borderColor: colors[index].active,
                          },
                        ]}
                        onPress={() => setRole(r)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.roleIconCircle,
                            {
                              backgroundColor:
                                role === r
                                  ? "rgba(255,255,255,0.3)"
                                  : colors[index].bg,
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              r === "admin"
                                ? "shield-checkmark-outline"
                                : r === "ngo"
                                ? "people-outline"
                                : "heart-outline"
                            }
                            size={20}
                            color={
                              role === r ? "#FFFFFF" : colors[index].active
                            }
                          />
                        </View>
                        <Text
                          style={[
                            styles.roleText,
                            {
                              color:
                                role === r ? "#FFFFFF" : colors[index].text,
                            },
                          ]}
                        >
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.role && (
                  <Text style={styles.errorText}>{errors.role}</Text>
                )}
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity
                style={styles.signUpButton}
                onPress={OnCreateAccount}
                activeOpacity={0.85}
              >
                <Text style={styles.signUpButtonText}>Create Account</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Sign In Link */}
              <View style={styles.signInContainer}>
                <Text style={styles.signInText}>Have an account?</Text>
                <TouchableOpacity
                  onPress={() => router.replace("/auth/sign-in")}
                >
                  <Text style={styles.signInLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
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
      </KeyboardAvoidingView>
    </AuthGuard>
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
    paddingTop: 10,
    paddingBottom: 20,
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
    top: 30,
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
    marginBottom: 10,
    zIndex: 1,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
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
    marginBottom: 4,
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
    marginBottom: 8,
  },
  required: { color: "red", fontSize: 16 },
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
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 10,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    color: "#6B7280",
    fontFamily: "outfit",
  },
  roleRow: {
    flexDirection: "row",
    gap: 10,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  roleText: {
    fontFamily: "outfit",
    fontSize: 12,
    fontWeight: "600",
  },
  signUpButton: {
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
  signUpButtonText: {
    color: "#FFFFFF",
    fontFamily: "outfit-bold",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 14,
    gap: 4,
  },
  signInText: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "outfit",
  },
  signInLink: {
    color: "#7C3AED",
    fontWeight: "700",
    fontFamily: "outfit",
  },
  passwordToggle: {
    padding: 6,
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
});
