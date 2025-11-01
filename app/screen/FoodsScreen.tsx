// FoodsScreen.tsx - Modified for NGO-only distance features
import { auth, db } from "@/configs/FirebaseConfig";
import { getDistance } from "@/utils/dijkstra";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
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
import Toast from "react-native-toast-message";

interface Post {
  id: string;
  foodName: string;
  useTime: string;
  quantity: string | number;
  imageUrl?: string;
  createdAt?: any;
  status: "pending" | "accepted" | "pickup" | "inTransit" | "donated";
  description?: string;
  createdBy: {
    uid?: string | null;
    isAnonymous?: boolean;
    email?: string | null;
  };
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  ngoDetails?: {
    uid?: string | null;
    name?: string;
    email?: string;
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
  distance?: number;
}

interface UserData {
  fullName?: string;
  uid?: string;
  isAnonymous?: boolean;
  email?: string;
  role?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

const statuses = [
  "pending",
  "accepted",
  "pickup",
  "inTransit",
  "donated",
] as const;

const DISTANCE_OPTIONS = [10, 100, 500, 1000];

export default function FoodsScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [maxDistance, setMaxDistance] = useState<number>(100);

  const router = useRouter();
  const currentAuthUser = auth.currentUser;
  const isNGO = user?.role === "ngo";
  useEffect(() => {
    let mounted = true;
    async function fetchUser() {
      setLoading(true);
      try {
        if (!currentAuthUser) {
          setUser(null);
          return;
        }
        const userDoc = await getDoc(doc(db, "users", currentAuthUser.uid));
        if (mounted && userDoc.exists()) {
          setUser(userDoc.data() as UserData);
        } else {
          setUser({
            uid: currentAuthUser.uid,
            email: currentAuthUser.email || undefined,
            isAnonymous: currentAuthUser.isAnonymous || false,
          });
        }
      } catch (err) {
        console.error("fetchUser error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchUser();
    return () => {
      mounted = false;
    };
  }, [currentAuthUser]);

  const requestAndSetLocation = useCallback(async () => {
    if (!isNGO) {
      return null;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied. Showing all posts.");
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setUserLocation(coords);
      return coords;
    } catch (err) {
      console.error("getUserLocation error:", err);
      setError("Could not get your location. Showing all posts.");
      return null;
    }
  }, [isNGO]);

  const fetchPosts = useCallback(
    async (options?: { forceLocation?: boolean }) => {
      setError("");
      if (isNGO) {
        if (!options?.forceLocation && !userLocation) {
          await requestAndSetLocation();
        } else if (options?.forceLocation) {
          await requestAndSetLocation();
        }
      }

      try {
        setLoading(true);
        const q = query(collection(db, "foods"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const fetched: Post[] = [];

        snap.forEach((d) => {
          const data: any = d.data();
          const useTimeVal =
            data.useTime &&
            typeof data.useTime === "object" &&
            typeof data.useTime.toDate === "function"
              ? data.useTime.toDate().toLocaleString()
              : data.useTime || "";

          const post: Post = {
            id: d.id,
            foodName: data.foodName || "Untitled",
            useTime: useTimeVal,
            quantity: data.quantity ?? "",
            imageUrl: data.imageUrl ?? "",
            createdAt: data.createdAt ?? null,
            createdBy: data.createdBy ?? { uid: null },
            status: data.status ?? "pending",
            description: data.description ?? "",
            location: data.location ?? undefined,
            ngoDetails: data.ngoDetails ?? undefined,
            pickupDetails: data.pickupDetails ?? undefined,
            donatedDetails: data.donatedDetails ?? undefined,
          };
          if (
            isNGO &&
            userLocation &&
            post.location &&
            post.location.latitude != null &&
            post.location.longitude != null
          ) {
            try {
              const km = getDistance(
                userLocation.latitude,
                userLocation.longitude,
                post.location.latitude,
                post.location.longitude
              );
              post.distance =
                typeof km === "number" && isFinite(km) ? km : undefined;
            } catch (err) {
              console.warn("distance calc error", err);
              post.distance = undefined;
            }
          }
          fetched.push(post);
        });

        if (isNGO) {
          fetched.sort((a, b) => {
            if (a.distance != null && b.distance != null)
              return a.distance - b.distance;
            if (a.distance != null) return -1;
            if (b.distance != null) return 1;
            return 0;
          });
        }

        setPosts(fetched);
      } catch (err: any) {
        console.error("fetchPosts error:", err);
        setError("Failed to load food posts. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [requestAndSetLocation, userLocation, isNGO]
  );

  // initial load
  useEffect(() => {
    fetchPosts({ forceLocation: false });
  }, [fetchPosts]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (isNGO) {
      await requestAndSetLocation();
    }
    await fetchPosts();
    setRefreshing(false);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Available",
          color: "#9333EA",
          bg: "#F3E8FF",
          icon: "checkmark-circle-outline",
        };
      case "accepted":
        return {
          label: "Accepted",
          color: "#3B82F6",
          bg: "#DBEAFE",
          icon: "hand-right-outline",
        };
      case "pickup":
        return {
          label: "Pickup",
          color: "#EC4899",
          bg: "#FCE7F3",
          icon: "car-outline",
        };
      case "inTransit":
        return {
          label: "In Transit",
          color: "#F59E0B",
          bg: "#FFF7ED",
          icon: "car-outline",
        };
      case "donated":
        return {
          label: "Completed",
          color: "#10B981",
          bg: "#D1FAE5",
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

    const matchesDistance =
      isNGO && userLocation && post.distance != null
        ? maxDistance === 1000
          ? true
          : post.distance <= maxDistance
        : true;

    return matchesStatus && matchesSearch && matchesDistance;
  });

  const updateStatus = async (
    post: Post,
    newStatus: Post["status"],
    toastText: string
  ) => {
    try {
      const postRef = doc(db, "foods", post.id);

      const updatePayload: any = {
        status: newStatus,
        updatedAt: Timestamp.now(),
      };

      if (newStatus === "donated") {
        updatePayload.donatedAt = Timestamp.now();
      }
      if (newStatus === "pickup") {
        updatePayload.pickedUpAt = Timestamp.now();
      }
      if (newStatus === "inTransit") {
        updatePayload.inTransitAt = Timestamp.now();
      }
      if (newStatus === "accepted") {
        updatePayload.ngoDetails = {
          uid: user?.uid ?? currentAuthUser?.uid ?? null,
          isAnonymous:
            user?.isAnonymous ?? currentAuthUser?.isAnonymous ?? false,
          email: user?.email ?? currentAuthUser?.email ?? null,
          name: user?.fullName ?? undefined,
        };
        updatePayload.acceptedAt = Timestamp.now();
      }

      await updateDoc(postRef, updatePayload);

      Toast.show({
        type: "success",
        text1: "Status Updated",
        text2: toastText,
      });
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, status: newStatus } : p))
      );
    } catch (err: any) {
      console.error("updateStatus error:", err);
      Toast.show({
        type: "error",
        text1: "Error updating status",
        text2: err?.message ?? "Unknown error",
      });
    }
  };

  // action handlers
  const handleAccept = (post: Post) =>
    updateStatus(post, "accepted", "You have accepted this food request.");
  const handlePickup = (post: Post) =>
    updateStatus(post, "pickup", "Food is now marked as picked up.");
  const handleInTransit = (post: Post) =>
    updateStatus(post, "inTransit", "Food is now marked as in transit.");
  const handleDonated = (post: Post) =>
    updateStatus(post, "donated", "This food has been successfully donated.");

  const renderButton = ({ item }: { item: Post }) => {
    const { status, ngoDetails, createdBy } = item;
    const currentUid = user?.uid ?? currentAuthUser?.uid ?? null;
    const currentRole = user?.role ?? null;

    if (status === "pending" && currentRole === "ngo") {
      return (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleAccept(item)}
        >
          <Ionicons name="hand-right-outline" size={16} color="#FFF" />
          <Text style={styles.BtnText}>Accept</Text>
        </TouchableOpacity>
      );
    }

    if (
      status === "accepted" &&
      currentRole === "donor" &&
      currentUid &&
      createdBy?.uid === currentUid
    ) {
      return (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handlePickup(item)}
        >
          <Ionicons name="cube-outline" size={16} color="#FFF" />
          <Text style={styles.BtnText}>Pickup</Text>
        </TouchableOpacity>
      );
    }

    if (
      status === "pickup" &&
      currentRole === "ngo" &&
      currentUid &&
      ngoDetails?.uid === currentUid
    ) {
      return (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleInTransit(item)}
        >
          <Ionicons name="car-outline" size={16} color="#FFF" />
          <Text style={styles.BtnText}>In Transit</Text>
        </TouchableOpacity>
      );
    }

    if (
      status === "inTransit" &&
      currentRole === "ngo" &&
      currentUid &&
      ngoDetails?.uid === currentUid
    ) {
      return (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleDonated(item)}
        >
          <Ionicons name="checkmark-done-outline" size={16} color="#FFF" />
          <Text style={styles.BtnText}>Donated</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.viewBtn}
        onPress={() =>
          router.push({
            pathname: "/screen/FoodDetailsScreen",
            params: { item: JSON.stringify(item) },
          })
        }
      >
        <Ionicons name="arrow-forward" size={18} color="#9333EA" />
      </TouchableOpacity>
    );
  };

  const renderPost = ({ item }: { item: Post }) => {
    const statusConfig = getStatusConfig(item.status);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() =>
          router.push({
            pathname: "/screen/FoodDetailsScreen",
            params: { item: JSON.stringify(item) },
          })
        }
      >
        <View style={styles.cardHeader}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.thumbnail,
                { alignItems: "center", justifyContent: "center" },
              ]}
            >
              <Text style={{ fontSize: 12, color: "#6B7280" }}>No image</Text>
            </View>
          )}
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

            {/* Show distance badge only for NGO users */}
            {isNGO && item.distance != null && (
              <View style={styles.distanceBadge}>
                <Ionicons name="location" size={12} color="#9333EA" />
                <Text style={styles.distanceText}>
                  {item.distance < 1
                    ? `${(item.distance * 1000).toFixed(0)}m away`
                    : `${item.distance.toFixed(1)}km away`}
                </Text>
              </View>
            )}
          </View>
        </View>

        {item.location?.address && (
          <View style={styles.locationBox}>
            <Ionicons name="location-outline" size={14} color="#9333EA" />
            <Text style={styles.locationText} numberOfLines={2}>
              {item.location.address}
            </Text>
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

          {renderButton({ item })}
        </View>
      </TouchableOpacity>
    );
  };

  const getDistanceLabel = (distance: number) => {
    if (distance === 1000) return "More";
    return `${distance}km`;
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#9333EA" />
        <Text style={styles.loadingText}>
          {isNGO ? "Finding nearby food..." : "Loading food items..."}
        </Text>
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
            <Ionicons name="location" size={24} color="#9333EA" />
          </View>
          <View>
            <Text style={styles.title}>
              {isNGO ? "Nearby Food" : "Available Food"}
            </Text>
            <Text style={styles.subtitle}>
              {filteredPosts.length}{" "}
              {filteredPosts.length === 1 ? "item" : "items"}{" "}
              {isNGO ? "nearby" : "available"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => {
            if (isNGO) {
              requestAndSetLocation().then(() =>
                fetchPosts({ forceLocation: false })
              );
            } else {
              fetchPosts({ forceLocation: false });
            }
          }}
        >
          <Ionicons name="refresh" size={20} color="#9333EA" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder={isNGO ? "Search nearby food..." : "Search food items..."}
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

      {/* Distance Filter - Only show for NGO users */}
      {isNGO && (
        <View style={styles.distanceFilter}>
          <Ionicons name="navigate-circle-outline" size={18} color="#9333EA" />
          <Text style={styles.distanceLabel}>Within:</Text>
          {DISTANCE_OPTIONS.map((distance) => (
            <TouchableOpacity
              key={distance}
              style={[
                styles.distanceChip,
                maxDistance === distance && styles.distanceChipActive,
              ]}
              onPress={() => setMaxDistance(distance)}
            >
              <Text
                style={[
                  styles.distanceChipText,
                  maxDistance === distance && styles.distanceChipTextActive,
                ]}
              >
                {getDistanceLabel(distance)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

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
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchPosts({ forceLocation: true })}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : filteredPosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>
            {isNGO ? "No Nearby Food Found" : "No Food Found"}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery
              ? "Try a different search or increase the distance"
              : isNGO
              ? "Try increasing the distance range"
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
              colors={["#9333EA"]}
              tintColor="#9333EA"
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
    backgroundColor: "#FCE7F3",
    top: 30,
    left: -60,
    opacity: 0.5,
  },
  circle3: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#DBEAFE",
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
    shadowColor: "#9333EA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    paddingTop: 15,
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
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 2,
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
  distanceFilter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 6,
    zIndex: 1,
  },
  distanceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  distanceChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 16,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  distanceChipActive: {
    backgroundColor: "#9333EA",
    borderColor: "#9333EA",
  },
  distanceChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  distanceChipTextActive: {
    color: "#FFF",
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
    backgroundColor: "#9333EA",
    borderColor: "#9333EA",
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
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9333EA",
  },
  locationBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: "#7C3AED",
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
  BtnText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4B5563",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#4B5563",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: "#9333EA",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#9333EA",
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
