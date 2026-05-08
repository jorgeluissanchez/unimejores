import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { SignupForm } from "@/features/auth/presentation/components/signup-form";
import type { RelativePathString } from "expo-router";
import { useRouter } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

export default function SignupScreen() {
  const router = useRouter();
  return (
    <View testID="signup-screen" className="flex-1 justify-center p-5">
      <Card className="max-w-xl mx-auto w-full">
        <CardHeader>
          <CardTitle className="text-center" variant="h1">Crea una cuenta</CardTitle>
          <CardDescription className="text-center">Únete y empieza a usar la app</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
        <Button testID="go-to-login-button" variant="link" onPress={() => router.replace('/login' as RelativePathString)}>
          <Text>¿Ya tienes una cuenta? Inicia sesión</Text>
        </Button>
        </CardContent>
      </Card>
    </View>
  );
}
