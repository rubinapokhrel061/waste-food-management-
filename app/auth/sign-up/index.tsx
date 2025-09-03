import { hashPassword } from "@/utils/hash";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { auth } from "../../../configs/FirebaseConfig";
import { Colors } from "../../../constants/Colors";

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

  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const OnCreateAccount = async () => {
    if (!validateForm()) return;
    console.log(fullName, email, role);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log(userCredential);

      await setDoc(doc(db, "users", user.uid), {
        fullName,
        email,
        role,
        password: hashPassword(password),
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
      Toast.show({ type: "error", text1: error.message });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={styles.backBtnContainer}
        >
          <Ionicons name="arrow-back" size={28} color={Colors.black} />
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.textContainer}>
          <Text style={styles.mainTitle}>Create Account</Text>
          <Text style={styles.subTitle}>
            Join us as an{" "}
            <Text style={{ fontWeight: "bold", color: Colors.blue }}>
              Admin, NGO, or Donor
            </Text>
          </Text>
        </View>

        {/* Inputs */}
        <View style={styles.inputContainer}>
          {/* Full Name */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.fullName && { borderColor: "red" }]}
              placeholder="Enter your name"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (errors.fullName && text.trim()) {
                  setErrors((prev: any) => ({ ...prev, fullName: undefined }));
                }
              }}
            />
            {errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName}</Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              Email <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.email && { borderColor: "red" }]}
              placeholder="Enter your email"
              keyboardType="email-address"
              value={email}
              autoCapitalize="none"
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  if (/\S+@\S+\.\S+/.test(text)) {
                    setErrors((prev: any) => ({ ...prev, email: undefined }));
                  }
                }
              }}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              Password <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.password && { borderColor: "red" }]}
              secureTextEntry
              placeholder="Enter password"
              value={password}
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
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Role Selection */}
          <Text style={[styles.label, { marginTop: 20 }]}>
            Select Role <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.roleRow}>
            {roles.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                onPress={() => setRole(r)}
              >
                <Text
                  style={role === r ? styles.roleTextActive : styles.roleText}
                >
                  {r.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sign Up */}
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={OnCreateAccount}
          >
            <Text style={styles.signUpButtonText}>Sign Up</Text>
          </TouchableOpacity>

          {/* Sign In */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.replace("/auth/sign-in")}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: Colors.white,
    justifyContent: "space-between",
  },
  backBtnContainer: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
  },
  textContainer: {
    alignItems: "center",
    marginTop: 20,
  },
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
  inputContainer: {
    width: "100%",
    maxWidth: 450,
    alignSelf: "center",
  },
  inputWrapper: { marginTop: 15 },
  label: {
    fontFamily: "outfit",
    fontSize: 16,
    marginBottom: 6,
    color: Colors.black,
  },
  required: {
    color: "red",
    fontSize: 16,
  },
  input: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: Colors.primary,
    fontFamily: "outfit",
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  errorText: {
    color: "red",
    fontSize: 13,
    marginTop: 4,
    fontFamily: "outfit",
  },
  roleRow: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "space-between",
  },
  roleBtn: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: Colors.primary,
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  roleBtnActive: {
    backgroundColor: Colors.blue,
    borderColor: Colors.blue,
  },
  roleText: {
    fontFamily: "outfit",
    fontSize: 14,
    color: Colors.black,
  },
  roleTextActive: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: Colors.white,
  },
  signUpButton: {
    padding: 15,
    backgroundColor: Colors.blue,
    borderRadius: 15,
    marginTop: 15,
  },
  signUpButtonText: {
    color: Colors.white,
    fontFamily: "outfit-bold",
    fontSize: 18,
    textAlign: "center",
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  signInText: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: "outfit",
  },
  signInLink: {
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
  image: {
    width: "100%",
    height: "100%",
  },
});
