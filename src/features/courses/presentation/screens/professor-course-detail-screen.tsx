import { COURSE_DETAIL_SVG } from "@/assets/svgs/courseDetail";
import { Button } from "@/core/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/core/components/ui/drawer";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { Textarea } from "@/core/components/ui/textarea";
import { parseCsvLine } from "@/core/lib/utils";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import { Category, Group } from "@/features/courses/domain/entities/course";
import { AddCategoryForm } from "@/features/courses/presentation/components/forms/add-category-form";
import { EnrollStudentsForm } from "@/features/courses/presentation/components/forms/enroll-students-form";
import { UpdateCourseForm } from "@/features/courses/presentation/components/forms/update-course-form";
import { useCourses } from "@/features/courses/presentation/context/course-context";
import { ProfessorCategoryGroupsScreen } from "@/features/courses/presentation/screens/professor-category-groups-screen";
import { Evaluation, ResultEvaluation } from "@/features/evaluation/domain/entities/evaluation";
import { CreateEvaluationForm } from "@/features/evaluation/presentation/components/forms/create-evaluation-form";
import { useEvaluation } from "@/features/evaluation/presentation/context/evaluation-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CloudUpload, Edit, SquarePen, Users, X } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SvgXml } from "react-native-svg";

const PRIMARY = "#818CF8";
const PRIMARY_LIGHT = "rgba(129,140,248,0.15)";

type CategoryWithData = {
  category: Category;
  evaluation: Evaluation | null;
  groups: Group[];
};

type EvalListItem = {
  evaluation: Evaluation;
  categoryName: string;
};

export function ProfessorCourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { loggedUser } = useAuth();
  const {
    courses,
    getCategoriesByCourse,
    getGroupsByCategory,
    addCategory,
    addGroup,
    getUserByEmail,
    getMembersByGroup,
    addMemberToGroup,
  } = useCourses();

  const {
    myCriteria,
    getEvaluationByCategory,
    getResultsByGroup,
    updateEvaluation,
    deleteEvaluation,
  } = useEvaluation();

  const course = useMemo(() => courses.find((c) => c._id === courseId), [courses, courseId]);

  const [tab, setTab] = useState<"evaluaciones" | "categorias">("evaluaciones");
  const [categoryData, setCategoryData] = useState<CategoryWithData[]>([]);
  const [criteriaScores, setCriteriaScores] = useState<{ criteriumId: string; name: string; avg: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isCreateEvalOpen, setIsCreateEvalOpen] = useState(false);
  const [editEval, setEditEval] = useState<EvalListItem | null>(null);
  const [isCreateCatOpen, setIsCreateCatOpen] = useState(false);
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

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
        const allResults: ResultEvaluation[] = [];
        for (const cd of withData) {
          for (const g of cd.groups) {
            const res = await getResultsByGroup(g._id);
            allResults.push(...res);
          }
        }
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
      setIsImporting(true);
      const content = await new FileSystem.File(result.assets[0].uri).text();
      await parseBrightspaceCsv(content, courseId!);
      await load();
      Alert.alert("Importación completa", "Las categorías y grupos se han creado correctamente.");
    } catch (e: any) {
      Alert.alert("Error al importar", e.message ?? "No se pudo procesar el archivo.");
    } finally {
      setIsImporting(false);
    }
  };

  const parseBrightspaceCsv = async (csv: string, cId: string) => {
    const text = csv.replace(/^﻿/, "");
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new Error("El CSV está vacío o no tiene datos.");

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const idx = (name: string) => headers.findIndex((h) => h.toLowerCase().includes(name.toLowerCase()));

    const catIdx = idx("category");
    const grpIdx = idx("group name");
    const emailIdx = idx("username");

    if (catIdx < 0 || grpIdx < 0) throw new Error("El CSV debe tener columnas 'Group Category Name' y 'Group Name'.");

    const existingCats = await getCategoriesByCourse(cId);
    const catMap = new Map(existingCats.map((c) => [c.name.toLowerCase().trim(), c]));

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const catName = cols[catIdx]?.trim();
      const grpName = cols[grpIdx]?.trim();
      const email = emailIdx >= 0 ? cols[emailIdx]?.trim().toLowerCase() : undefined;
      if (!catName || !grpName) continue;

      if (!catMap.has(catName.toLowerCase())) {
        await addCategory({ name: catName, description: "", course_id: cId });
        const updated = await getCategoriesByCourse(cId);
        updated.forEach((c) => catMap.set(c.name.toLowerCase().trim(), c));
      }
      const cat = catMap.get(catName.toLowerCase())!;

      const groups = await getGroupsByCategory(cat._id);
      let group = groups.find((g) => g.name.toLowerCase() === grpName.toLowerCase());
      if (!group) {
        await addGroup({ name: grpName, category_id: cat._id });
        const updated = await getGroupsByCategory(cat._id);
        group = updated.find((g) => g.name.toLowerCase() === grpName.toLowerCase());
      }

      if (group && email) {
        const user = await getUserByEmail(email);
        if (user) {
          const members = await getMembersByGroup(group._id);
          if (!members.some((m) => m.userId === user.userId)) {
            await addMemberToGroup(user.userId, group._id);
          }
        }
      }
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
            <View style={{ flex: 1, flexDirection: "row" }}>
              {(["evaluaciones", "categorias"] as const).map((t) => (
                <TouchableOpacity key={t} onPress={() => setTab(t)} style={{ marginRight: 24, paddingBottom: 12, borderBottomWidth: tab === t ? 2 : 0, borderBottomColor: PRIMARY }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", letterSpacing: 0.5, color: tab === t ? PRIMARY : "#9CA3AF" }}>
                    {t.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {tab === "categorias" && (
              <TouchableOpacity
                onPress={handleImportCsv}
                disabled={isImporting}
                style={{ marginBottom: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: PRIMARY_LIGHT, alignItems: "center", justifyContent: "center" }}
              >
                {isImporting
                  ? <ActivityIndicator size="small" color={PRIMARY} />
                  : <CloudUpload size={18} color={PRIMARY} />
                }
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <ActivityIndicator color={PRIMARY} size="large" />
            </View>
          ) : tab === "evaluaciones" ? (
            <EvaluacionesTab evalList={evalList} courseId={courseId!} onCreateEval={() => setIsCreateEvalOpen(true)} onEditEval={(item) => setEditEval(item)} />
          ) : (
            <CategoriasTab
              categoryData={categoryData}
              courseId={courseId!}
              onCreateCategory={() => setIsCreateCatOpen(true)}
              onSelectCategory={(id) => setSelectedCategoryId(id)}
            />
          )}
        </View>
      </ScrollView>

      <Drawer open={isCreateEvalOpen} onOpenChange={(o) => { if (!o) setIsCreateEvalOpen(false); }}>
        <DrawerContent>
          <DrawerTitle style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>Crear evaluación</DrawerTitle>
          <View className="px-5 pt-4 pb-16" style={{ flex: 1 }}>
            <View className="flex-row items-center mb-6">
              <Button variant="secondary" onPress={() => setIsCreateEvalOpen(false)} className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center">
                <X size={20} color="#1F265E" />
              </Button>
              <Text variant="h4" className="text-center flex-1">CREAR EVALUACIÓN</Text>
              <View style={{ width: 50 }} />
            </View>
            <CreateEvaluationForm courseId={courseId!} onCancel={async () => { setIsCreateEvalOpen(false); await load(); }} />
          </View>
        </DrawerContent>
      </Drawer>

      <Drawer open={!!editEval} onOpenChange={(o) => { if (!o) setEditEval(null); }}>
        <DrawerContent>
          <DrawerTitle style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>Editar evaluación</DrawerTitle>
          <View className="px-5 pt-4 pb-16" style={{ flex: 1 }}>
            <View className="flex-row items-center mb-6">
              <Button variant="secondary" onPress={() => setEditEval(null)} className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center">
                <X size={20} color="#1F265E" />
              </Button>
              <Text variant="h4" className="text-center flex-1">EDITAR EVALUACIÓN</Text>
              <View style={{ width: 50 }} />
            </View>
            {editEval && (
              <EditEvaluationInline
                evaluation={editEval.evaluation}
                categoryName={editEval.categoryName}
                onCancel={async () => { setEditEval(null); await load(); }}
                updateEvaluation={updateEvaluation}
                deleteEvaluation={deleteEvaluation}
              />
            )}
          </View>
        </DrawerContent>
      </Drawer>

      <Drawer open={isCreateCatOpen} onOpenChange={(o) => { if (!o) setIsCreateCatOpen(false); }}>
        <DrawerContent>
          <DrawerTitle style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>Crear categoría</DrawerTitle>
          <View className="px-5 pt-4 pb-16" style={{ flex: 1 }}>
            <View className="flex-row items-center mb-6">
              <Button variant="secondary" onPress={() => setIsCreateCatOpen(false)} className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center">
                <X size={20} color="#1F265E" />
              </Button>
              <Text variant="h4" className="text-center flex-1">CREAR CATEGORÍA</Text>
              <View style={{ width: 50 }} />
            </View>
            <AddCategoryForm courseId={courseId!} onCancel={async () => { setIsCreateCatOpen(false); await load(); }} />
          </View>
        </DrawerContent>
      </Drawer>

      <Drawer open={isEditCourseOpen} onOpenChange={(o) => { if (!o) setIsEditCourseOpen(false); }}>
        <DrawerContent>
          <DrawerTitle style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>Editar curso</DrawerTitle>
          <View className="px-5 pt-4 pb-16" style={{ flex: 1 }}>
            <View className="flex-row items-center mb-6">
              <Button variant="secondary" onPress={() => setIsEditCourseOpen(false)} className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center">
                <X size={20} color="#1F265E" />
              </Button>
              <Text variant="h4" className="text-center flex-1">EDITAR CURSO</Text>
              <View style={{ width: 50 }} />
            </View>
            {course && <UpdateCourseForm course={course} onCancel={() => setIsEditCourseOpen(false)} />}
          </View>
        </DrawerContent>
      </Drawer>

      <Drawer open={isEnrollOpen} onOpenChange={(o) => { if (!o) setIsEnrollOpen(false); }}>
        <DrawerContent>
          <DrawerTitle style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>Estudiantes del curso</DrawerTitle>
          <View className="px-5 pt-4 pb-16" style={{ flex: 1 }}>
            <View className="flex-row items-center mb-6">
              <Button variant="secondary" onPress={() => setIsEnrollOpen(false)} className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center">
                <X size={20} color="#1F265E" />
              </Button>
              <Text variant="h4" className="text-center flex-1">ESTUDIANTES</Text>
              <View style={{ width: 50 }} />
            </View>
            {courseId && <EnrollStudentsForm courseId={courseId} />}
          </View>
        </DrawerContent>
      </Drawer>

      <Drawer open={!!selectedCategoryId} onOpenChange={(o) => { if (!o) setSelectedCategoryId(null); }}>
        <DrawerContent>
          <DrawerTitle style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>Detalle de categoría</DrawerTitle>
          {selectedCategoryId && courseId && (
            <ProfessorCategoryGroupsScreen
              courseId={courseId}
              categoryId={selectedCategoryId}
              onClose={() => { setSelectedCategoryId(null); load(); }}
            />
          )}
        </DrawerContent>
      </Drawer>
    </View>
  );
}

// ─── EVALUACIONES TAB ─────────────────────────────────────────────────────────

function EvaluacionesTab({ evalList, courseId, onCreateEval, onEditEval }: { evalList: EvalListItem[]; courseId: string; onCreateEval: () => void; onEditEval: (item: EvalListItem) => void }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 }}>
      {evalList.length === 0 ? (
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
          <Text style={{ color: "#9CA3AF" }}>Sin evaluaciones aún</Text>
        </View>
      ) : (
        evalList.map((item) => (
          <View key={item.evaluation._id}>
            <TouchableOpacity onPress={() => onEditEval(item)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 16 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: PRIMARY_LIGHT, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                <SquarePen size={20} color={PRIMARY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", fontSize: 15, color: "#111827" }}>{item.evaluation.title}</Text>
                <Text style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                  {item.categoryName}{item.evaluation.end_date ? ` · ${formatDate(item.evaluation.end_date)}` : ""}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={{ height: 1, backgroundColor: "#F3F4F6" }} />
          </View>
        ))
      )}
      <Button onPress={onCreateEval} style={{ marginTop: 16 }}>
        <Text>CREAR UNA NUEVA EVALUACIÓN</Text>
      </Button>
    </View>
  );
}

// ─── Inline edit evaluation form ──────────────────────────────────────────────

function EditEvaluationInline({
  evaluation,
  categoryName,
  onCancel,
  updateEvaluation,
  deleteEvaluation,
}: {
  evaluation: Evaluation;
  categoryName: string;
  onCancel: () => Promise<void>;
  updateEvaluation: (ev: Evaluation) => Promise<void>;
  deleteEvaluation: (id: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(evaluation.title);
  const [description, setDescription] = useState(evaluation.description ?? "");
  const [endDate, setEndDate] = useState((evaluation.end_date ?? "").split("T")[0]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!title.trim()) return;
    try {
      setIsSaving(true);
      await updateEvaluation({ ...evaluation, title: title.trim(), description: description.trim(), end_date: endDate.trim() });
      await onCancel();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Eliminar evaluación",
      `¿Eliminar "${evaluation.title}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteEvaluation(evaluation._id);
              await onCancel();
            } catch (e: any) {
              Alert.alert("Error", e.message ?? "No se pudo eliminar la evaluación.");
            }
          },
        },
      ],
    );
  };

  return (
    <View className="gap-4">
      <View style={{ backgroundColor: "#F3F4F6", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}>
        <Text style={{ fontSize: 11, color: "#9CA3AF", fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" }}>Categoría</Text>
        <Text style={{ fontSize: 14, color: "#374151", fontWeight: "600", marginTop: 2 }}>{categoryName}</Text>
      </View>
      <View className="gap-1.5">
        <Label>Título</Label>
        <Input value={title} onChangeText={setTitle} placeholder="Título de la evaluación" />
      </View>
      <View className="gap-1.5">
        <Label>Descripción</Label>
        <Textarea value={description} onChangeText={setDescription} placeholder="Descripción (opcional)" />
      </View>
      <View className="gap-1.5">
        <Label>Fecha de finalización (YYYY-MM-DD)</Label>
        <Input value={endDate} onChangeText={setEndDate} placeholder="2025-12-31" />
      </View>
      <Button onPress={handleSave} disabled={isSaving} className="rounded-full w-full" style={{ paddingVertical: 18 }}>
        <Text>{isSaving ? "GUARDANDO..." : "GUARDAR"}</Text>
      </Button>
      <Button variant="destructive" onPress={handleDelete} className="rounded-full w-full" style={{ paddingVertical: 18 }}>
        <Text>ELIMINAR EVALUACIÓN</Text>
      </Button>
    </View>
  );
}

// ─── CATEGORIAS TAB ───────────────────────────────────────────────────────────

function CategoriasTab({
  categoryData,
  courseId,
  onCreateCategory,
  onSelectCategory,
}: {
  categoryData: CategoryWithData[];
  courseId: string;
  onCreateCategory: () => void;
  onSelectCategory: (categoryId: string) => void;
}) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 }}>
      {categoryData.map((cd) => (
        <View key={cd.category._id}>
          <TouchableOpacity
            onPress={() => onSelectCategory(cd.category._id)}
            style={{ flexDirection: "row", alignItems: "center", paddingVertical: 18 }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: PRIMARY_LIGHT, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
              <SquarePen size={20} color={PRIMARY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", fontSize: 15, color: "#111827" }}>{cd.category.name}</Text>
              <Text style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                {cd.groups.length} {cd.groups.length === 1 ? "Grupo" : "Grupos"}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: "#F3F4F6" }} />
        </View>
      ))}

      <TouchableOpacity
        onPress={onCreateCategory}
        style={{ backgroundColor: PRIMARY, borderRadius: 30, paddingVertical: 16, alignItems: "center", marginTop: 24 }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", letterSpacing: 1 }}>CREAR UNA NUEVA CATEGORÍA</Text>
      </TouchableOpacity>
    </View>
  );
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}
