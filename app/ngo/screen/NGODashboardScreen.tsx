import { db } from "@/configs/FirebaseConfig";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type NGOTabParamList = {
  Dashboard: undefined;
  Nearby: undefined;
  Pickup: undefined;
  Track: undefined;
  Chat: undefined;
  Profile: undefined;
};

type Props = BottomTabScreenProps<NGOTabParamList, "Dashboard">;

interface Post {
  id: string;
  foodName: string;
  useTime: string;
  quantity: string;
  imageUrl: string;
  status: string;
  createdAt: any;
  description: string;
  ngoDetails?: any;
  pickupDetails?: any;
  donatedDetails?: any;
}

const NGODashboardScreen: React.FC<Props> = ({ navigation }) => {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
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
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <View
        style={[
          styles.wrapper,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#9333EA" />
      </View>
    );
  }

  // Calculate dynamic stats
  const availablePosts = posts.filter((p) => p.status === "pending").length;
  const pickedUpCount = posts.filter((p) => p.status === "picked").length;
  const completedCount = posts.filter((p) => p.status === "donated").length;
  const totalReceived = pickedUpCount + completedCount;

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor="#9333EA" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome, NGO 🤝</Text>
          <Text style={styles.subtitle}>Help reduce food waste</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push("/screen/NotificationScreen")}
        >
          <Text style={styles.notificationIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View
              style={[styles.statIconWrapper, { backgroundColor: "#F3E8FF" }]}
            >
              <Ionicons name="fast-food" size={24} color="#9333EA" />
            </View>
            <Text style={styles.statNumber}>{availablePosts}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statCard}>
            <View
              style={[styles.statIconWrapper, { backgroundColor: "#FCE7F3" }]}
            >
              <MaterialIcons name="delivery-dining" size={24} color="#EC4899" />
            </View>
            <Text style={styles.statNumber}>{pickedUpCount}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <View
              style={[styles.statIconWrapper, { backgroundColor: "#D1FAE5" }]}
            >
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            </View>
            <Text style={styles.statNumber}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={[styles.actionCard, styles.primaryCard]}
            onPress={() => navigation.navigate("Nearby")}
            activeOpacity={0.9}
          >
            <View style={styles.actionIconContainer}>
              <MaterialIcons name="map" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: "#FFFFFF" }]}>
                Browse Nearby Food
              </Text>
              <Text style={[styles.actionSubtitle, { color: "#FFFFFF" }]}>
                Find available donations
              </Text>
            </View>
            <Text style={[styles.actionArrow, { color: "#FFFFFF" }]}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Pickup")}
            activeOpacity={0.9}
          >
            <View style={styles.actionIconContainer}>
              <MaterialIcons name="delivery-dining" size={28} color="#9333EA" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Assign Pickup</Text>
              <Text style={styles.actionSubtitle}>
                Manage pickup volunteers
              </Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Track")}
            activeOpacity={0.9}
          >
            <View style={styles.actionIconContainer}>
              <MaterialIcons name="navigation" size={28} color="#9333EA" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Track Pickups</Text>
              <Text style={styles.actionSubtitle}>
                Monitor active collections
              </Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>

          <View style={styles.gridRow}>
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate("Chat")}
              activeOpacity={0.9}
            >
              <View style={styles.gridIconContainer}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={32}
                  color="#9333EA"
                />
              </View>
              <Text style={styles.gridLabel}>Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate("Profile")}
              activeOpacity={0.9}
            >
              <View style={styles.gridIconContainer}>
                <MaterialIcons
                  name="person-outline"
                  size={32}
                  color="#9333EA"
                />
              </View>
              <Text style={styles.gridLabel}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Impact Banner */}
        <View style={styles.impactBanner}>
          <Text style={styles.impactEmoji}>💜</Text>
          <View style={styles.impactContent}>
            <Text style={styles.impactTitle}>Your Impact</Text>
            <Text style={styles.impactText}>
              {totalReceived > 0
                ? `You've collected ${totalReceived} food donations, helping feed communities and reduce waste!`
                : "Start collecting donations to make a difference!"}
            </Text>
          </View>
        </View>

        {/* Recent Activity Alert */}
        {availablePosts > 0 && (
          <View style={styles.alertBanner}>
            <MaterialIcons
              name="notifications-active"
              size={24}
              color="#F59E0B"
            />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>New Donations Available!</Text>
              <Text style={styles.alertText}>
                {availablePosts} food {availablePosts === 1 ? "item" : "items"}{" "}
                waiting for pickup
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

export default NGODashboardScreen;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#9333EA",
    paddingTop: Platform.OS === "ios" ? 50 : 35,
    paddingBottom: 20,
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
  greeting: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationIcon: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
    paddingLeft: 4,
  },
  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryCard: {
    backgroundColor: "#9333EA",
    elevation: 5,
    shadowColor: "#9333EA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: "#64748B",
    opacity: 0.8,
  },
  actionArrow: {
    fontSize: 20,
    color: "#64748B",
    opacity: 0.7,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gridIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  impactBanner: {
    backgroundColor: "#F3E8FF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#C084FC",
    marginBottom: 12,
    elevation: 2,
  },
  impactEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  impactContent: {
    flex: 1,
  },
  impactTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#7C3AED",
    marginBottom: 4,
  },
  impactText: {
    fontSize: 13,
    color: "#9333EA",
    lineHeight: 18,
  },
  alertBanner: {
    backgroundColor: "#FEF3C7",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FCD34D",
    elevation: 2,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 2,
  },
  alertText: {
    fontSize: 13,
    color: "#B45309",
  },
});
