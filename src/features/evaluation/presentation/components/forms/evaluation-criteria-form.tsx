import { Button } from "@/core/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/core/components/ui/combobox";
import { Label } from "@/core/components/ui/label";
import { Text } from "@/core/components/ui/text";
import { Criterium, Evaluation, EvaluationCriterium } from "@/features/evaluation/domain/entities/evaluation";
import { useEvaluation } from "@/features/evaluation/presentation/context/evaluation-context";
import { Minus } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";

type Props = { evaluation: Evaluation };

export function EvaluationCriteriaForm({ evaluation }: Props) {
  const {
    myCriteria,
    getCriteriaForEvaluation,
    getEvaluationCriteria,
    addCriteriumToEvaluation,
    removeCriteriumFromEvaluation,
  } = useEvaluation();

  const [linked, setLinked] = useState<Criterium[]>([]);
  const [evalCriteria, setEvalCriteria] = useState<EvaluationCriterium[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const [linkedList, links] = await Promise.all([
        getCriteriaForEvaluation(evaluation._id),
        getEvaluationCriteria(evaluation._id),
      ]);
      setLinked(linkedList);
      setEvalCriteria(links);
    } finally {
      setIsLoading(false);
    }
  }, [evaluation._id]);

  useEffect(() => { load(); }, [load]);

  const available = useMemo(() => {
    const linkedIds = new Set(linked.map((c) => c._id));
    return myCriteria.filter((c) => !linkedIds.has(c._id));
  }, [myCriteria, linked]);

  const filtered = useMemo(
    () =>
      query.trim()
        ? available.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
        : available,
    [available, query],
  );

  const handleAdd = async (criteriumId: string | undefined) => {
    if (!criteriumId) return;
    try {
      await addCriteriumToEvaluation(evaluation._id, criteriumId);
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo agregar el criterio.");
    }
  };

  const handleRemove = async (criterium: Criterium) => {
    const link = evalCriteria.find((ec) => ec.criterium_id === criterium._id);
    if (!link) return;
    try {
      setRemovingId(criterium._id);
      await removeCriteriumFromEvaluation(link._id);
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudo remover el criterio.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <View className="gap-6">
      <View className="gap-1.5" style={{ zIndex: 10 }}>
        <Label>Agregar criterio</Label>
        <Combobox value={undefined} onValueChange={handleAdd}>
          <ComboboxInput placeholder="Buscar criterio..." filterFn={setQuery} />
          <ComboboxContent>
            <ComboboxList>
              <ComboboxEmpty shown={filtered.length === 0} />
              {filtered.map((c) => (
                <ComboboxItem key={c._id} value={c._id} label={c.name} />
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </View>

      <View className="gap-3">
        <Text className="text-sm text-primary mb-3">CRITERIOS</Text>
        <View className="h-[1px] bg-primary" />
        {isLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator color="#818CF8" />
          </View>
        ) : linked.length === 0 ? (
          <View className="py-8 items-center">
            <Text variant="muted">Sin criterios aún</Text>
          </View>
        ) : (
          linked.map((c, idx) => (
            <View key={c._id}>
              <View className="flex-row items-center gap-3 py-2">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{c.name}</Text>
                  {!!c.description && <Text variant="muted">{c.description}</Text>}
                </View>
                <Button
                  variant="secondary"
                  onPress={() => handleRemove(c)}
                  disabled={removingId === c._id}
                  className="w-[50px] h-[50px] rounded-full p-6 items-center justify-center"
                >
                  {removingId === c._id
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Minus size={15} />
                  }
                </Button>
              </View>
              {idx < linked.length - 1 && <View className="h-px bg-muted" />}
            </View>
          ))
        )}
      </View>
    </View>
  );
}
