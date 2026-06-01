import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';
import { Button } from './button';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from './drawer';
import { Text } from './text';

const meta: Meta<typeof Drawer> = {
  title: 'UI/Drawer',
  component: Drawer,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <View style={{ padding: 24 }}><Story /></View>],
};
export default meta;
type Story = StoryObj<typeof Drawer>;

export const Bottom: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button><Text>Abrir drawer (abajo)</Text></Button>
      </DrawerTrigger>
      <DrawerContent side="bottom">
        <DrawerHeader>
          <DrawerTitle>Agregar criterio</DrawerTitle>
          <DrawerDescription>Define un criterio de evaluación para esta categoría.</DrawerDescription>
        </DrawerHeader>
        <View style={{ gap: 12, paddingVertical: 12 }}>
          <Text variant="muted">Nombre del criterio</Text>
          <Text variant="muted">Puntuación máxima</Text>
        </View>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline"><Text>Cancelar</Text></Button>
          </DrawerClose>
          <Button><Text>Guardar</Text></Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const Right: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary"><Text>Panel lateral</Text></Button>
      </DrawerTrigger>
      <DrawerContent side="right">
        <DrawerHeader>
          <DrawerTitle>Filtros</DrawerTitle>
          <DrawerDescription>Aplica filtros a la lista de cursos.</DrawerDescription>
        </DrawerHeader>
        <View style={{ gap: 8, paddingVertical: 12 }}>
          <Text variant="muted">Semestre</Text>
          <Text variant="muted">Estado</Text>
          <Text variant="muted">Rol</Text>
        </View>
        <DrawerFooter>
          <Button><Text>Aplicar</Text></Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};
