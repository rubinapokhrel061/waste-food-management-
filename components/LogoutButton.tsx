import { useRouter } from "expo-router";
import { Alert, Text, TouchableOpacity } from "react-native";
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
    <TouchableOpacity onPress={handleLogout} style={{ padding: 10 }}>
      <Text style={{ color: "red", fontWeight: "bold" }}>Logout</Text>
    </TouchableOpacity>
  );
}
