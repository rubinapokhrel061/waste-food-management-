import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  Linking,
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
  status: "pending" | "accepted" | "pickup" | "donated";
  description?: string;
  createdBy?: {
    uid: string;
    isAnonymous: boolean;
    name?: string;
    email?: string;
    phone?: string;
  };
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  ngoDetails?: {
    name: string;
    email: string;
    phone?: string;
    uid?: string;
  };
  pickupDetails?: {
    date?: string;
    time?: string;
    address?: string;
    ngoName?: string;
    ngoPhone?: string;
  };
  donatedDetails?: {
    date?: string;
    ngoName?: string;
    receivedBy?: string;
  };
}

export default function FoodDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const item: Post = params.item ? JSON.parse(params.item as string) : null;

  if (!item) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#DC2626" />
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Pending",
          color: "#F59E0B",
          bg: "#FEF3C7",
          icon: "time",
        };
      case "accepted":
        return {
          label: "Accepted",
          color: "#10B981",
          bg: "#D1FAE5",
          icon: "checkmark-circle",
        };
      case "pickup":
        return {
          label: "Pickup Scheduled",
          color: "#3B82F6",
          bg: "#DBEAFE",
          icon: "car",
        };
      case "donated":
        return {
          label: "Donated",
          color: "#8B5CF6",
          bg: "#EDE9FE",
          icon: "heart",
        };
      default:
        return {
          label: "Unknown",
          color: "#6B7280",
          bg: "#F3F4F6",
          icon: "help-circle",
        };
    }
  };

  const statusConfig = getStatusConfig(item.status);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleRequestPickup = () => {
    console.log("Request pickup for:", item.id);
    // Add your request pickup logic here
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
          <View style={styles.imageOverlay} />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View
            style={[
              styles.statusBadgeTop,
              { backgroundColor: statusConfig.bg },
            ]}
          >
            <Ionicons
              name={statusConfig.icon as any}
              size={16}
              color={statusConfig.color}
            />
            <Text style={[styles.statusTextTop, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{item.foodName}</Text>
            {item.description && (
              <Text style={styles.description}>{item.description}</Text>
            )}
          </View>

          {/* Info Cards */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="calendar-outline" size={20} color="#7C3AED" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Best Before</Text>
                <Text style={styles.infoValue}>{item.useTime}</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="cube-outline" size={20} color="#7C3AED" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Quantity</Text>
                <Text style={styles.infoValue}>{item.quantity}</Text>
              </View>
            </View>
          </View>

          {/* NGO Details - Only for Accepted Status */}
          {item.status === "accepted" && item.ngoDetails && (
            <View style={styles.detailsCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[styles.cardIcon, { backgroundColor: "#D1FAE5" }]}
                  >
                    <Ionicons name="business" size={24} color="#10B981" />
                  </View>
                  <Text style={styles.cardTitle}>NGO Details</Text>
                </View>
              </View>

              <View style={styles.detailsList}>
                <View style={styles.detailItem}>
                  <View style={styles.detailIconWrapper}>
                    <Ionicons
                      name="business-outline"
                      size={18}
                      color="#6B7280"
                    />
                  </View>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Organization</Text>
                    <Text style={styles.detailValue}>
                      {item.ngoDetails.name}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <View style={styles.detailIconWrapper}>
                    <Ionicons name="mail-outline" size={18} color="#6B7280" />
                  </View>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <TouchableOpacity
                      onPress={() => handleEmail(item.ngoDetails!.email)}
                    >
                      <Text style={styles.detailLink}>
                        {item.ngoDetails.email}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {item.ngoDetails.phone && (
                  <View style={styles.detailItem}>
                    <View style={styles.detailIconWrapper}>
                      <Ionicons name="call-outline" size={18} color="#6B7280" />
                    </View>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Phone</Text>
                      <TouchableOpacity
                        onPress={() => handleCall(item.ngoDetails!.phone!)}
                      >
                        <Text style={styles.detailLink}>
                          {item.ngoDetails.phone}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.contactActions}>
                {item.ngoDetails.phone && (
                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() => handleCall(item.ngoDetails!.phone!)}
                  >
                    <Ionicons name="call" size={18} color="#10B981" />
                    <Text style={styles.contactBtnText}>Call</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.contactBtn}
                  onPress={() => handleEmail(item.ngoDetails!.email)}
                >
                  <Ionicons name="mail" size={18} color="#10B981" />
                  <Text style={styles.contactBtnText}>Email</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Pickup Details - Only for Pickup Status */}
          {item.status === "pickup" && item.pickupDetails && (
            <View style={styles.detailsCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[styles.cardIcon, { backgroundColor: "#DBEAFE" }]}
                  >
                    <Ionicons name="car" size={24} color="#3B82F6" />
                  </View>
                  <Text style={styles.cardTitle}>Pickup Details</Text>
                </View>
              </View>

              <View style={styles.detailsList}>
                {item.pickupDetails.date && (
                  <View style={styles.detailItem}>
                    <View style={styles.detailIconWrapper}>
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color="#6B7280"
                      />
                    </View>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Pickup Date</Text>
                      <Text style={styles.detailValue}>
                        {item.pickupDetails.date}
                      </Text>
                    </View>
                  </View>
                )}

                {item.pickupDetails.time && (
                  <View style={styles.detailItem}>
                    <View style={styles.detailIconWrapper}>
                      <Ionicons name="time-outline" size={18} color="#6B7280" />
                    </View>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Pickup Time</Text>
                      <Text style={styles.detailValue}>
                        {item.pickupDetails.time}
                      </Text>
                    </View>
                  </View>
                )}

                {item.pickupDetails.address && (
                  <View style={styles.detailItem}>
                    <View style={styles.detailIconWrapper}>
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color="#6B7280"
                      />
                    </View>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Pickup Address</Text>
                      <Text style={styles.detailValue}>
                        {item.pickupDetails.address}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.alertBox}>
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text style={styles.alertText}>
                  Please arrive on time for your scheduled pickup
                </Text>
              </View>
            </View>
          )}

          {/* Donated Details - Only for Donated Status */}
          {item.status === "donated" && item.donatedDetails && (
            <View style={styles.detailsCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[styles.cardIcon, { backgroundColor: "#EDE9FE" }]}
                  >
                    <Ionicons name="heart" size={24} color="#8B5CF6" />
                  </View>
                  <Text style={styles.cardTitle}>Donation Completed</Text>
                </View>
                <View style={styles.completeBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.completeText}>Complete</Text>
                </View>
              </View>

              <View style={styles.detailsList}>
                {item.donatedDetails.date && (
                  <View style={styles.detailItem}>
                    <View style={styles.detailIconWrapper}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color="#6B7280"
                      />
                    </View>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Donation Date</Text>
                      <Text style={styles.detailValue}>
                        {item.donatedDetails.date}
                      </Text>
                    </View>
                  </View>
                )}

                {item.donatedDetails.ngoName && (
                  <View style={styles.detailItem}>
                    <View style={styles.detailIconWrapper}>
                      <Ionicons
                        name="business-outline"
                        size={18}
                        color="#6B7280"
                      />
                    </View>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Received By</Text>
                      <Text style={styles.detailValue}>
                        {item.donatedDetails.ngoName}
                      </Text>
                    </View>
                  </View>
                )}

                {item.donatedDetails.receivedBy && (
                  <View style={styles.detailItem}>
                    <View style={styles.detailIconWrapper}>
                      <Ionicons
                        name="person-outline"
                        size={18}
                        color="#6B7280"
                      />
                    </View>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Contact Person</Text>
                      <Text style={styles.detailValue}>
                        {item.donatedDetails.receivedBy}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={[styles.alertBox, { backgroundColor: "#EDE9FE" }]}>
                <Ionicons name="heart-circle" size={20} color="#8B5CF6" />
                <Text style={[styles.alertText, { color: "#8B5CF6" }]}>
                  Thank you for your generous donation!
                </Text>
              </View>
            </View>
          )}

          {/* Guidelines Section - Only for Pending */}
          {item.status === "pending" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pickup Guidelines</Text>
              <View style={styles.guidelinesList}>
                <View style={styles.guidelineItem}>
                  <View style={styles.guidelineBullet}>
                    <Ionicons name="checkmark" size={14} color="#10B981" />
                  </View>
                  <Text style={styles.guidelineText}>
                    Contact NGO before pickup
                  </Text>
                </View>
                <View style={styles.guidelineItem}>
                  <View style={styles.guidelineBullet}>
                    <Ionicons name="checkmark" size={14} color="#10B981" />
                  </View>
                  <Text style={styles.guidelineText}>
                    Bring your own container if possible
                  </Text>
                </View>
                <View style={styles.guidelineItem}>
                  <View style={styles.guidelineBullet}>
                    <Ionicons name="checkmark" size={14} color="#10B981" />
                  </View>
                  <Text style={styles.guidelineText}>
                    Arrive on time for scheduled pickup
                  </Text>
                </View>
                <View style={styles.guidelineItem}>
                  <View style={styles.guidelineBullet}>
                    <Ionicons name="checkmark" size={14} color="#10B981" />
                  </View>
                  <Text style={styles.guidelineText}>
                    Check food quality before accepting
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar - Only for Pending Status */}
      {item.status === "pending" && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.requestButton}
            onPress={handleRequestPickup}
            activeOpacity={0.8}
          >
            <Ionicons name="hand-right" size={20} color="#FFF" />
            <Text style={styles.requestButtonText}>Request Pickup</Text>
          </TouchableOpacity>
        </View>
      )}
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
    height: width * 0.8,
    backgroundColor: "#E5E7EB",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  backButton: {
    position: "absolute",
    top: 44,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusBadgeTop: {
    position: "absolute",
    top: 44,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusTextTop: {
    fontSize: 13,
    fontWeight: "700",
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
  },
  infoGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "700",
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  completeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  completeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10B981",
  },
  detailsList: {
    gap: 14,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  detailIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    marginBottom: 3,
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  detailLink: {
    fontSize: 14,
    color: "#7C3AED",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  contactActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D1FAE5",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  contactBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10B981",
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FCE7F3",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EC4899",
  },
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 10,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: "#3B82F6",
    fontWeight: "600",
    lineHeight: 18,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  guidelinesList: {
    gap: 10,
  },
  guidelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  guidelineBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  guidelineText: {
    flex: 1,
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 20,
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  requestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  requestButtonText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "700",
  },
  errorText: {
    fontSize: 16,
    color: "#DC2626",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
