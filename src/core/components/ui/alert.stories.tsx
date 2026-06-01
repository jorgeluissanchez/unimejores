import type { Meta, StoryObj } from '@storybook/react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { Alert, AlertDescription, AlertTitle } from './alert';

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <View style={{ width: 360, padding: 16, gap: 12 }}><Story /></View>],
};
export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  render: () => (
    <Alert icon={Info}>
      <AlertTitle>Información</AlertTitle>
      <AlertDescription>La evaluación estará disponible hasta el viernes.</AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Alert icon={AlertCircle} variant="destructive">
      <AlertTitle>Error de sesión</AlertTitle>
      <AlertDescription>Tu sesión ha expirado. Por favor inicia sesión de nuevo.</AlertDescription>
    </Alert>
  ),
};

export const Success: Story = {
  render: () => (
    <Alert icon={CheckCircle2}>
      <AlertTitle>Evaluación enviada</AlertTitle>
      <AlertDescription>Tu evaluación fue registrada exitosamente.</AlertDescription>
    </Alert>
  ),
};

export const Warning: Story = {
  render: () => (
    <Alert icon={TriangleAlert}>
      <AlertTitle>Pendiente</AlertTitle>
      <AlertDescription>Tienes 2 evaluaciones de pares sin completar.</AlertDescription>
    </Alert>
  ),
};

export const TitleOnly: Story = {
  render: () => (
    <Alert icon={Info}>
      <AlertTitle>Solo título, sin descripción</AlertTitle>
    </Alert>
  ),
};
