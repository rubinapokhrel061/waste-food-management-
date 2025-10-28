import { db } from "@/configs/FirebaseConfig";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Pickup {
  id: string;
  foodName: string;
  quantity: string | number;
  imageUrl: string;
  status: "accepted" | "pickup" | "donated";
  createdAt?: any;
  ngoDetails?: {
    name: string;
    email: string;
    phone?: string;
  };
  pickupDetails?: {
    date?: string;
    time?: string;
    address?: string;
    volunteer?: string;
  };
  donatedDetails?: {
    date?: string;
    ngoName?: string;
    receivedBy?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

const PickupTrackingScreen: React.FC = () => {
  const router = useRouter();
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchPickups = async () => {
    try {
      setLoading(true);

      const q = query(collection(db, "foods"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedPickups: Pickup[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!["accepted", "pickup", "donated"].includes(data.status)) return;

        const status: "accepted" | "pickup" | "donated" = data.status;

        fetchedPickups.push({
          id: doc.id,
          foodName: data.foodName,
          quantity: data.quantity,
          imageUrl: data.imageUrl,
          status,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt,
          ngoDetails: data.ngoDetails,
          pickupDetails: data.pickupDetails,
          donatedDetails: data.donatedDetails,
          location: data.location,
        });
      });

      setPickups(fetchedPickups);
    } catch (err: any) {
      console.error("Error fetching pickups:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPickups();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPickups();
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "accepted":
        return {
          label: "Accepted",
          color: "#9333EA",
          bg: "#F3E8FF",
          icon: "hand-right",
          progress: 33,
          step: 1,
        };
      case "pickup":
        return {
          label: "In Transit",
          color: "#EC4899",
          bg: "#FCE7F3",
          icon: "car",
          progress: 66,
          step: 2,
        };
      case "donated":
        return {
          label: "Completed",
          color: "#10B981",
          bg: "#D1FAE5",
          icon: "checkmark-circle",
          progress: 100,
          step: 3,
        };
      default:
        return {
          label: "Unknown",
          color: "#6B7280",
          bg: "#F3F4F6",
          icon: "help-circle",
          progress: 0,
          step: 0,
        };
    }
  };

  const filteredPickups = pickups.filter((pickup) =>
    filterStatus === "all" ? true : pickup.status === filterStatus
  );

  const renderPickup = ({ item }: { item: Pickup }) => {
    const statusConfig = getStatusConfig(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() =>
          router.push({
            pathname: "/screen/FoodDetailsScreen",
            params: { item: JSON.stringify(item) },
          })
        }
      >
        <View style={styles.cardHeader}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          <View style={styles.cardInfo}>
            <Text style={styles.foodName} numberOfLines={2}>
              {item.foodName}
            </Text>
            <View style={styles.qtyRow}>
              <Ionicons name="cube-outline" size={14} color="#6B7280" />
              <Text style={styles.qtyText}>Qty: {item.quantity}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: statusConfig.bg,
                },
              ]}
            >
              <Ionicons
                name={statusConfig.icon as any}
                size={14}
                color={statusConfig.color}
              />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Animated Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Delivery Progress</Text>
            <Text
              style={[styles.progressPercent, { color: statusConfig.color }]}
            >
              {statusConfig.progress}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${statusConfig.progress}%`,
                  backgroundColor: statusConfig.color,
                },
              ]}
            >
              <View style={styles.progressGlow} />
            </View>
          </View>
        </View>

        {/* Modern Timeline */}
        <View style={styles.timeline}>
          <View style={styles.timelineItem}>
            <View
              style={[
                styles.timelineIconWrapper,
                statusConfig.step >= 1 && { backgroundColor: "#9333EA" },
              ]}
            >
              <Ionicons
                name={
                  statusConfig.step >= 1 ? "checkmark" : "hand-right-outline"
                }
                size={18}
                color={statusConfig.step >= 1 ? "#FFF" : "#9CA3AF"}
              />
            </View>
            <Text
              style={[
                styles.timelineText,
                statusConfig.step >= 1 && {
                  color: "#9333EA",
                  fontWeight: "700",
                },
              ]}
            >
              Accepted
            </Text>
          </View>

          <View
            style={[
              styles.timelineConnector,
              statusConfig.step >= 2 && { backgroundColor: "#EC4899" },
            ]}
          />

          <View style={styles.timelineItem}>
            <View
              style={[
                styles.timelineIconWrapper,
                statusConfig.step >= 2 && { backgroundColor: "#EC4899" },
              ]}
            >
              <Ionicons
                name={statusConfig.step >= 2 ? "checkmark" : "car-outline"}
                size={18}
                color={statusConfig.step >= 2 ? "#FFF" : "#9CA3AF"}
              />
            </View>
            <Text
              style={[
                styles.timelineText,
                statusConfig.step >= 2 && {
                  color: "#EC4899",
                  fontWeight: "700",
                },
              ]}
            >
              In Transit
            </Text>
          </View>

          <View
            style={[
              styles.timelineConnector,
              statusConfig.step >= 3 && { backgroundColor: "#10B981" },
            ]}
          />

          <View style={styles.timelineItem}>
            <View
              style={[
                styles.timelineIconWrapper,
                statusConfig.step >= 3 && { backgroundColor: "#10B981" },
              ]}
            >
              <Ionicons
                name={statusConfig.step >= 3 ? "checkmark" : "heart-outline"}
                size={18}
                color={statusConfig.step >= 3 ? "#FFF" : "#9CA3AF"}
              />
            </View>
            <Text
              style={[
                styles.timelineText,
                statusConfig.step >= 3 && {
                  color: "#10B981",
                  fontWeight: "700",
                },
              ]}
            >
              Completed
            </Text>
          </View>
        </View>

        {/* Details */}
        {item.status === "accepted" && item.ngoDetails && (
          <View style={[styles.detailsBox, { borderLeftColor: "#9333EA" }]}>
            <View style={styles.detailsHeader}>
              <View
                style={[styles.detailsIcon, { backgroundColor: "#F3E8FF" }]}
              >
                <Ionicons name="business" size={16} color="#9333EA" />
              </View>
              <Text style={styles.detailsTitle}>NGO Information</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="people" size={14} color="#6B7280" />
              <Text style={styles.detailText}>{item.ngoDetails.name}</Text>
            </View>
            {item.ngoDetails.phone && (
              <View style={styles.detailRow}>
                <Ionicons name="call" size={14} color="#6B7280" />
                <Text style={styles.detailText}>{item.ngoDetails.phone}</Text>
              </View>
            )}
          </View>
        )}

        {item.status === "pickup" && item.pickupDetails && (
          <View style={[styles.detailsBox, { borderLeftColor: "#EC4899" }]}>
            <View style={styles.detailsHeader}>
              <View
                style={[styles.detailsIcon, { backgroundColor: "#FCE7F3" }]}
              >
                <MaterialIcons
                  name="delivery-dining"
                  size={16}
                  color="#EC4899"
                />
              </View>
              <Text style={styles.detailsTitle}>Pickup In Progress</Text>
            </View>
            {item.pickupDetails.volunteer && (
              <View style={styles.detailRow}>
                <Ionicons name="person" size={14} color="#6B7280" />
                <Text style={styles.detailText}>
                  {item.pickupDetails.volunteer}
                </Text>
              </View>
            )}
            {item.pickupDetails.date && (
              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={14} color="#6B7280" />
                <Text style={styles.detailText}>{item.pickupDetails.date}</Text>
              </View>
            )}
            {item.location?.address && (
              <View style={styles.detailRow}>
                <Ionicons name="location" size={14} color="#6B7280" />
                <Text style={styles.detailText}>{item.location.address}</Text>
              </View>
            )}
          </View>
        )}

        {item.status === "donated" && item.donatedDetails && (
          <View style={[styles.detailsBox, { borderLeftColor: "#10B981" }]}>
            <View style={styles.detailsHeader}>
              <View
                style={[styles.detailsIcon, { backgroundColor: "#D1FAE5" }]}
              >
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              </View>
              <Text style={styles.detailsTitle}>Successfully Delivered</Text>
            </View>
            {item.donatedDetails.date && (
              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={14} color="#6B7280" />
                <Text style={styles.detailText}>
                  {item.donatedDetails.date}
                </Text>
              </View>
            )}
            {item.donatedDetails.receivedBy && (
              <View style={styles.detailRow}>
                <Ionicons name="person" size={14} color="#6B7280" />
                <Text style={styles.detailText}>
                  {item.donatedDetails.receivedBy}
                </Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>View Full Details</Text>
          <Ionicons name="arrow-forward-circle" size={20} color="#9333EA" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9333EA" />
        <Text style={styles.loadingText}>Loading pickups...</Text>
      </View>
    );
  }

  const activeCount = pickups.filter((p) => p.status === "pickup").length;
  const acceptedCount = pickups.filter((p) => p.status === "accepted").length;
  const completedCount = pickups.filter((p) => p.status === "donated").length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#9333EA" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Pickup Tracking</Text>
          <Text style={styles.headerSubtitle}>
            Monitor your active deliveries
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchPickups}>
          <Ionicons name="refresh" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: "#F3E8FF" }]}>
          <View style={styles.statIconWrapper}>
            <Ionicons name="hand-right" size={24} color="#9333EA" />
          </View>
          <Text style={[styles.statNumber, { color: "#9333EA" }]}>
            {acceptedCount}
          </Text>
          <Text style={styles.statLabel}>Accepted</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: "#FCE7F3" }]}>
          <View style={styles.statIconWrapper}>
            <MaterialIcons name="delivery-dining" size={24} color="#EC4899" />
          </View>
          <Text style={[styles.statNumber, { color: "#EC4899" }]}>
            {activeCount}
          </Text>
          <Text style={styles.statLabel}>In Transit</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: "#D1FAE5" }]}>
          <View style={styles.statIconWrapper}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          </View>
          <Text style={[styles.statNumber, { color: "#10B981" }]}>
            {completedCount}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filterStatus === "all" && styles.filterChipActive,
          ]}
          onPress={() => setFilterStatus("all")}
        >
          <Text
            style={[
              styles.filterChipText,
              filterStatus === "all" && styles.filterChipTextActive,
            ]}
          >
            All ({pickups.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filterStatus === "accepted" && {
              backgroundColor: "#F3E8FF",
              borderColor: "#9333EA",
            },
          ]}
          onPress={() => setFilterStatus("accepted")}
        >
          {filterStatus === "accepted" && (
            <Ionicons name="hand-right" size={14} color="#9333EA" />
          )}
          <Text
            style={[
              styles.filterChipText,
              filterStatus === "accepted" && { color: "#9333EA" },
            ]}
          >
            Accepted ({acceptedCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filterStatus === "pickup" && {
              backgroundColor: "#FCE7F3",
              borderColor: "#EC4899",
            },
          ]}
          onPress={() => setFilterStatus("pickup")}
        >
          {filterStatus === "pickup" && (
            <MaterialIcons name="delivery-dining" size={14} color="#EC4899" />
          )}
          <Text
            style={[
              styles.filterChipText,
              filterStatus === "pickup" && { color: "#EC4899" },
            ]}
          >
            In Transit ({activeCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filterStatus === "donated" && {
              backgroundColor: "#D1FAE5",
              borderColor: "#10B981",
            },
          ]}
          onPress={() => setFilterStatus("donated")}
        >
          {filterStatus === "donated" && (
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
          )}
          <Text
            style={[
              styles.filterChipText,
              filterStatus === "donated" && { color: "#10B981" },
            ]}
          >
            Completed ({completedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pickups List */}
      {filteredPickups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrapper}>
            <MaterialIcons name="delivery-dining" size={48} color="#9333EA" />
          </View>
          <Text style={styles.emptyText}>No Pickups Found</Text>
          <Text style={styles.emptySubtext}>
            {filterStatus === "all"
              ? "No active pickups at the moment"
              : `No ${filterStatus} pickups found`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPickups}
          renderItem={renderPickup}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#9333EA"]}
              tintColor="#9333EA"
            />
          }
        />
      )}
    </View>
  );
};

export default PickupTrackingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  header: {
    backgroundColor: "#9333EA",
    paddingTop: Platform.OS === "ios" ? 50 : 35,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#9333EA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#FFF",
    opacity: 0.9,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIconWrapper: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
    flexWrap: "wrap",
    zIndex: 1,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  filtersContent: {
    gap: 10,
  },

  filterChipActive: {
    backgroundColor: "#9333EA",
    borderColor: "#9333EA",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
  },
  filterChipTextActive: {
    color: "#FFF",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 16,
  },
  thumbnail: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
  },
  cardInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  foodName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  qtyText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "800",
  },
  progressBar: {
    height: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
    position: "relative",
  },
  progressGlow: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 30,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  timeline: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
  },
  timelineItem: {
    alignItems: "center",
    flex: 1,
  },
  timelineIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    elevation: 2,
  },
  timelineText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    textAlign: "center",
  },
  timelineConnector: {
    height: 3,
    flex: 0.3,
    backgroundColor: "#E5E7EB",
    marginBottom: 32,
    borderRadius: 2,
  },
  detailsBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderLeftWidth: 4,
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  detailsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  detailsTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
    paddingLeft: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
    fontWeight: "500",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    marginTop: 6,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#9333EA",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
