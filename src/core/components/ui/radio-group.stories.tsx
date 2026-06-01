import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Label } from './label';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Text } from './text';

const meta: Meta<typeof RadioGroup> = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('student');
    return (
      <RadioGroup value={value} onValueChange={setValue} style={{ gap: 12 }}>
        {[
          { value: 'student', label: 'Estudiante' },
          { value: 'professor', label: 'Profesor' },
        ].map(({ value: v, label }) => (
          <View key={v} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <RadioGroupItem value={v} aria-labelledby={`label-${v}`} />
            <Label nativeID={`label-${v}`}>{label}</Label>
          </View>
        ))}
      </RadioGroup>
    );
  },
};

export const WithNoneSelected: Story = {
  render: () => (
    <RadioGroup value="" onValueChange={() => {}} style={{ gap: 12 }}>
      {['Opción A', 'Opción B', 'Opción C'].map((label) => (
        <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <RadioGroupItem value={label} />
          <Text>{label}</Text>
        </View>
      ))}
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup value="a" onValueChange={() => {}} style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <RadioGroupItem value="a" disabled />
        <Text>Opción deshabilitada (seleccionada)</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <RadioGroupItem value="b" disabled />
        <Text>Opción deshabilitada</Text>
      </View>
    </RadioGroup>
  ),
};
