import { db } from "@/configs/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  location?: { address: string; latitude: number; longitude: number };
  createdAt: any;
}

const roles = ["admin", "ngo", "donor"];

export default function ManageUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [filterRole, setFilterRole] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState("");

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) setCurrentUserId(JSON.parse(userData).id);
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData: User[] = [];
      querySnapshot.forEach((doc) =>
        usersData.push({ id: doc.id, ...doc.data() } as User)
      );
      setUsers(usersData);
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to load users" });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = (role: string) => {
    if (!selectedUser) return;
    if (selectedUser.id === currentUserId) {
      Alert.alert(
        "Cannot Change Own Role",
        "Ask another admin to change your role."
      );
      return;
    }
    if (selectedUser.role === role) {
      setModalVisible(false);
      return;
    }
    setPendingRole(role);
    setConfirmModalVisible(true);
  };

  const updateUserRole = async () => {
    if (!selectedUser || !pendingRole) return;
    try {
      await updateDoc(doc(db, "users", selectedUser.id), { role: pendingRole });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, role: pendingRole } : u
        )
      );
      Toast.show({
        type: "success",
        text1: "Role Updated",
        text2: `Changed to ${pendingRole}`,
      });
      if (selectedUser.id === currentUserId) navigateByRole(pendingRole);
      setConfirmModalVisible(false);
      setModalVisible(false);
      setSelectedUser(null);
      setPendingRole("");
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to update role" });
    }
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    if (selectedUser.id === currentUserId) {
      Alert.alert("Cannot Delete Own Account", "You cannot delete yourself.");
      return;
    }
    setModalVisible(false);
    setTimeout(() => setDeleteModalVisible(true), 300);
  };

  const deleteUser = async () => {
    if (!selectedUser) return;
    try {
      await deleteDoc(doc(db, "users", selectedUser.id));
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      Toast.show({
        type: "success",
        text1: "User Deleted",
        text2: `${selectedUser.fullName} removed`,
      });
      setDeleteModalVisible(false);
      setSelectedUser(null);
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to delete user" });
    }
  };

  const navigateByRole = (role: string) => {
    const routes: any = {
      admin: "/(tabs)/admin",
      ngo: "/(tabs)/ngo",
      donor: "/(tabs)/donor",
    };
    router.replace(routes[role] || routes.donor);
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

  const filteredUsers = users.filter((u) => {
    const matchesRole = filterRole === "all" || u.role === filterRole;
    const matchesSearch =
      !searchQuery ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const UserCard = ({ item }: { item: User }) => {
    const roleColor = getRoleColor(item.role);
    const isCurrentUser = item.id === currentUserId;

    return (
      <TouchableOpacity
        style={[s.card, isCurrentUser && s.currentCard]}
        onPress={() => {
          setSelectedUser(item);
          setModalVisible(true);
        }}
      >
        {isCurrentUser && (
          <View style={s.youBadge}>
            <Ionicons name="person" size={10} color="#FFF" />
            <Text style={s.youText}>You</Text>
          </View>
        )}
        <View style={s.cardHeader}>
          <View
            style={[
              s.avatar,
              { backgroundColor: roleColor.bg, borderColor: roleColor.border },
            ]}
          >
            <Ionicons
              name={getRoleIcon(item.role) as any}
              size={28}
              color={roleColor.border}
            />
          </View>
          <View style={s.userInfo}>
            <Text style={s.userName}>{item.fullName}</Text>
            <Text style={s.userEmail}>{item.email}</Text>
            {item.location?.address && (
              <View style={s.locationRow}>
                <Ionicons name="location-outline" size={12} color="#6B7280" />
                <Text style={s.locationText} numberOfLines={1}>
                  {item.location.address}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={s.cardFooter}>
          <View
            style={[
              s.roleBadge,
              { backgroundColor: roleColor.bg, borderColor: roleColor.border },
            ]}
          >
            <Ionicons
              name={getRoleIcon(item.role) as any}
              size={14}
              color={roleColor.text}
            />
            <Text style={[s.roleText, { color: roleColor.text }]}>
              {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
            </Text>
          </View>
          <View style={s.actions}>
            <TouchableOpacity
              style={s.editBtn}
              onPress={() => {
                setSelectedUser(item);
                setModalVisible(true);
              }}
            >
              <Ionicons name="create-outline" size={18} color="#7C3AED" />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.delBtn}
              onPress={() => {
                setSelectedUser(item);
                handleDeleteUser();
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={s.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.bg}>
        <View style={s.circle1} />
        <View style={s.circle2} />
        <View style={s.circle3} />
      </View>

      <View style={s.header}>
        <View style={s.headerContent}>
          <View style={s.iconWrapper}>
            <Ionicons name="people" size={28} color="#7C3AED" />
          </View>
          <View>
            <Text style={s.title}>Manage Users</Text>
            <Text style={s.subtitle}>
              {filteredUsers.length}{" "}
              {filteredUsers.length === 1 ? "user" : "users"}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={fetchUsers}>
          <Ionicons name="refresh" size={20} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <View style={s.search}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={s.searchInput}
          placeholder="Search by name or email..."
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

      <View style={s.filters}>
        <TouchableOpacity
          style={[s.filter, filterRole === "all" && s.filterActive]}
          onPress={() => setFilterRole("all")}
        >
          <Text
            style={[s.filterText, filterRole === "all" && s.filterTextActive]}
          >
            All ({users.length})
          </Text>
        </TouchableOpacity>
        {roles.map((role) => (
          <TouchableOpacity
            key={role}
            style={[s.filter, filterRole === role && s.filterActive]}
            onPress={() => setFilterRole(role)}
          >
            <Text
              style={[s.filterText, filterRole === role && s.filterTextActive]}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)} (
              {users.filter((u) => u.role === role).length})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={({ item }) => <UserCard item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="people-outline" size={64} color="#D1D5DB" />
            <Text style={s.emptyText}>No users found</Text>
            <Text style={s.emptySubtext}>
              {searchQuery ? "Try a different search" : "No users match filter"}
            </Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Manage User</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {selectedUser && (
              <>
                <View style={s.modalUser}>
                  <View
                    style={[
                      s.modalAvatar,
                      {
                        backgroundColor: getRoleColor(selectedUser.role).bg,
                        borderColor: getRoleColor(selectedUser.role).border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={getRoleIcon(selectedUser.role) as any}
                      size={32}
                      color={getRoleColor(selectedUser.role).border}
                    />
                  </View>
                  <Text style={s.modalName}>{selectedUser.fullName}</Text>
                  <Text style={s.modalEmail}>{selectedUser.email}</Text>
                  {selectedUser.id === currentUserId && (
                    <View style={s.youIndicator}>
                      <Ionicons name="person" size={14} color="#7C3AED" />
                      <Text style={s.youIndicatorText}>This is you</Text>
                    </View>
                  )}
                </View>
                <Text style={s.label}>Change Role:</Text>
                <View style={s.roleOptions}>
                  {roles.map((role) => {
                    const roleColor = getRoleColor(role);
                    const isSelected = selectedUser.role === role;
                    return (
                      <TouchableOpacity
                        key={role}
                        style={[
                          s.roleOption,
                          {
                            borderColor: isSelected
                              ? roleColor.border
                              : "#E5E7EB",
                            backgroundColor: isSelected ? roleColor.bg : "#FFF",
                          },
                        ]}
                        onPress={() => handleRoleSelection(role)}
                      >
                        <View
                          style={[
                            s.roleIcon,
                            {
                              backgroundColor: isSelected
                                ? roleColor.border
                                : roleColor.bg,
                            },
                          ]}
                        >
                          <Ionicons
                            name={getRoleIcon(role) as any}
                            size={20}
                            color={isSelected ? "#FFF" : roleColor.border}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              s.roleOptionText,
                              {
                                color: isSelected ? roleColor.text : "#374151",
                              },
                            ]}
                          >
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </Text>
                          {isSelected && (
                            <Text style={s.currentRole}>Current Role</Text>
                          )}
                        </View>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color={roleColor.border}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity
                  style={s.deleteBtn2}
                  onPress={handleDeleteUser}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  <Text style={s.deleteText}>Delete User</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={s.overlay}>
          <View style={s.confirmModal}>
            <View style={s.confirmIcon}>
              <Ionicons name="alert-circle" size={48} color="#F59E0B" />
            </View>
            <Text style={s.confirmTitle}>Confirm Role Change</Text>
            <Text style={s.confirmMsg}>
              Are you sure you want to change {selectedUser?.fullName}'s role to{" "}
              <Text style={s.highlight}>
                {pendingRole.charAt(0).toUpperCase() + pendingRole.slice(1)}
              </Text>
              ?
            </Text>
            {selectedUser?.id === currentUserId && (
              <Text style={s.warning}>
                ⚠️ This will change your role and redirect you to {pendingRole}{" "}
                dashboard.
              </Text>
            )}
            <View style={s.confirmBtns}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => {
                  setConfirmModalVisible(false);
                  setPendingRole("");
                }}
              >
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={updateUserRole}>
                <Text style={s.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={s.overlay}>
          <View style={s.confirmModal}>
            <View style={[s.confirmIcon, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="trash" size={48} color="#EF4444" />
            </View>
            <Text style={s.confirmTitle}>Delete User</Text>
            <Text style={s.confirmMsg}>
              Delete <Text style={s.highlight}>{selectedUser?.fullName}</Text>?
              This cannot be undone.
            </Text>
            <View style={s.confirmBtns}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.confirmBtn, { backgroundColor: "#EF4444" }]}
                onPress={deleteUser}
              >
                <Text style={s.confirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", marginTop: 14 },
  bg: {
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
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 12,
    fontFamily: "outfit",
    fontSize: 16,
    color: "#6B7280",
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
  headerContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 28,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: { fontFamily: "outfit-bold", fontSize: 22, color: "#111827" },
  subtitle: {
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
  search: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
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
    fontFamily: "outfit",
    fontSize: 15,
    color: "#111827",
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
    zIndex: 1,
  },
  filter: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 22,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  filterActive: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  filterText: {
    fontFamily: "outfit",
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  filterTextActive: { color: "#FFF" },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    position: "relative",
  },
  currentCard: { borderWidth: 2, borderColor: "#7C3AED" },
  youBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 4,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    zIndex: 1,
  },
  youText: {
    fontFamily: "outfit",
    fontSize: 10,
    color: "#FFF",
    fontWeight: "700",
  },
  cardHeader: { flexDirection: "row", marginBottom: 8 },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    marginRight: 14,
  },
  userInfo: { flex: 1, justifyContent: "center" },
  userName: {
    fontFamily: "outfit-bold",
    fontSize: 17,
    color: "#111827",
    marginBottom: 3,
  },
  userEmail: {
    fontFamily: "outfit",
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 3,
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: {
    fontFamily: "outfit",
    fontSize: 11,
    color: "#9CA3AF",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 5,
  },
  roleText: { fontFamily: "outfit", fontSize: 12, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 8 },
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  delBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontFamily: "outfit-bold",
    fontSize: 18,
    color: "#6B7280",
    marginTop: 16,
  },
  emptySubtext: {
    fontFamily: "outfit",
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 420,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontFamily: "outfit-bold", fontSize: 22, color: "#111827" },
  modalUser: {
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    marginBottom: 12,
  },
  modalName: {
    fontFamily: "outfit-bold",
    fontSize: 20,
    color: "#111827",
    marginBottom: 4,
  },
  modalEmail: { fontFamily: "outfit", fontSize: 14, color: "#6B7280" },
  youIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F3E8FF",
    borderRadius: 12,
  },
  youIndicatorText: {
    fontFamily: "outfit",
    fontSize: 12,
    color: "#7C3AED",
    fontWeight: "600",
  },
  label: {
    fontFamily: "outfit",
    fontSize: 15,
    color: "#374151",
    marginBottom: 14,
    fontWeight: "600",
  },
  roleOptions: { gap: 12, marginBottom: 20 },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    gap: 12,
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  roleOptionText: { fontFamily: "outfit-bold", fontSize: 16 },
  currentRole: {
    fontFamily: "outfit",
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  deleteBtn2: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#FEE2E2",
    borderWidth: 1.5,
    borderColor: "#FEE2E2",
  },
  deleteText: {
    fontFamily: "outfit",
    fontSize: 15,
    color: "#EF4444",
    fontWeight: "700",
  },
  confirmModal: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 380,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
    alignItems: "center",
  },
  confirmIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  confirmTitle: {
    fontFamily: "outfit-bold",
    fontSize: 22,
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  confirmMsg: {
    fontFamily: "outfit",
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  highlight: { fontFamily: "outfit-bold", color: "#7C3AED" },
  warning: {
    fontFamily: "outfit",
    fontSize: 13,
    color: "#F59E0B",
    textAlign: "center",
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    lineHeight: 18,
  },
  confirmBtns: { flexDirection: "row", gap: 12, width: "100%" },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontFamily: "outfit",
    fontSize: 15,
    color: "#374151",
    fontWeight: "700",
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    fontFamily: "outfit",
    fontSize: 15,
    color: "#FFF",
    fontWeight: "700",
  },
});
