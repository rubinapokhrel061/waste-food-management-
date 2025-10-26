import { auth, db } from "@/configs/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface User {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  role?: string;
  online?: boolean;
  lastMessage?: string;
  lastMessageTime?: any;
  unreadCount?: number;
  lastMessageSenderId?: string;
  lastMessageRead?: boolean;
  lastMessageReadAt?: any;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  createdAt: any;
  participants: string[];
  read?: boolean;
  readAt?: any;
}

export default function ChatScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const router = useRouter();

  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  const currentUser = auth.currentUser;

  // 🔹 Fetch messages
  useEffect(() => {
    if (!currentUser) return;

    const messagesQuery = query(
      collection(db, "messages"),
      where("participants", "array-contains", currentUser.uid)
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
    });

    return () => unsubscribeMessages();
  }, [currentUser]);

  // 🔹 Fetch users function
  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData: User[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as any;
        if (currentUser && doc.id === currentUser.uid) return;

        usersData.push({
          id: doc.id,
          name: data.fullName || "Unnamed User",
          avatar: data.avatar || defaultAvatar,
          email: data.email || "",
          role: data.role || "User",
          online: false,
          lastMessage: "",
          unreadCount: 0,
        });
      });

      setUsers(usersData);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 🔹 Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  // 🔹 Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
  };

  // 🔹 Enrich users with last message + unread count
  const enrichedUsers = users.map((user) => {
    const userMessages = messages.filter(
      (msg) =>
        (msg.senderId === user.id && msg.receiverId === currentUser?.uid) ||
        (msg.senderId === currentUser?.uid && msg.receiverId === user.id)
    );

    userMessages.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });

    const lastMsg = userMessages[0];

    // Only count unread messages that are sent by the OTHER user (not current user)
    const unreadCount = userMessages.filter(
      (msg) =>
        msg.senderId === user.id &&
        msg.receiverId === currentUser?.uid &&
        !msg.read
    ).length;

    return {
      ...user,
      lastMessage:
        typeof lastMsg?.text === "string" ? lastMsg.text : user.email || "",
      lastMessageTime: lastMsg?.createdAt,
      lastMessageSenderId: lastMsg?.senderId,
      lastMessageRead: lastMsg?.read,
      lastMessageReadAt: lastMsg?.readAt,
      unreadCount,
    };
  });

  // 🔹 Sort by last message time
  const sortedUsers = [...enrichedUsers].sort((a, b) => {
    const timeA = a.lastMessageTime?.toMillis?.() || 0;
    const timeB = b.lastMessageTime?.toMillis?.() || 0;
    return timeB - timeA;
  });

  // 🔹 Search filter
  const searchFilteredUsers = sortedUsers.filter((u) => {
    const searchLower = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower) ||
      u.role?.toLowerCase().includes(searchLower)
    );
  });

  // 🔹 Role filter
  const filteredUsers = searchFilteredUsers.filter((u) => {
    if (selectedFilter === "all") return true;
    return u.role?.toLowerCase() === selectedFilter.toLowerCase();
  });

  // 🔹 Format timestamp
  const formatTime = (timestamp: any) => {
    if (!timestamp?.toDate) return "";
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const getRoleColor = (role: string) => {
    const colors: any = {
      admin: { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E" },
      ngo: { bg: "#DBEAFE", border: "#3B82F6", text: "#1E40AF" },
      donor: { bg: "#FCE7F3", border: "#EC4899", text: "#9F1239" },
    };
    return (
      colors[role] || { bg: "#F3F4F6", border: "#9CA3AF", text: "#374151" }
    );
  };

  const getRoleIcon = (role: string) => {
    const icons: any = {
      admin: "shield-checkmark",
      ngo: "people",
      donor: "heart",
    };
    return icons[role] || "person";
  };

  // 🔹 Render user card
  const renderUserItem = ({ item: user }: { item: User }) => {
    const isLastMessageFromCurrentUser =
      user.lastMessageSenderId === currentUser?.uid;
    const showSeenStatus = isLastMessageFromCurrentUser && user.lastMessageRead;
    const showUnreadBadge =
      !isLastMessageFromCurrentUser && user.unreadCount && user.unreadCount > 0;
    const roleColor = getRoleColor(user.role || "");

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() =>
          router.push({
            pathname: "/screen/ChatDetailScreen",
            params: { user: JSON.stringify(user) },
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: roleColor.bg, borderColor: roleColor.border },
            ]}
          >
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons
                name={getRoleIcon(user.role || "") as any}
                size={28}
                color={roleColor.border}
              />
            )}
          </View>

          {showUnreadBadge && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <View style={styles.nameRoleContainer}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name}
              </Text>
              {user?.role && (
                <View
                  style={[
                    styles.roleBadge,
                    {
                      backgroundColor: roleColor.bg,
                      borderColor: roleColor.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={getRoleIcon(user.role) as any}
                    size={10}
                    color={roleColor.text}
                  />
                  <Text style={[styles.roleText, { color: roleColor.text }]}>
                    {user.role.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.timeText}>
              {formatTime(user?.lastMessageTime)}
            </Text>
          </View>

          <View style={styles.messageRow}>
            <View style={styles.lastMessageContainer}>
              {isLastMessageFromCurrentUser && (
                <Ionicons
                  name={showSeenStatus ? "checkmark-done" : "checkmark"}
                  size={14}
                  color={showSeenStatus ? "#7C3AED" : "#9CA3AF"}
                  style={styles.checkIcon}
                />
              )}
              <Text
                style={[
                  styles.lastMessage,
                  showUnreadBadge ? styles.unreadMessage : undefined,
                ]}
                numberOfLines={1}
              >
                {typeof user?.lastMessage === "string" ? user?.lastMessage : ""}
              </Text>
            </View>

            {showUnreadBadge && user?.unreadCount ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {user.unreadCount > 99 ? "99+" : user.unreadCount}
                </Text>
              </View>
            ) : null}
          </View>

          {showSeenStatus && (
            <Text style={styles.seenText}>
              Seen {formatTime(user.lastMessageReadAt)}
            </Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loaderText}>Loading chats...</Text>
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
            <Ionicons name="chatbubbles" size={28} color="#7C3AED" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Messages</Text>
            <Text style={styles.headerSubtitle}>
              {filteredUsers.length} conversation
              {filteredUsers.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or role..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        {["all", "donor", "admin", "ngo"].map((role) => {
          const count =
            role === "all"
              ? filteredUsers.length
              : filteredUsers.filter((user) => user.role === role).length;

          return (
            <TouchableOpacity
              key={role}
              style={[
                styles.filterChip,
                selectedFilter === role && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(role)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === role && styles.filterChipTextActive,
                ]}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Chat list */}
      {filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrapper}>
            <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>
            {search ? "No results found" : "No conversations yet"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {search
              ? "Try searching with a different keyword"
              : "Start a new conversation to get started"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={Array.isArray(filteredUsers) ? filteredUsers : []}
          keyExtractor={(item, index) =>
            item?.id ? item.id.toString() : index.toString()
          }
          renderItem={({ item }) =>
            item && typeof item === "object" ? renderUserItem({ item }) : null
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#7C3AED"]}
              tintColor="#7C3AED"
              progressBackgroundColor="#FFF"
            />
          }
        />
      )}
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
  headerTitle: {
    fontFamily: "outfit-bold",
    fontSize: 24,
    color: "#111827",
  },
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 10,
    zIndex: 1,
    height: 45,
  },
  searchInput: {
    flex: 1,
    fontFamily: "outfit",
    fontSize: 15,
    color: "#111827",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
    zIndex: 1,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  filterChipActive: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  filterChipText: {
    fontFamily: "outfit",
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterChipTextActive: { color: "#FFF" },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  separator: { height: 12 },
  avatarContainer: { position: "relative", marginRight: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
  },
  unreadDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  userInfo: { flex: 1, marginRight: 12 },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  nameRoleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  userName: {
    fontFamily: "outfit-bold",
    fontSize: 17,
    color: "#111827",
    flexShrink: 1,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: 3,
  },
  roleText: {
    fontFamily: "outfit",
    fontSize: 9,
    fontWeight: "700",
  },
  timeText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 8,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lastMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  checkIcon: {
    marginRight: 4,
  },
  lastMessage: {
    fontFamily: "outfit",
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  unreadMessage: {
    color: "#111827",
    fontFamily: "outfit-bold",
    fontWeight: "700",
  },
  unreadBadge: {
    backgroundColor: "#7C3AED",
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    fontFamily: "outfit",
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },
  seenText: {
    fontFamily: "outfit",
    fontSize: 11,
    color: "#7C3AED",
    fontWeight: "600",
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: "outfit-bold",
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "outfit",
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
});
