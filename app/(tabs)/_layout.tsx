import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Colors } from "../../constants/Colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
      }}
    >
      <Tabs.Screen
        name="fooditems"
        options={{
          tabBarLabel: "Food Items",
          tabBarIcon: ({ color }) => (
            <Ionicons name="fast-food" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
