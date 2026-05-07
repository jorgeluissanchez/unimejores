import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { RelativePathString, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Keyboard,
  SafeAreaView,
  ScrollView,
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

export default function SignupScreen() {
  const { signup, error, clearError } = useAuth();

  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [accountType, setAccountType] = useState<
    "student" | "teacher" | null
  >(null);

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
    } else if (password.length < 6) {
      newErrors.password =
        "La contraseña debe tener mínimo 6 caracteres";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();

    if (!validate()) return;

    setLoading(true);

    const created = await signup(
      email.trim(),
      password
    ).finally(() => setLoading(false));

    if (created) {
      const url = `/verify-email?email=${encodeURIComponent(
        email.trim()
      )}`;

      router.push(url as RelativePathString);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-7 pt-5">
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
              Porfavor Registrese
            </Text>
          </View>

          {/* Uninorte button */}
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
              O REGÍSTRESE CON EMAIL
            </Text>
          </View>

          {/* Inputs */}
          <View className="mt-8 gap-4">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Nombre"
              className="h-14 rounded-2xl bg-zinc-100 px-5 text-zinc-700"
              placeholderTextColor="#9CA3AF"
            />

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

            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirmar Contraseña"
              secureTextEntry
              className="h-14 rounded-2xl bg-zinc-100 px-5 text-zinc-700"
              placeholderTextColor="#9CA3AF"
            />

            {/* Account Type */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setAccountType("student")}
                className={`flex-1 h-14 rounded-2xl items-center justify-center border ${
                  accountType === "student"
                    ? "bg-brand border-brand"
                    : "bg-zinc-100 border-zinc-100"
                }`}
              >
                <Text
                  className={
                    accountType === "student"
                      ? "text-white font-medium"
                      : "text-zinc-500"
                  }
                >
                  Estudiante
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAccountType("teacher")}
                className={`flex-1 h-14 rounded-2xl items-center justify-center border ${
                  accountType === "teacher"
                    ? "bg-brand border-brand"
                    : "bg-zinc-100 border-zinc-100"
                }`}
              >
                <Text
                  className={
                    accountType === "teacher"
                      ? "text-white font-medium"
                      : "text-zinc-500"
                  }
                >
                  Profesor
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Error */}
          {!!error && (
            <Text className="text-red-500 mt-5 text-center">
              {error}
            </Text>
          )}

          {/* Signup button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={loading}
            className="mt-10 h-14 rounded-full bg-brand items-center justify-center"
          >
            <Text className="text-white tracking-[2px] font-medium">
              {loading ? "CARGANDO..." : "REGISTRARSE"}
            </Text>
          </TouchableOpacity>

          {/* Bottom link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-zinc-500">
              ¿Ya tienes cuenta?
            </Text>

            <TouchableOpacity
              onPress={() =>
                router.replace("/login" as RelativePathString)
              }
            >
              <Text className="text-brand font-semibold ml-1">
                Inicia sesión
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}