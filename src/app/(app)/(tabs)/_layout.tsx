import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useSegments } from "expo-router";
import React from "react";
import { View } from "react-native";

const PRIMARY = "#818CF8";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View
      style={
        focused
          ? {
              backgroundColor: PRIMARY,
              borderRadius: 12,
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            }
          : { alignItems: "center", justifyContent: "center", width: 40, height: 40 }
      }
    >
      <Ionicons name={name as any} size={20} color={focused ? "#FFFFFF" : "#9CA3AF"} />
    </View>
  );
}

export default function TabsLayout() {
  const { loggedUser } = useAuth();
  const segments = useSegments();
  const displayName = loggedUser?.name
    ? loggedUser.name.split(" ")[0]
    : loggedUser?.email?.split("@")[0] ?? "Perfil";
  const isSettingsScreen = segments.at(-1) === "settings";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: isSettingsScreen
          ? { display: "none",
              height: 80 }
          : {
              backgroundColor: "#FFFFFF",
              borderTopWidth: 0,
              elevation: 0,
              shadowOpacity: 0,
              height: 110,
              paddingTop: 12,
              boxShadow: "10px 0px 10px rgba(0, 0, 0, 0.1)",
            },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          paddingTop: 6,
        },
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: "#9CA3AF",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "home" : "home-outline"} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: displayName,
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "person" : "person-outline"} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
