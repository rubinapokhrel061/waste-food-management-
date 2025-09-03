import { Colors } from "@/constants/Colors";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Landing() {
  const router = useRouter();
  const { width, height } = useWindowDimensions(); // For responsive design
  const animation = useSharedValue(0); // For button animation

  // Animation effect on mount
  useEffect(() => {
    animation.value = withSpring(1, { damping: 12, stiffness: 90 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animation.value }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Hero Section */}
      <View style={[styles.heroContainer, { height: height * 0.45 }]}>
        <Image
          source={require("./../assets/images/landing.jpg")}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>Waste Food Management</Text>
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Join the Movement</Text>
          <Text style={styles.cardSubtitle}>
            Reduce food waste and donate excess food to support communities in
            need.
          </Text>

          {/* Call-to-Action Button */}
          <Animated.View style={[styles.buttonContainer, animatedStyle]}>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push("/auth/sign-in")}
              accessibilityLabel="Get started with Waste Food Management"
              activeOpacity={0.75}
            >
              <Text style={styles.buttonText}>Get Started</Text>
              <MaterialIcons
                name="arrow-forward"
                size={20}
                color={Colors.white}
                style={styles.buttonIcon}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e4f5f3", // Solid background color
  },
  heroContainer: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent overlay
    padding: 20,
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: Colors.white,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: Colors.white,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 25,
    width: "100%",
    maxWidth: 450,
    elevation: 6, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 16,
    color: "#444",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  buttonContainer: {
    alignItems: "center",
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 18,
    color: Colors.white,
    fontWeight: "600",
  },
  buttonIcon: {
    marginLeft: 8,
  },
});
