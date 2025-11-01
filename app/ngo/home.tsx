import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";

import NGODashboardScreen from "../ngo/screen/NGODashboardScreen";
import ChatScreen from "../screen/ChatScreen";
import FoodsScreen from "../screen/FoodsScreen";
import ProfileScreen from "../screen/ProfileScreen";
import DonationStatusScreen from "./screen/DonationStatus";

export type NGOTabParamList = {
  Dashboard: undefined;
  Nearby: undefined;
  Report: undefined;
  Chat: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<NGOTabParamList>();

export default function NgoHome() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#9333EA",
        tabBarInactiveTintColor: "#111827",
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
      {/* 🏠 Dashboard */}
      <Tab.Screen
        name="Dashboard"
        component={NGODashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" color={color} size={size} />
          ),
          tabBarLabel: "Dashboard",
        }}
      />

      {/* 📍 Nearby Foods */}
      <Tab.Screen
        name="Nearby"
        component={FoodsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location" color={color} size={size} />
          ),
          tabBarLabel: "Nearby Foods",
        }}
      />

      {/* 🚚 Manage Donation Status */}
      <Tab.Screen
        name="Report"
        component={DonationStatusScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="hands-helping" color={color} size={size - 2} />
          ),
          tabBarLabel: "Donations Report",
        }}
      />

      {/* 💬 Chat */}
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses" color={color} size={size} />
          ),
          tabBarLabel: "Chat",
        }}
      />

      {/* 👤 Profile */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} size={size} />
          ),
          tabBarLabel: "Profile",
        }}
      />
    </Tab.Navigator>
  );
}
