import { expect, fn, userEvent, within } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';
import { Button } from './button';
import { Text } from './text';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    disabled: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  render: (args) => (
    <Button {...args}>
      <Text>Iniciar sesión</Text>
    </Button>
  ),
};

/** ✅ Interaction test: verifica que onPress se dispara al hacer clic */
export const Clickable: Story = {
  args: { onPress: fn() },
  render: (args) => <Button {...args}><Text>Haz clic aquí</Text></Button>,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await userEvent.click(button);
    await expect(args.onPress).toHaveBeenCalledTimes(1);
  },
};

/** ✅ Interaction test: el botón disabled NO dispara onPress */
export const DisabledNoFire: Story = {
  args: { onPress: fn(), disabled: true },
  render: (args) => <Button {...args}><Text>No hacer clic</Text></Button>,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button'));
    await expect(args.onPress).not.toHaveBeenCalled();
  },
};

export const Destructive: Story = {
  render: () => (
    <Button variant="destructive">
      <Text>Eliminar cuenta</Text>
    </Button>
  ),
};

export const Outline: Story = {
  render: () => (
    <Button variant="outline">
      <Text>Cancelar</Text>
    </Button>
  ),
};

export const Secondary: Story = {
  render: () => (
    <Button variant="secondary">
      <Text>Ver detalles</Text>
    </Button>
  ),
};

export const Ghost: Story = {
  render: () => (
    <Button variant="ghost">
      <Text>Limpiar</Text>
    </Button>
  ),
};

export const Link: Story = {
  render: () => (
    <Button variant="link">
      <Text>¿Olvidaste tu contraseña?</Text>
    </Button>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Button disabled>
      <Text>Procesando...</Text>
    </Button>
  ),
};

export const SmallSize: Story = {
  render: () => (
    <Button size="sm">
      <Text>Guardar</Text>
    </Button>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <View style={{ gap: 12, padding: 16 }}>
      {(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const).map((v) => (
        <Button key={v} variant={v}>
          <Text>{v}</Text>
        </Button>
      ))}
    </View>
  ),
};
