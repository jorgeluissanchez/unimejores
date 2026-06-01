import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';
import { Text } from './text';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <View style={{ width: 360, padding: 16 }}><Story /></View>],
};
export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="evaluaciones">
      <TabsList>
        <TabsTrigger value="evaluaciones"><Text>Evaluaciones</Text></TabsTrigger>
        <TabsTrigger value="categorias"><Text>Categorías</Text></TabsTrigger>
      </TabsList>
      <TabsContent value="evaluaciones">
        <Text variant="p">Lista de evaluaciones activas para este curso.</Text>
      </TabsContent>
      <TabsContent value="categorias">
        <Text variant="p">Lista de categorías configuradas por el profesor.</Text>
      </TabsContent>
    </Tabs>
  ),
};

export const ThreeTabs: Story = {
  render: () => (
    <Tabs defaultValue="home">
      <TabsList>
        <TabsTrigger value="home"><Text>Inicio</Text></TabsTrigger>
        <TabsTrigger value="reports"><Text>Reportes</Text></TabsTrigger>
        <TabsTrigger value="settings"><Text>Ajustes</Text></TabsTrigger>
      </TabsList>
      <TabsContent value="home"><Text variant="muted">Pantalla de inicio</Text></TabsContent>
      <TabsContent value="reports"><Text variant="muted">Pantalla de reportes</Text></TabsContent>
      <TabsContent value="settings"><Text variant="muted">Pantalla de ajustes</Text></TabsContent>
    </Tabs>
  ),
};

export const WithDisabled: Story = {
  render: () => (
    <Tabs defaultValue="active">
      <TabsList>
        <TabsTrigger value="active"><Text>Activo</Text></TabsTrigger>
        <TabsTrigger value="disabled" disabled><Text>Deshabilitado</Text></TabsTrigger>
      </TabsList>
      <TabsContent value="active"><Text variant="muted">Contenido activo</Text></TabsContent>
    </Tabs>
  ),
};
