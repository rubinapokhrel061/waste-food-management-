import React from "react";
import { StyleSheet, Text, View } from "react-native";

const AssignPickupScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assign Pickup</Text>
      <Text>Assign pickups to volunteers or delivery staff.</Text>
    </View>
  );
};

export default AssignPickupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
});
