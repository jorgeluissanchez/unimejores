import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Separator } from './separator';
import { Text } from './text';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <View style={{ width: 340, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Tarjeta básica</CardTitle>
        <CardDescription>Descripción opcional del contenido.</CardDescription>
      </CardHeader>
      <CardContent>
        <Text>Contenido principal de la tarjeta.</Text>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Ingeniería de Software</CardTitle>
        <CardDescription>NRC 10234 — Diseño y desarrollo de sistemas de calidad.</CardDescription>
      </CardHeader>
      <CardContent>
        <Text variant="muted">2 evaluaciones activas</Text>
      </CardContent>
      <CardFooter>
        <Button className="flex-1">
          <Text>Ver curso</Text>
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const WithSeparator: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Detalle del grupo</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent>
        <View style={{ gap: 8 }}>
          <Text variant="small">Grupo Alpha · 4 miembros</Text>
          <Text variant="muted">Categoría: Proyecto Final</Text>
        </View>
      </CardContent>
    </Card>
  ),
};

export const TitleOnly: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Solo título</CardTitle>
      </CardHeader>
    </Card>
  ),
};

export const ContentOnly: Story = {
  render: () => (
    <Card>
      <CardContent>
        <Text>Contenido sin cabecera ni pie.</Text>
      </CardContent>
    </Card>
  ),
};
