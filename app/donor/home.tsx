import { StyleSheet, Text, View } from "react-native";

export default function DonorHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Donor Home</Text>
      <Text>View NGOs and donate food easily from here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
});
