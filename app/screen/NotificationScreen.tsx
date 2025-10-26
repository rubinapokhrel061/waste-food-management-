import { db } from "@/configs/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function NotificationScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "foods"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newNotifications: any[] = [];

        snapshot.docs.forEach((doc) => {
          const data: any = { id: doc.id, ...doc.data() };

          newNotifications.push({
            id: `${doc.id}-created`,
            type: "created",
            foodData: data,
            timestamp: data.createdAt,
          });

          if (data.status && data.status !== "pending") {
            newNotifications.push({
              id: `${doc.id}-status`,
              type: "status",
              foodData: data,
              timestamp: data.statusChangedAt || data.createdAt,
            });
          }
        });
        newNotifications.sort((a, b) => {
          const timeA = a.timestamp?.toDate?.() || new Date(0);
          const timeB = b.timestamp?.toDate?.() || new Date(0);
          return timeB - timeA;
        });
        setNotifications(newNotifications);
        setRefreshing(false);
      },
      (error) => {
        console.error("❌ Firebase error:", error);
        setRefreshing(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getNotificationText = (item: any) => {
    if (item.type === "created") {
      return {
        title: "New Food Available",
        message: `${item.foodData.foodName} has been added`,
        icon: "notifications-outline",
        bgColor: "#DBEAFE",
        accentColor: "#3B82F6",
        isIonicon: true,
      };
    } else {
      const statusConfig: any = {
        accepted: { icon: "✅", bgColor: "#D1FAE5", accentColor: "#10B981" },
        pickup: { icon: "🚗", bgColor: "#E0E7FF", accentColor: "#6366F1" },
        donated: { icon: "🎉", bgColor: "#FCE7F3", accentColor: "#EC4899" },
        rejected: { icon: "❌", bgColor: "#FEE2E2", accentColor: "#EF4444" },
      };

      const config = statusConfig[item.foodData.status] || {
        icon: "📦",
        bgColor: "#F3F4F6",
        accentColor: "#6B7280",
      };
      return {
        title: "Status Update",
        message: `${item.foodData.foodName} is now ${item.foodData.status}`,
        ...config,
      };
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";

    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      return "";
    }

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  const formatUseTime = (useTime: any) => {
    if (!useTime) return "";

    // Handle Firestore timestamp object
    let date;
    if (useTime.toDate) {
      date = useTime.toDate();
    } else if (useTime.seconds) {
      date = new Date(useTime.seconds * 1000);
    } else {
      return "";
    }

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Gradient Background */}
      <View style={styles.gradientBg}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </View>

      {/* Enhanced Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerIconWrapper}>
            <Ionicons name="notifications" size={24} color="#7C3AED" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>Stay updated</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notifications.length}</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <Ionicons
              name="refresh"
              size={20}
              color="#7C3AED"
              style={refreshing && styles.rotating}
            />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={notifications}
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
        renderItem={({ item }) => {
          const notifInfo = getNotificationText(item);
          return (
            <TouchableOpacity
              style={styles.notificationCard}
              activeOpacity={0.9}
            >
              {/* Left Accent Bar */}
              <View
                style={[
                  styles.accentBar,
                  { backgroundColor: notifInfo.accentColor },
                ]}
              />

              {/* Icon */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: notifInfo.bgColor },
                ]}
              >
                {notifInfo.isIonicon ? (
                  <Ionicons
                    name={notifInfo.icon}
                    size={20}
                    color={notifInfo.accentColor}
                  />
                ) : (
                  <Text style={styles.icon}>{notifInfo.icon}</Text>
                )}
              </View>

              {/* Content */}
              <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                  <Text style={styles.foodName} numberOfLines={1}>
                    {item.foodData.foodName}
                  </Text>
                  <Text style={styles.timestamp}>
                    {formatTime(item.timestamp)}
                  </Text>
                </View>

                <Text
                  style={[styles.notifTitle, { color: notifInfo.accentColor }]}
                >
                  {notifInfo.title}
                </Text>

                <View style={styles.detailsRow}>
                  <View style={styles.detailChip}>
                    <Ionicons name="cube" size={10} color="#7C3AED" />
                    <Text style={styles.detailText}>
                      {item.foodData.quantity}
                    </Text>
                  </View>
                  {item.foodData.useTime && (
                    <View style={styles.detailChip}>
                      <Ionicons name="time" size={10} color="#059669" />
                      <Text style={styles.detailText}>
                        {formatUseTime(item.foodData.useTime)}
                      </Text>
                    </View>
                  )}
                  {item.foodData.status &&
                    item.foodData.status !== "pending" && (
                      <View
                        style={[
                          styles.statusChip,
                          { backgroundColor: notifInfo.bgColor },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: notifInfo.accentColor },
                          ]}
                        >
                          {item.foodData.status}
                        </Text>
                      </View>
                    )}
                </View>
              </View>

              {/* Thumbnail */}
              {item.foodData.imageUrl && (
                <Image
                  source={{ uri: item.foodData.imageUrl }}
                  style={styles.thumbnail}
                />
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons
                name="notifications-off-outline"
                size={64}
                color="#D1D5DB"
              />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>
              You'll see updates about food donations here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  gradientBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    overflow: "hidden",
  },
  circle1: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#F3E8FF",
    top: -100,
    right: -50,
    opacity: 0.6,
  },
  circle2: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#DBEAFE",
    top: 50,
    left: -40,
    opacity: 0.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 40,
    paddingBottom: 16,
    backgroundColor: "transparent",
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    gap: 10,
  },
  headerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    backgroundColor: "#7C3AED",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 32,
    alignItems: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  rotating: {
    transform: [{ rotate: "360deg" }],
  },
  listContent: {
    padding: 12,
    paddingTop: 4,
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginLeft: 2,
  },
  icon: {
    fontSize: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  foodName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  timestamp: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "500",
    marginLeft: 8,
  },
  notifTitle: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  detailChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  detailText: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
  },
  statusChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 3,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
});
