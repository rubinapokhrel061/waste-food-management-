import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

interface Donation {
  id: string;
  donor: string;
  food: string;
}

export default function ManageDonationsScreen() {
  const donations: Donation[] = [
    { id: "1", donor: "John", food: "Rice 10kg" },
    { id: "2", donor: "Emily", food: "Canned Beans 20pcs" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Donations</Text>
      <FlatList
        data={donations}
        renderItem={({ item }) => (
          <Text style={styles.item}>
            {item.donor} donated {item.food}
          </Text>
        )}
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
