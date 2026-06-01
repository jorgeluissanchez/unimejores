import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Label } from './label';
import { Text } from './text';
import { Textarea } from './textarea';

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <View style={{ width: 320, padding: 16 }}><Story /></View>],
};
export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: { placeholder: 'Escribe un comentario...' },
};

export const WithValue: Story = {
  args: {
    value: 'El compañero participó activamente y demostró dominio del tema durante las sesiones de trabajo grupal.',
  },
};

export const Disabled: Story = {
  args: { placeholder: 'Campo deshabilitado', editable: false },
};

export const WithLabel: Story = {
  render: () => (
    <View style={{ gap: 6 }}>
      <Label>Observaciones (opcional)</Label>
      <Textarea placeholder="Agrega comentarios sobre el desempeño de tu compañero..." />
    </View>
  ),
};

export const WithCharacterCount: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const max = 300;
    return (
      <View style={{ gap: 4 }}>
        <Textarea
          value={value}
          onChangeText={setValue}
          placeholder="Comentario..."
          maxLength={max}
        />
        <Text variant="muted" style={{ textAlign: 'right' }}>{value.length}/{max}</Text>
      </View>
    );
  },
};
