import { db } from "@/configs/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  location?: { address: string; latitude: number; longitude: number };
  createdAt: any;
}

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

interface StatCard {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: string;
  color: string;
  bgColor: string;
}

export default function ReportScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  const periods = ["all", "week", "month", "year"];

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

  // Calculate statistics
  const totalUsers = users.length;
  const donorCount = users.filter((u) => u.role === "donor").length;
  const ngoCount = users.filter((u) => u.role === "ngo").length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  const totalPosts = posts.length;
  const pendingPosts = posts.filter((p) => p.status === "pending").length;
  const acceptedPosts = posts.filter((p) => p.status === "accepted").length;
  const pickupPosts = posts.filter((p) => p.status === "pickup").length;
  const donatedPosts = posts.filter((p) => p.status === "donated").length;

  const stats: StatCard[] = [
    {
      title: "Total Foods",
      value: totalPosts.toString(),
      change: `${donatedPosts} completed`,
      isPositive: true,
      icon: "fast-food",
      color: "#7C3AED",
      bgColor: "#F3E8FF",
    },
    {
      title: "Total Users",
      value: totalUsers.toString(),
      change: `${donorCount} donors`,
      isPositive: true,
      icon: "people",
      color: "#3B82F6",
      bgColor: "#DBEAFE",
    },
    {
      title: "Donations",
      value: donatedPosts.toString(),
      change: `${Math.round((donatedPosts / totalPosts) * 100 || 0)}% success`,
      isPositive: true,
      icon: "heart",
      color: "#EC4899",
      bgColor: "#FCE7F3",
    },
    {
      title: "NGO Partners",
      value: ngoCount.toString(),
      change: `${pendingPosts} pending`,
      isPositive: pendingPosts > 0,
      icon: "business",
      color: "#F59E0B",
      bgColor: "#FEF3C7",
    },
  ];

  // Get last 7 days of food posts
  const getLast7DaysData = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];

      const count = posts.filter((post) => {
        if (!post.createdAt?.toDate) return false;
        const postDate = post.createdAt.toDate();
        return (
          postDate.getDate() === date.getDate() &&
          postDate.getMonth() === date.getMonth() &&
          postDate.getFullYear() === date.getFullYear()
        );
      }).length;

      last7Days.push({ label: dayName, value: count });
    }

    return last7Days;
  };

  const weekData = getLast7DaysData();

  // User role distribution
  const userRoleData = [
    {
      label: "Donors",
      value: donorCount,
      percentage: Math.round((donorCount / totalUsers) * 100) || 0,
      color: "#EC4899",
    },
    {
      label: "NGOs",
      value: ngoCount,
      percentage: Math.round((ngoCount / totalUsers) * 100) || 0,
      color: "#3B82F6",
    },
    {
      label: "Admins",
      value: adminCount,
      percentage: Math.round((adminCount / totalUsers) * 100) || 0,
      color: "#F59E0B",
    },
  ];

  // Food status distribution
  const statusData = [
    { label: "Pending", value: pendingPosts, color: "#F59E0B" },
    { label: "Accepted", value: acceptedPosts, color: "#3B82F6" },
    { label: "Pickup", value: pickupPosts, color: "#8B5CF6" },
    { label: "Donated", value: donatedPosts, color: "#10B981" },
  ];

  const renderBarChart = () => {
    const maxValue = Math.max(...weekData.map((d) => d.value), 1);

    return (
      <View style={styles.barChartContainer}>
        <Text style={styles.chartTitle}>Food Posts (Last 7 Days)</Text>
        <View style={styles.barChart}>
          {weekData.map((item, index) => {
            const heightPercentage = (item.value / maxValue) * 100;
            return (
              <View key={index} style={styles.barWrapper}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${heightPercentage}%`,
                        backgroundColor: "#7C3AED",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barValue}>{item.value}</Text>
                <Text style={styles.barLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderPieChart = () => {
    return (
      <View style={styles.pieChartContainer}>
        <Text style={styles.chartTitle}>User Distribution</Text>
        <View style={styles.pieChartWrapper}>
          <View style={styles.pieChartSimple}>
            {userRoleData.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.pieBar,
                  {
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.pieLegend}>
            {userRoleData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: item.color }]}
                />
                <Text style={styles.legendLabel}>{item.label}</Text>
                <Text style={styles.legendValue}>
                  {item.value} ({item.percentage}%)
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderStatusChart = () => {
    const maxValue = Math.max(...statusData.map((d) => d.value), 1);

    return (
      <View style={styles.statusChartContainer}>
        <Text style={styles.chartTitle}>Food Status Distribution</Text>
        <View style={styles.statusBars}>
          {statusData.map((item, index) => {
            const widthPercentage = (item.value / maxValue) * 100;
            return (
              <View key={index} style={styles.statusRow}>
                <Text style={styles.statusLabel}>{item.label}</Text>
                <View style={styles.statusBarContainer}>
                  <View
                    style={[
                      styles.statusBar,
                      {
                        width: `${widthPercentage}%`,
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.statusValue}>{item.value}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Get recent activities
  const getRecentActivities = () => {
    const recentPosts = [...posts].slice(0, 5);
    return recentPosts.map((post) => {
      let icon = "add-circle";
      let color = "#7C3AED";
      let title = `New food: ${post.foodName}`;

      if (post.status === "donated") {
        icon = "checkmark-circle";
        color = "#10B981";
        title = `Donated: ${post.foodName}`;
      } else if (post.status === "pickup") {
        icon = "car";
        color = "#8B5CF6";
        title = `Pickup: ${post.foodName}`;
      } else if (post.status === "accepted") {
        icon = "checkmark";
        color = "#3B82F6";
        title = `Accepted: ${post.foodName}`;
      }

      const timeAgo = post.createdAt?.toDate
        ? getTimeAgo(post.createdAt.toDate())
        : "Recently";

      return { icon, color, title, time: timeAgo, quantity: post.quantity };
    });
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loaderText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Gradient Background */}
      <View style={styles.bg}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.iconWrapper}>
            <Ionicons name="bar-chart" size={28} color="#7C3AED" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Reports</Text>
            <Text style={styles.headerSubtitle}>Analytics & Insights</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#7C3AED"]}
            tintColor="#7C3AED"
          />
        }
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View
                style={[styles.statIcon, { backgroundColor: stat.bgColor }]}
              >
                <Ionicons
                  name={stat.icon as any}
                  size={24}
                  color={stat.color}
                />
              </View>
              <Text style={styles.statTitle}>{stat.title}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <View style={styles.statChange}>
                <Ionicons
                  name={stat.isPositive ? "trending-up" : "trending-down"}
                  size={14}
                  color={stat.isPositive ? "#10B981" : "#EF4444"}
                />
                <Text
                  style={[
                    styles.statChangeText,
                    { color: stat.isPositive ? "#10B981" : "#6B7280" },
                  ]}
                >
                  {stat.change}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bar Chart Card */}
        <View style={styles.chartCard}>{renderBarChart()}</View>

        {/* User Distribution Chart */}
        <View style={styles.chartCard}>{renderPieChart()}</View>

        {/* Status Distribution Chart */}
        <View style={styles.chartCard}>{renderStatusChart()}</View>

        {/* Recent Activity */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Recent Activity</Text>
            <Ionicons name="time-outline" size={20} color="#7C3AED" />
          </View>

          {getRecentActivities().map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <View
                style={[
                  styles.activityDot,
                  { backgroundColor: activity.color },
                ]}
              />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
              <Text style={styles.activityValue}>Qty: {activity.quantity}</Text>
            </View>
          ))}

          {posts.length === 0 && (
            <View style={styles.emptyActivity}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color="#D1D5DB"
              />
              <Text style={styles.emptyText}>No activity yet</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  bg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
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
    top: 120,
    right: 50,
    opacity: 0.4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loaderText: {
    marginTop: 16,
    fontFamily: "outfit",
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 16,
    zIndex: 1,
  },
  headerContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: { fontFamily: "outfit-bold", fontSize: 24, color: "#111827" },
  headerSubtitle: {
    fontFamily: "outfit",
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
  scrollView: { flex: 1 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 10,
  },
  statCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    width: (width - 52) / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statTitle: {
    fontFamily: "outfit",
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 6,
  },
  statValue: {
    fontFamily: "outfit-bold",
    fontSize: 24,
    color: "#111827",
    marginBottom: 8,
  },
  statChange: { flexDirection: "row", alignItems: "center", gap: 4 },
  statChangeText: { fontFamily: "outfit", fontSize: 12, fontWeight: "600" },
  chartCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  chartTitle: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: "#111827",
    marginBottom: 20,
  },
  barChartContainer: {},
  barChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 200,
    paddingTop: 20,
  },
  barWrapper: { flex: 1, alignItems: "center", gap: 6 },
  barContainer: {
    width: "80%",
    height: 140,
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    minHeight: 10,
  },
  barValue: { fontFamily: "outfit-bold", fontSize: 11, color: "#111827" },
  barLabel: { fontFamily: "outfit", fontSize: 10, color: "#6B7280" },
  pieChartContainer: {},
  pieChartWrapper: { gap: 20 },
  pieChartSimple: {
    width: "100%",
    height: 40,
    borderRadius: 20,
    flexDirection: "row",
    overflow: "hidden",
  },
  pieBar: { height: "100%" },
  pieLegend: { width: "100%", gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  legendColor: { width: 16, height: 16, borderRadius: 4 },
  legendLabel: {
    flex: 1,
    fontFamily: "outfit",
    fontSize: 14,
    color: "#111827",
  },
  legendValue: { fontFamily: "outfit-bold", fontSize: 14, color: "#6B7280" },
  statusChartContainer: {},
  statusBars: { gap: 16 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusLabel: {
    fontFamily: "outfit",
    fontSize: 14,
    color: "#111827",
    width: 70,
  },
  statusBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    overflow: "hidden",
  },
  statusBar: {
    height: "100%",
    borderRadius: 12,
    minWidth: 20,
  },
  statusValue: {
    fontFamily: "outfit-bold",
    fontSize: 14,
    color: "#111827",
    width: 40,
    textAlign: "right",
  },
  summaryCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  summaryTitle: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: "#111827",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  activityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  activityContent: { flex: 1 },
  activityTitle: {
    fontFamily: "outfit",
    fontSize: 14,
    color: "#111827",
    marginBottom: 2,
  },
  activityTime: { fontFamily: "outfit", fontSize: 12, color: "#9CA3AF" },
  activityValue: { fontFamily: "outfit-bold", fontSize: 12, color: "#6B7280" },
  emptyActivity: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: "outfit",
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 12,
  },
});
