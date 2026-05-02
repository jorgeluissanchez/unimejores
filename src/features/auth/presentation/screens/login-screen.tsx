import { Button } from "@/core/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Keyboard, View } from "react-native";

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginScreen() {
  const { login, error, clearError } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [obscurePassword, setObscurePassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      newErrors.email = "Ingresa tu correo";
    } else if (!trimmedEmail.includes("@")) {
      newErrors.email = "Ingresa un correo válido";
    }

    if (!password) {
      newErrors.password = "Ingresa tu contraseña";
    } else if (password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validate()) return;

    try {
      setLoading(true);
      await login(email.trim(), password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View testID="login-screen" className="flex-1 justify-center p-5">
      <Card className="max-w-xl mx-auto w-full">
        <CardHeader>
          <CardTitle className="text-center" variant="h1">¡Bienvenido! Inicia sesión</CardTitle>
          <CardDescription className="text-center">Bienvenido de nuevo</CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          {!!error && (
            <View className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
              <Text className="text-sm text-destructive">{error}</Text>
            </View>
          )}

          <View className="gap-1.5">
            <Label>Correo</Label>
            <Input
              testID="email-input"
              value={email}
              onChangeText={(v: string) => {
                setEmail(v);
                if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
                if (error) clearError();
              }}
              placeholder="ejemplo@gmail.com"
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              className={errors.email ? "border-destructive" : undefined}
            />
            {!!errors.email && <Text className="text-sm text-destructive">{errors.email}</Text>}
          </View>

          <View className="gap-1.5">
            <View className="flex-row items-center justify-between">
              <Label>Contraseña</Label>
              <Button variant="link" size="sm" onPress={() => router.push("/forgot-password" as any)}>
                <Text className="text-sm">¿Olvidaste tu contraseña?</Text>
              </Button>
            </View>
            <View className="flex-row items-center gap-2">
            <Input
              testID="password-input"
              value={password}
              onChangeText={(v: string) => {
                setPassword(v);
                if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                if (error) clearError();
              }}
              placeholder="**********"
              secureTextEntry={obscurePassword}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              className={errors.password ? "border-destructive" : undefined}
            />
            <Button variant="ghost" className="w-fit" size="sm" onPress={() => setObscurePassword((v) => !v)}>
              <Text className="text-sm">{obscurePassword ? "Mostrar contraseña" : "Ocultar contraseña"}</Text>
            </Button>
            </View>
            {!!errors.password && <Text className="text-sm text-destructive">{errors.password}</Text>}
          </View>

          <Button testID="login-button" onPress={handleSubmit} disabled={loading}>
            <Text>{loading ? "Iniciando sesión..." : "Iniciar sesión"}</Text>
          </Button>

          <Button testID="create-account-button" variant="link" onPress={() => router.push("/signup" as any)}>
            <Text>¿No tienes una cuenta? Regístrate</Text>
          </Button>
        </CardContent>
      </Card>
    </View>
  );
}
