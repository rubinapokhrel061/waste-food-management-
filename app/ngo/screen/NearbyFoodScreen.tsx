import React from "react";
import { StyleSheet, Text, View } from "react-native";

const NearbyFoodScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nearby Food Sources</Text>
      <Text>Find nearby food donations or surplus items to pick up.</Text>
    </View>
  );
};

export default NearbyFoodScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
});
