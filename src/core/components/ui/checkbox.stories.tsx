import { expect, userEvent, within } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Checkbox } from './checkbox';
import { Label } from './label';
import { Text } from './text';

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Unchecked: Story = {
  render: () => <Checkbox checked={false} onCheckedChange={() => {}} />,
};

export const Checked: Story = {
  render: () => <Checkbox checked onCheckedChange={() => {}} />,
};

export const Disabled: Story = {
  render: () => <Checkbox checked disabled onCheckedChange={() => {}} />,
};

export const WithLabel: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Checkbox checked={checked} onCheckedChange={setChecked} />
        <Label onPress={() => setChecked((v) => !v)}>
          Acepto los términos y condiciones
        </Label>
      </View>
    );
  },
};

export const List: Story = {
  render: () => {
    const items = ['Participación activa', 'Comunicación efectiva', 'Calidad del trabajo', 'Puntualidad'];
    const [selected, setSelected] = useState<string[]>([]);
    const toggle = (item: string) =>
      setSelected((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);
    return (
      <View style={{ gap: 12, minWidth: 260 }}>
        {items.map((item) => (
          <View key={item} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Checkbox checked={selected.includes(item)} onCheckedChange={() => toggle(item)} />
            <Text onPress={() => toggle(item)}>{item}</Text>
          </View>
        ))}
      </View>
    );
  },
};

/** ✅ Interaction test: clic alterna el estado checked */
export const ToggleInteraction: Story = {
  name: '🧪 Toggle: clic alterna checked',
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Checkbox checked={checked} onCheckedChange={setChecked} />
        <Text>{checked ? 'Seleccionado' : 'Sin seleccionar'}</Text>
      </View>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Estado inicial: sin seleccionar
    await expect(canvas.getByText('Sin seleccionar')).toBeInTheDocument();
    // Primer clic: activa
    await userEvent.click(canvas.getByRole('checkbox'));
    await expect(canvas.getByText('Seleccionado')).toBeInTheDocument();
    // Segundo clic: desactiva
    await userEvent.click(canvas.getByRole('checkbox'));
    await expect(canvas.getByText('Sin seleccionar')).toBeInTheDocument();
  },
};
