import React from "react";
import { StyleSheet, Text, View } from "react-native";

const PickupTrackingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pickup Tracking</Text>
      <Text>
        Track the status and location of ongoing pickups in real-time.
      </Text>
    </View>
  );
};

export default PickupTrackingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
});
