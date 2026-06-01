import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { View } from 'react-native';
import { Button } from './button';
import { Text } from './text';
import { ToastProvider, useToast } from './toast';

const meta: Meta<typeof ToastProvider> = {
  title: 'UI/Toast',
  component: ToastProvider,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <ToastProvider>
        <View style={{ padding: 24, gap: 12 }}>
          <Story />
        </View>
      </ToastProvider>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof ToastProvider>;

function ToastDemo() {
  const { show } = useToast();
  return (
    <View style={{ gap: 12 }}>
      <Button onPress={() => show({ title: 'Éxito', description: 'Evaluación enviada correctamente.' })}>
        <Text>Toast por defecto</Text>
      </Button>
      <Button
        variant="destructive"
        onPress={() => show({ title: 'Error', description: 'No se pudo guardar la evaluación.', variant: 'destructive' })}
      >
        <Text>Toast de error</Text>
      </Button>
      <Button
        variant="outline"
        onPress={() => show({ title: 'Guardado', description: 'Los cambios se han guardado.', duration: 5000 })}
      >
        <Text>Toast largo (5s)</Text>
      </Button>
    </View>
  );
}

export const Default: Story = {
  render: () => <ToastDemo />,
};
