import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';
import { Text } from './text';

const meta: Meta<typeof Text> = {
  title: 'UI/Text',
  component: Text,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'h1', 'h2', 'h3', 'h4', 'p', 'blockquote', 'code', 'lead', 'large', 'small', 'muted'],
    },
  },
};
export default meta;

type Story = StoryObj<typeof Text>;

export const Default: Story = {
  args: { children: 'Texto por defecto' },
};

export const H1: Story = {
  args: { variant: 'h1', children: 'Título Principal' },
};

export const H2: Story = {
  args: { variant: 'h2', children: 'Subtítulo de sección' },
};

export const H3: Story = {
  args: { variant: 'h3', children: 'Encabezado terciario' },
};

export const H4: Story = {
  args: { variant: 'h4', children: 'Encabezado cuaternario' },
};

export const Paragraph: Story = {
  args: {
    variant: 'p',
    children: 'Este es un párrafo de ejemplo con varias palabras para mostrar el espaciado y la tipografía del componente Text.',
  },
};

export const Blockquote: Story = {
  args: { variant: 'blockquote', children: '"La calidad nunca es un accidente; siempre es el resultado de un esfuerzo inteligente."' },
};

export const Code: Story = {
  args: { variant: 'code', children: 'const greeting = "Hola mundo";' },
};

export const Lead: Story = {
  args: { variant: 'lead', children: 'Texto introductorio destacado para secciones importantes.' },
};

export const Large: Story = {
  args: { variant: 'large', children: 'Texto grande con peso semibold' },
};

export const Small: Story = {
  args: { variant: 'small', children: 'Texto pequeño para metadatos' },
};

export const Muted: Story = {
  args: { variant: 'muted', children: 'Texto atenuado para información secundaria' },
};

export const AllVariants: Story = {
  render: () => (
    <View style={{ gap: 12, padding: 16, maxWidth: 400 }}>
      {(['h1', 'h2', 'h3', 'h4', 'lead', 'large', 'p', 'muted', 'small', 'code', 'blockquote'] as const).map((v) => (
        <Text key={v} variant={v}>{v}: Lorem ipsum dolor sit amet</Text>
      ))}
    </View>
  ),
};
