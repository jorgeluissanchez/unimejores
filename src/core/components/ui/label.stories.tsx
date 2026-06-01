import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';
import { Input } from './input';
import { Label } from './label';

const meta: Meta<typeof Label> = {
  title: 'UI/Label',
  component: Label,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <View style={{ width: 300, padding: 16 }}><Story /></View>],
};
export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  render: () => <Label>Correo electrónico</Label>,
};

export const Disabled: Story = {
  render: () => <Label disabled>Campo deshabilitado</Label>,
};

export const WithInput: Story = {
  render: () => (
    <View style={{ gap: 6 }}>
      <Label>Nombre completo</Label>
      <Input placeholder="Ej: María García" />
    </View>
  ),
};

export const FormGroup: Story = {
  render: () => (
    <View style={{ gap: 14 }}>
      <View style={{ gap: 4 }}>
        <Label>Correo institucional</Label>
        <Input placeholder="usuario@uninorte.edu.co" keyboardType="email-address" />
      </View>
      <View style={{ gap: 4 }}>
        <Label>Contraseña</Label>
        <Input placeholder="Mínimo 6 caracteres" secureTextEntry />
      </View>
    </View>
  ),
};
