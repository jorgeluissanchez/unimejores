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

  const { width, height } = Dimensions.get("window");

  const isProfessor =
    loggedUser?.role === "professor";

  const userName = useMemo(() => {
    if (!loggedUser?.name) return "Usuario";

    return loggedUser.name.split(" ")[0];
  }, [loggedUser]);

  return (
    <View className="flex-1 bg-indigo-400">

      {/* Logo */}
      <Text className="text-white text-center tracking-[4px] mt-16">
        UniMejores
      </Text>

      {/* Content */}
      <View className="flex-1 items-center px-8 pt-10">

        {/* Title */}
        <Text className="text-amber-100 text-center text-[32px] leading-[40px] font-semibold">
          Hola {userName},{"\n"}

          {isProfessor ? (
            <>
              Comienza{"\n"}
              <Text className="italic">
                a Administrar
              </Text>
            </>
          ) : (
            <>
              Comienza{"\n"}
              <Text className="italic">
                a Calificar
              </Text>
            </>
          )}
        </Text>

        {/* Subtitle */}
        <Text className="text-gray-200 text-center mt-6 text-[16px] leading-7 italic">
          {isProfessor
            ? "Es hora de que mires como los\nfeed back cambian tu aula."
            : "Es hora de que tus feed back\ncambien tu aula."}
        </Text>

        {/* SVG */}
        <View className="mt-8 items-center justify-center flex-1">
          <SvgXml
            xml={WELCOME_SVG}
            width={Math.min(width * 0.82, 320)}
            height={Math.min(width * 1.05, 420)}
          />
        </View>
      </View>

      {/* Bottom Button */}
      <View className="px-6 pb-8 pt-4">
        <Button
          className="h-16 rounded-full bg-gray-200"
          onPress={() =>
            router.replace("/home" as RelativePathString)
          }
        >
          <Text className="text-zinc-100 tracking-[2px] font-semibold">
            COMIENZA YA
          </Text>
        </Button>
      </View>
    </View>
  );
}