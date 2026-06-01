import { expect, userEvent, within } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Input } from './input';
import { Text } from './text';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <View style={{ width: 320, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: 'Escribe algo...' },
};

export const WithValue: Story = {
  args: { value: 'usuario@uninorte.edu.co', placeholder: 'Correo' },
};

export const Email: Story = {
  args: {
    placeholder: 'Correo electrónico',
    keyboardType: 'email-address',
    autoCapitalize: 'none',
  },
};

export const Password: Story = {
  args: {
    placeholder: 'Contraseña',
    secureTextEntry: true,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Campo deshabilitado',
    editable: false,
    value: 'No editable',
  },
};

export const WithError: Story = {
  args: {
    placeholder: 'Correo',
    className: 'border-2 border-destructive',
  },
  render: (args) => (
    <View style={{ gap: 4 }}>
      <Input {...args} />
      <Text variant="small" className="text-destructive px-1">
        Ingresa un correo válido
      </Text>
    </View>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <View style={{ gap: 8 }}>
        <Input
          value={value}
          onChangeText={setValue}
          placeholder="Escribe para ver el contador..."
        />
        <Text variant="muted">{value.length} caracteres</Text>
      </View>
    );
  },
};

/** ✅ Interaction test: escribe texto y verifica el valor resultante */
export const TypingInteraction: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return <Input value={value} onChangeText={setValue} placeholder="Correo" />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText('Correo');
    await userEvent.clear(input);
    await userEvent.type(input, 'usuario@uninorte.edu.co');
    await expect(input).toHaveValue('usuario@uninorte.edu.co');
  },
};

/** ✅ Interaction test: input deshabilitado no acepta texto */
export const DisabledInteraction: Story = {
  args: { editable: false, placeholder: 'No editable', value: '' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText('No editable');
    await expect(input).toBeDisabled();
  },
};
