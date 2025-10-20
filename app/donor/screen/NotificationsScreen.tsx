import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

interface Notification {
  id: string;
  msg: string;
}

export default function NotificationsScreen() {
  const notifications: Notification[] = [
    { id: "1", msg: "Your food post has been accepted by NGO." },
    { id: "2", msg: "Pickup completed successfully." },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <FlatList
        data={notifications}
        renderItem={({ item }) => <Text style={styles.item}>• {item.msg}</Text>}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  item: { fontSize: 16, marginVertical: 5 },
});
