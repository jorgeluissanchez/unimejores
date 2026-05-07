import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Keyboard,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginScreen() {
  const { login, error, clearError } = useAuth();

  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      newErrors.email = "Ingresa tu correo";
    } else if (!trimmedEmail.includes("@")) {
      newErrors.email = "Correo inválido";
    }

    if (!password) {
      newErrors.password = "Ingresa tu contraseña";
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
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      <View className="flex-1 px-7 pt-5">
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full border border-zinc-200 items-center justify-center"
        >
          <Text className="text-lg">←</Text>
        </TouchableOpacity>

        {/* Title */}
        <View className="mt-10">
          <Text className="text-[34px] font-semibold text-zinc-700">
            Bienvenido de Vuelta
          </Text>
        </View>

        {/* Uni button */}
        <TouchableOpacity
          activeOpacity={0.85}
          className="mt-10 h-14 rounded-full border border-zinc-200 items-center justify-center"
        >
          <Text className="text-zinc-600 tracking-wide">
            CONTINUAR CON UNINORTE
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View className="items-center mt-8">
          <Text className="text-zinc-400 text-xs tracking-[1px]">
            O INICIA SESIÓN CON EMAIL
          </Text>
        </View>

        {/* Inputs */}
        <View className="mt-8 gap-4">
          <View>
            <TextInput
              value={email}
              onChangeText={(v) => {
                setEmail(v);

                if (errors.email) {
                  setErrors((e) => ({
                    ...e,
                    email: undefined,
                  }));
                }

                if (error) clearError();
              }}
              placeholder="Correo"
              autoCapitalize="none"
              keyboardType="email-address"
              className="h-14 rounded-2xl bg-zinc-100 px-5 text-zinc-700"
              placeholderTextColor="#9CA3AF"
            />

            {!!errors.email && (
              <Text className="text-red-500 mt-2 ml-2">
                {errors.email}
              </Text>
            )}
          </View>

          <View>
            <TextInput
              value={password}
              onChangeText={(v) => {
                setPassword(v);

                if (errors.password) {
                  setErrors((e) => ({
                    ...e,
                    password: undefined,
                  }));
                }

                if (error) clearError();
              }}
              placeholder="Contraseña"
              secureTextEntry
              className="h-14 rounded-2xl bg-zinc-100 px-5 text-zinc-700"
              placeholderTextColor="#9CA3AF"
            />

            {!!errors.password && (
              <Text className="text-red-500 mt-2 ml-2">
                {errors.password}
              </Text>
            )}
          </View>
        </View>

        {/* API error */}
        {!!error && (
          <Text className="text-red-500 mt-5 text-center">
            {error}
          </Text>
        )}

        {/* Login button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={loading}
          className="mt-10 h-14 rounded-full bg-[bg-brand] items-center justify-center"
        >
          <Text className="text-white tracking-[2px] font-medium">
            {loading ? "CARGANDO..." : "INICIA SESIÓN"}
          </Text>
        </TouchableOpacity>
        <View className="flex-row justify-center mt-6">
          <Text className="text-zinc-500">
            ¿No tienes cuenta?
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/signup")}
          >
            <Text className="text-brand font-semibold ml-1">
              Regístrate
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}