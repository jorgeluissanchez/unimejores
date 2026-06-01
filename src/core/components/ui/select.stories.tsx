import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, type Option } from './select';

const ROLES: Option[] = [
  { value: 'student', label: 'Estudiante' },
  { value: 'professor', label: 'Profesor' },
  { value: 'admin', label: 'Administrador' },
];

const COURSES: Option[] = [
  { value: 'sis', label: 'Ingeniería de Software' },
  { value: 'net', label: 'Redes de Computadores' },
  { value: 'db', label: 'Bases de Datos' },
  { value: 'ai', label: 'Inteligencia Artificial' },
];

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <View style={{ width: 320, padding: 16 }}><Story /></View>],
};
export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<Option | undefined>(undefined);
    return (
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona un rol..." />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => <SelectItem key={r.value} value={r.value} label={r.label} />)}
        </SelectContent>
      </Select>
    );
  },
};

export const WithLabel: Story = {
  render: () => {
    const [value, setValue] = useState<Option | undefined>(undefined);
    return (
      <View style={{ gap: 6 }}>
        <Label>Curso</Label>
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger>
            <SelectValue placeholder="Elige un curso..." />
          </SelectTrigger>
          <SelectContent>
            {COURSES.map((c) => <SelectItem key={c.value} value={c.value} label={c.label} />)}
          </SelectContent>
        </Select>
      </View>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <Select value={undefined} onValueChange={() => {}}>
      <SelectTrigger disabled>
        <SelectValue placeholder="Campo deshabilitado" />
      </SelectTrigger>
    </Select>
  ),
};
