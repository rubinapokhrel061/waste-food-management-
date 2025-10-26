import { db } from "@/configs/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Post {
  id: string;
  foodName: string;
  useTime: string;
  quantity: string | number;
  imageUrl: string;
  createdAt?: any;
  status: "pending" | "accepted" | "pickup" | "donated";
  description?: string;
  ngoDetails?: {
    name: string;
    email: string;
    phone?: string;
  };
  pickupDetails?: {
    date?: string;
    time?: string;
    address?: string;
  };
  donatedDetails?: {
    date?: string;
    ngoName?: string;
    receivedBy?: string;
  };
}

const statuses = ["pending", "accepted", "pickup", "donated"];

export default function FoodsScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const fetchPosts = async () => {
    try {
      setError("");
      const q = query(collection(db, "foods"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedPosts: Post[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedPosts.push({
          id: doc.id,
          foodName: data.foodName,
          useTime: data.useTime?.toDate
            ? data.useTime.toDate().toLocaleString()
            : data.useTime || "",
          quantity: data.quantity,
          imageUrl: data.imageUrl,
          createdAt: data.createdAt,
          status: data.status || "pending",
          description: data.description,
          ngoDetails: data.ngoDetails,
          pickupDetails: data.pickupDetails,
          donatedDetails: data.donatedDetails,
        });
      });

      setPosts(fetchedPosts);
    } catch (err: any) {
      console.error("Error fetching posts:", err);
      setError("Failed to load food posts. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Pending",
          color: "#F59E0B",
          bg: "#FEF3C7",
          icon: "time-outline",
        };
      case "accepted":
        return {
          label: "Accepted",
          color: "#10B981",
          bg: "#D1FAE5",
          icon: "checkmark-circle-outline",
        };
      case "pickup":
        return {
          label: "Pickup",
          color: "#3B82F6",
          bg: "#DBEAFE",
          icon: "car-outline",
        };
      case "donated":
        return {
          label: "Donated",
          color: "#8B5CF6",
          bg: "#EDE9FE",
          icon: "heart-outline",
        };
      default:
        return {
          label: "Unknown",
          color: "#6B7280",
          bg: "#F3F4F6",
          icon: "help-circle-outline",
        };
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesStatus =
      filterStatus === "all" || post.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      post.foodName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const renderPost = ({ item }: { item: Post }) => {
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
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.useTime}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="cube-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText}>Qty: {item.quantity}</Text>
            </View>
          </View>
        </View>

        {/* Status-specific content */}
        {item.status === "accepted" && item.ngoDetails && (
          <View style={styles.detailsBox}>
            <View style={styles.detailsHeader}>
              <Ionicons name="business-outline" size={16} color="#10B981" />
              <Text style={styles.detailsTitle}>NGO Details</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={14} color="#6B7280" />
              <Text style={styles.detailText}>{item.ngoDetails.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="mail-outline" size={14} color="#6B7280" />
              <Text style={styles.detailText}>{item.ngoDetails.email}</Text>
            </View>
            {item.ngoDetails.phone && (
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={14} color="#6B7280" />
                <Text style={styles.detailText}>{item.ngoDetails.phone}</Text>
              </View>
            )}
          </View>
        )}

        {item.status === "pickup" && item.pickupDetails && (
          <View style={styles.detailsBox}>
            <View style={styles.detailsHeader}>
              <Ionicons name="car-outline" size={16} color="#3B82F6" />
              <Text style={styles.detailsTitle}>Pickup Details</Text>
            </View>
            {item.pickupDetails.date && (
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text style={styles.detailText}>{item.pickupDetails.date}</Text>
              </View>
            )}
            {item.pickupDetails.time && (
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text style={styles.detailText}>{item.pickupDetails.time}</Text>
              </View>
            )}
            {item.pickupDetails.address && (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text style={styles.detailText}>
                  {item.pickupDetails.address}
                </Text>
              </View>
            )}
          </View>
        )}

        {item.status === "donated" && item.donatedDetails && (
          <View style={styles.detailsBox}>
            <View style={styles.detailsHeader}>
              <Ionicons name="heart-outline" size={16} color="#8B5CF6" />
              <Text style={styles.detailsTitle}>Donation Completed</Text>
            </View>
            {item.donatedDetails.date && (
              <View style={styles.detailRow}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={14}
                  color="#6B7280"
                />
                <Text style={styles.detailText}>
                  Donated on {item.donatedDetails.date}
                </Text>
              </View>
            )}
            {item.donatedDetails.ngoName && (
              <View style={styles.detailRow}>
                <Ionicons name="business-outline" size={14} color="#6B7280" />
                <Text style={styles.detailText}>
                  {item.donatedDetails.ngoName}
                </Text>
              </View>
            )}
            {item.donatedDetails.receivedBy && (
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={14} color="#6B7280" />
                <Text style={styles.detailText}>
                  Received by {item.donatedDetails.receivedBy}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.cardFooter}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusConfig.bg,
                borderColor: statusConfig.color,
              },
            ]}
          >
            <Ionicons
              name={statusConfig.icon as any}
              size={16}
              color={statusConfig.color}
            />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>

          {item.status === "pending" ? (
            <TouchableOpacity style={styles.requestBtn}>
              <Ionicons name="hand-right-outline" size={16} color="#FFF" />
              <Text style={styles.requestBtnText}>Request Pickup</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.viewBtn}>
              <Ionicons name="arrow-forward" size={18} color="#7C3AED" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.bgGradient}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
      </View>

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.iconWrapper}>
            <Ionicons name="restaurant" size={24} color="#7C3AED" />
          </View>
          <View>
            <Text style={styles.title}>Available Food</Text>
            <Text style={styles.subtitle}>
              {filteredPosts.length}{" "}
              {filteredPosts.length === 1 ? "item" : "items"}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchPosts}>
          <Ionicons name="refresh" size={20} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search food items..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filterStatus === "all" && styles.filterActive,
          ]}
          onPress={() => setFilterStatus("all")}
        >
          <Text
            style={[
              styles.filterText,
              filterStatus === "all" && styles.filterTextActive,
            ]}
          >
            All ({posts.length})
          </Text>
        </TouchableOpacity>
        {statuses.map((status) => {
          const config = getStatusConfig(status);
          const count = posts.filter((p) => p.status === status).length;
          return (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                filterStatus === status && styles.filterActive,
                filterStatus === status && {
                  backgroundColor: config.bg,
                  borderColor: config.color,
                },
              ]}
              onPress={() => setFilterStatus(status)}
            >
              {filterStatus === status && (
                <Ionicons
                  name={config.icon as any}
                  size={14}
                  color={config.color}
                />
              )}
              <Text
                style={[
                  styles.filterText,
                  filterStatus === status && { color: config.color },
                ]}
              >
                {config.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchPosts}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : filteredPosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="fast-food-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No Food Found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery
              ? "Try a different search"
              : "No items match this filter"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#7C3AED"]}
              tintColor="#7C3AED"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  bgGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    overflow: "hidden",
  },
  circle1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#F3E8FF",
    top: -150,
    right: -80,
    opacity: 0.6,
  },
  circle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#DBEAFE",
    top: 30,
    left: -60,
    opacity: 0.5,
  },
  circle3: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#FCE7F3",
    top: 100,
    right: 50,
    opacity: 0.4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 10,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
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
  filterActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  filterText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFF",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  foodName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  viewBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  detailsBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#7C3AED",
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
  },
  requestBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7C3AED",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  requestBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
