import { useRouter } from "expo-router";
import React from "react";
import {
    Image,
    SafeAreaView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
  <StatusBar barStyle="dark-content" />

  <View className="flex-1 px-8">
    
    {/* Logo */}
    <View className="items-center mt-10">
      <Text className="text-[15px] tracking-[4px] text-zinc-700">
        UniMejores
      </Text>
    </View>

    {/* Illustration */}
    <View className="items-center mt-16">
      <Image
        source={require("@/assets/images/welcome.png")}
        resizeMode="contain"
        style={{
            width: 260,
            height: 260,
        }}
      />
    </View>

    {/* Bottom content */}
    <View className="mt-14 items-center">
      <Text className="text-[36px] leading-[42px] font-semibold text-zinc-700 text-center">
        Califica a tu{"\n"}Compañero
      </Text>

      <Text className="text-center text-zinc-400 mt-5 text-[15px] leading-6">
        En esta vida hay personas que{"\n"}
        se merecen feedback para{"\n"}
        mejorar.
      </Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push("/login")}
        className="mt-12 h-14 w-full rounded-full bg-brand items-center justify-center"
      >
        <Text className="text-white tracking-[2px] font-medium">
          INICIAR SESIÓN
        </Text>
      </TouchableOpacity>
    </View>

  </View>
</SafeAreaView>
  );
}