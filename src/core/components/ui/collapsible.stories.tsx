import type { Meta, StoryObj } from '@storybook/react';
import { ChevronDown } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from './icon';
import { Text } from './text';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';

const meta: Meta<typeof Collapsible> = {
  title: 'UI/Collapsible',
  component: Collapsible,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <View style={{ width: 320, padding: 16 }}><Story /></View>],
};
export default meta;
type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Pressable style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
            <Text variant="large">Criterios de evaluación</Text>
            <Icon as={ChevronDown} size={16} className={open ? 'rotate-180' : ''} />
          </Pressable>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <View style={{ gap: 8, paddingBottom: 12 }}>
            {['Participación activa', 'Comunicación efectiva', 'Calidad del trabajo', 'Puntualidad'].map((c) => (
              <Text key={c} variant="muted">• {c}</Text>
            ))}
          </View>
        </CollapsibleContent>
      </Collapsible>
    );
  },
};

export const OpenByDefault: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Pressable style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
            <Text variant="large">Abierto por defecto</Text>
            <Icon as={ChevronDown} size={16} />
          </Pressable>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Text variant="muted">Este panel comienza expandido.</Text>
        </CollapsibleContent>
      </Collapsible>
    );
  },
};
