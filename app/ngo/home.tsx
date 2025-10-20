// import LogoutButton from "@/components/LogoutButton";
// import { StyleSheet, Text, View } from "react-native";

// export default function NgoHome() {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>NGO Home</Text>
//       <Text>Track and manage donations for your NGO here.</Text>
//       <LogoutButton />
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

import { MaterialIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";

import AssignPickupScreen from "../ngo/screen/AssignPickupScreen";
import NGODashboardScreen from "../ngo/screen/NGODashboardScreen";
import NearbyFoodScreen from "../ngo/screen/NearbyFoodScreen";
import PickupTrackingScreen from "../ngo/screen/PickupTrackingScreen";
import ProfileScreen from "../ngo/screen/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function NgoHome() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2E8B57",
        tabBarInactiveTintColor: "#8E8E8E",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0.5,
          borderTopColor: "#E0E0E0",
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 4,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={NGODashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Nearby"
        component={NearbyFoodScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="map" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Pickup"
        component={AssignPickupScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="delivery-dining" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Track"
        component={PickupTrackingScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="navigation" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
