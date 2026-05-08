import { Button } from "@/core/components/ui/button";
import { Text } from "@/core/components/ui/text";
import { LoginForm } from "@/features/auth/presentation/components/login-form";
import { RelativePathString, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { Pressable, Text as RNText, ScrollView, StatusBar, View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white overflow-hidden">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Decorative circles — negative positioning requires inline style */}
      <View
        style={{
          position: "absolute",
          top: -70,
          left: -70,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: "#ECEEFF",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: -30,
          right: -80,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: "#ECEEFF",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 80,
          right: -90,
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: "#F0F1FF",
        }}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <View className="pt-14 px-6">
          <Pressable
            onPress={() => router.replace("/landing" as RelativePathString)}
            className="w-[42px] h-[42px] rounded-full bg-gray-100 items-center justify-center"
          >
            <ArrowLeft size={20} color="#1E1E2E" />
          </Pressable>
        </View>

        {/* Title */}
        <View className="px-6 pt-7 pb-8">
          <RNText className="text-[30px] font-bold text-[#1E1E2E] text-center">
            Bienvenido de vuelta
          </RNText>
        </View>

        {/* Form */}
        <View className="px-6">
          <LoginForm />
        </View>

        {/* Go to signup */}
        <View className="px-6 items-center mt-4">
          <Button
            testID="create-account-button"
            variant="link"
            onPress={() => router.push("/signup" as RelativePathString)}
          >
            <Text>¿No tienes una cuenta? Regístrate</Text>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
