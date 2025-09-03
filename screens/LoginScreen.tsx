import { useNavigation } from "@react-navigation/native";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../configs/FirebaseConfig";

type Role = "admin" | "ngo" | "donor";

const roles: Role[] = ["admin", "ngo", "donor"];

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("donor");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists()) {
        await signOut(auth);
        throw new Error("User profile not found");
      }

      const data = snap.data() as { role: Role };

      if (data.role !== role) {
        await signOut(auth);
        throw new Error(`You are registered as ${data.role}, not ${role}`);
      }

      // Navigate based on role
      if (role === "admin") navigation.navigate("AdminHome");
      if (role === "ngo") navigation.navigate("NgoHome");
      if (role === "donor") navigation.navigate("DonorHome");
    } catch (err: any) {
      Alert.alert("Login Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      Alert.alert("Error", "Enter your email to reset password");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Success", "Password reset email sent");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Food Rescue Login</Text>

      {/* Role selector */}
      <View style={styles.roleRow}>
        {roles.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.roleBtn, role === r && styles.roleBtnActive]}
            onPress={() => setRole(r)}
          >
            <Text style={role === r ? styles.roleTextActive : styles.roleText}>
              {r.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity onPress={handleReset}>
        <Text style={styles.forgot}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.loginBtn}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.loginText}>Login as {role.toUpperCase()}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0f1e",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    color: "white",
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  roleBtn: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#666",
    borderRadius: 20,
    marginHorizontal: 5,
  },
  roleBtnActive: {
    backgroundColor: "#5b8cff",
    borderColor: "#5b8cff",
  },
  roleText: {
    color: "#ccc",
    fontWeight: "600",
  },
  roleTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "white",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  forgot: {
    color: "#9db2ff",
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  loginBtn: {
    backgroundColor: "#6a8dff",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  loginText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
