import ProfileScreen from "@/app/screen/ProfileScreen";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import DonorDashboardScreen from "../donor/screen/DonorDashboardScreen";
import PostFoodScreen from "../donor/screen/PostFoodScreen";
import ChatScreen from "../screen/ChatScreen";
import FoodsScreen from "../screen/FoodsScreen";

export type DonorTabParamList = {
  Dashboard: undefined;
  Post: undefined;
  Foods: undefined;
  Chat: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<DonorTabParamList>();

const DonorNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#9333EA",
        tabBarInactiveTintColor: "#111827",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0,
          elevation: 5,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<
            keyof DonorTabParamList,
            keyof typeof Ionicons.glyphMap
          > = {
            Dashboard: "home",
            Post: "add-circle",
            Foods: "time",
            Chat: "chatbubble",
            Profile: "person",
          };
          return (
            <Ionicons
              name={icons[route.name as keyof DonorTabParamList]}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DonorDashboardScreen} />
      <Tab.Screen name="Post" component={PostFoodScreen} />
      <Tab.Screen name="Foods" component={FoodsScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default DonorNavigator;
