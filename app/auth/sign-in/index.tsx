import AuthGuard from "@/components/AuthGuard";
import { hashPassword } from "@/utils/hash";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRouter } from "expo-router";
import { signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
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
  const [newPassword, setNewPassword] = useState<string>("");
  const [resetMode, setResetMode] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Handle Sign In
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

      // Optional: Check hashed password if stored separately
      const enteredHash = hashPassword(password);
      if (enteredHash !== userData?.password) {
        Toast.show({ type: "error", text1: "Invalid password" });
        return;
      }

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

  // Handle Password Reset
  // const OnResetPassword = async () => {
  //   if (!email || !newPassword) {
  //     setErrors({
  //       email: !email ? "Email is required" : undefined,
  //       password: !newPassword ? "New password is required" : undefined,
  //     });
  //     return;
  //   }

  //   try {
  //     // const q = query(collection(db, "users"), where("email", "==", email));
  //     // const querySnapshot = await getDocs(q);

  //     // if (querySnapshot.empty) {
  //     //   Toast.show({ type: "error", text1: "User not found" });
  //     //   return;
  //     // }
  //     const re = await sendPasswordResetEmail(auth, email);
  //     console.log(re);
  //     // const userDoc = querySnapshot.docs[0];

  //     // const hashedPassword = hashPassword(newPassword);

  //     // await updateDoc(doc(db, "users", userDoc.id), {
  //     //   password: hashedPassword,
  //     // });

  //     Toast.show({ type: "success", text1: "Password updated successfully" });
  //     setResetMode(false);
  //     setPassword("");
  //     setNewPassword("");
  //     setErrors({});
  //   } catch (err: any) {
  //     console.log(err);
  //     Toast.show({
  //       type: "error",
  //       text1: "Firebase Error",
  //       text2: err.message,
  //     });
  //   }
  // };

  const OnForgotPassword = async () => {
    // Step 1: Validate the form input
    if (!email || !newPassword) {
      setErrors({
        email: !email ? "Email is required" : undefined,
        password: !newPassword ? "New password is required" : undefined,
      });
      return;
    }

    try {
      // Step 2: Check if the email exists in Firestore
      const q = query(collection(db, "users"), where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // If no user with this email exists
        Toast.show({
          type: "error",
          text1: "Email not found",
          text2: "No account exists with that email.",
        });
        return;
      }

      // Get the document ID (UID) of the user
      const userDoc = querySnapshot.docs[0]; // Assumes email is unique
      const userDocRef = doc(db, "users", userDoc.id); // Use UID as the document reference

      // Step 3: Ask for the old password (re-authentication)
      const oldPassword = prompt("Enter your current password to continue:");
      if (!oldPassword) {
        Toast.show({
          type: "error",
          text1: "Password required",
          text2: "Please provide your current password to proceed.",
        });
        return;
      }

      // Step 4: Re-authenticate using the old password
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          oldPassword
        );
        const user = userCredential.user;

        // Step 5: Update the password in Firebase Authentication
        await updatePassword(user, newPassword);

        // Step 6: Hash the new password before saving it to Firestore
        const hashedPassword = hashPassword(newPassword); // Assuming you have a hashPassword function
        await updateDoc(userDocRef, {
          password: hashedPassword, // Update password in Firestore (hashed)
        });

        // Success message
        Toast.show({
          type: "success",
          text1: "Password updated successfully.",
          text2: "Your password has been changed.",
        });

        setEmail("");
        setNewPassword("");
        setErrors({});
      } catch (err: any) {
        // If reauthentication fails (incorrect old password or other errors)
        console.error(err);
        Toast.show({
          type: "error",
          text1: "Authentication failed",
          text2: err.message || "Please check your old password and try again.",
        });
      }
    } catch (err: any) {
      console.error(err);
      Toast.show({
        type: "error",
        text1: "Error updating password",
        text2: err.message || "Please try again later.",
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
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>
                  {resetMode ? "New Password" : "Password"}{" "}
                  <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={
                    resetMode ? "Enter new password" : "Enter password"
                  }
                  secureTextEntry
                  onChangeText={(text) => {
                    resetMode ? setNewPassword(text) : setPassword(text);
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  value={resetMode ? newPassword : password}
                />
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

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
  imageContainer: {
    width: "100%",
    height: width > 400 ? 220 : 180,
    marginTop: 4,
  },
  image: { width: "100%", height: "100%" },
});
