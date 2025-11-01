import { db } from "@/configs/FirebaseConfig";
import { useUser } from "@/contexts/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AdminTabParamList } from "../dashboard";

type Props = BottomTabScreenProps<AdminTabParamList, "Dashboard">;

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: any;
}

interface Post {
  id: string;
  foodName: string;
  status: "pending" | "accepted" | "pickup" | "donated";
  createdAt?: any;
}

const AdminDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const router = useRouter();
  const { user } = useUser();
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchUsers(), fetchPosts()]);
  };

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData: User[] = [];
      querySnapshot.forEach((doc) =>
        usersData.push({ id: doc.id, ...doc.data() } as User)
      );
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

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
          status: data.status || "pending",
          createdAt: data.createdAt,
        });
      });

      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Failed to load posts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const donorCount = users.filter((u) => u.role === "donor").length;
  const ngoCount = users.filter((u) => u.role === "ngo").length;
  const totalPosts = posts.length;
  const donatedPosts = posts.filter((p) => p.status === "donated").length;

  const getThisMonthCount = () => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    return posts.filter((post) => {
      if (!post.createdAt?.toDate) return false;
      const postDate = post.createdAt.toDate();
      return (
        postDate.getMonth() === thisMonth && postDate.getFullYear() === thisYear
      );
    }).length;
  };

  const thisMonthPosts = getThisMonthCount();
  const thisMonthDonations = posts.filter((post) => {
    if (!post.createdAt?.toDate || post.status !== "donated") return false;
    const postDate = post.createdAt.toDate();
    const now = new Date();
    return (
      postDate.getMonth() === now.getMonth() &&
      postDate.getFullYear() === now.getFullYear()
    );
  }).length;

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#9333EA" />
        <Text style={styles.loaderText}>Loading dashboard...</Text>
      </View>
    );
  }
  console.log("user", user);
  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor="#9333EA" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.fullName} 👋</Text>
          <Text style={styles.subtitle}>Overview of system stats</Text>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#9333EA"]}
            tintColor="#9333EA"
          />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{donorCount}</Text>
            <Text style={styles.statLabel}>Donors</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{ngoCount}</Text>
            <Text style={styles.statLabel}>NGOs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalPosts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={[styles.actionCard, styles.primaryCard]}
            // onPress={() => navigation.navigate("ManageUsers")}
            activeOpacity={0.9}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>👥</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Users</Text>
              <Text style={styles.actionSubtitle}>
                {donorCount} Donors & {ngoCount} NGOs
              </Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Donations")}
            activeOpacity={0.9}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>📋</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Posts</Text>
              <Text style={styles.actionSubtitle}>
                {totalPosts} total submissions
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
              onPress={() => navigation.navigate("Reports")}
              activeOpacity={0.9}
            >
              <View style={styles.gridIconContainer}>
                <Ionicons name="bar-chart-outline" size={32} color="#7C3AED" />
              </View>
              <Text style={styles.gridLabel}>Reports</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate("Profile")}
              activeOpacity={0.9}
            >
              <View style={styles.gridIconContainer}>
                <Ionicons name="settings-outline" size={32} color="#7C3AED" />
              </View>
              <Text style={styles.gridLabel}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate("Chat")}
              activeOpacity={0.9}
            >
              <View style={styles.gridIconContainer}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={32}
                  color="#7C3AED"
                />
              </View>
              <Text style={styles.gridLabel}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* System Impact */}
        <View style={styles.impactBanner}>
          <Text style={styles.impactEmoji}>🌟</Text>
          <View style={styles.impactContent}>
            <Text style={styles.impactTitle}>System Impact</Text>
            <Text style={styles.impactText}>
              {thisMonthPosts} posts shared, {thisMonthDonations} donations
              completed this month!
            </Text>
          </View>
        </View>

        {/* Additional Stats */}
        <View style={styles.additionalStats}>
          <View style={styles.additionalStatCard}>
            <Text style={styles.additionalStatNumber}>{donatedPosts}</Text>
            <Text style={styles.additionalStatLabel}>Total Donations</Text>
            <Text style={styles.additionalStatSubtext}>
              {Math.round((donatedPosts / totalPosts) * 100 || 0)}% success rate
            </Text>
          </View>

          <View style={styles.additionalStatCard}>
            <Text style={styles.additionalStatNumber}>{users.length}</Text>
            <Text style={styles.additionalStatLabel}>Total Users</Text>
            <Text style={styles.additionalStatSubtext}>
              Active community members
            </Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

export default AdminDashboardScreen;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  header: {
    backgroundColor: "#9333EA",
    paddingTop: Platform.OS === "ios" ? 50 : 35,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#9333EA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  greeting: {
    fontSize: 22,
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
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#9333EA",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
    paddingLeft: 4,
  },
  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryCard: {
    backgroundColor: "#c79bf1ff",
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
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    opacity: 0.8,
  },
  actionArrow: {
    fontSize: 20,
    opacity: 0.7,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  gridCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gridIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  gridIcon: {
    fontSize: 28,
  },
  gridLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  impactBanner: {
    backgroundColor: "#E0E7FF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#A5B4FC",
    marginBottom: 16,
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
    color: "#4338CA",
    marginBottom: 4,
  },
  impactText: {
    fontSize: 13,
    color: "#4F46E5",
    lineHeight: 18,
  },
  additionalStats: {
    flexDirection: "row",
    gap: 12,
  },
  additionalStatCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  additionalStatNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: "#9333EA",
    marginBottom: 6,
  },
  additionalStatLabel: {
    fontSize: 13,
    color: "#1E293B",
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  additionalStatSubtext: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
  },
});
