import { useTheme } from "@/core/hooks/use-theme";

import { Ionicons } from "@expo/vector-icons";

import { Tabs } from "expo-router";

import React from "react";

import { View } from "react-native";

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarShowLabel: true,

        tabBarActiveTintColor: "#8D8DFF",

        tabBarInactiveTintColor: "#A1A1AA",

        tabBarStyle: {
          position: "absolute",

          height: 85,

          paddingTop: 10,

          paddingBottom: 20,

          borderTopWidth: 1,

          borderTopColor: "#F4F4F5",

          backgroundColor: "white",
        },

        tabBarLabelStyle: {
          fontSize: 12,

          marginTop: 4,

          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",

          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 999,

                alignItems: "center",
                justifyContent: "center",

                backgroundColor: focused
                  ? "#8D8DFF"
                  : "transparent",
              }}
            >
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={22}
                color={focused ? "white" : color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Perfil",

          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 999,

                alignItems: "center",
                justifyContent: "center",

                backgroundColor: focused
                  ? "#8D8DFF"
                  : "transparent",
              }}
            >
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={22}
                color={focused ? "white" : color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}