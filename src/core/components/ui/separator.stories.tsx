import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';
import { Separator } from './separator';
import { Text } from './text';

const meta: Meta<typeof Separator> = {
  title: 'UI/Separator',
  component: Separator,
  parameters: { layout: 'centered' },
  argTypes: {
    orientation: {
      control: 'radio',
      options: ['horizontal', 'vertical'],
    },
  },
};
export default meta;

type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <View style={{ width: 300, gap: 12, padding: 16 }}>
      <Text variant="large">Sección superior</Text>
      <Separator />
      <Text variant="muted">Contenido debajo del separador</Text>
    </View>
  ),
};

export const Vertical: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, height: 40 }}>
      <Text>Inicio</Text>
      <Separator orientation="vertical" />
      <Text>Cursos</Text>
      <Separator orientation="vertical" />
      <Text>Reportes</Text>
    </View>
  ),
};

export const BetweenCards: Story = {
  render: () => (
    <View style={{ width: 300, gap: 0, padding: 16 }}>
      <Text variant="p">Primer elemento de la lista</Text>
      <Separator />
      <Text variant="p">Segundo elemento de la lista</Text>
      <Separator />
      <Text variant="p">Tercer elemento de la lista</Text>
    </View>
  ),
};
