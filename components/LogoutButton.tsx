import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";
import { logout } from "../utils/logout";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const confirmed = await new Promise((resolve) =>
      Alert.alert("Logout", "Are you sure you want to logout?", [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "Yes", onPress: () => resolve(true) },
      ])
    );

    if (!confirmed) return;

    const result = await logout();
    if (result) {
      router.replace("/auth/sign-in");
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleLogout}>
      <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
      <Text style={styles.text}>Logout</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    paddingHorizontal: 20,
    marginVertical: 10,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
  },
  text: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
