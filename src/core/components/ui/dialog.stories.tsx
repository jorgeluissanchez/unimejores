import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';
import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from './dialog';
import { Input } from './input';
import { Label } from './label';
import { Text } from './text';

const meta: Meta<typeof Dialog> = {
  title: 'UI/Dialog',
  component: Dialog,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <View style={{ padding: 24 }}><Story /></View>],
};
export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button><Text>Abrir diálogo</Text></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear nueva categoría</DialogTitle>
          <DialogDescription>Agrega una categoría para agrupar las evaluaciones del curso.</DialogDescription>
        </DialogHeader>
        <View style={{ gap: 12, marginTop: 8 }}>
          <View style={{ gap: 4 }}>
            <Label>Nombre</Label>
            <Input placeholder="Ej: Proyecto Final" />
          </View>
          <View style={{ gap: 4 }}>
            <Label>Descripción</Label>
            <Input placeholder="Descripción opcional" />
          </View>
        </View>
        <DialogFooter style={{ marginTop: 8 }}>
          <DialogClose asChild>
            <Button variant="outline"><Text>Cancelar</Text></Button>
          </DialogClose>
          <Button><Text>Crear</Text></Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const WithClose: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary"><Text>Detalles del grupo</Text></Button>
      </DialogTrigger>
      <DialogContent showClose>
        <DialogHeader>
          <DialogTitle>Grupo Alpha</DialogTitle>
          <DialogDescription>Categoría: Proyecto Final · 4 miembros</DialogDescription>
        </DialogHeader>
        <Text variant="muted">Los miembros han completado 2 de 4 evaluaciones.</Text>
      </DialogContent>
    </Dialog>
  ),
};
