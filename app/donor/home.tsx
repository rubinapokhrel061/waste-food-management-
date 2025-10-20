// import { StyleSheet, Text, View } from "react-native";

// export default function DonorHome() {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Donor Home</Text>
//       <Text>View NGOs and donate food easily from here.</Text>
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

import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";

import ActivePostsScreen from "../donor/screen/ActivePostsScreen";
import ChatScreen from "../donor/screen/ChatScreen";
import DonorDashboardScreen from "../donor/screen/DonorDashboardScreen";
import PostFoodScreen from "../donor/screen/PostFoodScreen";
import ProfileScreen from "../donor/screen/ProfileScreen";

// 👇 Type definition for navigation
export type DonorTabParamList = {
  Dashboard: undefined;
  Post: undefined;
  Active: undefined;
  Chat: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<DonorTabParamList>();

const DonorNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#4CAF50",
        tabBarInactiveTintColor: "#888",
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
            Active: "time",
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
      <Tab.Screen name="Active" component={ActivePostsScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default DonorNavigator;
