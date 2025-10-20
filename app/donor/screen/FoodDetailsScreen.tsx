import { useLocalSearchParams, useRouter } from "expo-router";
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

const { width } = Dimensions.get("window");

interface Post {
  id: string;
  foodName: string;
  useTime: string;
  quantity: string | number;
  imageUrl: string;
  createdAt?: any;
}

export default function FoodDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const item: Post = params.item ? JSON.parse(params.item as string) : null;

  if (!item) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No food item found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleContact = () => {
    // Add contact logic here
    console.log("Contact seller");
  };

  const handleRequest = () => {
    // Add request logic here
    console.log("Request food");
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{item.foodName}</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Available</Text>
            </View>
          </View>

          {/* Info Cards */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>🕐</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Best Before</Text>
                <Text style={styles.infoValue}>{item.useTime}</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>📦</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Quantity</Text>
                <Text style={styles.infoValue}>{item.quantity}</Text>
              </View>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this food</Text>
            <Text style={styles.description}>
              This food is available for pickup. Please contact the provider to
              arrange collection. All food items are offered on a
              first-come-first-served basis.
            </Text>
          </View>

          {/* Guidelines Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pickup Guidelines</Text>
            <View style={styles.guidelineItem}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.guidelineText}>
                Contact provider before pickup
              </Text>
            </View>
            <View style={styles.guidelineItem}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.guidelineText}>
                Bring your own container if possible
              </Text>
            </View>
            <View style={styles.guidelineItem}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.guidelineText}>
                Arrive on time for scheduled pickup
              </Text>
            </View>
            <View style={styles.guidelineItem}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.guidelineText}>
                Check food quality before accepting
              </Text>
            </View>
          </View>

          {/* Provider Info */}
          <View style={styles.providerCard}>
            <View style={styles.providerAvatar}>
              <Text style={styles.providerInitial}>P</Text>
            </View>
            <View style={styles.providerInfo}>
              <Text style={styles.providerLabel}>Provided by</Text>
              <Text style={styles.providerName}>Community Member</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={handleContact}
          activeOpacity={0.8}
        >
          <Text style={styles.contactIcon}>💬</Text>
          <Text style={styles.contactButtonText}>Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.requestButton}
          onPress={handleRequest}
          activeOpacity={0.8}
        >
          <Text style={styles.requestButtonText}>Request Pickup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 40,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: width,
    height: width * 0.75,
    backgroundColor: "#E5E7EB",
  },
  backButton: {
    position: "absolute",
    top: 44,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backIcon: {
    fontSize: 28,
    color: "#111827",
    fontWeight: "300",
    marginLeft: -2,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
  },
  infoGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  description: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 20,
  },
  guidelineItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  bulletIcon: {
    fontSize: 13,
    color: "#10B981",
    marginRight: 8,
    fontWeight: "bold",
  },
  guidelineText: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
    lineHeight: 18,
  },
  providerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  providerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  providerInitial: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
  },
  providerInfo: {
    flex: 1,
  },
  providerLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  providerName: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  contactIcon: {
    fontSize: 16,
  },
  contactButtonText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  requestButton: {
    flex: 2,
    backgroundColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  requestButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "700",
  },
  errorText: {
    fontSize: 15,
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
