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
  Image,
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
import { Colors } from "../../../constants/Colors";

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

      // Navigate based on role
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
      router.replace("/auth/sign-in");
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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-back"
                size={28}
                style={styles.backBtnContainer}
                color={Colors.black}
              />
            </TouchableOpacity>

            {/* Title */}
            <View style={styles.textContainer}>
              <Text style={styles.mainTitle}>
                {resetMode ? "Reset Password" : "Let's Sign You In"}
              </Text>
              <Text style={styles.subTitle}>
                {resetMode ? (
                  <Text style={{ fontWeight: "bold", color: Colors.blue }}>
                    Enter your email and new password
                  </Text>
                ) : (
                  <>
                    Welcome back,{" "}
                    <Text style={{ fontWeight: "bold", color: Colors.blue }}>
                      we missed you!
                    </Text>
                  </>
                )}
              </Text>
            </View>

            {/* Form */}
            <View style={styles.inputContainer}>
              {/* Email */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>
                  Email <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  value={email}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              {/* Password / New Password */}
              {!resetMode && (
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>
                    Password
                    <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.passwordInputWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Enter your password"
                      secureTextEntry={!showPassword}
                      onChangeText={(text) => {
                        setPassword(text);
                        setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      value={password}
                    />

                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.passwordToggle}
                    >
                      <Ionicons
                        name={showPassword ? "eye" : "eye-off"}
                        size={22}
                        color={Colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}
                </View>
              )}
              {/* Forgot Password */}
              <TouchableOpacity
                onPress={() => setResetMode(!resetMode)}
                style={styles.forgotPasswordContainer}
              >
                <Text style={styles.forgotPasswordText}>
                  {resetMode ? "Back to Sign In" : "Forgot Password?"}
                </Text>
              </TouchableOpacity>

              {/* Action Button */}
              <TouchableOpacity
                style={styles.signInButton}
                onPress={resetMode ? OnForgotPassword : OnSignIn}
              >
                <Text style={styles.signInButtonText}>
                  {resetMode ? "Reset Password" : "Sign In"}
                </Text>
              </TouchableOpacity>

              {/* Sign Up */}
              {!resetMode && (
                <View style={styles.signUpContainer}>
                  <Text style={styles.signUpText}>
                    Don&apos;t have an account?
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.replace("/auth/sign-up")}
                  >
                    <Text style={styles.signUpLink}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Bottom Image */}
            <View style={styles.imageContainer}>
              <Image
                source={require("../../../assets/images/login-register.jpg")}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: Colors.white,
  },
  backBtnContainer: { position: "absolute", top: 20, left: 2, zIndex: 10 },
  textContainer: { alignItems: "center", marginBottom: 20, marginTop: 20 },
  mainTitle: {
    fontFamily: "outfit-bold",
    fontSize: width > 380 ? 32 : 26,
    color: Colors.black,
  },
  subTitle: {
    fontFamily: "outfit",
    fontSize: width > 380 ? 16 : 14,
    color: Colors.primary,
    marginTop: 5,
    textAlign: "center",
  },
  inputContainer: { width: "100%", maxWidth: 450 },
  inputWrapper: { marginTop: 15 },
  label: {
    fontFamily: "outfit",
    fontSize: 16,
    color: Colors.black,
    marginBottom: 6,
  },
  required: { color: "red", fontSize: 16 },
  input: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: Colors.primary,
    fontFamily: "outfit",
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  errorText: { color: "red", fontSize: 14, marginTop: 4 },
  forgotPasswordContainer: { marginTop: 8, alignSelf: "flex-end" },
  forgotPasswordText: {
    color: Colors.blue,
    fontFamily: "outfit-bold",
    fontSize: 14,
  },
  signInButton: {
    padding: 15,
    backgroundColor: Colors.blue,
    borderRadius: 15,
    marginTop: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  signInButtonText: {
    color: Colors.white,
    fontFamily: "outfit-bold",
    fontSize: 18,
    textAlign: "center",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signUpText: { fontSize: 14, color: Colors.primary, fontFamily: "outfit" },
  signUpLink: {
    color: Colors.blue,
    fontWeight: "bold",
    fontFamily: "outfit",
    marginLeft: 5,
  },

  passwordInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f9f9f9",
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: "outfit",
    fontSize: 16,
  },

  passwordToggle: {
    padding: 6,
  },

  imageContainer: {
    width: "100%",
    height: width > 400 ? 220 : 180,
    marginTop: 4,
  },
  image: { width: "100%", height: "100%" },
});
