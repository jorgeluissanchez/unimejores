import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/core/components/ui/combobox";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Textarea } from "@/core/components/ui/textarea";
import { Evaluation } from "@/features/evaluation/domain/entities/evaluation";
import React, { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { View } from "react-native";

type CategoryOption = { _id: string; name: string };

export type EditEvaluationFormHandle = {
  getValues(): { title: string; description: string; endDate: string; categoryId: string };
};

type Props = {
  evaluation: Evaluation;
  categories: CategoryOption[];
};

export const EditEvaluationForm = forwardRef<EditEvaluationFormHandle, Props>(
  function EditEvaluationForm({ evaluation, categories }, ref) {
    const [title, setTitle] = useState(evaluation.title);
    const [description, setDescription] = useState(evaluation.description ?? "");
    const [endDate, setEndDate] = useState((evaluation.end_date ?? "").split("T")[0]);
    const [categoryId, setCategoryId] = useState(evaluation.category_id);
    const [query, setQuery] = useState("");

    useImperativeHandle(ref, () => ({
      getValues: () => ({ title, description, endDate, categoryId }),
    }), [title, description, endDate, categoryId]);

    const filtered = useMemo(
      () => query.trim()
        ? categories.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
        : categories,
      [categories, query],
    );

    return (
      <View style={{ gap: 16 }}>
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
        <View className="gap-1.5" style={{ zIndex: 10 }}>
          <Label>Categoría</Label>
          <Combobox
            value={categoryId}
            displayValue={categories.find((c) => c._id === categoryId)?.name ?? ""}
            onValueChange={(v) => { if (v) setCategoryId(v); }}
          >
            <ComboboxInput placeholder="Seleccionar categoría..." filterFn={setQuery} />
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
      </View>
    );
  }
);
