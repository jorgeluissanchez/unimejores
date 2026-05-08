import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Text } from "@/core/components/ui/text";
import { LoginForm } from "@/features/auth/presentation/components/login-form";
import type { RelativePathString } from "expo-router";
import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  return (
    <View testID="login-screen" className="flex-1 justify-center p-5">
      <Card className="max-w-xl mx-auto w-full">
        <CardHeader>
          <CardTitle className="text-center" variant="h1">¡Bienvenido! Inicia sesión</CardTitle>
          <CardDescription className="text-center">Bienvenido de nuevo</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        <Button testID="create-account-button" variant="link" onPress={() => router.push("/signup" as RelativePathString)}>
          <Text>¿No tienes una cuenta? Regístrate</Text>
        </Button> 
        </CardContent>
      </Card>
    </View>
  );
}
