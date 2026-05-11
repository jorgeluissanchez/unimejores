import { COURSE_DETAIL_SVG } from "@/assets/svgs/courseDetail";
import { Button } from "@/core/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { Text } from "@/core/components/ui/text";
import { useCourses } from "@/features/courses/presentation/context/course-context";
import { useCourseDetail } from "@/features/courses/presentation/context/course-detail-context";
import { PeerListItem } from "@/features/courses/presentation/components/peer-list-item";
import { RelativePathString, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useMemo } from "react";
import { ActivityIndicator, ScrollView, useWindowDimensions, View } from "react-native";
import { SvgXml } from "react-native-svg";

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { courses } = useCourses();
  const {
    categoryStates,
    activeId,
    setActiveId,
    activeCat,
    activePeers,
    myAvgScore,
    isLoading,
    error,
    reload,
  } = useCourseDetail();

  const course = useMemo(() => courses.find((c) => c._id === courseId), [courses, courseId]);

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 w-full max-w-lg self-center">
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Header decorativo */}
          <View className="h-60 relative w-full overflow-hidden rounded-b-lg mb-4">
            <SvgXml
              xml={COURSE_DETAIL_SVG}
              width={width > 400 ? 700 : width}
              height={width > 400 ? 700 : width}
              className="absolute bottom-0 left-0"
            />
            <Button
              onPress={() => router.replace("/home" as RelativePathString)}
              className="rounded-full w-[50px] h-[50px] p-6 absolute left-5 top-[52px] items-center justify-center"
              style={{ backgroundColor: "#E6E7F2" }}
            >
              <ArrowLeft color="#1F265E" height={20} width={20} />
            </Button>
          </View>

          {/* Info del curso */}
          <View className="px-5 pt-5">
            <Text variant="h2">{course?.name ?? "Curso"}</Text>
            <Text variant="muted">
              {myAvgScore !== null
                ? `Tu promedio es de ${myAvgScore}`
                : "Aún no has recibido calificaciones"}
            </Text>
            {!!course?.description && (
              <Text className="text-sm text-gray-400 italic mt-3 leading-5">
                {course.description}
              </Text>
            )}
          </View>

          {/* Título sección */}
          <View className="px-5 pt-6 pb-3">
            <Text className="text-lg font-bold text-[#1E1E2E]">Calificalos a todos</Text>
          </View>

          {/* Tabs de categorías */}
          {categoryStates.length > 0 && (
            <Tabs value={activeId} onValueChange={setActiveId} className="mb-3">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20 }}
              >
                <TabsList className="bg-transparent h-auto rounded-none p-0 gap-6">
                  {categoryStates.map((cs) => (
                    <TabsTrigger
                      key={cs.category._id}
                      value={cs.category._id}
                      className="bg-transparent rounded-none px-0 pb-2 h-auto"
                      style={{
                        borderBottomWidth: activeId === cs.category._id ? 2 : 0,
                        borderBottomColor: "#818CF8",
                      }}
                    >
                      <Text
                        className="text-[13px] font-bold tracking-[0.5px]"
                        style={{ color: activeId === cs.category._id ? "#818CF8" : "#9CA3AF" }}
                      >
                        {cs.category.name.toUpperCase()}
                      </Text>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </ScrollView>
            </Tabs>
          )}

          {/* Lista de compañeros */}
          {isLoading ? (
            <View className="p-10 items-center">
              <ActivityIndicator color="#818CF8" size="large" />
            </View>
          ) : error ? (
            <View className="p-5 items-center gap-2">
              <Text className="text-red-500">{error}</Text>
              <Button variant="link" onPress={reload}>
                <Text>Reintentar</Text>
              </Button>
            </View>
          ) : !activeCat?.group ? (
            <View className="p-8 items-center">
              <Text variant="muted" className="text-center">
                No perteneces a ningún grupo en esta categoría
              </Text>
            </View>
          ) : activePeers.length === 0 ? (
            <View className="p-8 items-center">
              <Text variant="muted">No hay compañeros en este grupo</Text>
            </View>
          ) : (
            <View className="px-5 pb-10 gap-1">
              {activePeers.map((peer) => (
                <PeerListItem
                  key={peer.user.user_id}
                  peer={peer}
                  courseId={courseId}
                  groupId={activeCat.group!._id}
                />
              ))}
            </View>
          )}

        </ScrollView>
      </View>
    </View>
  );
}
