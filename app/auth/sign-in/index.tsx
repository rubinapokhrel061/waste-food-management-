import { hashPassword } from "@/utils/hash";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
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

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [errors, setErrors] = useState<any>({});
  const OnSignIn = async () => {
    if (!email || !password) {
      Toast.show({ type: "error", text1: "Please enter all details" });
      return;
    }

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Toast.show({ type: "error", text1: "User not found" });
        return;
      }

      // There should be only one user with this email
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      console.log(userData);
      const enteredHash = hashPassword(password);
      console.log(enteredHash !== userData?.password);
      if (enteredHash !== userData?.password) {
        Toast.show({ type: "error", text1: "Invalid password" });
        return;
      }

      // Navigate based on role
      if (userData.role === "admin") {
        router.replace("/admin/dashboard");
      } else if (userData.role === "ngo") {
        router.replace("/ngo/home");
      } else {
        router.replace("/donor/home");
      }

      Toast.show({
        type: "success",
        text1: "User logged in successfully",
        text2: `Welcome back, ${userData.role}!`,
      });
    } catch (error: any) {
      Toast.show({ type: "error", text1: error.message });
      console.log(error.code, error.message);
    }
  };

  const onForgotPassword = async () => {
    if (!email) {
      Toast.show({
        type: "error",
        text1: "Please enter your email to reset password",
      });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Toast.show({
        type: "success",
        text1: "Password reset email sent!",
        text2: "Check your inbox to reset your password.",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error.message,
      });
      console.log(error.code, error.message);
    }
  };

  return (
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
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons
              name="arrow-back"
              size={28}
              style={styles.backBtnContainer}
              color={Colors?.black}
            />
          </TouchableOpacity>

          {/* Title */}

          <View style={styles.textContainer}>
            <Text style={styles.mainTitle}>Let&apos;s Sign You In</Text>
            <Text style={styles.subTitle}>
              Welcome back,{""}
              <Text style={{ fontWeight: "bold", color: Colors.blue }}>
                we missed you!
              </Text>
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
                onChangeText={setEmail}
                value={email}
              />
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>
                Password <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Enter password"
                onChangeText={setPassword}
                value={password}
              />
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={onForgotPassword}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity style={styles.signInButton} onPress={OnSignIn}>
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don&apos;t have an account?</Text>
              <TouchableOpacity onPress={() => router.replace("/auth/sign-up")}>
                <Text style={styles.signUpLink}>Sign Up</Text>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: Colors.white,
  },
  backBtnContainer: {
    position: "absolute",
    top: 20,
    left: 2,
    zIndex: 10,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 20,
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
  },
  inputWrapper: {
    marginTop: 15,
  },
  label: {
    fontFamily: "outfit",
    fontSize: 16,
    color: Colors.black,
    marginBottom: 6,
  },
  required: {
    color: "red",
    fontSize: 16,
  },
  input: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: Colors.primary,
    fontFamily: "outfit",
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  forgotPasswordContainer: {
    marginTop: 8,
    alignSelf: "flex-end",
  },
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
  signUpText: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: "outfit",
  },
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
  image: {
    width: "100%",
    height: "100%",
  },
});

// import { hashPassword } from "@/utils/hash";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import { useNavigation, useRouter } from "expo-router";
// import {
//   collection,
//   doc,
//   getDoc,
//   getDocs,
//   getFirestore,
//   query,
//   updateDoc,
//   where,
// } from "firebase/firestore";
// import React, { useEffect, useState } from "react";
// import {
//   Dimensions,
//   Image,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import Toast from "react-native-toast-message";
// import { Colors } from "../../../constants/Colors";

// const db = getFirestore();
// const { width } = Dimensions.get("window");

// export default function SignUp() {
//   const navigation = useNavigation();
//   const router = useRouter();

//   const [email, setEmail] = useState<string>("");
//   const [password, setPassword] = useState<string>("");
//   const [resetMode, setResetMode] = useState<boolean>(false);
//   const [newPassword, setNewPassword] = useState<string>("");

//   useEffect(() => {
//     navigation.setOptions({ headerShown: false });
//   }, [navigation]);

//   // const OnSignIn = async () => {
//   //   if (!email || !password) {
//   //     Toast.show({ type: "error", text1: "Please enter all details" });
//   //     return;
//   //   }

//   //   try {
//   //     const userCredential = await signInWithEmailAndPassword(
//   //       auth,
//   //       email,
//   //       password
//   //     );
//   //     const user = userCredential.user;

//   //     if (user) {
//   //       const q = query(collection(db, "users"), where("email", "==", email));
//   //       const querySnapshot = await getDocs(q);
//   //       if (!querySnapshot.empty) {
//   //         const userData = querySnapshot.docs[0].data();
//   //         const role = userData.role;
//   //         if (role === "admin") router.replace("/admin/dashboard");
//   //         else if (role === "ngo") router.replace("/ngo/home");
//   //         else router.replace("/donor/home");
//   //       }

//   //       Toast.show({
//   //         type: "success",
//   //         text1: "User logged in successfully",
//   //         text2: "Welcome back!",
//   //       });
//   //     }
//   //   } catch (error: any) {
//   //     Toast.show({ type: "error", text1: error.message });
//   //     console.log(error.code, error.message);
//   //   }
//   // };
//   const OnSignIn = async () => {
//     if (!email || !password) {
//       Toast.show({ type: "error", text1: "Please enter all details" });
//       return;
//     }

//     try {
//       const usersRef = doc(db, "users", email);
//       const userSnap = await getDoc(usersRef);

//       if (!userSnap.exists()) {
//         Toast.show({ type: "error", text1: "User not found" });
//         return;
//       }

//       const userData = userSnap.data();
//       const enteredHash = hashPassword(password);
//       if (enteredHash !== userData.password) {
//         Toast.show({ type: "error", text1: "Invalid password" });
//         return;
//       }

//       if (userData.role === "admin") {
//         router.replace("/admin/dashboard");
//       } else if (userData.role === "ngo") {
//         router.replace("/ngo/home");
//       } else if (userData.role === "donor") {
//         router.replace("/donor/home");
//       } else {
//         router.replace("/donor/home");
//       }

//       Toast.show({
//         type: "success",
//         text1: "User logged in successfully",
//         text2: `Welcome back, ${userData.role}!`,
//       });
//     } catch (error: any) {
//       Toast.show({ type: "error", text1: error.message });
//       console.log(error.code, error.message);
//     }
//   };

//   const OnResetPassword = async () => {
//     if (!email || !newPassword) {
//       Toast.show({
//         type: "error",
//         text1: "Please enter email and new password",
//       });
//       return;
//     }

//     try {
//       const q = query(collection(db, "users"), where("email", "==", email));
//       const querySnapshot = await getDocs(q);
//       if (querySnapshot.empty) {
//         Toast.show({ type: "error", text1: "Email not found" });
//         return;
//       }

//       const userDoc = querySnapshot.docs[0];
//       await updateDoc(doc(db, "users", userDoc.id), {
//         password: hashPassword(newPassword),
//       });

//       Toast.show({ type: "success", text1: "Password updated successfully" });
//       setResetMode(false);
//       setPassword("");
//       setNewPassword("");
//     } catch (err: any) {
//       Toast.show({ type: "error", text1: err.message });
//       console.log(err);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === "ios" ? "padding" : undefined}
//       style={{ flex: 1 }}
//     >
//       <ScrollView
//         contentContainerStyle={{ flexGrow: 1 }}
//         showsVerticalScrollIndicator={false}
//       >
//         <View style={styles.container}>
//           {/* Back Button */}
//           <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
//             <Ionicons
//               name="arrow-back"
//               size={28}
//               style={styles.backBtnContainer}
//               color={Colors.black}
//             />
//           </TouchableOpacity>

//           {/* Title */}
//           <View style={styles.textContainer}>
//             <Text style={styles.mainTitle}>
//               {resetMode ? "Reset Password" : "Sign In"}
//             </Text>
//             <Text style={styles.subTitle}>
//               {resetMode
//                 ? "Enter your email and new password"
//                 : "Welcome back, we missed you!"}
//             </Text>
//           </View>

//           {/* Form */}
//           <View style={styles.inputContainer}>
//             <View style={styles.inputWrapper}>
//               <Text style={styles.label}>
//                 Email <Text style={styles.required}>*</Text>
//               </Text>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Enter your email"
//                 autoCapitalize="none"
//                 onChangeText={setEmail}
//                 value={email}
//               />
//             </View>

//             {resetMode ? (
//               <View style={styles.inputWrapper}>
//                 <Text style={styles.label}>
//                   New Password <Text style={styles.required}>*</Text>
//                 </Text>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Enter new password"
//                   secureTextEntry
//                   onChangeText={setNewPassword}
//                   value={newPassword}
//                 />
//               </View>
//             ) : (
//               <View style={styles.inputWrapper}>
//                 <Text style={styles.label}>
//                   Password <Text style={styles.required}>*</Text>
//                 </Text>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Enter password"
//                   secureTextEntry
//                   onChangeText={setPassword}
//                   value={password}
//                 />
//               </View>
//             )}

//             <TouchableOpacity
//               onPress={() => setResetMode(!resetMode)}
//               style={styles.forgotPasswordContainer}
//             >
//               <Text style={styles.forgotPasswordText}>
//                 {resetMode ? "Back to Sign In" : "Forgot Password?"}
//               </Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.signInButton}
//               onPress={resetMode ? OnResetPassword : OnSignIn}
//             >
//               <Text style={styles.signInButtonText}>
//                 {resetMode ? "Reset Password" : "Sign In"}
//               </Text>
//             </TouchableOpacity>

//             {!resetMode && (
//               <View style={styles.signUpContainer}>
//                 <Text style={styles.signUpText}>
//                   Don &apos;t have an account?
//                 </Text>
//                 <TouchableOpacity
//                   onPress={() => router.replace("/auth/sign-up")}
//                 >
//                   <Text style={styles.signUpLink}>Sign Up</Text>
//                 </TouchableOpacity>
//               </View>
//             )}
//           </View>

//           <View style={styles.imageContainer}>
//             <Image
//               source={require("../../../assets/images/login-register.jpg")}
//               style={styles.image}
//               resizeMode="contain"
//             />
//           </View>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingHorizontal: 20,
//     paddingTop: 40,
//     backgroundColor: Colors.white,
//   },
//   backBtnContainer: { position: "absolute", top: 20, left: 2, zIndex: 10 },
//   textContainer: { alignItems: "center", marginBottom: 20, marginTop: 20 },
//   mainTitle: {
//     fontFamily: "outfit-bold",
//     fontSize: width > 380 ? 32 : 26,
//     color: Colors.black,
//   },
//   subTitle: {
//     fontFamily: "outfit",
//     fontSize: width > 380 ? 16 : 14,
//     color: Colors.primary,
//     marginTop: 5,
//     textAlign: "center",
//   },
//   inputContainer: { width: "100%", maxWidth: 450 },
//   inputWrapper: { marginTop: 15 },
//   label: {
//     fontFamily: "outfit",
//     fontSize: 16,
//     color: Colors.black,
//     marginBottom: 6,
//   },
//   required: { color: "red", fontSize: 16 },
//   input: {
//     padding: 14,
//     borderWidth: 1,
//     borderRadius: 12,
//     borderColor: Colors.primary,
//     fontFamily: "outfit",
//     fontSize: 16,
//     backgroundColor: "#f9f9f9",
//   },
//   forgotPasswordContainer: { marginTop: 8, alignSelf: "flex-end" },
//   forgotPasswordText: {
//     color: Colors.blue,
//     fontFamily: "outfit-bold",
//     fontSize: 14,
//   },
//   signInButton: {
//     padding: 15,
//     backgroundColor: Colors.blue,
//     borderRadius: 15,
//     marginTop: 30,
//   },
//   signInButtonText: {
//     color: Colors.white,
//     fontFamily: "outfit-bold",
//     fontSize: 18,
//     textAlign: "center",
//   },
//   signUpContainer: {
//     flexDirection: "row",
//     justifyContent: "center",
//     marginTop: 20,
//   },
//   signUpText: { fontSize: 14, color: Colors.primary, fontFamily: "outfit" },
//   signUpLink: {
//     color: Colors.blue,
//     fontWeight: "bold",
//     fontFamily: "outfit",
//     marginLeft: 5,
//   },
//   imageContainer: {
//     width: "100%",
//     height: width > 400 ? 220 : 180,
//     marginTop: 4,
//   },
//   image: { width: "100%", height: "100%" },
// });
