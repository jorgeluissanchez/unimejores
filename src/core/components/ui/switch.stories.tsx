import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Label } from './label';
import { Switch } from './switch';
import { Text } from './text';

const meta: Meta<typeof Switch> = {
  title: 'UI/Switch',
  component: Switch,
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof Switch>;

export const Off: Story = {
  render: () => <Switch checked={false} onCheckedChange={() => {}} />,
};

export const On: Story = {
  render: () => <Switch checked onCheckedChange={() => {}} />,
};

export const Disabled: Story = {
  render: () => <Switch checked={false} disabled onCheckedChange={() => {}} />,
};

export const WithLabel: Story = {
  render: () => {
    const [on, setOn] = useState(false);
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Switch checked={on} onCheckedChange={setOn} />
        <Label>Notificaciones activas</Label>
      </View>
    );
  },
};

export const SettingsList: Story = {
  render: () => {
    const [settings, setSettings] = useState({
      notifications: true,
      darkMode: false,
      autoSave: true,
    });
    const toggle = (key: keyof typeof settings) =>
      setSettings((s) => ({ ...s, [key]: !s[key] }));
    return (
      <View style={{ gap: 16, minWidth: 280 }}>
        {(Object.keys(settings) as Array<keyof typeof settings>).map((key) => (
          <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text>{key === 'notifications' ? 'Notificaciones' : key === 'darkMode' ? 'Modo oscuro' : 'Guardado automático'}</Text>
            <Switch checked={settings[key]} onCheckedChange={() => toggle(key)} />
          </View>
        ))}
      </View>
    );
  },
};
