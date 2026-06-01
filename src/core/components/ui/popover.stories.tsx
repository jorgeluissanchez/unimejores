import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Text } from './text';

const meta: Meta<typeof Popover> = {
  title: 'UI/Popover',
  component: Popover,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <View style={{ padding: 48 }}><Story /></View>],
};
export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline"><Text>Ver detalles</Text></Button>
      </PopoverTrigger>
      <PopoverContent>
        <Text variant="large">Grupo Alpha</Text>
        <Text variant="muted">4 miembros · Categoría: Proyecto Final</Text>
        <Text variant="muted">Estado: evaluación activa</Text>
      </PopoverContent>
    </Popover>
  ),
};

export const Info: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon"><Text>?</Text></Button>
      </PopoverTrigger>
      <PopoverContent>
        <Text variant="small">La puntuación máxima por criterio es 5 puntos. El promedio de todas las evaluaciones recibidas determina la nota final.</Text>
      </PopoverContent>
    </Popover>
  ),
};
