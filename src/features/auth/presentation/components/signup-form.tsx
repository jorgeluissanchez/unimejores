import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { RelativePathString, useRouter } from "expo-router";
import React, { useState } from "react";
import { Keyboard, View } from "react-native";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
}

export function SignupForm() {
  const { signup, error, clearError } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [obscurePassword, setObscurePassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = "Ingresa tu nombre";
    }

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

    setLoading(true);
    const created = await signup(email.trim(), password, name.trim()).finally(() => setLoading(false));

    if (created) {
      router.replace("/home" as RelativePathString);
    }
  };

  return (
    <View className="gap-4">
      {!!error && (
          <View className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
            <Text className="text-sm text-destructive">{error}</Text>
          </View>
        )}

        <View className="gap-1.5">
          <Label>Nombre</Label>
          <Input
            testID="signup-name-input"
            value={name}
            onChangeText={(v) => {
              setName(v);
              if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
              if (error) clearError();
            }}
            placeholder="Tu nombre completo"
            autoCapitalize="words"
            returnKeyType="next"
            className={errors.name ? "border-destructive" : undefined}
          />
          {!!errors.name && (
            <Text testID="signup-name-error" className="text-sm text-destructive">
              {errors.name}
            </Text>
          )}
        </View>

        <View className="gap-1.5">
          <Label>Correo</Label>
          <Input
            testID="signup-email-input"
            value={email}
            onChangeText={(v) => {
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
          {!!errors.email && (
            <Text testID="signup-email-error" className="text-sm text-destructive">
              {errors.email}
            </Text>
          )}
        </View>

        <View className="gap-1.5">
          <Label>Contraseña</Label>
          <View className="flex-row items-center gap-2">
            <Input
              testID="signup-password-input"
              value={password}
              onChangeText={(v) => {
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
          {!!errors.password && (
            <Text testID="signup-password-error" className="text-sm text-destructive">
              {errors.password}
            </Text>
          )}
        </View>

        <Button testID="signup-button" onPress={handleSubmit} disabled={loading}>
          <Text>{loading ? "Creando cuenta..." : "Registrarse"}</Text>
        </Button>
    </View>
  );
}
