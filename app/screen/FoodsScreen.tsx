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
import Toast from "react-native-toast-message";

interface Post {
  id: string;
  foodName: string;
  useTime: string;
  quantity: string | number;
  imageUrl: string;
  createdAt?: any;
  status: "pending" | "accepted" | "pickup" | "inTransit" | "donated";
  description?: string;

  createdBy: {
    uid: string | null;
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
const statuses = ["pending", "accepted", "pickup", "inTransit", "donated"];
export default function FoodsScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [user, setUser] = useState<UserData | null>(null);

  const [maxDistance, setMaxDistance] = useState(10); // km
  const router = useRouter();
  const { uid }: any = auth.currentUser;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.warn("No logged-in user");
          setLoading(false);
          return;
        }

        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserData);
        } else {
          console.warn("User document not found");
          setUser(null);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  console.log("user", user);
  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied. Showing all posts.");
        return null;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (err) {
      console.error("Error getting location:", err);
      setError("Could not get your location. Showing all posts.");
      return null;
    }
  };

  const fetchPosts = async () => {
    try {
      setError("");
      const location = await getUserLocation();

      const q = query(collection(db, "foods"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedPosts: Post[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const post: Post = {
          id: doc.id,
          foodName: data.foodName,
          useTime: data.useTime?.toDate
            ? data.useTime.toDate().toLocaleString()
            : data.useTime || "",
          quantity: data.quantity,
          imageUrl: data.imageUrl,
          createdAt: data.createdAt,
          createdBy: data.createdBy,
          status: data.status || "pending",
          description: data.description,
          location: data.location,
          ngoDetails: data.ngoDetails,
          pickupDetails: data.pickupDetails,
          donatedDetails: data.donatedDetails,
        };
        if (location && post.location) {
          post.distance = getDistance(
            location.latitude,
            location.longitude,
            post.location.latitude,
            post.location.longitude
          );
        }

        fetchedPosts.push(post);
      });
      fetchedPosts.sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        return 0;
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
      userLocation && post.distance !== undefined
        ? post.distance <= maxDistance
        : true;
    return matchesStatus && matchesSearch && matchesDistance;
  });
  // const handleRequest = async (post: Post) => {
  //   const postRef = doc(db, "foods", post?.id);

  //   try {
  // const user = auth.currentUser;
  //     if (!user) {
  //       Toast.show({
  //         type: "error",
  //         text1: "Not logged in",
  //         text2: "Please log in to accept food requests.",
  //       });
  //       return;
  //     }
  //     await updateDoc(postRef, {
  //       status: "accepted",
  //       ngoDetails: {
  //         uid: user.uid,
  //         isAnonymous: user.isAnonymous || false,
  //         email: user.email || null,
  //       },
  //       updatedAt: Timestamp.now(),
  //     });
  //     Toast.show({
  //       type: "success",
  //       text1: "Request Accepted",
  //       text2: `You have accepted ${post.foodName || "this food item"}.`,
  //     });

  //     fetchPosts();
  //   } catch (err: any) {
  //     console.error("Error updating post status:", err);
  //     Toast.show({
  //       type: "error",
  //       text1: "Error updating status",
  //       text2: err?.message || "Something went wrong.",
  //     });
  //   }
  // };

  const updateStatus = async (
    post: any,
    newStatus: string,
    toastText: string
  ) => {
    try {
      const postRef = doc(db, "foods", post.id);
      await updateDoc(postRef, {
        status: newStatus,

        updatedAt: Timestamp.now(),
        ...(newStatus === "donated" && { donatedAt: Timestamp.now() }),
        ...(newStatus === "pickup" && { pickupedAt: Timestamp.now() }),
        ...(newStatus === "inTransit" && { inTransit: Timestamp.now() }),
        ...(newStatus === "accepted" && {
          ngoDetails: {
            uid: user?.uid,
            isAnonymous: user?.isAnonymous || false,
            email: user?.email || null,
          },
        }),
      });

      Toast.show({
        type: "success",
        text1: "Status Updated",
        text2: toastText,
      });
      fetchPosts();
    } catch (err: any) {
      console.error("Error updating status:", err);
      Toast.show({
        type: "error",
        text1: "Error updating status",
        text2: err.message,
      });
    }
  };
  // const handleAccept = async (post: any) => {
  //   try {
  //     const postRef = doc(db, "foods", post.id);
  //     await updateDoc(postRef, {
  //       status: "accepted",
  //       ngoDetails: {
  //         uid: user?.uid || null,
  //         email: user?.email || null,
  //       },
  //       updatedAt: Timestamp.now(),
  //     });
  //     Toast.show({
  //       type: "success",
  //       text1: "Accepted",
  //       text2: "You have accepted this food request.",
  //     });
  //     fetchPosts();
  //   } catch (err: any) {
  //     Toast.show({ type: "error", text1: "Error", text2: err.message });
  //   }
  // };

  // const handlePickup = async (post: any) => {
  //   try {
  //     const postRef = doc(db, "foods", post.id);
  //     await updateDoc(postRef, {
  //       status: "pickup",
  //       updatedAt: Timestamp.now(),
  //     });
  //     Toast.show({
  //       type: "success",
  //       text1: "Pickup Started",
  //       text2: "Food is now marked as picked up.",
  //     });
  //     fetchPosts();
  //   } catch (err: any) {
  //     Toast.show({ type: "error", text1: "Error", text2: err.message });
  //   }
  // };

  // const handleInTransit = async (post: any) => {
  //   try {
  //     const postRef = doc(db, "foods", post.id);
  //     await updateDoc(postRef, {
  //       status: "inTransit",
  //       updatedAt: Timestamp.now(),
  //     });
  //     Toast.show({
  //       type: "success",
  //       text1: "In Transit",
  //       text2: "Food is now in transit.",
  //     });
  //     fetchPosts();
  //   } catch (err: any) {
  //     Toast.show({ type: "error", text1: "Error", text2: err.message });
  //   }
  // };

  // const handleDonated = async (post: any) => {
  //   try {
  //     const postRef = doc(db, "foods", post.id);
  //     await updateDoc(postRef, {
  //       status: "donated",
  //       donatedAt: Timestamp.now(),
  //     });
  //     Toast.show({
  //       type: "success",
  //       text1: "Donation Completed",
  //       text2: "This food item has been successfully donated.",
  //     });
  //     fetchPosts();
  //   } catch (err: any) {
  //     Toast.show({ type: "error", text1: "Error", text2: err.message });
  //   }
  // };

  const handleAccept = (post: any) =>
    updateStatus(post, "accepted", "You have accepted this food request.");

  const handlePickup = (post: any) =>
    updateStatus(post, "pickup", "Food is now marked as picked up.");

  const handleInTransit = (post: any) =>
    updateStatus(post, "inTransit", "Food is now marked as in transit.");

  const handleDonated = (post: any) =>
    updateStatus(post, "donated", "This food has been successfully donated.");

  const renderButton = ({ item }: { item: Post }) => {
    const { status, ngoDetails, createdBy } = item;
    console.log("createdBy", createdBy?.uid);
    console.log("user?.uid", user?.uid);
    if (status === "pending" && user?.role === "ngo") {
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
      user?.role === "donor" &&
      user?.uid === createdBy?.uid
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

    // NGO who accepted can mark as In Transit after pickup
    if (
      status === "pickup" &&
      user?.role === "ngo" &&
      user?.uid === ngoDetails?.uid
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

    // NGO who accepted can mark as Donated after inTransit
    if (
      status === "inTransit" &&
      user?.role === "ngo" &&
      user?.uid === ngoDetails?.uid
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

    // Default: View button
    return (
      <TouchableOpacity
        style={styles.viewBtn}
        onPress={() =>
          router.push({
            pathname: "/donor/screen/FoodDetailsScreen",
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
              {item.distance !== undefined && (
                <Text style={styles.distanceText}>
                  {item.distance < 1
                    ? `${(item.distance * 1000).toFixed(0)}m away`
                    : `${item.distance.toFixed(1)}km away`}
                </Text>
              )}
            </View>
            {item.distance !== undefined && (
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
          {/* <TouchableOpacity>
  {item.status === "pending" && userRole === "ngo" ? (
    <TouchableOpacity
      style={styles.requestBtn}
      onPress={() => handleRequest(item)}
    >
      <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" />
      <Text style={styles.requestBtnText}>Accept</Text>
    </TouchableOpacity>
  ) : item.status === "accepted" && userRole === "donor" ? (
    <TouchableOpacity
      style={styles.requestBtn}
      onPress={() => handleStatusUpdate(item, "pickup")}
    >
      <Ionicons name="cube-outline" size={16} color="#FFF" />
      <Text style={styles.requestBtnText}>Pickup</Text>
    </TouchableOpacity>
  ) : item.status === "pickup" && userRole === "ngo" ? (
    // NGO can mark as in transit
    <TouchableOpacity
      style={styles.requestBtn}
      onPress={() => handleStatusUpdate(item, "inTransit")}
    >
      <Ionicons name="car-outline" size={16} color="#FFF" />
      <Text style={styles.requestBtnText}>In Transit</Text>
    </TouchableOpacity>
  ) : item.status === "inTransit" && userRole === "ngo" ? (
    // NGO can mark as donated
    <TouchableOpacity
      style={styles.requestBtn}
      onPress={() => handleStatusUpdate(item, "donated")}
    >
      <Ionicons name="gift-outline" size={16} color="#FFF" />
      <Text style={styles.requestBtnText}>Donated</Text>
    </TouchableOpacity>
  ) : (
    // Default: view arrow
    <TouchableOpacity
      style={styles.viewBtn}
      onPress={() =>
        router.push({
          pathname: "/donor/screen/FoodDetailsScreen",
          params: { item: JSON.stringify(item) },
        })
      }
    >
      <Ionicons name="arrow-forward" size={18} color="#9333EA" />
    </TouchableOpacity>
  )}
</TouchableOpacity> */}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#9333EA" />
        <Text style={styles.loadingText}>Finding nearby food...</Text>
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
            <Text style={styles.title}>Nearby Food</Text>
            <Text style={styles.subtitle}>
              {filteredPosts.length}{" "}
              {filteredPosts.length === 1 ? "item" : "items"} nearby
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchPosts}>
          <Ionicons name="refresh" size={20} color="#9333EA" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search nearby food..."
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

      {/* Distance Filter */}
      <View style={styles.distanceFilter}>
        <Ionicons name="navigate-circle-outline" size={18} color="#9333EA" />
        <Text style={styles.distanceLabel}>Within:</Text>
        {[5, 10, 20, 50].map((distance) => (
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
              {distance}km
            </Text>
          </TouchableOpacity>
        ))}
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
          <Ionicons name="location-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No Nearby Food Found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery
              ? "Try a different search or increase the distance"
              : "Try increasing the distance range"}
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
    marginBottom: 12,
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
  distanceFilter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
    zIndex: 1,
  },
  distanceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  distanceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  detailsBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#9333EA",
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
  // requestBtn: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   backgroundColor: "#9333EA",
  //   paddingHorizontal: 16,
  //   paddingVertical: 8,
  //   borderRadius: 20,
  //   gap: 6,
  //   shadowColor: "#9333EA",
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.3,
  //   shadowRadius: 4,
  //   elevation: 3,
  // },
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

// import { db } from "@/configs/FirebaseConfig";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { collection, getDocs, orderBy, query } from "firebase/firestore";
// import React, { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   FlatList,
//   Image,
//   RefreshControl,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";

// interface Post {
//   id: string;
//   foodName: string;
//   useTime: string;
//   quantity: string | number;
//   imageUrl: string;
//   createdAt?: any;
//   status: "pending" | "accepted" | "pickup" | "donated";
//   description?: string;
//   ngoDetails?: {
//     name: string;
//     email: string;
//     phone?: string;
//   };
//   pickupDetails?: {
//     date?: string;
//     time?: string;
//     address?: string;
//   };
//   donatedDetails?: {
//     date?: string;
//     ngoName?: string;
//     receivedBy?: string;
//   };
// }

// const statuses = ["pending", "accepted", "pickup", "donated"];

// export default function FoodsScreen() {
//   const [posts, setPosts] = useState<Post[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState("");
//   const [filterStatus, setFilterStatus] = useState("all");
//   const [searchQuery, setSearchQuery] = useState("");
//   const router = useRouter();

//   const fetchPosts = async () => {
//     try {
//       setError("");
//       const q = query(collection(db, "foods"), orderBy("createdAt", "desc"));
//       const querySnapshot = await getDocs(q);
//       const fetchedPosts: Post[] = [];

//       querySnapshot.forEach((doc) => {
//         const data = doc.data();
//         fetchedPosts.push({
//           id: doc.id,
//           foodName: data.foodName,
//           useTime: data.useTime?.toDate
//             ? data.useTime.toDate().toLocaleString()
//             : data.useTime || "",
//           quantity: data.quantity,
//           imageUrl: data.imageUrl,
//           createdAt: data.createdAt,
//           status: data.status || "pending",
//           description: data.description,
//           ngoDetails: data.ngoDetails,
//           pickupDetails: data.pickupDetails,
//           donatedDetails: data.donatedDetails,
//         });
//       });

//       setPosts(fetchedPosts);
//     } catch (err: any) {
//       console.error("Error fetching posts:", err);
//       setError("Failed to load food posts. Please try again.");
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   useEffect(() => {
//     fetchPosts();
//   }, []);

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchPosts();
//   };

//   const getStatusConfig = (status: string) => {
//     switch (status) {
//       case "pending":
//         return {
//           label: "Pending",
//           color: "#F59E0B",
//           bg: "#FEF3C7",
//           icon: "time-outline",
//         };
//       case "accepted":
//         return {
//           label: "Accepted",
//           color: "#10B981",
//           bg: "#D1FAE5",
//           icon: "checkmark-circle-outline",
//         };
//       case "pickup":
//         return {
//           label: "Pickup",
//           color: "#3B82F6",
//           bg: "#DBEAFE",
//           icon: "car-outline",
//         };
//       case "donated":
//         return {
//           label: "Donated",
//           color: "#8B5CF6",
//           bg: "#EDE9FE",
//           icon: "heart-outline",
//         };
//       default:
//         return {
//           label: "Unknown",
//           color: "#6B7280",
//           bg: "#F3F4F6",
//           icon: "help-circle-outline",
//         };
//     }
//   };

//   const filteredPosts = posts.filter((post) => {
//     const matchesStatus =
//       filterStatus === "all" || post.status === filterStatus;
//     const matchesSearch =
//       !searchQuery ||
//       post.foodName.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchesStatus && matchesSearch;
//   });

//   const renderPost = ({ item }: { item: Post }) => {
//     const statusConfig = getStatusConfig(item.status);

//     return (
//       <TouchableOpacity
//         style={styles.card}
//         activeOpacity={0.7}
//         onPress={() =>
//           router.push({
//             pathname: "/screen/FoodDetailsScreen",
//             params: { item: JSON.stringify(item) },
//           })
//         }
//       >
//         <View style={styles.cardHeader}>
//           <Image
//             source={{ uri: item.imageUrl }}
//             style={styles.thumbnail}
//             resizeMode="cover"
//           />
//           <View style={styles.cardInfo}>
//             <Text style={styles.foodName} numberOfLines={2}>
//               {item.foodName}
//             </Text>
//             <View style={styles.metaRow}>
//               <Ionicons name="calendar-outline" size={14} color="#6B7280" />
//               <Text style={styles.metaText} numberOfLines={1}>
//                 {item.useTime}
//               </Text>
//             </View>
//             <View style={styles.metaRow}>
//               <Ionicons name="cube-outline" size={14} color="#6B7280" />
//               <Text style={styles.metaText}>Qty: {item.quantity}</Text>
//             </View>
//           </View>
//         </View>

//         {/* Status-specific content */}
//         {item.status === "accepted" && item.ngoDetails && (
//           <View style={styles.detailsBox}>
//             <View style={styles.detailsHeader}>
//               <Ionicons name="business-outline" size={16} color="#10B981" />
//               <Text style={styles.detailsTitle}>NGO Details</Text>
//             </View>
//             <View style={styles.detailRow}>
//               <Ionicons name="people-outline" size={14} color="#6B7280" />
//               <Text style={styles.detailText}>{item.ngoDetails.name}</Text>
//             </View>
//             <View style={styles.detailRow}>
//               <Ionicons name="mail-outline" size={14} color="#6B7280" />
//               <Text style={styles.detailText}>{item.ngoDetails.email}</Text>
//             </View>
//             {item.ngoDetails.phone && (
//               <View style={styles.detailRow}>
//                 <Ionicons name="call-outline" size={14} color="#6B7280" />
//                 <Text style={styles.detailText}>{item.ngoDetails.phone}</Text>
//               </View>
//             )}
//           </View>
//         )}

//         {item.status === "pickup" && item.pickupDetails && (
//           <View style={styles.detailsBox}>
//             <View style={styles.detailsHeader}>
//               <Ionicons name="car-outline" size={16} color="#3B82F6" />
//               <Text style={styles.detailsTitle}>Pickup Details</Text>
//             </View>
//             {item.pickupDetails.date && (
//               <View style={styles.detailRow}>
//                 <Ionicons name="calendar-outline" size={14} color="#6B7280" />
//                 <Text style={styles.detailText}>{item.pickupDetails.date}</Text>
//               </View>
//             )}
//             {item.pickupDetails.time && (
//               <View style={styles.detailRow}>
//                 <Ionicons name="time-outline" size={14} color="#6B7280" />
//                 <Text style={styles.detailText}>{item.pickupDetails.time}</Text>
//               </View>
//             )}
//             {item.pickupDetails.address && (
//               <View style={styles.detailRow}>
//                 <Ionicons name="location-outline" size={14} color="#6B7280" />
//                 <Text style={styles.detailText}>
//                   {item.pickupDetails.address}
//                 </Text>
//               </View>
//             )}
//           </View>
//         )}

//         {item.status === "donated" && item.donatedDetails && (
//           <View style={styles.detailsBox}>
//             <View style={styles.detailsHeader}>
//               <Ionicons name="heart-outline" size={16} color="#8B5CF6" />
//               <Text style={styles.detailsTitle}>Donation Completed</Text>
//             </View>
//             {item.donatedDetails.date && (
//               <View style={styles.detailRow}>
//                 <Ionicons
//                   name="checkmark-circle-outline"
//                   size={14}
//                   color="#6B7280"
//                 />
//                 <Text style={styles.detailText}>
//                   Donated on {item.donatedDetails.date}
//                 </Text>
//               </View>
//             )}
//             {item.donatedDetails.ngoName && (
//               <View style={styles.detailRow}>
//                 <Ionicons name="business-outline" size={14} color="#6B7280" />
//                 <Text style={styles.detailText}>
//                   {item.donatedDetails.ngoName}
//                 </Text>
//               </View>
//             )}
//             {item.donatedDetails.receivedBy && (
//               <View style={styles.detailRow}>
//                 <Ionicons name="person-outline" size={14} color="#6B7280" />
//                 <Text style={styles.detailText}>
//                   Received by {item.donatedDetails.receivedBy}
//                 </Text>
//               </View>
//             )}
//           </View>
//         )}

//         <View style={styles.cardFooter}>
//           <View
//             style={[
//               styles.statusBadge,
//               {
//                 backgroundColor: statusConfig.bg,
//                 borderColor: statusConfig.color,
//               },
//             ]}
//           >
//             <Ionicons
//               name={statusConfig.icon as any}
//               size={16}
//               color={statusConfig.color}
//             />
//             <Text style={[styles.statusText, { color: statusConfig.color }]}>
//               {statusConfig.label}
//             </Text>
//           </View>

//           {item.status === "pending" ? (
//             <TouchableOpacity style={styles.requestBtn}>
//               <Ionicons name="hand-right-outline" size={16} color="#FFF" />
//               <Text style={styles.requestBtnText}>Request Pickup</Text>
//             </TouchableOpacity>
//           ) : (
//             <TouchableOpacity style={styles.viewBtn}>
//               <Ionicons name="arrow-forward" size={18} color="#7C3AED" />
//             </TouchableOpacity>
//           )}
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   if (loading) {
//     return (
//       <View style={styles.centerContainer}>
//         <ActivityIndicator size="large" color="#7C3AED" />
//         <Text style={styles.loadingText}>Loading...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <View style={styles.bgGradient}>
//         <View style={styles.circle1} />
//         <View style={styles.circle2} />
//         <View style={styles.circle3} />
//       </View>

//       <View style={styles.header}>
//         <View style={styles.headerContent}>
//           <View style={styles.iconWrapper}>
//             <Ionicons name="restaurant" size={24} color="#7C3AED" />
//           </View>
//           <View>
//             <Text style={styles.title}>Available Food</Text>
//             <Text style={styles.subtitle}>
//               {filteredPosts.length}{" "}
//               {filteredPosts.length === 1 ? "item" : "items"}
//             </Text>
//           </View>
//         </View>
//         <TouchableOpacity style={styles.refreshBtn} onPress={fetchPosts}>
//           <Ionicons name="refresh" size={20} color="#7C3AED" />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.searchContainer}>
//         <Ionicons name="search" size={20} color="#9CA3AF" />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search food items..."
//           placeholderTextColor="#9CA3AF"
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//         />
//         {searchQuery.length > 0 && (
//           <TouchableOpacity onPress={() => setSearchQuery("")}>
//             <Ionicons name="close-circle" size={20} color="#9CA3AF" />
//           </TouchableOpacity>
//         )}
//       </View>

//       <View style={styles.filtersContainer}>
//         <TouchableOpacity
//           style={[
//             styles.filterChip,
//             filterStatus === "all" && styles.filterActive,
//           ]}
//           onPress={() => setFilterStatus("all")}
//         >
//           <Text
//             style={[
//               styles.filterText,
//               filterStatus === "all" && styles.filterTextActive,
//             ]}
//           >
//             All ({posts.length})
//           </Text>
//         </TouchableOpacity>
//         {statuses.map((status) => {
//           const config = getStatusConfig(status);
//           const count = posts.filter((p) => p.status === status).length;
//           return (
//             <TouchableOpacity
//               key={status}
//               style={[
//                 styles.filterChip,
//                 filterStatus === status && styles.filterActive,
//                 filterStatus === status && {
//                   backgroundColor: config.bg,
//                   borderColor: config.color,
//                 },
//               ]}
//               onPress={() => setFilterStatus(status)}
//             >
//               {filterStatus === status && (
//                 <Ionicons
//                   name={config.icon as any}
//                   size={14}
//                   color={config.color}
//                 />
//               )}
//               <Text
//                 style={[
//                   styles.filterText,
//                   filterStatus === status && { color: config.color },
//                 ]}
//               >
//                 {config.label} ({count})
//               </Text>
//             </TouchableOpacity>
//           );
//         })}
//       </View>

//       {error ? (
//         <View style={styles.errorContainer}>
//           <Ionicons name="alert-circle-outline" size={64} color="#DC2626" />
//           <Text style={styles.errorText}>{error}</Text>
//           <TouchableOpacity style={styles.retryBtn} onPress={fetchPosts}>
//             <Text style={styles.retryText}>Try Again</Text>
//           </TouchableOpacity>
//         </View>
//       ) : filteredPosts.length === 0 ? (
//         <View style={styles.emptyContainer}>
//           <Ionicons name="fast-food-outline" size={64} color="#D1D5DB" />
//           <Text style={styles.emptyText}>No Food Found</Text>
//           <Text style={styles.emptySubtext}>
//             {searchQuery
//               ? "Try a different search"
//               : "No items match this filter"}
//           </Text>
//         </View>
//       ) : (
//         <FlatList
//           data={filteredPosts}
//           renderItem={renderPost}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={styles.listContent}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//               colors={["#7C3AED"]}
//               tintColor="#7C3AED"
//             />
//           }
//         />
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F9FAFB",
//   },
//   bgGradient: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     height: 250,
//     overflow: "hidden",
//   },
//   circle1: {
//     position: "absolute",
//     width: 300,
//     height: 300,
//     borderRadius: 150,
//     backgroundColor: "#F3E8FF",
//     top: -150,
//     right: -80,
//     opacity: 0.6,
//   },
//   circle2: {
//     position: "absolute",
//     width: 200,
//     height: 200,
//     borderRadius: 100,
//     backgroundColor: "#DBEAFE",
//     top: 30,
//     left: -60,
//     opacity: 0.5,
//   },
//   circle3: {
//     position: "absolute",
//     width: 150,
//     height: 150,
//     borderRadius: 75,
//     backgroundColor: "#FCE7F3",
//     top: 100,
//     right: 50,
//     opacity: 0.4,
//   },
//   centerContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#F9FAFB",
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingTop: 20,
//     paddingBottom: 16,
//     zIndex: 1,
//   },
//   headerContent: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//   },
//   iconWrapper: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: "#FFF",
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: "#7C3AED",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: "700",
//     color: "#111827",
//   },
//   subtitle: {
//     fontSize: 14,
//     color: "#6B7280",
//     marginTop: 2,
//   },
//   refreshBtn: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: "#FFF",
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   loadingText: {
//     marginTop: 12,
//     fontSize: 14,
//     color: "#6B7280",
//   },
//   searchContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#FFF",
//     marginHorizontal: 20,
//     marginBottom: 16,
//     paddingHorizontal: 16,
//     paddingVertical: 6,
//     borderRadius: 14,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//     gap: 10,
//     zIndex: 1,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 15,
//     color: "#111827",
//   },
//   filtersContainer: {
//     flexDirection: "row",
//     paddingHorizontal: 20,
//     marginBottom: 16,
//     gap: 8,
//     flexWrap: "wrap",
//     zIndex: 1,
//   },
//   filterChip: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 14,
//     paddingVertical: 8,
//     borderRadius: 20,
//     backgroundColor: "#FFF",
//     borderWidth: 1.5,
//     borderColor: "#E5E7EB",
//     gap: 6,
//   },
//   filterActive: {
//     backgroundColor: "#7C3AED",
//     borderColor: "#7C3AED",
//   },
//   filterText: {
//     fontSize: 13,
//     color: "#6B7280",
//     fontWeight: "600",
//   },
//   filterTextActive: {
//     color: "#FFF",
//   },
//   listContent: {
//     paddingHorizontal: 20,
//     paddingBottom: 20,
//   },
//   card: {
//     backgroundColor: "#FFF",
//     borderRadius: 16,
//     padding: 14,
//     marginBottom: 12,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   cardHeader: {
//     flexDirection: "row",
//     marginBottom: 12,
//   },
//   thumbnail: {
//     width: 80,
//     height: 80,
//     borderRadius: 12,
//     backgroundColor: "#E5E7EB",
//   },
//   cardInfo: {
//     flex: 1,
//     marginLeft: 12,
//     justifyContent: "center",
//   },
//   foodName: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#111827",
//     marginBottom: 6,
//   },
//   metaRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//     marginBottom: 4,
//   },
//   metaText: {
//     fontSize: 13,
//     color: "#6B7280",
//     flex: 1,
//   },
//   cardFooter: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingTop: 12,
//     borderTopWidth: 1,
//     borderTopColor: "#F3F4F6",
//   },
//   statusBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 12,
//     borderWidth: 1.5,
//     gap: 6,
//   },
//   statusText: {
//     fontSize: 13,
//     fontWeight: "700",
//   },
//   viewBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: "#F3E8FF",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   detailsBox: {
//     backgroundColor: "#F9FAFB",
//     borderRadius: 12,
//     padding: 12,
//     marginTop: 12,
//     marginBottom: 8,
//     borderLeftWidth: 3,
//     borderLeftColor: "#7C3AED",
//   },
//   detailsHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     marginBottom: 10,
//   },
//   detailsTitle: {
//     fontSize: 14,
//     fontWeight: "700",
//     color: "#111827",
//   },
//   detailRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     marginBottom: 6,
//   },
//   detailText: {
//     fontSize: 13,
//     color: "#6B7280",
//     flex: 1,
//   },
//   requestBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#7C3AED",
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     gap: 6,
//     shadowColor: "#7C3AED",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   requestBtnText: {
//     color: "#FFF",
//     fontSize: 13,
//     fontWeight: "700",
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 40,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#6B7280",
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: "#9CA3AF",
//     textAlign: "center",
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 40,
//   },
//   errorText: {
//     fontSize: 14,
//     color: "#DC2626",
//     textAlign: "center",
//     marginTop: 16,
//     marginBottom: 20,
//   },
//   retryBtn: {
//     backgroundColor: "#7C3AED",
//     paddingHorizontal: 32,
//     paddingVertical: 12,
//     borderRadius: 12,
//     shadowColor: "#7C3AED",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   retryText: {
//     color: "#fff",
//     fontSize: 14,
//     fontWeight: "700",
//   },
// });
