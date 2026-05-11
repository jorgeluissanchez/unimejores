import { SETTINGS_BG_BOTTOM_SVG } from "@/assets/svgs/settingsBgBottom";
import { SETTINGS_BG_MEN_SVG } from "@/assets/svgs/settingsBgMen";
import { SETTINGS_BG_MIDDLE_SVG } from "@/assets/svgs/settingsBgMiddle";
import { SETTINGS_BG_TOP_SVG } from "@/assets/svgs/settingsBgTop";
import { Button } from "@/core/components/ui/button";
import { Text } from "@/core/components/ui/text";
import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-provider";
import { isSessionExpiredError } from "@/core/lib/utils";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { CourseRepository } from "@/features/courses/domain/repositories/course-repository";
import { useCourses } from "@/features/courses/presentation/context/course-context";
import { ResultEvaluation } from "@/features/evaluation/domain/entities/evaluation";
import { EvaluationRepository } from "@/features/evaluation/domain/repositories/evaluation-repository";
import { avg } from "@/features/evaluation/domain/utils";
import { useRouter } from "expo-router";
import { LogOutIcon, XIcon } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";

function capitalizeLikeWelcome(name: string): string {
  return name
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}


export default function SettingScreen() {
  const { loggedUser, logout, expireSession } = useAuth();
  const router = useRouter();
  const { courses } = useCourses();
  const di = useDI();
  const courseRepo = useMemo(() => di.resolve<CourseRepository>(TOKENS.CourseRepo), [di]);
  const evalRepo = useMemo(() => di.resolve<EvaluationRepository>(TOKENS.EvaluationRepo), [di]);

  const [generalAvg, setGeneralAvg] = useState<number | null>(null);

  useEffect(() => {
    if (!loggedUser?.userId || courses.length === 0) return;
    const fetchAvg = async () => {
      try {
        const allScores: ResultEvaluation[] = [];
        await Promise.all(
          courses.map(async (course) => {
            const categories = await courseRepo.getCategoriesByCourse(course._id);
            await Promise.all(
              categories.map(async (cat) => {
                const group = await courseRepo.getGroupByCategory(cat._id, loggedUser.userId);
                if (!group) return;
                const scores = await evalRepo.getResultsForEvaluatedInGroup(group._id, loggedUser.userId);
                allScores.push(...scores);
              })
            );
          })
        );
        setGeneralAvg(avg(allScores));
      } catch (e) {
        if (isSessionExpiredError(e)) await expireSession();
      }
    };
    fetchAvg();
  }, [loggedUser?.userId, courses.length]);

  const greeting = "Eres muy Amado";

  const displayName = capitalizeLikeWelcome(
    loggedUser?.name ?? loggedUser?.email?.split("@")[0] ?? "Usuario"
  );

  return (
    <View className="flex-1 items-between overflow-hidden" style={{ backgroundColor: "#03174C" }}>
      <View pointerEvents="none" className="absolute inset-0">
        <View className="absolute top-0 right-0">
          <SvgXml xml={SETTINGS_BG_TOP_SVG} width={200} height={300} />
        </View>
        <View className="absolute top-[250px] left-1/2 -ml-[263px]">
          <SvgXml xml={SETTINGS_BG_MIDDLE_SVG} width={527} height={477} />
        </View>
        <View className="absolute bottom-0 left-0">
          <SvgXml xml={SETTINGS_BG_BOTTOM_SVG} width={500} height={150} />
        </View>
      </View>

      <View className="px-5 pt-10">
        <View className="flex-row items-center justify-between">
          <Button
            onPress={() => router.replace("/home")}
            className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center"
            style={{ backgroundColor: "#E6E7F2" }}
          >
            <XIcon color="#1F265E" height={20} width={20} />
          </Button>

          <Text variant="h3" className="flex-1 text-center text-white font-cal text-[18px]">
            {greeting}
          </Text>

          <Button
            onPress={async () => {
              await logout();
            }}
            className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center"
            style={{ backgroundColor: "#E6E7F2" }}
          >
            <LogOutIcon color="#1F265E" height={20} width={20} />
          </Button>
        </View>
      </View>
      <View className="my-auto flex w-full items-center justify-center max-w-lg mx-auto px-4">
        <Text variant="h1" className="text-white text-center leading-tight">
          {displayName}
        </Text>
        <Text className="mt-3 text-[#E6E7F2]/70">
          Promedio General:
        </Text>
          <Text className="text-[#E6E7F2]">{generalAvg !== null ? generalAvg : "5"}</Text>
      </View>

      <View className="items-center">
        <SvgXml xml={SETTINGS_BG_MEN_SVG} width={250} height={375} />
      </View>
    </View>
  );
}