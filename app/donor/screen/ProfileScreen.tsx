import LogoutButton from "@/components/LogoutButton";
import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Donor Profile</Text>
      <Text>Name: John Doe</Text>
      <Text>Email: johndoe@email.com</Text>
      <Button
        title="Edit Profile"
        onPress={() => alert("Edit Profile Pressed")}
      />
      <LogoutButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
});
