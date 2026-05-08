import { SignupForm } from "@/features/auth/presentation/components/signup-form";
import React from "react";
import { View } from "react-native";

export default function SignupScreen() {
  return (
    <View testID="signup-screen" className="flex-1 justify-center p-5">
      <SignupForm />
    </View>
  );
}
