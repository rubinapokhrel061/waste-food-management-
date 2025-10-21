import LogoutButton from "@/components/LogoutButton";
import React, { useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />
      <View style={styles.container}>
        {/* Header with gradient effect */}
        <View style={styles.header}>
          <View style={styles.headerGradient}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Manage your app preferences</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Notifications Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>🔔</Text>
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Notifications</Text>
                <Text style={styles.cardSubtitle}>
                  {notifications ? "Enabled" : "Disabled"}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive notifications about app updates and important
                  information
                </Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: "#E5E7EB", true: "#DDD6FE" }}
                thumbColor={notifications ? "#7C3AED" : "#9CA3AF"}
                ios_backgroundColor="#E5E7EB"
              />
            </View>
          </View>

          {/* Account Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>👤</Text>
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Account</Text>
                <Text style={styles.cardSubtitle}>
                  Manage your account settings
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <LogoutButton />
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    backgroundColor: "#7C3AED",
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerGradient: {
    paddingTop: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#E9D5FF",
    fontWeight: "400",
  },
  scrollView: {
    flex: 1,
    paddingTop: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  icon: {
    fontSize: 24,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#7C3AED",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  settingDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  logoutContainer: {
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: "#7C3AED",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
