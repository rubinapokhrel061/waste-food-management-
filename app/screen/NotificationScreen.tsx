import { db } from "@/configs/FirebaseConfig";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "foods"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications: any[] = [];

      snapshot.docs.forEach((doc) => {
        const data: any = { id: doc.id, ...doc.data() };

        // Add notification for new food item
        newNotifications.push({
          id: `${doc.id}-created`,
          type: "created",
          foodData: data,
          timestamp: data.createdAt,
        });

        // Add notification for status change if not pending
        if (data.status && data.status !== "pending") {
          newNotifications.push({
            id: `${doc.id}-status`,
            type: "status",
            foodData: data,
            timestamp: data.statusChangedAt || data.createdAt,
          });
        }
      });

      // Sort by timestamp
      newNotifications.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(0);
        const timeB = b.timestamp?.toDate?.() || new Date(0);
        return timeB - timeA;
      });

      setNotifications(newNotifications);
    });
    return () => unsubscribe();
  }, []);

  const getNotificationText = (item: any) => {
    if (item.type === "created") {
      return {
        title: "New Food Available",
        message: `${item.foodData.foodName} has been added`,
        icon: "🆕",
      };
    } else {
      return {
        title: "Status Update",
        message: `${item.foodData.foodName} is now ${item.foodData.status}`,
        icon: item.foodData.status === "approved" ? "✅" : "❌",
      };
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp?.toDate) return "";

    const date = timestamp.toDate();
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
    if (!useTime?.toDate) return "";
    return useTime.toDate().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{notifications.length}</Text>
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const notifInfo = getNotificationText(item);
          return (
            <TouchableOpacity
              style={styles.notificationCard}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{notifInfo.icon}</Text>
              </View>

              <View style={styles.contentContainer}>
                <Text style={styles.notifTitle}>{notifInfo.title}</Text>
                <Text style={styles.foodName}>{item.foodData.foodName}</Text>

                <View style={styles.detailsRow}>
                  <Text style={styles.quantity}>
                    Qty: {item.foodData.quantity}
                  </Text>
                  {item.foodData.useTime && (
                    <Text style={styles.useTime}>
                      📅 {formatUseTime(item.foodData.useTime)}
                    </Text>
                  )}
                </View>

                {item.foodData.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {item.foodData.description}
                  </Text>
                )}

                <Text style={styles.timestamp}>
                  {formatTime(item.timestamp)}
                </Text>
              </View>

              {item.foodData.imageUrl && (
                <Image
                  source={{ uri: item.foodData.imageUrl }}
                  style={styles.foodImage}
                />
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7FC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E9E7F5",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#7C3AED",
  },
  badge: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  listContent: {
    padding: 12,
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: "#7C3AED",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3EFFD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  notifTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7C3AED",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F1F1F",
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    flexWrap: "wrap",
  },
  quantity: {
    fontSize: 13,
    color: "#7C3AED",
    fontWeight: "500",
    marginRight: 12,
  },
  useTime: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
  },
  description: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  foodImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: "#9CA3AF",
  },
});
