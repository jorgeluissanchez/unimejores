import { Button } from "@/core/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/core/components/ui/drawer";
import { Text } from "@/core/components/ui/text";
import { Criterium } from "@/features/evaluation/domain/entities/evaluation";
import { AddCriteriumForm } from "@/features/evaluation/presentation/components/forms/add-criterium-form";
import { EditCriteriumForm } from "@/features/evaluation/presentation/components/forms/edit-criterium-form";
import { useEvaluation } from "@/features/evaluation/presentation/context/evaluation-context";
import { ArrowLeft, SquarePen } from "lucide-react-native";
import React, { useState } from "react";
import { FlatList, View } from "react-native";

type Props = { open: boolean; onClose: () => void };

export function CriteriaDrawer({ open, onClose }: Props) {
  const { myCriteria } = useEvaluation();
  const [editTarget, setEditTarget] = useState<Criterium | null>(null);

  return (
    <>
      <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DrawerContent>
          <DrawerTitle style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>
            Criterios de evaluación
          </DrawerTitle>
          <View className="px-5 pt-4 pb-16" style={{ flex: 1 }}>
            {/* Header */}
            <View className="flex-row items-center mb-6">
              <Button
                variant="secondary"
                onPress={onClose}
                className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center"
              >
                <ArrowLeft size={20} color="#1F265E" />
              </Button>
              <Text variant="h4" className="text-center flex-1">CRITERIOS</Text>
              <View style={{ width: 50 }} />
            </View>

            {/* Add form */}
            <View className="mb-5">
              <AddCriteriumForm onDone={() => {}} />
            </View>

            {/* List */}
            <Text className="text-sm text-primary mb-3">CRITERIOS</Text>
            <View className="h-[1px] bg-primary" />

            <FlatList
              data={myCriteria}
              keyExtractor={(item) => item._id}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 16 }}
              ListEmptyComponent={
                <Text className="text-center text-muted-foreground py-6">Sin criterios aún</Text>
              }
              renderItem={({ item }) => (
                <View>
                  <View className="flex-row items-center py-4">
                    <View className="flex-1">
                      <Text style={{ fontWeight: "700", fontSize: 15, color: "#111827" }}>{item.name}</Text>
                      {!!item.description && (
                        <Text variant="muted" className="text-xs">{item.description}</Text>
                      )}
                    </View>
                    <Button
                      variant="secondary"
                      onPress={() => setEditTarget(item)}
                      className="rounded-full w-[50px] h-[50px] p-6 items-center justify-center"
                    >
                      <SquarePen size={18} color="#1F265E" />
                    </Button>
                  </View>
                  <View className="h-[1px] bg-gray-200" />
                </View>
              )}
            />
          </View>
        </DrawerContent>
      </Drawer>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar criterio</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <EditCriteriumForm
              criterium={editTarget}
              onDone={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
