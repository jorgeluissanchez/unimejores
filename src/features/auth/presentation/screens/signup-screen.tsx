import { Button } from "@/core/components/ui/button";
import { Text } from "@/core/components/ui/text";
import { SignupForm } from "@/features/auth/presentation/components/signup-form";
import { RelativePathString, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { ScrollView, View } from "react-native";

export default function SignupScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white overflow-hidden">
      <View className="absolute -top-16 -left-16 w-[200px] h-[200px] rounded-full bg-[#ECEEFF]" />
      <View className="absolute -top-8 -right-20 w-[220px] h-[220px] rounded-full bg-[#ECEEFF]" />
      <View className="absolute top-20 -right-24 w-[180px] h-[180px] rounded-full bg-[#F0F1FF]" />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <Button
          variant="ghost"
          size="icon"
          onPress={() => router.replace("/landing" as RelativePathString)}
          className="absolute left-5 top-[52px] rounded-full bg-white/30"
        >
          <ArrowLeft className="text-gray-800 w-5 h-5" />
        </Button>
        {/* Title */}
        <View className="px-6 pt-7 pb-8">
          <Text className="text-[30px] font-bold text-[#1E1E2E] text-center">
            Porfavor Registrese
          </Text>
        </View>

        {/* Form */}
        <View className="px-6">
          <SignupForm />
        </View>
      </ScrollView>
    </View>
  );
}
