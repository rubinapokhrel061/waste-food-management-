import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function Landing() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Gradient Background Elements */}
      <View style={styles.backgroundGradient}>
        <View style={styles.gradientCircle1} />
        <View style={styles.gradientCircle2} />
        <View style={styles.gradientCircle3} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <View style={styles.imageWrapper}>
            <Image
              source={require("./../assets/images/landing.jpg")}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay} />
          </View>

          {/* Floating Badge */}
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Ionicons name="leaf" size={16} color="#10B981" />
              <Text style={styles.badgeText}>Sustainable Impact</Text>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          {/* Main Title */}
          <View style={styles.titleSection}>
            <View style={styles.iconGroup}>
              <View style={styles.iconCircle}>
                <Ionicons name="restaurant" size={24} color="#7C3AED" />
              </View>
              <View style={[styles.iconCircle, styles.iconCircle2]}>
                <Ionicons name="heart" size={20} color="#EC4899" />
              </View>
            </View>
            <Text style={styles.mainTitle}>Waste Food{"\n"}Management</Text>
            <View style={styles.titleUnderline} />
          </View>

          {/* Feature Cards */}
          <View style={styles.featureGrid}>
            <View style={styles.featureCard}>
              <View
                style={[styles.featureIcon, { backgroundColor: "#DBEAFE" }]}
              >
                <Ionicons name="globe-outline" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.featureTitle}>Global Impact</Text>
              <Text style={styles.featureText}>Join communities worldwide</Text>
            </View>

            <View style={styles.featureCard}>
              <View
                style={[styles.featureIcon, { backgroundColor: "#FEF3C7" }]}
              >
                <Ionicons name="people-outline" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.featureTitle}>Help Others</Text>
              <Text style={styles.featureText}>Support those in need</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionCard}>
            <Text style={styles.description}>
              Reduce food waste and donate excess food to support communities in
              need. Together, we can make a difference.
            </Text>
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push("/auth/sign-in")}
            activeOpacity={0.85}
          >
            <View style={styles.buttonContent}>
              <View style={styles.buttonIconWrapper}>
                <Ionicons name="rocket" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.buttonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.buttonShine} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  gradientCircle1: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: "#F3E8FF",
    top: -150,
    right: -100,
    opacity: 0.6,
  },
  gradientCircle2: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#DBEAFE",
    bottom: -80,
    left: -80,
    opacity: 0.5,
  },
  gradientCircle3: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FEF3C7",
    top: "50%",
    right: -60,
    opacity: 0.4,
  },
  heroContainer: {
    width: "100%",
    height: 240,
    marginTop: 10,
    paddingHorizontal: 16,
    position: "relative",
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(124, 58, 237, 0.15)",
  },
  badgeContainer: {
    position: "absolute",
    top: 16,
    left: 32,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  badgeText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    zIndex: 1,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconGroup: {
    flexDirection: "row",
    marginBottom: 12,
    position: "relative",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  iconCircle2: {
    backgroundColor: "#FCE7F3",
    marginLeft: -12,
    shadowColor: "#EC4899",
  },
  mainTitle: {
    fontFamily: "outfit-bold",
    fontSize: width > 380 ? 32 : 28,
    color: "#1F2937",
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: width > 380 ? 40 : 36,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: "#7C3AED",
    borderRadius: 2,
    marginTop: 8,
  },
  featureGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  featureCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  featureTitle: {
    fontFamily: "outfit",
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  featureText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  descriptionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  description: {
    fontFamily: "outfit",
    fontSize: 15,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 24,
  },
  ctaButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 16,
    overflow: "hidden",

    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 12,
  },
  buttonIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  buttonShine: {
    position: "absolute",
    top: 0,
    left: -100,
    right: 0,
    height: "100%",
    width: "30%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    transform: [{ skewX: "-20deg" }],
  },
});
