import React from "react";
import { Button, FlatList, StyleSheet, Text, View } from "react-native";

interface User {
  id: string;
  name: string;
}

export default function ManageUsersScreen() {
  const users: User[] = [
    { id: "1", name: "Donor John" },
    { id: "2", name: "NGO Helping Hands" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Users</Text>
      <FlatList
        data={users}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text>{item.name}</Text>
            <Button
              title="Remove"
              onPress={() => alert(`Removed ${item.name}`)}
            />
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
});
