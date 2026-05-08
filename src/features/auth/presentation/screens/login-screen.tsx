import { LoginForm } from "@/features/auth/presentation/components/login-form";
import React from "react";
import { View } from "react-native";

export default function LoginScreen() {
  return (
    <View testID="login-screen" className="flex-1 justify-center p-5">
      <LoginForm />
    </View>
  );
}
