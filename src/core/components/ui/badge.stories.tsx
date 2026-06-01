import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';
import { Badge } from './badge';
import { Text } from './text';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
  },
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  render: () => (
    <Badge>
      <Text>Activo</Text>
    </Badge>
  ),
};

export const Secondary: Story = {
  render: () => (
    <Badge variant="secondary">
      <Text>Pendiente</Text>
    </Badge>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Badge variant="destructive">
      <Text>Vencido</Text>
    </Badge>
  ),
};

export const Outline: Story = {
  render: () => (
    <Badge variant="outline">
      <Text>Borrador</Text>
    </Badge>
  ),
};

export const WithNumber: Story = {
  render: () => (
    <Badge>
      <Text>3 pendientes</Text>
    </Badge>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', padding: 16 }}>
      {(['default', 'secondary', 'destructive', 'outline'] as const).map((v) => (
        <Badge key={v} variant={v}>
          <Text>{v}</Text>
        </Badge>
      ))}
    </View>
  ),
};
