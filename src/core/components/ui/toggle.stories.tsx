import type { Meta, StoryObj } from '@storybook/react';
import { Bold, Italic, Underline } from 'lucide-react-native';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Icon } from './icon';
import { Text } from './text';
import { Toggle, ToggleIcon } from './toggle';

const meta: Meta<typeof Toggle> = {
  title: 'UI/Toggle',
  component: Toggle,
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
  render: () => {
    const [pressed, setPressed] = useState(false);
    return (
      <Toggle pressed={pressed} onPressedChange={setPressed}>
        <Text>Negrita</Text>
      </Toggle>
    );
  },
};

export const Outline: Story = {
  render: () => {
    const [pressed, setPressed] = useState(false);
    return (
      <Toggle variant="outline" pressed={pressed} onPressedChange={setPressed}>
        <ToggleIcon as={Bold} />
      </Toggle>
    );
  },
};

export const WithIcon: Story = {
  render: () => {
    const [pressed, setPressed] = useState(false);
    return (
      <Toggle pressed={pressed} onPressedChange={setPressed}>
        <Icon as={Italic} size={16} />
        <Text>Itálica</Text>
      </Toggle>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <Toggle pressed={false} onPressedChange={() => {}} disabled>
      <Text>Deshabilitado</Text>
    </Toggle>
  ),
};

export const FormatToolbar: Story = {
  render: () => {
    const [fmt, setFmt] = useState({ bold: false, italic: false, underline: false });
    const toggle = (key: keyof typeof fmt) => setFmt((f) => ({ ...f, [key]: !f[key] }));
    return (
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {([Bold, Italic, Underline] as const).map((LucideIcon, i) => {
          const key = ['bold', 'italic', 'underline'][i] as keyof typeof fmt;
          return (
            <Toggle key={key} variant="outline" pressed={fmt[key]} onPressedChange={() => toggle(key)}>
              <ToggleIcon as={LucideIcon} />
            </Toggle>
          );
        })}
      </View>
    );
  },
};
