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
      <Text style={styles.text}>Logout</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#7c3aed",
    borderRadius: 8,
    alignItems: "center",
  },
  text: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
