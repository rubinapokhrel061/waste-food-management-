import { StyleSheet, Text, View } from "react-native";

export default function NgoHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>NGO Home</Text>
      <Text>Track and manage donations for your NGO here.</Text>
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
