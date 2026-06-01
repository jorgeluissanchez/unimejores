import { COURSE_DETAIL_SVG } from "@/assets/svgs/courseDetail";
import { Button } from "@/core/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/core/components/ui/drawer";
import { Text } from "@/core/components/ui/text";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { Category } from "@/features/courses/domain/entities/course";
import { CategoriasTab, CategoryWithData } from "@/features/courses/presentation/components/categorias-tab";
import { CategoryDrawer } from "@/features/courses/presentation/components/category-drawer";
import { EvalListItem, EvaluacionesTab } from "@/features/courses/presentation/components/evaluaciones-tab";
import { AddCategoryForm } from "@/features/courses/presentation/components/forms/add-category-form";
import { EnrollStudentsForm } from "@/features/courses/presentation/components/forms/enroll-students-form";
import { UpdateCourseForm } from "@/features/courses/presentation/components/forms/update-course-form";
import { useCourses } from "@/features/courses/presentation/context/course-context";
import { CreateEvaluationForm } from "@/features/evaluation/presentation/components/forms/create-evaluation-form";
import { EditEvaluationForm, EditEvaluationFormHandle } from "@/features/evaluation/presentation/components/forms/edit-evaluation-form";
import { EvaluationCriteriaForm } from "@/features/evaluation/presentation/components/forms/evaluation-criteria-form";
import { useEvaluation } from "@/features/evaluation/presentation/context/evaluation-context";
import * as DocumentPicker from "expo-document-picker";
import { Tabs, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Edit, Users, X } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { Circle, Svg } from "react-native-svg";
import { SvgXml } from "react-native-svg";

const PRIMARY = "#818CF8";

export function ProfessorCourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { loggedUser } = useAuth();
  const {
    courses,
    getCategoriesByCourse,
    getGroupsByCategory,
    importGroupsCsv,
  } = useCourses();

  const { myCriteria, getEvaluationByCategory, getResultsByGroup, updateEvaluation, deleteEvaluation } = useEvaluation();

  const course = useMemo(() => courses.find((c) => c._id === courseId), [courses, courseId]);

  const [tab, setTab] = useState<"evaluaciones" | "categorias">("evaluaciones");
  const [categoryData, setCategoryData] = useState<CategoryWithData[]>([]);
  const [criteriaScores, setCriteriaScores] = useState<{ criteriumId: string; name: string; avg: number }[]>([]);
  const editFormRef = useRef<EditEvaluationFormHandle>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Local state mutation helpers — avoid full reload after single-item changes
  const mutateCategoryAdd = useCallback((cat: Category) =>
    setCategoryData((prev) => [...prev, { category: cat, evaluation: null, groups: [] }]), []);
  const mutateCategoryUpdate = useCallback((cat: Category) =>
    setCategoryData((prev) => prev.map((cd) => cd.category._id === cat._id ? { ...cd, category: cat } : cd)), []);
  const mutateCategoryDelete = useCallback((catId: string) =>
    setCategoryData((prev) => prev.filter((cd) => cd.category._id !== catId)), []);
  const mutateEvaluationSet = useCallback((catId: string, ev: import("@/features/evaluation/domain/entities/evaluation").Evaluation | null) =>
    setCategoryData((prev) => prev.map((cd) => cd.category._id === catId ? { ...cd, evaluation: ev } : cd)), []);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ completed: number; total: number } | null>(null);
  const [isCreateEvalOpen, setIsCreateEvalOpen] = useState(false);
  const [editEval, setEditEval] = useState<EvalListItem | null>(null);
  const [isSavingEval, setIsSavingEval] = useState(false);
  const [isDeletingEval, setIsDeletingEval] = useState(false);
  const [confirmDeleteEval, setConfirmDeleteEval] = useState(false);
  const [isCreateCatOpen, setIsCreateCatOpen] = useState(false);
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const load = useCallback(async () => {
    if (!courseId || !loggedUser) return;
    try {
      setIsLoading(true);
      const cats = await getCategoriesByCourse(courseId);
      const withData = await Promise.all(
        cats.map(async (cat) => {
          const [ev, groups] = await Promise.all([
            getEvaluationByCategory(cat._id),
            getGroupsByCategory(cat._id),
          ]);
          return { category: cat, evaluation: ev, groups };
        }),
      );
      setCategoryData(withData);

      if (myCriteria.length > 0) {
        const allResults = (await Promise.all(
          withData.flatMap((cd) => cd.groups.map((g) => getResultsByGroup(g._id)))
        )).flat();
        const scores = myCriteria.map((c) => {
          const vals = allResults.filter((r) => r.criterium_id === c._id).map((r) => Number(r.score));
          const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
          return { criteriumId: c._id, name: c.name, avg };
        });
        setCriteriaScores(scores);
      }
    } catch (e: any) {
      if (e?.message?.includes("401")) return;
    } finally {
      setIsLoading(false);
    }
  }, [courseId, loggedUser, myCriteria]);

  useEffect(() => { load(); }, [load]);

  const evalList: EvalListItem[] = useMemo(
    () =>
      categoryData
        .filter((cd) => cd.evaluation !== null)
        .map((cd) => ({ evaluation: cd.evaluation!, categoryName: cd.category.name })),
    [categoryData],
  );

  const handleImportCsv = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["text/csv", "text/comma-separated-values", "application/csv", "*/*"] });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setIsImporting(true);
      setImportProgress({ completed: 0, total: 1 });
      let content: string;
      if (Platform.OS === "web") {
        content = await fetch(asset.uri).then((r) => r.text());
      } else {
        const FS = require("expo-file-system");
        content = await FS.readAsStringAsync(asset.uri, { encoding: "utf8" });
      }
      await importGroupsCsv(courseId!, content, (completed, total) => {
        setImportProgress({ completed, total });
      });
      await load();
      Alert.alert("Importación completa", "Las categorías y grupos se han creado correctamente.");
    } catch (e: any) {
      Alert.alert("Error al importar", e.message ?? "No se pudo procesar el archivo.");
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  const handleSaveEval = async () => {
    const values = editFormRef.current?.getValues();
    if (!values || !editEval) return;
    Keyboard.dismiss();
    if (!values.title.trim()) return;
    try {
      setIsSavingEval(true);
      const updated = { ...editEval.evaluation, title: values.title.trim(), description: values.description.trim(), end_date: values.endDate.trim(), category_id: values.categoryId };
      await updateEvaluation(updated);
      mutateEvaluationSet(updated.category_id, updated);
      setEditEval(null);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo guardar.");
    } finally {
      setIsSavingEval(false);
    }
  };

  const handleDeleteEval = async () => {
    if (!editEval) return;
    try {
      setIsDeletingEval(true);
      await deleteEvaluation(editEval.evaluation._id);
      mutateEvaluationSet(editEval.evaluation.category_id, null);
      setEditEval(null);
    } catch (e: any) {
      setConfirmDeleteEval(false);
      Alert.alert("Error", e.message ?? "No se pudo eliminar.");
    } finally {
      setIsDeletingEval(false);
    }
  };

  const maxScore = 5;
  const containerWidth = Math.min(width, 512);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: "center" }}>
        <View className="w-full max-w-lg">
          <View style={{ height: 260, position: "relative", overflow: "hidden", borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 8, backgroundColor: "#3F3D56" }}>
            <SvgXml
              xml={COURSE_DETAIL_SVG}
              width={containerWidth}
              height={containerWidth}
              style={{ position: "absolute", bottom: 0, left: 0 }}
            />

            <Button
              variant="secondary"
              onPress={() => router.replace("/home" as any)}
              className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center"
              style={{ position: "absolute", left: 20, top: 24 }}
            >
              <ArrowLeft size={20} color="#1F265E" />
            </Button>

            <View style={{ position: "absolute", right: 20, top: 24, flexDirection: "row", gap: 10 }}>
              <Button
                onPress={() => setIsEnrollOpen(true)}
                variant="secondary"
                disabled={!course}
                className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center"
              >
                <Users size={20} color="#1F265E" />
              </Button>
              <Button
                onPress={() => setIsEditCourseOpen(true)}
                variant="secondary"
                disabled={!course}
                className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center"
              >
                <Edit size={20} color="#1F265E" />
              </Button>
            </View>

            {criteriaScores.length > 0 && (
              <View style={{ position: "absolute", bottom: 24, left: 20, right: 20, gap: 10 }}>
                {criteriaScores.slice(0, 4).map((cs) => (
                  <View key={cs.criteriumId} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ minWidth: 92, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 }}>
                      <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }} numberOfLines={1}>{cs.name}</Text>
                    </View>
                    <View style={{ flex: 1, height: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 4, overflow: "hidden" }}>
                      <View style={{ width: `${Math.min((cs.avg / maxScore) * 100, 100)}%`, height: "100%", backgroundColor: "#fff", borderRadius: 4 }} />
                    </View>
                    <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700", width: 32, textAlign: "right" }}>{cs.avg.toFixed(1)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            <Text style={{ fontSize: 28, fontWeight: "700", color: "#111827" }}>{course?.name ?? "Curso"}</Text>
            {!!course?.description && (
              <Text style={{ fontSize: 13, color: "#9CA3AF", fontStyle: "italic", marginTop: 8, lineHeight: 20 }}>
                {course.description}
              </Text>
            )}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginTop: 20, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex-1">
              <TabsList className="bg-transparent h-auto rounded-none p-0 gap-6">
                {(["evaluaciones", "categorias"] as const).map((t) => (
                  <TabsTrigger
                    key={t}
                    value={t}
                    className="bg-transparent rounded-none px-0 pb-3 h-auto"
                    style={{ borderBottomWidth: tab === t ? 2 : 0, borderBottomColor: PRIMARY }}
                  >
                    <Text className="text-[13px] font-bold tracking-[0.5px]" style={{ color: tab === t ? PRIMARY : "#9CA3AF" }}>
                      {t.toUpperCase()}
                    </Text>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {tab === "categorias" && (
              isImporting && importProgress ? (
                <View style={{ marginBottom: 10, alignItems: "center", justifyContent: "center", width: 38, height: 38 }}>
                  <CircleProgress completed={importProgress.completed} total={importProgress.total} size={38} />
                </View>
              ) : (
                <Button
                  variant="secondary"
                  onPress={handleImportCsv}
                  disabled={isImporting}
                  className="rounded-full"
                  style={{ paddingHorizontal: 14, paddingVertical: 8, marginBottom: 10 }}
                >
                  <Text>Importar</Text>
                </Button>
              )
            )}
            <Button
              onPress={tab === "evaluaciones" ? () => setIsCreateEvalOpen(true) : () => setIsCreateCatOpen(true)}
              className="rounded-full"
              style={{ paddingHorizontal: 14, paddingVertical: 8, marginBottom: 10, marginLeft: 10 }}
            >
              <Text>{tab === "evaluaciones" ? "Añadir" : "Añadir"}</Text>
            </Button>
          </View>

          {isLoading ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <ActivityIndicator color={PRIMARY} size="large" />
            </View>
          ) : tab === "evaluaciones" ? (
            <EvaluacionesTab
              evalList={evalList}
              onEditEval={setEditEval}
            />
          ) : (
            <>
              <CategoriasTab
                categoryData={categoryData}
                onSelectCategory={setSelectedCategory}
                suppressEmpty={isImporting}
              />
              {isImporting && importProgress && (
                <View style={{ paddingHorizontal: 20 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 18 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(129,140,248,0.1)", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                      <CircleProgress completed={importProgress.completed} total={importProgress.total} size={34} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "700", fontSize: 15, color: "#818CF8" }}>Importando categorías...</Text>
                      <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>No cierres ni recargues la pantalla</Text>
                    </View>
                  </View>
                  <View style={{ height: 1, backgroundColor: "#F3F4F6" }} />
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Crear evaluación */}
      <Drawer open={isCreateEvalOpen} onOpenChange={(o) => { if (!o) setIsCreateEvalOpen(false); }}>
        <DrawerContent>
          <DrawerTitle style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>Crear evaluación</DrawerTitle>
          <View style={{ flex: 1 }}>
            <View className="flex-row items-center px-5 pt-4 pb-4 border-b border-muted">
              <Button variant="secondary" onPress={() => setIsCreateEvalOpen(false)} className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center">
                <X size={20} color="#1F265E" />
              </Button>
              <Text variant="h4" className="text-center flex-1">CREAR EVALUACIÓN</Text>
              <View style={{ width: 50 }} />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
              <CreateEvaluationForm
                courseId={courseId!}
                onCreated={(ev) => { mutateEvaluationSet(ev.category_id, ev); setIsCreateEvalOpen(false); }}
                onCancel={() => setIsCreateEvalOpen(false)}
              />
            </ScrollView>
          </View>
        </DrawerContent>
      </Drawer>

      {/* Editar evaluación */}
      <Drawer open={!!editEval} onOpenChange={(o) => { if (!o) { setEditEval(null); setConfirmDeleteEval(false); } }}>
        <DrawerContent>
          <DrawerTitle style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>Editar evaluación</DrawerTitle>
          <View style={{ flex: 1 }}>
            <View className="flex-row items-center px-5 pt-4 pb-4 border-b border-muted">
              <Button variant="secondary" onPress={() => setEditEval(null)} className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center">
                <X size={20} color="#1F265E" />
              </Button>
              <Text variant="h4" className="text-center flex-1">EDITAR EVALUACIÓN</Text>
              <View style={{ width: 50 }} />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
              {editEval && (
                <>
                  <EditEvaluationForm
                    ref={editFormRef}
                    evaluation={editEval.evaluation}
                    categories={categoryData.map((cd) => ({ _id: cd.category._id, name: cd.category.name }))}
                  />
                  <View className="h-px bg-muted mt-6 mb-6" />
                  <EvaluationCriteriaForm evaluation={editEval.evaluation} />
                </>
              )}
            </ScrollView>
            {/* Fixed footer */}
            <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, borderTopWidth: 1, borderTopColor: "#F3F4F6", gap: 8 }}>
              {confirmDeleteEval ? (
                <>
                  <Text style={{ textAlign: "center", fontSize: 13, color: "#EF4444", fontWeight: "600" }}>
                    ¿Eliminar "{editEval?.evaluation.title}"?
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Button variant="secondary" onPress={() => setConfirmDeleteEval(false)} className="flex-1 rounded-full" style={{ paddingVertical: 14 }} disabled={isDeletingEval}>
                      <Text>Cancelar</Text>
                    </Button>
                    <Button variant="destructive" onPress={handleDeleteEval} className="flex-1 rounded-full" style={{ paddingVertical: 14 }} disabled={isDeletingEval}>
                      <Text>{isDeletingEval ? "..." : "Eliminar"}</Text>
                    </Button>
                  </View>
                </>
              ) : (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button onPress={handleSaveEval} disabled={isSavingEval} className="flex-1 rounded-full" style={{ paddingVertical: 14 }}>
                    <Text>{isSavingEval ? "..." : "Guardar"}</Text>
                  </Button>
                  <Button variant="destructive" onPress={() => setConfirmDeleteEval(true)} className="flex-1 rounded-full" style={{ paddingVertical: 14 }}>
                    <Text>Eliminar</Text>
                  </Button>
                </View>
              )}
            </View>
          </View>
        </DrawerContent>
      </Drawer>

      {/* Crear categoría */}
      <Drawer open={isCreateCatOpen} onOpenChange={(o) => { if (!o) setIsCreateCatOpen(false); }}>
        <DrawerContent>
          <DrawerTitle style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>Crear categoría</DrawerTitle>
          <View style={{ flex: 1 }}>
            <View className="flex-row items-center px-5 pt-4 pb-4 border-b border-muted">
              <Button variant="secondary" onPress={() => setIsCreateCatOpen(false)} className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center">
                <X size={20} color="#1F265E" />
              </Button>
              <Text variant="h4" className="text-center flex-1">CREAR CATEGORÍA</Text>
              <View style={{ width: 50 }} />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
              <AddCategoryForm
                courseId={courseId!}
                onCreated={(cat) => { mutateCategoryAdd(cat); setIsCreateCatOpen(false); }}
                onCancel={() => setIsCreateCatOpen(false)}
              />
            </ScrollView>
          </View>
        </DrawerContent>
      </Drawer>

      {/* Editar curso */}
      <Drawer open={isEditCourseOpen} onOpenChange={(o) => { if (!o) setIsEditCourseOpen(false); }}>
        <DrawerContent>
          <DrawerTitle style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>Editar curso</DrawerTitle>
          <View style={{ flex: 1 }}>
            <View className="flex-row items-center px-5 pt-4 pb-4 border-b border-muted">
              <Button variant="secondary" onPress={() => setIsEditCourseOpen(false)} className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center">
                <X size={20} color="#1F265E" />
              </Button>
              <Text variant="h4" className="text-center flex-1">EDITAR CURSO</Text>
              <View style={{ width: 50 }} />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
              {course && (
                <UpdateCourseForm
                  course={course}
                  onCancel={() => setIsEditCourseOpen(false)}
                  onDeleted={() => router.replace("/home" as any)}
                />
              )}
            </ScrollView>
          </View>
        </DrawerContent>
      </Drawer>

      {/* Estudiantes */}
      <Drawer open={isEnrollOpen} onOpenChange={(o) => { if (!o) setIsEnrollOpen(false); }}>
        <DrawerContent>
          <DrawerTitle style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>Estudiantes del curso</DrawerTitle>
          <View style={{ flex: 1 }}>
            <View className="flex-row items-center px-5 pt-4 pb-4 border-b border-muted">
              <Button variant="secondary" onPress={() => setIsEnrollOpen(false)} className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center">
                <X size={20} color="#1F265E" />
              </Button>
              <Text variant="h4" className="text-center flex-1">ESTUDIANTES</Text>
              <View style={{ width: 50 }} />
            </View>
            <View style={{ flex: 1 }}>
              {courseId && <EnrollStudentsForm courseId={courseId} />}
            </View>
          </View>
        </DrawerContent>
      </Drawer>

      {/* Categoría (grupos + editar + eliminar) */}
      {selectedCategory && courseId && (
        <CategoryDrawer
          courseId={courseId}
          category={selectedCategory}
          open={!!selectedCategory}
          onClose={() => setSelectedCategory(null)}
          onCategoryUpdated={(cat) => { mutateCategoryUpdate(cat); setSelectedCategory(null); }}
          onCategoryDeleted={(catId) => { mutateCategoryDelete(catId); setSelectedCategory(null); }}
        />
      )}
    </View>
  );
}

function CircleProgress({ completed, total, size = 48 }: { completed: number; total: number; size?: number }) {
  const sw = 4;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? completed / total : 0;
  const offset = circ * (1 - pct);
  const c = size / 2;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={c} cy={c} r={r} stroke="#F3F4F6" strokeWidth={sw} fill="none" />
        <Circle
          cx={c} cy={c} r={r}
          stroke="#818CF8"
          strokeWidth={sw}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${c} ${c})`}
        />
      </Svg>
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 8, fontWeight: "700", color: "#111827", lineHeight: 10 }}>
          {completed}/{total}
        </Text>
      </View>
    </View>
  );
}
