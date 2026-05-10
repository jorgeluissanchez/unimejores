import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/core/components/ui/drawer";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { Textarea } from "@/core/components/ui/textarea";
import { TOKENS } from "@/core/constants/tokens";
import { useDI } from "@/core/di/di-provider";
import { useAuth } from "@/features/auth/presentation/context/auth-context";
import {
    Criterium,
    EvaluationCriterium,
    ProfessorEvaluation,
} from "@/features/professor/domain/entities/professor";
import { ProfessorRepository } from "@/features/professor/domain/repositories/professor-repository";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";

export function ProfessorCategoryDetailScreen() {
  const { categoryId } = useLocalSearchParams<{ courseId: string; categoryId: string }>();
  const di = useDI();
  const { loggedUser, expireSession } = useAuth();
  const repo = useMemo(() => di.resolve<ProfessorRepository>(TOKENS.ProfessorRepo), [di]);

  const [evaluation, setEvaluation] = useState<ProfessorEvaluation | null>(null);
  const [linkedCriteria, setLinkedCriteria] = useState<Criterium[]>([]);
  const [evalCriteria, setEvalCriteria] = useState<EvaluationCriterium[]>([]);
  const [myCriteria, setMyCriteria] = useState<Criterium[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditEvalOpen, setIsEditEvalOpen] = useState(false);
  const [isAddCriteriumOpen, setIsAddCriteriumOpen] = useState(false);

  // Evaluation form
  const [evalTitle, setEvalTitle] = useState("");
  const [evalDesc, setEvalDesc] = useState("");
  const [evalStart, setEvalStart] = useState("");
  const [evalEnd, setEvalEnd] = useState("");
  const [evalTitleError, setEvalTitleError] = useState("");

  const load = useCallback(async () => {
    if (!categoryId || !loggedUser) return;
    try {
      setIsLoading(true);
      setError(null);
      const [ev, criteria] = await Promise.all([
        repo.getEvaluationByCategory(categoryId),
        repo.getMyCriteria(loggedUser.userId),
      ]);
      setEvaluation(ev);
      setMyCriteria(criteria);
      if (ev) {
        const [linked, links] = await Promise.all([
          repo.getCriteriaForEvaluation(ev._id),
          repo.getEvaluationCriteria(ev._id),
        ]);
        setLinkedCriteria(linked);
        setEvalCriteria(links);
      } else {
        setLinkedCriteria([]);
        setEvalCriteria([]);
      }
    } catch (e: any) {
      if (e?.message?.includes("401")) { await expireSession(); return; }
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, loggedUser]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (ev: ProfessorEvaluation | null) => {
    setEvalTitle(ev?.title ?? "");
    setEvalDesc(ev?.description ?? "");
    setEvalStart(ev?.start_date ?? "");
    setEvalEnd(ev?.end_date ?? "");
    setEvalTitleError("");
    setIsEditEvalOpen(true);
  };

  const handleSaveEval = async () => {
    if (!evalTitle.trim()) { setEvalTitleError("El título es obligatorio"); return; }
    try {
      if (evaluation) {
        await repo.updateEvaluation({ ...evaluation, title: evalTitle.trim(), description: evalDesc.trim(), start_date: evalStart.trim(), end_date: evalEnd.trim() });
      } else {
        await repo.createEvaluation({ title: evalTitle.trim(), description: evalDesc.trim(), start_date: evalStart.trim(), end_date: evalEnd.trim(), category_id: categoryId! });
      }
      setIsEditEvalOpen(false);
      await load();
    } catch (e: any) { setError(e.message); }
  };

  const handleAddCriterium = async (criterium: Criterium) => {
    if (!evaluation) return;
    const alreadyLinked = evalCriteria.some((ec) => ec.criterium_id === criterium._id);
    if (alreadyLinked) return;
    try {
      await repo.addCriteriumToEvaluation(evaluation._id, criterium._id);
      setIsAddCriteriumOpen(false);
      await load();
    } catch (e: any) { setError(e.message); }
  };

  const handleRemoveCriterium = async (criterium: Criterium) => {
    if (!evaluation) return;
    const link = evalCriteria.find((ec) => ec.criterium_id === criterium._id);
    if (!link) return;
    try {
      await repo.removeCriteriumFromEvaluation(link._id);
      await load();
    } catch (e: any) { setError(e.message); }
  };

  const availableCriteria = myCriteria.filter((c) => !evalCriteria.some((ec) => ec.criterium_id === c._id));

  if (isLoading) {
    return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>;
  }

  return (
    <View className="flex-1 p-4 gap-4">
      {!!error && <Text className="text-destructive">{error}</Text>}

      {/* Evaluación */}
      <Card>
        <CardHeader>
          <View className="flex-row items-center gap-2">
            <CardTitle className="flex-1">Evaluación</CardTitle>
            <Button size="sm" onPress={() => openEdit(evaluation)}>
              <Text>{evaluation ? "Editar" : "Crear"}</Text>
            </Button>
          </View>
        </CardHeader>
        <CardContent>
          {evaluation ? (
            <View className="gap-1">
              <Text className="font-semibold">{evaluation.title}</Text>
              {!!evaluation.description && <Text className="text-sm text-muted-foreground">{evaluation.description}</Text>}
              {!!evaluation.start_date && <Text className="text-sm text-muted-foreground">Inicio: {evaluation.start_date}</Text>}
              {!!evaluation.end_date && <Text className="text-sm text-muted-foreground">Fin: {evaluation.end_date}</Text>}
            </View>
          ) : (
            <Text className="text-muted-foreground">Esta categoría no tiene evaluación aún</Text>
          )}
        </CardContent>
      </Card>

      {/* Criterios de la evaluación */}
      {evaluation && (
        <View className="flex-1 gap-2">
          <View className="flex-row items-center gap-2">
            <Text variant="h4" className="flex-1">Criterios</Text>
            <Button size="sm" onPress={() => setIsAddCriteriumOpen(true)} disabled={availableCriteria.length === 0}>
              <Text>Añadir</Text>
            </Button>
          </View>
          {linkedCriteria.length === 0 ? (
            <Text className="text-muted-foreground">Sin criterios vinculados</Text>
          ) : (
            <FlatList
              data={linkedCriteria}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ gap: 8, paddingBottom: 88 }}
              renderItem={({ item }) => (
                <Card>
                  <CardContent className="py-3">
                    <View className="flex-row items-center gap-2">
                      <View className="flex-1">
                        <Text className="font-semibold">{item.name}</Text>
                        {!!item.description && <Text className="text-sm text-muted-foreground">{item.description}</Text>}
                      </View>
                      <Button size="sm" variant="destructive" onPress={() => handleRemoveCriterium(item)}>
                        <Text>Quitar</Text>
                      </Button>
                    </View>
                  </CardContent>
                </Card>
              )}
            />
          )}
        </View>
      )}

      {/* Drawer crear/editar evaluación */}
      <Drawer open={isEditEvalOpen} onOpenChange={(o) => { if (!o) setIsEditEvalOpen(false); }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{evaluation ? "Editar evaluación" : "Crear evaluación"}</DrawerTitle>
            <DrawerDescription>Configura la evaluación de esta categoría</DrawerDescription>
          </DrawerHeader>
          <View className="px-4 gap-3 pb-8">
            <View className="gap-1.5">
              <Label>Título</Label>
              <Input value={evalTitle} onChangeText={(v) => { setEvalTitle(v); setEvalTitleError(""); }} className={evalTitleError ? "border-destructive" : undefined} />
              {!!evalTitleError && <Text className="text-sm text-destructive">{evalTitleError}</Text>}
            </View>
            <View className="gap-1.5">
              <Label>Descripción</Label>
              <Textarea value={evalDesc} onChangeText={setEvalDesc} />
            </View>
            <View className="gap-1.5">
              <Label>Fecha inicio (YYYY-MM-DD)</Label>
              <Input value={evalStart} onChangeText={setEvalStart} placeholder="2025-01-01" />
            </View>
            <View className="gap-1.5">
              <Label>Fecha fin (YYYY-MM-DD)</Label>
              <Input value={evalEnd} onChangeText={setEvalEnd} placeholder="2025-06-01" />
            </View>
            <View className="flex-row justify-end gap-2">
              <Button variant="outline" onPress={() => setIsEditEvalOpen(false)}><Text>Cancelar</Text></Button>
              <Button onPress={handleSaveEval}><Text>Guardar</Text></Button>
            </View>
          </View>
        </DrawerContent>
      </Drawer>

      {/* Drawer añadir criterio */}
      <Drawer open={isAddCriteriumOpen} onOpenChange={(o) => { if (!o) setIsAddCriteriumOpen(false); }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Añadir criterio</DrawerTitle>
            <DrawerDescription>Selecciona un criterio creado por ti</DrawerDescription>
          </DrawerHeader>
          {availableCriteria.length === 0 ? (
            <Text className="text-muted-foreground py-4 text-center px-4">Todos tus criterios ya están añadidos</Text>
          ) : (
            <FlatList
              data={availableCriteria}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 32 }}
              renderItem={({ item }) => (
                <Card>
                  <CardContent className="py-3">
                    <View className="flex-row items-center gap-2">
                      <View className="flex-1">
                        <Text className="font-semibold">{item.name}</Text>
                        {!!item.description && <Text className="text-sm text-muted-foreground">{item.description}</Text>}
                      </View>
                      <Button size="sm" onPress={() => handleAddCriterium(item)}><Text>Añadir</Text></Button>
                    </View>
                  </CardContent>
                </Card>
              )}
            />
          )}
        </DrawerContent>
      </Drawer>
    </View>
  );
}
