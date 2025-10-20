import React from "react";
import { StyleSheet, Text, View } from "react-native";

const NGODashboardScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>NGO Dashboard</Text>
      <Text>Overview of donations, pickups, and activities.</Text>
    </View>
  );
};

export default NGODashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
});
