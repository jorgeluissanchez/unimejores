import { ForgotPasswordForm } from "@/features/auth/presentation/components/forgot-password-form";
import React from "react";
import { View } from "react-native";

export default function ForgotPasswordScreen() {
  return (
    <View className="flex-1 justify-center p-5">
      <ForgotPasswordForm />
    </View>
  );
}
