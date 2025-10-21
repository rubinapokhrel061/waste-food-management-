// import { StyleSheet, Text, View } from "react-native";

// export default function AdminDashboard() {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Admin Dashboard</Text>
//       <Text>Manage all users, donations, and reports here.</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#F9FAFB",
//   },
//   title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
// });
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";

import AdminDashboardScreen from "../admin/screens/AdminDashboardScreen";
import ManageDonationsScreen from "../admin/screens/ManageDonationsScreen";
import ManageUsersScreen from "../admin/screens/ManageUsersScreen";
import ReportsScreen from "../admin/screens/ReportsScreen";
import SettingsScreen from "../admin/screens/SettingsScreen";

// Define the type for tab param list (optional but recommended)
export type AdminTabParamList = {
  Dashboard: undefined;
  Users: undefined;
  Donations: undefined;
  Reports: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

const AdminNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#7C3AED",
        tabBarInactiveTintColor: "#111827",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0,
          elevation: 5,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="view-dashboard"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Users"
        component={ManageUsersScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-group"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Donations"
        component={ManageDonationsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="food" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="alert-circle"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default AdminNavigator;
