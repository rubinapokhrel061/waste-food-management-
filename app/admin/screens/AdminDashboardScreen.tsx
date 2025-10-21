import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import React from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AdminTabParamList } from "../dashboard";

type Props = BottomTabScreenProps<AdminTabParamList, "Dashboard">;

const AdminDashboardScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor="#9333EA" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, Admin 👋</Text>
          <Text style={styles.subtitle}>Overview of system stats</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
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
            <Text style={styles.statNumber}>120</Text>
            <Text style={styles.statLabel}>Donors</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>450</Text>
            <Text style={styles.statLabel}>NGOs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>1023</Text>
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
              <Text style={styles.actionSubtitle}>Donors & NGOs</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            // onPress={() => navigation.navigate("ManagePosts")}
            activeOpacity={0.9}
          >
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>📋</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Posts</Text>
              <Text style={styles.actionSubtitle}>All submissions</Text>
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
                <Text style={styles.gridIcon}>📊</Text>
              </View>
              <Text style={styles.gridLabel}>Reports</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate("Settings")}
              activeOpacity={0.9}
            >
              <View style={styles.gridIconContainer}>
                <Text style={styles.gridIcon}>⚙️</Text>
              </View>
              <Text style={styles.gridLabel}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridCard}
              // onPress={() => navigation.navigate("Notifications")}
              activeOpacity={0.9}
            >
              <View style={styles.gridIconContainer}>
                <Text style={styles.gridIcon}>🔔</Text>
              </View>
              <Text style={styles.gridLabel}>Notifications</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* System Impact */}
        <View style={styles.impactBanner}>
          <Text style={styles.impactEmoji}>🌟</Text>
          <View style={styles.impactContent}>
            <Text style={styles.impactTitle}>System Impact</Text>
            <Text style={styles.impactText}>
              1023 posts shared, 120 donors contributed this month!
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryCard: {
    backgroundColor: "#9333EA",
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
    color: "#FFFFFF",
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: "#FFFFFF",
    opacity: 0.8,
  },
  actionArrow: {
    fontSize: 20,
    color: "#FFFFFF",
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
});
