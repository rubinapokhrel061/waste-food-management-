import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";

const foodItems = [
  { id: "1", name: "Bread", quantity: "2 loaves", expiry: "1 day" },
  { id: "2", name: "Rice", quantity: "5 kg", expiry: "7 days" },
  { id: "3", name: "Milk", quantity: "3 liters", expiry: "2 days" },
  { id: "4", name: "Vegetables", quantity: "3 kg", expiry: "3 days" },
];

export default function FoodItems() {
  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.details}>
        Quantity: {item.quantity} | Expiry: {item.expiry}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Food Items</Text>
      <FlatList
        data={foodItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  itemContainer: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#f2f2f2",
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
  },
  details: {
    fontSize: 14,
    color: "#555",
  },
});
