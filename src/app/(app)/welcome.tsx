import { Button } from "@/core/components/ui/button";
import { Text } from "@/core/components/ui/text";

import { useAuth } from "@/features/auth/presentation/context/auth-context";

import { RelativePathString, useRouter } from "expo-router";

import React, { useMemo } from "react";

import { Dimensions, View } from "react-native";

import { SvgXml } from "react-native-svg";

import { WELCOME_SVG } from "../../../assets/svgs/welcome";

export default function StudentWelcomeScreen() {
  const router = useRouter();

  const { loggedUser } = useAuth();

  const { width } = Dimensions.get("window");

  const isProfessor = loggedUser?.role === "professor";

  const userName = useMemo(() => {
    if (!loggedUser?.name) return "Usuario";

    return loggedUser.name.split(" ")[0];
  }, [loggedUser]);

  return (
    <View className="flex-1 bg-indigo-400">
      <View className="flex-1 w-full max-w-lg self-center px-6 pt-10 pb-8 justify-between">
        <Text className="text-lg text-center text-white">UniMejores</Text>

        <View className="items-center">
          <Text variant="h1" className="text-amber-100 text-center">
            {`Hola ${userName}, Comienza a ${isProfessor ? "administrar tu aula" : "calificar a tus compañeros"}`
              .toLowerCase()
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
          </Text>

          <Text className="text-gray-200 text-center mt-6 text-[16px] leading-7 italic">
            {isProfessor
              ? "Es hora de que mires como los feedbacks cambian tu aula."
              : "Es hora de que tus feedbacks cambien tu aula."}
          </Text>

          <View className="mt-8 items-center justify-center">
            <SvgXml xml={WELCOME_SVG} width={width < 400 ? width - 80 : 350} height={width < 400 ? width - 80 : 350} />
          </View>
        </View>

        <Button
          variant="ghost"
          className="h-16 mb-8 rounded-full w-full bg-gray-100"
          onPress={() =>
            router.replace("/home" as RelativePathString)
          }
        >
          <Text className="text-gray-800 text-lg">
            COMIENZA YA
          </Text>
        </Button>
      </View>
    </View>
  );
}