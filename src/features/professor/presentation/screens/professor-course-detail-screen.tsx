import { COURSE_DETAIL_SVG } from "@/assets/svgs/courseDetail";
import { Text } from "@/core/components/ui/text";
import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-provider";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import {
  Category,
  Criterium,
  Group,
  ProfessorEvaluation,
  ResultEvaluation,
} from "@/features/professor/domain/entities/professor";
import { ProfessorRepository } from "@/features/professor/domain/repositories/professor-repository";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { RelativePathString, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SvgXml } from "react-native-svg";
import { useProfessor } from "../context/professor-context";

const PRIMARY = "#818CF8";
const PRIMARY_LIGHT = "rgba(129,140,248,0.15)";

type CategoryWithData = {
  category: Category;
  evaluation: ProfessorEvaluation | null;
  groups: Group[];
};

type EvalListItem = {
  evaluation: ProfessorEvaluation;
  categoryName: string;
  avgScore: number | null;
};

type CriteriumScore = { criterium: Criterium; avg: number };

export function ProfessorCourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const di = useDI();
  const { loggedUser, expireSession } = useAuth();
  const { myCourses, myCriteria } = useProfessor();
  const repo = useMemo(() => di.resolve<ProfessorRepository>(TOKENS.ProfessorRepo), [di]);

  const course = useMemo(() => myCourses.find((c) => c._id === courseId), [myCourses, courseId]);

  const [tab, setTab] = useState<"evaluaciones" | "categorias">("evaluaciones");
  const [categoryData, setCategoryData] = useState<CategoryWithData[]>([]);
  const [criteriaScores, setCriteriaScores] = useState<CriteriumScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  const load = useCallback(async () => {
    if (!courseId || !loggedUser) return;
    try {
      setIsLoading(true);
      const cats = await repo.getCategoriesByCourse(courseId);
      const withData = await Promise.all(
        cats.map(async (cat) => {
          const [ev, groups] = await Promise.all([
            repo.getEvaluationByCategory(cat._id),
            repo.getGroupsByCategory(cat._id),
          ]);
          return { category: cat, evaluation: ev, groups };
        }),
      );
      setCategoryData(withData);

      // Compute criteria avg scores
      if (myCriteria.length > 0) {
        const allResults: ResultEvaluation[] = [];
        for (const cd of withData) {
          for (const g of cd.groups) {
            const res = await repo.getResultsByGroup(g._id);
            allResults.push(...res);
          }
        }
        const scores: CriteriumScore[] = myCriteria.map((c) => {
          const vals = allResults.filter((r) => r.criterium_id === c._id).map((r) => Number(r.score));
          const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
          return { criterium: c, avg };
        });
        setCriteriaScores(scores);
      }
    } catch (e: any) {
      if (e?.message?.includes("401")) { await expireSession(); return; }
    } finally {
      setIsLoading(false);
    }
  }, [courseId, loggedUser, myCriteria]);

  useEffect(() => { load(); }, [load]);

  const evalList: EvalListItem[] = useMemo(
    () =>
      categoryData
        .filter((cd) => cd.evaluation !== null)
        .map((cd) => ({ evaluation: cd.evaluation!, categoryName: cd.category.name, avgScore: null })),
    [categoryData],
  );

  const handleImportCsv = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["text/csv", "text/comma-separated-values", "application/csv", "*/*"] });
      if (result.canceled || !result.assets?.[0]) return;
      setIsImporting(true);
      const content = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 });
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

    const existingCats = await repo.getCategoriesByCourse(cId);
    const catMap = new Map(existingCats.map((c) => [c.name.toLowerCase().trim(), c]));

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const catName = cols[catIdx]?.trim();
      const grpName = cols[grpIdx]?.trim();
      const email = emailIdx >= 0 ? cols[emailIdx]?.trim().toLowerCase() : undefined;
      if (!catName || !grpName) continue;

      // Ensure category exists
      if (!catMap.has(catName.toLowerCase())) {
        await repo.addCategory({ name: catName, description: "", course_id: cId });
        const updated = await repo.getCategoriesByCourse(cId);
        updated.forEach((c) => catMap.set(c.name.toLowerCase().trim(), c));
      }
      const cat = catMap.get(catName.toLowerCase())!;

      // Ensure group exists
      const groups = await repo.getGroupsByCategory(cat._id);
      let group = groups.find((g) => g.name.toLowerCase() === grpName.toLowerCase());
      if (!group) {
        await repo.addGroup({ name: grpName, category_id: cat._id });
        const updated = await repo.getGroupsByCategory(cat._id);
        group = updated.find((g) => g.name.toLowerCase() === grpName.toLowerCase());
      }

      // Enroll user if email provided
      if (group && email) {
        const user = await repo.getUserByEmail(email);
        if (user) {
          const members = await repo.getMembersByGroup(group._id);
          const alreadyIn = members.some((m) => m.userId === user.userId);
          if (!alreadyIn) await repo.addMemberToGroup(user.userId, group._id);
        }
      }
    }
  };

  const maxScore = 5;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ height: 240, position: "relative", overflow: "hidden", borderBottomLeftRadius: 12, borderBottomRightRadius: 12, marginBottom: 8 }}>
          <SvgXml xml={COURSE_DETAIL_SVG} width={width} height={width} style={{ position: "absolute", bottom: 0, left: 0 }} />

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ position: "absolute", left: 20, top: 52, width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(230,231,242,0.85)", alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="arrow-back" size={20} color="#1F265E" />
          </TouchableOpacity>

          {/* Edit button */}
          <TouchableOpacity
            onPress={() => {/* future: edit course */ }}
            style={{ position: "absolute", right: 20, top: 52, width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(230,231,242,0.85)", alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="create-outline" size={20} color="#1F265E" />
          </TouchableOpacity>

          {/* Criteria progress bars */}
          {criteriaScores.length > 0 && (
            <View style={{ position: "absolute", bottom: 20, left: 20, right: 20, gap: 6 }}>
              {criteriaScores.slice(0, 4).map((cs) => (
                <View key={cs.criterium._id} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 96, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ color: "#fff", fontSize: 10, fontWeight: "600" }} numberOfLines={1}>{cs.criterium.name}</Text>
                  </View>
                  <View style={{ flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 3 }}>
                    <View style={{ width: `${Math.min((cs.avg / maxScore) * 100, 100)}%`, height: "100%", backgroundColor: "#fff", borderRadius: 3 }} />
                  </View>
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", width: 28, textAlign: "right" }}>{cs.avg.toFixed(1)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Course info */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#111827" }}>{course?.name ?? "Curso"}</Text>
          {!!course?.description && (
            <Text style={{ fontSize: 13, color: "#9CA3AF", fontStyle: "italic", marginTop: 8, lineHeight: 20 }}>
              {course.description}
            </Text>
          )}
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: "row", paddingHorizontal: 20, marginTop: 20, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
          {(["evaluaciones", "categorias"] as const).map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={{ marginRight: 24, paddingBottom: 12, borderBottomWidth: tab === t ? 2 : 0, borderBottomColor: PRIMARY }}>
              <Text style={{ fontSize: 13, fontWeight: "700", letterSpacing: 0.5, color: tab === t ? PRIMARY : "#9CA3AF" }}>
                {t.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator color={PRIMARY} size="large" />
          </View>
        ) : tab === "evaluaciones" ? (
          <EvaluacionesTab evalList={evalList} courseId={courseId!} />
        ) : (
          <CategoriasTab
            categoryData={categoryData}
            courseId={courseId!}
            onImport={handleImportCsv}
            isImporting={isImporting}
            onRefresh={load}
            repo={repo}
          />
        )}
      </ScrollView>
    </View>
  );
}

// ─── EVALUACIONES TAB ────────────────────────────────────────────────────────

function EvaluacionesTab({ evalList, courseId }: { evalList: EvalListItem[]; courseId: string }) {
  const router = useRouter();
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 }}>
      {evalList.length === 0 ? (
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
          <Text style={{ color: "#9CA3AF" }}>Sin evaluaciones aún</Text>
        </View>
      ) : (
        evalList.map((item) => (
          <View key={item.evaluation._id}>
            <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 16 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: PRIMARY_LIGHT, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                <Ionicons name="create-outline" size={20} color={PRIMARY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", fontSize: 15, color: "#111827" }}>{item.evaluation.title}</Text>
                <Text style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                  {item.categoryName}{item.evaluation.end_date ? ` · ${formatDate(item.evaluation.end_date)}` : ""}
                </Text>
              </View>
            </View>
            <View style={{ height: 1, backgroundColor: "#F3F4F6" }} />
          </View>
        ))
      )}
      <TouchableOpacity
        onPress={() => router.push(`/professor-course/${courseId}/create-evaluation` as RelativePathString)}
        style={{ backgroundColor: PRIMARY, borderRadius: 30, paddingVertical: 16, alignItems: "center", marginTop: 24 }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", letterSpacing: 1 }}>CREAR UN NUEVA EVALUACION</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── CATEGORIAS TAB ───────────────────────────────────────────────────────────

function CategoriasTab({
  categoryData,
  courseId,
  onImport,
  isImporting,
  onRefresh,
  repo,
}: {
  categoryData: CategoryWithData[];
  courseId: string;
  onImport: () => void;
  isImporting: boolean;
  onRefresh: () => void;
  repo: ProfessorRepository;
}) {
  const router = useRouter();
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 }}>
      {/* Import card */}
      <TouchableOpacity
        onPress={onImport}
        disabled={isImporting}
        style={{ borderWidth: 1.5, borderColor: PRIMARY, borderStyle: "dashed", borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 16, backgroundColor: PRIMARY_LIGHT }}
      >
        {isImporting ? (
          <ActivityIndicator color={PRIMARY} />
        ) : (
          <>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <Ionicons name="cloud-upload-outline" size={22} color="#fff" />
            </View>
            <Text style={{ color: PRIMARY, fontWeight: "700", fontSize: 15, marginBottom: 4 }}>Importar desde Brightspace</Text>
            <Text style={{ color: "#9CA3AF", fontSize: 12, marginBottom: 14 }}>CSV o JSON con categorías y grupos</Text>
            <View style={{ backgroundColor: PRIMARY, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 20 }}>
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>Seleccionar archivo</Text>
            </View>
          </>
        )}
      </TouchableOpacity>

      {/* Category list */}
      {categoryData.map((cd) => (
        <View key={cd.category._id}>
          <TouchableOpacity
            onPress={() => router.push(`/professor-course/${courseId}/category/${cd.category._id}` as RelativePathString)}
            style={{ flexDirection: "row", alignItems: "center", paddingVertical: 18 }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: PRIMARY_LIGHT, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
              <Ionicons name="create-outline" size={20} color={PRIMARY} />
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
        onPress={() => router.push(`/professor-course/${courseId}/create-category` as RelativePathString)}
        style={{ backgroundColor: PRIMARY, borderRadius: 30, paddingVertical: 16, alignItems: "center", marginTop: 24 }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", letterSpacing: 1 }}>CREAR UN NUEVA CATEGORIA</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}
