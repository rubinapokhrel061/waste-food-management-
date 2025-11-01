import { db } from "@/configs/FirebaseConfig"; // ✅ adjust to your path
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

import { useUser } from "@/contexts/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { DonorTabParamList } from "../home";

type Props = BottomTabScreenProps<DonorTabParamList, "Dashboard">;

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

const DonorDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
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
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }
  console.log(user);
  const totalPosts = posts.length;
  const donatedCount = posts.filter((p) => p.status === "donated").length;
  const impactPercent =
    totalPosts === 0 ? 0 : Math.round((donatedCount / totalPosts) * 100);

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.fullName} 👋</Text>
          <Text style={styles.subtitle}>Make a difference today</Text>
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
            <Text style={styles.statNumber}>{totalPosts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{donatedCount}</Text>
            <Text style={styles.statLabel}>Donated</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{impactPercent}%</Text>
            <Text style={styles.statLabel}>Impact</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={[styles.actionCard, styles.primaryCard]}
            onPress={() => navigation.navigate("Post")}
            activeOpacity={0.9}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>➕</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Post Food</Text>
              <Text style={styles.actionSubtitle}>Share surplus food</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Foods")}
            activeOpacity={0.9}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>📋</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>See All Foods</Text>
              <Text style={styles.actionSubtitle}>Manage your listings</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Other Actions */}
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
                  color="#7C3AED"
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
                <Ionicons name="person-outline" size={32} color="#7C3AED" />
              </View>
              <Text style={styles.gridLabel}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Impact Banner */}
        <View style={styles.impactBanner}>
          <Text style={styles.impactEmoji}>🌱</Text>
          <View style={styles.impactContent}>
            <Text style={styles.impactTitle}>Your Impact</Text>
            <Text style={styles.impactText}>
              {donatedCount > 0
                ? `You’ve successfully donated ${donatedCount} food items, preventing waste and feeding people!`
                : "Start donating to make a bigger impact!"}
            </Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

export default DonorDashboardScreen;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#7C3AED",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 6,
  },
  greeting: {
    fontSize: 18,
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
    padding: 12,
    alignItems: "center",
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#7C3AED",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  section: {
    marginBottom: 12,
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
    elevation: 2,
  },
  primaryCard: {
    backgroundColor: "#a070f1ff",
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
  },
  gridCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
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
    backgroundColor: "#DBEAFE",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#93C5FD",
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
    color: "#1E40AF",
    marginBottom: 4,
  },
  impactText: {
    fontSize: 13,
    color: "#3B82F6",
    lineHeight: 18,
  },
});
