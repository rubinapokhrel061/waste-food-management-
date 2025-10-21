import AuthGuard from "@/components/AuthGuard";
import { hashPassword } from "@/utils/hash";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRouter } from "expo-router";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { auth, db } from "../../../configs/FirebaseConfig";

const { width } = Dimensions.get("window");

export default function SignIn() {
  const navigation = useNavigation();
  const router = useRouter();
  const [resetMode, setResetMode] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const OnSignIn = async () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log(userCredential);
      const uid = userCredential?.user?.uid;

      const userDoc = await getDoc(doc(db, "users", uid));
      if (!userDoc.exists()) {
        Toast.show({ type: "error", text1: "User data not found" });
        return;
      }
      const userData = userDoc.data();
      const enteredHash = hashPassword(password);
      await updateDoc(doc(db, "users", uid), { password: enteredHash });

      if (userData.role === "admin") router.replace("/admin/dashboard");
      else if (userData.role === "ngo") router.replace("/ngo/home");
      else router.replace("/donor/home");

      Toast.show({
        type: "success",
        text1: "Login Successfully",
        text2: `Welcome back!`,
      });
      setErrors({});
    } catch (err: any) {
      console.log(err);
      if (err.code === "auth/invalid-credential") {
        Toast.show({
          type: "error",
          text1: "Email or password does not match",
        });
      } else {
        Toast.show({
          type: "error",
          text2: err.message || "An error occurred during sign-in",
        });
      }
    }
  };

  const OnForgotPassword = async () => {
    if (!email) {
      setErrors({ email: "Email is required" });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Toast.show({
        type: "success",
        text1: "Reset link sent!",
        text2: "Check your email to reset your password.",
      });
      setEmail("");
      setErrors({});
      setResetMode(false);
    } catch (err: any) {
      console.log("Password reset error:", err);
      Toast.show({
        type: "error",
        text1: "Error sending reset link",
        text2: err.message || "Please check your email and try again.",
      });
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
                <Ionicons
                  name={resetMode ? "lock-closed" : "log-in"}
                  size={32}
                  color="#7C3AED"
                />
              </View>
              <Text style={styles.mainTitle}>
                {resetMode ? "Reset Password" : "Welcome Back"}
              </Text>
              <Text style={styles.subTitle}>
                {resetMode
                  ? "Enter your email to receive a reset link"
                  : "Sign in to continue reducing food waste"}
              </Text>
            </View>

            {/* Form Container */}
            <View style={styles.formCard}>
              {/* Email */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Email</Text>
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
                        setErrors((prev) => ({ ...prev, email: undefined }));
                      }
                    }}
                  />
                </View>
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              {/* Password */}
              {!resetMode && (
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Password</Text>
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
                      placeholder="Enter your password"
                      value={password}
                      secureTextEntry={!showPassword}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errors.password) {
                          setErrors((prev) => ({
                            ...prev,
                            password: undefined,
                          }));
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
              )}

              {/* Forgot Password Link */}
              <TouchableOpacity
                onPress={() => setResetMode(!resetMode)}
                style={styles.forgotPasswordContainer}
              >
                <Text style={styles.forgotPasswordText}>
                  {resetMode ? "← Back to Sign In" : "Forgot Password?"}
                </Text>
              </TouchableOpacity>

              {/* Sign In / Reset Button */}
              <TouchableOpacity
                style={styles.signInButton}
                onPress={resetMode ? OnForgotPassword : OnSignIn}
                activeOpacity={0.85}
              >
                <Text style={styles.signInButtonText}>
                  {resetMode ? "Send Reset Link" : "Sign In"}
                </Text>
                <Ionicons
                  name={resetMode ? "mail" : "arrow-forward"}
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              {/* Sign Up Link */}
              {!resetMode && (
                <View style={styles.signUpContainer}>
                  <Text style={styles.signUpText}>Don't have an account?</Text>
                  <TouchableOpacity
                    onPress={() => router.replace("/auth/sign-up")}
                  >
                    <Text style={styles.signUpLink}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Bottom Decorative Element */}
            <View style={styles.bottomDecoration}>
              <View style={styles.decorCircle1} />
              <View style={styles.decorCircle2} />
            </View>
          </View>
        </ScrollView>
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
    paddingTop: 40,
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
    marginBottom: 30,
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
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 1,
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
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
    fontFamily: "outfit",
    marginLeft: 2,
  },
  passwordToggle: {
    padding: 6,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginTop: 4,
    marginBottom: 10,
  },
  forgotPasswordText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: "#7C3AED",
    fontWeight: "600",
  },
  signInButton: {
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
  signInButtonText: {
    color: "#FFFFFF",
    fontFamily: "outfit-bold",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 4,
  },
  signUpText: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "outfit",
  },
  signUpLink: {
    color: "#7C3AED",
    fontWeight: "700",
    fontFamily: "outfit",
  },
  bottomDecoration: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    overflow: "hidden",
  },
  decorCircle1: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#FEF3C7",
    bottom: -50,
    right: 20,
    opacity: 0.4,
  },
  decorCircle2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FCE7F3",
    bottom: 30,
    left: -20,
    opacity: 0.3,
  },
});
